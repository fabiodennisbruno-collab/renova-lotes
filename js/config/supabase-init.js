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
var SUPABASE_URL      = (window.SUPABASE_URL      || 'https://qjkjtqioizvuqextiqch.supabase.co');
var SUPABASE_ANON_KEY = (window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqa2p0cWlvaXp2dXFleHRpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDA1MDAsImV4cCI6MjA4NzE3NjUwMH0.WPHfYpvmk7V0JFNRsmdJIwJmQK_Mp0LGXSsNWQrdCIs');

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
  /* Inicializa fila offline (funciona mesmo sem Supabase configurado) */
  if (typeof OfflineSync !== 'undefined') {
    OfflineSync.init(supabaseClient);
  }
});
