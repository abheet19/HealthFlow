import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// This function lets Vite load environment variables based on mode
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  const hmrClientPort = Number(env.VITE_HMR_CLIENT_PORT)
  
  return {
    // vite config
    plugins: [react()],
    server: {
      port: 3000,
      // Vite already advertises the actual listening port. Pin it only when a
      // reverse proxy exposes a different browser-facing port; hard-coding
      // 3000 breaks HMR when a local test deliberately starts on another port.
      hmr: Number.isInteger(hmrClientPort) && hmrClientPort > 0
        ? { clientPort: hmrClientPort }
        : undefined,
    },
    build: {
      // Increase size limit for base64 inlining (helps with image handling)
      assetsInlineLimit: 10240, // 10KB
    },
    define: {
      // Make sure environment variables are properly exposed
      'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
      'process.env.VITE_SOCKET_URL': JSON.stringify(env.VITE_SOCKET_URL)
    }
  }
})
