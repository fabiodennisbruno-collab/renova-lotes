/* app.js — Orquestrador principal da integração Supabase */
'use strict';

const App = (() => {
  /* ---- Estado da aplicação ---- */
  let currentUser = null;

  /* ---- Elementos do DOM de autenticação ---- */
  const loginSection  = () => document.getElementById('loginSection');
  const appSection    = () => document.getElementById('appSection');
  const loginForm     = () => document.getElementById('loginForm');
  const logoutBtn     = () => document.getElementById('logoutBtn');
  const userEmailEl   = () => document.getElementById('userEmail');
  const loginError    = () => document.getElementById('loginError');

  /* ---- Mostra/oculta seções conforme estado de autenticação ---- */
  function showApp(user) {
    currentUser = user;
    const ls = loginSection();
    const as = appSection();
    const ue = userEmailEl();
    if (ls) ls.hidden = true;
    if (as) as.hidden = false;
    if (ue) ue.textContent = user ? user.email : '';
  }

  function showLogin() {
    currentUser = null;
    const ls = loginSection();
    const as = appSection();
    if (ls) ls.hidden = false;
    if (as) as.hidden = true;
  }

  /* ---- Configura eventos do formulário de login ---- */
  function setupLoginForm() {
    const form = loginForm();
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email    = (document.getElementById('loginEmail') || {}).value || '';
      const password = (document.getElementById('loginPassword') || {}).value || '';
      const errEl    = loginError();
      if (errEl) errEl.textContent = '';

      try {
        await Auth.login(email, password);
      } catch (err) {
        if (errEl) errEl.textContent = err.message || 'Erro ao fazer login.';
      }
    });
  }

  /* ---- Configura botão de logout ---- */
  function setupLogout() {
    const btn = logoutBtn();
    if (!btn) return;
    btn.addEventListener('click', async () => {
      try {
        await Auth.logout();
      } catch (err) {
        console.error('[App] Erro ao sair:', err);
      }
    });
  }

  /* ---- Inicializa a aplicação ---- */
  async function init() {
    if (!supabaseClient) {
      console.error('[App] Supabase não configurado.');
      return;
    }

    setupLoginForm();
    setupLogout();

    /* Observa mudanças de autenticação */
    Auth.onAuthStateChange((user) => {
      if (user) {
        showApp(user);
      } else {
        showLogin();
      }
    });

    /* Verifica sessão existente */
    const user = await Auth.getCurrentUser();
    if (user) {
      showApp(user);
    } else {
      showLogin();
    }
  }

  return { init, getCurrentUser: () => currentUser };
})();

/* Inicializa após o DOM estar pronto */
document.addEventListener('DOMContentLoaded', () => App.init());
