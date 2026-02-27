/* supabase-init.js — Inicialização do cliente Supabase */
'use strict';

const supabaseUrl = 'https://qjkjtqioizvuqextiqch.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqa2p0cWlvaXp2dXFleHRpcWNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDA1MDAsImV4cCI6MjA4NzE3NjUwMH0.WPHfYpvmk7V0JFNRsmdJIwJmQK_Mp0LGXSsNWQrdCIs';

const supabaseClient = (function() {
  try {
    if (typeof supabase === 'undefined') {
      console.error('❌ Supabase não carregado!');
      return null;
    }
    const client = supabase.createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase inicializado');
    return client;
  } catch (err) {
    console.error('❌ Erro ao inicializar Supabase:', err.message);
    return null;
  }
})();
