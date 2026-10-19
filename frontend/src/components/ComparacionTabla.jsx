import { fmt } from "../util/numeros.js";

// Una fila por n, una columna por método; bajo cada valor, su error frente al exacto.
export default function ComparacionTabla({ comparacion }) {
  const { exacto, filas } = comparacion;
  const ns = [...new Set(filas.map((f) => f.n))].sort((x, y) => x - y);
  const metodos = [...new Set(filas.map((f) => f.metodo))];
  const buscar = (metodo, n) => filas.find((f) => f.metodo === metodo && f.n === n);
  const nombre = { izquierda: "Izquierda", derecha: "Derecha", medio: "Punto medio", trapecio: "Trapecio", simpson: "Simpson" };

  return (
    <div className="tabla-scroll">
      <table className="tabla-metodos">
        <caption>
          Volumen aproximado (litros) con cada método. El valor exacto es {fmt(exacto, 3)} L.
        </caption>
        <thead>
          <tr>
            <th scope="col">Rebanadas n</th>
            {metodos.map((m) => (
              <th key={m} scope="col">{nombre[m] ?? m}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ns.map((n) => (
            <tr key={n}>
              <th scope="row">{n}</th>
              {metodos.map((m) => {
                const celda = buscar(m, n);
                return (
                  <td key={m}>
                    {celda ? (
                      <>
                        {fmt(celda.volumen, 3)}
                        <small>error {fmt(celda.error, 3)}</small>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
