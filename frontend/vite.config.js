import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Pre-transform entry files on server start so the first page load is fast
    warmup: {
      clientFiles: [
        './src/main.jsx',
        './src/App.jsx',
        './src/components/BubbleMenu.jsx',
        './src/components/PixelSnow.jsx',
        './src/components/GridScan.jsx',
        './src/pages/HomePage.jsx',
      ],
    },
    preTransformRequests: true,
  },
  optimizeDeps: {
    include: [
      'three',
      'postprocessing',
      'recharts',
      'gsap',
      'react',
      'react-dom',
      'lucide-react',
      'axios'
    ],
  },
})
