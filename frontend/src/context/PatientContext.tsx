import { createContext, useState, useEffect, ReactNode } from "react";
import io from 'socket.io-client';

export interface PatientData {
  it?: Record<string, any>;
  ent?: Record<string, any>;
  vision?: Record<string, any>;
  general?: Record<string, any>;
  dental?: Record<string, any>;
  patientId?: string;
}

interface PatientContextProps {
  patientData: PatientData;
  updateDepartment: (dept: keyof PatientData, data: Record<string, any>) => void;
  resetPatientData: () => void;
  updatePatientId: (id: string) => void;
}

export const PatientContext = createContext<PatientContextProps>({
  patientData: {},
  updateDepartment: () => {},
  resetPatientData: () => {},
  updatePatientId: () => {}
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
    const newSocket = io('http://localhost:5000', {
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
      setPatientData(prev => ({
        ...prev,
        ...updatedData,
        timestamp: Date.now()
      }));
    });

    // Add new listener for reset event
    newSocket.on('resetPatientData', () => {
      console.log('Received reset signal');
      setPatientData({});
      localStorage.removeItem('patientData');
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
    const updatedData = {
      ...patientData,
      [dept]: data,
      timestamp: Date.now()
    };
    
    setPatientData(updatedData);
    localStorage.setItem('patientData', JSON.stringify(updatedData));
    
    // Broadcast department update to all clients
    if (socket?.connected) {
      console.log('Broadcasting department update'); // Debug log
      socket.emit('departmentUpdate', updatedData);
    }
  };

  const updatePatientId = (id: string) => {
    if (socket?.connected) {
      console.log('Broadcasting patient ID:', id);
      socket.emit('newPatientId', id);
    }
    
    setPatientData(prev => ({
      ...prev,
      patientId: id,
      timestamp: Date.now()
    }));
  };

  const resetPatientData = () => {
    setPatientData({});
    localStorage.removeItem("patientData");
    // Broadcast reset to all connected clients
    if (socket?.connected) {
      socket.emit('resetPatientData');
    }
  };

  return (
    <PatientContext.Provider value={{ patientData, updateDepartment, resetPatientData, updatePatientId }}>
      {children}
    </PatientContext.Provider>
  );
};
