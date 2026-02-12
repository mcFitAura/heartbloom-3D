import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages usually deploys to a subdirectory (e.g. /your-repo-name/)
  // Using './' ensures assets are loaded relatively, which works for both root and subdirectories.
  base: './',
  build: {
    chunkSizeWarningLimit: 1600,
  }
})