import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      // Otherwise, when using npm run dev (not the built version),
      // http://localhost:5173/?url=... will not work, because it
      // expects http://localhost:5173/index.html?url=...
      // (while http://localhost:5173 and http://localhost:5173/ work)
      // Does it mean that vite thinks that http://localhost:5173/?url=...
      // refers to the filesystem root /?
      // TODO(SL): find a better solution
      strict: false,
    }
  },
  optimizeDeps: {
    exclude: ["hyperparam"],
  },
})
