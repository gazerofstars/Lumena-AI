import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // This ensures process.env.GEMINI_API_KEY works in the code as written
      // We check multiple common names to make it easier for the user on Vercel
      'process.env.GEMINI_API_KEY': JSON.stringify(
        env.VITE_GEMINI_API_KEY || 
        env.GEMINI_API_KEY || 
        env.API_KEY || 
        process.env.GEMINI_API_KEY || 
        process.env.VITE_GEMINI_API_KEY
      ),
      // Safe polyfill for other process.env access if necessary
      'process.env': {}
    },
    server: {
      port: 3000,
      open: true
    },
    build: {
      outDir: 'dist',
    }
  };
});