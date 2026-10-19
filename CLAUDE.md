# HidroIntegral

Proyecto final de Cálculo II (2026). Una app que usa integrales definidas para calcular agua. Idioma de código, comentarios y UI: español.

## Qué calcula la app

1. **Volumen acumulado** como área bajo la curva del caudal: `V = ∫ₐᵇ q(t) dt`, con `q(t)` en L/min y `t` en minutos. Métodos: integral exacta (SymPy), suma de Riemann izquierda, derecha y punto medio, trapecio y Simpson, comparados contra el valor exacto.
2. **Derivados del volumen:** caudal promedio `V/(b−a)`, tiempo para llenar un tanque (resolver `∫₀ᵀ q = C`) y volumen acumulado `V(t)`.
3. **Capacidad de una tubería:** `Q_max = (π·D²/4)·v_max` con `D` interno y `v_max` velocidad promedio de diseño. La integral aparece en el perfil de velocidades: `Q = ∫₀ᴿ v(r)·2πr dr`.
4. **Conexión:** el caudal `q(t)` no puede superar `Q_max`; la app avisa si se pasa.

## Decisiones matemáticas (ya verificadas, no cambiar sin revisar)

- `Q = A·v` usa la velocidad **promedio**. Laminar: `v_c = 2V`. Turbulento (ley 1/7): `V = (49/60)·v_c`, o sea `v_c ≈ 1.2245·V`.
- Régimen por Reynolds: `Re = ρvD/μ`, laminar si `Re < 2300`, turbulento si `Re > 4000`, transición en medio. Agua: `ρ = 1000 kg/m³`, `μ = 0.001 Pa·s`.
- A velocidades de diseño normales (1 a 3 m/s) el flujo es turbulento. El perfil laminar solo es realista por debajo de unos 0.09 m/s en 1".
- `v_max` es una regla de diseño, no una ley: el valor por defecto es 2 m/s y el rango del slider es 0.5 a 3 m/s. La app dice "caudal de diseño", nunca "caudal máximo absoluto".
- Unidades: `q(t)` en L/min, `t` en minutos. Conversión: `Q (L/min) = A (m²) · v (m/s) · 60 000`.
- Diámetros nominales en pulgadas × 25.4 mm. El diámetro interno real es algo menor y depende del material.
- Poiseuille (`Q = πΔP R⁴/(8μL)`) solo en laminar. Darcy-Weisbach para turbulento está **pendiente** de investigar.

## Casos de control (las pruebas deben darlos)

- `q(t) = 2t + 3`, de 0 a 4 min: V = 28 L. Izquierda n=4: 24, derecha n=4: 32, punto medio: 28, trapecio: 28. Izquierda n=8: 26, derecha n=8: 30.
- Tubería de 1" a 2 m/s: 60.8 L/min. Re ≈ 50 800 (turbulento).
- Límite laminar en 1": v ≈ 0.0906 m/s, Q ≈ 2.75 L/min.

## Estructura

```
backend/
  hidro/volumen.py    # integrales de q(t)
  hidro/tuberia.py    # capacidad, Reynolds, perfiles
  hidro/animacion.py  # partículas del flujo para la simulación 3D (usa el perfil de tuberia.py)
  hidro/render_gif.py # GIF 3D solo con Python: python -m hidro.render_gif --diametro 1 --velocidad 2 --salida ../informe/animacion_tuberia.gif
  hidro/api.py        # FastAPI
  tests/              # pytest
frontend/             # React + Vite
  src/api.js          # cliente de la API (rutas /api, proxy de Vite)
  src/components/     # VolumenPanel, TuberiaPanel y gráficas Recharts
  src/pages/Volumen.jsx         # «¿Cuánta agua hay en el tanque?»: laboratorio + usos + métodos
  src/pages/Tuberia.jsx         # «¿Cuánta agua cabe por una tubería?»
  src/components/LaboratorioVolumen.jsx  # escenarios, cursor de tiempo, lecturas en vivo
  src/components/Tanque3D.jsx   # tanque que se llena con V(t) (Three.js, carga diferida)
  src/components/CaudalChart.jsx # q(t) en SVG con el área acumulada hasta el cursor
  src/components/Tuberia3D.jsx  # depósito → tubería → depósito; Python da las partículas
  src/escenarios.js   # situaciones reales (llave, bomba, lluvia…) con su explicación
  src/siteConfig.js   # datos del responsable (los muestran las páginas legales)
docs/PRODUCT.md      # contexto de diseño: público, personalidad, principios
docs/DESPLIEGUE.md   # cómo publicarlo gratis (GitHub + Render)
docs/LANZAMIENTO.md  # lista de cumplimiento y accesibilidad
```

El frontend llama rutas `/api/...` que Vite reenvía a `http://127.0.0.1:8000`
(ver `frontend/vite.config.js`). Hay que tener el backend corriendo con uvicorn.

## Comandos

```
# Backend
cd backend && pip install -r requirements.txt
pytest -q
uvicorn hidro.api:app --reload

# Frontend (en otra terminal)
cd frontend && npm install
npm run dev        # http://localhost:5173
```

## Plan por pasos

1. [hecho] Núcleo matemático y pruebas.
2. [hecho] API FastAPI mínima.
3. [hecho] Frontend React + Vite: formulario de `q(t)`, gráfica con área sombreada y rectángulos de Riemann (Recharts), curva `V(t)`, panel de tubería con selector de diámetro, slider de velocidad y perfil `v(r)`.
4. [hecho] Conectar frontend y API (proxy de Vite), validar entradas y mostrar errores.
5. [hecho] Informe en APA (`informe/Informe_HidroIntegral_APA.docx`) y diapositivas (`informe/Diapositivas_HidroIntegral.pptx`, 10 láminas; incluye el GIF de la tubería, que se anima en el modo presentación). Falta rellenar los datos de portada (nombres, institución, curso, catedrático, fecha), marcados [entre corchetes].

## Reglas de trabajo

- El servidor Python (uvicorn) **no recarga solo**: tras cambiar `backend/hidro/*.py` hay que reiniciarlo, o el frontend recibirá respuestas viejas.
- Las escenas 3D son esquemáticas: las velocidades relativas siguen el perfil real, pero tamaño y rapidez en pantalla están escalados (se dice en la propia página).
- Cada situación de `escenarios.js` lleva `q` (texto que integra Python) y `f` (solo para la miniatura); si se cambia una, hay que cambiar la otra.
- La entrada `q(t)` del usuario se valida antes de evaluarla (ver `parse_q`). Nunca usar `eval` directo.
- Cada fórmula nueva lleva una prueba con un caso calculado a mano.
- Código simple y comentado: el grupo debe poder explicar cada línea en la exposición.
