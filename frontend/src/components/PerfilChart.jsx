import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Perfil de velocidades v(r) a lo largo del radio. s = r/R va de 0 (centro) a 1 (pared).
export default function PerfilChart({ perfil }) {
  const datos = perfil.s.map((s, i) => ({ s, v: perfil.v[i] }));

  return (
    <div role="img" aria-label="Perfil de velocidades del agua dentro de la tubería, desde el centro hasta la pared.">
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={datos} margin={{ top: 10, right: 20, bottom: 25, left: 10 }}>
        <defs>
          <linearGradient id="gradPerfil" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--acento)" stopOpacity={0.5} />
            <stop offset="100%" stopColor="var(--acento)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="s"
          type="number"
          domain={[0, 1]}
          tickFormatter={(v) => v.toFixed(2)}
          label={{ value: "r / R  (centro → pared)", position: "insideBottom", offset: -15 }}
        />
        <YAxis label={{ value: "v (m/s)", angle: -90, position: "insideLeft" }} />
        <Tooltip
          formatter={(v) => [`${Number(v).toFixed(3)} m/s`, "v(r)"]}
          labelFormatter={(v) => `r/R = ${Number(v).toFixed(2)}`}
        />
        <Area
          type="monotone"
          dataKey="v"
          stroke="var(--acento-oscuro)"
          strokeWidth={2}
          fill="url(#gradPerfil)"
        />
      </AreaChart>
    </ResponsiveContainer>
    </div>
  );
}
