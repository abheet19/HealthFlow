/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_SOCKET_URL: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Add custom window property for input debounce timers
interface Window {
  inputDebounceTimers: Record<string, ReturnType<typeof setTimeout>>;
}