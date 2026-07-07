/**
 * ============================================================
 * AUTH.JS — Autenticação e controle de sessão
 *
 * Responsabilidades:
 *  - login() / register() / logout() / forgotPassword()
 *  - checkSession() — verifica sessão ao carregar página
 *  - updateNavbar() — atualiza nav conforme estado da sessão
 *  - redirectIfLogged() / redirectIfNotLogged()
 *  - Validação de formulários (login, cadastro, recuperação)
 *  - Indicador de força da senha
 *  - Toggle de visibilidade da senha
 *  - Máscara de CPF
 *
 * Depende de: script.js (toast, partículas, nav, scroll)
 *             supabase.js (SupabaseAuth)
 * ============================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';


  /* ==========================================================
     UTILITÁRIOS LOCAIS
     ========================================================== */
  const $ = (sel, ctx = document) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx = document) => [...(ctx || document).querySelectorAll(sel)];

  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };


  /* ==========================================================
     TOGGLE DE VISIBILIDADE DA SENHA
     ========================================================== */
  $$('.auth-toggle-pass').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = $(`#${btn.dataset.target}`);
      if (!target) return;
      const isPassword = target.type === 'password';
      target.type = isPassword ? 'text' : 'password';
      btn.classList.toggle('active', isPassword);
      btn.setAttribute('aria-label', isPassword ? 'Ocultar senha' : 'Mostrar senha');
    });
  });


  /* ==========================================================
     FORÇA DA SENHA
     ========================================================== */
  const initPasswordStrength = () => {
    const input = $('#cad-senha');
    const fill = $('#strength-fill');
    const label = $('#strength-label');
    if (!input || !fill || !label) return;

    const levels = [
      { min: 0, width: '0%', color: 'transparent', text: '' },
      { min: 1, width: '20%', color: '#ff4d4f', text: 'Fraca' },
      { min: 4, width: '40%', color: '#ff9800', text: 'Razoável' },
      { min: 6, width: '65%', color: '#ffc107', text: 'Boa' },
      { min: 8, width: '85%', color: '#8bc34a', text: 'Forte' },
      { min: 10, width: '100%', color: '#00A859', text: 'Excelente' },
    ];

    const evaluate = (val) => {
      let score = 0;
      if (val.length >= 1) score++;
      if (val.length >= 4) score++;
      if (val.length >= 6) score++;
      if (/[A-Z]/.test(val)) score++;
      if (/[0-9]/.test(val)) score++;
      if (/[^A-Za-z0-9]/.test(val)) score++;
      if (val.length >= 10) score++;
      return Math.min(score, 5);
    };

    input.addEventListener('input', () => {
      const val = input.value;
      const score = val.length === 0 ? 0 : evaluate(val);
      const level = levels[score];

      fill.style.width = level.width;
      fill.style.background = level.color;
      label.textContent = level.text;
      label.style.color = level.color;
    });
  };


  /* ==========================================================
     MÁSCARA DE CPF
     ========================================================== */
  const initCPFMask = () => {
    const input = $('#cad-cpf');
    if (!input) return;
    input.addEventListener('input', () => {
      let d = input.value.replace(/\D/g, '').slice(0, 11);
      input.value = d.length > 9
        ? `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`
        : d.length > 6
        ? `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`
        : d.length > 3
        ? `${d.slice(0,3)}.${d.slice(3)}`
        : d;
    });
  };


  /* ==========================================================
     MÁSCARA DE TELEFONE (reutiliza lógica, aplica ao cadastro)
     ========================================================== */
  const initPhoneMask = () => {
    const input = $('#cad-telefone');
    if (!input) return;
    input.addEventListener('input', () => {
      let d = input.value.replace(/\D/g, '').slice(0, 11);
      input.value = d.length > 6 ? `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
        : d.length > 2 ? `(${d.slice(0,2)}) ${d.slice(2)}` : d.length > 0 ? `(${d}` : '';
    });
  };


  /* ==========================================================
     VALIDAÇÃO GENÉRICA DE CAMPOS
     ========================================================== */
  const validateField = (id, rules) => {
    const el = $(`#${id}`);
    const errEl = $(`#${id}-error`);
    if (!el || !errEl) return true;

    const val = el.value.trim();
    let msg = '';

    if (rules.required && !val) msg = rules.requiredMsg || 'Campo obrigatório.';
    else if (rules.email && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) msg = 'E-mail inválido.';
    else if (rules.minLength && val.length < rules.minLength) msg = `Mínimo ${rules.minLength} caracteres.`;
    else if (rules.maxLength && val.length > rules.maxLength) msg = `Máximo ${rules.maxLength} caracteres.`;
    else if (rules.match && val && !rules.match.test(val)) msg = rules.matchMsg || 'Formato inválido.';
    else if (rules.custom) msg = rules.custom(val, el);

    errEl.textContent = msg;
    el.classList.toggle('error', !!msg);
    return !msg;
  };

  const clearErrors = (...ids) => {
    ids.forEach(id => {
      const el = $(`#${id}`);
      const errEl = $(`#${id}-error`);
      if (el) el.classList.remove('error');
      if (errEl) errEl.textContent = '';
    });
  };


  /* ==========================================================
     LOGIN
     ========================================================== */
  const initLoginForm = () => {
    const form = $('#loginForm');
    const btn = $('#loginBtn');
    if (!form || !btn) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors('login-email', 'login-senha');

      const emailOk = validateField('login-email', { required: true, requiredMsg: 'Informe seu e-mail.', email: true });
      const senhaOk = validateField('login-senha', { required: true, requiredMsg: 'Informe sua senha.', minLength: 6 });

      if (!emailOk || !senhaOk) {
        const firstErr = form.querySelector('.form-input.error');
        if (firstErr) { firstErr.focus(); firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        return;
      }

      const email = $('#login-email').value;
      const senha = $('#login-senha').value;

      btn.classList.add('loading');
      btn.disabled = true;

      const { user, error } = await SupabaseAuth.login(email, senha);

      btn.classList.remove('loading');
      btn.disabled = false;

      if (error) {
        showToast('E-mail ou senha incorretos.', 'error');
        return;
      }

      showToast('Login realizado com sucesso!', 'success');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
    });
  };


  /* ==========================================================
     LOGIN COM GOOGLE
     ========================================================== */
  const initGoogleLogin = () => {
    const btn = $('#googleLoginBtn');
    if (!btn) return;

    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.style.opacity = '0.6';

      const { user, error } = await SupabaseAuth.loginWithGoogle();

      btn.disabled = false;
      btn.style.opacity = '1';

      if (error) {
        showToast('Erro ao conectar com Google.', 'error');
        return;
      }

      showToast('Login com Google realizado!', 'success');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
    });
  };


  /* ==========================================================
     CADASTRO
     ========================================================== */
  const initCadastroForm = () => {
    const form = $('#cadastroForm');
    const btn = $('#cadBtn');
    if (!form || !btn) return;

    // Validação em tempo real
    ['cad-nome', 'cad-email', 'cad-cpf', 'cad-telefone', 'cad-cidade', 'cad-nascimento', 'cad-estado', 'cad-senha', 'cad-confirmar'].forEach(id => {
      const el = $(`#${id}`);
      if (!el) return;
      el.addEventListener('blur', () => validateCadastroField(id));
      if (el.type !== 'checkbox') {
        el.addEventListener('input', () => { if (el.classList.contains('error')) validateCadastroField(id); });
      }
    });

    // Senha → confirmar senha sincronizado
    const senhaEl = $('#cad-senha');
    const confirmEl = $('#cad-confirmar');
    if (senhaEl && confirmEl) {
      senhaEl.addEventListener('input', () => { if (confirmEl.classList.contains('error')) validateCadastroField('cad-confirmar'); });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fields = ['cad-nome', 'cad-cpf', 'cad-nascimento', 'cad-telefone', 'cad-cidade', 'cad-estado', 'cad-email', 'cad-senha', 'cad-confirmar'];
      fields.forEach(f => clearErrors(f));
      $('#cad-termos-error').textContent = '';

      let ok = true, firstErr = null;
      fields.forEach(f => { if (!validateCadastroField(f) && ok) { ok = false; firstErr = f; } });

      // Checkboxes
      const termos = $('#cad-termos');
      const privacidade = $('#cad-privacidade');
      if (!termos.checked || !privacidade.checked) {
        $('#cad-termos-error').textContent = 'Você precisa aceitar os termos e a política de privacidade.';
        if (ok) { ok = false; firstErr = 'cad-termos'; }
      }

      if (!ok) {
        if (firstErr) { const el = $(`#${firstErr}`); if (el) { el.focus(); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }
        return;
      }

      const data = {
        nome: $('#cad-nome').value.trim(),
        cpf: $('#cad-cpf').value.trim(),
        nascimento: $('#cad-nascimento').value,
        telefone: $('#cad-telefone').value.trim(),
        cidade: $('#cad-cidade').value.trim(),
        estado: $('#cad-estado').value,
        email: $('#cad-email').value.trim(),
        password: $('#cad-senha').value,
      };

      btn.classList.add('loading');
      btn.disabled = true;

      const { user, error } = await SupabaseAuth.register(data);

      btn.classList.remove('loading');
      btn.disabled = false;

      if (error) {
        showToast(error.message || 'Erro ao criar conta.', 'error');
        return;
      }

      showToast('Conta criada com sucesso! Verifique seu e-mail.', 'success');
      setTimeout(() => { window.location.href = 'login.html'; }, 1500);
    });
  };

  const validateCadastroField = (id) => {
    const rules = {
      'cad-nome': { required: true, requiredMsg: 'Informe seu nome.', minLength: 3, match: /^[a-zA-ZÀ-ÿ\s]+$/, matchMsg: 'Apenas letras.' },
      'cad-cpf': { required: true, requiredMsg: 'Informe seu CPF.', custom: (v) => v.replace(/\D/g, '').length === 11 ? '' : 'CPF inválido.' },
      'cad-nascimento': { required: true, requiredMsg: 'Informe sua data de nascimento.' },
      'cad-telefone': { required: true, requiredMsg: 'Informe seu telefone.', custom: (v) => v.replace(/\D/g, '').length >= 10 ? '' : 'Telefone inválido.' },
      'cad-cidade': { required: true, requiredMsg: 'Informe sua cidade.', minLength: 2 },
      'cad-estado': { required: true, requiredMsg: 'Selecione seu estado.' },
      'cad-email': { required: true, requiredMsg: 'Informe seu e-mail.', email: true },
      'cad-senha': { required: true, requiredMsg: 'Informe sua senha.', minLength: 8 },
      'cad-confirmar': { required: true, requiredMsg: 'Confirme sua senha.', custom: () => {
        const s = $('#cad-senha')?.value;
        const c = $('#cad-confirmar')?.value;
        return (s && c && s === c) ? '' : 'As senhas não coincidem.';
      }},
    };
    return validateField(id, rules[id] || {});
  };


  /* ==========================================================
     RECUPERAÇÃO DE SENHA
     ========================================================== */
  const initRecoverForm = () => {
    const form = $('#recoverForm');
    const btn = $('#recoverBtn');
    const success = $('#recover-success');
    if (!form || !btn) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors('recover-email');

      if (!validateField('recover-email', { required: true, requiredMsg: 'Informe seu e-mail.', email: true })) return;

      const email = $('#recover-email').value;

      btn.classList.add('loading');
      btn.disabled = true;

      const { error } = await SupabaseAuth.forgotPassword(email);

      btn.classList.remove('loading');
      btn.disabled = false;

      if (error) {
        showToast(error.message || 'Erro ao enviar recuperação.', 'error');
        return;
      }

      form.style.display = 'none';
      if (success) success.style.display = 'block';
    });
  };


  /* ==========================================================
     ATUALIZAR NAVBAR CONFORME SESSÃO
     ========================================================== */
  const updateNavbar = async () => {
    const container = $('#nav-auth');
    if (!container) return;

    const { session, user } = await SupabaseAuth.checkSession();

    if (session && user) {
      const nome = user.user_metadata?.nome_completo || user.email?.split('@')[0] || 'Usuário';
      container.innerHTML = `
        <div class="nav-auth-user">
          <span class="nav-auth-name">Olá, ${nome}</span>
          <span class="nav-auth-divider" aria-hidden="true"></span>
          <a href="dashboard.html" class="nav-auth-link nav-auth-link--login">Minha Conta</a>
          <button class="nav-auth-logout" id="nav-logout" aria-label="Sair">Sair</button>
        </div>
      `;

      // Evento de logout no nav
      const logoutBtn = $('#nav-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
          await SupabaseAuth.logout();
          showToast('Sessão encerrada.', 'info');
          setTimeout(() => { window.location.href = 'index.html'; }, 500);
        });
      }

      // Atualizar dashboard com dados reais
      const dashName = $('#dash-user-name');
      const dashEmail = $('#dash-user-email');
      const dashInitials = $('#dash-avatar-initials');
      if (dashName) dashName.textContent = nome;
      if (dashEmail) dashEmail.textContent = user.email || '';
      if (dashInitials) {
        const initials = nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        dashInitials.textContent = initials;
      }

      // Contadores no dashboard
      $$('[data-count]').forEach(el => {
        const target = parseInt(el.dataset.count, 10);
        const start = performance.now();
        const step = (now) => {
          const p = Math.min((now - start) / 1000, 1);
          el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target).toLocaleString('pt-BR');
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });

    } else {
      container.innerHTML = `
        <a href="login.html" class="nav-auth-link nav-auth-link--login">Entrar</a>
        <a href="cadastro.html" class="nav-auth-link nav-auth-link--register">Criar Conta</a>
      `;
    }
  };


  /* ==========================================================
     PROTEÇÃO DE PÁGINAS
     ========================================================== */
  const redirectIfLogged = async () => {
    const isProtected = document.querySelector('[data-protected]');
    if (!isProtected) return;

    const { session } = await SupabaseAuth.checkSession();
    if (!session) {
      window.location.replace('login.html');
    }
  };

  const redirectIfNotLogged = async () => {
    if (document.querySelector('[data-protected]')) return;

    const pages = ['login.html', 'cadastro.html', 'recuperar-senha.html'];
    const isAuthPage = pages.some(p => window.location.pathname.endsWith(p));
    if (!isAuthPage) return;

    const { session } = await SupabaseAuth.checkSession();
    if (session) {
      window.location.replace('dashboard.html');
    }
  };


  /* ==========================================================
     LOGOUT DO DASHBOARD
     ========================================================== */
  const initDashboardLogout = () => {
    const btn = $('#dash-logout');
    if (!btn) return;

    btn.addEventListener('click', async () => {
      await SupabaseAuth.logout();
      showToast('Sessão encerrada.', 'info');
      setTimeout(() => { window.location.href = 'index.html'; }, 500);
    });
  };


  /* ==========================================================
     INICIALIZAR
     ========================================================== */
  initPasswordStrength();
  initCPFMask();
  initPhoneMask();
  initLoginForm();
  initGoogleLogin();
  initCadastroForm();
  initRecoverForm();
  initDashboardLogout();

  // Verificar sessão e atualizar nav (assíncrono)
  updateNavbar();

  // Proteção/redirecionamento de páginas
  redirectIfLogged();
  redirectIfNotLogged();

});