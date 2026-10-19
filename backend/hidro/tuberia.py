"""Capacidad de una tubería: Q = A·v, y la integral del perfil de velocidades.

Q = ∫₀ᴿ v(r)·2πr dr. Con perfil laminar sale Q = πR²·v_c/2 y con la ley 1/7
(turbulento) Q = (49/60)·πR²·v_c. En ambos casos Q = A·V con V la velocidad promedio.
"""
import math

import numpy as np

RHO = 1000.0   # kg/m³, agua
MU = 0.001     # Pa·s, agua

# Diámetros nominales comerciales en pulgadas (el interno real es algo menor).
DIAMETROS_PULG = {"1/2": 0.5, "3/4": 0.75, "1": 1.0, "1 1/4": 1.25, "1 1/2": 1.5, "2": 2.0}
MM_POR_PULG = 25.4


def area_m2(d_mm: float) -> float:
    return math.pi * (d_mm / 1000) ** 2 / 4


def caudal_lmin(d_mm: float, v_prom: float) -> float:
    """Q (L/min) = A (m²) · v (m/s) · 60 000."""
    return area_m2(d_mm) * v_prom * 60000


def reynolds(v_prom: float, d_mm: float) -> float:
    return RHO * v_prom * (d_mm / 1000) / MU


def regimen(re: float) -> str:
    if re < 2300:
        return "laminar"
    if re > 4000:
        return "turbulento"
    return "transicion"


def razon_vmax_vprom(reg: str) -> float:
    """v_centro / v_promedio: 2 en laminar, 60/49 en turbulento (ley 1/7)."""
    return 2.0 if reg == "laminar" else 60 / 49


def perfil(s: float, reg: str) -> float:
    """v(r)/v_centro con s = r/R."""
    return 1 - s ** 2 if reg == "laminar" else (1 - s) ** (1 / 7)


def caudal_por_integral(d_mm: float, v_centro: float, reg: str, n: int = 20000) -> float:
    """Suma de anillos (punto medio) de v(r)·2πr·dr, en L/min."""
    R = d_mm / 2000
    dr = R / n
    r = (np.arange(n) + 0.5) * dr
    v = v_centro * np.array([perfil(x / R, reg) for x in r])
    return float(np.sum(v * 2 * math.pi * r * dr) * 60000)


def velocidad_limite_laminar(d_mm: float) -> float:
    """Velocidad promedio con Re = 2300 (por encima deja de ser laminar)."""
    return 2300 * MU / (RHO * d_mm / 1000)


def capacidad(d_mm: float, v_max: float = 2.0) -> dict:
    """Caudal de diseño de una tubería para una velocidad promedio elegida."""
    re = reynolds(v_max, d_mm)
    reg = regimen(re)
    vc = v_max * razon_vmax_vprom("laminar" if reg == "laminar" else "turbulento")
    return {
        "diametro_mm": d_mm,
        "area_cm2": area_m2(d_mm) * 1e4,
        "v_promedio": v_max,
        "v_centro": vc,
        "reynolds": re,
        "regimen": reg,
        "q_lmin": caudal_lmin(d_mm, v_max),
    }


def tabla_capacidad(velocidades=(1.5, 2.0, 3.0)) -> list:
    filas = []
    for nombre, pulg in DIAMETROS_PULG.items():
        d = pulg * MM_POR_PULG
        filas.append({"nominal": nombre, "diametro_mm": d, "area_cm2": area_m2(d) * 1e4,
                      "q_lmin": {str(v): caudal_lmin(d, v) for v in velocidades}})
    return filas


def poiseuille_lmin(delta_p: float, d_mm: float, longitud: float) -> float:
    """Q = πΔP R⁴ / (8 μ L), solo flujo laminar. ΔP en Pa, L en m. Devuelve L/min."""
    R = d_mm / 2000
    return math.pi * delta_p * R ** 4 / (8 * MU * longitud) * 60000
