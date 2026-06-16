import { BrowserRouter, Route, Routes } from "react-router-dom";

import "./App.css";
import LandingPage from "./pages/landingPage/LandingPage";
import PerfilMonitor from "./pages/perfilMonitor/PerfilMonitor";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/perfil-monitor" element={<PerfilMonitor />} />
        <Route path="/perfil-monitor/:id" element={<PerfilMonitor />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
