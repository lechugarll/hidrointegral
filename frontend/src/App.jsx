import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Volumen from "./pages/Volumen.jsx";

// Páginas secundarias cargadas de forma diferida: no entran en el paquete
// inicial, así la primera pantalla (el laboratorio) carga más ligera.
const Tuberia = lazy(() => import("./pages/Tuberia.jsx"));
const Privacidad = lazy(() => import("./pages/Privacidad.jsx"));
const Terminos = lazy(() => import("./pages/Terminos.jsx"));
const Cookies = lazy(() => import("./pages/Cookies.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

const cargando = <div className="lab-carga" role="status">Cargando…</div>;
const diferida = (pagina) => <Suspense fallback={cargando}>{pagina}</Suspense>;

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Volumen />} />
        <Route path="tuberia" element={diferida(<Tuberia />)} />
        <Route path="privacidad" element={diferida(<Privacidad />)} />
        <Route path="terminos" element={diferida(<Terminos />)} />
        <Route path="cookies" element={diferida(<Cookies />)} />
        <Route path="*" element={diferida(<NotFound />)} />
      </Route>
    </Routes>
  );
}
