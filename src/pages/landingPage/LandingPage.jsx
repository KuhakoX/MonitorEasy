import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import "./LandingPage.css";

function LandingPage() {
  const navigate = useNavigate();
  const [monitores, setMonitores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarMonitores() {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await fetch("/api/monitores");

      if (!resposta.ok) {
        throw new Error("Nao foi possivel carregar os monitores.");
      }

      const dados = await resposta.json();
      setMonitores(dados);
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    let componenteAtivo = true;

    fetch("/api/monitores")
      .then((resposta) => {
        if (!resposta.ok) {
          throw new Error("Nao foi possivel carregar os monitores.");
        }

        return resposta.json();
      })
      .then((dados) => {
        if (componenteAtivo) {
          setMonitores(dados);
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
  }, []);

  return (
    <div className="landing-page">
      <Header />

      <main className="landing-main">
        <section className="landing-hero">
          <span className="landing-tag">Plataforma de ensino</span>

          <h2>Encontre o monitor ideal para aprender melhor</h2>

          <p>
            Conecte-se com monitores qualificados, tire duvidas, agende aulas
            e acompanhe sua evolucao nos estudos.
          </p>
        </section>

        <section className="landing-monitores-section">
          <div className="landing-section-title">
            <h2>Monitores disponiveis</h2>
            <p>Escolha um monitor para saber mais sobre ele.</p>
          </div>

          {carregando && (
            <div className="landing-feedback">Carregando monitores...</div>
          )}

          {!carregando && erro && (
            <div className="landing-feedback landing-feedback-error">
              <p>{erro}</p>
              <button
                className="landing-retry-button"
                type="button"
                onClick={carregarMonitores}
              >
                Tentar novamente
              </button>
            </div>
          )}

          {!carregando && !erro && monitores.length === 0 && (
            <div className="landing-feedback">
              Nenhum monitor cadastrado no banco de dados.
            </div>
          )}

          {!carregando && !erro && monitores.length > 0 && (
            <div className="landing-cards-container">
              {monitores.map((monitor) => (
                <div className="landing-card" key={monitor.id}>
                  <div className="landing-avatar">{monitor.nome.charAt(0)}</div>

                  <h3>{monitor.nome}</h3>

                  <span className="landing-materia">{monitor.materia}</span>

                  <p>{monitor.descricao}</p>

                  <div className="landing-card-info">
                    <span>Nota {monitor.avaliacao}</span>
                  </div>

                  <button
                    className="landing-profile-button"
                    type="button"
                    onClick={() => navigate("/perfil-monitor")}
                  >
                    Ver perfil
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default LandingPage;
