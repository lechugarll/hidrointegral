import { Link } from "react-router-dom";
import { fmt, instanteEn } from "../util/numeros.js";

// «¿Para qué sirve el área bajo la curva?», respondido con los números de la
// situación que está en pantalla.
export default function UsosDelArea({ datos, capacidad }) {
  if (!datos) return null;
  const ac = datos.acumulada;
  const b = ac.t[ac.t.length - 1];
  const vTotal = ac.V[ac.V.length - 1];
  const tLleno = instanteEn(ac.t, ac.V, capacidad);
  const qMax = datos.q_max_intervalo;
  const sobra = capacidad - vTotal;

  return (
    <section className="usos" aria-labelledby="usos-titulo">
      <h2 id="usos-titulo">¿Para qué sirve el área bajo la curva?</h2>
      <p className="usos-intro">
        Si el caudal fuera siempre el mismo, bastaría multiplicar: litros = caudal × minutos. Pero
        casi nunca lo es. La integral hace esa misma cuenta cuando el caudal cambia a cada instante,
        y con ella se contestan preguntas muy concretas. Estas respuestas usan los datos de la
        situación que elegiste arriba:
      </p>
      <dl className="usos-lista">
        <div>
          <dt>¿Cabe toda el agua en el tanque?</dt>
          <dd>
            {sobra >= 0 ? (
              <>
                Sí: en {fmt(b, 0)} minutos entran <strong>{fmt(vTotal)} L</strong> y el tanque admite{" "}
                {fmt(capacidad, 0)} L, así que sobran {fmt(sobra)} L de margen.
              </>
            ) : (
              <>
                No: entran <strong>{fmt(vTotal)} L</strong> y el tanque solo admite {fmt(capacidad, 0)} L.
                Se derramarían {fmt(-sobra)} L; haría falta un tanque de al menos {fmt(vTotal)} L.
              </>
            )}
          </dd>
        </div>
        <div>
          <dt>¿Cuándo se llena?</dt>
          <dd>
            {tLleno != null ? (
              <>
                Se llena a los <strong>{fmt(tLleno)} minutos</strong>: es el instante en que el área
                acumulada alcanza {fmt(capacidad, 0)} L.
              </>
            ) : (
              <>
                En estos {fmt(b, 0)} minutos no llega a llenarse: el área acumulada se queda en{" "}
                {fmt(vTotal)} L, por debajo de los {fmt(capacidad, 0)} L de capacidad.
              </>
            )}
          </dd>
        </div>
        <div>
          <dt>¿Qué tubería o bomba hace falta?</dt>
          <dd>
            El caudal llega a <strong>{fmt(qMax)} L/min</strong> en su punto más alto, aunque el
            promedio sea {fmt(datos.promedio)} L/min. La tubería se dimensiona para el máximo, no
            para el promedio. En la pestaña{" "}
            <Link to="/tuberia">Capacidad de tubería</Link> se ve qué diámetro soporta ese caudal.
          </dd>
        </div>
        <div>
          <dt>¿Cuánta agua se consumió?</dt>
          <dd>
            Un medidor de agua hace exactamente esto: va sumando el caudal instante a instante y
            muestra los litros acumulados. En esta situación marcaría <strong>{fmt(vTotal)} L</strong>.
          </dd>
        </div>
      </dl>
    </section>
  );
}
