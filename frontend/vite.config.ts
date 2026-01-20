import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all addresses (0.0.0.0)
    port: 5173,
    strictPort: true, // Exit if port is already in use
    watch: {
      usePolling: true, // Enable polling for Docker volume mounts
      interval: 1000, // Poll every 1 second (reduce frequency)
      // Exclude test files and node_modules from watching to reduce memory usage
      ignored: [
        '**/node_modules/**',
        '**/__tests__/**',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/test/**',
        '**/dist/**',
        '**/.git/**',
        '**/coverage/**',
        '**/.vscode/**',
        '**/.idea/**',
      ],
    },
    // Proxy API requests to backend (solves CORS issues in development)
    // Frontend container proxies to backend container via Docker network
    proxy: {
      '/api': {
        target: 'http://backend:3000',
        changeOrigin: true,
        secure: false,
        ws: true, // Enable WebSocket proxying
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
  // Optimize build to reduce memory usage
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined, // Disable manual chunking to reduce memory
      },
    },
  },
  // Optimize dependencies to reduce memory
  optimizeDeps: {
    exclude: ['@testing-library/react', '@testing-library/jest-dom'],
  },
})
