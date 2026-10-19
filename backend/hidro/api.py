"""API FastAPI de HidroIntegral.

Correr con: uvicorn hidro.api:app --reload

Variables de entorno (opcionales, para producción):
  HIDRO_ORIGINS   Orígenes permitidos por CORS, separados por comas.
                  Por defecto http://localhost:5173 (desarrollo con Vite).
  HIDRO_HTTPS=1   Fuerza la redirección de HTTP a HTTPS (detrás de un proxy TLS).
"""
import os
import time
from collections import defaultdict, deque

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from . import animacion, tuberia, volumen

app = FastAPI(title="HidroIntegral")

# Fuerza HTTPS en producción (no en desarrollo, donde se usa http local).
if os.getenv("HIDRO_HTTPS") == "1":
    from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

    app.add_middleware(HTTPSRedirectMiddleware)

# CORS: orígenes configurables; por defecto el servidor de desarrollo de Vite.
_origenes = os.getenv("HIDRO_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(CORSMiddleware, allow_origins=[o.strip() for o in _origenes if o.strip()],
                   allow_methods=["GET", "POST"], allow_headers=["*"])


# --- Protección anti-abuso: límite de peticiones por IP (ventana deslizante) ---
_LIMITE = int(os.getenv("HIDRO_RATE_LIMIT", "120"))  # peticiones por minuto
_VENTANA = 60.0
_accesos: dict[str, deque] = defaultdict(deque)
_ultimo_barrido = 0.0


def _barrer(ahora: float) -> None:
    """Olvida las IP sin actividad reciente: así no se guardan más de un minuto
    (y la memoria no crece sin límite). Lo que promete la política de privacidad."""
    for ip in [k for k, c in _accesos.items() if not c or ahora - c[-1] > _VENTANA]:
        del _accesos[ip]


@app.middleware("http")
async def limitar_peticiones(request: Request, call_next):
    global _ultimo_barrido
    ip = request.client.host if request.client else "desconocido"
    ahora = time.monotonic()
    if ahora - _ultimo_barrido > _VENTANA:
        _barrer(ahora)
        _ultimo_barrido = ahora
    cola = _accesos[ip]
    while cola and ahora - cola[0] > _VENTANA:
        cola.popleft()
    if len(cola) >= _LIMITE:
        return JSONResponse(status_code=429,
                            content={"detail": "Demasiadas peticiones. Intenta de nuevo en un momento."})
    cola.append(ahora)
    return await call_next(request)


# --- Cabeceras de seguridad en todas las respuestas ---
@app.middleware("http")
async def cabeceras_seguridad(request: Request, call_next):
    resp = await call_next(request)
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["X-Frame-Options"] = "DENY"
    resp.headers["Referrer-Policy"] = "no-referrer"
    if os.getenv("HIDRO_HTTPS") == "1":
        resp.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return resp


class Entrada(BaseModel):
    q: str = Field(..., description="Caudal q(t) en L/min, por ejemplo '2*t+3'")
    a: float = 0
    b: float = Field(..., description="Fin del intervalo en minutos")


def _expr(texto: str):
    try:
        return volumen.parse_q(texto)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/volumen")
def calcular_volumen(e: Entrada):
    if e.b <= e.a:
        raise HTTPException(422, "Se necesita b > a.")
    expr = _expr(e.q)
    return {
        "exacto": volumen.volumen_exacto(expr, e.a, e.b),
        "antiderivada": str(volumen.antiderivada(expr)),
        "promedio": volumen.caudal_promedio(expr, e.a, e.b),
        "q_max_intervalo": volumen.caudal_maximo_en(expr, e.a, e.b),
        "comparacion": volumen.comparar(expr, e.a, e.b),
        "acumulada": volumen.curva_acumulada(expr, e.a, e.b),
    }


class Riemann(BaseModel):
    q: str
    a: float = 0
    b: float = Field(..., description="Fin del intervalo en minutos")
    n: int = Field(4, ge=1, le=200, description="Número de rectángulos")
    metodo: str = Field("izquierda", description="izquierda, derecha o medio")


@app.post("/volumen/riemann")
def datos_riemann(e: Riemann):
    if e.b <= e.a:
        raise HTTPException(422, "Se necesita b > a.")
    try:
        return volumen.datos_riemann(_expr(e.q), e.a, e.b, e.n, e.metodo)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc


class Llenado(BaseModel):
    q: str
    capacidad: float = Field(..., gt=0, description="Capacidad del tanque en litros")


@app.post("/llenado")
def tiempo_llenado(e: Llenado):
    try:
        return {"minutos": volumen.tiempo_llenado(_expr(e.q), e.capacidad)}
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc


@app.get("/tuberia/capacidad")
def capacidad(diametro_pulg: float = 1.0, v_max: float = 2.0):
    if not (0.1 <= v_max <= 10) or diametro_pulg <= 0:
        raise HTTPException(422, "Valores fuera de rango.")
    return tuberia.capacidad(diametro_pulg * tuberia.MM_POR_PULG, v_max)


@app.get("/tuberia/tabla")
def tabla():
    return tuberia.tabla_capacidad()


def _validar_tuberia(diametro_pulg: float, v_max: float):
    """Rangos razonables para no aceptar valores absurdos ni abusivos."""
    if not (0.1 <= v_max <= 10) or not (0.1 <= diametro_pulg <= 12):
        raise HTTPException(422, "Valores fuera de rango.")


@app.get("/tuberia/animacion")
def animacion_tuberia(diametro_pulg: float = 1.0, v_max: float = 2.0, n: int = 900):
    """Partículas del flujo (calculadas en Python) para la animación 3D."""
    _validar_tuberia(diametro_pulg, v_max)
    if not (50 <= n <= 3000):
        raise HTTPException(422, "n debe estar entre 50 y 3000.")
    return animacion.simular(diametro_pulg * tuberia.MM_POR_PULG, v_max, n)


@app.get("/tuberia/perfil")
def perfil(diametro_pulg: float = 1.0, v_max: float = 2.0, puntos: int = 41):
    """Perfil v(r) para dibujarlo y caudal obtenido integrando anillos."""
    _validar_tuberia(diametro_pulg, v_max)
    if not (2 <= puntos <= 500):
        raise HTTPException(422, "puntos debe estar entre 2 y 500.")
    d = diametro_pulg * tuberia.MM_POR_PULG
    c = tuberia.capacidad(d, v_max)
    reg = "laminar" if c["regimen"] == "laminar" else "turbulento"
    s = [i / (puntos - 1) for i in range(puntos)]
    return {
        "regimen": c["regimen"],
        "s": s,
        "v": [c["v_centro"] * tuberia.perfil(x, reg) for x in s],
        "q_integral_lmin": tuberia.caudal_por_integral(d, c["v_centro"], reg),
        "q_formula_lmin": c["q_lmin"],
    }
