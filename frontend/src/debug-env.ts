// This file is used to debug environment variables
// It will log them during build time to verify they are being correctly injected

const API_URL = import.meta.env.VITE_API_URL;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

console.log('Environment Mode:', import.meta.env.MODE);
console.log('API URL:', API_URL || 'Not defined');
console.log('Socket URL:', SOCKET_URL || 'Not defined');

// Export empty object to avoid TypeScript errors
export {};