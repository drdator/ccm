import { defineConfig } from 'vite'

export default defineConfig({
  root: './',
  server: {
    port: 8080,
    open: true,
    cors: true,
    // Handle client-side routing
    historyApiFallback: {
      rewrites: [
        { from: /^\/package\/.*$/, to: '/index.html' }
      ]
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: './index.html'
      }
    },
    // Copy config template to dist
    copyPublicDir: true
  },
  publicDir: 'public'
})
