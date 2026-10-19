# HidroIntegral: web (React) + cálculo (Python) en una sola imagen.
# Sirve para Render, Hugging Face Spaces, Fly.io, Koyeb… y para probarlo en local con Docker.

# --- 1) Compila la web -------------------------------------------------------
FROM node:22-slim AS web
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- 2) Servidor Python con la web ya compilada --------------------------------
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY backend/requirements-prod.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements-prod.txt
COPY backend/hidro ./backend/hidro
COPY --from=web /web/dist ./frontend/dist

# Sin permisos de administrador dentro del contenedor.
RUN useradd --create-home app && chown -R app /app
USER app
WORKDIR /app/backend

# El hosting define PORT (Render: 10000); Hugging Face usa 7860.
EXPOSE 7860
CMD ["sh", "-c", "exec uvicorn hidro.servidor:principal --host 0.0.0.0 --port ${PORT:-7860} --proxy-headers --forwarded-allow-ips='*'"]
