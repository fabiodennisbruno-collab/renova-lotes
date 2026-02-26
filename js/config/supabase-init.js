/* supabase-init.js — Inicialização do cliente Supabase para sincronização */
'use strict';

/**
 * CONFIGURAÇÃO — edite os valores abaixo com as credenciais do seu projeto.
 * Acesse: https://app.supabase.com → Settings → API
 *
 * A anon key é uma chave pública, segura para uso no front-end.
 *
 * Alternativamente, defina as globais abaixo ANTES de carregar este script:
 *   window.SUPABASE_URL      = 'https://...';
 *   window.SUPABASE_ANON_KEY = 'eyJ...';
 */
var SUPABASE_URL      = (typeof window !== 'undefined' && window.SUPABASE_URL)      || 'https://SEU_PROJECT_ID.supabase.co';
var SUPABASE_ANON_KEY = (typeof window !== 'undefined' && window.SUPABASE_ANON_KEY) || 'SUA_ANON_PUBLIC_KEY';

/* Cliente global — disponível para outros módulos */
var supabaseClient = null;

(function () {
  var isConfigured = SUPABASE_URL.indexOf('SEU_PROJECT_ID') === -1
                  && SUPABASE_ANON_KEY.indexOf('SUA_ANON_PUBLIC_KEY') === -1;

  if (!window.supabase) {
    console.warn('[Supabase] CDN não carregado. Sincronização desativada.');
    return;
  }

  if (!isConfigured) {
    console.info('[Supabase] Credenciais não configuradas. App rodando em modo offline (localStorage).');
    return;
  }

  try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('[Supabase] Cliente inicializado com sucesso.');
  } catch (err) {
    console.warn('[Supabase] Erro ao inicializar cliente:', err.message);
  }
})();

/* Ativa sincronização automática após o DOM estar pronto */
document.addEventListener('DOMContentLoaded', function () {
  if (typeof SyncCloud !== 'undefined') {
    SyncCloud.init(supabaseClient);
  }
});
