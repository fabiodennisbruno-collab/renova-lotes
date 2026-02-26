/* lotes.js — Gestão de lotes via Supabase */
'use strict';

const Lotes = (() => {
  const TABLE = 'lotes';

  /* ---- Listar todos os lotes ---- */
  async function getLotes() {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('criado_em', { ascending: false });
    if (error) throw error;
    return data;
  }

  /* ---- Buscar lote por ID ---- */
  async function getLote(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  /* ---- Criar lote ---- */
  async function createLote(lote) {
    const { data, error } = await supabase
      .from(TABLE)
      .insert([lote])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  /* ---- Atualizar lote ---- */
  async function updateLote(id, updates) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  /* ---- Excluir lote ---- */
  async function deleteLote(id) {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  return { getLotes, getLote, createLote, updateLote, deleteLote };
})();
