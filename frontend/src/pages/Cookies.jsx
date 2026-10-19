import { Link } from "react-router-dom";
import useSEO from "../hooks/useSEO.js";
import { CLAVE_CONSENTIMIENTO } from "../components/CookieBanner.jsx";

export default function Cookies() {
  useSEO(
    "Política de cookies",
    "HidroIntegral no usa cookies. Qué se guarda en tu navegador y cómo cambiar tu elección sobre la analítica."
  );

  // Borra la elección guardada y recarga: el aviso vuelve a aparecer.
  function cambiarEleccion() {
    try {
      localStorage.removeItem(CLAVE_CONSENTIMIENTO);
    } catch {
      /* sin almacenamiento: no hay nada que borrar */
    }
    window.location.assign("/");
  }

  return (
    <article className="panel documento">
      <h2>Política de cookies</h2>
      <p className="documento-fecha">Última actualización: octubre de 2026</p>

      <h3>Cookies</h3>
      <p>
        <strong>HidroIntegral no establece ninguna cookie.</strong> Ni propias ni de terceros.
      </p>

      <h3>Qué se guarda en tu navegador</h3>
      <div className="tabla-scroll">
      <table className="tabla-doc">
        <thead>
          <tr>
            <th scope="col">Nombre</th>
            <th scope="col">Tipo</th>
            <th scope="col">Para qué sirve</th>
            <th scope="col">Duración</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{CLAVE_CONSENTIMIENTO}</td>
            <td>Almacenamiento local (localStorage)</td>
            <td>Recordar si aceptaste o rechazaste la analítica, para no preguntarte de nuevo.</td>
            <td>Hasta que lo borres</td>
          </tr>
        </tbody>
      </table>
      </div>
      <p>Esa información solo existe en tu dispositivo y no se envía a ningún servidor.</p>

      <h3>Analítica de terceros (opcional)</h3>
      <p>
        Solo si aceptas, y solo si el sitio tiene una analítica configurada, se carga un script de
        un tercero (por ejemplo, Plausible) que cuenta visitas de forma agregada y sin cookies.
        Si rechazas, no se carga ningún script de terceros. Rechazar no limita ninguna
        funcionalidad.
      </p>

      <h3>Cambiar tu elección</h3>
      <p>Puedes retirar o modificar tu decisión en cualquier momento:</p>
      <p>
        <button type="button" className="principal" onClick={cambiarEleccion}>
          Volver a elegir sobre la analítica
        </button>
      </p>

      <p>
        <Link to="/privacidad">Política de privacidad</Link> · <Link to="/">← Volver a la calculadora</Link>
      </p>
    </article>
  );
}
