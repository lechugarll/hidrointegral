import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// El frontend llama rutas que empiezan con /api y Vite las reenvía al backend
// FastAPI (uvicorn en el puerto 8000). Así evitamos problemas de CORS en desarrollo.
export default defineConfig({
  plugins: [react()],
  build: {
    // Separa las librerías grandes en sus propios archivos para que el
    // navegador los cachee aparte y la página cargue más rápido.
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          recharts: ["recharts"],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        rewrite: (ruta) => ruta.replace(/^\/api/, ""),
      },
    },
  },
});
