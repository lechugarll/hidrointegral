import { Link } from "react-router-dom";
import useSEO from "../hooks/useSEO.js";

export default function NotFound() {
  useSEO("Página no encontrada (404)", "La página que buscas no existe en HidroIntegral.");

  return (
    <article className="panel error404">
      <div className="error404-codigo">404</div>
      <h2>Esta página se desbordó del intervalo</h2>
      <p>
        La dirección que buscas no existe o se movió. Pero el agua siempre encuentra su cauce:
        vuelve a la calculadora para seguir integrando.
      </p>
      <p>
        <Link className="boton-enlace" to="/">
          Volver a la calculadora
        </Link>
      </p>
    </article>
  );
}
