import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Isso permite que a chave API configurada na Vercel seja lida pelo código do navegador
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});