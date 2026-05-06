import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'SafeYatra',
        short_name: 'SafeYatra',
        description: 'Smart Tourist Safety System',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
                devOptions: {
  enabled: true,
  type: 'module'
},
  workbox: {
        globPatterns: [], // Temporarily disable aggressive caching
        runtimeCaching: []
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Code splitting configuration
    rollupOptions: {
      output: {
        // Manual chunk splitting for vendor libraries
        manualChunks: (id: string) => {
          // React core - most critical, keep separate
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
            return 'react-core';
          }
          // UI Components - heavy but commonly used
          if (
            id.includes('@radix-ui') ||
            id.includes('framer-motion') ||
            id.includes('lucide-react')
          ) {
            return 'ui-components';
          }
          // Charts and data visualization
          if (id.includes('recharts')) {
            return 'charts';
          }
          // Maps - heavy, only needed for MapPage
          if (id.includes('leaflet') || id.includes('react-leaflet')) {
            return 'maps';
          }
        },
        // Ensure consistent chunk naming for caching
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name || '';
          if (info.endsWith('.css')) {
            return 'assets/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
    // Chunk size warning limit (default is 500)
    chunkSizeWarningLimit: 600,
    // Source maps for production debugging (optional, can be disabled)
    sourcemap: false,
  },
})
