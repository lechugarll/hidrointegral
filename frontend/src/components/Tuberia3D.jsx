import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ajustarCamara, añadirLuces, crearTanque, limpiar, spriteCircular } from "../three/utils.js";

// Unidades de escena que avanza una partícula por cada (m/s · s). Es un factor
// visual: la velocidad real (p. ej. 2 m/s) cruzaría el tubo en un instante.
const VEL_VISUAL = 0.22;
const COLOR_LENTO = new THREE.Color("#3b82f6"); // cerca de la pared
const COLOR_RAPIDO = new THREE.Color("#e0f2fe"); // cerca del eje

// Escena: depósito de origen → tubería → depósito de destino.
const RT = 1.2; // radio de los depósitos
const HT = 2.8; // alto de los depósitos
const Y_TUBO = -HT / 2 + 0.85; // eje del tubo, cerca del fondo de los depósitos
const ENTRA = 0.6; // cuánto penetra el tubo dentro de cada depósito

/**
 * Simulación 3D del agua yendo de un depósito a otro por una tubería.
 * `datos` viene de la API de Python (/tuberia/animacion): posición radial,
 * ángulo y velocidad relativa de cada partícula, según el perfil v(r).
 */
export default function Tuberia3D({ datos, descripcion }) {
  const contenedor = useRef(null);
  const api = useRef(null);
  const [corriendo, setCorriendo] = useState(
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const corriendoRef = useRef(corriendo);
  const [sinWebGL, setSinWebGL] = useState(false);

  useEffect(() => {
    corriendoRef.current = corriendo;
  }, [corriendo]);

  // Crea la escena una sola vez.
  useEffect(() => {
    const el = contenedor.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setSinWebGL(true);
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.style.display = "block";
    el.appendChild(renderer.domElement);

    const escena = new THREE.Scene();
    const camara = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camara.position.set(1.2, 2.8, 10);
    const controles = new OrbitControls(camara, renderer.domElement);
    controles.target.set(0, -0.2, 0);
    controles.enableDamping = true;
    controles.minDistance = 4;
    controles.maxDistance = 24;
    añadirLuces(escena);

    const grupoTubo = new THREE.Group();
    escena.add(grupoTubo);

    // Estado de la simulación (se actualiza con cada respuesta de la API).
    let N = 0;
    let s = [];
    let theta = [];
    let u = [];
    let z = new Float32Array(0);
    let pos = new Float32Array(0);
    let col = new Float32Array(0);
    let puntos = null;
    let R = 0.4;
    let L = 6;
    let vProm = 2;
    let agit = 0;
    const sprite = spriteCircular();
    const matPuntos = new THREE.PointsMaterial({
      size: 0.1, map: sprite, vertexColors: true, transparent: true, opacity: 0.95,
      depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
    });

    function construirEscena() {
      limpiar(grupoTubo);
      const xTanque = L / 2 + RT; // centro de cada depósito
      const origen = crearTanque(RT, HT, 0.85);
      origen.grupo.position.x = -xTanque;
      const destino = crearTanque(RT, HT, 0.5);
      destino.grupo.position.x = xTanque;
      grupoTubo.add(origen.grupo, destino.grupo);

      const largoTubo = L + 2 * ENTRA;
      const vidrio = new THREE.Mesh(
        new THREE.CylinderGeometry(R, R, largoTubo, 40, 1, true),
        new THREE.MeshPhysicalMaterial({
          color: 0x9bd1ff, transparent: true, opacity: 0.22, roughness: 0.08,
          metalness: 0.1, side: THREE.DoubleSide, depthWrite: false,
        })
      );
      vidrio.rotation.z = Math.PI / 2; // el eje del cilindro pasa de Y a X
      vidrio.position.y = Y_TUBO;
      grupoTubo.add(vidrio);
      // Aros de refuerzo; los de las paredes de los depósitos son las bridas.
      for (let i = 0; i <= 6; i++) {
        const brida = i === 0 || i === 6;
        const aro = new THREE.Mesh(
          new THREE.TorusGeometry(R * 1.02, brida ? 0.06 : 0.02, 10, 48),
          new THREE.MeshStandardMaterial({
            color: brida ? 0x94a3b8 : 0xbae6fd, metalness: 0.6, roughness: 0.35,
          })
        );
        aro.rotation.y = Math.PI / 2;
        aro.position.set(-L / 2 + (L * i) / 6, Y_TUBO, 0);
        grupoTubo.add(aro);
      }
    }

    // Coloca las partículas; `paso` es cuánto avanzan en este fotograma.
    function colocar(paso) {
      const Lt = L + 2 * ENTRA;
      for (let i = 0; i < N; i++) {
        z[i] += u[i] * paso;
        if (z[i] > Lt) z[i] -= Lt; // al salir por un depósito, vuelve a entrar por el otro
        const r = s[i] * R * 0.94;
        const jy = agit ? (Math.random() - 0.5) * 2 * agit * R : 0;
        const jz = agit ? (Math.random() - 0.5) * 2 * agit * R : 0;
        pos[3 * i] = z[i] - Lt / 2;
        pos[3 * i + 1] = Y_TUBO + r * Math.sin(theta[i]) + jy;
        pos[3 * i + 2] = r * Math.cos(theta[i]) + jz;
      }
      if (puntos) puntos.geometry.attributes.position.needsUpdate = true;
    }

    function actualizar(d) {
      const p = d.particulas;
      const cambia = d.radio_visual !== R || d.largo_visual !== L || grupoTubo.children.length === 0;
      R = d.radio_visual;
      L = d.largo_visual;
      vProm = d.v_promedio;
      agit = d.agitacion;
      s = p.s;
      theta = p.theta;
      u = p.u;
      if (!puntos || p.s.length !== N) {
        N = p.s.length;
        z = Float32Array.from(p.z0, (v) => v * (L + 2 * ENTRA));
        pos = new Float32Array(N * 3);
        col = new Float32Array(N * 3);
        if (puntos) {
          escena.remove(puntos);
          puntos.geometry.dispose();
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        g.setAttribute("color", new THREE.BufferAttribute(col, 3));
        puntos = new THREE.Points(g, matPuntos);
        puntos.frustumCulled = false;
        escena.add(puntos);
      }
      // Color según la velocidad: lento (azul) cerca de la pared, rápido (claro) en el eje.
      const umax = Math.max(...u, 1e-9);
      const c = new THREE.Color();
      for (let i = 0; i < N; i++) {
        c.copy(COLOR_LENTO).lerp(COLOR_RAPIDO, Math.pow(u[i] / umax, 1.5));
        col[3 * i] = c.r;
        col[3 * i + 1] = c.g;
        col[3 * i + 2] = c.b;
      }
      puntos.geometry.attributes.color.needsUpdate = true;
      if (cambia) construirEscena();
      colocar(0);
    }

    // Controles accesibles: los botones de la interfaz llaman a estas funciones.
    const ejeY = new THREE.Vector3(0, 1, 0);
    api.current = {
      actualizar,
      rotar(ang) {
        const off = camara.position.clone().sub(controles.target).applyAxisAngle(ejeY, ang);
        camara.position.copy(controles.target).add(off);
      },
      acercar(factor) {
        const off = camara.position.clone().sub(controles.target);
        const len = Math.min(Math.max(off.length() * factor, controles.minDistance), controles.maxDistance);
        camara.position.copy(controles.target).add(off.setLength(len));
      },
    };

    const ajustar = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camara.aspect = w / h;
      camara.updateProjectionMatrix();
      ajustarCamara(camara, controles, L / 2 + 2 * RT + 1.4, 10);
    };
    const ro = new ResizeObserver(ajustar);
    ro.observe(el);
    ajustar();

    const reloj = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      const dt = Math.min(reloj.getDelta(), 0.05);
      if (corriendoRef.current && N) colocar(vProm * VEL_VISUAL * dt);
      controles.update();
      renderer.render(escena, camara);
    });

    return () => {
      api.current = null;
      ro.disconnect();
      renderer.setAnimationLoop(null);
      controles.dispose();
      limpiar(grupoTubo);
      if (puntos) puntos.geometry.dispose();
      matPuntos.dispose();
      sprite.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, []);

  // Cada respuesta nueva de la API actualiza la escena sin recrearla.
  useEffect(() => {
    if (datos) api.current?.actualizar(datos);
  }, [datos]);

  if (sinWebGL) {
    return (
      <div className="aviso" role="status">
        Tu navegador o dispositivo no admite gráficos 3D (WebGL). Puedes ver el perfil de
        velocidades en la gráfica 2D de abajo.
      </div>
    );
  }

  return (
    <figure className="escena3d-fig">
      <div className="escena3d" ref={contenedor} role="img" aria-label={descripcion} />
      <div className="escena3d-barra" role="toolbar" aria-label="Controles de la simulación 3D">
        <button type="button" className="secundario" aria-pressed={!corriendo}
          onClick={() => setCorriendo((v) => !v)}>
          {corriendo ? "Pausar animación" : "Reanudar animación"}
        </button>
        <button type="button" className="secundario" onClick={() => api.current?.rotar(-0.4)}>
          Girar a la izquierda
        </button>
        <button type="button" className="secundario" onClick={() => api.current?.rotar(0.4)}>
          Girar a la derecha
        </button>
        <button type="button" className="secundario" onClick={() => api.current?.acercar(0.8)}>
          Acercar
        </button>
        <button type="button" className="secundario" onClick={() => api.current?.acercar(1.25)}>
          Alejar
        </button>
      </div>
      <figcaption className="escena3d-leyenda">
        <span className="escena3d-gradiente" aria-hidden="true" />
        <span>
          Cada punto es una partícula de agua: <strong>azul = lenta</strong> (cerca de la pared),{" "}
          <strong>clara = rápida</strong> (en el centro). El perfil de velocidades de abajo mide
          justo eso, y su área es lo que integra Q = ∫ v(r)·2πr dr. Animación esquemática: las
          velocidades relativas siguen el perfil real, pero el tamaño y la rapidez en pantalla
          están escalados. Arrastra para girar y usa la rueda para acercar.
        </span>
      </figcaption>
    </figure>
  );
}
