import { useNavigate } from "react-router-dom";
import "./Header.css";

function Header() {
  const navigate = useNavigate();

  return (
    <header className="header">
      <h1 className="header-logo">Monitor Easy</h1>

      <button
        className="header-login-button"
        onClick={() => navigate("/login")}
      >
        Login
      </button>
    </header>
  );
}

export default Header;