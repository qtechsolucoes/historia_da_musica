// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/historia_da_musica/",
  // Adicione esta seção de teste
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js', // Ficheiro de configuração para os testes
  },
})