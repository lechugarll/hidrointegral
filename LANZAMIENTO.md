# Checklist de lanzamiento

Estado de los 19 puntos de preparación para producción. HidroIntegral es una
herramienta educativa que **no recoge datos personales** ni requiere registro,
así que algunos puntos (privacidad, cookies, analítica) se resolvieron de forma
mínima y honesta.

> **Dominio**: a lo largo del proyecto se usa el placeholder
> `https://hidrointegral.example.com`. Reemplázalo por el dominio real al
> desplegar (en `index.html`, `public/sitemap.xml` y `public/robots.txt`).

| # | Punto | Estado | Dónde / cómo |
|---|-------|--------|--------------|
| 1 | Página de política de privacidad | ✅ | `frontend/src/pages/Privacidad.jsx` (ruta `/privacidad`) |
| 2 | Comprimir imágenes | ✅ | Favicon en SVG (vectorial, ~0.5 KB); imagen social PNG optimizada (~45 KB). La app no usa otras imágenes |
| 3 | Página de términos y condiciones | ✅ | `frontend/src/pages/Terminos.jsx` (ruta `/terminos`) |
| 4 | Revisar velocidad de carga | ✅ | Vendors separados (`vite.config.js` → `manualChunks`) y páginas secundarias diferidas (`React.lazy`). Inicial: ~20 KB app + React/Recharts cacheados aparte |
| 5 | Secretos fuera del frontend | ✅ | No hay claves en el frontend. Solo variables públicas `VITE_*` (ver `frontend/.env.example`) |
| 6 | Arreglar contraste de color | ✅ | Gris de texto oscurecido a `#556070` (AA); foco visible; enlace "saltar al contenido" |
| 7 | Forzar HTTPS | ✅ (prod) | Backend: `HIDRO_HTTPS=1` activa redirección + HSTS (`backend/hidro/api.py`). En el hosting del frontend, activar HTTPS/HSTS del proveedor |
| 8 | Hacerla responsive (móvil) | ✅ | Diseño fluido con grids y `@media`; `meta viewport` presente; verificado a 375 px |
| 9 | Banner de consentimiento de cookies | ✅ | `frontend/src/components/CookieBanner.jsx`; la app no pone cookies, solo gestiona el consentimiento de la analítica |
| 10 | Meta títulos + descripciones | ✅ | `index.html` + hook `useSEO` por página (título y descripción dinámicos) |
| 11 | Imagen de vista previa social | ✅ | `frontend/public/og-image.png` (1200×630) + Open Graph/Twitter en `index.html` |
| 12 | Añadir un favicon | ✅ | `frontend/public/favicon.svg` (enlazado en `index.html`) |
| 13 | Alt text en imágenes | ✅ | Gráficas SVG con `role="img"` + `aria-label`; imagen social con texto en meta |
| 14 | Validación de formularios | ✅ | Frontend: validación inmediata con mensajes y `aria-invalid` (`VolumenPanel.jsx`). Backend: `parse_q` valida la fórmula sin ejecutar código |
| 15 | Página 404 personalizada | ✅ | SPA: ruta `*` → `NotFound.jsx`. Estática de respaldo: `public/404.html` |
| 16 | Arreglar enlaces rotos | ✅ | Enlaces internos del pie verificados (`/`, `/privacidad`, `/terminos`). Actualiza la URL del repositorio en `Footer.jsx` |
| 17 | Sitemap + robots.txt | ✅ | `frontend/public/sitemap.xml` y `frontend/public/robots.txt` |
| 18 | Protección anti-spam | ✅ | Backend: límite de peticiones por IP (`HIDRO_RATE_LIMIT`, 120/min) + cabeceras de seguridad. La app no tiene formularios de contacto |
| 19 | Configurar analítica | ✅ | Analítica sin cookies (Plausible) cargada solo tras consentimiento; dominio en `VITE_ANALYTICS_DOMAIN`. Vacío = desactivada |

## Checklist de cumplimiento y accesibilidad

Auditoría hecha sobre el código real. **✅ hecho · ➖ no aplica · ⚠️ pendiente de ti.**

| Punto | Estado | Qué se encontró / hizo |
|-------|--------|------------------------|
| Contraste de color | ✅ | Medido con la fórmula WCAG. Fallaban 4 cosas: blanco sobre el azul `#0ea5e9` de botones y cabecera (2.77:1), el número «404» (2.77:1) y el rojo de error sobre su fondo (4.41:1). Ahora todo ≥ 4.5:1 (botones 5.9:1). El azul claro quedó solo para decoración. También en `404.html` y en las diapositivas |
| Texto alternativo | ✅ | La web no usa `<img>`. Gráficas con `role="img"` + `aria-label`; la escena 3D describe en vivo diámetro, velocidad y régimen |
| Política de reembolsos | ➖ | No se vende nada. No se creó: una política de reembolsos inventada sería una afirmación sin respaldo |
| Política de privacidad | ✅ | Reescrita para decir lo que el software hace de verdad: la IP se guarda **en memoria hasta 1 minuto** (límite de peticiones). Esto se verificó contra el código y se encontró un fallo: la IP no se borraba sola. Corregido con barrido periódico (`_barrer`) y pruebas |
| Accesibilidad | ✅ | Foco visible, etiquetas asociadas a cada campo, `role="alert"` en errores, resultados con `aria-live`, enlace «saltar al contenido», `prefers-reduced-motion` (la animación 3D arranca en pausa), controles 3D con botones (no solo ratón). ⚠️ No se ejecutó Lighthouse ni un lector de pantalla real |
| Quitar reseñas falsas | ✅ | No hay reseñas ni testimonios |
| Términos y condiciones | ✅ | `/terminos` |
| Revisar embeds de terceros | ✅ | No hay mapas, vídeos, fuentes web ni widgets. El único tercero es el script de analítica, opcional y solo tras aceptar |
| Copyright de imágenes | ✅ | Todo es propio: favicon e imagen social generados para el proyecto y gráficas capturadas de la app. Librerías con licencias permisivas (React, Recharts, Three.js, FastAPI: MIT) |
| Política de cookies | ✅ | `/cookies`: no hay cookies; tabla de lo que se guarda en `localStorage`; botón para cambiar la elección |
| Revisar seguimiento (tracking) | ✅ | Sin seguimiento por defecto. Analítica solo con consentimiento y desactivada si `VITE_ANALYTICS_DOMAIN` está vacío |
| Consentimiento en formularios | ➖ | No hay formularios que pidan datos personales, así que no hay nada que consentir |
| Revisar leyes locales | ⚠️ | No sé en qué país se publicará y no puedo verificar legislación ni dar asesoría legal. Al no recoger datos personales el riesgo baja, pero confírmalo con tu centro de estudios o un asesor |
| Etiquetas de botón claras | ✅ | «Aceptar/Rechazar analítica», «Calcular tiempo de llenado» (antes «Recalcular», ambiguo), «Pausar/Reanudar animación» |
| Consentimiento de cookies | ✅ | Aceptar y Rechazar con el mismo peso visual; no se carga ningún script antes de aceptar; se puede retirar desde `/cookies` |
| Datos reales del responsable | ⚠️ | Rellena `frontend/src/siteConfig.js` (responsable, correo, repositorio). Las páginas legales muestran solo lo que rellenes; vacío no se inventa nada |
| Recoger solo datos necesarios | ✅ | Solo lo que se escribe en la calculadora, sin guardarlo |
| Formularios usables con teclado | ✅ | Orden natural, Enter envía el formulario, todos los campos con etiqueta |
| Quitar afirmaciones sin respaldo | ✅ / ⚠️ | Se quitó «conforme al RGPD» del código y «no se almacenan» de la política; se eliminó un enlace «Código» que llevaba a la portada de github.com. ⚠️ Las **referencias del informe APA las redacté de memoria**: compruébalas contra los libros (edición, editorial, año) antes de entregar |

### Otros hallazgos corregidos en esta pasada

- `/tuberia/perfil` no validaba sus parámetros (`puntos=1` provocaba una división por cero; un valor enorme era un vector de abuso). Ahora valida rangos.
- Los sliders disparaban una petición por cada paso y podían chocar con el límite por IP: ahora esperan 200–250 ms tras el último cambio.
- El botón del tanque repetía todos los cálculos; ahora solo calcula el tiempo de llenado.

## Cómo publicarlo

Paso a paso en el [README](README.md#publicarlo-gratis-para-que-lo-vean-tus-compañeros): un solo servicio (`Dockerfile` + `render.yaml`) sirve la web y la API. La dirección real se pone con `python scripts/poner_dominio.py https://tu-direccion`.

## Pendiente al desplegar (requiere tu dominio/hosting real)

1. Reemplazar `hidrointegral.example.com` por el dominio real en `index.html`,
   `sitemap.xml` y `robots.txt`.
2. Activar HTTPS en el hosting del frontend y arrancar el backend con
   `HIDRO_HTTPS=1` y `HIDRO_ORIGINS=https://tu-dominio` detrás de un proxy TLS.
3. Si quieres analítica, poner el dominio en `frontend/.env` y (opcional)
   autoalojar Plausible/Umami.
4. Poner la URL real del repositorio en `frontend/src/components/Footer.jsx`.
