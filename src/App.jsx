// Importações de Funções e Componentes
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from 'react'

// Paginas
//import Login from "./pages/login/Login";
import LandingPage from './pages/landingPage/LandingPage'
//import Cadastro from "./pages/login/Cadastro";
import PerfilMonitor from "./pages/perfilMonitor/PerfilMonitor";

// Estilos
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        <Route path="/perfil-monitor" element={<PerfilMonitor />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;