import numpy as np
import pytest
from fastapi.testclient import TestClient

from hidro import animacion as an
from hidro.api import app

D1 = 25.4  # 1 pulgada en mm
c = TestClient(app)


@pytest.mark.parametrize("v_prom", [2.0, 0.05])  # turbulento y laminar en 1"
def test_promedio_de_u_es_uno(v_prom):
    # Partículas repartidas por área: el promedio de v/v_prom debe ser 1.
    # Es la versión "en partículas" de Q = ∫ v(r)·2πr dr = A·v_promedio.
    d = an.simular(D1, v_prom, n=40000)
    assert np.mean(d["particulas"]["u"]) == pytest.approx(1.0, abs=0.01)


def test_regimen_y_razon_en_el_centro():
    tur = an.simular(D1, 2.0)
    assert tur["regimen"] == "turbulento" and tur["agitacion"] > 0
    assert tur["flechas"]["u"][0] == pytest.approx(60 / 49, abs=1e-3)  # centro, ley 1/7
    lam = an.simular(D1, 0.05)
    assert lam["regimen"] == "laminar" and lam["agitacion"] == 0
    assert lam["flechas"]["u"][0] == pytest.approx(2.0)  # centro laminar = 2·v_prom
    assert lam["flechas"]["u"][-1] == pytest.approx(0.0)  # pared laminar = 0


def test_particulas_dentro_del_tubo_y_semilla_fija():
    d = an.simular(D1, 2.0, n=500)
    p = d["particulas"]
    assert len(p["s"]) == len(p["theta"]) == len(p["z0"]) == len(p["u"]) == 500
    assert 0 <= min(p["s"]) and max(p["s"]) <= 1
    assert 0 <= min(p["z0"]) and max(p["z0"]) <= 1
    # Misma semilla: al cambiar la velocidad las partículas no cambian de sitio.
    assert an.simular(D1, 1.0, n=500)["particulas"]["s"] == p["s"]


def test_radio_visual_crece_con_el_diametro():
    assert an.radio_visual(12.7) < an.radio_visual(25.4) < an.radio_visual(50.8)
    assert an.radio_visual(500) == pytest.approx(an.RADIO_MAX)  # tope


def test_api_animacion():
    j = c.get("/tuberia/animacion", params={"diametro_pulg": 1, "v_max": 2, "n": 200}).json()
    assert j["regimen"] == "turbulento"
    assert len(j["particulas"]["u"]) == 200
    assert j["q_lmin"] == pytest.approx(60.8, abs=0.1)


@pytest.mark.parametrize("params", [
    {"n": 10}, {"n": 100000}, {"v_max": 99}, {"diametro_pulg": 0}, {"diametro_pulg": 500},
])
def test_api_animacion_rechaza_valores_absurdos(params):
    assert c.get("/tuberia/animacion", params=params).status_code == 422


def test_perfil_valida_puntos():
    assert c.get("/tuberia/perfil", params={"puntos": 1}).status_code == 422
    assert c.get("/tuberia/perfil", params={"puntos": 10**9}).status_code == 422
