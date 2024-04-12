import { defineConfig } from 'vite';
import path from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'VPLForThings',
      fileName: 'vpl-for-things',
    },
    rollupOptions: {
      output: {
        globals: {
          lit: 'Lit',
        },
      },
    },
  },
  plugins: [dts()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@components': path.resolve(__dirname, './src/editor/components'),
      '@vpl': path.resolve(__dirname, './src/vpl'),
    },
  },
});
