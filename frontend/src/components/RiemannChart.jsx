import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Customized,
  Area,
} from "recharts";

// Capa de rectángulos de Riemann, dibujada con las escalas reales de los ejes
// de Recharts para que queden alineados con la curva q(t).
function Rectangulos({ xAxisMap, yAxisMap, rectangulos }) {
  if (!xAxisMap || !yAxisMap || !rectangulos) return null;
  const escalaX = Object.values(xAxisMap)[0].scale;
  const escalaY = Object.values(yAxisMap)[0].scale;
  const y0 = escalaY(0);

  return (
    <g>
      {rectangulos.map((r, i) => {
        const px0 = escalaX(r.x0);
        const px1 = escalaX(r.x0 + r.ancho);
        const py = escalaY(r.altura);
        const arriba = Math.min(py, y0);
        const alto = Math.abs(py - y0);
        return (
          <rect
            key={i}
            x={Math.min(px0, px1)}
            y={arriba}
            width={Math.abs(px1 - px0)}
            height={alto}
            fill="var(--rect)"
            fillOpacity={0.3}
            stroke="var(--rect)"
            strokeWidth={1}
          />
        );
      })}
    </g>
  );
}

export default function RiemannChart({ curva, rectangulos }) {
  const datos = curva.t.map((t, i) => ({ t, q: curva.q[i] }));

  return (
    <div role="img" aria-label="Gráfica del caudal q(t) con los rectángulos de la suma de Riemann y el área exacta bajo la curva.">
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={datos} margin={{ top: 10, right: 20, bottom: 25, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="t"
          type="number"
          domain={["dataMin", "dataMax"]}
          tickFormatter={(v) => v.toFixed(1)}
          label={{ value: "t (min)", position: "insideBottom", offset: -15 }}
        />
        <YAxis
          label={{ value: "q(t) (L/min)", angle: -90, position: "insideLeft" }}
        />
        <Tooltip
          formatter={(v) => [`${Number(v).toFixed(2)} L/min`, "q(t)"]}
          labelFormatter={(v) => `t = ${Number(v).toFixed(2)} min`}
        />
        {/* Área bajo la curva = volumen exacto */}
        <Area type="monotone" dataKey="q" stroke="none" fill="var(--area)" fillOpacity={0.15} />
        {/* Rectángulos de Riemann por debajo de la línea */}
        <Customized component={(props) => <Rectangulos {...props} rectangulos={rectangulos} />} />
        <Line type="monotone" dataKey="q" stroke="var(--acento-oscuro)" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
    </div>
  );
}
