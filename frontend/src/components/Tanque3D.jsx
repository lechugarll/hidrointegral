import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ajustarCamara, añadirLuces, crearTanque, limpiar, spriteCircular } from "../three/utils.js";

// Escena del laboratorio: una tubería con válvula vierte agua a un tanque.
//   · el caudal q(t) manda la velocidad del agua y el giro del volante de la válvula,
//   · el volumen acumulado V(t) manda el nivel del tanque.
const R_TANQUE = 1.3;
const H_TANQUE = 3.0;
const Y_TUBO = 2.6; // altura del eje de la tubería de entrada
const X_INICIO = -5; // donde nace la tubería
const Y_BOCA = 1.95; // boca de la tubería, justo sobre el tanque
const N = 280; // partículas de agua

/**
 * `nivel` (0–1) es V(t)/capacidad; `caudalRel` (0–1) es q(t)/q máximo.
 * La escena suaviza los cambios, así que se puede alimentar a 20–60 fps.
 */
export default function Tanque3D({ nivel, caudalRel, desborda, descripcion }) {
  const contenedor = useRef(null);
  const estado = useRef({ nivel, caudalRel, desborda });
  const api = useRef(null);
  const [sinWebGL, setSinWebGL] = useState(false);

  useEffect(() => {
    estado.current = { nivel, caudalRel, desborda };
  }, [nivel, caudalRel, desborda]);

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
    camara.position.set(-0.2, 3.4, 9.8);
    const controles = new OrbitControls(camara, renderer.domElement);
    controles.target.set(-1.9, 0.9, 0);
    controles.enableDamping = true;
    controles.minDistance = 4;
    controles.maxDistance = 22;
    añadirLuces(escena);

    const grupo = new THREE.Group();
    escena.add(grupo);

    // --- Tanque ---
    const tanque = crearTanque(R_TANQUE, H_TANQUE, 0);
    grupo.add(tanque.grupo);
    const yAguaMundo = (n) => tanque.alturaAgua(n); // el tanque está centrado en el origen

    // --- Tubería de entrada: horizontal, codo y tramo vertical hacia el tanque ---
    const matTubo = new THREE.MeshPhysicalMaterial({
      color: 0x9bd1ff, transparent: true, opacity: 0.28, roughness: 0.1, metalness: 0.2,
      side: THREE.DoubleSide, depthWrite: false,
    });
    const matMetal = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.35 });
    const horizontal = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, -X_INICIO, 32, 1, true), matTubo);
    horizontal.rotation.z = Math.PI / 2;
    horizontal.position.set(X_INICIO / 2, Y_TUBO, 0);
    const codo = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 16), matTubo);
    codo.position.set(0, Y_TUBO, 0);
    const vertical = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, Y_TUBO - Y_BOCA, 32, 1, true), matTubo);
    vertical.position.set(0, (Y_TUBO + Y_BOCA) / 2, 0);
    grupo.add(horizontal, codo, vertical);
    [X_INICIO, X_INICIO + 0.9, -0.9].forEach((x) => {
      const brida = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.035, 8, 32), matMetal);
      brida.rotation.y = Math.PI / 2;
      brida.position.set(x, Y_TUBO, 0);
      grupo.add(brida);
    });
    const boca = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.035, 8, 32), matMetal);
    boca.rotation.x = Math.PI / 2;
    boca.position.set(0, Y_BOCA, 0);
    grupo.add(boca);

    // --- Válvula: el volante gira según el caudal ---
    const valvula = new THREE.Group();
    valvula.position.set(-2.6, Y_TUBO, 0);
    const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.5, 24), matMetal);
    cuerpo.rotation.z = Math.PI / 2;
    const vastago = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 12), matMetal);
    vastago.position.y = 0.4;
    const volante = new THREE.Group();
    volante.position.y = 0.68;
    const aro = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.04, 8, 32), new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.3, roughness: 0.4 }));
    aro.rotation.x = Math.PI / 2;
    const rayo1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.035, 0.035), aro.material);
    const rayo2 = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.6), aro.material);
    volante.add(aro, rayo1, rayo2);
    valvula.add(cuerpo, vastago, volante);
    grupo.add(valvula);

    // --- Agua: partículas por la tubería y en caída libre hacia el tanque ---
    const etapa = new Uint8Array(N); // 0 = por la tubería, 1 = cayendo
    const px = new Float32Array(N);
    const py = new Float32Array(N);
    const vy = new Float32Array(N);
    const rx = new Float32Array(N);
    const rz = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      px[i] = X_INICIO + 0.1 + Math.random() * (-X_INICIO - 0.2);
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * 0.15;
      rx[i] = Math.cos(a) * r;
      rz[i] = Math.sin(a) * r;
    }
    const pos = new Float32Array(N * 3);
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const sprite = spriteCircular();
    const matPuntos = new THREE.PointsMaterial({
      size: 0.11, map: sprite, color: 0xcdeeff, transparent: true, opacity: 0.95,
      depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
    });
    const puntos = new THREE.Points(geom, matPuntos);
    puntos.frustumCulled = false;
    escena.add(puntos);

    let nivelVis = 0;
    const colorNormal = new THREE.Color(0xbae6fd);
    const colorRebose = new THREE.Color(0xf87171);

    function paso(dt) {
      const { nivel: nObj, caudalRel: q, desborda: reb } = estado.current;
      nivelVis += (Math.min(nObj, 1) - nivelVis) * Math.min(1, dt * 10);
      tanque.setNivel(nivelVis);
      tanque.borde.material.color.copy(reb ? colorRebose : colorNormal);
      volante.rotation.y += q * dt * 5;
      const vh = 3.2 * q; // velocidad del agua por la tubería
      const yAgua = yAguaMundo(nivelVis);
      for (let i = 0; i < N; i++) {
        if (etapa[i] === 0) {
          px[i] += vh * dt;
          if (px[i] >= 0) {
            etapa[i] = 1;
            py[i] = Y_BOCA;
            vy[i] = -1.2;
          }
        } else {
          vy[i] -= 9 * dt;
          py[i] += vy[i] * dt;
          if (py[i] <= yAgua) {
            etapa[i] = 0; // la gota llegó al agua: vuelve a entrar por el inicio de la tubería
            px[i] = X_INICIO + Math.random() * 0.8;
          }
        }
        if (etapa[i] === 0) {
          pos[3 * i] = px[i];
          pos[3 * i + 1] = Y_TUBO + rx[i];
          pos[3 * i + 2] = rz[i];
        } else {
          pos[3 * i] = rx[i] * 0.6;
          pos[3 * i + 1] = py[i];
          pos[3 * i + 2] = rz[i] * 0.6;
        }
      }
      geom.attributes.position.needsUpdate = true;
    }

    const ejeY = new THREE.Vector3(0, 1, 0);
    api.current = {
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
      ajustarCamara(camara, controles, 4.4, 9.5);
    };
    const ro = new ResizeObserver(ajustar);
    ro.observe(el);
    ajustar();

    const reloj = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      paso(Math.min(reloj.getDelta(), 0.05));
      controles.update();
      renderer.render(escena, camara);
    });

    return () => {
      api.current = null;
      ro.disconnect();
      renderer.setAnimationLoop(null);
      controles.dispose();
      limpiar(grupo);
      geom.dispose();
      matPuntos.dispose();
      sprite.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, []);

  if (sinWebGL) {
    return (
      <div className="aviso" role="status">
        Tu navegador o dispositivo no admite gráficos 3D (WebGL). Las lecturas y la gráfica
        siguen funcionando con normalidad.
      </div>
    );
  }

  return (
    <div className="tanque3d">
      <div className="tanque3d-lienzo" ref={contenedor} role="img" aria-label={descripcion} />
      <div className="tanque3d-giro" role="group" aria-label="Cámara de la escena 3D">
        <button type="button" className="icono" onClick={() => api.current?.rotar(-0.4)} aria-label="Girar a la izquierda">←</button>
        <button type="button" className="icono" onClick={() => api.current?.rotar(0.4)} aria-label="Girar a la derecha">→</button>
        <button type="button" className="icono" onClick={() => api.current?.acercar(0.8)} aria-label="Acercar">+</button>
        <button type="button" className="icono" onClick={() => api.current?.acercar(1.25)} aria-label="Alejar">−</button>
      </div>
    </div>
  );
}
