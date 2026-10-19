from fastapi.testclient import TestClient

from hidro.api import app

c = TestClient(app)


def test_volumen():
    r = c.post("/volumen", json={"q": "2*t+3", "a": 0, "b": 4})
    assert r.status_code == 200
    assert r.json()["exacto"] == 28


def test_entrada_invalida_422():
    assert c.post("/volumen", json={"q": "__import__('os')", "a": 0, "b": 4}).status_code == 422


def test_llenado():
    r = c.post("/llenado", json={"q": "2*t+3", "capacidad": 28})
    assert abs(r.json()["minutos"] - 4) < 1e-6


def test_capacidad_tuberia():
    r = c.get("/tuberia/capacidad", params={"diametro_pulg": 1, "v_max": 2})
    assert abs(r.json()["q_lmin"] - 60.8) < 0.1


def test_cabeceras_de_seguridad():
    h = c.get("/tuberia/tabla").headers
    assert h["x-content-type-options"] == "nosniff"
    assert h["x-frame-options"] == "DENY"
    assert h["referrer-policy"] == "no-referrer"


def test_limite_de_peticiones_429(monkeypatch):
    from hidro import api
    monkeypatch.setattr(api, "_LIMITE", 3)
    api._accesos.clear()
    codigos = [c.get("/tuberia/tabla").status_code for _ in range(5)]
    assert codigos == [200, 200, 200, 429, 429]
    api._accesos.clear()  # no contaminar otras pruebas


def test_barrido_olvida_ips_antiguas():
    from hidro import api
    api._accesos.clear()
    api._accesos["1.2.3.4"].append(0.0)    # hace mucho
    api._accesos["5.6.7.8"].append(100.0)  # reciente
    api._barrer(ahora=100.0 + 10)
    assert "1.2.3.4" not in api._accesos and "5.6.7.8" in api._accesos
    api._barrer(ahora=100.0 + api._VENTANA + 1)
    assert not api._accesos


def test_perfil_integral_coincide():
    j = c.get("/tuberia/perfil").json()
    assert abs(j["q_integral_lmin"] - j["q_formula_lmin"]) / j["q_formula_lmin"] < 2e-3
