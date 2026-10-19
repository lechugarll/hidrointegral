import { useEffect, useState } from "react";
import { datosRiemann } from "../api.js";
import RiemannChart from "./RiemannChart.jsx";
import ComparacionTabla from "./ComparacionTabla.jsx";
import { fmt } from "../util/numeros.js";

const METODOS_RECT = [
  { valor: "izquierda", texto: "Izquierda" },
  { valor: "derecha", texto: "Derecha" },
  { valor: "medio", texto: "Punto medio" },
];

// SymPy devuelve «t**2 + 3*t»; lo escribimos como «t² + 3·t» para leerlo mejor.
const bonito = (s) => s.replace(/\*\*2/g, "²").replace(/\*\*3/g, "³").replace(/\*\*/g, "^").replace(/\*/g, "·");

// «¿Cómo lo calcula el computador?»: el valor exacto y las aproximaciones con rectángulos.
export default function MetodosNumericos({ params, datos }) {
  const [n, setN] = useState(4);
  const [metodo, setMetodo] = useState("izquierda");
  const [riemann, setRiemann] = useState(null);
  const [error, setError] = useState("");
  const { q, a, b } = params;

  // Espera 200 ms tras el último cambio para no lanzar una petición por cada paso del slider.
  useEffect(() => {
    if (!datos) return undefined;
    let vigente = true;
    const espera = setTimeout(() => {
      datosRiemann(q, a, b, n, metodo)
        .then((r) => vigente && (setRiemann(r), setError("")))
        .catch((e) => vigente && setError(e.message));
    }, 200);
    return () => {
      vigente = false;
      clearTimeout(espera);
    };
  }, [q, a, b, n, metodo, datos]);

  if (!datos) return null;
  const exacto = datos.exacto;
  const error_ = riemann ? Math.abs(riemann.suma - exacto) : null;

  return (
    <section className="metodos" aria-labelledby="metodos-titulo">
      <h2 id="metodos-titulo">¿Cómo lo calcula el computador?</h2>

      <h3>Con el teorema fundamental del cálculo (valor exacto)</h3>
      <p>
        Se busca una función F cuya derivada sea el caudal. Entonces el agua acumulada entre a y b es
        F(b) − F(a). Para esta situación:
      </p>
      <p className="ecuacion">
        F(t) = {bonito(datos.antiderivada)} &nbsp;⟹&nbsp; V = F({b}) − F({a}) = <strong>{fmt(exacto, 3)} L</strong>
      </p>

      <h3>Con rectángulos (sumas de Riemann)</h3>
      <p>
        Otra forma es partir el tiempo en n tramos iguales y suponer que en cada uno el caudal no
        cambia: cada tramo aporta un rectángulo de agua. Cuantos más rectángulos, mejor se ajusta al
        área real.
      </p>
      <div className="controles-metodo">
        <div className="campo">
          <label htmlFor="campo-metodo">Altura de cada rectángulo</label>
          <select id="campo-metodo" value={metodo} onChange={(e) => setMetodo(e.target.value)}>
            {METODOS_RECT.map((m) => (
              <option key={m.valor} value={m.valor}>{m.texto}</option>
            ))}
          </select>
        </div>
        <div className="campo campo-rango">
          <label htmlFor="campo-n">Rectángulos: n = {n}</label>
          <input id="campo-n" type="range" min="1" max="50" value={n} onChange={(e) => setN(Number(e.target.value))} />
        </div>
        {riemann && (
          <p className="aproximacion" aria-live="polite">
            Suma de rectángulos: <strong>{fmt(riemann.suma, 2)} L</strong>
            <span> · exacto {fmt(exacto, 2)} L · error {fmt(error_, 3)} L</span>
          </p>
        )}
      </div>
      {error && <div className="error" role="alert">{error}</div>}
      {riemann && <RiemannChart curva={riemann.curva} rectangulos={riemann.rectangulos} />}

      <h3>Comparando todos los métodos</h3>
      <p>
        El trapecio y Simpson usan formas más inteligentes que los rectángulos y se acercan al valor
        exacto con muchas menos rebanadas.
      </p>
      <ComparacionTabla comparacion={datos.comparacion} />
    </section>
  );
}
