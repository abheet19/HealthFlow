// API configuration and tab-scoped clinic/user credential transport.
const getEnvVariable = (key: string): string | undefined => {
  if (import.meta.env && import.meta.env[key]) return import.meta.env[key];
  // @ts-expect-error - process.env may be available in another build system.
  if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
  return undefined;
};

export const API_BASE_URL =
  getEnvVariable('VITE_API_URL') ||
  'http://127.0.0.1:5000';

export const getApiUrl = (endpoint: string) => {
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${formattedEndpoint}`;
};

export const SOCKET_URL = getEnvVariable('VITE_SOCKET_URL') || API_BASE_URL;

const ACCESS_CODE_STORAGE_KEY = 'healthflow-access-code';
const CLINIC_ID_STORAGE_KEY = 'healthflow-clinic-id';
const USER_ID_STORAGE_KEY = 'healthflow-user-id';

export interface WorkspaceCredentials {
  accessCode: string;
  clinicId: string;
  userId: string;
}

export const DEFAULT_CLINIC_ID = getEnvVariable('VITE_HEALTHFLOW_CLINIC_ID') || 'demo';
export const DEFAULT_USER_ID = getEnvVariable('VITE_HEALTHFLOW_USER_ID') || 'demo-user';

export const getAccessCode = (): string => sessionStorage.getItem(ACCESS_CODE_STORAGE_KEY) || '';
export const getWorkspaceCredentials = (): WorkspaceCredentials => ({
  accessCode: getAccessCode(),
  clinicId: sessionStorage.getItem(CLINIC_ID_STORAGE_KEY) || DEFAULT_CLINIC_ID,
  userId: sessionStorage.getItem(USER_ID_STORAGE_KEY) || DEFAULT_USER_ID,
});
export const hasAccessCode = (): boolean => {
  const credentials = getWorkspaceCredentials();
  return Boolean(credentials.accessCode && credentials.clinicId && credentials.userId);
};
export const saveWorkspaceCredentials = (credentials: WorkspaceCredentials): void => {
  sessionStorage.setItem(ACCESS_CODE_STORAGE_KEY, credentials.accessCode.trim());
  sessionStorage.setItem(CLINIC_ID_STORAGE_KEY, credentials.clinicId.trim());
  sessionStorage.setItem(USER_ID_STORAGE_KEY, credentials.userId.trim());
};
export const clearAccessCode = (): void => {
  sessionStorage.removeItem(ACCESS_CODE_STORAGE_KEY);
  sessionStorage.removeItem(CLINIC_ID_STORAGE_KEY);
  sessionStorage.removeItem(USER_ID_STORAGE_KEY);
};

export const apiFetch = (endpoint: string, init: RequestInit = {}): Promise<Response> => {
  const headers = new Headers(init.headers);
  const credentials = getWorkspaceCredentials();
  if (credentials.accessCode) headers.set('X-HealthFlow-Access-Code', credentials.accessCode);
  if (credentials.clinicId) headers.set('X-HealthFlow-Clinic-Id', credentials.clinicId);
  if (credentials.userId) headers.set('X-HealthFlow-User-Id', credentials.userId);
  return fetch(getApiUrl(endpoint), { ...init, headers });
};
