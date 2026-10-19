// Utilidades compartidas por las escenas 3D (tubería y tanque).
import * as THREE from "three";

// Textura circular suave: las partículas parecen gotas y no cuadrados.
export function spriteCircular() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.4, "rgba(255,255,255,0.6)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

// Libera la memoria de GPU de todo lo que cuelga de un grupo.
export function limpiar(grupo) {
  grupo.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
  });
  grupo.clear();
}

// Luces comunes: una principal, una de contraluz azulada y luz ambiente.
export function añadirLuces(escena) {
  escena.add(new THREE.AmbientLight(0xffffff, 0.9));
  const sol = new THREE.DirectionalLight(0xffffff, 1.6);
  sol.position.set(4, 6, 5);
  escena.add(sol);
  const contraluz = new THREE.DirectionalLight(0x7dd3fc, 0.8);
  contraluz.position.set(-4, 2, -5);
  escena.add(contraluz);
}

const BASE = 0.1; // grosor de la placa del fondo

/**
 * Depósito cilíndrico de vidrio con agua. Se dibuja centrado en el origen del
 * grupo devuelto (alto H, radio R). `setNivel(0..1)` mueve el agua.
 * Las marcas del vidrio señalan el 25, 50, 75 y 100 % del nivel.
 */
export function crearTanque(R, H, nivel = 0.5, colorBorde = 0xbae6fd) {
  const grupo = new THREE.Group();
  const interior = H - BASE;

  const vidrio = new THREE.Mesh(
    new THREE.CylinderGeometry(R, R, H, 48, 1, true),
    new THREE.MeshPhysicalMaterial({
      color: 0x9bd1ff, transparent: true, opacity: 0.14, roughness: 0.08,
      metalness: 0.1, side: THREE.DoubleSide, depthWrite: false,
    })
  );
  const placa = new THREE.Mesh(
    new THREE.CylinderGeometry(R * 1.08, R * 1.1, BASE, 48),
    new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.6, roughness: 0.4 })
  );
  placa.position.y = -H / 2 + BASE / 2;
  const borde = new THREE.Mesh(
    new THREE.TorusGeometry(R, 0.035, 10, 64),
    new THREE.MeshStandardMaterial({ color: colorBorde, metalness: 0.5, roughness: 0.35 })
  );
  borde.rotation.x = Math.PI / 2;
  borde.position.y = H / 2;
  grupo.add(vidrio, placa, borde);

  [0.25, 0.5, 0.75].forEach((f) => {
    const marca = new THREE.Mesh(
      new THREE.TorusGeometry(R * 1.003, 0.012, 6, 64),
      new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.55 })
    );
    marca.rotation.x = Math.PI / 2;
    marca.position.y = -H / 2 + BASE + interior * f;
    grupo.add(marca);
  });

  const agua = new THREE.Mesh(
    new THREE.CylinderGeometry(R * 0.97, R * 0.97, 1, 48),
    new THREE.MeshPhysicalMaterial({
      color: 0x0ea5e9, transparent: true, opacity: 0.5, roughness: 0.15, depthWrite: false,
    })
  );
  const superficie = new THREE.Mesh(
    new THREE.CircleGeometry(R * 0.97, 48),
    new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false })
  );
  superficie.rotation.x = -Math.PI / 2;
  grupo.add(agua, superficie);

  function setNivel(n) {
    const h = Math.max(Math.min(n, 1), 0.0005) * interior;
    agua.scale.y = h;
    agua.position.y = -H / 2 + BASE + h / 2;
    superficie.position.y = -H / 2 + BASE + h;
    superficie.visible = n > 0.002;
  }
  setNivel(nivel);

  return {
    grupo,
    borde,
    setNivel,
    // Altura (en coordenadas del grupo) de la superficie del agua para `n`.
    alturaAgua: (n) => -H / 2 + BASE + Math.max(Math.min(n, 1), 0) * interior,
  };
}

// Mantiene el tubo/tanque dentro del encuadre aunque el panel sea estrecho.
export function ajustarCamara(camara, controles, mitadAncho, distMin = 8) {
  const necesaria = mitadAncho / (Math.tan(THREE.MathUtils.degToRad(camara.fov / 2)) * camara.aspect);
  const dist = Math.min(Math.max(distMin, necesaria), controles.maxDistance);
  const off = camara.position.clone().sub(controles.target).setLength(dist);
  camara.position.copy(controles.target).add(off);
}
