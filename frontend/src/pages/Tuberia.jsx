import TuberiaPanel from "../components/TuberiaPanel.jsx";
import useSEO from "../hooks/useSEO.js";

export default function Tuberia() {
  useSEO(
    "¿Cuánta agua cabe por una tubería?",
    "El caudal de una tubería surge de integrar el perfil de velocidades del agua: simulación 3D, número de Reynolds y comprobación Q = A·v."
  );

  return (
    <>
      <header className="intro">
        <h1>¿Cuánta agua cabe por una tubería?</h1>
        <p className="lede">
          El agua no avanza igual en todo el tubo: va más rápida en el centro y casi quieta pegada a
          la pared. Para saber el caudal hay que sumar el aporte de cada anillo del tubo, y eso es
          otra integral. Cambia el diámetro y la velocidad para verlo.
        </p>
      </header>
      <TuberiaPanel />
    </>
  );
}
