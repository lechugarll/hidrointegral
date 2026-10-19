"""Genera un GIF 3D del agua yendo de un depósito a otro por una tubería, solo con
Python (matplotlib).

Usa el mismo motor de partículas que la web (animacion.simular): cada partícula
avanza según el perfil v(r) del régimen, así que el GIF muestra la misma física.
La composición es la misma que en la web: depósito de origen → tubería → depósito
de destino.

Uso (desde la carpeta backend):
    python -m hidro.render_gif --diametro 1 --velocidad 2 --salida ../informe/animacion_tuberia.gif
"""
import argparse
import io

import matplotlib

matplotlib.use("Agg")  # sin ventana: dibuja directo a imagen
import matplotlib.pyplot as plt
import numpy as np
from PIL import Image

from . import animacion, tuberia

FONDO = "#0b1326"
COLOR_LENTO = np.array([0x3b, 0x82, 0xf6]) / 255  # azul: cerca de la pared
COLOR_RAPIDO = np.array([0xe0, 0xf2, 0xfe]) / 255  # claro: en el eje
PASO_VISUAL = 0.12  # unidades de escena por fotograma para u·(v/2) = 1

# Mismas medidas que la escena web (Tuberia3D.jsx).
RT, HT = 1.2, 2.8  # radio y alto de los depósitos
Y_TUBO = -HT / 2 + 0.85  # altura del eje del tubo
ENTRA = 0.6  # cuánto penetra el tubo en cada depósito


def _colores(u: np.ndarray) -> np.ndarray:
    """Azul (lento) → claro (rápido), igual que la escena web."""
    t = (u / max(u.max(), 1e-9)) ** 1.5
    return COLOR_LENTO + (COLOR_RAPIDO - COLOR_LENTO) * t[:, None]


def _dibujar_tanque(ax, cx: float, nivel: float) -> None:
    """Depósito de vidrio con agua: aros, generatrices, cuerpo de agua y su superficie."""
    ang = np.linspace(0, 2 * np.pi, 60)
    z_fondo, z_borde = -HT / 2, HT / 2
    for z in np.linspace(z_fondo, z_borde, 5):
        grosor = 2.0 if z in (z_fondo, z_borde) else 0.6
        ax.plot(cx + RT * np.cos(ang), RT * np.sin(ang), np.full_like(ang, z),
                color="#bae6fd", lw=grosor, alpha=0.75, clip_on=False)
    for a in np.linspace(0, 2 * np.pi, 13)[:-1]:
        ax.plot([cx + RT * np.cos(a)] * 2, [RT * np.sin(a)] * 2, [z_fondo, z_borde],
                color="#7dd3fc", lw=0.5, alpha=0.3, clip_on=False)
    # Cuerpo de agua: cilindro hasta `nivel` y su tapa.
    z_agua = z_fondo + 0.1 + nivel * (HT - 0.1)
    th, zz = np.meshgrid(np.linspace(0, 2 * np.pi, 40), np.linspace(z_fondo + 0.1, z_agua, 6))
    ax.plot_surface(cx + 0.97 * RT * np.cos(th), 0.97 * RT * np.sin(th), zz, color="#0ea5e9",
                    alpha=0.28, linewidth=0, shade=False, antialiased=False, clip_on=False)
    rr, th2 = np.meshgrid(np.linspace(0, 0.97 * RT, 4), np.linspace(0, 2 * np.pi, 40))
    ax.plot_surface(cx + rr * np.cos(th2), rr * np.sin(th2), np.full_like(rr, z_agua),
                    color="#7dd3fc", alpha=0.45, linewidth=0, shade=False, antialiased=False,
                    clip_on=False)


def _dibujar_tubo(ax, R: float, L: float) -> None:
    """Tubería entre los depósitos: aros de refuerzo (los extremos son las bridas) y generatrices."""
    ang = np.linspace(0, 2 * np.pi, 48)
    for i, x in enumerate(np.linspace(-L / 2, L / 2, 7)):
        brida = i in (0, 6)
        ax.plot(np.full_like(ang, x), R * np.sin(ang), Y_TUBO + R * np.cos(ang),
                color="#bae6fd", lw=2.0 if brida else 0.7, alpha=0.8, clip_on=False)
    for a in np.linspace(0, 2 * np.pi, 9)[:-1]:
        ax.plot([-L / 2 - ENTRA, L / 2 + ENTRA], [R * np.sin(a)] * 2, [Y_TUBO + R * np.cos(a)] * 2,
                color="#7dd3fc", lw=0.5, alpha=0.4, clip_on=False)


def renderizar(salida: str, diametro_pulg: float = 1.0, v_prom: float = 2.0,
               fotogramas: int = 72, particulas: int = 700, ancho_px: int = 800,
               alto_px: int = 450, fps: int = 20, semilla: int = 42) -> str:
    """Crea el GIF y devuelve su ruta."""
    d_mm = diametro_pulg * tuberia.MM_POR_PULG
    datos = animacion.simular(d_mm, v_prom, n=particulas, semilla=semilla)
    R, L = datos["radio_visual"], datos["largo_visual"]
    Lt = L + 2 * ENTRA
    s = np.array(datos["particulas"]["s"])
    theta = np.array(datos["particulas"]["theta"])
    u = np.array(datos["particulas"]["u"])
    z = np.array(datos["particulas"]["z0"]) * Lt
    agit = datos["agitacion"]
    rng = np.random.default_rng(semilla)
    r = s * R * 0.94

    dpi = 100
    fig = plt.figure(figsize=(ancho_px / dpi, alto_px / dpi), dpi=dpi, facecolor=FONDO)
    ax = fig.add_axes([0, 0, 1, 1], projection="3d", facecolor=FONDO)
    ax.set_axis_off()
    ax.set_proj_type("persp", focal_length=1.0)
    ancho = L / 2 + 2 * RT + 0.3
    ax.set_box_aspect((2 * ancho, 2 * RT * 1.2, HT * 1.2), zoom=1.55)
    ax.set_xlim(-ancho, ancho)
    ax.set_ylim(-RT * 1.2, RT * 1.2)
    ax.set_zlim(-HT * 0.6, HT * 0.6)
    _dibujar_tanque(ax, -(L / 2 + RT), 0.85)  # origen: más lleno
    _dibujar_tanque(ax, L / 2 + RT, 0.5)  # destino
    _dibujar_tubo(ax, R, L)

    colores = _colores(u)

    def posiciones(zz, jy=0, jz=0):
        return zz - Lt / 2, r * np.sin(theta) + jy, Y_TUBO + r * np.cos(theta) + jz

    puntos = ax.scatter(*posiciones(z), s=9, c=colores, depthshade=True, edgecolors="none",
                        clip_on=False)
    fig.text(0.03, 0.93, "HidroIntegral · flujo en tubería", color="#e0f2fe", fontsize=12,
             fontweight="bold")
    fig.text(0.03, 0.885,
             f'{diametro_pulg:g}" · {v_prom:g} m/s · {datos["regimen"]} · Re = {datos["reynolds"]:,.0f}'
             f' · Q = {datos["q_lmin"]:.1f} L/min', color="#9fb3d1", fontsize=9)
    fig.text(0.03, 0.04, "azul = lenta (pared) · clara = rápida (centro)",
             color="#9fb3d1", fontsize=8)

    cuadros = []
    paso = PASO_VISUAL * (v_prom / 2.0)
    for f in range(fotogramas):
        z = (z + u * paso) % Lt
        jy = (rng.random(len(s)) - 0.5) * 2 * agit * R if agit else 0
        jz = (rng.random(len(s)) - 0.5) * 2 * agit * R if agit else 0
        puntos._offsets3d = posiciones(z, jy, jz)
        # Vaivén suave de la cámara; vuelve al inicio al cerrar el ciclo del GIF.
        ax.view_init(elev=16, azim=-72 + 12 * np.sin(2 * np.pi * f / fotogramas))
        buf = io.BytesIO()
        fig.savefig(buf, format="png", facecolor=FONDO, dpi=dpi)
        buf.seek(0)
        img = Image.open(buf).convert("RGB")
        cuadros.append(img.quantize(colors=96, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE))
    plt.close(fig)

    cuadros[0].save(salida, save_all=True, append_images=cuadros[1:], duration=int(1000 / fps),
                    loop=0, optimize=True, disposal=1)
    return salida


def main() -> None:
    p = argparse.ArgumentParser(description="GIF 3D del agua yendo de un depósito a otro por una tubería.")
    p.add_argument("--diametro", type=float, default=1.0, help="diámetro nominal en pulgadas")
    p.add_argument("--velocidad", type=float, default=2.0, help="velocidad promedio en m/s")
    p.add_argument("--salida", default="animacion_tuberia.gif")
    p.add_argument("--fotogramas", type=int, default=72)
    args = p.parse_args()
    print("Escrito:", renderizar(args.salida, args.diametro, args.velocidad, args.fotogramas))


if __name__ == "__main__":
    main()
