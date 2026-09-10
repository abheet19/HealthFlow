import { createContext, useState, useEffect, ReactNode } from "react";
import io from 'socket.io-client';
import { getWorkspaceCredentials, SOCKET_URL } from "../config/api";

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

// Connection state for the shared Socket.IO connection, surfaced so
// dashboards can tell apart three visually distinct situations: still
// connecting to the realtime server, connected but genuinely waiting on data
// (e.g. no patient ID yet), and a connection that's failing/retrying.
export type ConnectionStatus = 'connecting' | 'connected' | 'error';

interface PatientContextProps {
  patientData: PatientData;
  updateDepartment: (dept: keyof PatientData, data: Record<string, any>) => void;
  resetPatientData: (department?: keyof PatientData) => void;
  updatePatientId: (id: string) => void;
  resetDepartmentData: () => void;
  connectionStatus: ConnectionStatus;
}

export const PatientContext = createContext<PatientContextProps>({
  patientData: {},
  updateDepartment: () => {},
  resetPatientData: () => {},
  updatePatientId: () => {},
  resetDepartmentData: () => {},
  connectionStatus: 'connecting'
});

export const PatientProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state from localStorage first
  const [patientData, setPatientData] = useState<PatientData>(() => {
    localStorage.removeItem('patientData');
    try { return JSON.parse(sessionStorage.getItem('patientData') || '{}'); }
    catch { return {}; }
  });
  const [socket, setSocket] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');

  // Save to localStorage whenever patientData changes
  useEffect(() => {
    sessionStorage.setItem('patientData', JSON.stringify(patientData));
  }, [patientData]);

  // WebSocket initialization
  useEffect(() => {
    const credentials = getWorkspaceCredentials();
    const newSocket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      transports: ['websocket'],
      auth: credentials,
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnectionStatus('connected');
    });

    newSocket.on('disconnect', () => {
      setConnectionStatus('connecting');
    });

    newSocket.on('reconnect_failed', () => {
      setConnectionStatus('error');
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
          
          if (data === undefined || data === null) {
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
        sessionStorage.setItem('patientData', JSON.stringify(updatedData));
        
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
      sessionStorage.removeItem('patientData');
      
      // Dispatch a custom event that all components can listen for
      const resetEvent = new CustomEvent('patientDataReset');
      window.dispatchEvent(resetEvent);
    });

    newSocket.on('connect_error', (error: Error) => {
      // Logged (not surfaced via toast): ToastProvider is mounted as a
      // child of PatientProvider, so this context has no toast access.
      console.warn('Socket connection error:', error.message);
      setConnectionStatus('error');
    });

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []); // Empty dependency array to run once

  // Enhanced updateDepartment with special handling for dental data
  const updateDepartment = (dept: keyof PatientData, data: Record<string, any>) => {
    setPatientData(prev => ({
      ...prev,
      [dept]: { ...(typeof prev[dept] === "object" ? prev[dept] : {}), ...data },
      timestamp: Date.now(),
    }));
    if (socket?.connected) {
      if (dept === 'it' && Object.prototype.hasOwnProperty.call(data, 'photo')) {
        if (data.photo) socket.emit('photoUpdate', { photo: data.photo, photoFileName: data.photoFileName });
        else socket.emit('photoDelete');
        const fields = { ...data };
        delete fields.photo;
        delete fields.photoFileName;
        if (Object.keys(fields).length) socket.emit('departmentUpdate', { [dept]: fields });
      } else socket.emit('departmentUpdate', { [dept]: data });
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
        ent: null,
        vision: null,
        general: null,
        dental: null
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
        socket.emit('departmentUpdate', { [department]: null });
      }
    } else {
      // Full reset - clear everything
      setPatientData({});
      sessionStorage.removeItem("patientData");
      
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
        resetDepartmentData,
        connectionStatus
      }}
    >
      {children}
    </PatientContext.Provider>
  );
};
