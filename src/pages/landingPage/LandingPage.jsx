import { useNavigate } from "react-router-dom";
import "./LandingPage.css";
import Header from "../../components/Header";

function LandingPage() {
  const monitores = [
    {
      id: 1,
      nome: "Ana Souza",
      materia: "Matemática",
      descricao: "Ajuda alunos com álgebra, geometria e preparação para provas.",
      avaliacao: "4.9",
      aulas: "120 aulas",
    },
    {
      id: 2,
      nome: "Lucas Martins",
      materia: "Física",
      descricao: "Explica física de forma simples, com foco em exercícios práticos.",
      avaliacao: "4.8",
      aulas: "95 aulas",
    },
    {
      id: 3,
      nome: "Mariana Lima",
      materia: "Redação",
      descricao: "Auxilia na construção de textos, repertório e correção de redações.",
      avaliacao: "5.0",
      aulas: "150 aulas",
    },
    {
      id: 4,
      nome: "Pedro Henrique",
      materia: "Programação",
      descricao: "Ensina lógica, JavaScript, React e desenvolvimento web.",
      avaliacao: "4.9",
      aulas: "80 aulas",
    },
  ];

  return (
    <div className="landing-page">
      <Header />

      <main className="landing-main">
        <section className="landing-hero">
          <span className="landing-tag">Plataforma de ensino</span>

          <h2>Encontre o monitor ideal para aprender melhor</h2>

          <p>
            Conecte-se com monitores qualificados, tire dúvidas, agende aulas
            e acompanhe sua evolução nos estudos.
          </p>
        </section>

        <section className="landing-monitores-section">
          <div className="landing-section-title">
            <h2>Monitores disponíveis</h2>
            <p>Escolha um monitor para saber mais sobre ele.</p>
          </div>

          <div className="landing-cards-container">
            {monitores.map((monitor) => (
              <div className="landing-card" key={monitor.id}>
                <div className="landing-avatar">
                  {monitor.nome.charAt(0)}
                </div>

                <h3>{monitor.nome}</h3>

                <span className="landing-materia">
                  {monitor.materia}
                </span>

                <p>{monitor.descricao}</p>

                <div className="landing-card-info">
                  <span>⭐ {monitor.avaliacao}</span>
                  <span>{monitor.aulas}</span>
                </div>

                <button className="landing-profile-button">
                  Ver perfil
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default LandingPage;