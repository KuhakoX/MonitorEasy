import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import "./cadastro.css";

const estadoInicial = {
  nome: "",
  email: "",
  senha: "",
  tipoUsuario: "aluno",
};

function Cadastro() {
  const location = useLocation();
  const navigate = useNavigate();
  const cadastrando = location.pathname === "/cadastro";

  const [formulario, setFormulario] = useState(estadoInicial);
  const [mensagem, setMensagem] = useState(location.state?.mensagem || "");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const titulo = cadastrando ? "Criar conta" : "Entrar";

  function atualizarCampo(event) {
    const { name, value } = event.target;

    setFormulario((valoresAtuais) => ({
      ...valoresAtuais,
      [name]: value,
    }));
  }

  function trocarModo(novoModo) {
    setMensagem("");
    setErro("");
    navigate(novoModo === "cadastro" ? "/cadastro" : "/login");
  }

  async function enviarFormulario(event) {
    event.preventDefault();
    setErro("");
    setMensagem("");

    if (!formulario.email || !formulario.senha) {
      setErro("Preencha email e senha.");
      return;
    }

    if (cadastrando && (!formulario.nome || !formulario.tipoUsuario)) {
      setErro("Preencha nome, email, senha e tipo de usuario.");
      return;
    }

    try {
      setEnviando(true);

      const endpoint = cadastrando ? "/api/cadastro" : "/api/login";
      const dados = cadastrando
        ? formulario
        : {
            email: formulario.email,
            senha: formulario.senha,
          };

      const resposta = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dados),
      });

      const resultado = await resposta.json();

      if (!resposta.ok) {
        throw new Error(resultado.error || "Nao foi possivel concluir.");
      }

      if (cadastrando) {
        setFormulario((valoresAtuais) => ({
          ...estadoInicial,
          email: valoresAtuais.email,
        }));
        setMensagem("Cadastro realizado com sucesso. Agora faca login.");
        navigate("/login");
        return;
      }

      localStorage.setItem("usuarioLogado", JSON.stringify(resultado.usuario));
      setMensagem(resultado.message || "Login realizado com sucesso.");
      navigate("/");
    } catch (error) {
      setErro(error.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="cadastro-page">
      <Header />

      <main className="cadastro-main">
        <section className="cadastro-panel">
          <div className="cadastro-copy">
            <span>Monitor Easy</span>
            <h2>{cadastrando ? "Comece sua jornada" : "Bem-vindo de volta"}</h2>
            <p>
              Acesse a plataforma para encontrar monitores, acompanhar aulas e
              organizar seus estudos em um so lugar.
            </p>
          </div>

          <form className="cadastro-form" onSubmit={enviarFormulario}>
            <div className="cadastro-form-header">
              <h2>{titulo}</h2>

              <div className="cadastro-tabs" aria-label="Escolha login ou cadastro">
                <button
                  type="button"
                  className={!cadastrando ? "cadastro-tab ativo" : "cadastro-tab"}
                  onClick={() => trocarModo("login")}
                >
                  Login
                </button>
                <button
                  type="button"
                  className={cadastrando ? "cadastro-tab ativo" : "cadastro-tab"}
                  onClick={() => trocarModo("cadastro")}
                >
                  Cadastro
                </button>
              </div>
            </div>

            {cadastrando && (
              <div className="cadastro-field">
                <label htmlFor="nome">Nome</label>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  value={formulario.nome}
                  onChange={atualizarCampo}
                  placeholder="Seu nome"
                  autoComplete="name"
                />
              </div>
            )}

            <div className="cadastro-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formulario.email}
                onChange={atualizarCampo}
                placeholder="Seu@email.com"
                autoComplete="email"
              />
            </div>

            <div className="cadastro-field">
              <label htmlFor="senha">Senha</label>
              <input
                id="senha"
                name="senha"
                type="password"
                value={formulario.senha}
                onChange={atualizarCampo}
                placeholder="Sua senha"
                autoComplete={cadastrando ? "new-password" : "current-password"}
              />
            </div>

            {cadastrando && (
              <div className="cadastro-field">
                <label htmlFor="tipoUsuario">Tipo</label>
                <select
                  id="tipoUsuario"
                  name="tipoUsuario"
                  value={formulario.tipoUsuario}
                  onChange={atualizarCampo}
                >
                  <option value="aluno">Aluno</option>
                  <option value="monitor">Monitor</option>
                </select>
              </div>
            )}

            {erro && <div className="cadastro-alert erro">{erro}</div>}
            {mensagem && <div className="cadastro-alert sucesso">{mensagem}</div>}

            <button
              className="cadastro-submit"
              type="submit"
              disabled={enviando}
            >
              {enviando
                ? "Aguarde..."
                : cadastrando
                  ? "Cadastrar"
                  : "Entrar"}
            </button>

            <p className="cadastro-switch">
              {cadastrando ? "Ja tem uma conta?" : "Ainda nao tem conta?"}
              <button
                type="button"
                onClick={() => trocarModo(cadastrando ? "login" : "cadastro")}
              >
                {cadastrando ? "Fazer login" : "Criar cadastro"}
              </button>
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}

export default Cadastro;
