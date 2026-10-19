// Cliente de la API. Todas las rutas pasan por /api, que Vite reenvía al backend.

async function pedir(ruta, opciones) {
  const resp = await fetch(`/api${ruta}`, opciones);
  const datos = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    // FastAPI manda el mensaje en "detail".
    throw new Error(datos.detail || `Error ${resp.status}`);
  }
  return datos;
}

function postJSON(ruta, cuerpo) {
  return pedir(ruta, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
}

export const calcularVolumen = (q, a, b) => postJSON("/volumen", { q, a, b });

export const datosRiemann = (q, a, b, n, metodo) =>
  postJSON("/volumen/riemann", { q, a, b, n, metodo });

export const tiempoLlenado = (q, capacidad) =>
  postJSON("/llenado", { q, capacidad });

export const capacidadTuberia = (diametro_pulg, v_max) =>
  pedir(`/tuberia/capacidad?diametro_pulg=${diametro_pulg}&v_max=${v_max}`);

export const perfilTuberia = (diametro_pulg, v_max) =>
  pedir(`/tuberia/perfil?diametro_pulg=${diametro_pulg}&v_max=${v_max}`);

// Partículas del flujo calculadas en Python, para la simulación 3D.
export const animacionTuberia = (diametro_pulg, v_max) =>
  pedir(`/tuberia/animacion?diametro_pulg=${diametro_pulg}&v_max=${v_max}`);
