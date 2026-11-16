import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Header from "../../components/Header";
import { apiFetch, lerRespostaApi } from "../../lib/api";
import "./PerfilMonitor.css";

function PerfilMonitor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const hoje = new Date();

  const [monitor, setMonitor] = useState(null);
  const [usuarioAtual, setUsuarioAtual] = useState(null);
  const [carregando, setCarregando] = useState(Boolean(id));
  const [idCarregado, setIdCarregado] = useState(null);
  const [salvandoAula, setSalvandoAula] = useState(false);
  const [aulaEditandoId, setAulaEditandoId] = useState(null);
  const [aulaExcluindoId, setAulaExcluindoId] = useState(null);
  const [erro, setErro] = useState("");
  const [mesAtual, setMesAtual] = useState(hoje.getMonth());
  const [anoAtual, setAnoAtual] = useState(hoje.getFullYear());
  const [dataSelecionada, setDataSelecionada] = useState("");
  const [horaSelecionada, setHoraSelecionada] = useState("");
  const [aulas, setAulas] = useState([]);

  const meses = [
    "Janeiro",
    "Fevereiro",
    "Marco",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

  useEffect(() => {
    let componenteAtivo = true;

    if (!id) {
      return undefined;
    }

    async function carregarPerfil() {
      try {
        const [respostaMonitor, respostaSessao] = await Promise.all([
          apiFetch(`/api/monitores/${id}`),
          apiFetch("/api/session"),
        ]);

        if (!respostaMonitor.ok) {
          throw new Error("Nao foi possivel carregar o monitor.");
        }

        const dadosMonitor = await lerRespostaApi(respostaMonitor);
        let usuario = null;

        if (respostaSessao.ok) {
          const sessao = await lerRespostaApi(respostaSessao);
          usuario = sessao.usuario;
        } else if (respostaSessao.status !== 401) {
          const sessao = await lerRespostaApi(respostaSessao);
          throw new Error(sessao.error || "Nao foi possivel validar a sessao.");
        }

        if (componenteAtivo) {
          setMonitor(dadosMonitor);
          setUsuarioAtual(usuario);
          setAulas([]);
          setErro("");
        }

        if (usuario) {
          const respostaAulas = await apiFetch(`/api/monitores/${id}/aulas`);

          if (respostaAulas.status === 401) {
            if (componenteAtivo) {
              setUsuarioAtual(null);
              setAulas([]);
            }
            return;
          }

          if (!respostaAulas.ok) {
            const resultado = await lerRespostaApi(respostaAulas);
            throw new Error(resultado.error || "Nao foi possivel carregar as aulas.");
          }

          const dadosAulas = await lerRespostaApi(respostaAulas);

          if (componenteAtivo) {
            setAulas(dadosAulas);
          }
        }
      } catch (error) {
        if (componenteAtivo) {
          setMonitor(null);
          setUsuarioAtual(null);
          setAulas([]);
          setErro(error.message);
        }
      } finally {
        if (componenteAtivo) {
          setIdCarregado(id);
          setCarregando(false);
        }
      }
    }

    carregarPerfil();

    return () => {
      componenteAtivo = false;
    };
  }, [id]);

  function formatarData(ano, mes, dia) {
    const mesFormatado = String(mes + 1).padStart(2, "0");
    const diaFormatado = String(dia).padStart(2, "0");

    return `${ano}-${mesFormatado}-${diaFormatado}`;
  }

  function pegarDiasDoMes() {
    const primeiroDia = new Date(anoAtual, mesAtual, 1).getDay();
    const quantidadeDias = new Date(anoAtual, mesAtual + 1, 0).getDate();
    const dias = [];

    for (let i = 0; i < primeiroDia; i++) {
      dias.push(null);
    }

    for (let dia = 1; dia <= quantidadeDias; dia++) {
      dias.push(dia);
    }

    return dias;
  }

  function voltarMes() {
    if (mesAtual === 0) {
      setMesAtual(11);
      setAnoAtual(anoAtual - 1);
    } else {
      setMesAtual(mesAtual - 1);
    }
  }

  function avancarMes() {
    if (mesAtual === 11) {
      setMesAtual(0);
      setAnoAtual(anoAtual + 1);
    } else {
      setMesAtual(mesAtual + 1);
    }
  }

  function selecionarDia(dia) {
    const data = formatarData(anoAtual, mesAtual, dia);
    setDataSelecionada(data);
  }

  async function criarAula(event) {
    event.preventDefault();

    if (!ehDonoDoPerfil) {
      setErro("Somente o monitor pode gerenciar as aulas do proprio perfil.");
      return;
    }

    if (!dataSelecionada || !horaSelecionada) {
      setErro("Selecione uma data e um horario.");
      return;
    }

    try {
      setSalvandoAula(true);
      setErro("");

      const caminho = `/api/monitores/${id}/aulas${
        aulaEditandoId ? `/${aulaEditandoId}` : ""
      }`;
      const resposta = await apiFetch(caminho, {
        method: aulaEditandoId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: dataSelecionada,
          hora: horaSelecionada,
        }),
      });

      if (!resposta.ok) {
        const resultado = await lerRespostaApi(resposta);
        throw new Error(resultado.error || "Nao foi possivel salvar a aula.");
      }

      const aulasAtualizadas = await lerRespostaApi(resposta);
      setAulas(aulasAtualizadas);
      setAulaEditandoId(null);
      setHoraSelecionada("");

      setErro("");
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvandoAula(false);
    }
  }

  function iniciarEdicao(aula, event) {
    event.stopPropagation();
    setAulaEditandoId(aula.id);
    setDataSelecionada(aula.data);
    setHoraSelecionada(aula.hora);
    setErro("");
  }

  function cancelarEdicao() {
    setAulaEditandoId(null);
    setHoraSelecionada("");
  }

  async function excluirAula(aula, event) {
    event.stopPropagation();

    if (!window.confirm("Deseja excluir esta aula?")) {
      return;
    }

    try {
      setAulaExcluindoId(aula.id);
      setErro("");

      const resposta = await apiFetch(
        `/api/monitores/${id}/aulas/${aula.id}`,
        { method: "DELETE" },
      );
      const resultado = await lerRespostaApi(resposta);

      if (!resposta.ok) {
        throw new Error(resultado.error || "Nao foi possivel excluir a aula.");
      }

      setAulas(resultado);

      if (aulaEditandoId === aula.id) {
        cancelarEdicao();
      }
    } catch (error) {
      setErro(error.message);
    } finally {
      setAulaExcluindoId(null);
    }
  }

  function buscarAulasDoDia(data) {
    return aulas.filter((aula) => aula.data === data);
  }

  const diasDoMes = pegarDiasDoMes();
  const mensagemErro = id ? erro : "Selecione um monitor na pagina inicial.";
  const exibindoCarregamento =
    Boolean(id) && (carregando || idCarregado !== id);
  const ehDonoDoPerfil =
    usuarioAtual?.tipoUsuario?.trim().toLowerCase() === "monitor" &&
    Number(usuarioAtual.id) === Number(monitor?.id);

  return (
    <div className="perfil-monitor-page">
      <Header />

      <main className="perfil-monitor-main">
        {exibindoCarregamento && (
          <div className="perfil-monitor-feedback">Carregando monitor...</div>
        )}

        {!exibindoCarregamento && mensagemErro && !monitor && (
          <div className="perfil-monitor-feedback perfil-monitor-feedback-error">
            <p>{mensagemErro}</p>
            <button type="button" onClick={() => navigate("/")}>
              Voltar para monitores
            </button>
          </div>
        )}

        {!exibindoCarregamento && monitor && (
          <>
            <section className="perfil-monitor-card">
              <div className="perfil-monitor-avatar">
                {monitor.nome.charAt(0)}
              </div>

              <div className="perfil-monitor-info">
                <h2>{monitor.nome}</h2>

                <p>{monitor.descricao}</p>

                <div className="perfil-monitor-details">
                  <span>Nota: {monitor.avaliacao}</span>
                  <span>Materia: {monitor.materia}</span>
                </div>
              </div>
            </section>

            {!usuarioAtual && (
              <section className="perfil-monitor-feedback">
                <p>Entre na sua conta para ver as aulas marcadas e acessar a sala.</p>
                <button
                  type="button"
                  onClick={() =>
                    navigate("/login", {
                      state: { origem: location.pathname },
                    })
                  }
                >
                  Entrar
                </button>
              </section>
            )}

            {usuarioAtual && (
              <section
                className={
                  ehDonoDoPerfil
                    ? "perfil-monitor-agendamento"
                    : "perfil-monitor-agendamento perfil-monitor-agendamento-somente-calendario"
                }
              >
                {ehDonoDoPerfil && (
                  <div className="perfil-monitor-form-card">
                    <h2>{aulaEditandoId ? "Editar aula" : "Agendar aula"}</h2>

                    <form onSubmit={criarAula}>
                      <div className="perfil-monitor-input-group">
                        <label>Data selecionada</label>
                        <input
                          type="text"
                          value={dataSelecionada}
                          placeholder="Clique em um dia no calendario"
                          readOnly
                        />
                      </div>

                      <div className="perfil-monitor-input-group">
                        <label>Horario da aula</label>
                        <input
                          type="time"
                          value={horaSelecionada}
                          onChange={(e) => setHoraSelecionada(e.target.value)}
                        />
                      </div>

                      <button
                        type="submit"
                        className="perfil-monitor-create-button"
                        disabled={salvandoAula}
                      >
                        {salvandoAula
                          ? "Salvando..."
                          : aulaEditandoId
                            ? "Salvar alteracoes"
                            : "Criar aula"}
                      </button>

                      {aulaEditandoId && (
                        <button
                          type="button"
                          className="perfil-monitor-cancel-button"
                          onClick={cancelarEdicao}
                        >
                          Cancelar edicao
                        </button>
                      )}
                    </form>
                  </div>
                )}

                <div className="perfil-monitor-calendar-card">
                  <div className="perfil-monitor-calendar-header">
                    <button type="button" onClick={voltarMes}>
                      &lt;
                    </button>

                    <h2>
                      {meses[mesAtual]} {anoAtual}
                    </h2>

                    <button type="button" onClick={avancarMes}>
                      &gt;
                    </button>
                  </div>

                  <div className="perfil-monitor-weekdays">
                    {diasSemana.map((dia) => (
                      <span key={dia}>{dia}</span>
                    ))}
                  </div>

                  <div className="perfil-monitor-calendar-grid">
                    {diasDoMes.map((dia, index) => {
                      if (dia === null) {
                        return (
                          <div
                            className="perfil-monitor-empty-day"
                            key={`vazio-${index}`}
                          ></div>
                        );
                      }

                      const dataDoDia = formatarData(anoAtual, mesAtual, dia);
                      const aulasDoDia = buscarAulasDoDia(dataDoDia);
                      const selecionado = dataSelecionada === dataDoDia;
                      const classeDia = [
                        "perfil-monitor-day",
                        ...(ehDonoDoPerfil
                          ? ["perfil-monitor-day-editable"]
                          : []),
                        ...(selecionado && ehDonoDoPerfil
                          ? ["perfil-monitor-day-selected"]
                          : []),
                      ].join(" ");

                      return (
                        <div
                          key={dataDoDia}
                          className={classeDia}
                          onClick={
                            ehDonoDoPerfil
                              ? () => selecionarDia(dia)
                              : undefined
                          }
                        >
                          <strong>{dia}</strong>

                          {aulasDoDia.map((aula) => (
                            <div className="perfil-monitor-aula" key={aula.id}>
                              <span>{aula.hora}</span>
                              <small>{aula.titulo}</small>

                              {aula.meetLink && (
                                <a
                                  href={aula.meetLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="perfil-monitor-meet-button"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Entrar
                                </a>
                              )}

                              {ehDonoDoPerfil && (
                                <div className="perfil-monitor-aula-acoes">
                                  <button
                                    type="button"
                                    onClick={(event) =>
                                      iniciarEdicao(aula, event)
                                    }
                                  >
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    disabled={aulaExcluindoId === aula.id}
                                    onClick={(event) =>
                                      excluirAula(aula, event)
                                    }
                                  >
                                    {aulaExcluindoId === aula.id
                                      ? "Excluindo..."
                                      : "Excluir"}
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {mensagemErro && (
              <div
                className="perfil-monitor-feedback perfil-monitor-feedback-error"
                role="alert"
              >
                {mensagemErro}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default PerfilMonitor;
