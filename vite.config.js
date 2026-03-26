import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    build: {
      // IIS verrouille dist/assets pendant le service → on écrit par-dessus sans supprimer
      emptyOutDir: false,
    },
    server: {
      host: '127.0.0.1',
      port: parseInt(env.PORT) || 5173,
    },
  }
})
