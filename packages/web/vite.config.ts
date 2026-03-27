import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-motion': ['framer-motion'],
          'vendor-socket': ['socket.io-client'],
          'game-engine': ['./src/game/gameEngine.ts', './src/game/handRanking.ts', './src/game/deck.ts'],
        },
      },
    },
    chunkSizeWarningLimit: 400,
  },
  server: {
    port: 5173,
  },
})
