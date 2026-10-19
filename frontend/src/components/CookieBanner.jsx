import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { cargarAnalitica } from "../analytics.js";

export const CLAVE_CONSENTIMIENTO = "hidrointegral-consentimiento";

// Banner de consentimiento. La app no usa cookies; este aviso solo controla si
// se carga la analítica de un tercero. La elección se guarda en localStorage.
export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let elegido = null;
    try {
      elegido = localStorage.getItem(CLAVE_CONSENTIMIENTO);
    } catch {
      elegido = null;
    }
    if (elegido === "aceptado") cargarAnalitica();
    if (!elegido) setVisible(true);
  }, []);

  function decidir(valor) {
    try {
      localStorage.setItem(CLAVE_CONSENTIMIENTO, valor);
    } catch {
      /* modo privado: seguimos sin guardar */
    }
    if (valor === "aceptado") cargarAnalitica();
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="region" aria-label="Preferencias de analítica">
      <p>
        Esta app <strong>no usa cookies</strong> ni pide datos personales. Con tu permiso cargamos
        una analítica anónima de un tercero, sin cookies, para contar visitas. Rechazar no limita
        nada. <Link to="/cookies">Más información</Link>
      </p>
      <div className="cookie-acciones">
        <button type="button" className="secundario" onClick={() => decidir("rechazado")}>
          Rechazar analítica
        </button>
        <button type="button" className="secundario" onClick={() => decidir("aceptado")}>
          Aceptar analítica
        </button>
      </div>
    </div>
  );
}
