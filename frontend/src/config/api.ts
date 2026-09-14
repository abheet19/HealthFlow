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
const DEMO_STORAGE_KEY = 'healthflow-demo';

// Reserved identity for the isolated, read-only sample workspace. This is NOT
// a real workspace credential: the backend only treats it as the sample space
// (serving synthetic data, refusing every write server-side) after real
// authentication has already failed, so it can never reach real clinic data.
export const DEMO_CLINIC_ID_VALUE = 'sample-demo';
export const DEMO_USER_ID_VALUE = 'demo-viewer';
export const DEMO_WORKSPACE_LABEL = 'Sample · read-only demo';

// A single synthetic checkup pre-loaded into the shared draft so a reviewer
// entering the demo immediately sees the multi-department workflow populated
// (IT + ENT + Vision + General + Dental), with no account and no server writes.
const DEMO_SEED_DRAFT = {
  patientId: 'PID-SAMPLE-0001',
  it: {
    name: 'Aarav Sample',
    div: '7-B',
    rollNo: '14',
    adminNo: 'A-2043',
    fatherName: 'Rohan Sample',
    motherName: 'Meera Sample',
    mobile: '90000-00001',
    dob: '2013-04-12',
    gender: 'Male',
    bloodGroup: 'O+',
    medicalOfficer: 'Dr. Sample Kaur',
  },
  ent: {
    left_ear_normal_hearing: 'Yes',
    right_ear_normal_hearing: 'Yes',
    left_ear_wax: 'Mild',
    throat_pain: 'No',
    tonsils: 'Normal',
    isSubmitted: true,
  },
  vision: {
    re_vision: '6/6',
    le_vision: '6/9',
    re_color_blindness: 'No',
    le_color_blindness: 'No',
    isSubmitted: true,
  },
  general: {
    height: '138',
    weight: '32',
    bmi: '16.8',
    nails: 'Normal',
    hair: 'Normal',
    skin: 'Normal',
    bp: '104/68',
    pulse: '88',
    isSubmitted: true,
  },
  dental: {
    dental_extra_oral: 'Normal',
    dental_remarks: 'Advise routine cleaning',
    tooth_cavity_permanent: '16,26',
    plaque: 'Mild',
    gum_inflammation: 'No',
    isSubmitted: true,
  },
  timestamp: Date.now(),
};

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
export const isDemoMode = (): boolean => sessionStorage.getItem(DEMO_STORAGE_KEY) === '1';
export const hasAccessCode = (): boolean => {
  if (isDemoMode()) return true;
  const credentials = getWorkspaceCredentials();
  return Boolean(credentials.accessCode && credentials.clinicId && credentials.userId);
};
export const saveWorkspaceCredentials = (credentials: WorkspaceCredentials): void => {
  sessionStorage.setItem(ACCESS_CODE_STORAGE_KEY, credentials.accessCode.trim());
  sessionStorage.setItem(CLINIC_ID_STORAGE_KEY, credentials.clinicId.trim());
  sessionStorage.setItem(USER_ID_STORAGE_KEY, credentials.userId.trim());
};
// Enter the isolated, read-only sample workspace. No real credential is stored;
// a demo marker is sent on every request so the backend serves synthetic data
// and refuses writes server-side. A synthetic checkup is seeded into the shared
// draft so the department dashboards render populated immediately.
export const enterDemoMode = (): void => {
  sessionStorage.setItem(DEMO_STORAGE_KEY, '1');
  sessionStorage.setItem(CLINIC_ID_STORAGE_KEY, DEMO_CLINIC_ID_VALUE);
  sessionStorage.setItem(USER_ID_STORAGE_KEY, DEMO_USER_ID_VALUE);
  sessionStorage.removeItem(ACCESS_CODE_STORAGE_KEY);
  sessionStorage.setItem('patientData', JSON.stringify(DEMO_SEED_DRAFT));
};
export const clearAccessCode = (): void => {
  sessionStorage.removeItem(ACCESS_CODE_STORAGE_KEY);
  sessionStorage.removeItem(CLINIC_ID_STORAGE_KEY);
  sessionStorage.removeItem(USER_ID_STORAGE_KEY);
  sessionStorage.removeItem(DEMO_STORAGE_KEY);
};

export const apiFetch = (endpoint: string, init: RequestInit = {}): Promise<Response> => {
  const headers = new Headers(init.headers);
  const credentials = getWorkspaceCredentials();
  if (credentials.accessCode) headers.set('X-HealthFlow-Access-Code', credentials.accessCode);
  if (credentials.clinicId) headers.set('X-HealthFlow-Clinic-Id', credentials.clinicId);
  if (credentials.userId) headers.set('X-HealthFlow-User-Id', credentials.userId);
  if (isDemoMode()) headers.set('X-HealthFlow-Demo', '1');
  return fetch(getApiUrl(endpoint), { ...init, headers });
};
