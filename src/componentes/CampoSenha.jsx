/* ============================================================
   CampoSenha.jsx
   Componente de input de senha com botão para mostrar/ocultar
   ============================================================ */

import { useState } from 'react';
import '../frontend/styles/CamposSenha.css';

/* Componente CampoSenha
   Props:
   - id: identificador único do input
   - valor: valor atual do campo
   - aoAlterar: função chamada quando o valor muda
   - placeholder: texto de dica dentro do campo
*/
export default function CampoSenha({ id, valor, aoAlterar, placeholder = '••••••••' }) {
  /* Controla se a senha está visível ou oculta */
  const [senhaVisivel, setSenhaVisivel] = useState(false);

  /* Alterna entre mostrar e ocultar a senha */
  function alternarVisibilidade() {
    setSenhaVisivel((visivel) => !visivel);
  }

  return (
    <div className="campo-senha-wrapper">
      {/* Input muda de type="password" para type="text" conforme o estado */}
      <input
        id={id}
        className="campo-input"
        type={senhaVisivel ? 'text' : 'password'}
        value={valor}
        onChange={(e) => aoAlterar(e.target.value)}
        placeholder={placeholder}
      />

      {/* Botão do olho para alternar visibilidade */}
      <button
        className="botao-olho"
        onClick={alternarVisibilidade}
        type="button"
        tabIndex={-1}
        aria-label={senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'}
      >
        {/* Ícone muda conforme o estado da senha */}
        {senhaVisivel ? (
          /* Olho fechado — senha visível */
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          /* Olho aberto — senha oculta */
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}