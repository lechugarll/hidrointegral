import { Link } from "react-router-dom";
import { SITIO } from "../siteConfig.js";

export default function Footer() {
  return (
    <footer className="pie">
      <div className="pie-formula">
        V = ∫ q(t) dt &nbsp;·&nbsp; Q = ∫ v(r)·2πr dr
      </div>
      <nav className="pie-enlaces" aria-label="Enlaces del sitio">
        <Link to="/">Volumen en un tanque</Link>
        <Link to="/tuberia">Capacidad de tubería</Link>
        <Link to="/privacidad">Política de privacidad</Link>
        <Link to="/cookies">Política de cookies</Link>
        <Link to="/terminos">Términos y condiciones</Link>
        {SITIO.repositorio && (
          <a href={SITIO.repositorio} target="_blank" rel="noopener noreferrer">
            Código fuente (se abre en otra pestaña)
          </a>
        )}
      </nav>
      <div className="pie-copy">Proyecto final de Cálculo II · 2026</div>
    </footer>
  );
}
