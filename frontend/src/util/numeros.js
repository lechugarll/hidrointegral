// Utilidades numéricas pequeñas para las gráficas y las lecturas.

// Interpolación lineal de ys en el punto x (xs ordenado de menor a mayor).
export function interp(xs, ys, x) {
  const n = xs.length;
  if (n === 0) return 0;
  if (x <= xs[0]) return ys[0];
  if (x >= xs[n - 1]) return ys[n - 1];
  // Búsqueda binaria del tramo que contiene a x.
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (xs[mid] <= x) lo = mid;
    else hi = mid;
  }
  const f = (x - xs[lo]) / (xs[hi] - xs[lo] || 1);
  return ys[lo] + f * (ys[hi] - ys[lo]);
}

// Marcas "bonitas" para un eje: pasos de 1, 2 o 5 por potencias de 10.
export function marcas(min, max, cuantas = 5) {
  const rango = max - min || 1;
  const bruto = rango / cuantas;
  const pot = 10 ** Math.floor(Math.log10(bruto));
  const paso = [1, 2, 5, 10].map((m) => m * pot).find((p) => p >= bruto) ?? 10 * pot;
  const res = [];
  for (let v = Math.ceil(min / paso) * paso; v <= max + 1e-9; v += paso) {
    res.push(Math.round(v / paso) * paso);
  }
  return res;
}

// Primer instante en que la serie ys (creciente) alcanza `meta`; null si nunca.
export function instanteEn(xs, ys, meta) {
  if (!(ys[ys.length - 1] >= meta)) return null;
  for (let i = 1; i < ys.length; i++) {
    if (ys[i] >= meta) {
      const f = (meta - ys[i - 1]) / (ys[i] - ys[i - 1] || 1);
      return xs[i - 1] + f * (xs[i] - xs[i - 1]);
    }
  }
  return null;
}

export const fmt = (v, d = 1) =>
  Number(v).toLocaleString("es", { minimumFractionDigits: d, maximumFractionDigits: d });
