import { useState } from "react";
import "./PerfilMonitor.css";

import Header from "../../components/Header";

function PerfilMonitor() {
  const monitor = {
    nome: "Pedro Henrique",
    nota: "4.9",
    materia: "Programação",
    descricao:
      "Monitor de lógica de programação, JavaScript, React e desenvolvimento web.",
    meetLink: "https://meet.google.com/abc-defg-hij",
  };

  const hoje = new Date();

  const [mesAtual, setMesAtual] = useState(hoje.getMonth());
  const [anoAtual, setAnoAtual] = useState(hoje.getFullYear());
  const [dataSelecionada, setDataSelecionada] = useState("");
  const [horaSelecionada, setHoraSelecionada] = useState("");
  const [aulas, setAulas] = useState([]);

  const meses = [
    "Janeiro",
    "Fevereiro",
    "Março",
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

  const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

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

  function criarAula(event) {
    event.preventDefault();

    if (!dataSelecionada || !horaSelecionada) {
      alert("Selecione uma data e um horário.");
      return;
    }

    const novaAula = {
      id: Date.now(),
      data: dataSelecionada,
      hora: horaSelecionada,
      meetLink: monitor.meetLink,
    };

    setAulas([...aulas, novaAula]);
    setHoraSelecionada("");

    alert("Aula criada com sucesso!");
  }

  function buscarAulasDoDia(data) {
    return aulas.filter((aula) => aula.data === data);
  }

  const diasDoMes = pegarDiasDoMes();

  return (
    <div className="perfil-monitor-page">
      <Header />

      <main className="perfil-monitor-main">
        <section className="perfil-monitor-card">
          <div className="perfil-monitor-avatar">
            {monitor.nome.charAt(0)}
          </div>

          <div className="perfil-monitor-info">
            <h2>{monitor.nome}</h2>

            <p>{monitor.descricao}</p>

            <div className="perfil-monitor-details">
              <span>⭐ Nota: {monitor.nota}</span>
              <span>📚 Matéria: {monitor.materia}</span>
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
                  placeholder="Clique em um dia no calendário"
                  readOnly
                />
              </div>

              <div className="perfil-monitor-input-group">
                <label>Horário da aula</label>
                <input
                  type="time"
                  value={horaSelecionada}
                  onChange={(e) => setHoraSelecionada(e.target.value)}
                />
              </div>

              <button type="submit" className="perfil-monitor-create-button">
                Criar aula
              </button>
            </form>
          </div>

          <div className="perfil-monitor-calendar-card">
            <div className="perfil-monitor-calendar-header">
              <button onClick={voltarMes}>‹</button>

              <h2>
                {meses[mesAtual]} {anoAtual}
              </h2>

              <button onClick={avancarMes}>›</button>
            </div>

            <div className="perfil-monitor-weekdays">
              {diasSemana.map((dia) => (
                <span key={dia}>{dia}</span>
              ))}
            </div>

            <div className="perfil-monitor-calendar-grid">
              {diasDoMes.map((dia, index) => {
                if (dia === null) {
                  return <div className="perfil-monitor-empty-day" key={index}></div>;
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

                        <a
                          href={aula.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="perfil-monitor-meet-button"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Entrar no Meet
                        </a>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default PerfilMonitor;