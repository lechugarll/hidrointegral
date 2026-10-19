import { Link } from "react-router-dom";
import useSEO from "../hooks/useSEO.js";
import { SITIO } from "../siteConfig.js";

export default function Privacidad() {
  useSEO(
    "Política de privacidad",
    "Qué información procesa HidroIntegral, para qué y cuánto tiempo. No pide datos personales."
  );

  return (
    <article className="panel documento">
      <h2>Política de privacidad</h2>
      <p className="documento-fecha">Última actualización: octubre de 2026</p>

      <h3>Responsable</h3>
      <p>
        {SITIO.responsable
          ? `${SITIO.responsable}.`
          : "Proyecto académico del curso de Cálculo II, desarrollado por su grupo de trabajo."}{" "}
        {SITIO.contacto && (
          <>
            Contacto: <a href={`mailto:${SITIO.contacto}`}>{SITIO.contacto}</a>.
          </>
        )}
      </p>

      <h3>Resumen</h3>
      <p>
        HidroIntegral es una herramienta educativa de cálculo. <strong>No requiere registro, no
        pide datos personales y no usa cookies.</strong>
      </p>

      <h3>Qué información se procesa</h3>
      <ul>
        <li>
          <strong>Lo que escribes en la calculadora</strong> (la función q(t), el intervalo, el
          diámetro de la tubería, etc.). Se envía al servidor solo para calcular y devolverte el
          resultado. No se guarda en ninguna base de datos ni se asocia a ti.
        </li>
        <li>
          <strong>Tu dirección IP, de forma temporal.</strong> El servidor la mantiene en memoria
          durante un minuto como máximo para limitar las peticiones excesivas (protección contra
          abuso). No se escribe en disco ni se usa para identificarte; se descarta sola.
        </li>
        <li>
          <strong>Registros técnicos del servidor.</strong> El proveedor de alojamiento que se use
          al publicar el sitio puede registrar datos técnicos habituales (como la IP y la fecha de
          la visita) según su propia política.
        </li>
      </ul>

      <h3>Analítica (opcional)</h3>
      <p>
        Solo si la aceptas en el aviso, se carga un script de analítica de un tercero que cuenta
        visitas de forma agregada y sin cookies. Si la rechazas, no se carga ningún script de
        terceros. Detalles y cómo cambiar tu elección en la{" "}
        <Link to="/cookies">política de cookies</Link>.
      </p>

      <h3>Datos que no recogemos</h3>
      <p>
        No recogemos nombre, correo, teléfono, ubicación ni ningún dato de pago, y no vendemos ni
        compartimos información con terceros con fines comerciales.
      </p>

      <h3>Tus derechos</h3>
      <p>
        Como no almacenamos datos personales asociados a ti, normalmente no hay nada que acceder,
        corregir o eliminar. Si tienes dudas sobre el tratamiento de tus datos,{" "}
        {SITIO.contacto ? (
          <>
            escribe a <a href={`mailto:${SITIO.contacto}`}>{SITIO.contacto}</a>.
          </>
        ) : (
          "consúltalo con el grupo de trabajo a través del curso."
        )}
      </p>

      <p>
        <Link to="/">← Volver a la calculadora</Link>
      </p>
    </article>
  );
}
