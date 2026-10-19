import math

import pytest

from hidro import tuberia as tb

D1 = 25.4  # 1 pulgada en mm


def test_una_pulgada_a_2ms():
    assert tb.caudal_lmin(D1, 2.0) == pytest.approx(60.8, abs=0.1)


def test_duplicar_diametro_cuadruplica_caudal():
    assert tb.caudal_lmin(2 * D1, 2.0) == pytest.approx(4 * tb.caudal_lmin(D1, 2.0))


def test_reynolds_y_regimen():
    re = tb.reynolds(2.0, D1)
    assert re == pytest.approx(50800, rel=1e-3)
    assert tb.regimen(re) == "turbulento"
    assert tb.regimen(1000) == "laminar"


def test_limite_laminar():
    vl = tb.velocidad_limite_laminar(D1)
    assert vl == pytest.approx(0.0906, abs=1e-3)
    assert tb.caudal_lmin(D1, vl) == pytest.approx(2.75, abs=0.05)


@pytest.mark.parametrize("reg,tol", [("laminar", 1e-6), ("turbulento", 2e-3)])
def test_integral_de_anillos_igual_a_A_por_vprom(reg, tol):
    v_prom = 2.0
    vc = v_prom * tb.razon_vmax_vprom(reg)
    assert tb.caudal_por_integral(D1, vc, reg) == pytest.approx(tb.caudal_lmin(D1, v_prom), rel=tol)


def test_formulas_cerradas():
    R = D1 / 2000
    vc = 3.0
    lam = math.pi * R ** 2 * vc / 2 * 60000
    tur = 49 / 60 * math.pi * R ** 2 * vc * 60000
    assert tb.caudal_por_integral(D1, vc, "laminar") == pytest.approx(lam, rel=1e-6)
    assert tb.caudal_por_integral(D1, vc, "turbulento") == pytest.approx(tur, rel=2e-3)


def test_poiseuille_crece_con_r4():
    q1 = tb.poiseuille_lmin(100, D1, 1.0)
    q2 = tb.poiseuille_lmin(100, 2 * D1, 1.0)
    assert q2 == pytest.approx(16 * q1)


def test_tabla_tiene_seis_diametros():
    assert len(tb.tabla_capacidad()) == 6
