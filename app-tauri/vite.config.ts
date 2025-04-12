import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


// https://vite.dev/config/

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Force this port to match Tauri's expectation
    strictPort: true, // Don't try other ports if 3000 is taken
  },
  build: {
    outDir: "./build", // Match what you specified in Tauri init
  }})






