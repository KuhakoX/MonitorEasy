import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import icone from "../assets/icone.png";
import "./Header.css";

function buscarUsuarioLogado() {
  const usuarioSalvo = localStorage.getItem("usuarioLogado");

  if (!usuarioSalvo) {
    return null;
  }

  try {
    return JSON.parse(usuarioSalvo);
  } catch {
    localStorage.removeItem("usuarioLogado");
    return null;
  }
}

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [usuarioLogado, setUsuarioLogado] = useState(buscarUsuarioLogado);
  const [menuAberto, setMenuAberto] = useState(false);

  function fazerLogout() {
    localStorage.removeItem("usuarioLogado");
    setUsuarioLogado(null);
    setMenuAberto(false);
    navigate("/");
  }

  const nomeUsuario = usuarioLogado?.nome?.split(" ")[0];

  return (
    <header className="header">
      <button className="header-brand" type="button" onClick={() => navigate("/")}>
        <img src={icone} alt="MonitorEasy" className="header-brand-icon" />
        <span className="header-logo">MonitorEasy</span>
      </button>

      {usuarioLogado ? (
        <div className="header-user-menu">
          <button
            className="header-user-button"
            type="button"
            title={usuarioLogado.email}
            onClick={() => setMenuAberto((aberto) => !aberto)}
          >
            <span className="header-user-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" role="img">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v1.5c0 .28.22.5.5.5h15c.28 0 .5-.22.5-.5V18c0-2.66-5.33-4-8-4Z" />
              </svg>
            </span>
            <span>{nomeUsuario || usuarioLogado.email}</span>
          </button>

          {menuAberto && (
            <div className="header-user-dropdown">
              <button type="button" onClick={fazerLogout}>
                Sair
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          className="header-login-button"
          type="button"
          onClick={() => navigate("/login", { state: { origem: location.pathname } })}
        >
          Login
        </button>
      )}
    </header>
  );
}

export default Header;
