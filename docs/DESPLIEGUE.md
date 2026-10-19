# Publicar HidroIntegral gratis

Notas para el equipo que mantiene el proyecto (no es documentación para usuarios; esa está en el [README](../README.md)).

La web (React) y el cálculo (Python) se empaquetan en **un solo servicio** (`Dockerfile`): un único enlace sirve la página y la API. Los hostings de páginas estáticas (GitHub Pages, Netlify) no ejecutan Python, por eso se usa un servicio que acepte Docker. Aquí se explica **Render**; al final hay una alternativa.

Hay dos pasos: **GitHub** guarda el código y **Render** lo pone en internet y da el enlace público. Quien reciba el enlace no necesita GitHub ni clonar nada.

## Antes de publicar

1. Abre `frontend/src/siteConfig.js` y escribe el nombre del grupo y un correo de contacto. Las páginas de privacidad los muestran; si los dejas vacíos, no se inventa nada.
2. Decide si el repositorio será público. La carpeta `informe/` trae el informe y las diapositivas; si no quieres que sean públicos, no la subas.

## Paso 1: subir el código a GitHub

Con `git push` (recomendado):

```bash
git remote add origin https://github.com/TU_USUARIO/hidrointegral.git
git push -u origin main
```

O desde la web de GitHub (**Add file → Upload files**). Si usas la web, ten cuidado con esto:

- **Hay que arrastrar las carpetas completas** (`backend`, `frontend`, `scripts`, `docs`), no seleccionar archivos sueltos: si no, GitHub sube solo los archivos de la raíz y se pierde la estructura. Sin las carpetas `backend` y `frontend`, Render no puede construir el proyecto.
- GitHub permite subir **hasta 100 archivos a la vez** y 25 MiB por archivo ([documentación](https://docs.github.com/en/enterprise-server@3.19/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)). Si tu carpeta supera los 100, súbela en varias tandas.
- **No subas** `node_modules`, `dist` ni `__pycache__`: son miles de archivos innecesarios.
- Después de subir, recarga la página del repositorio y comprueba que aparecen las carpetas.

## Paso 2: crear el servicio en Render

1. Entra a https://render.com e inicia sesión con tu cuenta de GitHub.
2. **New +** → **Blueprint** → elige tu repositorio. Render lee `render.yaml` y propone el servicio `hidrointegral` en el plan **Free**.
3. **Apply**. La primera construcción tarda varios minutos (compila la web e instala Python).
4. Cuando termine, Render muestra una dirección como `https://hidrointegral-xxxx.onrender.com`. Ese es el enlace para compartir.

Si la construcción falla, abre el servicio en Render y mira **Logs**: el mensaje dice qué archivo falta o qué paso falló. Tras corregirlo, **Manual sync** vuelve a construir.

## Paso 3: poner la dirección real (recomendado)

Las etiquetas para compartir en redes y el mapa del sitio usan una dirección de ejemplo. Cámbiala por la tuya:

```bash
python scripts/poner_dominio.py https://hidrointegral-xxxx.onrender.com
```

El script cambia `frontend/index.html`, `frontend/public/sitemap.xml` y `frontend/public/robots.txt`. Sube esos tres archivos a GitHub y Render publica de nuevo.

## Lo que hay que saber del plan gratuito

- El servicio **se duerme tras 15 minutos sin visitas** y tarda hasta **un minuto en despertar**: la primera persona que lo abra verá una espera. Conviene abrirlo unos minutos antes de presentar.
- Hay un límite mensual de horas gratuitas (750 h por cuenta) y de ancho de banda. Las condiciones cambian; revísalas en https://docs.render.com/free.
- Si Render pidiera una tarjeta, revisa su página de precios antes de continuar y considera la alternativa de abajo.

## Alternativa: Hugging Face Spaces (también gratis)

1. En https://huggingface.co crea un **Space** con SDK **Docker** (hardware «CPU basic», gratis).
2. Sube el contenido del proyecto a ese Space y añade esto **al principio** del `README.md` de ese repositorio:

```
---
title: HidroIntegral
sdk: docker
app_port: 7860
---
```

3. El `Dockerfile` ya escucha en el puerto 7860. Su política de reposo no está confirmada: consúltala en la documentación de Spaces.

## Probar la imagen en local (opcional, necesita Docker)

```bash
docker build -t hidrointegral .
docker run -p 8080:7860 hidrointegral
```

Abre http://localhost:8080.
