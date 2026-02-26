/* supabase-config.js — Configuração do cliente Supabase */
'use strict';

/**
 * Credenciais do projeto Supabase.
 * Substitua os valores abaixo com as credenciais reais do seu projeto.
 * Acesse: https://app.supabase.com → Settings → API
 */
const SUPABASE_URL  = 'https://SEU_PROJECT_ID.supabase.co';
const SUPABASE_KEY  = 'SUA_ANON_PUBLIC_KEY';

/* Inicializa o cliente Supabase (requer o CDN carregado antes deste script) */
const supabase = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

if (!supabase) {
  console.error('[Supabase] Biblioteca não carregada. Adicione o CDN ao HTML antes deste script.');
}
