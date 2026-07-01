import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Math Quest build config. base: './' keeps asset paths relative so the built
// app can be opened from any static host (or even file://) for offline use.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { host: true, port: 5173 },
})
