import { lazy, Suspense, useEffect, useState } from "react";
import { animacionTuberia, capacidadTuberia, perfilTuberia } from "../api.js";
import PerfilChart from "./PerfilChart.jsx";
import { fmt } from "../util/numeros.js";

// Three.js pesa bastante: solo se descarga cuando se abre esta página.
const Tuberia3D = lazy(() => import("./Tuberia3D.jsx"));

// Diámetros nominales comerciales (pulgadas), igual que DIAMETROS_PULG en el backend.
const DIAMETROS = [
  { nombre: '1/2"', pulg: 0.5 },
  { nombre: '3/4"', pulg: 0.75 },
  { nombre: '1"', pulg: 1.0 },
  { nombre: '1 1/4"', pulg: 1.25 },
  { nombre: '1 1/2"', pulg: 1.5 },
  { nombre: '2"', pulg: 2.0 },
];

export default function TuberiaPanel() {
  const [pulg, setPulg] = useState(1.0);
  const [vMax, setVMax] = useState(2.0);
  const [cap, setCap] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [anim, setAnim] = useState(null);
  const [error, setError] = useState("");

  // Espera 250 ms tras el último cambio antes de consultar la API: así arrastrar
  // el slider no dispara decenas de peticiones (y no choca con el límite por IP).
  useEffect(() => {
    let vigente = true;
    const temporizador = setTimeout(() => {
      setError("");
      Promise.all([
        capacidadTuberia(pulg, vMax),
        perfilTuberia(pulg, vMax),
        animacionTuberia(pulg, vMax),
      ])
        .then(([c, p, a]) => {
          if (!vigente) return;
          setCap(c);
          setPerfil(p);
          setAnim(a);
        })
        .catch((e) => vigente && setError(e.message));
    }, 250);
    return () => {
      vigente = false;
      clearTimeout(temporizador);
    };
  }, [pulg, vMax]);

  const errorIntegral =
    perfil && perfil.q_formula_lmin
      ? (Math.abs(perfil.q_integral_lmin - perfil.q_formula_lmin) / perfil.q_formula_lmin) * 100
      : null;

  const nombreDiametro = DIAMETROS.find((d) => d.pulg === pulg)?.nombre ?? `${pulg}"`;
  const descripcion3D = anim
    ? `Simulación 3D: agua pasando de un depósito a otro por una tubería de ${nombreDiametro} a ${vMax.toFixed(1)} metros por segundo, en régimen ${anim.regimen}. Las partículas del centro avanzan más rápido que las de la pared.`
    : "Simulación 3D del agua en la tubería";

  return (
    <>
      <div className="controles-tuberia">
        <div className="campo">
          <label htmlFor="campo-diametro">Diámetro de la tubería</label>
          <select id="campo-diametro" value={pulg} onChange={(e) => setPulg(Number(e.target.value))}>
            {DIAMETROS.map((d) => (
              <option key={d.pulg} value={d.pulg}>{d.nombre}</option>
            ))}
          </select>
        </div>
        <div className="campo campo-rango">
          <label htmlFor="campo-velocidad">Velocidad promedio del agua: {fmt(vMax, 1)} m/s</label>
          <input id="campo-velocidad" type="range" min="0.5" max="3" step="0.1" value={vMax}
            onChange={(e) => setVMax(Number(e.target.value))} />
        </div>
      </div>

      {error && <div className="error" role="alert">{error}</div>}
      {!cap && !error && <div className="lab-carga" role="status">Calculando…</div>}

      {cap && (
        <>
          {anim && (
            <Suspense fallback={<div className="escena3d escena3d-carga">Cargando escena 3D…</div>}>
              <Tuberia3D datos={anim} descripcion={descripcion3D} />
            </Suspense>
          )}

          <dl className="lecturas">
            <div className="lectura lectura-principal">
              <dt>Caudal que pasa (Q = A·v)</dt>
              <dd>{fmt(cap.q_lmin)} <small>L/min</small></dd>
            </div>
            <div className="lectura">
              <dt>Área de la sección</dt>
              <dd>{fmt(cap.area_cm2, 2)} <small>cm²</small></dd>
            </div>
            <div className="lectura">
              <dt>Velocidad en el centro</dt>
              <dd>{fmt(cap.v_centro, 2)} <small>m/s</small></dd>
            </div>
            <div className="lectura">
              <dt>Número de Reynolds</dt>
              <dd>
                {Math.round(cap.reynolds).toLocaleString("es")}{" "}
                <small className={`regimen ${cap.regimen}`}>{cap.regimen}</small>
              </dd>
            </div>
          </dl>

          {perfil && (
            <section className="perfil" aria-labelledby="perfil-titulo">
              <h2 id="perfil-titulo">Por qué el caudal es una integral</h2>
              <p>
                La velocidad no es igual en todo el tubo: pegada a la pared casi no avanza y en el
                centro va más rápido. Para sumar el caudal hay que dividir la sección en anillos
                delgados, calcular el agua que pasa por cada uno (velocidad × área del anillo) y
                sumarlos todos:
              </p>
              <p className="ecuacion">Q = ∫₀ᴿ v(r) · 2πr dr</p>
              <p>
                La gráfica muestra v(r) para el régimen <strong>{perfil.regimen}</strong> que
                corresponde a este caso.
              </p>
              <PerfilChart perfil={perfil} />
              <div className="aviso aviso-ok" role="status">
                Sumando los anillos del perfil se obtiene{" "}
                <strong>{fmt(perfil.q_integral_lmin, 2)} L/min</strong>, que coincide con la fórmula
                simple Q = A·v ({fmt(perfil.q_formula_lmin, 2)} L/min)
                {errorIntegral != null && ` — diferencia ${fmt(errorIntegral, 2)} %`}.
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
