/* dashboard-premium.js – Dashboard com KPIs e gráficos avançados */
'use strict';

const DashboardPremium = (() => {
  /* ---- Formatadores ---- */
  const fmtBRL = (v) =>
    new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(v || 0);
  const fmtN = (v) =>
    new Intl.NumberFormat('pt-BR').format(v || 0);
  const pct = (v, t) =>
    t ? ((v / t) * 100).toFixed(1) + '%' : '0%';

  /* ---- Lê dados do localStorage ---- */
  function loadData() {
    const clientes = JSON.parse(localStorage.getItem('crm_clientes')  || '[]');
    const produtos  = JSON.parse(localStorage.getItem('crm_produtos_pdv') || '[]');
    const vendas    = JSON.parse(localStorage.getItem('crm_vendas_pdv')   || '[]');
    const caixa     = JSON.parse(localStorage.getItem('crm_caixa')         || '[]');
    return { clientes, produtos, vendas, caixa };
  }

  /* ---- Cria KPI tile ---- */
  function kpiTile(icon, label, value, delta, cls) {
    return `
      <div class="crm-kpi ${cls || ''}">
        <div class="kpi-icon">${icon}</div>
        <div class="kpi-label">${label}</div>
        <div class="kpi-value">${value}</div>
        ${delta ? `<div class="kpi-delta ${delta.up ? 'up' : 'down'}">${delta.up ? '▲' : '▼'} ${delta.text}</div>` : ''}
      </div>`;
  }

  /* ---- Renderiza seção Dashboard Premium ---- */
  function render() {
    const el = document.getElementById('dashboardCRM');
    if (!el) return;

    const { clientes, produtos, vendas, caixa } = loadData();

    // ---- Métricas ----
    const totalReceita  = vendas.reduce((s, v) => s + (v.total || 0), 0);
    const qtdVendas     = vendas.length;
    const ticketMedio   = qtdVendas ? totalReceita / qtdVendas : 0;
    const qtdClientes   = clientes.length;
    const clientesVIP   = clientes.filter(c => c.categoria === 'VIP').length;
    const totalEstoque  = produtos.reduce((s, p) => s + (p.estoque || 0), 0);
    const prodAbaixoMin = produtos.filter(p => (p.estoque || 0) <= (p.estoqueMin || 0)).length;
    const totalCaixa    = caixa.reduce((s, m) => s + (m.tipo === 'entrada' ? m.valor : -m.valor), 0);
    const receitaMes    = totalReceita; // simplificado (todo o histórico)

    // ---- KPIs ----
    const kpiEl = document.getElementById('dashKPIs');
    if (kpiEl) {
      kpiEl.innerHTML =
        kpiTile('💰', 'Receita Total',       fmtBRL(totalReceita), null, '') +
        kpiTile('🛒', 'Vendas Realizadas',    fmtN(qtdVendas),      null, 'blue') +
        kpiTile('🎯', 'Ticket Médio',         fmtBRL(ticketMedio),  null, '') +
        kpiTile('👥', 'Clientes Cadastrados', fmtN(qtdClientes),    null, 'green') +
        kpiTile('⭐', 'Clientes VIP',         fmtN(clientesVIP),    null, '') +
        kpiTile('📦', 'Itens em Estoque',     fmtN(totalEstoque),   null, 'blue') +
        kpiTile('⚠️', 'Estoque Baixo',        fmtN(prodAbaixoMin),  null, prodAbaixoMin > 0 ? 'red' : 'green') +
        kpiTile('🏦', 'Saldo Caixa',          fmtBRL(totalCaixa),   null, totalCaixa >= 0 ? 'green' : 'red');
    }

    // ---- Últimas Vendas ----
    const lv = document.getElementById('dashUltimasVendas');
    if (lv) {
      const recent = [...vendas].sort((a, b) => b.id - a.id).slice(0, 8);
      if (!recent.length) {
        lv.innerHTML = '<div class="crm-empty"><div class="empty-icon">🛒</div>Nenhuma venda registrada ainda.</div>';
      } else {
        lv.innerHTML = recent.map(v => `
          <div class="crm-timeline-item">
            <div class="crm-timeline-dot in"></div>
            <div class="tl-desc">
              <strong>${v.cliente || 'PDV'}</strong>
              <span style="color:var(--crm-muted);font-size:11px;margin-left:8px;">${v.data || ''} · ${v.itens || 0} iten(s) · ${(v.pagamento||'').toUpperCase()}</span>
            </div>
            <div class="tl-val in">${fmtBRL(v.total)}</div>
          </div>`).join('');
      }
    }

    // ---- Produtos abaixo do mínimo ----
    const pa = document.getElementById('dashProdAlerta');
    if (pa) {
      const alertas = produtos.filter(p => (p.estoque||0) <= (p.estoqueMin||0));
      if (!alertas.length) {
        pa.innerHTML = '<div class="crm-empty"><div class="empty-icon">✅</div>Estoque saudável! Sem alertas.</div>';
      } else {
        pa.innerHTML = alertas.slice(0, 8).map(p => `
          <div class="crm-timeline-item">
            <div class="crm-timeline-dot out"></div>
            <div class="tl-desc">
              <strong>${p.nome}</strong>
              <span style="color:var(--crm-muted);font-size:11px;margin-left:8px;">${p.sku} · ${p.local || ''}</span>
            </div>
            <span class="crm-badge danger">Estoque: ${p.estoque}/${p.estoqueMin}</span>
          </div>`).join('');
      }
    }

    // ---- Gráficos ----
    setTimeout(() => renderCharts(vendas, produtos, clientes), 80);
  }

  /* ---- Renderiza os gráficos ---- */
  function renderCharts(vendas, produtos, clientes) {
    if (typeof ChartsP === 'undefined') return;

    // Vendas por mês (últimos 6 meses)
    const meses = [];
    const receitaMes = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const lbl = d.toLocaleDateString('pt-BR', { month:'short' });
      meses.push(lbl);
      const soma = vendas
        .filter(v => (v.dataISO || '').startsWith(key))
        .reduce((s, v) => s + (v.total || 0), 0);
      receitaMes.push(soma);
    }
    ChartsP.drawBar('chartVendasMes', meses, receitaMes, { title:'Receita por Mês', money:true });

    // Estoque por categoria
    const catMap = {};
    produtos.forEach(p => {
      catMap[p.categoria] = (catMap[p.categoria] || 0) + (p.estoque || 0);
    });
    const catLabels = Object.keys(catMap);
    const catVals   = Object.values(catMap);
    ChartsP.drawDonut('chartEstoqueCategoria', catLabels, catVals, { title:'Estoque por Categoria', center: String(catVals.reduce((a,b)=>a+b,0)) });

    // Top 5 produtos mais vendidos
    const prodVendas = {};
    vendas.forEach(v => {
      (v.itensDetalhes || []).forEach(it => {
        prodVendas[it.nome] = (prodVendas[it.nome] || 0) + (it.quantidade || 1);
      });
    });
    const topProd = Object.entries(prodVendas).sort((a,b) => b[1]-a[1]).slice(0,5);
    if (topProd.length) {
      ChartsP.drawHBar('chartTopProdutos', topProd.map(x=>x[0]), topProd.map(x=>x[1]), { title:'Top Produtos Vendidos', money:false });
    } else {
      const top5 = [...produtos].sort((a,b) => (b.preco||0) - (a.preco||0)).slice(0,5);
      ChartsP.drawHBar('chartTopProdutos', top5.map(p=>p.nome), top5.map(p=>p.estoque||0), { title:'Top Produtos (Estoque)', money:false });
    }

    // Clientes por categoria
    const cliCat = { VIP:0, Regular:0, Novo:0 };
    clientes.forEach(c => { if (cliCat[c.categoria] !== undefined) cliCat[c.categoria]++; });
    ChartsP.drawDonut('chartClientesCat', Object.keys(cliCat), Object.values(cliCat), { title:'Clientes por Categoria', center: String(clientes.length) });
  }

  return { render };
})();
