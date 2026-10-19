import { useEffect } from "react";

const SITIO = "HidroIntegral";

// Actualiza el título y la meta descripción por página (SEO básico en una SPA).
export default function useSEO(titulo, descripcion) {
  useEffect(() => {
    document.title = titulo ? `${titulo} · ${SITIO}` : SITIO;
    if (descripcion) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", descripcion);
    }
  }, [titulo, descripcion]);
}
