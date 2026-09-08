// API configuration and single-user access-code transport.
const getEnvVariable = (key: string): string | undefined => {
  if (import.meta.env && import.meta.env[key]) return import.meta.env[key];
  // @ts-expect-error - process.env may be available in another build system.
  if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
  return undefined;
};

export const API_BASE_URL =
  getEnvVariable('VITE_API_URL') ||
  'https://doctor-report-backend-720901500415.asia-south1.run.app';

export const getApiUrl = (endpoint: string) => {
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${formattedEndpoint}`;
};

export const SOCKET_URL = getEnvVariable('VITE_SOCKET_URL') || API_BASE_URL;

const ACCESS_CODE_STORAGE_KEY = 'healthflow-access-code';

export const getAccessCode = (): string => sessionStorage.getItem(ACCESS_CODE_STORAGE_KEY) || '';
export const hasAccessCode = (): boolean => Boolean(getAccessCode());
export const saveAccessCode = (code: string): void => sessionStorage.setItem(ACCESS_CODE_STORAGE_KEY, code.trim());
export const clearAccessCode = (): void => sessionStorage.removeItem(ACCESS_CODE_STORAGE_KEY);

export const apiFetch = (endpoint: string, init: RequestInit = {}): Promise<Response> => {
  const headers = new Headers(init.headers);
  const accessCode = getAccessCode();
  if (accessCode) headers.set('X-HealthFlow-Access-Code', accessCode);
  return fetch(getApiUrl(endpoint), { ...init, headers });
};
