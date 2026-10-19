// Analítica sin cookies, opcional y respetuosa de la privacidad.
// Se carga SOLO si el usuario acepta en el banner de consentimiento.
// No usa cookies ni almacena datos personales; el dominio se configura con
// la variable pública VITE_ANALYTICS_DOMAIN (no es un secreto).

const DOMINIO = import.meta.env.VITE_ANALYTICS_DOMAIN;

export function cargarAnalitica() {
  // Sin dominio configurado no se carga nada (p. ej. en desarrollo).
  if (!DOMINIO) return;
  if (document.getElementById("analitica")) return;
  const s = document.createElement("script");
  s.id = "analitica";
  s.defer = true;
  s.setAttribute("data-domain", DOMINIO);
  // Plausible: analítica sin cookies, se puede autoalojar. Cambia la URL si usas otra.
  s.src = "https://plausible.io/js/script.js";
  document.head.appendChild(s);
}
