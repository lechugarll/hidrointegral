"""Pone la dirección real del sitio donde el proyecto usa un marcador de ejemplo.

Uso (desde la raíz del proyecto, ya conociendo la dirección que te dio el hosting):
    python scripts/poner_dominio.py https://hidrointegral.onrender.com

Cambia `https://hidrointegral.example.com` por tu dirección en frontend/index.html,
frontend/public/sitemap.xml y frontend/public/robots.txt (enlace canónico, vista
previa al compartir y mapa del sitio). Después hay que volver a publicar.
"""
import sys
from pathlib import Path

MARCADOR = "https://hidrointegral.example.com"
ARCHIVOS = ("frontend/index.html", "frontend/public/sitemap.xml", "frontend/public/robots.txt")


def poner_dominio(raiz: Path, url: str) -> int:
    """Devuelve cuántos archivos cambió."""
    url = url.rstrip("/")
    if not url.startswith("https://"):
        raise ValueError("La dirección debe empezar con https://")
    cambiados = 0
    for rel in ARCHIVOS:
        ruta = raiz / rel
        texto = ruta.read_text(encoding="utf-8")
        if MARCADOR in texto:
            ruta.write_text(texto.replace(MARCADOR, url), encoding="utf-8", newline="\n")
            cambiados += 1
    return cambiados


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    try:
        n = poner_dominio(Path(__file__).resolve().parents[1], sys.argv[1])
    except ValueError as exc:
        sys.exit(str(exc))
    print(f"Listo: {n} archivo(s) actualizados con {sys.argv[1].rstrip('/')}")
