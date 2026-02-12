import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages usually deploys to a subdirectory (e.g. /your-repo-name/)
  // If you are using a custom domain, change this to '/'
  base: './', 
})