/* auth.js — Autenticação de usuários via Supabase Auth */
'use strict';

const Auth = (() => {
  /* ---- Login com e-mail e senha ---- */
  async function login(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  /* ---- Cadastro de novo usuário ---- */
  async function register(email, password) {
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  }

  /* ---- Logout ---- */
  async function logout() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
  }

  /* ---- Retorna o usuário autenticado atual (ou null) ---- */
  async function getCurrentUser() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user;
  }

  /* ---- Observa mudanças de sessão ---- */
  function onAuthStateChange(callback) {
    return supabaseClient.auth.onAuthStateChange((_event, session) => {
      callback(session ? session.user : null);
    });
  }

  return { login, register, logout, getCurrentUser, onAuthStateChange };
})();
