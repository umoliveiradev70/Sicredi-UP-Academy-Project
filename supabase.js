/**
 * ============================================================
 * SUPABASE — Camada de integração com o banco de dados
 *
 * INSTRUÇÕES:
 * 1. Crie um projeto em https://supabase.com
 * 2. Substitua os valores abaixo pelas suas credenciais
 * 3. Habilite Authentication > Providers desejados (Email, Google)
 * 4. Configure as tabelas de perfil no SQL Editor se necessário
 *
 * Dependência: SDK do Supabase (carregada via CDN no HTML)
 * ============================================================
 */

const SUPABASE_CONFIG = {
  // ========================================================
  // SUBSTITUIR PELAS SUAS CREDENCIAIS DO SUPABASE
  // Encontradas em: Project Settings > API
  // ========================================================
  URL: 'https://pdmzfbulotluqovbivbn.supabase.co',
  ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkbXpmYnVsb3RsdXFvdmJpdmJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0MjMxMDAsImV4cCI6MjA5ODk5OTEwMH0.AT6SS6Bp07xgpF80j-KZIXcK4vNbTT_o5qjGwaVLRSI',
};

/**
 * Inicializa o cliente Supabase.
 * O objeto `window.supabase` é criado pelo SDK carregado via CDN.
 * Aqui apenas criamos uma instância configurada.
 */
const supabaseClient = (() => {
  try {
    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
      console.warn('[Supabase] SDK não encontrada. Usando modo simulado.');
      return null;
    }
    return window.supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);
  } catch (err) {
    console.error('[Supabase] Erro ao inicializar:', err);
    return null;
  }
})();

/**
 * ============================================================
 * FUNÇÕES DE AUTENTICAÇÃO — Supabase Auth
 * Cada função retorna uma Promise. Substituir os blocos
 * "MODO SIMULADO" pelas chamadas reais do Supabase.
 * ============================================================
 */

const SupabaseAuth = {

  /**
   * Cadastro de novo usuário com email e senha.
   * Após cadastro, o Supabase envia email de confirmação.
   *
   * @param {Object} data - { email, password, options: { data: { nome, cpf, telefone, cidade, estado, nascimento } } }
   * @returns {Promise<{ user, error }>}
   */
  async register(data) {
    // ========================================================
    // MODO REAL — Descomentar quando Supabase estiver configurado:
    // ========================================================
    /*
    const { data: { user, error }, ...rest } = await supabaseClient.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          nome_completo: data.nome,
          cpf: data.cpf,
          telefone: data.telefone,
          cidade: data.cidade,
          estado: data.estado,
          data_nascimento: data.nascimento,
        },
        emailRedirectTo: `${window.location.origin}/dashboard.html`,
      },
    });
    return { user, error };
    */

    // ========================================================
    // MODO SIMULADO — Remover quando integrar com Supabase
    // ========================================================
    console.log('[Supabase] register() — modo simulado', data);
    await this._delay(1500);
    return { user: { id: 'sim-' + Date.now(), email: data.email }, error: null };
  },

  /**
   * Login com email e senha.
   * Retorna sessão com access_token e refresh_token.
   *
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ user, session, error }>}
   */
  async login(email, password) {
    // ========================================================
    // MODO REAL:
    // ========================================================
    /*
    const { data: { user, session }, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    return { user, session, error };
    */

    // ========================================================
    // MODO SIMULADO:
    // ========================================================
    console.log('[Supabase] login() — modo simulado', { email });
    await this._delay(1200);

    if (email === 'erro@teste.com') {
      return { user: null, session: null, error: { message: 'Credenciais inválidas' } };
    }

    // Simular sessão armazenada no localStorage
    const mockUser = {
      id: 'usr_sim_' + Date.now(),
      email: email,
      user_metadata: {
        nome_completo: 'João Silva',
        avatar_url: null,
      },
    };
    const mockSession = {
      access_token: 'mock_access_' + Date.now(),
      refresh_token: 'mock_refresh_' + Date.now(),
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: mockUser,
    };

    localStorage.setItem('up_academy_session', JSON.stringify(mockSession));
    return { user: mockUser, session: mockSession, error: null };
  },

  /**
   * Login com Google (OAuth).
   *
   * @returns {Promise<{ user, session, error }>}
   */
  async loginWithGoogle() {
    // ========================================================
    // MODO REAL:
    // ========================================================
    /*
    const { data: { user, session }, error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard.html`,
      },
    });
    return { user, session, error };
    */

    // ========================================================
    // MODO SIMULADO:
    // ========================================================
    console.log('[Supabase] loginWithGoogle() — modo simulado');
    await this._delay(1200);

    const mockUser = {
      id: 'usr_google_' + Date.now(),
      email: 'joao@gmail.com',
      user_metadata: { nome_completo: 'João Silva', avatar_url: null },
    };
    const mockSession = {
      access_token: 'mock_google_' + Date.now(),
      refresh_token: 'mock_google_r_' + Date.now(),
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: mockUser,
    };

    localStorage.setItem('up_academy_session', JSON.stringify(mockSession));
    return { user: mockUser, session: mockSession, error: null };
  },

  /**
   * Logout — Encerra a sessão no cliente e no Supabase.
   *
   * @returns {Promise<{ error }>}
   */
  async logout() {
    // ========================================================
    // MODO REAL:
    // ========================================================
    /*
    const { error } = await supabaseClient.auth.signOut();
    localStorage.removeItem('up_academy_session');
    return { error };
    */

    // ========================================================
    // MODO SIMULADO:
    // ========================================================
    console.log('[Supabase] logout() — modo simulado');
    localStorage.removeItem('up_academy_session');
    await this._delay(300);
    return { error: null };
  },

  /**
   * Recuperação de senha — Envia link de reset por email.
   *
   * @param {string} email
   * @returns {Promise<{ error }>}
   */
  async forgotPassword(email) {
    // ========================================================
    // MODO REAL:
    // ========================================================
    /*
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login.html`,
    });
    return { error };
    */

    // ========================================================
    // MODO SIMULADO:
    // ========================================================
    console.log('[Supabase] forgotPassword() — modo simulado', { email });
    await this._delay(1500);
    return { error: null };
  },

  /**
   * Verifica se há sessão ativa e é válida.
   * Tenta refresh se o token estiver próximo de expirar.
   *
   * @returns {Promise<{ session: Object|null, user: Object|null }>}
   */
  async checkSession() {
    // ========================================================
    // MODO REAL:
    // ========================================================
    /*
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error || !session) return { session: null, user: null };

    // Verificar se está próximo de expirar (5 min de margem)
    const expiresAt = session.expires_at * 1000;
    const now = Date.now();
    if (expiresAt - now < 300000) {
      const { data: { session: newSession }, error: refreshError } = await supabaseClient.auth.refreshSession();
      if (refreshError) {
        localStorage.removeItem('up_academy_session');
        return { session: null, user: null };
      }
      return { session: newSession, user: newSession.user };
    }

    return { session, user: session.user };
    */

    // ========================================================
    // MODO SIMULADO:
    // ========================================================
    const stored = localStorage.getItem('up_academy_session');
    if (!stored) return { session: null, user: null };

    try {
      const session = JSON.parse(stored);
      if (session.expires_at && session.expires_at < Math.floor(Date.now() / 1000)) {
        localStorage.removeItem('up_academy_session');
        return { session: null, user: null };
      }
      return { session, user: session.user };
    } catch {
      localStorage.removeItem('up_academy_session');
      return { session: null, user: null };
    }
  },

  /**
   * Atualiza os metadados do perfil do usuário.
   *
   * @param {Object} attributes - { nome_completo, telefone, cidade, estado, avatar_url }
   * @returns {Promise<{ user, error }>}
   */
  async updateProfile(attributes) {
    // ========================================================
    // MODO REAL:
    // ========================================================
    /*
    const { data: { user }, error } = await supabaseClient.auth.updateUser({
      data: attributes,
    });
    return { user, error };
    */

    // ========================================================
    // MODO SIMULADO:
    // ========================================================
    console.log('[Supabase] updateProfile() — modo simulado', attributes);
    await this._delay(800);

    const stored = localStorage.getItem('up_academy_session');
    if (stored) {
      const session = JSON.parse(stored);
      if (session.user && session.user.user_metadata) {
        Object.assign(session.user.user_metadata, attributes);
        localStorage.setItem('up_academy_session', JSON.stringify(session));
        return { user: session.user, error: null };
      }
    }
    return { user: null, error: { message: 'Sessão não encontrada' } };
  },

  /**
   * Utilitário interno — Simula delay assíncrono.
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
};