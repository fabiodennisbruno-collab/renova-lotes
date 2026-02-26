/* estoque.js — Gestão de estoque via Supabase */
'use strict';

const Estoque = (() => {
  const TABLE = 'estoque';

  /* ---- Listar itens de estoque (opcionalmente filtrado por lote) ---- */
  async function getEstoque(loteId) {
    let query = supabase
      .from(TABLE)
      .select('*')
      .order('criado_em', { ascending: false });
    if (loteId) query = query.eq('lote_id', loteId);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  /* ---- Buscar item por ID ---- */
  async function getEstoqueItem(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  /* ---- Criar item ---- */
  async function createEstoqueItem(item) {
    const { data, error } = await supabase
      .from(TABLE)
      .insert([item])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  /* ---- Atualizar item ---- */
  async function updateEstoqueItem(id, updates) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  /* ---- Excluir item ---- */
  async function deleteEstoqueItem(id) {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  return { getEstoque, getEstoqueItem, createEstoqueItem, updateEstoqueItem, deleteEstoqueItem };
})();
