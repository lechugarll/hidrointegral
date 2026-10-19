import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import CaudalChart from "./CaudalChart.jsx";
import AjusteLlave from "./AjusteLlave.jsx";
import { ESCENARIOS, ESCENARIO_PROPIO, porId } from "../escenarios.js";
import { fmt, instanteEn, interp } from "../util/numeros.js";

// Three.js pesa bastante: solo se descarga cuando se abre esta página.
const Tanque3D = lazy(() => import("./Tanque3D.jsx"));

const DURACION = 12; // segundos que tarda la animación completa a velocidad normal
const VELOCIDADES = [
  { valor: 0.5, texto: "Lenta" },
  { valor: 1, texto: "Normal" },
  { valor: 2, texto: "Rápida" },
];

// Miniatura de q(t) para el selector (solo dibujo; los cálculos vienen de la API).
function Miniatura({ f, a, b }) {
  if (!f) {
    return (
      <svg className="mini" viewBox="0 0 80 32" aria-hidden="true">
        <text x="40" y="22" textAnchor="middle" className="mini-texto">f(t)=?</text>
      </svg>
    );
  }
  const n = 32;
  const vals = Array.from({ length: n }, (_, i) => f(a + ((b - a) * i) / (n - 1)));
  const max = Math.max(...vals) * 1.1 || 1;
  const d = vals.map((v, i) => `${i ? "L" : "M"}${(2 + (76 * i) / (n - 1)).toFixed(1)},${(30 - (v / max) * 26).toFixed(1)}`).join(" ");
  return (
    <svg className="mini" viewBox="0 0 80 32" aria-hidden="true">
      <path d={`${d} L78,30 L2,30 Z`} className="mini-area" />
      <path d={d} className="mini-linea" />
    </svg>
  );
}

export default function LaboratorioVolumen({
  escId, onElegir, params, capacidad, onCapacidad, datos, cargando, error, onAplicarPropio,
  llave, onLlave,
}) {
  const esc = porId(escId);
  const ac = datos?.acumulada;
  // Los límites salen de los datos recibidos: así gráfica y animación nunca se desfasan.
  const a = ac ? ac.t[0] : params.a;
  const b = ac ? ac.t[ac.t.length - 1] : params.b;
  const reducido = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);

  const [t, setT] = useState(a);
  const tRef = useRef(a);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [velocidad, setVelocidad] = useState(1);
  const [mostrarPromedio, setMostrarPromedio] = useState(false);

  // Campos del escenario «Mi propia función».
  const [propio, setPropio] = useState({ q: ESCENARIO_PROPIO.q, a: "0", b: "5", capacidad: "60" });
  const [errPropio, setErrPropio] = useState("");

  // Cuando llegan datos nuevos (otra situación), la animación vuelve al inicio y arranca.
  useEffect(() => {
    if (!datos) return;
    tRef.current = a;
    setT(a);
    setReproduciendo(!reducido);
  }, [datos, a, reducido]);

  // Reloj de la animación: avanza t según el tiempo real transcurrido.
  useEffect(() => {
    if (!reproduciendo || !datos) return undefined;
    let raf;
    let previo = performance.now();
    const paso = (ahora) => {
      const dt = (ahora - previo) / 1000;
      previo = ahora;
      tRef.current = Math.min(tRef.current + (dt * velocidad * (b - a)) / DURACION, b);
      setT(tRef.current);
      if (tRef.current >= b) {
        setReproduciendo(false);
        return;
      }
      raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [reproduciendo, datos, velocidad, a, b]);

  function alternar() {
    if (!reproduciendo && tRef.current >= b) {
      tRef.current = a;
      setT(a);
    }
    setReproduciendo((r) => !r);
  }

  function irA(valor) {
    tRef.current = valor;
    setT(valor);
    setReproduciendo(false);
  }

  function aplicarPropio(ev) {
    ev.preventDefault();
    const na = Number(propio.a);
    const nb = Number(propio.b);
    const cap = Number(propio.capacidad);
    if (!propio.q.trim()) return setErrPropio("Escribe la función del caudal, por ejemplo 4+2*t.");
    if (propio.q.length > 200) return setErrPropio("La función es demasiado larga.");
    if (!Number.isFinite(na) || !Number.isFinite(nb) || nb <= na)
      return setErrPropio("El tiempo final debe ser mayor que el inicial.");
    if (!(cap > 0)) return setErrPropio("La capacidad del tanque debe ser un número positivo.");
    setErrPropio("");
    onAplicarPropio({ q: propio.q.trim(), a: na, b: nb, capacidad: cap });
  }

  // --- Lecturas en vivo ---
  const lectura = useMemo(() => {
    if (!ac) return null;
    const qAct = Math.max(interp(ac.t, ac.q, t), 0);
    const vAct = interp(ac.t, ac.V, t);
    const qMax = Math.max(datos.q_max_intervalo, 1e-9);
    const vTotal = ac.V[ac.V.length - 1];
    return {
      qAct, vAct, qMax, vTotal,
      nivel: vAct / capacidad,
      caudalRel: Math.min(qAct / qMax, 1),
      tLleno: instanteEn(ac.t, ac.V, capacidad),
    };
  }, [ac, datos, t, capacidad]);

  const desborda = lectura ? lectura.vAct > capacidad + 1e-9 : false;
  const qMinNegativo = ac ? Math.min(...ac.q) < -1e-9 : false;

  const descripcion3D = lectura
    ? `Tanque con una tubería que lo llena. Ahora hay ${fmt(Math.min(lectura.vAct, capacidad))} litros de ${fmt(capacidad, 0)}, entrando ${fmt(lectura.qAct)} litros por minuto.`
    : "Tanque 3D que se llena";
  const descripcionGrafica = lectura
    ? `Gráfica del caudal contra el tiempo. En t = ${fmt(t)} min el caudal es ${fmt(lectura.qAct)} L/min y el área acumulada vale ${fmt(lectura.vAct)} litros.`
    : "Gráfica del caudal contra el tiempo";

  return (
    <section className="lab" aria-labelledby="lab-titulo">
      <h2 id="lab-titulo" className="lab-titulo">Elige una situación y mira cómo se llena el tanque</h2>

      <div className="selector" role="group" aria-label="Situaciones de ejemplo">
        {[...ESCENARIOS, ESCENARIO_PROPIO].map((e) => (
          <button
            key={e.id}
            type="button"
            className={`opcion ${e.id === escId ? "activa" : ""}`}
            aria-pressed={e.id === escId}
            onClick={() => onElegir(e.id)}
          >
            <Miniatura f={e.f} a={e.a} b={e.b} />
            <span className="opcion-nombre">{e.nombre}</span>
          </button>
        ))}
      </div>

      <div className="porque">
        <p>
          <strong>¿Por qué el caudal tiene esta forma?</strong> {esc.porque}
        </p>
        <p className="porque-formula">
          q(t) = <code>{params.q}</code> <span>L/min, de t = {a} a t = {b} min</span>
        </p>
      </div>

      {escId === "llave" && <AjusteLlave valores={llave} onChange={onLlave} />}

      {escId === "propio" && (
        <form className="propio" onSubmit={aplicarPropio} noValidate>
          <div className="campo campo-ancho">
            <label htmlFor="propio-q">Caudal q(t), en litros por minuto</label>
            <input id="propio-q" value={propio.q} spellCheck="false" autoComplete="off"
              onChange={(e) => setPropio({ ...propio, q: e.target.value })} aria-invalid={!!errPropio} />
          </div>
          <div className="campo">
            <label htmlFor="propio-a">Desde t (min)</label>
            <input id="propio-a" type="number" value={propio.a} step="0.5"
              onChange={(e) => setPropio({ ...propio, a: e.target.value })} />
          </div>
          <div className="campo">
            <label htmlFor="propio-b">Hasta t (min)</label>
            <input id="propio-b" type="number" value={propio.b} step="0.5"
              onChange={(e) => setPropio({ ...propio, b: e.target.value })} />
          </div>
          <div className="campo">
            <label htmlFor="propio-cap">Capacidad del tanque (L)</label>
            <input id="propio-cap" type="number" value={propio.capacidad} step="5" min="1"
              onChange={(e) => setPropio({ ...propio, capacidad: e.target.value })} />
          </div>
          <button className="principal" type="submit" disabled={cargando}>Ver mi función</button>
          {errPropio && <p className="campo-error campo-error-ancho" role="alert">{errPropio}</p>}
        </form>
      )}

      {error && <div className="error" role="alert">{error}</div>}
      {qMinNegativo && (
        <div className="aviso" role="status">
          Ojo: esta función da caudales negativos en parte del intervalo, es decir, agua saliendo del
          tanque. El área bajo el eje cuenta como volumen que sale.
        </div>
      )}

      {!datos && !error && <div className="lab-carga" role="status">Calculando…</div>}

      {datos && lectura && (
        <div className="lab-cuerpo">
          <figure className="escena-col">
            <div className="escena-marco">
              <Suspense fallback={<div className="tanque3d-lienzo tanque3d-carga">Cargando escena 3D…</div>}>
                <Tanque3D
                  nivel={lectura.nivel}
                  caudalRel={reproduciendo ? lectura.caudalRel : 0}
                  desborda={desborda}
                  descripcion={descripcion3D}
                />
              </Suspense>
              <div className="escena-lectura" aria-hidden="true">
                <span className="escena-pct">{fmt(Math.min(lectura.nivel, 1) * 100, 0)} %</span>
                <span className="escena-lit">
                  {fmt(Math.min(lectura.vAct, capacidad))} de {fmt(capacidad, 0)} L
                </span>
              </div>
            </div>
            <figcaption>
              El nivel del tanque es <strong>V(t) ÷ capacidad</strong>. La válvula gira más rápido
              cuando el caudal es mayor.
            </figcaption>
          </figure>

          <div className="grafica-col">
            <CaudalChart
              datos={ac}
              cursor={t}
              a={a}
              b={b}
              promedio={datos.promedio}
              mostrarPromedio={mostrarPromedio}
              onCursor={irA}
              descripcion={descripcionGrafica}
            />
            <p className="leyenda-grafica">
              La curva es el caudal <strong>q(t)</strong>. El <span className="rotulo-area">área sombreada</span> es
              el agua que ya entró. Arrastra sobre la gráfica para viajar en el tiempo.
            </p>
          </div>

          <div className="mando" role="group" aria-label="Control de la animación">
            <button type="button" className="principal" onClick={alternar}>
              {reproduciendo ? "Pausar" : t >= b ? "Repetir" : "Reproducir"}
            </button>
            <div className="mando-tiempo">
              <label htmlFor="cursor-t" className="sr-only">Instante de tiempo</label>
              <input
                id="cursor-t"
                type="range"
                min={a}
                max={b}
                step={(b - a) / 400}
                value={t}
                onChange={(e) => irA(Number(e.target.value))}
                aria-valuetext={`t = ${fmt(t)} minutos`}
              />
            </div>
            <div className="campo campo-corto">
              <label htmlFor="velocidad">Velocidad</label>
              <select id="velocidad" value={velocidad} onChange={(e) => setVelocidad(Number(e.target.value))}>
                {VELOCIDADES.map((v) => (
                  <option key={v.valor} value={v.valor}>{v.texto}</option>
                ))}
              </select>
            </div>
            <div className="campo campo-corto">
              <label htmlFor="capacidad">Capacidad del tanque (L)</label>
              <input id="capacidad" type="number" min="1" step="5" value={capacidad}
                onChange={(e) => onCapacidad(Number(e.target.value) > 0 ? Number(e.target.value) : 1)} />
            </div>
            <label className="interruptor">
              <input type="checkbox" checked={mostrarPromedio} onChange={(e) => setMostrarPromedio(e.target.checked)} />
              <span>Comparar con caudal constante</span>
            </label>
          </div>

          <dl className="lecturas" aria-live="off">
            <div className="lectura">
              <dt>Tiempo</dt>
              <dd>{fmt(t)} <small>min</small></dd>
            </div>
            <div className="lectura">
              <dt>Entra ahora</dt>
              <dd>{fmt(lectura.qAct)} <small>L/min</small></dd>
            </div>
            <div className="lectura lectura-principal">
              <dt>Agua acumulada V(t)</dt>
              <dd>{fmt(lectura.vAct)} <small>litros</small></dd>
            </div>
            <div className="lectura">
              <dt>Al final (t = {b})</dt>
              <dd>{fmt(lectura.vTotal)} <small>litros</small></dd>
            </div>
          </dl>

          {desborda && (
            <div className="aviso aviso-rebose" role="status">
              El tanque de {fmt(capacidad, 0)} L ya está lleno: desde t = {fmt(lectura.tLleno ?? t)} min el
              agua se derrama. Hacen falta al menos {fmt(lectura.vTotal)} L de capacidad.
            </div>
          )}

          {mostrarPromedio && (
            <p className="nota-promedio">
              El rectángulo punteado tiene <strong>la misma área</strong> que la curva: con un caudal fijo de{" "}
              <strong>{fmt(datos.promedio)} L/min</strong> el tanque recibiría exactamente los mismos{" "}
              {fmt(lectura.vTotal)} L. Por eso el caudal promedio es V ÷ (b − a) = {fmt(lectura.vTotal)} ÷{" "}
              {fmt(b - a, 0)}.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
