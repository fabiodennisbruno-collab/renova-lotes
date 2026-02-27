/* sync-cloud.js — Sincronização com Supabase */
'use strict';

const CloudSync = (function() {
  async function uploadToSupabase(tipo, tabela, dados) {
    if (!supabaseClient) {
      console.error('❌ Supabase não disponível');
      return false;
    }

    try {
      const { data, error } = await supabaseClient
        .from(tabela)
        .insert([dados]);

      if (error) {
        console.error(`❌ Erro ao enviar para ${tabela}:`, error.message);
        return false;
      }

      console.log(`✅ ${tipo} enviado para ${tabela}`);
      return true;
    } catch (err) {
      console.error('❌ Erro CloudSync:', err.message);
      return false;
    }
  }

  return {
    uploadToSupabase
  };
})();
