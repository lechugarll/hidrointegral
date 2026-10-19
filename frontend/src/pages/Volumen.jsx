import { useEffect, useState } from "react";
import { calcularVolumen } from "../api.js";
import QueEsElCaudal from "../components/QueEsElCaudal.jsx";
import LaboratorioVolumen from "../components/LaboratorioVolumen.jsx";
import UsosDelArea from "../components/UsosDelArea.jsx";
import MetodosNumericos from "../components/MetodosNumericos.jsx";
import { ESCENARIOS, porId } from "../escenarios.js";
import useSEO from "../hooks/useSEO.js";

const INICIAL = ESCENARIOS[0];
// Valores de partida de los deslizadores de la «llave que se abre»: q(t) = 2t + 3, de 0 a 4 min.
const LLAVE_INICIAL = { q0: 3, k: 2, T: 4 };

export default function Volumen() {
  useSEO(
    "¿Cuánta agua hay en el tanque?",
    "Un tanque 3D que se llena con un caudal variable y el área bajo la curva sincronizada: aprende para qué sirve integrar un caudal."
  );

  const [escId, setEscId] = useState(INICIAL.id);
  const [params, setParams] = useState({ q: INICIAL.q, a: INICIAL.a, b: INICIAL.b });
  const [capacidad, setCapacidad] = useState(INICIAL.capacidad);
  const [llave, setLlave] = useState(LLAVE_INICIAL);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  // Cada vez que cambia la función o el intervalo, Python recalcula V(t) y q(t).
  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError("");
    calcularVolumen(params.q, params.a, params.b)
      .then((d) => {
        // Comprobamos la forma de la respuesta: un servidor desactualizado no debe tumbar la página.
        if (!d?.acumulada?.q) throw new Error("El servidor de cálculo respondió con datos incompletos. Reinícialo e inténtalo de nuevo.");
        if (vigente) setDatos(d);
      })
      .catch((e) => vigente && setError(e.message))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [params]);

  // Los deslizadores de la llave arman q(t) = k·t + q₀. Se espera 250 ms tras el último
  // movimiento para no lanzar una petición por cada paso, y no se repite si no cambió nada.
  useEffect(() => {
    if (escId !== "llave") return undefined;
    const espera = setTimeout(() => {
      const q = `${llave.k}*t+${llave.q0}`;
      setParams((p) => (p.q === q && p.a === 0 && p.b === llave.T ? p : { q, a: 0, b: llave.T }));
    }, 250);
    return () => clearTimeout(espera);
  }, [llave, escId]);

  function elegir(id) {
    setEscId(id);
    const e = porId(id);
    setCapacidad(e.capacidad);
    if (id === "llave") setLlave(LLAVE_INICIAL);
    setParams({ q: e.q, a: e.a, b: e.b });
  }

  function aplicarPropio({ q, a, b, capacidad: cap }) {
    setCapacidad(cap);
    setParams({ q, a, b });
  }

  return (
    <>
      <header className="intro">
        <h1>¿Cuánta agua hay en el tanque?</h1>
        <p className="lede">
          Una tubería llena un tanque, pero el caudal casi nunca es el mismo de principio a fin.
          Entonces, ¿cómo saber cuántos litros entraron? Respuesta: calculando el{" "}
          <strong>área bajo la curva del caudal</strong>. Aquí puedes verlo suceder.
        </p>
      </header>

      <QueEsElCaudal />

      <LaboratorioVolumen
        escId={escId}
        onElegir={elegir}
        params={params}
        capacidad={capacidad}
        onCapacidad={setCapacidad}
        datos={datos}
        cargando={cargando}
        error={error}
        onAplicarPropio={aplicarPropio}
        llave={llave}
        onLlave={setLlave}
      />

      <UsosDelArea datos={datos} capacidad={capacidad} />
      <MetodosNumericos params={params} datos={datos} />
    </>
  );
}
