"""Volumen de agua como área bajo la curva del caudal: V = ∫ q(t) dt.

Unidades: q(t) en L/min, t en minutos, V en litros.
"""
import re

import numpy as np
import sympy as sp
from sympy.parsing.sympy_parser import (
    convert_xor,
    implicit_multiplication_application,
    parse_expr,
    standard_transformations,
)

t = sp.Symbol("t", real=True)

# Funciones permitidas en la entrada del usuario.
_PERMITIDOS = {
    "t": t,
    "sin": sp.sin, "cos": sp.cos, "tan": sp.tan,
    "exp": sp.exp, "log": sp.log, "ln": sp.log, "sqrt": sp.sqrt,
    "abs": sp.Abs, "pi": sp.pi, "e": sp.E,
}
# Clases que las transformaciones de parse_expr necesitan para armar la expresión.
_GLOBAL = {"Integer": sp.Integer, "Float": sp.Float, "Rational": sp.Rational,
           "Symbol": sp.Symbol, "Function": sp.Function}
_CARACTERES_OK =re.compile(r"^[0-9a-zA-Z_+\-*/^().,\s]+$")
_TRANSF = standard_transformations + (implicit_multiplication_application, convert_xor)


def parse_q(texto: str) -> sp.Expr:
    """Convierte un texto como '2*t+3' en una expresión de SymPy.

    Valida los caracteres y solo deja usar t y las funciones de _PERMITIDOS,
    para no ejecutar código arbitrario que venga de la web.
    """
    if not texto or len(texto) > 200:
        raise ValueError("La función q(t) está vacía o es demasiado larga.")
    if not _CARACTERES_OK.match(texto) or "__" in texto:
        raise ValueError("La función contiene caracteres no permitidos.")
    try:
        expr = parse_expr(texto, local_dict=_PERMITIDOS, global_dict=dict(_GLOBAL), transformations=_TRANSF)
    except Exception as exc:
        raise ValueError(f"No se pudo interpretar q(t): {exc}") from exc
    extra = {s.name for s in expr.free_symbols} - {"t"}
    if extra:
        raise ValueError(f"Solo se permite la variable t, y aparece: {', '.join(sorted(extra))}")
    return sp.sympify(expr)


def _funcion(expr: sp.Expr):
    """Versión numérica (NumPy) de q(t) que acepta arreglos."""
    f = sp.lambdify(t, expr, "numpy")
    return lambda x: np.asarray(f(x), dtype=float) * np.ones_like(x, dtype=float)


def antiderivada(expr: sp.Expr) -> sp.Expr:
    return sp.integrate(expr, t)


def volumen_exacto(expr: sp.Expr, a: float, b: float) -> float:
    """Teorema fundamental del cálculo: V = F(b) - F(a)."""
    F = antiderivada(expr)
    return float(F.subs(t, b) - F.subs(t, a))


def suma_numerica(expr: sp.Expr, a: float, b: float, n: int, metodo: str) -> float:
    """Aproxima la integral con n rebanadas.

    metodo: 'izquierda', 'derecha', 'medio', 'trapecio' o 'simpson'.
    """
    if n < 1:
        raise ValueError("n debe ser al menos 1.")
    f = _funcion(expr)
    dt = (b - a) / n
    if metodo == "izquierda":
        return float(np.sum(f(a + dt * np.arange(n))) * dt)
    if metodo == "derecha":
        return float(np.sum(f(a + dt * np.arange(1, n + 1))) * dt)
    if metodo == "medio":
        return float(np.sum(f(a + dt * (np.arange(n) + 0.5))) * dt)
    if metodo == "trapecio":
        x = a + dt * np.arange(n + 1)
        y = f(x)
        return float((y[0] + y[-1]) / 2 * dt + np.sum(y[1:-1]) * dt)
    if metodo == "simpson":
        if n % 2:
            raise ValueError("Simpson necesita n par.")
        x = a + dt * np.arange(n + 1)
        y = f(x)
        return float(dt / 3 * (y[0] + y[-1] + 4 * np.sum(y[1:-1:2]) + 2 * np.sum(y[2:-1:2])))
    raise ValueError(f"Método desconocido: {metodo}")


METODOS = ("izquierda", "derecha", "medio", "trapecio", "simpson")


def comparar(expr: sp.Expr, a: float, b: float, ns=(4, 8, 16, 32)) -> dict:
    """Compara todos los métodos contra el valor exacto para varios n."""
    exacto = volumen_exacto(expr, a, b)
    filas = []
    for metodo in METODOS:
        for n in ns:
            if metodo == "simpson" and n % 2:
                continue
            v = suma_numerica(expr, a, b, n, metodo)
            filas.append({"metodo": metodo, "n": n, "volumen": v, "error": abs(v - exacto)})
    return {"exacto": exacto, "filas": filas}


def caudal_promedio(expr: sp.Expr, a: float, b: float) -> float:
    """Valor medio de q en [a, b]: V / (b - a)."""
    if b <= a:
        raise ValueError("Se necesita b > a.")
    return volumen_exacto(expr, a, b) / (b - a)


def _evaluador_antiderivada(F: sp.Expr):
    """Función numérica rápida de la antiderivada; si SymPy usa funciones que
    `math` no conoce (p. ej. Ei), cae al camino lento con subs, que siempre sirve."""
    try:
        rapida = sp.lambdify(t, F, "math")
        rapida(0.5)  # prueba de que sabe evaluarla
        return lambda x: float(rapida(float(x)))
    except Exception:
        return lambda x: float(F.subs(t, x))


def curva_acumulada(expr: sp.Expr, a: float, b: float, puntos: int = 200) -> dict:
    """V(t) = ∫ₐᵗ q(s) ds y q(t) sobre la misma rejilla de tiempos.

    Tener ambas en la misma rejilla permite sincronizar la gráfica del caudal, el
    área ya acumulada y el nivel del tanque. (V'(t) = q(t): teorema fundamental.)
    """
    F = _evaluador_antiderivada(antiderivada(expr))
    Fa = F(a)
    ts = np.linspace(a, b, puntos)
    Vs = [F(x) - Fa for x in ts]
    return {"t": ts.tolist(), "V": Vs, "q": _funcion(expr)(ts).tolist()}


def tiempo_llenado(expr: sp.Expr, capacidad: float, t0: float = 0.0, t_max: float = 1e5) -> float:
    """Resuelve ∫_{t0}^{T} q = capacidad por bisección (q debe ser >= 0)."""
    if capacidad <= 0:
        raise ValueError("La capacidad debe ser positiva.")
    F = sp.lambdify(t, antiderivada(expr), "math")
    F0 = float(F(t0))
    V = lambda T: float(F(T)) - F0
    hi = t0 + 1.0
    while V(hi) < capacidad:
        hi = t0 + 2 * (hi - t0)
        if hi - t0 > t_max:
            raise ValueError("El tanque no se llena en un tiempo razonable con ese caudal.")
    lo = t0
    for _ in range(80):
        mid = (lo + hi) / 2
        if V(mid) < capacidad:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2


def caudal_maximo_en(expr: sp.Expr, a: float, b: float, puntos: int = 2001) -> float:
    """Mayor valor de q(t) en [a, b] (muestreo), para compararlo con la tubería."""
    x = np.linspace(a, b, puntos)
    return float(np.max(_funcion(expr)(x)))


# Dónde se evalúa q(t) para fijar la altura de cada rectángulo de Riemann.
_PUNTO_MUESTRA = {"izquierda": 0.0, "derecha": 1.0, "medio": 0.5}


def datos_riemann(expr: sp.Expr, a: float, b: float, n: int, metodo: str,
                  puntos_curva: int = 120) -> dict:
    """Datos para dibujar q(t) y los n rectángulos de Riemann.

    Devuelve la curva suave de q(t), un rectángulo por rebanada (inicio, ancho,
    altura) y la suma aproximada. Solo para 'izquierda', 'derecha' y 'medio',
    que son los que se ven como rectángulos.
    """
    if n < 1:
        raise ValueError("n debe ser al menos 1.")
    if metodo not in _PUNTO_MUESTRA:
        raise ValueError("Los rectángulos solo aplican a izquierda, derecha o medio.")
    f = _funcion(expr)
    dt = (b - a) / n
    frac = _PUNTO_MUESTRA[metodo]
    inicios = a + dt * np.arange(n)
    alturas = f(inicios + frac * dt)
    xs = np.linspace(a, b, puntos_curva)
    return {
        "curva": {"t": xs.tolist(), "q": f(xs).tolist()},
        "rectangulos": [
            {"x0": float(x0), "ancho": float(dt), "altura": float(h)}
            for x0, h in zip(inicios, alturas)
        ],
        "suma": float(np.sum(alturas) * dt),
        "dt": float(dt),
    }
