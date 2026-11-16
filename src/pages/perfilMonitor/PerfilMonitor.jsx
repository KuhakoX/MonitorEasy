import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Header from "../../components/Header";
import { apiFetch, lerRespostaApi } from "../../lib/api";
import "./PerfilMonitor.css";

const TIPOS_ARQUIVO_POR_EXTENSAO = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  txt: "text/plain",
  rtf: "application/rtf",
  doc: "application/msword",
  docx:
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx:
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  odt: "application/vnd.oasis.opendocument.text",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
  odp: "application/vnd.oasis.opendocument.presentation",
};

function obterTipoArquivo(file) {
  const extensao = file.name.split(".").pop()?.toLowerCase();
  return TIPOS_ARQUIVO_POR_EXTENSAO[extensao] || file.type;
}

function formatarTamanhoArquivo(bytes) {
  if (!Number.isFinite(Number(bytes))) {
    return "";
  }

  const tamanho = Number(bytes);
  return tamanho < 1024 * 1024
    ? `${Math.max(1, Math.round(tamanho / 1024))} KB`
    : `${(tamanho / (1024 * 1024)).toFixed(1)} MB`;
}

const ABAS_PERFIL = [
  { id: "calendario", rotulo: "Calendário" },
  { id: "mural", rotulo: "Mural" },
  { id: "avaliacoes", rotulo: "Avaliações" },
];

function PerfilMonitor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const hoje = new Date();
  const formularioMaterialRef = useRef(null);

  const [monitor, setMonitor] = useState(null);
  const [usuarioAtual, setUsuarioAtual] = useState(null);
  const [carregando, setCarregando] = useState(Boolean(id));
  const [idCarregado, setIdCarregado] = useState(null);
  const [salvandoAula, setSalvandoAula] = useState(false);
  const [aulaEditandoId, setAulaEditandoId] = useState(null);
  const [aulaExcluindoId, setAulaExcluindoId] = useState(null);
  const [modalAulaAberto, setModalAulaAberto] = useState(false);
  const [aulaDetalhes, setAulaDetalhes] = useState(null);
  const [erro, setErro] = useState("");
  const [erroMateriais, setErroMateriais] = useState("");
  const [erroAvaliacoes, setErroAvaliacoes] = useState("");
  const [mesAtual, setMesAtual] = useState(hoje.getMonth());
  const [anoAtual, setAnoAtual] = useState(hoje.getFullYear());
  const [dataSelecionada, setDataSelecionada] = useState("");
  const [horaSelecionada, setHoraSelecionada] = useState("");
  const [tituloAula, setTituloAula] = useState("");
  const [descricaoAula, setDescricaoAula] = useState("");
  const [aulas, setAulas] = useState([]);
  const [materiais, setMateriais] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState("calendario");
  const [tituloMaterial, setTituloMaterial] = useState("");
  const [descricaoMaterial, setDescricaoMaterial] = useState("");
  const [arquivoMaterial, setArquivoMaterial] = useState(null);
  const [salvandoMaterial, setSalvandoMaterial] = useState(false);
  const [materialRemovendoId, setMaterialRemovendoId] = useState(null);
  const [avaliacoes, setAvaliacoes] = useState({
    average: 0,
    count: 0,
    reviews: [],
    myReview: null,
  });
  const [notaAvaliacao, setNotaAvaliacao] = useState("5");
  const [comentarioAvaliacao, setComentarioAvaliacao] = useState("");
  const [salvandoAvaliacao, setSalvandoAvaliacao] = useState(false);
  const [removendoAvaliacaoId, setRemovendoAvaliacaoId] = useState(null);

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
          setAbaAtiva("calendario");
          setAulas([]);
          setMateriais([]);
          setAvaliacoes({
            average: 0,
            count: 0,
            reviews: [],
            myReview: null,
          });
          setErro("");
          setErroMateriais("");
          setErroAvaliacoes("");
        }

        if (usuario) {
          const secoes = [
            {
              caminho: `/api/monitores/${id}/aulas`,
              salvar: setAulas,
              erro: setErro,
              erroPadrao: "Nao foi possivel carregar as aulas.",
            },
            {
              caminho: `/api/monitores/${id}/materiais`,
              salvar: setMateriais,
              erro: setErroMateriais,
              erroPadrao: "Nao foi possivel carregar os materiais.",
            },
            {
              caminho: `/api/monitores/${id}/avaliacoes`,
              salvar: (dados) => {
                setAvaliacoes(dados);
                if (dados.myReview) {
                  setNotaAvaliacao(String(dados.myReview.nota));
                  setComentarioAvaliacao(dados.myReview.comentario);
                }
              },
              erro: setErroAvaliacoes,
              erroPadrao: "Nao foi possivel carregar as avaliacoes.",
            },
          ];

          await Promise.all(
            secoes.map(async (secao) => {
              try {
                const resposta = await apiFetch(secao.caminho);
                const dados = await lerRespostaApi(resposta);

                if (!resposta.ok) {
                  throw new Error(dados.error || secao.erroPadrao);
                }

                if (componenteAtivo) {
                  secao.salvar(dados);
                }
              } catch (error) {
                if (componenteAtivo) {
                  secao.erro(error.message || secao.erroPadrao);
                }
              }
            }),
          );
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

  useEffect(() => {
    if (!modalAulaAberto && !aulaDetalhes) {
      return undefined;
    }

    function fecharComEscape(event) {
      if (event.key === "Escape") {
        setModalAulaAberto(false);
        setAulaDetalhes(null);
        setAulaEditandoId(null);
        setErro("");
      }
    }

    window.addEventListener("keydown", fecharComEscape);

    return () => {
      window.removeEventListener("keydown", fecharComEscape);
    };
  }, [modalAulaAberto, aulaDetalhes]);

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
    setHoraSelecionada("");
    setTituloAula("");
    setDescricaoAula("");
    setAulaEditandoId(null);
    setErro("");
    setModalAulaAberto(true);
  }

  function iniciarEdicao(aula, event) {
    event.stopPropagation();
    setDataSelecionada(aula.data);
    setHoraSelecionada(aula.hora);
    setTituloAula(aula.titulo);
    setDescricaoAula(aula.descricao || "");
    setAulaEditandoId(aula.id);
    setErro("");
    setModalAulaAberto(true);
  }

  function fecharModalAula() {
    setModalAulaAberto(false);
    setAulaEditandoId(null);
    setErro("");
  }

  function abrirDetalhesAula(aula) {
    setAulaDetalhes(aula);
  }

  async function criarAula(event) {
    event.preventDefault();

    if (!ehDonoDoPerfil) {
      setErro("Somente o monitor pode gerenciar as aulas do proprio perfil.");
      return;
    }

    if (
      !dataSelecionada ||
      !horaSelecionada ||
      !tituloAula.trim() ||
      !descricaoAula.trim()
    ) {
      setErro("Preencha a data, o horario, o titulo e a descricao da aula.");
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
          titulo: tituloAula,
          descricao: descricaoAula,
        }),
      });

      if (!resposta.ok) {
        const resultado = await lerRespostaApi(resposta);
        throw new Error(resultado.error || "Nao foi possivel salvar a aula.");
      }

      const aulasAtualizadas = await lerRespostaApi(resposta);
      setAulas(aulasAtualizadas);
      fecharModalAula();
      setAulaEditandoId(null);
      setHoraSelecionada("");
      setTituloAula("");
      setDescricaoAula("");
      setErro("");
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvandoAula(false);
    }
  }

  function cancelarEdicao() {
    setModalAulaAberto(false);
    setAulaEditandoId(null);
    setHoraSelecionada("");
    setTituloAula("");
    setDescricaoAula("");
    setErro("");
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

  async function publicarMaterial(event) {
    event.preventDefault();
    setErroMateriais("");

    if (!tituloMaterial.trim() || (!arquivoMaterial && !descricaoMaterial.trim())) {
      setErroMateriais("Informe um titulo e uma descricao ou selecione um arquivo.");
      return;
    }

    let materialId;

    try {
      setSalvandoMaterial(true);

      const metadata = {
        titulo: tituloMaterial,
        descricao: descricaoMaterial,
      };

      if (arquivoMaterial) {
        const contentType = obterTipoArquivo(arquivoMaterial);

        if (
          !contentType ||
          arquivoMaterial.size <= 0 ||
          arquivoMaterial.size > 10 * 1024 * 1024
        ) {
          throw new Error("Escolha um formato permitido com ate 10 MB.");
        }

        metadata.fileName = arquivoMaterial.name;
        metadata.contentType = contentType;
        metadata.fileSize = arquivoMaterial.size;
      }

      const resposta = await apiFetch(`/api/monitores/${id}/materiais`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metadata),
      });
      const resultado = await lerRespostaApi(resposta);

      if (!resposta.ok) {
        throw new Error(resultado.error || "Nao foi possivel publicar.");
      }

      const material = resultado.material || resultado;
      materialId = material.id;

      if (arquivoMaterial) {
        const upload = await fetch(resultado.signedUrl, {
          method: "PUT",
          headers: { "Content-Type": obterTipoArquivo(arquivoMaterial) },
          body: arquivoMaterial,
        });

        if (!upload.ok) {
          throw new Error("O envio do arquivo falhou. Tente novamente.");
        }

        const respostaConfirmacao = await apiFetch(
          `/api/monitores/${id}/materiais/${materialId}/confirm`,
          { method: "POST" },
        );
        const materialConfirmado = await lerRespostaApi(respostaConfirmacao);

        if (!respostaConfirmacao.ok) {
          throw new Error(
            materialConfirmado.error || "Nao foi possivel confirmar o arquivo.",
          );
        }

        setMateriais((atuais) => [materialConfirmado, ...atuais]);
      } else {
        setMateriais((atuais) => [material, ...atuais]);
      }

      setTituloMaterial("");
      setDescricaoMaterial("");
      setArquivoMaterial(null);
      formularioMaterialRef.current?.reset();
    } catch (error) {
      if (materialId) {
        let erroLimpeza;

        try {
          const respostaLimpeza = await apiFetch(
            `/api/monitores/${id}/materiais/${materialId}`,
            { method: "DELETE" },
          );
          const resultadoLimpeza = await lerRespostaApi(respostaLimpeza);

          if (!respostaLimpeza.ok) {
            erroLimpeza =
              resultadoLimpeza.error ||
              "Nao foi possivel limpar o upload pendente.";
          }
        } catch (erro) {
          erroLimpeza = erro.message;
        }

        if (erroLimpeza) {
          setErroMateriais(
            `${error.message} Tambem nao foi possivel remover o arquivo pendente: ${erroLimpeza}`,
          );
          return;
        }
      }

      setErroMateriais(error.message);
    } finally {
      setSalvandoMaterial(false);
    }
  }

  async function removerMaterial(material) {
    if (!window.confirm("Deseja remover esta publicacao?")) {
      return;
    }

    try {
      setMaterialRemovendoId(material.id);
      setErroMateriais("");
      const resposta = await apiFetch(
        `/api/monitores/${id}/materiais/${material.id}`,
        { method: "DELETE" },
      );
      const resultado = await lerRespostaApi(resposta);

      if (!resposta.ok) {
        throw new Error(resultado.error || "Nao foi possivel remover.");
      }

      setMateriais((atuais) =>
        atuais.filter((item) => item.id !== material.id),
      );
    } catch (error) {
      setErroMateriais(error.message);
    } finally {
      setMaterialRemovendoId(null);
    }
  }

  async function baixarMaterial(material) {
    const janela = window.open("about:blank", "_blank");

    try {
      const resposta = await apiFetch(
        `/api/monitores/${id}/materiais/${material.id}/download`,
      );
      const resultado = await lerRespostaApi(resposta);

      if (!resposta.ok) {
        throw new Error(resultado.error || "Nao foi possivel abrir o arquivo.");
      }

      if (janela) {
        janela.opener = null;
        janela.location = resultado.url;
      } else {
        window.location.assign(resultado.url);
      }
    } catch (error) {
      if (janela) {
        janela.close();
      }

      setErroMateriais(error.message);
    }
  }

  async function enviarAvaliacao(event) {
    event.preventDefault();
    setErroAvaliacoes("");

    try {
      setSalvandoAvaliacao(true);
      const minhaAvaliacao = avaliacoes.myReview;
      const caminho = `/api/monitores/${id}/avaliacoes${
        minhaAvaliacao ? `/${minhaAvaliacao.id}` : ""
      }`;
      const resposta = await apiFetch(caminho, {
        method: minhaAvaliacao ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nota: Number(notaAvaliacao),
          comentario: comentarioAvaliacao,
        }),
      });
      const resultado = await lerRespostaApi(resposta);

      if (!resposta.ok) {
        throw new Error(resultado.error || "Nao foi possivel salvar a avaliacao.");
      }

      setAvaliacoes(resultado);
      setNotaAvaliacao(String(resultado.myReview?.nota || 5));
      setComentarioAvaliacao(resultado.myReview?.comentario || "");
    } catch (error) {
      setErroAvaliacoes(error.message);
    } finally {
      setSalvandoAvaliacao(false);
    }
  }

  async function removerAvaliacao(avaliacao) {
    if (!window.confirm("Deseja remover esta avaliacao?")) {
      return;
    }

    try {
      setRemovendoAvaliacaoId(avaliacao.id);
      setErroAvaliacoes("");
      const resposta = await apiFetch(
        `/api/monitores/${id}/avaliacoes/${avaliacao.id}`,
        { method: "DELETE" },
      );
      const resultado = await lerRespostaApi(resposta);

      if (!resposta.ok) {
        throw new Error(resultado.error || "Nao foi possivel remover.");
      }

      setAvaliacoes(resultado);
      setNotaAvaliacao(String(resultado.myReview?.nota || 5));
      setComentarioAvaliacao(resultado.myReview?.comentario || "");
    } catch (error) {
      setErroAvaliacoes(error.message);
    } finally {
      setRemovendoAvaliacaoId(null);
    }
  }

  function buscarAulasDoDia(data) {
    return aulas.filter((aula) => aula.data === data);
  }

  function navegarAbas(event) {
    const indiceAtual = ABAS_PERFIL.findIndex((aba) => aba.id === abaAtiva);
    let proximoIndice;

    if (event.key === "ArrowRight") {
      proximoIndice = (indiceAtual + 1) % ABAS_PERFIL.length;
    } else if (event.key === "ArrowLeft") {
      proximoIndice =
        (indiceAtual - 1 + ABAS_PERFIL.length) % ABAS_PERFIL.length;
    } else if (event.key === "Home") {
      proximoIndice = 0;
    } else if (event.key === "End") {
      proximoIndice = ABAS_PERFIL.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const proximaAba = ABAS_PERFIL[proximoIndice];
    setAbaAtiva(proximaAba.id);
    event.currentTarget
      .querySelector(`#perfil-monitor-tab-${proximaAba.id}`)
      ?.focus();
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
                  <span>
                    Nota:{" "}
                    {avaliacoes.count
                      ? `${avaliacoes.average.toFixed(2)} / 5`
                      : "Sem avaliacoes"}
                  </span>
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
              <div
                className="perfil-monitor-tabs"
                role="tablist"
                aria-label="Seções do perfil do monitor"
                onKeyDown={navegarAbas}
              >
                {ABAS_PERFIL.map((aba) => (
                  <button
                    className="perfil-monitor-tab"
                    id={`perfil-monitor-tab-${aba.id}`}
                    key={aba.id}
                    type="button"
                    role="tab"
                    aria-selected={abaAtiva === aba.id}
                    aria-controls={`perfil-monitor-panel-${aba.id}`}
                    tabIndex={abaAtiva === aba.id ? 0 : -1}
                    onClick={() => setAbaAtiva(aba.id)}
                  >
                    {aba.rotulo}
                  </button>
                ))}
              </div>
            )}

            {usuarioAtual && (
              <section
                className="perfil-monitor-agendamento perfil-monitor-tabpanel"
                id="perfil-monitor-panel-calendario"
                role="tabpanel"
                aria-labelledby="perfil-monitor-tab-calendario"
                tabIndex={0}
                hidden={abaAtiva !== "calendario"}
              >
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
                              <button
                                type="button"
                                className="perfil-monitor-aula-resumo"
                                onClick={(event) => {
                                  event.stopPropagation();

                                  if (ehDonoDoPerfil) {
                                    iniciarEdicao(aula, event);
                                  } else {
                                    abrirDetalhesAula(aula);
                                  }
                                }}
                              >
                                <span>{aula.hora}</span>
                                <small>{aula.titulo}</small>
                                <span className="perfil-monitor-aula-abrir">
                                  {ehDonoDoPerfil
                                    ? "Abrir para editar"
                                    : "Ver detalhes"}
                                </span>
                              </button>

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

            {usuarioAtual && (
              <section
                className="perfil-monitor-comunidade perfil-monitor-tabpanel"
                id="perfil-monitor-panel-mural"
                role="tabpanel"
                aria-labelledby="perfil-monitor-tab-mural"
                tabIndex={0}
                hidden={abaAtiva !== "mural"}
              >
                <div className="perfil-monitor-conteudo-card">
                  <div className="perfil-monitor-conteudo-heading">
                    <div>
                      <h2>Materiais e avisos</h2>
                      <p>
                        Arquivos e comunicados publicados pelo monitor.
                      </p>
                    </div>
                  </div>

                  {ehDonoDoPerfil && (
                    <form
                      ref={formularioMaterialRef}
                      className="perfil-monitor-material-form"
                      onSubmit={publicarMaterial}
                    >
                      <div className="perfil-monitor-modal-campo">
                        <label htmlFor="titulo-material">Titulo</label>
                        <input
                          id="titulo-material"
                          type="text"
                          value={tituloMaterial}
                          onChange={(event) =>
                            setTituloMaterial(event.target.value)
                          }
                          maxLength={200}
                          required
                        />
                      </div>

                      <div className="perfil-monitor-modal-campo">
                        <label htmlFor="descricao-material">
                          Descricao ou aviso
                        </label>
                        <textarea
                          id="descricao-material"
                          value={descricaoMaterial}
                          onChange={(event) =>
                            setDescricaoMaterial(event.target.value)
                          }
                          maxLength={2000}
                          rows={3}
                        />
                      </div>

                      <div className="perfil-monitor-modal-campo">
                        <label htmlFor="arquivo-material">
                          Arquivo (opcional, maximo 10 MB)
                        </label>
                        <input
                          id="arquivo-material"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.txt,.rtf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp"
                          onChange={(event) =>
                            setArquivoMaterial(event.target.files?.[0] || null)
                          }
                        />
                        <small>
                          PDF, imagens, texto e documentos do Office/OpenDocument.
                        </small>
                      </div>

                      {erroMateriais && (
                        <p className="perfil-monitor-inline-error" role="alert">
                          {erroMateriais}
                        </p>
                      )}

                      <button
                        type="submit"
                        className="perfil-monitor-create-button"
                        disabled={salvandoMaterial}
                      >
                        {salvandoMaterial
                          ? "Publicando..."
                          : arquivoMaterial
                            ? "Publicar material"
                            : "Publicar aviso"}
                      </button>
                    </form>
                  )}

                  {!ehDonoDoPerfil && erroMateriais && (
                    <p className="perfil-monitor-inline-error" role="alert">
                      {erroMateriais}
                    </p>
                  )}

                  {materiais.length === 0 && !erroMateriais && (
                    <p className="perfil-monitor-conteudo-vazio">
                      Nenhum material ou aviso publicado ainda.
                    </p>
                  )}

                  {materiais.length > 0 && (
                    <ul className="perfil-monitor-materiais-lista">
                      {materiais.map((material) => (
                        <li
                          className="perfil-monitor-material-item"
                          key={material.id}
                        >
                          <div>
                            <h3>{material.titulo}</h3>
                            {material.descricao && (
                              <p>{material.descricao}</p>
                            )}
                            {material.nomeArquivo && (
                              <small>
                                {material.nomeArquivo}
                                {material.tamanhoBytes
                                  ? ` · ${formatarTamanhoArquivo(material.tamanhoBytes)}`
                                  : ""}
                              </small>
                            )}
                            <time dateTime={material.criadoEm}>
                              {new Date(material.criadoEm).toLocaleDateString(
                                "pt-BR",
                              )}
                            </time>
                          </div>
                          <div className="perfil-monitor-material-acoes">
                            {material.nomeArquivo && (
                              <button
                                type="button"
                                onClick={() => baixarMaterial(material)}
                              >
                                Abrir arquivo
                              </button>
                            )}
                            {ehDonoDoPerfil && (
                              <button
                                type="button"
                                disabled={materialRemovendoId === material.id}
                                onClick={() => removerMaterial(material)}
                              >
                                {materialRemovendoId === material.id
                                  ? "Removendo..."
                                  : "Remover"}
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            )}

            {usuarioAtual && (
              <section
                className="perfil-monitor-comunidade perfil-monitor-tabpanel"
                id="perfil-monitor-panel-avaliacoes"
                role="tabpanel"
                aria-labelledby="perfil-monitor-tab-avaliacoes"
                tabIndex={0}
                hidden={abaAtiva !== "avaliacoes"}
              >
                <div className="perfil-monitor-conteudo-card">
                  <div className="perfil-monitor-conteudo-heading">
                    <div>
                      <h2>Avaliacoes e comentarios</h2>
                      <p>
                        Nota media:{" "}
                        {avaliacoes.count
                          ? `${avaliacoes.average.toFixed(2)} / 5 (${avaliacoes.count})`
                          : "Sem avaliacoes"}
                      </p>
                    </div>
                  </div>

                  <form
                    className="perfil-monitor-avaliacao-form"
                    onSubmit={enviarAvaliacao}
                  >
                    <div className="perfil-monitor-modal-campo">
                      <label htmlFor="nota-avaliacao">Sua nota</label>
                      <select
                        id="nota-avaliacao"
                        value={notaAvaliacao}
                        onChange={(event) =>
                          setNotaAvaliacao(event.target.value)
                        }
                      >
                        <option value="5">5 - Excelente</option>
                        <option value="4">4 - Muito bom</option>
                        <option value="3">3 - Bom</option>
                        <option value="2">2 - Regular</option>
                        <option value="1">1 - Ruim</option>
                      </select>
                    </div>
                    <div className="perfil-monitor-modal-campo">
                      <label htmlFor="comentario-avaliacao">
                        Comentario (opcional)
                      </label>
                      <textarea
                        id="comentario-avaliacao"
                        value={comentarioAvaliacao}
                        onChange={(event) =>
                          setComentarioAvaliacao(event.target.value)
                        }
                        maxLength={2000}
                        rows={3}
                      />
                    </div>

                    {erroAvaliacoes && (
                      <p className="perfil-monitor-inline-error" role="alert">
                        {erroAvaliacoes}
                      </p>
                    )}

                    <button
                      type="submit"
                      className="perfil-monitor-create-button"
                      disabled={salvandoAvaliacao}
                    >
                      {salvandoAvaliacao
                        ? "Salvando..."
                        : avaliacoes.myReview
                          ? "Atualizar minha avaliacao"
                          : "Enviar avaliacao"}
                    </button>
                  </form>

                  {avaliacoes.reviews.length === 0 && !erroAvaliacoes && (
                    <p className="perfil-monitor-conteudo-vazio">
                      Ainda nao ha comentarios para este perfil.
                    </p>
                  )}

                  {avaliacoes.reviews.length > 0 && (
                    <ul className="perfil-monitor-avaliacoes-lista">
                      {avaliacoes.reviews.map((avaliacao) => (
                        <li
                          className="perfil-monitor-avaliacao-item"
                          key={avaliacao.id}
                        >
                          <div className="perfil-monitor-avaliacao-heading">
                            <strong>{avaliacao.autor}</strong>
                            <span>{avaliacao.nota} / 5</span>
                          </div>
                          <time dateTime={avaliacao.criadoEm}>
                            {new Date(avaliacao.criadoEm).toLocaleDateString(
                              "pt-BR",
                            )}
                          </time>
                          <p>
                            {avaliacao.comentario || "Avaliacao sem comentario."}
                          </p>
                          {(avaliacao.minha || ehDonoDoPerfil) && (
                            <div className="perfil-monitor-avaliacao-acoes">
                              <button
                                type="button"
                                disabled={
                                  removendoAvaliacaoId === avaliacao.id
                                }
                                onClick={() => removerAvaliacao(avaliacao)}
                              >
                                {removendoAvaliacaoId === avaliacao.id
                                  ? "Removendo..."
                                  : "Remover"}
                              </button>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            )}

            {mensagemErro && !modalAulaAberto && !aulaDetalhes && (
              <div
                className="perfil-monitor-feedback perfil-monitor-feedback-error"
                role="alert"
              >
                {mensagemErro}
              </div>
            )}
          </>
        )}

        {modalAulaAberto && ehDonoDoPerfil && (
          <div
            className="perfil-monitor-modal-overlay"
            onClick={fecharModalAula}
          >
            <section
              className="perfil-monitor-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="perfil-monitor-modal-titulo"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="perfil-monitor-modal-header">
                <h2 id="perfil-monitor-modal-titulo">
                  {aulaEditandoId ? "Editar aula" : "Nova aula"}
                </h2>
                <button
                  type="button"
                  className="perfil-monitor-modal-fechar"
                  aria-label="Fechar"
                  onClick={fecharModalAula}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={criarAula}>
                <div className="perfil-monitor-modal-campo">
                  <label htmlFor="data-aula">Data</label>
                  <input
                    id="data-aula"
                    type="date"
                    value={dataSelecionada}
                    onChange={(event) => setDataSelecionada(event.target.value)}
                    required
                  />
                </div>

                <div className="perfil-monitor-modal-campo">
                  <label htmlFor="hora-aula">Horario</label>
                  <input
                    id="hora-aula"
                    type="time"
                    value={horaSelecionada}
                    onChange={(event) => setHoraSelecionada(event.target.value)}
                    required
                  />
                </div>

                <div className="perfil-monitor-modal-campo">
                  <label htmlFor="titulo-aula">Nome da aula</label>
                  <input
                    id="titulo-aula"
                    type="text"
                    value={tituloAula}
                    onChange={(event) => setTituloAula(event.target.value)}
                    maxLength={200}
                    required
                  />
                </div>

                <div className="perfil-monitor-modal-campo">
                  <label htmlFor="descricao-aula">Descricao</label>
                  <textarea
                    id="descricao-aula"
                    value={descricaoAula}
                    onChange={(event) => setDescricaoAula(event.target.value)}
                    maxLength={2000}
                    rows={5}
                    required
                  />
                </div>

                {modalAulaAberto && erro && (
                  <p className="perfil-monitor-modal-erro" role="alert">
                    {erro}
                  </p>
                )}

                <div className="perfil-monitor-modal-acoes">
                  <button
                    type="button"
                    className="perfil-monitor-modal-cancelar"
                    onClick={cancelarEdicao}
                  >
                    Cancelar
                  </button>
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
                </div>
              </form>
            </section>
          </div>
        )}

        {aulaDetalhes && (
          <div
            className="perfil-monitor-modal-overlay"
            onClick={() => setAulaDetalhes(null)}
          >
            <section
              className="perfil-monitor-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="perfil-monitor-detalhes-titulo"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="perfil-monitor-modal-header">
                <h2 id="perfil-monitor-detalhes-titulo">
                  {aulaDetalhes.titulo}
                </h2>
                <button
                  type="button"
                  className="perfil-monitor-modal-fechar"
                  aria-label="Fechar"
                  onClick={() => setAulaDetalhes(null)}
                >
                  &times;
                </button>
              </div>

              <p className="perfil-monitor-detalhes-data">
                {aulaDetalhes.data} as {aulaDetalhes.hora}
              </p>
              <p className="perfil-monitor-detalhes-descricao">
                {aulaDetalhes.descricao || "Descricao ainda nao informada."}
              </p>

              {aulaDetalhes.meetLink ? (
                <a
                  href={aulaDetalhes.meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="perfil-monitor-meet-button"
                >
                  Entrar na aula
                </a>
              ) : (
                <button
                  type="button"
                  className="perfil-monitor-meet-button"
                  disabled
                >
                  Link da aula nao configurado
                </button>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default PerfilMonitor;
