/* pdv-pro.js – PDV Profissional com múltiplos pagamentos */
'use strict';

const PDVPro = (() => {
  const PROD_KEY    = 'crm_produtos_pdv';
  const VENDAS_KEY  = 'crm_vendas_pdv';
  const CAIXA_KEY   = 'crm_caixa';
  const CLI_KEY     = 'crm_clientes';

  let produtos    = [];
  let cart        = [];
  let desconto    = 0;
  let pagamento   = 'dinheiro';
  let clienteId   = '';
  let searchQ     = '';
  let filterCat   = '';

  const fmtBRL = (v) =>
    new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(v || 0);
  const esc = (s) =>
    String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  /* ---- Persistência ---- */
  function loadProd()   { produtos = JSON.parse(localStorage.getItem(PROD_KEY)  || '[]'); }
  function loadVendas() { return JSON.parse(localStorage.getItem(VENDAS_KEY) || '[]'); }
  function saveVendas(v){ localStorage.setItem(VENDAS_KEY, JSON.stringify(v)); }

  function addMovCaixa(desc, valor, tipo) {
    const mov = JSON.parse(localStorage.getItem(CAIXA_KEY) || '[]');
    mov.push({ id: Date.now(), descricao: desc, valor, tipo, data: new Date().toLocaleString('pt-BR'), dataISO: new Date().toISOString().slice(0,10) });
    localStorage.setItem(CAIXA_KEY, JSON.stringify(mov));
  }

  function updateStock(id, qtdVendida) {
    loadProd();
    const p = produtos.find(x => x.id === id);
    if (p) {
      p.estoque = Math.max(0, (p.estoque || 0) - qtdVendida);
      localStorage.setItem(PROD_KEY, JSON.stringify(produtos));
    }
  }

  /* ---- Categorias ---- */
  function categories() {
    return [...new Set(produtos.map(p => p.categoria).filter(Boolean))].sort();
  }

  /* ---- Computed ---- */
  const subtotal = () => cart.reduce((s, i) => s + i.preco * i.qty, 0);
  const total    = () => Math.max(0, subtotal() - desconto);

  /* ---- Init ---- */
  function init() {
    loadProd();

    // Search
    const srch = document.getElementById('pdvSearch');
    if (srch) srch.addEventListener('input', () => { searchQ = srch.value; renderProducts(); });

    // Category filter
    const catEl = document.getElementById('pdvCatFilter');
    if (catEl) {
      const cats = categories();
      catEl.innerHTML = '<option value="">Todas categorias</option>' +
        cats.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
      catEl.addEventListener('change', () => { filterCat = catEl.value; renderProducts(); });
    }

    // Desconto
    const dscEl = document.getElementById('pdvDesconto');
    if (dscEl) dscEl.addEventListener('input', () => {
      desconto = parseFloat(dscEl.value) || 0;
      renderCart();
    });

    // Pagamento
    document.querySelectorAll('.pdv-pay-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        pagamento = btn.dataset.pag || 'dinheiro';
        document.querySelectorAll('.pdv-pay-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Cliente select
    const cliEl = document.getElementById('pdvCliente');
    if (cliEl) {
      const clientes = JSON.parse(localStorage.getItem(CLI_KEY) || '[]');
      cliEl.innerHTML = '<option value="">— Venda avulsa —</option>' +
        clientes.map(c => `<option value="${c.id}">${esc(c.nome)}</option>`).join('');
      cliEl.addEventListener('change', () => { clienteId = cliEl.value; });
    }

    // Limpar carrinho
    const clearBtn = document.getElementById('pdvClearBtn');
    if (clearBtn) clearBtn.addEventListener('click', clearCart);

    // Finalizar venda
    const finBtn = document.getElementById('pdvFinalizarBtn');
    if (finBtn) finBtn.addEventListener('click', finalizarVenda);

    renderProducts();
    renderCart();
  }

  /* ---- Render grade de produtos ---- */
  function renderProducts() {
    const grid = document.getElementById('pdvProductGrid');
    if (!grid) return;

    loadProd();
    let list = produtos;

    if (searchQ) {
      const q = searchQ.toLowerCase();
      list = list.filter(p =>
        (p.nome||'').toLowerCase().includes(q) ||
        (p.sku||'').toLowerCase().includes(q)
      );
    }
    if (filterCat) {
      list = list.filter(p => p.categoria === filterCat);
    }

    if (!list.length) {
      grid.innerHTML = `<div class="crm-empty" style="grid-column:1/-1"><div class="empty-icon">📦</div>Nenhum produto encontrado.</div>`;
      return;
    }

    const icons = { Móveis:'🪑', Eletrônicos:'📱', Decoração:'🎨', Banheiro:'🚿', Cozinha:'🍳', Infantil:'👶', Jardim:'🌿', Fitness:'🏋️', Iluminação:'💡' };

    grid.innerHTML = list.map(p => {
      const out = (p.estoque || 0) <= 0;
      const icon = icons[p.categoria] || '📦';
      return `
        <div class="pdv-product-card${out ? ' out' : ''}" onclick="PDVPro.addToCart('${p.id}')">
          <div class="pdv-product-icon">${icon}</div>
          <div class="pdv-product-name">${esc(p.nome)}</div>
          <div class="pdv-product-sku">${esc(p.sku)}</div>
          <div class="pdv-product-price">${fmtBRL(p.preco)}</div>
          <div class="pdv-product-stock">${out ? '⚠️ Sem estoque' : `Estoque: ${p.estoque}`}</div>
        </div>`;
    }).join('');
  }

  /* ---- Adicionar ao carrinho ---- */
  function addToCart(id) {
    loadProd();
    const p = produtos.find(x => x.id === id);
    if (!p || (p.estoque || 0) <= 0) return;

    const existing = cart.find(i => i.id === id);
    if (existing) {
      if (existing.qty >= (p.estoque || 0)) {
        alert('Quantidade máxima em estoque atingida.');
        return;
      }
      existing.qty++;
    } else {
      cart.push({ id: p.id, nome: p.nome, sku: p.sku, preco: p.preco, qty: 1, estoqueMax: p.estoque });
    }
    renderCart();
  }

  /* ---- Remover do carrinho ---- */
  function removeFromCart(idx) {
    cart.splice(idx, 1);
    renderCart();
  }

  /* ---- Alterar quantidade ---- */
  function changeQty(idx, delta) {
    const item = cart[idx];
    if (!item) return;
    item.qty = Math.max(1, Math.min(item.qty + delta, item.estoqueMax || 999));
    renderCart();
  }

  /* ---- Limpar carrinho ---- */
  function clearCart() {
    cart = [];
    desconto = 0;
    const dEl = document.getElementById('pdvDesconto');
    if (dEl) dEl.value = '0';
    renderCart();
  }

  /* ---- Render carrinho ---- */
  function renderCart() {
    const itemsEl  = document.getElementById('pdvCartItems');
    const subEl    = document.getElementById('pdvSubtotal');
    const totEl    = document.getElementById('pdvTotal');
    const finBtn   = document.getElementById('pdvFinalizarBtn');

    if (itemsEl) {
      if (!cart.length) {
        itemsEl.innerHTML = `<div class="crm-empty" style="padding:20px 0"><div class="empty-icon" style="font-size:28px">🛒</div>Carrinho vazio</div>`;
      } else {
        itemsEl.innerHTML = cart.map((item, idx) => `
          <div class="pdv-cart-item">
            <div class="item-name">
              ${esc(item.nome)}<br>
              <span class="item-qty">${fmtBRL(item.preco)} / un</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
              <button class="crm-btn sm" style="padding:4px 8px;min-width:28px;" onclick="PDVPro.changeQty(${idx},-1)">−</button>
              <span style="font-weight:700;min-width:20px;text-align:center;">${item.qty}</span>
              <button class="crm-btn sm" style="padding:4px 8px;min-width:28px;" onclick="PDVPro.changeQty(${idx},1)">+</button>
            </div>
            <div class="item-total">${fmtBRL(item.preco * item.qty)}</div>
            <div class="item-rm" onclick="PDVPro.removeFromCart(${idx})">✕</div>
          </div>`).join('');
      }
    }

    const sub = subtotal();
    const tot = total();

    if (subEl) subEl.textContent = fmtBRL(sub);
    if (totEl) totEl.textContent = fmtBRL(tot);
    if (finBtn) finBtn.disabled = cart.length === 0;
  }

  /* ---- Finalizar venda ---- */
  function finalizarVenda() {
    if (!cart.length) return;

    const clientes = JSON.parse(localStorage.getItem(CLI_KEY) || '[]');
    const cli = clientes.find(c => c.id === clienteId);
    const nomeCliente = cli ? cli.nome : 'Venda Avulsa';

    const tot  = total();
    const venda = {
      id             : Date.now(),
      data           : new Date().toLocaleString('pt-BR'),
      dataISO        : new Date().toISOString().slice(0,10),
      cliente        : nomeCliente,
      clienteId      : clienteId || null,
      itens          : cart.reduce((s, i) => s + i.qty, 0),
      itensDetalhes  : cart.map(i => ({ id: i.id, nome: i.nome, quantidade: i.qty, precoUnit: i.preco, subtotal: i.preco * i.qty })),
      subtotal       : subtotal(),
      desconto       : desconto,
      total          : tot,
      pagamento,
      status         : 'Concluída',
    };

    // Salva venda
    const vendas = loadVendas();
    vendas.push(venda);
    saveVendas(vendas);

    // Enfileira venda para sincronização
    if (typeof OfflineSync !== 'undefined') {
      OfflineSync.enqueue('create', 'vendas', venda);
    }

    // Atualiza caixa
    addMovCaixa(`Venda #${venda.id} - ${nomeCliente}`, tot, 'entrada');

    // Atualiza estoque
    cart.forEach(i => updateStock(i.id, i.qty));

    // Atualiza total de compras do cliente
    if (cli) {
      cli.totalCompras = (cli.totalCompras || 0) + tot;
      cli.ultimaCompra = new Date().toISOString().slice(0,10);
      const idx = clientes.findIndex(c => c.id === cli.id);
      if (idx >= 0) clientes[idx] = cli;
      localStorage.setItem(CLI_KEY, JSON.stringify(clientes));
    }

    // Feedback
    alert(`✅ Venda finalizada!\n\nCliente: ${nomeCliente}\nTotal: ${fmtBRL(tot)}\nPagamento: ${pagamento.toUpperCase()}\nItens: ${venda.itens}`);

    clearCart();
    renderProducts();

    // Re-renderiza o dashboard se estiver visível
    if (typeof DashboardPremium !== 'undefined' && document.getElementById('dashPremium')) {
      DashboardPremium.render();
    }
  }

  /* ---- Histórico de vendas ---- */
  function renderHistorico() {
    const tb = document.getElementById('pdvHistTb');
    if (!tb) return;
    const vendas = loadVendas();
    const recent = [...vendas].sort((a, b) => b.id - a.id);
    if (!recent.length) {
      tb.innerHTML = `<tr><td colspan="7"><div class="crm-empty"><div class="empty-icon">📋</div>Nenhuma venda ainda.</div></td></tr>`;
      return;
    }
    tb.innerHTML = recent.map(v => `
      <tr>
        <td style="color:var(--crm-muted);font-size:12px;">${v.data||''}</td>
        <td>${esc(v.cliente||'—')}</td>
        <td>${v.itens||0} iten(s)</td>
        <td>${fmtBRL(v.subtotal||0)}</td>
        <td>${fmtBRL(v.desconto||0)}</td>
        <td class="text-green fw800">${fmtBRL(v.total||0)}</td>
        <td><span class="crm-badge info">${esc(v.pagamento||'—').toUpperCase()}</span></td>
      </tr>`).join('');
  }

  return { init, addToCart, removeFromCart, changeQty, renderHistorico };
})();
