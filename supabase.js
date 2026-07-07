/**
 * ============================================================
 * SUPABASE — Integração completa com o banco de dados
 *
 * CONFIGURAÇÃO NECESSÁRIA:
 * 1. Acesse https://supabase.com → Seu Projeto → Settings → API
 * 2. Copie a URL do projeto e a chave anon (anon public key)
 * 3. Cole nos campos abaixo
 *
 * DEPENDÊNCIA:
 *  - SDK do Supabase (carregada via CDN no HTML antes deste arquivo)
 *    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *
 * SEGURANÇA:
 *  - As credenciais ficam expostas no frontend (anon key é pública por design)
 *  - A RLS protege os dados no banco (cada usuário só vê o que é seu)
 *  - Em produção, considere usar um backend (Edge Functions) para operações sensíveis
 *
 * ARQUITETURA:
 *  - Este arquivo: configuração + funções de dados
 *  - auth.js: fluxos de autenticação, UI, proteção de rotas
 *  - Separação clara: dados aqui, interação lá
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
 * Cliente Supabase inicializado.
 * Verifica se a SDK foi carregada antes de criar a instância.
 * Retorna null em caso de falha (auth.js trata o fallback).
 */
const supabase = (() => {
  try {
    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
      console.warn(
        '[Supabase] SDK não encontrada. Verifique se o script do CDN está carregado antes deste arquivo.'
      );
      return null;
    }

    if (!SUPABASE_CONFIG.URL || !SUPABASE_CONFIG.ANON_KEY) {
      console.warn(
        '[Supabase] Credenciais não configuradas. Edite as variáveis URL e ANON_KEY no topo deste arquivo.'
      );
      return null;
    }

    return window.supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    console.error('[Supabase] Erro fatal ao inicializar:', err);
    return null;
  }
})();


/**
 * ============================================================
 * Função auxiliar — Executa query Supabase com tratamento de erro
 * Padroniza o formato de erro para o front-end
 * ============================================================
 * @private
 */
async function _query(fn) {
  try {
    const result = await fn();
    return { data: result.data, error: null };
  } catch (err) {
    // Erro vindo do cliente Supabase (rede, permissão, etc.)
    if (err?.message || err?.error) {
      const msg = err.message || err.error?.message || 'Erro desconhecido na requisição.';
      return { data: null, error: { message: msg } };
    }
    return { data: null, error: { message: 'Erro inesperado.' }, details: err };
  }
}


/**
 * ============================================================
 * AUTENTICAÇÃO
 * ============================================================
 */
const SupabaseAuth = {

  /**
   * Cadastro de novo usuário.
   *
   * Fluxo:
   *  1. Cria conta no Supabase Auth (envia email de confirmação)
   *  2. O trigger handle_new_user cria o perfil automaticamente
   *  3. Registro de atividade de cadastro (via trigger)
   *  4. Retorna o usuário (email ainda não confirmado)
   *
   * NOTA: Se email confirmation estiver habilitado no dashboard,
   * o usuário precisa confirmar o email antes de fazer login.
   *
   * @param {Object} data
   * @param {string} data.email
   * @param {string} data.password
   * @param {string} data.nome - Nome completo
   * @param {string} [data.cpf]
   * @param {string} [data.telefone]
   * @param {string} [data.cidade]
   * @param {string} [data.estado]
   * @param {string} [data.nascimento] - formato YYYY-MM-DD
   * @returns {Promise<{user: Object|null, error: Object|null, needsConfirmation: boolean}>}
   */
  async register(data) {
    if (!supabase) return this._fallback('register');

    const { data: { user, error } = {} } = await _query(() =>
      supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            nome_completo: data.nome,
            cpf: data.cpf || null,
            telefone: data.telefone || null,
            cidade: data.cidade || null,
            estado: data.estado || null,
            nascimento: data.nascimento || null,
          },
          emailRedirectTo: `${window.location.origin}/login.html?confirmed=true`,
        },
      })
    );

    // Verificar se o email precisa de confirmação
    const needsConfirmation = !error && user && !user.confirmed_at && user.email && !user.email_confirmed_at;

    return {
      user: user || null,
      error,
      needsConfirmation,
    };
  },

  _fallback(action) {
    console.warn(`[Supabase] Falha ao executar "${action}". Verifique a configuração do Supabase.`);
    return {
      user: null,
      error: { message: 'Supabase não está configurado corretamente.' },
      needsConfirmation: false,
    };
  },

};
