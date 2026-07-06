import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (
            id.includes('@metamask/connect-evm') ||
            id.includes('@metamask/sdk') ||
            id.includes('@metamask/')
          ) {
            return 'metamask';
          }
          if (id.includes('wagmi') || id.includes('viem') || id.includes('@wagmi')) {
            return 'web3';
          }
          if (id.includes('@tanstack/react-query')) {
            return 'query';
          }
          if (id.includes('react-router') || id.includes('react-dom') || id.includes('/react/')) {
            return 'react-vendor';
          }
        },
      },
    },
  },
})
