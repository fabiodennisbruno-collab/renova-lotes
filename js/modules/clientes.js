/* clientes.js – Gestão de Clientes CRM */
'use strict';

const ClientesMod = (() => {
  const KEY = 'crm_clientes';
  let clientes = [];
  let editingId = null;
  let searchQ   = '';
  let filterCat = '';

  const fmtBRL = (v) =>
    new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(v || 0);

  /* ---- Persistência ---- */
  function load()  { clientes = JSON.parse(localStorage.getItem(KEY) || '[]'); }
  function save()  { localStorage.setItem(KEY, JSON.stringify(clientes)); }

  /* ---- CRUD ---- */
  function upsert(data) {
    const idx   = clientes.findIndex(c => c.id === data.id);
    const isNew = idx < 0;
    if (idx >= 0) { clientes[idx] = data; }
    else           { clientes.push(data); }
    save();
    if (typeof OfflineSync !== 'undefined') {
      OfflineSync.enqueue(isNew ? 'create' : 'update', 'clientes', data);
    }
  }
  function remove(id) {
    const toRemove = get(id);
    clientes = clientes.filter(c => c.id !== id);
    save();
    if (typeof OfflineSync !== 'undefined' && toRemove) {
      OfflineSync.enqueue('delete', 'clientes', { id });
    }
  }
  function get(id) { return clientes.find(c => c.id === id); }

  /* ---- Inicializa aba de Clientes ---- */
  function init() {
    load();

    const searchEl = document.getElementById('cliSearch');
    const filterEl = document.getElementById('cliFilter');
    if (searchEl) searchEl.addEventListener('input', () => { searchQ = searchEl.value; render(); });
    if (filterEl) filterEl.addEventListener('change', () => { filterCat = filterEl.value; render(); });

    const newBtn = document.getElementById('cliNewBtn');
    if (newBtn) newBtn.addEventListener('click', openNew);

    setupModal();
    render();
  }

  /* ---- Render tabela ---- */
  function render() {
    const tb = document.getElementById('cliTableBody');
    const stats = document.getElementById('cliStats');
    if (!tb) return;

    load();

    let list = clientes;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      list = list.filter(c =>
        (c.nome||'').toLowerCase().includes(q) ||
        (c.email||'').toLowerCase().includes(q) ||
        (c.telefone||'').includes(q) ||
        (c.cidade||'').toLowerCase().includes(q)
      );
    }
    if (filterCat) {
      list = list.filter(c => c.categoria === filterCat);
    }

    // Stats
    if (stats) {
      const totalCompras = clientes.reduce((s,c) => s + (c.totalCompras||0), 0);
      const vip = clientes.filter(c=>c.categoria==='VIP').length;
      stats.innerHTML = `
        <span>Total: <strong>${clientes.length}</strong></span>
        <span>VIP: <strong class="text-purple">${vip}</strong></span>
        <span>Receita Total: <strong class="text-green">${fmtBRL(totalCompras)}</strong></span>`;
    }

    if (!list.length) {
      tb.innerHTML = `<tr><td colspan="7"><div class="crm-empty"><div class="empty-icon">👥</div>Nenhum cliente encontrado.</div></td></tr>`;
      return;
    }

    tb.innerHTML = list.map(c => {
      const initials = (c.nome || '?').split(' ').slice(0,2).map(w => w[0].toUpperCase()).join('');
      const badge = badgeFor(c.categoria);
      return `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:10px;">
              <div class="cliente-row-avatar">${initials}</div>
              <div>
                <div style="font-weight:700;">${esc(c.nome)}</div>
                <div style="font-size:11px;color:var(--crm-muted);">${esc(c.email||'')}</div>
              </div>
            </div>
          </td>
          <td>${esc(c.telefone||'—')}</td>
          <td>${esc(c.cidade||'—')}${c.estado ? ' / '+esc(c.estado) : ''}</td>
          <td>${badge}</td>
          <td class="text-green fw800">${fmtBRL(c.totalCompras)}</td>
          <td style="color:var(--crm-muted);font-size:12px;">${c.ultimaCompra||'—'}</td>
          <td>
            <div class="crm-flex" style="gap:6px;">
              <button class="crm-btn sm primary" onclick="ClientesMod.openEdit('${c.id}')">✏️</button>
              <button class="crm-btn sm danger"  onclick="ClientesMod.confirmDelete('${c.id}')">🗑️</button>
            </div>
          </td>
        </tr>`;
    }).join('');
  }

  /* ---- Badge ---- */
  function badgeFor(cat) {
    const map = { VIP:'vip', Regular:'regular', Novo:'novo' };
    return `<span class="crm-badge ${map[cat]||'info'}">${cat||'—'}</span>`;
  }

  /* ---- Modal ---- */
  function setupModal() {
    const form  = document.getElementById('cliForm');
    const modal = document.getElementById('cliModalBackdrop');
    const close = document.getElementById('cliModalClose');
    const save  = document.getElementById('cliSaveBtn');
    const cancel= document.getElementById('cliCancelBtn');

    if (close)  close.addEventListener('click',  closeModal);
    if (cancel) cancel.addEventListener('click', closeModal);
    if (modal)  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    if (save)   save.addEventListener('click',  saveForm);
  }

  function openNew() {
    editingId = null;
    clearForm();
    const title = document.getElementById('cliModalTitle');
    if (title) title.textContent = '➕ Novo Cliente';
    openModal();
  }

  function openEdit(id) {
    const c = get(id);
    if (!c) return;
    editingId = id;
    fillForm(c);
    const title = document.getElementById('cliModalTitle');
    if (title) title.textContent = '✏️ Editar Cliente';
    openModal();
  }

  function openModal() {
    const m = document.getElementById('cliModalBackdrop');
    if (m) m.classList.add('open');
  }
  function closeModal() {
    const m = document.getElementById('cliModalBackdrop');
    if (m) m.classList.remove('open');
    editingId = null;
  }

  function clearForm() {
    ['cliNome','cliTel','cliEmail','cliCidade','cliEstado','cliObs'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const cat = document.getElementById('cliCategoria');
    if (cat) cat.value = 'Regular';
  }

  function fillForm(c) {
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v||''; };
    set('cliNome',      c.nome);
    set('cliTel',       c.telefone);
    set('cliEmail',     c.email);
    set('cliCidade',    c.cidade);
    set('cliEstado',    c.estado);
    set('cliCategoria', c.categoria || 'Regular');
    set('cliObs',       c.obs);
  }

  function saveForm() {
    const g = (id) => (document.getElementById(id)||{}).value || '';
    const nome = g('cliNome').trim();
    if (!nome) { alert('Informe o nome do cliente.'); return; }

    const data = {
      id           : editingId || ('cli-' + Date.now()),
      nome,
      telefone     : g('cliTel'),
      email        : g('cliEmail'),
      cidade       : g('cliCidade'),
      estado       : g('cliEstado'),
      categoria    : g('cliCategoria') || 'Regular',
      obs          : g('cliObs'),
      totalCompras : editingId ? (get(editingId)||{}).totalCompras || 0 : 0,
      ultimaCompra : editingId ? (get(editingId)||{}).ultimaCompra || '' : '',
      dataCadastro : editingId ? (get(editingId)||{}).dataCadastro || isoDate() : isoDate(),
    };

    upsert(data);
    closeModal();
    render();
  }

  function confirmDelete(id) {
    const c = get(id);
    if (!c) return;
    if (!confirm(`Excluir cliente "${c.nome}"?`)) return;
    remove(id);
    render();
  }

  /* ---- Exportar lista de clientes ---- */
  function exportCSV() {
    load();
    const header = 'Nome,Telefone,Email,Cidade,Estado,Categoria,TotalCompras,UltimaCompra';
    const rows = clientes.map(c =>
      [c.nome,c.telefone,c.email,c.cidade,c.estado,c.categoria,c.totalCompras,c.ultimaCompra]
        .map(v => `"${(v||'').toString().replace(/"/g,'""')}"`)
        .join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF'+csv], { type:'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'clientes.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  /* ---- helpers ---- */
  function esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function isoDate() {
    return new Date().toISOString().slice(0,10);
  }

  return { init, render, openEdit, confirmDelete, exportCSV };
})();
