import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../components/Header";
import "./PerfilMonitor.css";

function PerfilMonitor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const hoje = new Date();

  const [monitor, setMonitor] = useState(null);
  const [carregando, setCarregando] = useState(Boolean(id));
  const [salvandoAula, setSalvandoAula] = useState(false);
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

    Promise.all([
      fetch(`/api/monitores/${id}`),
      fetch(`/api/monitores/${id}/aulas`),
    ])
      .then(async ([respostaMonitor, respostaAulas]) => {
        if (!respostaMonitor.ok) {
          throw new Error("Nao foi possivel carregar o monitor.");
        }

        if (!respostaAulas.ok) {
          throw new Error("Nao foi possivel carregar as aulas.");
        }

        return Promise.all([respostaMonitor.json(), respostaAulas.json()]);
      })
      .then(([dadosMonitor, dadosAulas]) => {
        if (componenteAtivo) {
          setMonitor(dadosMonitor);
          setAulas(dadosAulas);
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

    if (!id) {
      setErro("Selecione um monitor na pagina inicial.");
      return;
    }

    if (!dataSelecionada || !horaSelecionada) {
      alert("Selecione uma data e um horario.");
      return;
    }

    try {
      setSalvandoAula(true);

      const resposta = await fetch(`/api/monitores/${id}/aulas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: dataSelecionada,
          hora: horaSelecionada,
        }),
      });

      if (!resposta.ok) {
        throw new Error("Nao foi possivel criar a aula.");
      }

      const aulasAtualizadas = await resposta.json();
      setAulas(aulasAtualizadas);
      setHoraSelecionada("");

      alert("Aula criada com sucesso!");
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvandoAula(false);
    }
  }

  function buscarAulasDoDia(data) {
    return aulas.filter((aula) => aula.data === data);
  }

  const diasDoMes = pegarDiasDoMes();
  const mensagemErro = id ? erro : "Selecione um monitor na pagina inicial.";
  const exibindoCarregamento = Boolean(id) && carregando;

  return (
    <div className="perfil-monitor-page">
      <Header />

      <main className="perfil-monitor-main">
        {exibindoCarregamento && (
          <div className="perfil-monitor-feedback">Carregando monitor...</div>
        )}

        {!exibindoCarregamento && mensagemErro && (
          <div className="perfil-monitor-feedback perfil-monitor-feedback-error">
            <p>{mensagemErro}</p>
            <button type="button" onClick={() => navigate("/")}>
              Voltar para monitores
            </button>
          </div>
        )}

        {!exibindoCarregamento && !mensagemErro && monitor && (
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

            <section className="perfil-monitor-agendamento">
              <div className="perfil-monitor-form-card">
                <h2>Agendar aula</h2>

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
                    {salvandoAula ? "Criando..." : "Criar aula"}
                  </button>
                </form>
              </div>

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

                    return (
                      <div
                        key={dataDoDia}
                        className={
                          selecionado
                            ? "perfil-monitor-day perfil-monitor-day-selected"
                            : "perfil-monitor-day"
                        }
                        onClick={() => selecionarDia(dia)}
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
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default PerfilMonitor;
