/* crm-app.js – Orquestrador Central do CRM */
'use strict';

(function () {
  /* ============================================================
     0. Inicializa sistemas de sincronização
     ============================================================ */
  document.addEventListener('DOMContentLoaded', function () {
    var client = typeof supabaseClient !== 'undefined' ? supabaseClient : null;

    /* Sincronização offline (IndexedDB) */
    if (typeof OfflineSync !== 'undefined') {
      OfflineSync.init(client);
    }

    /* Fila de sincronização de alto nível */
    /* (SyncQueue delega ao OfflineSync — sem init separado necessário) */

    /* Sincronização em tempo real via Supabase Realtime */
    if (typeof RealtimeSync !== 'undefined' && client) {
      RealtimeSync.initRealtimeSync(client);
    }

    /* Atualiza painel de status quando a fila ou conflitos mudam */
    window.addEventListener('syncQueueChanged',  _updateSyncStatusPanel);
    window.addEventListener('syncStatusUpdated', _updateSyncStatusPanel);
    window.addEventListener('conflictDetected',  _updateSyncStatusPanel);

    /* Re-renderiza caixa quando outra aba ou dispositivo registra movimentação */
    window.addEventListener('caixaUpdated', function () { renderCaixa(); });
  });
  /* ============================================================
     1.5. Atualiza painel de status de sincronização
     ============================================================ */
  function _updateSyncStatusPanel(e) {
    var detail = (e && e.detail) || {};

    /* Atualiza contagem da fila */
    var queueEl = document.getElementById('syncQueueCount');
    if (queueEl && detail.pendingCount !== undefined) {
      queueEl.textContent = detail.pendingCount;
    } else if (queueEl && typeof SyncQueue !== 'undefined') {
      SyncQueue.getQueueStatus().then(function (s) {
        queueEl.textContent = s.pendingCount;
      }).catch(function () {});
    }

    /* Atualiza última sincronização */
    var lastSyncEl = document.getElementById('syncLastTime');
    if (lastSyncEl) {
      var ts = detail.lastSync
            || (typeof RealtimeSync !== 'undefined' ? RealtimeSync.getLastSync() : null);
      if (ts) {
        var diff = Math.round((Date.now() - new Date(ts).getTime()) / 1000);
        lastSyncEl.textContent = diff < 60
          ? diff + 's atrás'
          : Math.round(diff / 60) + 'min atrás';
      }
    }

    /* Atualiza contador de conflitos */
    var conflictEl = document.getElementById('syncConflictCount');
    if (conflictEl) {
      var total = detail.conflictCount !== undefined
        ? detail.conflictCount
        : (typeof ConflictDetector !== 'undefined' ? ConflictDetector.getTotalConflicts() : 0);
      conflictEl.textContent = total;
      conflictEl.style.display = total > 0 ? '' : 'none';
    }
  }


  if (typeof seedCRMIfEmpty === 'function') {
    seedCRMIfEmpty();
  }

  /* ============================================================
     2. Inicializa módulos CRM quando a aba é ativada
     ============================================================ */
  let dashInit  = false;
  let cliInit   = false;
  let pdvInit   = false;
  let caixaInit = false;

  function onTabActivated(tabId) {
    switch (tabId) {
      case 'dashboardCRM':
        if (!dashInit) {
          dashInit = true;
          if (typeof DashboardPremium !== 'undefined') DashboardPremium.render();
        } else {
          if (typeof DashboardPremium !== 'undefined') DashboardPremium.render();
        }
        break;

      case 'clientes':
        if (!cliInit) {
          cliInit = true;
          if (typeof ClientesMod !== 'undefined') ClientesMod.init();
        } else {
          if (typeof ClientesMod !== 'undefined') ClientesMod.render();
        }
        break;

      case 'estoqueCRM':
        if (typeof renderEstoqueCRM === 'function') renderEstoqueCRM();
        break;

      case 'pdvPro':
        if (!pdvInit) {
          pdvInit = true;
          if (typeof PDVPro !== 'undefined') PDVPro.init();
        }
        if (typeof PDVPro !== 'undefined') PDVPro.renderHistorico();
        break;

      case 'caixa':
        if (!caixaInit) {
          caixaInit = true;
        }
        renderCaixa();
        break;
    }
  }

  /* ============================================================
     3. Hook nas tabs existentes
     ============================================================ */
  // Scripts at end of body run after DOM is ready, no need for DOMContentLoaded
  const tabsEl = document.querySelector('.tabs');
  if (tabsEl) {
    tabsEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.tab');
      if (!btn) return;
      const tabId = btn.dataset.tab;
      // Small delay to let setTab() run first
      setTimeout(() => onTabActivated(tabId), 30);
    });
  }

  /* ============================================================
     4. Módulo de Caixa
     ============================================================ */
  const CAIXA_KEY = 'crm_caixa';

  function loadCaixa()  { return JSON.parse(localStorage.getItem(CAIXA_KEY) || '[]'); }
  function saveCaixa(m) {
    localStorage.setItem(CAIXA_KEY, JSON.stringify(m));
    try {
      const ev = new CustomEvent('caixaUpdated', { detail: m, bubbles: true });
      window.dispatchEvent(ev);
    } catch (e) { /* silencia */ }
  }

  const fmtBRL = (v) =>
    new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(v || 0);
  const esc = (s) =>
    String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  function renderCaixa() {
    const mov = loadCaixa();
    const saldo = mov.reduce((s, m) => s + (m.tipo === 'entrada' ? m.valor : -m.valor), 0);
    const entradas = mov.filter(m => m.tipo === 'entrada').reduce((s, m) => s + m.valor, 0);
    const saidas   = mov.filter(m => m.tipo !== 'entrada').reduce((s, m) => s + m.valor, 0);

    // Saldo
    const saldoEl = document.getElementById('caixaSaldo');
    if (saldoEl) {
      saldoEl.textContent = fmtBRL(saldo);
      saldoEl.className = 'crm-cash-balance ' + (saldo >= 0 ? 'text-green' : 'text-red');
    }
    const entEl = document.getElementById('caixaEntradas');
    if (entEl) entEl.textContent = fmtBRL(entradas);
    const saiEl = document.getElementById('caixaSaidas');
    if (saiEl) saiEl.textContent = fmtBRL(saidas);

    // Timeline
    const tl = document.getElementById('caixaTimeline');
    if (tl) {
      const sorted = [...mov].sort((a,b) => b.id - a.id);
      if (!sorted.length) {
        tl.innerHTML = `<div class="crm-empty"><div class="empty-icon">💰</div>Nenhuma movimentação registrada.</div>`;
      } else {
        tl.innerHTML = sorted.map(m => `
          <div class="crm-timeline-item">
            <div class="crm-timeline-dot ${m.tipo === 'entrada' ? 'in' : 'out'}"></div>
            <div class="tl-desc">
              <strong>${esc(m.descricao||'')}</strong>
              <span style="font-size:11px;color:var(--crm-muted);margin-left:8px;">${m.data||''}</span>
            </div>
            <div class="tl-val ${m.tipo === 'entrada' ? 'in' : 'out'}">${m.tipo === 'entrada' ? '+' : '−'}${fmtBRL(m.valor)}</div>
          </div>`).join('');
      }
    }
  }

  /* ---- Registrar movimentação manual ---- */
  window.caixaRegistrar = function () {
    const desc  = (document.getElementById('caixaNovaDesc')  ||{}).value || '';
    const val   = parseFloat((document.getElementById('caixaNovaVal') ||{}).value || '0');
    const tipo  = (document.getElementById('caixaNovaTipo')  ||{}).value || 'entrada';
    if (!desc.trim()) { alert('Informe a descrição.'); return; }
    if (!(val > 0))   { alert('Informe um valor válido.'); return; }

    const mov = loadCaixa();
    mov.push({ id: Date.now(), descricao: desc, valor: val, tipo, data: new Date().toLocaleString('pt-BR'), dataISO: new Date().toISOString().slice(0,10) });
    saveCaixa(mov);

    const dEl = document.getElementById('caixaNovaDesc');
    const vEl = document.getElementById('caixaNovaVal');
    if (dEl) dEl.value = '';
    if (vEl) vEl.value = '';

    renderCaixa();

    if (typeof DashboardPremium !== 'undefined') DashboardPremium.render();
  };

  /* ============================================================
     5. Exportar produtos CRM
     ============================================================ */
  window.exportProdutosPDV = function () {
    const produtos = JSON.parse(localStorage.getItem('crm_produtos_pdv') || '[]');
    const header = 'SKU,Nome,Categoria,Preco,Custo,Estoque,EstoqueMin,Local';
    const rows = produtos.map(p =>
      [p.sku,p.nome,p.categoria,p.preco,p.custo,p.estoque,p.estoqueMin,p.local]
        .map(v => `"${(v||'').toString().replace(/"/g,'""')}"`)
        .join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF'+csv], { type:'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'produtos-pdv.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  /* ============================================================
     6. Estoque CRM – render
     ============================================================ */
  window.renderEstoqueCRM = function () {
    const tb = document.getElementById('estoqueCRMTb');
    if (!tb) return;
    const produtos = JSON.parse(localStorage.getItem('crm_produtos_pdv') || '[]');
    const search   = ((document.getElementById('estoqueCRMSearch')||{}).value || '').toLowerCase();

    let list = produtos;
    if (search) {
      list = list.filter(p =>
        (p.nome||'').toLowerCase().includes(search) ||
        (p.sku||'').toLowerCase().includes(search) ||
        (p.categoria||'').toLowerCase().includes(search)
      );
    }

    if (!list.length) {
      tb.innerHTML = `<tr><td colspan="8"><div class="crm-empty"><div class="empty-icon">📦</div>Nenhum produto encontrado.</div></td></tr>`;
      return;
    }

    const fmtBRL2 = (v) => new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(v||0);

    tb.innerHTML = list.map(p => {
      const statusClass = (p.estoque||0) <= 0 ? 'danger' : (p.estoque||0) <= (p.estoqueMin||0) ? 'warn' : 'ok';
      const statusText  = (p.estoque||0) <= 0 ? 'Sem estoque' : (p.estoque||0) <= (p.estoqueMin||0) ? 'Crítico' : 'OK';
      return `
        <tr>
          <td style="font-family:monospace;font-size:12px;">${esc(p.sku)}</td>
          <td style="font-weight:700;">${esc(p.nome)}</td>
          <td>${esc(p.categoria||'—')}</td>
          <td>${esc(p.local||'—')}</td>
          <td class="fw800">${p.estoque||0}</td>
          <td style="color:var(--crm-muted);">${p.estoqueMin||0}</td>
          <td class="text-green">${fmtBRL2(p.preco)}</td>
          <td><span class="crm-badge ${statusClass}">${statusText}</span></td>
        </tr>`;
    }).join('');
  };

})();
