import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import "./Configuracoes.css";

function buscarUsuarioLogado() {
  try {
    return JSON.parse(localStorage.getItem("usuarioLogado") || "null");
  } catch {
    localStorage.removeItem("usuarioLogado");
    return null;
  }
}

async function lerRespostaApi(resposta) {
  const tipoConteudo = resposta.headers.get("content-type") || "";

  if (!tipoConteudo.includes("application/json")) {
    if (resposta.status === 404) {
      throw new Error(
        "O backend ativo ainda nao reconhece as configuracoes. Reinicie a API com `npm run api` e atualize esta pagina.",
      );
    }

    throw new Error(
      `A API retornou uma resposta inesperada (HTTP ${resposta.status}). Verifique se o backend esta ativo.`,
    );
  }

  return resposta.json();
}

function Configuracoes() {
  const navigate = useNavigate();
  const [usuarioLogado] = useState(buscarUsuarioLogado);
  const [formulario, setFormulario] = useState({
    nome: "",
    biografia: "",
    materias: [],
    meetLink: "",
  });
  const [materiaNova, setMateriaNova] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [trocaSenhaAberta, setTrocaSenhaAberta] = useState(false);
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [configuracoesCarregadas, setConfiguracoesCarregadas] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erroSenha, setErroSenha] = useState("");
  const [mensagemSenha, setMensagemSenha] = useState("");
  const ehMonitor =
    formulario.tipoUsuario?.trim().toLowerCase() === "monitor";

  useEffect(() => {
    if (!usuarioLogado?.id) {
      navigate("/login", {
        state: { mensagem: "Entre na sua conta para acessar as configuracoes." },
      });
      return undefined;
    }

    let componenteAtivo = true;

    fetch(`/api/usuarios/${usuarioLogado.id}/configuracoes`)
      .then(async (resposta) => {
        const dados = await lerRespostaApi(resposta);

        if (!resposta.ok) {
          throw new Error(dados.error || "Nao foi possivel carregar suas configuracoes.");
        }

        return dados;
      })
      .then((dados) => {
        if (componenteAtivo) {
          setFormulario({
            nome: dados.nome || "",
            email: dados.email || "",
            tipoUsuario: dados.tipoUsuario || "",
            biografia: dados.biografia || "",
            materias: dados.materias || [],
            meetLink: dados.meetLink || "",
          });
          setConfiguracoesCarregadas(true);
        }
      })
      .catch((error) => {
        if (componenteAtivo) {
          setErro(error.message);
        }
      })
      .finally(() => {
        if (componenteAtivo) {
          setCarregando(false);
        }
      });

    return () => {
      componenteAtivo = false;
    };
  }, [navigate, usuarioLogado]);

  function atualizarCampo(event) {
    const { name, value } = event.target;
    setFormulario((atual) => ({ ...atual, [name]: value }));
  }

  function adicionarMateria(event) {
    event.preventDefault();
    const nome = materiaNova.trim();

    if (!nome) {
      return;
    }

    if (formulario.materias.length >= 30) {
      setErro("Voce pode cadastrar ate 30 materias.");
      return;
    }

    if (
      !formulario.materias.some(
        (materia) => materia.toLowerCase() === nome.toLowerCase(),
      )
    ) {
      setFormulario((atual) => ({
        ...atual,
        materias: [...atual.materias, nome],
      }));
    }

    setMateriaNova("");
  }

  function removerMateria(materiaRemovida) {
    setFormulario((atual) => ({
      ...atual,
      materias: atual.materias.filter((materia) => materia !== materiaRemovida),
    }));
  }

  async function salvarConfiguracoes(event) {
    event.preventDefault();
    setErro("");
    setMensagem("");

    try {
      setSalvando(true);
      const dados = {
        nome: formulario.nome,
        biografia: formulario.biografia,
      };

      if (ehMonitor) {
        dados.materias = formulario.materias;
        dados.meetLink = formulario.meetLink;
      }

      const resposta = await fetch(
        `/api/usuarios/${usuarioLogado.id}/configuracoes`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dados),
        },
      );
      const resultado = await lerRespostaApi(resposta);

      if (!resposta.ok) {
        throw new Error(resultado.error || "Nao foi possivel salvar as alteracoes.");
      }

      const usuarioAtualizado = { ...usuarioLogado, nome: formulario.nome.trim() };
      localStorage.setItem("usuarioLogado", JSON.stringify(usuarioAtualizado));
      window.dispatchEvent(new Event("usuario-atualizado"));
      setMensagem("Configuracoes salvas com sucesso.");
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  async function trocarSenha(event) {
    event.preventDefault();
    setErroSenha("");
    setMensagemSenha("");

    if (!senhaAtual || !novaSenha) {
      setErroSenha("Informe sua senha atual e a nova senha.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErroSenha("A nova senha e a confirmacao nao correspondem.");
      return;
    }

    if (senhaAtual === novaSenha) {
      setErroSenha("A nova senha deve ser diferente da senha atual.");
      return;
    }

    try {
      setSalvandoSenha(true);
      const resposta = await fetch(`/api/usuarios/${usuarioLogado.id}/senha`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senhaAtual, novaSenha }),
      });
      const resultado = await lerRespostaApi(resposta);

      if (!resposta.ok) {
        throw new Error(resultado.error || "Nao foi possivel trocar sua senha.");
      }

      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
      setTrocaSenhaAberta(false);
      setMensagemSenha("Senha alterada com sucesso.");
    } catch (error) {
      setErroSenha(error.message);
    } finally {
      setSalvandoSenha(false);
    }
  }

  return (
    <div className="configuracoes-page">
      <Header />

      <main className="configuracoes-main">
        <section className="configuracoes-heading">
          <span className="configuracoes-eyebrow">Sua conta</span>
          <h1>Configuracoes</h1>
          <p>
            {ehMonitor
              ? "Atualize seu perfil, suas materias e o link das suas aulas."
              : "Mantenha seus dados pessoais atualizados."}
          </p>
        </section>

        {carregando && (
          <div className="configuracoes-feedback">Carregando configuracoes...</div>
        )}

        {!carregando && !configuracoesCarregadas && erro && (
          <div className="configuracoes-feedback configuracoes-erro" role="alert">
            {erro}
          </div>
        )}

        {!carregando && configuracoesCarregadas && (
          <section className="configuracoes-card">
            <div className="configuracoes-card-heading">
              <div>
                <h2>Dados do perfil</h2>
                <p>
                  Conta de {ehMonitor ? "monitor" : "aluno"} · {formulario.email}
                </p>
              </div>
              <span className="configuracoes-role">
                {ehMonitor ? "Monitor" : "Aluno"}
              </span>
            </div>

            <form onSubmit={salvarConfiguracoes}>
              <div className="configuracoes-grid">
                <div className="configuracoes-field">
                  <label htmlFor="nome">Nome de usuario</label>
                  <input
                    id="nome"
                    name="nome"
                    type="text"
                    value={formulario.nome}
                    onChange={atualizarCampo}
                    maxLength={100}
                    required
                  />
                </div>

                <div className="configuracoes-field configuracoes-field-wide">
                  <label htmlFor="biografia">Biografia</label>
                  <textarea
                    id="biografia"
                    name="biografia"
                    value={formulario.biografia}
                    onChange={atualizarCampo}
                    maxLength={2000}
                    rows={4}
                    placeholder="Conte um pouco sobre voce."
                  />
                  <small>{formulario.biografia.length}/2000 caracteres</small>
                </div>

                {ehMonitor && (
                  <>
                    <div className="configuracoes-field configuracoes-field-wide">
                      <label htmlFor="meetLink">
                        Link da sala do Google Meet
                      </label>
                      <input
                        id="meetLink"
                        name="meetLink"
                        type="url"
                        value={formulario.meetLink}
                        onChange={atualizarCampo}
                        placeholder="https://meet.google.com/abc-defg-hij"
                      />
                    </div>

                    <div className="configuracoes-field configuracoes-field-wide">
                      <label htmlFor="materiaNova">
                        Materias que voce ensina
                      </label>
                      <div className="configuracoes-add-materia">
                        <input
                          id="materiaNova"
                          type="text"
                          value={materiaNova}
                          onChange={(event) =>
                            setMateriaNova(event.target.value)
                          }
                          maxLength={100}
                          placeholder="Ex.: Matematica"
                        />
                        <button type="button" onClick={adicionarMateria}>
                          Adicionar materia
                        </button>
                      </div>
                      <div className="configuracoes-materias">
                        {formulario.materias.length ? (
                          formulario.materias.map((materia) => (
                            <span
                              className="configuracoes-materia"
                              key={materia}
                            >
                              {materia}
                              <button
                                type="button"
                                aria-label={`Remover materia ${materia}`}
                                onClick={() => removerMateria(materia)}
                              >
                                &times;
                              </button>
                            </span>
                          ))
                        ) : (
                          <p>Nenhuma materia adicionada.</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {erro && (
                <div
                  className="configuracoes-feedback configuracoes-erro"
                  role="alert"
                >
                  {erro}
                </div>
              )}
              {mensagem && (
                <div
                  className="configuracoes-feedback configuracoes-sucesso"
                  role="status"
                >
                  {mensagem}
                </div>
              )}

              <div className="configuracoes-actions">
                <button
                  className="configuracoes-save"
                  type="submit"
                  disabled={salvando}
                >
                  {salvando ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </form>

            <section className="configuracoes-password-section">
              <div>
                <h3>Senha</h3>
                <p className="configuracoes-hint">
                  A senha so sera alterada quando voce iniciar este processo.
                </p>
              </div>

              {!trocaSenhaAberta && (
                <button
                  className="configuracoes-password-toggle"
                  type="button"
                  onClick={() => {
                    setErroSenha("");
                    setMensagemSenha("");
                    setTrocaSenhaAberta(true);
                  }}
                >
                  Trocar senha
                </button>
              )}

              {mensagemSenha && (
                <div
                  className="configuracoes-feedback configuracoes-sucesso"
                  role="status"
                >
                  {mensagemSenha}
                </div>
              )}

              {trocaSenhaAberta && (
                <form
                  className="configuracoes-password-form"
                  onSubmit={trocarSenha}
                >
                  <div className="configuracoes-grid">
                    <div className="configuracoes-field">
                      <label htmlFor="senhaAtual">Senha atual</label>
                      <input
                        id="senhaAtual"
                        type="password"
                        value={senhaAtual}
                        onChange={(event) => setSenhaAtual(event.target.value)}
                        autoComplete="current-password"
                        required
                      />
                    </div>

                    <div className="configuracoes-field">
                      <label htmlFor="novaSenha">Nova senha</label>
                      <input
                        id="novaSenha"
                        type="password"
                        value={novaSenha}
                        onChange={(event) => setNovaSenha(event.target.value)}
                        autoComplete="new-password"
                        required
                      />
                    </div>

                    <div className="configuracoes-field configuracoes-field-wide">
                      <label htmlFor="confirmarSenha">
                        Confirmar nova senha
                      </label>
                      <input
                        id="confirmarSenha"
                        type="password"
                        value={confirmarSenha}
                        onChange={(event) =>
                          setConfirmarSenha(event.target.value)
                        }
                        autoComplete="new-password"
                        required
                      />
                    </div>
                  </div>

                  {erroSenha && (
                    <div
                      className="configuracoes-feedback configuracoes-erro"
                      role="alert"
                    >
                      {erroSenha}
                    </div>
                  )}

                  <div className="configuracoes-password-actions">
                    <button
                      className="configuracoes-password-cancel"
                      type="button"
                      onClick={() => {
                        setSenhaAtual("");
                        setNovaSenha("");
                        setConfirmarSenha("");
                        setErroSenha("");
                        setTrocaSenhaAberta(false);
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      className="configuracoes-save"
                      type="submit"
                      disabled={salvandoSenha}
                    >
                      {salvandoSenha ? "Trocando..." : "Confirmar nova senha"}
                    </button>
                  </div>
                </form>
              )}
            </section>
          </section>
        )}
      </main>
    </div>
  );
}

export default Configuracoes;
