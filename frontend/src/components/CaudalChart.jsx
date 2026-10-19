import { useMemo, useRef } from "react";
import { fmt, interp, marcas } from "../util/numeros.js";

// Gráfica del caudal q(t) con el área ya acumulada hasta el cursor.
// Es la misma idea de la integral: el área sombreada ES el volumen V(t).
const W = 640;
const H = 340;
const M = { izq: 62, der: 18, arr: 22, aba: 50 };

export default function CaudalChart({
  datos, cursor, a, b, promedio, mostrarPromedio, onCursor, descripcion,
}) {
  const svg = useRef(null);
  const pw = W - M.izq - M.der;
  const ph = H - M.arr - M.aba;

  const { yMin, yMax } = useMemo(() => {
    const max = Math.max(...datos.q, 1e-9);
    const min = Math.min(...datos.q, 0);
    return { yMin: min, yMax: max * 1.15 };
  }, [datos]);

  const X = (t) => M.izq + ((t - a) / (b - a || 1)) * pw;
  const Y = (q) => M.arr + (1 - (q - yMin) / (yMax - yMin || 1)) * ph;

  // La curva completa no cambia al mover el cursor: se calcula una sola vez.
  const curva = useMemo(
    () => datos.t.map((t, i) => `${i ? "L" : "M"}${X(t).toFixed(1)},${Y(datos.q[i]).toFixed(1)}`).join(" "),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [datos, a, b, yMin, yMax]
  );

  // Área ya acumulada: desde a hasta el cursor, bajando hasta el eje.
  let area = "";
  if (cursor > a) {
    let d = `M${X(a).toFixed(1)},${Y(0).toFixed(1)}`;
    for (let i = 0; i < datos.t.length && datos.t[i] < cursor; i++) {
      d += ` L${X(datos.t[i]).toFixed(1)},${Y(datos.q[i]).toFixed(1)}`;
    }
    d += ` L${X(cursor).toFixed(1)},${Y(interp(datos.t, datos.q, cursor)).toFixed(1)}`;
    d += ` L${X(cursor).toFixed(1)},${Y(0).toFixed(1)} Z`;
    area = d;
  }

  const qAct = interp(datos.t, datos.q, cursor);
  const marcasY = marcas(yMin, yMax, 5);
  const marcasX = marcas(a, b, 6);

  // Convierte la posición del puntero en un instante t y avisa al laboratorio.
  function mover(ev) {
    const caja = svg.current.getBoundingClientRect();
    const x = ((ev.clientX - caja.left) / caja.width) * W;
    const t = a + ((x - M.izq) / pw) * (b - a);
    onCursor(Math.min(Math.max(t, a), b));
  }

  return (
    <svg
      ref={svg}
      className="cg"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={descripcion}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        mover(e);
      }}
      onPointerMove={(e) => e.buttons === 1 && mover(e)}
    >
      {/* Rejilla y marcas */}
      {marcasY.map((v) => (
        <g key={`y${v}`}>
          <line className="cg-rejilla" x1={M.izq} x2={W - M.der} y1={Y(v)} y2={Y(v)} />
          <text className="cg-marca" x={M.izq - 10} y={Y(v) + 4} textAnchor="end">{fmt(v, 0)}</text>
        </g>
      ))}
      {marcasX.map((v) => (
        <text key={`x${v}`} className="cg-marca" x={X(v)} y={H - M.aba + 22} textAnchor="middle">{fmt(v, 0)}</text>
      ))}
      <line className="cg-eje" x1={M.izq} x2={W - M.der} y1={Y(0)} y2={Y(0)} />
      <text className="cg-titulo-eje" x={M.izq + pw / 2} y={H - 8} textAnchor="middle">Tiempo t (minutos)</text>
      <text className="cg-titulo-eje" transform={`translate(16 ${M.arr + ph / 2}) rotate(-90)`} textAnchor="middle">
        Caudal q (litros por minuto)
      </text>

      {/* Caudal promedio: el rectángulo con la misma área */}
      {mostrarPromedio && (
        <g>
          <rect className="cg-promedio" x={X(a)} y={Y(promedio)} width={X(b) - X(a)} height={Y(0) - Y(promedio)} />
          <text className="cg-etiqueta cg-etiqueta-promedio" x={X(b) - 8} y={Y(promedio) - 8} textAnchor="end">
            promedio {fmt(promedio, 1)} L/min
          </text>
        </g>
      )}

      {/* Área ya acumulada hasta el cursor */}
      {area && <path className="cg-area" d={area} />}
      <path className="cg-curva" d={curva} />

      {/* Cursor */}
      <line className="cg-cursor" x1={X(cursor)} x2={X(cursor)} y1={M.arr} y2={Y(0)} />
      <circle className="cg-punto" cx={X(cursor)} cy={Y(qAct)} r="7" />
      <text
        className="cg-etiqueta"
        x={Math.min(Math.max(X(cursor), M.izq + 48), W - M.der - 48)}
        y={M.arr - 6}
        textAnchor="middle"
      >
        t = {fmt(cursor, 1)} min
      </text>
    </svg>
  );
}
