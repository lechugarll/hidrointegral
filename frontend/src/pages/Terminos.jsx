import { Link } from "react-router-dom";
import useSEO from "../hooks/useSEO.js";

export default function Terminos() {
  useSEO(
    "Términos y condiciones",
    "Condiciones de uso de HidroIntegral, una herramienta educativa de cálculo."
  );

  return (
    <article className="panel documento">
      <h2>Términos y condiciones</h2>
      <p className="documento-fecha">Última actualización: octubre de 2026</p>

      <h3>Uso de la herramienta</h3>
      <p>
        HidroIntegral se ofrece con fines educativos para ilustrar la aplicación de las
        integrales definidas al cálculo de volúmenes de agua y a la capacidad de tuberías.
        Puedes usarla libremente para aprender y practicar.
      </p>

      <h3>Sin garantías</h3>
      <p>
        Los resultados se ofrecen «tal cual», sin garantía de exactitud para fines de
        ingeniería o comerciales. Las velocidades de diseño y los modelos de flujo son
        aproximaciones didácticas. No deben usarse como única base para decisiones reales de
        diseño hidráulico.
      </p>

      <h3>Responsabilidad</h3>
      <p>
        Los autores no se hacen responsables del uso que se dé a los resultados obtenidos. El
        usuario es responsable de verificar cualquier cálculo antes de aplicarlo.
      </p>

      <h3>Propiedad</h3>
      <p>
        Este es un proyecto final de Cálculo II (2026). El código y los contenidos pertenecen a
        sus autores y se comparten con fines académicos.
      </p>

      <p>
        <Link to="/">← Volver a la calculadora</Link>
      </p>
    </article>
  );
}
