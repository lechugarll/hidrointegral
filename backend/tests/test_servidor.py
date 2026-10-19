import pytest
from fastapi.testclient import TestClient

from hidro.servidor import crear_principal


@pytest.fixture()
def cliente(tmp_path):
    # Una "web compilada" mínima, como la que deja `npm run build`.
    (tmp_path / "assets").mkdir()
    (tmp_path / "index.html").write_text("<html><body>PAGINA-WEB</body></html>", encoding="utf-8")
    (tmp_path / "assets" / "app-abc123.js").write_text("console.log(1)", encoding="utf-8")
    (tmp_path / "favicon.svg").write_text("<svg/>", encoding="utf-8")
    (tmp_path / "404.html").write_text("ESTATICA-404", encoding="utf-8")  # el build real la trae
    (tmp_path.parent / "secreto.txt").write_text("NO-DEBE-SALIR", encoding="utf-8")
    return TestClient(crear_principal(tmp_path))


def test_la_raiz_y_las_rutas_de_la_web_devuelven_index(cliente):
    for ruta in ("/", "/tuberia", "/privacidad", "/terminos", "/cookies"):
        r = cliente.get(ruta)
        assert r.status_code == 200, ruta
        assert "PAGINA-WEB" in r.text, ruta
        assert r.headers["cache-control"] == "no-cache"


def test_ruta_inexistente_da_404_pero_con_la_web(cliente):
    r = cliente.get("/no-existe")
    assert r.status_code == 404
    assert "PAGINA-WEB" in r.text  # React pinta su página 404 (no la estática)


def test_los_assets_con_huella_se_cachean_un_anio(cliente):
    r = cliente.get("/assets/app-abc123.js")
    assert r.status_code == 200
    assert "immutable" in r.headers["cache-control"]
    assert "max-age=31536000" in r.headers["cache-control"]


def test_otros_archivos_estaticos(cliente):
    r = cliente.get("/favicon.svg")
    assert r.status_code == 200 and r.headers["cache-control"] == "public, max-age=3600"


def test_la_api_cuelga_de_api(cliente):
    r = cliente.post("/api/volumen", json={"q": "2*t+3", "a": 0, "b": 4})
    assert r.status_code == 200 and r.json()["exacto"] == 28
    assert cliente.get("/api/tuberia/tabla").status_code == 200
    # Una ruta de la API que no existe responde JSON 404, no la página web.
    r = cliente.get("/api/nada")
    assert r.status_code == 404 and "PAGINA-WEB" not in r.text


def test_salud(cliente):
    assert cliente.get("/salud").json() == {"ok": True}


def test_cabeceras_de_seguridad_y_csp(cliente):
    web = cliente.get("/")
    assert "default-src 'self'" in web.headers["content-security-policy"]
    assert web.headers["x-frame-options"] == "DENY"
    api = cliente.get("/api/tuberia/tabla")
    assert "content-security-policy" not in api.headers  # la CSP es para páginas, no para JSON
    assert api.headers["x-content-type-options"] == "nosniff"


def test_no_se_puede_salir_de_la_carpeta_de_la_web(cliente):
    for ruta in ("/../secreto.txt", "/%2e%2e/secreto.txt", "/..%2fsecreto.txt"):
        r = cliente.get(ruta)
        assert "NO-DEBE-SALIR" not in r.text, ruta


def test_sin_web_compilada_solo_hay_api(tmp_path):
    c = TestClient(crear_principal(tmp_path / "vacio"))
    assert c.get("/salud").status_code == 200
    assert c.get("/api/tuberia/tabla").status_code == 200
    assert c.get("/").status_code == 404
