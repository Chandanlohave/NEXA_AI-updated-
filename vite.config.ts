import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'url'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables from .env files and the process environment
  // Using (process as any) to avoid TS errors in config file
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./', import.meta.url))
      }
    },
    // Define process.env global to make environment variables available in the client-side code
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
    server: {
      host: true,
    },
    build: {
      outDir: 'dist',
    }
  }
})