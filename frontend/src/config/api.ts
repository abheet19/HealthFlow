// API configuration
// This allows the API URL to be configured via environment variables
// when deploying to different environments

// Try to get environment variables from different sources (Vite's import.meta.env or process.env)
// This provides better compatibility across different build systems
const getEnvVariable = (key: string): string | undefined => {
  if (import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  // @ts-ignore - process.env might be available depending on build configuration
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    // @ts-ignore
    return process.env[key];
  }
  return undefined;
};

// For docker or production, it will use the VITE_API_URL environment variable
// Default to the Cloud Run backend URL if no env variable is set
export const API_BASE_URL = 
  getEnvVariable('VITE_API_URL') || 
  'https://doctor-report-backend-720901500415.asia-south1.run.app';

// Helper function to construct API endpoints
export const getApiUrl = (endpoint: string) => {
  // Make sure endpoint starts with a slash if it doesn't already
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${formattedEndpoint}`;
};

// Socket.IO connection URL (same as API by default)
export const SOCKET_URL = 
  getEnvVariable('VITE_SOCKET_URL') || 
  API_BASE_URL;