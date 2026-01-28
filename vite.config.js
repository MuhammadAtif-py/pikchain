import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// Production-safe config with proper Node.js polyfills
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Enable specific polyfills needed for web3/ethers
      include: ['buffer', 'process', 'util', 'stream', 'events'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  optimizeDeps: {
    include: ['eventemitter3', 'wagmi', 'ethers', '@wagmi/core'],
    esbuildOptions: {
      target: 'es2020',
    }
  },
  build: {
    chunkSizeWarningLimit: 5000,
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Single bundle to avoid initialization order issues
        inlineDynamicImports: true,
        format: 'es',
        hoistTransitiveImports: false,
      },
      treeshake: {
        moduleSideEffects: true,
        propertyReadSideEffects: false,
      }
    },
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/eventemitter3/, /node_modules/]
    }
  }
});

