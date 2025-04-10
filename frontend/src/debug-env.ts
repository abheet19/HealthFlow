// This file is used to debug environment variables
// It will log them during build time to verify they are being correctly injected

const API_URL = import.meta.env.VITE_API_URL;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

// Export empty object to avoid TypeScript errors
export {};