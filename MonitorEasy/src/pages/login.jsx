/* ============================================================
   MonitorEasy.jsx
   Componente principal da tela de autenticação
   Gerencia as abas "Entrar" e "Cadastrar" e o estado dos forms
   ============================================================ */

import { useState } from 'react';
import SeletorPerfil from '../componentes/SeletorPerfil';
import CampoSenha from '../componentes/CampoSenha';
import '../frontend/styles/MonitorEasy.css';

export default function MonitorEasy() {
  /* ---- Estado das abas ---- */
  /* Controla qual aba está ativa: 'entrar' ou 'cadastrar' */
  const [abaAtiva, setAbaAtiva] = useState('cadastrar');

  /* ---- Estado do formulário de cadastro ---- */
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [perfilEscolhido, setPerfilEscolhido] = useState('aluno'); /* padrão: aluno */
  const [emailCadastro, setEmailCadastro] = useState('');
  const [senhaCadastro, setSenhaCadastro] = useState('');

  /* ---- Estado do formulário de login ---- */
  const [emailLogin, setEmailLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');

  /* ---- Estado de sucesso após cadastro ---- */
  const [cadastroConcluido, setCadastroConcluido] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  /* Troca a aba ativa e reseta o estado de sucesso */
  function trocarAba(novaAba) {
    setAbaAtiva(novaAba);
    setCadastroConcluido(false);
  }

  /* Valida e processa o envio do formulário de cadastro */
  function handleCadastro() {
    /* Validação básica: todos os campos devem estar preenchidos */
    if (!nomeCompleto || !emailCadastro || !senhaCadastro) {
      alert('Preencha todos os campos para continuar.');
      return;
    }

    /* Formata a mensagem personalizada de boas-vindas */
    const nomePerfil = perfilEscolhido === 'aluno' ? 'aluno' : 'monitor';
    setMensagemSucesso(`Olá, ${nomeCompleto}! Você se cadastrou como ${nomePerfil}.`);

    /* Exibe a tela de sucesso */
    setCadastroConcluido(true);
  }

  /* Valida e processa o envio do formulário de login */
  function handleLogin() {
    /* Validação básica */
    if (!emailLogin || !senhaLogin) {
      alert('Preencha email e senha para entrar.');
      return;
    }

    /* TODO: integrar com API de autenticação */
    alert('Login realizado com sucesso!');
  }

  /* ============================================================ */
  return (
    <div className="pagina-wrapper">
      <div className="card-principal">

        {/* ---- Área do logo e título ---- */}
        <div className="area-logo">

          {/* ====================================================
              ÍCONE DO TOPO — substitua o conteúdo abaixo pela sua imagem
              Exemplo com imagem própria:
                <img src="/caminho/para/sua-imagem.png" alt="MonitorEasy" width="40" height="40" />
              ==================================================== */}
          <div className="caixa-icone">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
              stroke="#2db874" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          {/* ==================================================== */}

          {/* Nome da plataforma */}
          <h1 className="titulo-app">MonitorEasy</h1>

          {/* Descrição curta */}
          <p className="subtitulo-app">Plataforma de ensino para monitores e alunos</p>
        </div>

        {/* ---- Abas de navegação ---- */}
        <div className="abas-container">
          <button
            className={`aba-botao ${abaAtiva === 'entrar' ? 'ativa' : ''}`}
            onClick={() => trocarAba('entrar')}
            type="button"
          >
            Entrar
          </button>
          <button
            className={`aba-botao ${abaAtiva === 'cadastrar' ? 'ativa' : ''}`}
            onClick={() => trocarAba('cadastrar')}
            type="button"
          >
            Cadastrar
          </button>
        </div>

        {/* ---- Tela de sucesso após cadastro ---- */}
        {cadastroConcluido && (
          <div className="area-sucesso">
            {/* Ícone de check em verde */}
            <div className="icone-sucesso">✓</div>

            {/* Título de confirmação */}
            <h3 className="sucesso-titulo">Cadastro realizado!</h3>

            {/* Mensagem personalizada com nome e perfil */}
            <p className="sucesso-descricao">{mensagemSucesso}</p>

            {/* Botão para ir para o login */}
            <button
              className="botao-principal"
              style={{ marginTop: '0.5rem' }}
              onClick={() => trocarAba('entrar')}
              type="button"
            >
              Ir para o login
            </button>
          </div>
        )}

        {/* ---- Formulário de cadastro ---- */}
        {abaAtiva === 'cadastrar' && !cadastroConcluido && (
          <div>
            {/* Campo: nome completo */}
            <div className="campo-grupo">
              <label className="campo-label" htmlFor="campo-nome">
                Nome completo
              </label>
              <input
                id="campo-nome"
                className="campo-input"
                type="text"
                placeholder="Seu nome"
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
              />
            </div>

            {/* Campo: seleção de perfil (Aluno ou Monitor) */}
            <div className="campo-grupo">
              <label className="campo-label">Sou...</label>
              <SeletorPerfil
                perfilSelecionado={perfilEscolhido}
                aoSelecionarPerfil={setPerfilEscolhido}
              />
            </div>

            {/* Campo: email */}
            <div className="campo-grupo">
              <label className="campo-label" htmlFor="campo-email-cadastro">
                Email
              </label>
              <input
                id="campo-email-cadastro"
                className="campo-input"
                type="email"
                placeholder="seu@email.com"
                value={emailCadastro}
                onChange={(e) => setEmailCadastro(e.target.value)}
              />
            </div>

            {/* Campo: senha com toggle de visibilidade */}
            <div className="campo-grupo">
              <label className="campo-label" htmlFor="campo-senha-cadastro">
                Senha
              </label>
              <CampoSenha
                id="campo-senha-cadastro"
                valor={senhaCadastro}
                aoAlterar={setSenhaCadastro}
              />
            </div>

            {/* Botão de envio do cadastro */}
            <button className="botao-principal" onClick={handleCadastro} type="button">
              Cadastrar
            </button>

            {/* Link para quem já tem conta */}
            <p className="rodape-formulario">
              Já tem conta?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); trocarAba('entrar'); }}>
                Entrar
              </a>
            </p>
          </div>
        )}

        {/* ---- Formulário de login ---- */}
        {abaAtiva === 'entrar' && !cadastroConcluido && (
          <div>
            {/* Campo: email de login */}
            <div className="campo-grupo">
              <label className="campo-label" htmlFor="campo-email-login">
                Email
              </label>
              <input
                id="campo-email-login"
                className="campo-input"
                type="email"
                placeholder="seu@email.com"
                value={emailLogin}
                onChange={(e) => setEmailLogin(e.target.value)}
              />
            </div>

            {/* Campo: senha de login com toggle */}
            <div className="campo-grupo">
              <label className="campo-label" htmlFor="campo-senha-login">
                Senha
              </label>
              <CampoSenha
                id="campo-senha-login"
                valor={senhaLogin}
                aoAlterar={setSenhaLogin}
              />
            </div>

            {/* Botão de envio do login */}
            <button className="botao-principal" onClick={handleLogin} type="button">
              Entrar
            </button>

            {/* Link para quem ainda não tem conta */}
            <p className="rodape-formulario">
              Não tem conta?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); trocarAba('cadastrar'); }}>
                Cadastrar
              </a>
            </p>
          </div>
        )}

      </div>
    </div>
  );
}