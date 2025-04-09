import { createContext, useState, useEffect, ReactNode } from "react";
import io from 'socket.io-client';
import { SOCKET_URL } from "../config/api";

export interface PatientData {
  it?: Record<string, any>;
  ent?: Record<string, any>;
  vision?: Record<string, any>;
  general?: Record<string, any>;
  dental?: Record<string, any>;
  patientId?: string;
  timestamp?: number;
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
      console.log('Connected to WebSocket server');
    });

    // Listen for new patient IDs
    newSocket.on('newPatientId', (data: string | { patientId: string }) => {
      console.log('Received new patient ID:', data);
      const newId = typeof data === 'string' ? data : data.patientId;
      
      setPatientData(prev => ({
        ...prev,
        patientId: newId,
        timestamp: Date.now()
      }));
    });

    // Add new listener for department updates
    newSocket.on('departmentUpdate', (updatedData: PatientData) => {
      console.log('Received department update:', updatedData);
      setPatientData(prev => {
        const result = { ...prev, timestamp: Date.now() };
        
        // Merge changes for each department rather than replacing
        Object.entries(updatedData).forEach(([dept, data]) => {
          if (data === undefined) {
            // If the department data is undefined, it means it was reset
            result[dept as keyof PatientData] = undefined;
          } else {
            // Ensure we're working with objects
            const prevDeptData = prev[dept as keyof PatientData] || {};
            const updatedDeptData = data || {};
            
            // Merge the new department data with existing data
            result[dept as keyof PatientData] = {
              ...(typeof prevDeptData === 'object' ? prevDeptData : {}),
              ...(typeof updatedDeptData === 'object' ? updatedDeptData : {})
            };
            
            console.log(`Updated ${dept} data:`, result[dept as keyof PatientData]);
          }
        });
        
        return result;
      });
    });

    // Listen specifically for photo updates
    newSocket.on('photoUpdate', (photoData: { photo: string, photoFileName: string }) => {
      console.log('Received photo update');
      setPatientData(prev => {
        // Only update if we have IT data already or create a new IT object
        const currentIT = prev.it || {};
        return {
          ...prev,
          it: {
            ...currentIT,
            photo: photoData.photo,
            photoFileName: photoData.photoFileName
          },
          timestamp: Date.now()
        };
      });
    });

    // Listen for photo deletion events
    newSocket.on('photoDelete', () => {
      console.log('Received photo deletion event');
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
      console.log('Received reset signal');
      setPatientData({});
      localStorage.removeItem('patientData');
      
      // Dispatch a custom event that all components can listen for
      const resetEvent = new CustomEvent('patientDataReset');
      window.dispatchEvent(resetEvent);
    });

    newSocket.on('connect_error', (error: Error) => {
      console.error('WebSocket connection error:', error);
    });

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []); // Empty dependency array to run once

  const updateDepartment = (dept: keyof PatientData, data: Record<string, any>) => {
    console.log('Updating department:', dept, data); // Debug log
    
    // Merge new data with existing department data instead of replacing
    const updatedDeptData = {
      ...(patientData[dept] || {}),
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
      console.log('Broadcasting department update'); // Debug log
      
      // If this update contains a photo property, handle it separately
      if (dept === 'it' && data.photo !== undefined) {
        // Send the photo update
        socket.emit('photoUpdate', { 
          photo: data.photo, 
          photoFileName: data.photoFileName || 'photo.jpg' 
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
        console.log('Emitting department reset for:', department);
        socket.emit('departmentUpdate', { [department]: undefined });
      } else {
        console.warn('Socket not connected when trying to reset department:', department);
      }
    } else {
      // Full reset - clear everything
      setPatientData({});
      localStorage.removeItem("patientData");
      
      // Clear file input on full reset
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      if (socket?.connected) {
        console.log('Emitting full reset to all connected clients');
        socket.emit('resetPatientData');
        
        // Force dispatch the event locally to ensure it happens
        console.log('Dispatching patientDataReset event locally');
        const resetEvent = new CustomEvent('patientDataReset');
        window.dispatchEvent(resetEvent);
      } else {
        console.warn('Socket not connected when trying to perform full reset');
        // Still dispatch the event locally even if socket is disconnected
        console.log('Dispatching patientDataReset event locally despite socket disconnect');
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