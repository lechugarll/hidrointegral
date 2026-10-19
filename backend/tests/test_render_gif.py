from PIL import Image

from hidro import render_gif


def test_gif_tiene_los_fotogramas_pedidos(tmp_path):
    # Prueba de humo, rápida: pocas partículas, pocos fotogramas, imagen pequeña.
    salida = tmp_path / "tuberia.gif"
    render_gif.renderizar(str(salida), diametro_pulg=1.0, v_prom=2.0, fotogramas=3,
                          particulas=100, ancho_px=320, alto_px=180)
    with Image.open(salida) as g:
        assert g.format == "GIF"
        assert g.n_frames == 3
        assert g.size == (320, 180)


def test_colores_van_de_lento_a_rapido():
    import numpy as np
    c = render_gif._colores(np.array([0.0, 1.0]))
    assert (c[1] > c[0]).sum() >= 2  # el rápido es más claro que el lento
