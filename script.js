/**
 * ============================================================
 * SICREDI UP ACADEMY — Script Principal
 *
 * Módulos:
 *  1.  Utilitários (throttle, debounce)
 *  2.  Partículas Globais (fundo fixo do site inteiro)
 *  3.  Partículas do Hero (canvas com conexões e interação)
 *  4.  Navegação (scroll, menu mobile, link ativo)
 *  5.  Scroll Suave
 *  6.  Animações ao Rolar
 *  7.  Contador Animado
 *  8.  Máscara de Telefone
 *  9.  Validação do Formulário
 *  10. Modal de Sucesso
 *  11. FAQ Acordeão
 *  12. Botão Voltar ao Topo
 *  13. Inicialização
 * ============================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';


  /* ==========================================================
     1. UTILITÁRIOS
     ========================================================== */
  const throttle = (fn, delay) => {
    let last = 0;
    return (...args) => {
      const now = Date.now();
      if (now - last >= delay) { last = now; fn.apply(this, args); }
    };
  };

  const debounce = (fn, delay) => {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), delay); };
  };


  /* ==========================================================
     2. PARTÍCULAS GLOBAIS
     Canvas fixo cobrindo toda a janela.
     Partículas pequenas (0.5-1.5px), muito sutis,
     com variação de velocidade e opacidade.
     Cria um efeito de "poeira estelar" no fundo.
     ========================================================== */
  const initGlobalParticles = () => {
    const canvas = document.getElementById('globalParticles');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animId = null;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', debounce(resize, 250));

    // Partícula global — pequena, lenta, sutil
    class GlobalParticle {
      constructor(init) {
        this.x = Math.random() * canvas.width;
        this.y = init ? Math.random() * canvas.height : canvas.height + Math.random() * 40;
        this.size = Math.random() * 1.2 + 0.4;
        this.speedY = -(Math.random() * 0.15 + 0.03);
        this.speedX = (Math.random() - 0.5) * 0.08;
        this.opacity = Math.random() * 0.35 + 0.05;
        this.maxOpacity = this.opacity;
        this.fade = Math.random() * 0.0008 + 0.0003;
        // Variação de cor: algumas partículas levemente mais claras
        this.brightness = Math.random() > 0.7 ? 1.3 : 1;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.opacity -= this.fade;

        // Brilho pulsante sutil
        this.currentOpacity = this.opacity * (0.7 + 0.3 * Math.sin(Date.now() * 0.001 + this.x * 0.01));

        if (this.opacity <= 0 || this.y < -20) {
          this.x = Math.random() * canvas.width;
          this.y = canvas.height + Math.random() * 40;
          this.opacity = this.maxOpacity;
        }
      }

      draw() {
        const alpha = Math.max(0, this.currentOpacity || this.opacity);
        if (alpha < 0.01) return;

        const r = Math.min(255, Math.round(0 * this.brightness));
        const g = Math.min(255, Math.round(168 * this.brightness));
        const b = Math.min(255, Math.round(89 * this.brightness));

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.fill();
      }
    }

    // Quantidade adaptativa
    const create = () => {
      particles = [];
      const area = canvas.width * canvas.height;
      const count = Math.min(120, Math.max(30, Math.floor(area / 12000)));
      for (let i = 0; i < count; i++) particles.push(new GlobalParticle(true));
    };

    create();
    window.addEventListener('resize', debounce(create, 350));

    // Desenhar conexões muito sutis entre partículas muito próximas
    const drawConnections = () => {
      const maxDist = 70;
      const len = particles.length;
      for (let i = 0; i < len; i++) {
        for (let j = i + 1; j < len; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;

          // Otimização: pular se a distância em X ou Y já for maior
          if (Math.abs(dx) > maxDist || Math.abs(dy) > maxDist) continue;

          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.04;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 168, 89, ${Math.max(0, alpha)})`;
            ctx.lineWidth = 0.4;
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      drawConnections();
      animId = requestAnimationFrame(animate);
    };

    animate();

    // Pausar quando a aba não está visível
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(animId);
        animId = null;
      } else if (!animId) {
        animate();
      }
    });
  };


  /* ==========================================================
     3. PARTÍCULAS DO HERO
     Canvas dentro do hero com partículas maiores,
     conexões visíveis e interação com mouse
     ========================================================== */
  const initHeroParticles = () => {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animFrameId = null;
    let mouse = { x: -1000, y: -1000 };

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resize();
    window.addEventListener('resize', debounce(resize, 200));

    canvas.parentElement.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    canvas.parentElement.addEventListener('mouseleave', () => {
      mouse.x = -1000;
      mouse.y = -1000;
    });

    class HeroParticle {
      constructor(randomY) { this.reset(randomY); }

      reset(randomY = false) {
        this.x = Math.random() * canvas.width;
        this.y = randomY ? Math.random() * canvas.height : canvas.height + Math.random() * 60;
        this.size = Math.random() * 2 + 0.8;
        this.baseSpeedY = -(Math.random() * 0.5 + 0.15);
        this.speedY = this.baseSpeedY;
        this.speedX = (Math.random() - 0.5) * 0.25;
        this.opacity = Math.random() * 0.45 + 0.1;
        this.fadeRate = Math.random() * 0.0015 + 0.0008;
      }

      update() {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 120) {
          const force = (120 - dist) / 120 * 0.3;
          this.speedX += (dx / dist) * force * 0.1;
          this.speedY += (dy / dist) * force * 0.1;
        }

        this.x += this.speedX;
        this.y += this.speedY;
        this.speedX *= 0.99;
        this.speedY += (this.baseSpeedY - this.speedY) * 0.02;
        this.opacity -= this.fadeRate;

        if (this.opacity <= 0 || this.y < -30 || this.x < -30 || this.x > canvas.width + 30) {
          this.reset(false);
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 168, 89, ${Math.max(0, this.opacity)})`;
        ctx.fill();
      }
    }

    const createParticles = () => {
      particles = [];
      const area = canvas.width * canvas.height;
      const count = Math.min(90, Math.max(25, Math.floor(area / 14000)));
      for (let i = 0; i < count; i++) particles.push(new HeroParticle(true));
    };

    createParticles();
    window.addEventListener('resize', debounce(createParticles, 300));

    const drawConnections = () => {
      const maxDist = 100;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          if (Math.abs(dx) > maxDist || Math.abs(dy) > maxDist) continue;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.08 * Math.min(particles[i].opacity, particles[j].opacity) * 3;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 168, 89, ${Math.max(0, alpha)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      drawConnections();
      animFrameId = requestAnimationFrame(animate);
    };

    animate();

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { if (!animFrameId) animate(); }
        else { cancelAnimationFrame(animFrameId); animFrameId = null; }
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);
  };


  /* ==========================================================
     4. NAVEGAÇÃO
     ========================================================== */
  const initNavigation = () => {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    if (!navbar || !hamburger || !navLinks) return;

    const handleScroll = throttle(() => {
      navbar.classList.toggle('scrolled', window.scrollY > 60);
    }, 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    const toggleMenu = () => {
      const isOpen = navLinks.classList.toggle('open');
      hamburger.classList.toggle('active', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    };

    const closeMenu = () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };

    hamburger.addEventListener('click', toggleMenu);
    navLinks.querySelectorAll('a').forEach(l => l.addEventListener('click', closeMenu));
    document.addEventListener('click', (e) => { if (!navbar.contains(e.target)) closeMenu(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && navLinks.classList.contains('open')) closeMenu(); });

    // Link ativo
    const sections = document.querySelectorAll('section[id]');
    const anchors = navbar.querySelectorAll('.nav-link');
    if (sections.length && anchors.length) {
      const updateActive = throttle(() => {
        const y = window.scrollY + 200;
        sections.forEach(s => {
          if (y >= s.offsetTop && y < s.offsetTop + s.offsetHeight) {
            anchors.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${s.id}`));
          }
        });
      }, 80);
      window.addEventListener('scroll', updateActive, { passive: true });
    }
  };


  /* ==========================================================
     5. SCROLL SUAVE
     ========================================================== */
  const initSmoothScroll = () => {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (href === '#' || !href.startsWith('#')) return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        const navH = document.getElementById('navbar')?.offsetHeight || 0;
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - navH - 10, behavior: 'smooth' });
      });
    });
  };


  /* ==========================================================
     6. ANIMAÇÕES AO ROLAR
     ========================================================== */
  const initScrollAnimations = () => {
    const els = document.querySelectorAll('.animate-on-scroll');
    if (!els.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach(el => el.classList.add('visible'));
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }),
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );
    els.forEach(el => obs.observe(el));
  };


  /* ==========================================================
     7. CONTADOR ANIMADO
     ========================================================== */
  const initCounters = () => {
    const counters = document.querySelectorAll('.stat-number[data-target]');
    if (!counters.length) return;

    const animate = (el) => {
      const target = parseInt(el.dataset.target, 10);
      const prefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';
      const start = performance.now();
      const duration = 1800;

      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = `${prefix}${Math.round(eased * target)}${suffix}`;
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { animate(e.target); obs.unobserve(e.target); } }),
      { threshold: 0.5 }
    );
    counters.forEach(el => obs.observe(el));
  };


  /* ==========================================================
     8. MÁSCARA DE TELEFONE
     ========================================================== */
  const initPhoneMask = () => {
    const input = document.getElementById('telefone');
    if (!input) return;

    input.addEventListener('input', () => {
      let d = input.value.replace(/\D/g, '');
      if (d.length > 11) d = d.slice(0, 11);
      input.value = d.length > 6 ? `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
        : d.length > 2 ? `(${d.slice(0,2)}) ${d.slice(2)}`
        : d.length > 0 ? `(${d}` : '';
    });
  };


  /* ==========================================================
     9. VALIDAÇÃO DO FORMULÁRIO
     ========================================================== */
  const initFormValidation = () => {
    const form = document.getElementById('inscricaoForm');
    const btn = document.getElementById('submitBtn');
    if (!form || !btn) return;

    const defs = {
      nome: {
        el: document.getElementById('nome'),
        err: document.getElementById('nome-error'),
        validate(v) {
          const t = v.trim();
          if (!t) return 'Informe seu nome completo.';
          if (t.length < 3) return 'O nome deve ter pelo menos 3 caracteres.';
          if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(t)) return 'O nome deve conter apenas letras.';
          return '';
        }
      },
      email: {
        el: document.getElementById('email'),
        err: document.getElementById('email-error'),
        validate(v) {
          const t = v.trim();
          if (!t) return 'Informe seu e-mail.';
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return 'Digite um e-mail válido.';
          return '';
        }
      },
      telefone: {
        el: document.getElementById('telefone'),
        err: document.getElementById('telefone-error'),
        validate(v) {
          const d = v.replace(/\D/g, '');
          if (!d) return 'Informe seu telefone.';
          if (d.length < 10 || d.length > 11) return 'Digite um telefone válido com DDD.';
          return '';
        }
      },
      cidade: {
        el: document.getElementById('cidade'),
        err: document.getElementById('cidade-error'),
        validate(v) {
          const t = v.trim();
          if (!t) return 'Informe sua cidade.';
          if (t.length < 2) return 'Digite uma cidade válida.';
          return '';
        }
      },
      idade: {
        el: document.getElementById('idade'),
        err: document.getElementById('idade-error'),
        validate(v) {
          if (!v) return 'Informe sua idade.';
          const a = parseInt(v, 10);
          if (isNaN(a)) return 'Digite um número válido.';
          if (a < 16) return 'Você precisa ter pelo menos 16 anos.';
          if (a > 30) return 'A idade máxima é 30 anos.';
          return '';
        }
      },
      jogo: {
        el: document.getElementById('jogo'),
        err: document.getElementById('jogo-error'),
        validate(v) { return v ? '' : 'Selecione o jogo em que deseja competir.'; }
      },
      associado: {
        el: document.getElementById('associado'),
        err: document.getElementById('associado-error'),
        validate(_, el) { return el.checked ? '' : 'Você precisa ser associado do Sicredi com conta ativa.'; }
      }
    };

    const validateField = (k) => {
      const d = defs[k];
      const msg = d.validate(d.el.value, d.el);
      d.err.textContent = msg;
      d.el.classList.toggle('error', !!msg);
      return !msg;
    };

    Object.entries(defs).forEach(([k, d]) => {
      if (d.el.type === 'checkbox') {
        d.el.addEventListener('change', () => validateField(k));
      } else {
        d.el.addEventListener('blur', () => validateField(k));
        d.el.addEventListener('input', () => { if (d.el.classList.contains('error')) validateField(k); });
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true, first = null;
      Object.keys(defs).forEach(k => { if (!validateField(k) && ok) { ok = false; first = defs[k].el; } });

      if (!ok) {
        if (first) { first.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => first.focus(), 400); }
        return;
      }

      btn.classList.add('loading');
      btn.disabled = true;

      setTimeout(() => {
        btn.classList.remove('loading');
        btn.disabled = false;
        form.reset();
        Object.values(defs).forEach(d => { d.err.textContent = ''; d.el.classList.remove('error'); });
        openModal();
      }, 1500);
    });
  };


  /* ==========================================================
     10. MODAL
     ========================================================== */
  const initModal = () => {
    const modal = document.getElementById('successModal');
    const close = document.getElementById('modalClose');
    if (!modal) return;

    if (close) close.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('active')) closeModal(); });
  };

  const openModal = () => {
    const m = document.getElementById('successModal');
    if (!m) return;
    m.classList.add('active');
    m.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => { const b = document.getElementById('modalClose'); if (b) b.focus(); }, 350);
  };

  const closeModal = () => {
    const m = document.getElementById('successModal');
    if (!m) return;
    m.classList.remove('active');
    m.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };


  /* ==========================================================
     11. FAQ
     ========================================================== */
  const initFAQ = () => {
    const items = document.querySelectorAll('.faq-item');
    if (!items.length) return;

    items.forEach(item => {
      item.querySelector('.faq-question').addEventListener('click', () => {
        const wasActive = item.classList.contains('active');
        items.forEach(i => { i.classList.remove('active'); i.querySelector('.faq-question').setAttribute('aria-expanded', 'false'); });
        if (!wasActive) { item.classList.add('active'); item.querySelector('.faq-question').setAttribute('aria-expanded', 'true'); }
      });
    });
  };


  /* ==========================================================
     12. VOLTAR AO TOPO
     ========================================================== */
  const initBackToTop = () => {
    const btn = document.getElementById('backToTop');
    if (!btn) return;

    const check = throttle(() => btn.classList.toggle('visible', window.scrollY > 500), 80);
    window.addEventListener('scroll', check, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };


  /* ==========================================================
     13. INICIALIZAÇÃO
     Ordem: partículas globais primeiro (fundo),
     depois hero, depois interatividade
     ========================================================== */
  initGlobalParticles();
  initHeroParticles();
  initNavigation();
  initSmoothScroll();
  initScrollAnimations();
  initCounters();
  initPhoneMask();
  initFormValidation();
  initModal();
  initFAQ();
  initBackToTop();

});

/**
 * ============================================================
 * UP REWARDS — Funcionalidades da página de recompensas
 * Adicionar ao final do script.js existente
 * ============================================================
 */

// Executar apenas se estiver na página de rewards
if (document.getElementById('rw-hero')) {
  document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    /* ==========================================================
       DADOS DAS RECOMPENSAS
       Conceito demonstrativo — placeholders editáveis
       ========================================================== */
    const RECOMPENSAS = [
      { id: 1, nome: 'Valorant Points', up: 2000, cat: 'games', emoji: '🔫', gradient: 'rw-rec-gradient--valorant' },
      { id: 2, nome: 'Riot Points', up: 1800, cat: 'games', emoji: '⚔️', gradient: 'rw-rec-gradient--lol' },
      { id: 3, nome: 'V-Bucks', up: 1500, cat: 'games', emoji: '🏗️', gradient: 'rw-rec-gradient--fortnite' },
      { id: 4, nome: 'Diamantes Free Fire', up: 800, cat: 'games', emoji: '🔥', gradient: 'rw-rec-gradient--freefire' },
      { id: 5, nome: 'EA FC Points', up: 1200, cat: 'games', emoji: '⚽', gradient: 'rw-rec-gradient--eafc' },
      { id: 6, nome: 'Robux', up: 1000, cat: 'games', emoji: '🧱', gradient: 'rw-rec-gradient--roblox' },
      { id: 7, nome: 'Steam Wallet R$50', up: 5000, cat: 'games', emoji: '🎮', gradient: 'rw-rec-gradient--steam' },
      { id: 8, nome: 'Xbox Gift Card R$50', up: 5200, cat: 'games', emoji: '🟢', gradient: 'rw-rec-gradient--xbox' },
      { id: 9, nome: 'PlayStation Gift Card R$50', up: 5200, cat: 'games', emoji: '🔵', gradient: 'rw-rec-gradient--playstation' },
      { id: 10, nome: 'Nintendo eShop R$50', up: 5200, cat: 'games', emoji: '🔴', gradient: 'rw-rec-gradient--nintendo' },
      { id: 11, nome: 'Bitcoin (fractional)', up: 50000, cat: 'crypto', emoji: '₿', gradient: 'rw-rec-gradient--bitcoin' },
      { id: 12, nome: 'Ethereum (fractional)', up: 35000, cat: 'crypto', emoji: 'Ξ', gradient: 'rw-rec-gradient--ethereum' },
      { id: 13, nome: 'USDC R$25', up: 2500, cat: 'crypto', emoji: '💵', gradient: 'rw-rec-gradient--usdc' },
      { id: 14, nome: 'Solana (fractional)', up: 8000, cat: 'crypto', emoji: '◎', gradient: 'rw-rec-gradient--solana' },
      { id: 15, nome: 'Polygon (fractional)', up: 5000, cat: 'crypto', emoji: '🔷', gradient: 'rw-rec-gradient--polygon' },
      { id: 16, nome: 'Cashback R$20', up: 2200, cat: 'cashback', emoji: '💰', gradient: 'rw-rec-gradient--cashback' },
      { id: 17, nome: 'Cashback R$50', up: 5300, cat: 'cashback', emoji: '💵', gradient: 'rw-rec-gradient--cashback' },
      { id: 18, nome: 'Desconto 15% Parceiros', up: 1500, cat: 'cashback', emoji: '🏷️', gradient: 'rw-rec-gradient--desconto' },
      { id: 19, nome: 'Headset Gamer', up: 15000, cat: 'equipamentos', emoji: '🎧', gradient: 'rw-rec-gradient--headset' },
      { id: 20, nome: 'Teclado Mecânico', up: 12000, cat: 'equipamentos', emoji: '⌨️', gradient: 'rw-rec-gradient--teclado' },
      { id: 21, nome: 'Mouse Gamer', up: 8000, cat: 'equipamentos', emoji: '🖱️', gradient: 'rw-rec-gradient--mouse' },
      { id: 22, nome: 'Monitor Gamer 24"', up: 30000, cat: 'equipamentos', emoji: '🖥️', gradient: 'rw-rec-gradient--monitor' },
      { id: 23, nome: 'Camisa Exclusiva UP', up: 3000, cat: 'eventos', emoji: '👕', gradient: 'rw-rec-gradient--camisa' },
      { id: 24, nome: 'Ingresso Evento E-Sports', up: 5000, cat: 'eventos', emoji: '🎫', gradient: 'rw-rec-gradient--evento' },
    ];

    const CARROSSEL_ITEMS = [
      { nome: 'Valorant Points', up: 2000, emoji: '🔫', gradient: 'rw-rec-gradient--valorant' },
      { nome: 'V-Bucks', up: 1500, emoji: '🏗️', gradient: 'rw-rec-gradient--fortnite' },
      { nome: 'Bitcoin', up: 50000, emoji: '₿', gradient: 'rw-rec-gradient--bitcoin' },
      { nome: 'Cashback R$50', up: 5300, emoji: '💵', gradient: 'rw-rec-gradient--cashback' },
      { nome: 'Steam Wallet R$50', up: 5000, emoji: '🎮', gradient: 'rw-rec-gradient--steam' },
      { nome: 'Gift Card R$100', up: 10500, emoji: '🎁', gradient: 'rw-rec-gradient--giftcard' },
      { nome: 'Headset Gamer', up: 15000, emoji: '🎧', gradient: 'rw-rec-gradient--headset' },
    ];


    /* ==========================================================
       PARTÍCULAS DO HERO REWARDS
       ========================================================== */
    const initRewardsHeroParticles = () => {
      const canvas = document.getElementById('rwHeroCanvas');
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      let particles = [];
      let animId = null;

      const resize = () => {
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
      };
      resize();
      window.addEventListener('resize', debounce(resize, 200));

      class P {
        constructor(init) {
          this.x = Math.random() * canvas.width;
          this.y = init ? Math.random() * canvas.height : canvas.height + Math.random() * 40;
          this.s = Math.random() * 2 + 0.6;
          this.sy = -(Math.random() * 0.4 + 0.1);
          this.sx = (Math.random() - 0.5) * 0.2;
          this.o = Math.random() * 0.4 + 0.08;
          this.f = Math.random() * 0.001 + 0.0005;
        }
        update() {
          this.x += this.sx;
          this.y += this.sy;
          this.o -= this.f;
          if (this.o <= 0 || this.y < -20) {
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + Math.random() * 40;
            this.o = Math.random() * 0.4 + 0.08;
          }
        }
        draw() {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.s, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0,168,89,${Math.max(0, this.o)})`;
          ctx.fill();
        }
      }

      const create = () => {
        particles = [];
        const n = Math.min(70, Math.max(20, Math.floor(canvas.width * canvas.height / 15000)));
        for (let i = 0; i < n; i++) particles.push(new P(true));
      };
      create();
      window.addEventListener('resize', debounce(create, 300));

      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        animId = requestAnimationFrame(animate);
      };
      animate();

      const obs = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { if (!animId) animate(); }
        else { cancelAnimationFrame(animId); animId = null; }
      }, { threshold: 0.05 });
      obs.observe(canvas);
    };


    /* ==========================================================
       GERAR CARDS DE RECOMPENSA
       ========================================================== */
    const renderRecompensas = () => {
      const grid = document.getElementById('rw-recompensas-grid');
      if (!grid) return;

      grid.innerHTML = RECOMPENSAS.map(r => `
        <div class="rw-rec-card animate-on-scroll" data-cat="${r.cat}">
          <div class="rw-rec-card-image ${r.gradient}">
            <span class="rw-rec-card-cat">${r.cat}</span>
            <span>${r.emoji}</span>
          </div>
          <div class="rw-rec-card-content">
            <h4 class="rw-rec-card-name">${r.nome}</h4>
            <div class="rw-rec-card-price">
              <span class="rw-rec-card-up">${r.up.toLocaleString('pt-BR')}</span>
              <span class="rw-rec-card-up-label">UP</span>
            </div>
            <button class="rw-rec-card-btn" data-name="${r.nome}" data-up="${r.up}">Resgatar</button>
          </div>
        </div>
      `).join('');

      // Re-observar para animações de scroll
      const obs = new IntersectionObserver(
        (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }),
        { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
      );
      grid.querySelectorAll('.animate-on-scroll').forEach(el => obs.observe(el));

      // Eventos de resgate
      grid.querySelectorAll('.rw-rec-card-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.getElementById('resgate-modal-text').textContent =
            `Seu resgate de "${btn.dataset.name}" (${parseInt(btn.dataset.up).toLocaleString('pt-BR')} UP) será processado em até 24 horas.`;
          openResgateModal();
        });
      });
    };


    /* ==========================================================
       FILTRO DE CATEGORIAS
       ========================================================== */
    const initFiltros = () => {
      const btns = document.querySelectorAll('.rw-filter-btn');
      const cards = document.querySelectorAll('.rw-rec-card');
      if (!btns.length || !cards.length) return;

      btns.forEach(btn => {
        btn.addEventListener('click', () => {
          btns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          const filter = btn.dataset.filter;
          cards.forEach(card => {
            if (filter === 'all' || card.dataset.cat === filter) {
              card.style.display = '';
              // Re-trigger animation
              card.classList.remove('visible');
              requestAnimationFrame(() => card.classList.add('visible'));
            } else {
              card.style.display = 'none';
            }
          });
        });
      });
    };


    /* ==========================================================
       CARROSSEL DE DESTAQUES
       ========================================================== */
    const initCarrossel = () => {
      const track = document.getElementById('carrossel-track');
      const prev = document.getElementById('carrossel-prev');
      const next = document.getElementById('carrossel-next');
      if (!track || !prev || !next) return;

      // Gerar itens
      track.innerHTML = CARROSSEL_ITEMS.map(item => `
        <div class="rw-carrossel-item">
          <div class="rw-rec-card">
            <div class="rw-rec-card-image ${item.gradient}" style="height:100px">
              <span>${item.emoji}</span>
            </div>
            <div class="rw-rec-card-content">
              <h4 class="rw-rec-card-name">${item.nome}</h4>
              <div class="rw-rec-card-price">
                <span class="rw-rec-card-up">${item.up.toLocaleString('pt-BR')}</span>
                <span class="rw-rec-card-up-label">UP</span>
              </div>
            </div>
          </div>
        </div>
      `).join('');

      let pos = 0;
      const itemWidth = 260; // 240 + 20 gap

      const move = () => {
        const maxScroll = track.scrollWidth - track.parentElement.offsetWidth;
        pos = Math.max(0, Math.min(pos, maxScroll));
        track.style.transform = `translateX(-${pos}px)`;
      };

      prev.addEventListener('click', () => { pos -= itemWidth; move(); });
      next.addEventListener('click', () => { pos += itemWidth; move(); });

      // Touch/drag
      let startX = 0, isDragging = false;
      track.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; isDragging = true; }, { passive: true });
      track.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        isDragging = false;
        const diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) { pos += diff > 0 ? itemWidth : -itemWidth; move(); }
      });
    };


    /* ==========================================================
       SIMULADOR DE GANHOS
       ========================================================== */
    const initSimulador = () => {
      const btn = document.getElementById('sim-calcular');
      if (!btn) return;

      // Multiplicadores por tipo de investimento
      const multipliers = { tesouro: 2.0, cdb: 2.5, lci: 1.5, fundos: 3.0, rv: 4.0 };

      btn.addEventListener('click', () => {
        const cartao = parseFloat(document.getElementById('sim-cartao').value) || 0;
        const investimento = parseFloat(document.getElementById('sim-investimento').value) || 0;
        const tipo = document.getElementById('sim-tipo').value;
        const prazo = parseInt(document.getElementById('sim-prazo').value) || 1;

        // Cálculo conceito demonstrativo
        const upCartao = Math.round(cartao * 1.5);
        const mult = multipliers[tipo] || 2;
        const upInvestimento = Math.round(investimento * mult * (prazo / 6));
        const total = upCartao + upInvestimento;

        // Animar resultado
        const resultEl = document.getElementById('sim-result');
        const countEl = document.getElementById('sim-up-count');
        const barEl = document.getElementById('sim-bar-fill');
        const barLabel = document.getElementById('sim-bar-label');
        const equivEl = document.getElementById('sim-equiv');
        const coinsEl = document.getElementById('sim-coins');

        resultEl.classList.add('active');
        countEl.textContent = '0';
        barEl.style.width = '0%';

        // Contador animado
        const duration = 1500;
        const start = performance.now();
        const maxBar = Math.min(100, total / 1000);

        const step = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = Math.round(eased * total);

          countEl.textContent = current.toLocaleString('pt-BR');
          barEl.style.width = `${(eased * maxBar)}%`;
          barLabel.textContent = `${Math.round(eased * maxBar)}%`;

          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);

        // Equivalente em R$ (conceito: ~100 UP = R$1)
        equivEl.textContent = `Equivalente a aproximadamente R$ ${(total / 100).toFixed(2)} em recompensas`;

        // Moedas voadoras
        coinsEl.innerHTML = '';
        for (let i = 0; i < 12; i++) {
          const coin = document.createElement('span');
          coin.className = 'rw-sim-coin-fly';
          coin.textContent = 'UP';
          coin.style.left = `${Math.random() * 80 + 10}%`;
          coin.style.top = `${Math.random() * 80 + 10}%`;
          coin.style.setProperty('--tx', `${(Math.random() - 0.5) * 100}px`);
          coin.style.setProperty('--ty', `${-Math.random() * 80 - 20}px`);
          coin.style.animationDelay = `${i * 0.08}s`;
          coinsEl.appendChild(coin);
        }
        setTimeout(() => { coinsEl.innerHTML = ''; }, 2000);
      });
    };


    /* ==========================================================
       BARRA DE NÍVEL ANIMADA
       ========================================================== */
    const initLevelBar = () => {
      const bar = document.getElementById('rw-level-bar-fill');
      if (!bar) return;

      const obs = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) {
          bar.style.width = `${bar.dataset.target}%`;
          obs.unobserve(bar);
        }
      }, { threshold: 0.5 });
      obs.observe(bar);
    };


    /* ==========================================================
       DASHBOARD — Contadores e barras animadas
       ========================================================== */
    const initDashboard = () => {
      // Contador do saldo
      const saldoEl = document.querySelector('.rw-dash-saldo-num[data-count]');
      if (saldoEl) {
        const target = parseInt(saldoEl.dataset.count, 10);
        const obs = new IntersectionObserver(([e]) => {
          if (e.isIntersecting) {
            const start = performance.now();
            const step = (now) => {
              const p = Math.min((now - start) / 1200, 1);
              saldoEl.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target).toLocaleString('pt-BR');
              if (p < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
            obs.unobserve(saldoEl);
          }
        }, { threshold: 0.5 });
        obs.observe(saldoEl);
      }

      // Barra do objetivo
      document.querySelectorAll('.rw-dash-objetivo-bar-fill[data-target]').forEach(bar => {
        const obs = new IntersectionObserver(([e]) => {
          if (e.isIntersecting) {
            bar.style.width = `${bar.dataset.target}%`;
            obs.unobserve(bar);
          }
        }, { threshold: 0.5 });
        obs.observe(bar);
      });

      // Barras do gráfico mensal
      document.querySelectorAll('.rw-dash-bar').forEach((bar, i) => {
        const h = bar.style.getPropertyValue('--h');
        bar.style.height = '0%';
        const obs = new IntersectionObserver(([e]) => {
          if (e.isIntersecting) {
            setTimeout(() => { bar.style.height = h; }, i * 100);
            obs.unobserve(bar);
          }
        }, { threshold: 0.3 });
        obs.observe(bar);
      });
    };


    /* ==========================================================
       MODAL DE RESGATE
       ========================================================== */
    const openResgateModal = () => {
      const m = document.getElementById('resgateModal');
      if (!m) return;
      m.classList.add('active');
      m.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      setTimeout(() => { const b = document.getElementById('resgate-modal-close'); if (b) b.focus(); }, 350);
    };

    const closeResgateModal = () => {
      const m = document.getElementById('resgateModal');
      if (!m) return;
      m.classList.remove('active');
      m.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    const initResgateModal = () => {
      const m = document.getElementById('resgateModal');
      const close = document.getElementById('resgate-modal-close');
      if (!m) return;

      if (close) close.addEventListener('click', closeResgateModal);
      m.addEventListener('click', (e) => { if (e.target === m) closeResgateModal(); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && m.classList.contains('active')) closeResgateModal(); });
    };


    /* ==========================================================
       INICIALIZAR MÓDULOS DA PÁGINA REWARDS
       Reutiliza funções globais (partículas, nav, scroll, etc.)
       que já foram inicializadas no script principal
       ========================================================== */
    initRewardsHeroParticles();
    renderRecompensas();
    initFiltros();
    initCarrossel();
    initSimulador();
    initLevelBar();
    initDashboard();
    initResgateModal();

  }); // fecha DOMContentLoaded do rewards
} // fecha if rw-hero
