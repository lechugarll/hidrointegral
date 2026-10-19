"""Servidor único para publicar HidroIntegral: sirve la web y la API en la misma dirección.

  /api/*   →  API de cálculo (hidro.api)
  /salud   →  comprobación de que el servicio está vivo (la usa el hosting)
  el resto →  la web ya compilada (frontend/dist). Las rutas de la web
              (/tuberia, /cookies…) devuelven index.html; las que no existen
              devuelven index.html con estado 404 y la web muestra su página 404.

Correr en local (tras `npm run build` en frontend):
    uvicorn hidro.servidor:principal --port 8080

Detrás de un proxy (Render, Hugging Face…) añadir:
    --proxy-headers --forwarded-allow-ips='*'
para que el límite de peticiones vea la IP real de cada visitante.
"""
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.requests import Request
from starlette.exceptions import HTTPException
from starlette.staticfiles import StaticFiles

from .api import app as api_app

# backend/hidro/servidor.py → raíz del proyecto → frontend/dist
DIST = Path(os.getenv("HIDRO_DIST", Path(__file__).resolve().parents[2] / "frontend" / "dist"))
RUTAS_WEB = {"", "tuberia", "privacidad", "terminos", "cookies"}  # las que existen en la web

# Política de contenido: la página solo carga código de sí misma (y, si el usuario
# acepta, el script de analítica). 'unsafe-inline' en estilos lo piden los style="" de React.
CSP = (
    "default-src 'self'; script-src 'self' https://plausible.io; "
    "style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; "
    "connect-src 'self' https://plausible.io; object-src 'none'; base-uri 'self'; "
    "frame-ancestors 'none'; form-action 'self'"
)


class Web(StaticFiles):
    """Archivos de la web, con respaldo a index.html y cabeceras de caché."""

    async def get_response(self, path: str, scope):
        try:
            resp = await super().get_response(path, scope)
        except HTTPException as exc:
            if exc.status_code != 404:
                raise
            resp = None

        # En Windows la ruta llega con «\»; se normaliza para que todo funcione igual en Linux.
        limpio = path.replace("\\", "/").strip("/.")
        if resp is None or resp.status_code == 404:
            # Ruta de la web (o inexistente): se entrega index.html y React decide qué pintar.
            resp = await super().get_response("index.html", scope)
            if limpio not in RUTAS_WEB:
                resp.status_code = 404
            resp.headers["Cache-Control"] = "no-cache"
        elif limpio.startswith("assets/"):
            # Archivos con huella en el nombre: no cambian nunca, el navegador los guarda un año.
            resp.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        elif limpio in RUTAS_WEB or limpio.endswith(".html"):
            resp.headers["Cache-Control"] = "no-cache"
        else:
            resp.headers["Cache-Control"] = "public, max-age=3600"
        return resp


def crear_principal(dist: Path = DIST) -> FastAPI:
    principal = FastAPI(title="HidroIntegral", docs_url=None, redoc_url=None, openapi_url=None)
    principal.add_middleware(GZipMiddleware, minimum_size=1000)

    @principal.middleware("http")
    async def cabeceras(request: Request, call_next):
        resp = await call_next(request)
        resp.headers["X-Content-Type-Options"] = "nosniff"
        resp.headers["X-Frame-Options"] = "DENY"
        resp.headers["Referrer-Policy"] = "no-referrer"
        if not request.url.path.startswith("/api"):
            resp.headers["Content-Security-Policy"] = CSP
        if os.getenv("HIDRO_HTTPS") == "1":
            resp.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return resp

    @principal.get("/salud", include_in_schema=False)
    def salud():
        return {"ok": True}

    principal.mount("/api", api_app)
    if (dist / "index.html").is_file():
        principal.mount("/", Web(directory=dist, html=True), name="web")
    return principal


principal = crear_principal()
