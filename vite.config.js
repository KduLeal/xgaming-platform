import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        categoria: resolve(__dirname, 'categoria.html'),
        produto: resolve(__dirname, 'produto.html'),
        comparador: resolve(__dirname, 'comparador.html'),
        sobre: resolve(__dirname, 'sobre.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
