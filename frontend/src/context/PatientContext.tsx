import { createContext, useState, useEffect, ReactNode } from "react";
import io from 'socket.io-client';
import { SOCKET_URL } from "../config/api";

// Define dental data structure
interface DentalData {
  tooth_cavity_permanent?: any;
  tooth_cavity_primary?: any;
  isSubmitted?: boolean;
  [key: string]: any;
}

// Define department data types
type DepartmentData = {
  isSubmitted?: boolean;
  [key: string]: any;
}

// Define valid department names as a union type
type DepartmentName = 'it' | 'ent' | 'vision' | 'general' | 'dental' | 'patientId' | 'timestamp';

export interface PatientData {
  it?: DepartmentData;
  ent?: DepartmentData;
  vision?: DepartmentData;
  general?: DepartmentData;
  dental?: DentalData;
  patientId?: string;
  timestamp?: number;
  [key: string]: DepartmentData | DentalData | string | number | undefined;
}

// Helper type for type safety in updating patient data
type PatientDataUpdate = {
  [K in DepartmentName]?: K extends 'dental' 
    ? DentalData 
    : K extends 'patientId' 
      ? string 
      : K extends 'timestamp' 
        ? number 
        : DepartmentData;
}

interface PatientContextProps {
  patientData: PatientData;
  updateDepartment: (dept: keyof PatientData, data: Record<string, any>) => void;
  resetPatientData: (department?: keyof PatientData) => void;
  updatePatientId: (id: string) => void;
  resetDepartmentData: () => void;
}

export const PatientContext = createContext<PatientContextProps>({
  patientData: {},
  updateDepartment: () => {},
  resetPatientData: () => {},
  updatePatientId: () => {},
  resetDepartmentData: () => {}
});

export const PatientProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state from localStorage first
  const [patientData, setPatientData] = useState<PatientData>(() => {
    const savedData = localStorage.getItem('patientData');
    return savedData ? JSON.parse(savedData) : {};
  });
  const [socket, setSocket] = useState<any>(null);

  // Save to localStorage whenever patientData changes
  useEffect(() => {
    localStorage.setItem('patientData', JSON.stringify(patientData));
  }, [patientData]);

  // WebSocket initialization
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      transports: ['websocket']  // Force WebSocket transport
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      // Connected to WebSocket server
    });

    // Listen for new patient IDs
    newSocket.on('newPatientId', (data: string | { patientId: string }) => {
      const newId = typeof data === 'string' ? data : data.patientId;
      
      setPatientData(prev => ({
        ...prev,
        patientId: newId,
        timestamp: Date.now()
      }));
    });

    // Enhanced departmentUpdate listener with special handling for tooth data
    newSocket.on('departmentUpdate', (updatedData: PatientData) => {
      setPatientData(prev => {
        const result: PatientDataUpdate = { ...prev, timestamp: Date.now() };
        
        // Merge changes for each department rather than replacing
        Object.entries(updatedData).forEach(([dept, data]) => {
          const deptKey = dept as DepartmentName;
          
          if (data === undefined) {
            // If the department data is undefined, it means it was reset
            result[deptKey] = undefined;
          } else {
            // Ensure we're working with objects
            const prevDeptData = prev[deptKey] || {};
            const updatedDeptData = data as DepartmentData;
            
            // Special handling for dental department tooth data
            if (deptKey === 'dental' && 
                ('tooth_cavity_permanent' in updatedDeptData || 
                 'tooth_cavity_primary' in updatedDeptData)) {
              
              // Create a deep copy to avoid reference issues
              const mergedDentalData: DentalData = {
                ...(typeof prevDeptData === 'object' ? prevDeptData as DentalData : {}),
              };
              
              // Handle permanent teeth data - prioritize incoming updates
              if ('tooth_cavity_permanent' in updatedDeptData) {
                mergedDentalData.tooth_cavity_permanent = updatedDeptData.tooth_cavity_permanent;
              }
              
              // Handle primary teeth data - prioritize incoming updates
              if ('tooth_cavity_primary' in updatedDeptData) {
                mergedDentalData.tooth_cavity_primary = updatedDeptData.tooth_cavity_primary;
              }
              
              // Add all other dental properties
              Object.entries(updatedDeptData).forEach(([key, value]) => {
                if (key !== 'tooth_cavity_permanent' && key !== 'tooth_cavity_primary') {
                  mergedDentalData[key] = value;
                }
              });
              
              result[deptKey] = mergedDentalData as any;
            } else {
              // Standard merge for other departments or dental fields
              result[deptKey] = {
                ...(typeof prevDeptData === 'object' ? prevDeptData as Record<string, any> : {}),
                ...(typeof updatedDeptData === 'object' ? updatedDeptData : {})
              } as any;
            }
          }
        });
        
        return result as PatientData;
      });
    });

    // Listen specifically for photo updates
    newSocket.on('photoUpdate', (photoData: { photo: string, photoFileName: string }) => {
      console.log('Received photo update via socket:', photoData.photoFileName);
      
      setPatientData(prev => {
        // Only update if we have IT data already or create a new IT object
        const currentIT = prev.it || {};
        
        // Create a new patient data object with updated photo
        const updatedData = {
          ...prev,
          it: {
            ...currentIT,
            photo: photoData.photo,
            photoFileName: photoData.photoFileName
          },
          timestamp: Date.now()
        };
        
        // Save to localStorage for persistence
        localStorage.setItem('patientData', JSON.stringify(updatedData));
        
        console.log('Photo updated in patient context');
        return updatedData;
      });
    });

    // Listen for photo deletion events
    newSocket.on('photoDelete', () => {
      setPatientData(prev => {
        // Only update if we have IT data
        if (!prev.it) return prev;
        
        // Create a new IT object without the photo properties
        const updatedIT = { ...prev.it };
        delete updatedIT.photo;
        delete updatedIT.photoFileName;
        
        return {
          ...prev,
          it: updatedIT,
          timestamp: Date.now()
        };
      });
    });

    // Add new listener for reset event
    newSocket.on('resetPatientData', () => {
      setPatientData({});
      localStorage.removeItem('patientData');
      
      // Dispatch a custom event that all components can listen for
      const resetEvent = new CustomEvent('patientDataReset');
      window.dispatchEvent(resetEvent);
    });

    newSocket.on('connect_error', (error: Error) => {
      // Connection error handling silently
    });

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []); // Empty dependency array to run once

  // Enhanced updateDepartment with special handling for dental data
  const updateDepartment = (dept: keyof PatientData, data: Record<string, any>) => {
    // Special handling for dental department to ensure teeth data is properly handled
    if (dept === 'dental' && (data.tooth_cavity_permanent !== undefined || data.tooth_cavity_primary !== undefined)) {
      // Get current dental data or empty object
      const currentDental = (patientData[dept] || {}) as DentalData;
      
      // Create a new dental object with proper merging of teeth data
      const updatedDentalData = { ...currentDental };
      
      // Update permanent teeth only if present in new data
      if (data.tooth_cavity_permanent !== undefined) {
        updatedDentalData.tooth_cavity_permanent = data.tooth_cavity_permanent;
      }
      
      // Update primary teeth only if present in new data
      if (data.tooth_cavity_primary !== undefined) {
        updatedDentalData.tooth_cavity_primary = data.tooth_cavity_primary;
      }
      
      // Add all other dental properties
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'tooth_cavity_permanent' && key !== 'tooth_cavity_primary') {
          updatedDentalData[key] = value;
        }
      });
      
      const updatedData: PatientData = {
        ...patientData,
        [dept]: updatedDentalData,
        timestamp: Date.now()
      };
      
      setPatientData(updatedData);
      localStorage.setItem('patientData', JSON.stringify(updatedData));
      
      // Broadcast dental update to all clients
      if (socket?.connected) {
        socket.emit('departmentUpdate', { [dept]: updatedDentalData });
      }
    } else {
      // Standard handling for other departments
      // Merge new data with existing department data instead of replacing
      const updatedDeptData = {
        ...((typeof patientData[dept] === 'object') ? patientData[dept] as Record<string, any> : {}),
        ...data
      };
      
      const updatedData = {
        ...patientData,
        [dept]: updatedDeptData,
        timestamp: Date.now()
      };
      
      setPatientData(updatedData);
      localStorage.setItem('patientData', JSON.stringify(updatedData));
      
      // Broadcast department update to all clients
      if (socket?.connected) {
        // If this update contains a photo property, handle it separately
        if (dept === 'it' && data.photo !== undefined) {
          console.log('Sending photo update to server via socket');
          
          // Send the photo update
          socket.emit('photoUpdate', { 
            photo: data.photo, 
            photoFileName: data.photoFileName || `photo_${new Date().getTime()}.jpg` 
          });
          
          // ALSO send the other updated fields (excluding photo) to keep fields in sync
          const nonPhotoData = { ...data };
          delete nonPhotoData.photo;
          delete nonPhotoData.photoFileName;
          
          // Only emit non-photo fields if there are any
          if (Object.keys(nonPhotoData).length > 0) {
            socket.emit('departmentUpdate', { [dept]: nonPhotoData });
          }
        } else if (dept === 'it' && data.photo === undefined && patientData.it?.photo) {
          // If the photo was removed, broadcast deletion to all clients
          socket.emit('photoDelete');
          
          // Also send any other updated fields
          socket.emit('departmentUpdate', { [dept]: { ...data } });
        } else {
          // Normal updates (no photo involved)
          socket.emit('departmentUpdate', { [dept]: { ...data } });
        }
      }
    }
  };

  const resetDepartmentData = () => {
    // Clear all department data while keeping patientId and IT data
    setPatientData(prev => ({
      patientId: prev.patientId,
      it: prev.it,
      ent: undefined,
      vision: undefined,
      general: undefined,
      dental: undefined,
      timestamp: Date.now()
    }));

    // Broadcast the reset to all clients
    if (socket?.connected) {
      socket.emit('departmentUpdate', {
        ent: undefined,
        vision: undefined,
        general: undefined,
        dental: undefined
      });
    }
  };

  const updatePatientId = (id: string) => {
    if (socket?.connected) {
      socket.emit('newPatientId', id);
    }
    
    // Reset all department data while preserving only the new patient ID
    setPatientData({
      patientId: id,
      timestamp: Date.now()
    });
  };

  const resetPatientData = (department?: keyof PatientData) => {
    if (department) {
      // Department-specific reset
      setPatientData(prev => ({
        ...prev,
        [department]: undefined,
      }));
      
      // Clear file input if resetting IT department
      if (department === 'it') {
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
      
      if (socket?.connected) {
        socket.emit('departmentUpdate', { [department]: undefined });
      }
    } else {
      // Full reset - clear everything
      setPatientData({});
      localStorage.removeItem("patientData");
      
      // Clear file input on full reset
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      if (socket?.connected) {
        socket.emit('resetPatientData');
        
        // Force dispatch the event locally to ensure it happens
        const resetEvent = new CustomEvent('patientDataReset');
        window.dispatchEvent(resetEvent);
      } else {
        // Still dispatch the event locally even if socket is disconnected
        const resetEvent = new CustomEvent('patientDataReset');
        window.dispatchEvent(resetEvent);
      }
    }
  };

  return (
    <PatientContext.Provider 
      value={{ 
        patientData, 
        updateDepartment, 
        resetPatientData, 
        updatePatientId,
        resetDepartmentData
      }}
    >
      {children}
    </PatientContext.Provider>
  );
};