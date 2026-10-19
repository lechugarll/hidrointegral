// Explicación breve de qué es el caudal, antes de usar el laboratorio.
// La web daba por hecho que el visitante lo sabe; aquí se parte de cero.
export default function QueEsElCaudal() {
  return (
    <section className="caudal-explica" aria-labelledby="caudal-titulo">
      <h2 id="caudal-titulo">Primero, ¿qué es el caudal?</h2>
      <div className="caudal-cols">
        <div className="caudal-texto">
          <p>
            El <strong>caudal</strong> es cuánta agua pasa por un lugar en cada unidad de tiempo.
            Se parece a la velocidad: la velocidad dice cuántos metros recorres por segundo, y el
            caudal dice cuántos litros pasan por minuto.
          </p>
          <p>
            En ríos y canales se suele medir en litros por segundo (L/s). En las tuberías de una
            casa, en <strong>litros por minuto (L/min)</strong>, que es lo que usamos aquí. El agua
            total que pasó se mide en <strong>litros</strong>.
          </p>
        </div>
        <ul className="caudal-formulas">
          <li>
            <span className="caudal-eq">Q = V ÷ t</span>
            <span>Si el caudal es <strong>constante</strong>: litros = caudal × minutos.</span>
          </li>
          <li>
            <span className="caudal-eq">Q = A · v</span>
            <span>Con la tubería: área de su sección × velocidad promedio del agua.</span>
          </li>
          <li>
            <span className="caudal-eq">q(t)</span>
            <span>
              Si el caudal <strong>cambia con el tiempo</strong> se escribe q(t), y los litros ya no
              salen de multiplicar: salen del área bajo la curva.
            </span>
          </li>
        </ul>
      </div>
    </section>
  );
}
