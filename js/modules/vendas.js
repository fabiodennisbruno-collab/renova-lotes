/* vendas.js — Gestão de vendas via Supabase */
'use strict';

const Vendas = (() => {
  const TABLE = 'vendas';

  /* ---- Listar vendas (opcionalmente filtrado por lote) ---- */
  async function getVendas(loteId) {
    let query = supabase
      .from(TABLE)
      .select('*')
      .order('data_venda', { ascending: false });
    if (loteId) query = query.eq('lote_id', loteId);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  /* ---- Buscar venda por ID ---- */
  async function getVenda(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  /* ---- Registrar venda ---- */
  async function createVenda(venda) {
    const { data, error } = await supabase
      .from(TABLE)
      .insert([venda])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  /* ---- Atualizar venda ---- */
  async function updateVenda(id, updates) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  /* ---- Excluir venda ---- */
  async function deleteVenda(id) {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  return { getVendas, getVenda, createVenda, updateVenda, deleteVenda };
})();
