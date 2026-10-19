"""Datos para la animación 3D del agua dentro de la tubería.

Python calcula la física; el navegador solo dibuja. Cada partícula es una "gota
marcada" con tres números fijos:
  s     = r/R, su distancia relativa al eje (0 = centro, 1 = pared)
  theta = su ángulo alrededor del eje
  u     = v(r)/v_promedio, cuántas veces más rápido que el promedio se mueve

Las partículas se reparten de forma uniforme por ÁREA de la sección (s = √U con
U uniforme en [0,1]). Por eso el promedio de u vale 1: es la misma idea de
Q = ∫ v(r)·2πr dr = A·v_promedio, ahora vista como un conjunto de partículas.
"""
import numpy as np

from . import tuberia

# Tamaño visual de la escena (unidades de la escena 3D, no metros).
LARGO_VISUAL = 6.0  # largo del tubo entre las paredes de los dos depósitos
RADIO_MIN, RADIO_MAX = 0.28, 0.5  # el tubo es delgado frente a los depósitos (radio 1.2)
D_REF_MM = 50.8  # 2", el diámetro más grande del catálogo

# Amplitud de la agitación radial: el flujo turbulento fluctúa, el laminar no.
AGITACION = {"laminar": 0.0, "transicion": 0.015, "turbulento": 0.03}


def radio_visual(d_mm: float) -> float:
    """Radio del tubo en la escena: crece con el diámetro real, entre RADIO_MIN y RADIO_MAX."""
    frac = min(max(d_mm / D_REF_MM, 0.0), 1.0)
    return RADIO_MIN + (RADIO_MAX - RADIO_MIN) * frac


def razon_velocidad(s: np.ndarray, reg: str) -> np.ndarray:
    """u(s) = v(r)/v_promedio para el régimen dado (usa el perfil de tuberia.py)."""
    vc_sobre_vprom = tuberia.razon_vmax_vprom(reg)
    if reg == "laminar":
        return vc_sobre_vprom * (1 - s ** 2)
    return vc_sobre_vprom * (1 - s) ** (1 / 7)


def simular(d_mm: float, v_prom: float, n: int = 900, semilla: int = 42) -> dict:
    """Partículas y metadatos para animar el flujo de una tubería.

    La semilla es fija: al mover los controles las partículas conservan su
    posición angular y radial, y solo cambian de velocidad (no "saltan").
    """
    if n < 1:
        raise ValueError("n debe ser al menos 1.")
    c = tuberia.capacidad(d_mm, v_prom)
    # El perfil laminar o turbulento sale del régimen; en transición se usa turbulento.
    reg_perfil = "laminar" if c["regimen"] == "laminar" else "turbulento"

    rng = np.random.default_rng(semilla)
    s = np.sqrt(rng.random(n))            # uniforme por área
    theta = rng.random(n) * 2 * np.pi
    z0 = rng.random(n)                    # posición inicial a lo largo del tubo (0..1)
    u = razon_velocidad(s, reg_perfil)

    # Perfil muestreado en 11 puntos, para dibujar las flechas de la salida.
    s_flechas = np.linspace(0, 1, 11)
    r4 = lambda a: np.round(a, 4).tolist()
    return {
        "regimen": c["regimen"],
        "reynolds": c["reynolds"],
        "q_lmin": c["q_lmin"],
        "v_promedio": v_prom,
        "v_centro": c["v_centro"],
        "radio_visual": radio_visual(d_mm),
        "largo_visual": LARGO_VISUAL,
        "agitacion": AGITACION[c["regimen"]],
        "particulas": {"s": r4(s), "theta": r4(theta), "z0": r4(z0), "u": r4(u)},
        "flechas": {"s": r4(s_flechas), "u": r4(razon_velocidad(s_flechas, reg_perfil))},
    }
