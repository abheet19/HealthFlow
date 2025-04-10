import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// This function lets Vite load environment variables based on mode
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    // vite config
    plugins: [react()],
    server: {
      port: 3000
    },
    define: {
      // Make sure environment variables are properly exposed
      'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
      'process.env.VITE_SOCKET_URL': JSON.stringify(env.VITE_SOCKET_URL)
    }
  }
})
