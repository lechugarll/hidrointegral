import { fmt } from "../util/numeros.js";

const num = (v) => Number(v).toLocaleString("es", { maximumFractionDigits: 1 });

/**
 * Deslizadores para la «llave que se abre»: q(t) = k·t + q₀.
 *   q₀ = caudal inicial (L/min), k = aumento por minuto (L/min²), T = duración (min).
 * Muestra la fórmula con cada parte rotulada y la integral resuelta con esos números.
 */
export default function AjusteLlave({ valores, onChange }) {
  const { q0, k, T } = valores;
  const volumen = (k * T * T) / 2 + q0 * T; // ∫₀ᵀ (k·t + q₀) dt
  const cambiar = (campo) => (e) => onChange({ ...valores, [campo]: Number(e.target.value) });

  return (
    <section className="ajuste" aria-labelledby="ajuste-titulo">
      <h3 id="ajuste-titulo">Ajusta la llave y mira cómo cambia todo</h3>

      <div className="ajuste-controles">
        <div className="campo campo-rango">
          <label htmlFor="aj-q0">Caudal inicial q₀: {num(q0)} L/min</label>
          <input id="aj-q0" type="range" min="0.5" max="20" step="0.5" value={q0} onChange={cambiar("q0")} />
        </div>
        <div className="campo campo-rango">
          <label htmlFor="aj-k">Aumento por minuto k: {num(k)} L/min²</label>
          <input id="aj-k" type="range" min="0" max="10" step="0.5" value={k} onChange={cambiar("k")} />
        </div>
        <div className="campo campo-rango">
          <label htmlFor="aj-T">Duración T: {num(T)} min</label>
          <input id="aj-T" type="range" min="1" max="10" step="0.5" value={T} onChange={cambiar("T")} />
        </div>
      </div>

      <div className="formula-anotada" aria-live="polite">
        <span className="fa-parte">
          <span className="fa-simbolo">q(t) =</span>
          <span className="fa-nota">caudal</span>
        </span>
        <span className="fa-parte">
          <span className="fa-simbolo">{num(k)}·t</span>
          <span className="fa-nota">aumento con el tiempo ({num(k)} L/min²)</span>
        </span>
        <span className="fa-parte fa-mas">
          <span className="fa-simbolo">+</span>
        </span>
        <span className="fa-parte">
          <span className="fa-simbolo">{num(q0)}</span>
          <span className="fa-nota">caudal inicial ({num(q0)} L/min)</span>
        </span>
      </div>

      <p className="ajuste-integral">
        V = ∫₀ᵀ (k·t + q₀) dt = k·T²/2 + q₀·T = {num(k)}·{num(T)}²/2 + {num(q0)}·{num(T)} ={" "}
        <strong>{fmt(volumen)} L</strong>
      </p>
    </section>
  );
}
