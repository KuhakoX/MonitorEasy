/* ============================================================
   SeletorPerfil.jsx
   Componente de seleção de perfil: Aluno ou Monitor
   Recebe a opção atual e uma função para atualizar a escolha
   ============================================================ */

import '../frontend/styles/SeletorPerfil.css';

/* Lista de perfis disponíveis na plataforma */
const perfisDisponiveis = [
  {
    chave: 'aluno',
    icone: '📚',
    nome: 'Aluno',
    descricao: 'Quero aprender com monitores',
  },
  {
    chave: 'monitor',
    icone: '🖊️',
    nome: 'Monitor',
    descricao: 'Quero ajudar outros alunos',
  },
];

/* Componente SeletorPerfil
   Props:
   - perfilSelecionado: string ('aluno' | 'monitor')
   - aoSelecionarPerfil: função chamada ao clicar num perfil
*/
export default function SeletorPerfil({ perfilSelecionado, aoSelecionarPerfil }) {
  return (
    <div className="grade-perfis">
      {perfisDisponiveis.map((perfil) => {
        /* Verifica se este perfil está selecionado */
        const estaSelecionado = perfilSelecionado === perfil.chave;

        return (
          <button
            key={perfil.chave}
            /* Aplica classe "selecionado" condicionalmente */
            className={`botao-perfil ${estaSelecionado ? 'selecionado' : ''}`}
            onClick={() => aoSelecionarPerfil(perfil.chave)}
            type="button"
          >
            {/* Ícone representando o perfil */}
            <span className="perfil-icone">{perfil.icone}</span>

            {/* Nome do perfil */}
            <span className="perfil-nome">{perfil.nome}</span>

            {/* Descrição curta */}
            <span className="perfil-descricao">{perfil.descricao}</span>
          </button>
        );
      })}
    </div>
  );
}