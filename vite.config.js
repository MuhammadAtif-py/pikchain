import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Clean Vite config to fix EventEmitter (CJS) interop & avoid white screen.
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  resolve: {
    alias: {
      buffer: path.resolve(__dirname, 'src/externals/buffer.js')
    }
  },
  optimizeDeps: {
    include: ['buffer', 'ethers', 'eventemitter3'],
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react','react-dom'],
          wagmi: ['wagmi','@wagmi/connectors'],
          ethers: ['ethers']
        }
      }
    },
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/eventemitter3/, /node_modules/]
    }
  }
});

