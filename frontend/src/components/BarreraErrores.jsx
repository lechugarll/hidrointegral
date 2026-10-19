import { Component } from "react";

// Si algún componente falla al dibujarse, en vez de dejar la página en blanco
// mostramos un mensaje claro y una forma de recuperarse.
export default class BarreraErrores extends Component {
  state = { fallo: false };

  static getDerivedStateFromError() {
    return { fallo: true };
  }

  componentDidCatch(error) {
    console.error("Error al mostrar la página:", error);
  }

  render() {
    if (!this.state.fallo) return this.props.children;
    return (
      <div className="panel error404" role="alert">
        <h2>Algo salió mal al mostrar esta sección</h2>
        <p>
          Puede deberse a una respuesta inesperada del servidor de cálculo. Vuelve a cargar la
          página; si el problema sigue, avisa al grupo de trabajo.
        </p>
        <p>
          <button type="button" className="principal" onClick={() => window.location.reload()}>
            Volver a cargar
          </button>
        </p>
      </div>
    );
  }
}
