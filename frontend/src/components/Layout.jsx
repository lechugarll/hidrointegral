import { Link, NavLink, Outlet } from "react-router-dom";
import Footer from "./Footer.jsx";
import CookieBanner from "./CookieBanner.jsx";
import BarreraErrores from "./BarreraErrores.jsx";

export default function Layout() {
  return (
    <>
      <a className="saltar" href="#contenido">Saltar al contenido</a>
      <header className="barra">
        <div className="barra-interior">
          <Link to="/" className="marca" aria-label="HidroIntegral, inicio">
            <svg className="marca-icono" viewBox="0 0 64 64" aria-hidden="true">
              <rect width="64" height="64" rx="14" fill="currentColor" />
              <path d="M38 16c0-3.2-2-5-4.6-5-3 0-4.4 2.2-4.8 6l-3.2 30c-.5 4.2-2 6-4.6 6-1.4 0-2.4-.6-2.8-1.6" fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" />
              <path d="M44 34c0 4-3 7-6.5 7S31 38 31 34c0-3.3 4-8.2 6.5-11 2.5 2.8 6.5 7.7 6.5 11z" fill="#7dd3fc" />
            </svg>
            <span>HidroIntegral</span>
          </Link>
          <nav className="barra-nav" aria-label="Secciones">
            <NavLink to="/" end>Volumen en un tanque</NavLink>
            <NavLink to="/tuberia">Capacidad de tubería</NavLink>
          </nav>
        </div>
      </header>

      <main className="contenedor" id="contenido">
        <BarreraErrores>
          <Outlet />
        </BarreraErrores>
      </main>

      <Footer />
      <CookieBanner />
    </>
  );
}
