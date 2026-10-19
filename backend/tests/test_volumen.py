import pytest

from hidro import volumen as v

Q = v.parse_q("2*t+3")


def test_exacto_28_litros():
    assert v.volumen_exacto(Q, 0, 4) == pytest.approx(28)


@pytest.mark.parametrize("metodo,n,esperado", [
    ("izquierda", 4, 24), ("derecha", 4, 32), ("medio", 4, 28), ("trapecio", 4, 28),
    ("izquierda", 8, 26), ("derecha", 8, 30),
])
def test_riemann_caso_de_control(metodo, n, esperado):
    assert v.suma_numerica(Q, 0, 4, n, metodo) == pytest.approx(esperado)


def test_simpson_exacto_en_cuadratica():
    assert v.suma_numerica(v.parse_q("t^2"), 0, 3, 4, "simpson") == pytest.approx(9)


def test_riemann_converge_al_exacto():
    q = v.parse_q("sin(t)+5")
    exacto = v.volumen_exacto(q, 0, 3)
    assert v.suma_numerica(q, 0, 3, 2000, "medio") == pytest.approx(exacto, rel=1e-6)


def test_caudal_promedio_y_acumulada():
    assert v.caudal_promedio(Q, 0, 4) == pytest.approx(7)
    c = v.curva_acumulada(Q, 0, 4, 5)
    assert c["V"][0] == 0 and c["V"][-1] == pytest.approx(28)


def test_curva_acumulada_trae_q_en_la_misma_rejilla():
    c = v.curva_acumulada(Q, 0, 4, 5)
    assert c["t"] == pytest.approx([0, 1, 2, 3, 4])
    assert c["q"] == pytest.approx([3, 5, 7, 9, 11])          # q = 2t + 3
    assert c["V"] == pytest.approx([0, 4, 10, 18, 28])        # V = t² + 3t


def test_curva_acumulada_con_funcion_gaussiana_es_rapida_y_correcta():
    # "Lluvia sobre un techo": 20·exp(-(t-4)²/4). Su antiderivada usa erf.
    import time
    q = v.parse_q("20*exp(-(t-4)^2/4)")
    t0 = time.perf_counter()
    c = v.curva_acumulada(q, 0, 8)
    assert time.perf_counter() - t0 < 2.0
    # ∫ de 0 a 8 de 20·e^(-(t-4)²/4) = 20·√(4π)·erf(2) ≈ 70.8·0.99532 ≈ 70.5
    assert c["V"][-1] == pytest.approx(70.5, abs=0.3)
    assert c["V"][0] == 0


def test_caudal_que_aumenta_de_forma_lineal_con_otros_parametros():
    # q(t) = 4t + 1 de 0 a 7 min (caudal inicial 1 L/min, aumento 4 L/min²):
    # V = 4·7²/2 + 1·7 = 98 + 7 = 105 L.
    assert v.volumen_exacto(v.parse_q("4*t+1"), 0, 7) == pytest.approx(105)


@pytest.mark.parametrize("q0,k,T", [(3, 2, 4), (1, 4, 7), (0.5, 0, 10), (20, 10, 1)])
def test_formula_lineal_q0_mas_kt(q0, k, T):
    # Con q(t) = k·t + q0, el volumen exacto es k·T²/2 + q0·T (es lo que muestran los deslizadores).
    assert v.volumen_exacto(v.parse_q(f"{k}*t+{q0}"), 0, T) == pytest.approx(k * T**2 / 2 + q0 * T)


def test_caudal_acelerado_t2_mas_2():
    # q(t) = t² + 2 de 0 a 4 min: V = t³/3 + 2t = 64/3 + 8 ≈ 29.33 L (regla de la potencia).
    q = v.parse_q("t^2+2")
    assert v.volumen_exacto(q, 0, 4) == pytest.approx(64 / 3 + 8)
    assert v.caudal_promedio(q, 0, 4) == pytest.approx((64 / 3 + 8) / 4)


def test_tiempo_llenado():
    assert v.tiempo_llenado(Q, 28) == pytest.approx(4, abs=1e-6)


def test_tiempo_llenado_imposible():
    with pytest.raises(ValueError):
        v.tiempo_llenado(v.parse_q("0*t"), 10)


@pytest.mark.parametrize("malo", ["__import__('os')", "t.__class__", "x+1", "open('f')", ""])
def test_entrada_peligrosa_rechazada(malo):
    with pytest.raises(ValueError):
        v.parse_q(malo)


def test_datos_riemann_izquierda():
    # q = 2t+3 de 0 a 4 con n=4 por izquierda: suma = 24 y 4 rectángulos.
    d = v.datos_riemann(Q, 0, 4, 4, "izquierda")
    assert d["suma"] == pytest.approx(24)
    assert len(d["rectangulos"]) == 4
    assert d["rectangulos"][0] == {"x0": pytest.approx(0), "ancho": pytest.approx(1),
                                   "altura": pytest.approx(3)}  # q(0) = 3


def test_datos_riemann_metodo_invalido():
    with pytest.raises(ValueError):
        v.datos_riemann(Q, 0, 4, 4, "simpson")
