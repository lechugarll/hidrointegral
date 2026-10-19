import { useEffect, useState } from "react";
import { calcularVolumen } from "../api.js";
import LaboratorioVolumen from "../components/LaboratorioVolumen.jsx";
import UsosDelArea from "../components/UsosDelArea.jsx";
import MetodosNumericos from "../components/MetodosNumericos.jsx";
import { ESCENARIOS, porId } from "../escenarios.js";
import useSEO from "../hooks/useSEO.js";

const INICIAL = ESCENARIOS[0];

export default function Volumen() {
  useSEO(
    "¿Cuánta agua hay en el tanque?",
    "Un tanque 3D que se llena con un caudal variable y el área bajo la curva sincronizada: aprende para qué sirve integrar un caudal."
  );

  const [escId, setEscId] = useState(INICIAL.id);
  const [params, setParams] = useState({ q: INICIAL.q, a: INICIAL.a, b: INICIAL.b });
  const [capacidad, setCapacidad] = useState(INICIAL.capacidad);
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

  function elegir(id) {
    setEscId(id);
    const e = porId(id);
    setCapacidad(e.capacidad);
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
      />

      <UsosDelArea datos={datos} capacidad={capacidad} />
      <MetodosNumericos params={params} datos={datos} />
    </>
  );
}
