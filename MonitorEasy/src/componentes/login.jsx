import React, { useState } from 'react';
import './login.css';

/**
 * Componente de Login e Cadastro para a plataforma MonitorEasy.
 * Suporta alternância dinâmica entre Login e Cadastro, validações integradas,
 * controle de exibição de senha, estados de carregamento e seleção interativa de papéis.
 */
export default function Login() {
  // Estado para controlar a alternância entre modo Login (true) e modo Cadastro (false)
  const [isLogin, setIsLogin] = useState(false); 
  
  // Estado para armazenar os valores digitados nos inputs do formulário
  const [formData, setFormData] = useState({
    name: '',       // Nome completo (usado apenas no Cadastro)
    email: '',      // Endereço de e-mail do usuário
    password: '',   // Senha (mínimo de 6 caracteres)
    role: 'aluno',  // Papel selecionado: 'aluno' ou 'monitor'
  });
  
  // Estados para gerenciar erros de validação, carregamento de requisições,
  // exibição de senha em formato texto e mensagens de sucesso pós-envio
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  /**
   * Captura as mudanças nos campos de entrada de texto comuns e atualiza o estado formData.
   * Além disso, remove a mensagem de erro daquele campo assim que o usuário começa a digitar.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Limpa o erro do respectivo campo se houver
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  /**
   * Altera a seleção de papel do usuário entre 'aluno' e 'monitor'.
   */
  const handleRoleSelect = (role) => {
    setFormData((prev) => ({
      ...prev,
      role: role,
    }));
  };

  /**
   * Realiza a validação local do formulário de acordo com o modo ativo (Login ou Cadastro).
   * Retorna true se todos os dados forem válidos ou false caso existam erros.
   */
  const validateForm = () => {
    const newErrors = {};
    
    // Validar nome apenas se estiver no formulário de Cadastro
    if (!isLogin && !formData.name.trim()) {
      newErrors.name = 'O nome é obrigatório';
    }
    
    // Validar preenchimento e formato de e-mail
    if (!formData.email.trim()) {
      newErrors.email = 'O e-mail é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Insira um e-mail válido';
    }
    
    // Validar tamanho mínimo da senha
    if (!formData.password) {
      newErrors.password = 'A senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'A senha deve ter pelo menos 6 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Gerencia o envio do formulário, impedindo o comportamento padrão do HTML.
   * Executa a validação e simula uma chamada de rede assíncrona (com delay) para fins visuais.
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setSuccessMessage('');

    // Simula uma chamada de API usando um temporizador de 1.5 segundos
    setTimeout(() => {
      setIsLoading(false);
      if (isLogin) {
        setSuccessMessage(`Bem-vindo de volta! Login realizado como ${formData.role === 'aluno' ? 'Aluno' : 'Monitor'}.`);
      } else {
        setSuccessMessage(`Cadastro realizado com sucesso! Bem-vindo, ${formData.name} (${formData.role === 'aluno' ? 'Aluno' : 'Monitor'}).`);
      }
    }, 1500);
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        
        {/* Efeitos visuais de brilho no fundo (Ambient Glows) para design moderno */}
        <div className="glow-effect glow-1"></div>
        <div className="glow-effect glow-2"></div>

        <div className="login-card">
          
          {/* Cabeçalho do Card */}
          <div className="card-header">
            <div className="logo-section">
              {/* Logotipo SVG personalizado e vetorizado contendo o mascot com chapéu e óculos */}
              <svg className="app-logo" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Sobrancelhas do mascot */}
                <path d="M 28 53 A 8 8 0 0 1 42 53" stroke="var(--text-h)" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 58 53 A 8 8 0 0 1 72 53" stroke="var(--text-h)" strokeWidth="2.5" strokeLinecap="round" />
                
                {/* Ponte da armação dos óculos */}
                <path d="M 45 65 H 55" stroke="var(--text-h)" strokeWidth="2.5" strokeLinecap="round" />
                
                {/* Lentes circulares dos óculos */}
                <circle cx="35" cy="65" r="10" stroke="var(--text-h)" strokeWidth="2.5" />
                <circle cx="65" cy="65" r="10" stroke="var(--text-h)" strokeWidth="2.5" />
                
                {/* Olho Esquerdo (Aberto e olhando alegremente para cima e esquerda) */}
                <circle cx="33" cy="65" r="4.5" fill="var(--text-h)" />
                <circle cx="31.5" cy="63.5" r="1.5" fill="#ffffff" />
                
                {/* Olho Direito (Piscando - Curva feliz) */}
                <path d="M 60 65 Q 65 61 70 65" stroke="var(--text-h)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                
                {/* Sorriso do mascot */}
                <path d="M 40 80 Q 50 90 60 80" stroke="var(--text-h)" strokeWidth="2.5" strokeLinecap="round" fill="none" />

                {/* Copinha/base de tecido do chapéu de formatura */}
                <path d="M 37 32 C 37 32 38 46 50 46 C 62 46 63 32 63 32 C 63 32 50 38 37 32 Z" fill="var(--accent)" />
                
                {/* Placa superior do chapéu de formatura (losango) */}
                <path d="M 28 27 L 50 14 L 72 27 L 50 40 Z" stroke="var(--accent)" strokeWidth="3" strokeLinejoin="round" fill="none" />
                
                {/* Cordão e pingente do chapéu (tassel) caindo para a direita */}
                <path d="M 72 27 L 70 41" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" />
                <circle cx="70" cy="42.5" r="2.2" fill="var(--accent)" />
                <path d="M 68 45 L 72 45 L 73 57 L 67 57 Z" fill="var(--accent)" />
              </svg>
              {/* Título textual estilizado com pesos diferentes para marcar a marca */}
              <h2 className="app-title">MONITOR<span>EASY</span></h2>
            </div>
            
            {/* Texto de apoio dinâmico */}
            <p className="card-subtitle">
              {isLogin ? 'Faça login para acessar sua conta' : 'Crie sua conta e comece agora mesmo'}
            </p>

            {/* Alternador Deslizante (Pill Switch) */}
            <div className="toggle-container">
              <button 
                type="button" 
                className={`toggle-btn ${!isLogin ? 'active' : ''}`} 
                onClick={() => { setIsLogin(false); setSuccessMessage(''); setErrors({}); }}
              >
                Cadastro
              </button>
              <button 
                type="button" 
                className={`toggle-btn ${isLogin ? 'active' : ''}`} 
                onClick={() => { setIsLogin(true); setSuccessMessage(''); setErrors({}); }}
              >
                Login
              </button>
              {/* Pill deslizante que se move fisicamente via CSS usando transform */}
              <div className={`toggle-pill ${isLogin ? 'slide-right' : 'slide-left'}`}></div>
            </div>
          </div>

          {/* Banner de Mensagem de Sucesso (Exibido de forma animada se houver valor) */}
          {successMessage && (
            <div className="alert-message success animate-fade-in">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>{successMessage}</span>
            </div>
          )}

          {/* Formulário de Ação */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-fields">
              
              {/* Campo Nome Completo (Renderizado apenas se NÃO for Login) */}
              {!isLogin && (
                <div className={`input-group ${errors.name ? 'has-error' : ''}`}>
                  <label htmlFor="name">Nome Completo</label>
                  <div className="input-wrapper">
                    {/* Ícone de Usuário */}
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Seu nome"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  {/* Mensagem de erro sob o campo */}
                  {errors.name && <span className="error-text">{errors.name}</span>}
                </div>
              )}

              {/* Campo de Entrada de E-mail */}
              <div className={`input-group ${errors.email ? 'has-error' : ''}`}>
                <label htmlFor="email">E-mail</label>
                <div className="input-wrapper">
                  {/* Ícone de Envelope */}
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="exemplo@email.com"
                    disabled={isLoading}
                    required
                  />
                </div>
                {/* Mensagem de erro sob o campo */}
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              {/* Campo de Entrada de Senha */}
              <div className={`input-group ${errors.password ? 'has-error' : ''}`}>
                <label htmlFor="password">Senha</label>
                <div className="input-wrapper">
                  {/* Ícone de Cadeado */}
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    disabled={isLoading}
                    required
                  />
                  {/* Botão de Revelação de Senha */}
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      /* Ícone de Olho com barra (esconder) */
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      /* Ícone de Olho aberto (mostrar) */
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
                {/* Mensagem de erro sob o campo */}
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>

              {/* Seletor Customizado de Papel (Aluno vs Monitor) em formato Grid Card */}
              <div className="input-group">
                <label className="section-label">Você é Aluno ou Monitor?</label>
                <div className="role-selector-grid">
                  
                  {/* Card Interativo: Aluno */}
                  <div
                    className={`role-option-card ${formData.role === 'aluno' ? 'selected' : ''}`}
                    onClick={() => !isLoading && handleRoleSelect('aluno')}
                    role="radio"
                    aria-checked={formData.role === 'aluno'}
                    tabIndex={isLoading ? -1 : 0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleRoleSelect('aluno');
                      }
                    }}
                  >
                    {/* Brilho interno do card selecionado */}
                    <div className="role-card-glow"></div>
                    {/* Círculo do Ícone */}
                    <div className="role-icon-wrapper">
                      {/* Ícone de chapéu acadêmico */}
                      <svg className="role-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                        <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path>
                      </svg>
                    </div>
                    {/* Descritivos */}
                    <div className="role-card-content">
                      <span className="role-title">Aluno</span>
                      <span className="role-desc">Preciso de ajuda com disciplinas</span>
                    </div>
                    {/* Marcador em círculo para indicar seleção física (estilo radio button) */}
                    <div className="role-radio-indicator"></div>
                  </div>

                  {/* Card Interativo: Monitor */}
                  <div
                    className={`role-option-card ${formData.role === 'monitor' ? 'selected' : ''}`}
                    onClick={() => !isLoading && handleRoleSelect('monitor')}
                    role="radio"
                    aria-checked={formData.role === 'monitor'}
                    tabIndex={isLoading ? -1 : 0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleRoleSelect('monitor');
                      }
                    }}
                  >
                    {/* Brilho interno do card selecionado */}
                    <div className="role-card-glow"></div>
                    {/* Círculo do Ícone */}
                    <div className="role-icon-wrapper">
                      {/* Ícone de prancheta de desenho/ensino */}
                      <svg className="role-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                      </svg>
                    </div>
                    {/* Descritivos */}
                    <div className="role-card-content">
                      <span className="role-title">Monitor</span>
                      <span className="role-desc">Quero orientar e tirar dúvidas</span>
                    </div>
                    {/* Marcador em círculo para indicar seleção física (estilo radio button) */}
                    <div className="role-radio-indicator"></div>
                  </div>

                </div>
              </div>

            </div>

            {/* Botão de Envio Principal (Suporta carregamento dinâmico e impede múltiplos cliques) */}
            <button
              type="submit"
              className={`submit-btn ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                /* Spinner animado com SVG */
                <span className="spinner-wrapper">
                  <svg className="spinner" viewBox="0 0 24 24">
                    <circle className="path" cx="12" cy="12" r="10" fill="none" strokeWidth="4"></circle>
                  </svg>
                  Processando...
                </span>
              ) : (
                <span>{isLogin ? 'Entrar' : 'Criar Conta'}</span>
              )}
            </button>
          </form>
          
          {/* Rodapé do Card (Link dinâmico alternador secundário) */}
          <div className="card-footer">
            <p>
              {isLogin ? (
                <>
                  Novo no MonitorEasy?{' '}
                  <button
                    type="button"
                    className="footer-link"
                    onClick={() => { setIsLogin(false); setSuccessMessage(''); setErrors({}); }}
                    disabled={isLoading}
                  >
                    Crie uma conta
                  </button>
                </>
              ) : (
                <>
                  Já possui uma conta?{' '}
                  <button
                    type="button"
                    className="footer-link"
                    onClick={() => { setIsLogin(true); setSuccessMessage(''); setErrors({}); }}
                    disabled={isLoading}
                  >
                    Faça login
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
