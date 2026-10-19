# HidroIntegral

Acumulación de agua y capacidad de tuberías con integrales (Cálculo II, 2026).

- `V = ∫ q(t) dt`: volumen como área bajo la curva del caudal.
- `Q = ∫ v(r)·2πr dr`: caudal de una tubería a partir del perfil de velocidades.

## Probarlo en tu computador

Dos terminales:

```
cd backend
pip install -r requirements.txt
uvicorn hidro.api:app --reload
```

```
cd frontend
npm install
npm run dev
```

Abre http://localhost:5173. La documentación interactiva de la API está en http://127.0.0.1:8000/docs.
Las pruebas: `cd backend && pytest -q`.

> El servidor de Python **no recarga solo** cuando no usas `--reload`: si cambias código del backend, reinícialo.

## Publicarlo gratis para que lo vean tus compañeros

La web (React) y el cálculo (Python) se empaquetan en **un solo servicio** (`Dockerfile`): un único enlace sirve la página y la API. Los hostings de páginas estáticas (GitHub Pages, Netlify) no ejecutan Python, por eso se usa un servicio que acepte Docker. Aquí se explica **Render**; al final hay una alternativa.

### Antes de publicar (2 minutos)

1. Abre `frontend/src/siteConfig.js` y escribe el nombre del grupo y un correo de contacto. Las páginas de privacidad los muestran; si los dejas vacíos, no se inventa nada.
2. Decide si el repositorio será público: si quieres, quita la carpeta `informe/` (informe y diapositivas) antes de subirla.

### Paso 1: subir el código a GitHub

1. En https://github.com crea un repositorio vacío (por ejemplo `hidrointegral`), sin README.
2. En la carpeta del proyecto:

```
git init
git add .
git commit -m "HidroIntegral"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/hidrointegral.git
git push -u origin main
```

### Paso 2: crear el servicio en Render

1. Entra a https://render.com e inicia sesión con tu cuenta de GitHub.
2. **New +** → **Blueprint** → elige tu repositorio. Render lee `render.yaml` y propone el servicio `hidrointegral` en el plan **Free**.
3. **Apply**. La primera construcción tarda varios minutos (compila la web e instala Python).
4. Cuando termine, Render te da una dirección como `https://hidrointegral-xxxx.onrender.com`. Ese es el enlace para compartir.

### Paso 3: poner tu dirección real (recomendado)

Las etiquetas para compartir en redes y el mapa del sitio usan una dirección de ejemplo. Cámbiala por la tuya:

```
python scripts/poner_dominio.py https://hidrointegral-xxxx.onrender.com
git add .
git commit -m "Dirección real del sitio"
git push
```

Render vuelve a publicar solo.

### Lo que debes saber del plan gratuito

- El servicio **se duerme tras 15 minutos sin visitas** y tarda hasta **un minuto en despertar**: la primera persona que lo abra verá una espera. Ábrelo tú unos minutos antes de presentar.
- Hay un límite mensual de horas gratuitas (750 h por cuenta) y de ancho de banda. Las condiciones cambian; revísalas en https://docs.render.com/free.
- Si Render te pide una tarjeta, revisa su página de precios antes de continuar: puedes usar la alternativa de abajo.

### Alternativa: Hugging Face Spaces (también gratis)

1. En https://huggingface.co crea un **Space** con SDK **Docker** (hardware «CPU basic», gratis).
2. Sube el contenido del proyecto a ese Space (con `git push` al repositorio del Space) y añade esto **al principio** del `README.md` de ese repositorio:

```
---
title: HidroIntegral
sdk: docker
app_port: 7860
---
```

3. El `Dockerfile` ya escucha en el puerto 7860. Su política de reposo no la pude confirmar: consúltala en la documentación de Spaces.

### Probar la imagen en tu computador (opcional, necesita Docker)

```
docker build -t hidrointegral .
docker run -p 8080:7860 hidrointegral
```

Abre http://localhost:8080.

## Archivos importantes

- `Dockerfile`, `render.yaml`: cómo se construye y publica.
- `backend/hidro/servidor.py`: el servidor único (web + `/api`).
- `LANZAMIENTO.md`: lista de cumplimiento y accesibilidad.
- `CLAUDE.md`: contexto técnico del proyecto.

Para continuar con Claude Code: abre esta carpeta y corre `claude`. Lee `CLAUDE.md` automáticamente.
