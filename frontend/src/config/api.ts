// API configuration
// This allows the API URL to be configured via environment variables
// when deploying to different environments

// For local development, it defaults to localhost:5000
// For production, it will use the VITE_API_URL environment variable if available
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper function to construct API endpoints
export const getApiUrl = (endpoint: string) => {
  // Make sure endpoint starts with a slash if it doesn't already
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${formattedEndpoint}`;
};

// Socket.IO connection URL (same as API by default)
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE_URL;