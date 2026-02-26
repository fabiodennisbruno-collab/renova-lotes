// Pinia stores for Vue 3 CRM integration
// These stores mirror the localStorage data used by index.html

const STORAGE_KEY = 'renova_lotes_html_v6'
const CAIXA_KEY = 'renova_lotes_caixa_v1'
const CLIENTS_KEY = 'renova_lotes_clientes_v1'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Product {
  id: string
  codigo: string | number
  nomeProduto: string
  sku?: string
  tipoProduto: string
  localEstoque: string
  loteId: string
  custoProduto: number
  valorAnuncio: number
  valorVenda?: number
  vendido: boolean
  dataAnuncioISO?: string
  dataVendaISO?: string
  quantity?: number
  /** Computed alias used by PDV */
  name?: string
  salePrice?: number
}

export interface Sale {
  id: number | string
  date: string
  client: string
  amount: number
  items: number
  status: string
  paymentMethod: string
}

export interface CaixaData {
  aberto: boolean
  abertoEm: string | null
  saldoInicial: number
  transacoes: CaixaTransaction[]
}

export interface CaixaTransaction {
  id: string
  tipo: 'entrada' | 'saida'
  descricao: string
  valor: number
  forma: string
  dataISO: string
  hora: string
}

export interface Client {
  id: string
  nome: string
  cpf: string
  telefone: string
  email: string
  tags: string[]
  totalCompras: number
  totalGasto: number
  ultimaCompra: string | null
  criadoEm: string
}

// ─── Stock Store ──────────────────────────────────────────────────────────────

function loadProductsFromStorage(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: Product[] = JSON.parse(raw)
    // Normalise to PDV-friendly shape
    return parsed.map(p => ({
      ...p,
      name: p.nomeProduto || '',
      salePrice: Number(p.valorAnuncio) || 0,
      quantity: p.vendido ? 0 : 1,
    }))
  } catch {
    return []
  }
}

export function useStockStore() {
  const products: Product[] = loadProductsFromStorage()

  function updateProduct(id: string, patch: Partial<Product>): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const all: Product[] = JSON.parse(raw)
      const idx = all.findIndex(p => p.id === id)
      if (idx === -1) return
      all[idx] = { ...all[idx], ...patch }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
    } catch {
      // no-op
    }
  }

  return { products, updateProduct }
}

// ─── Sales Store ─────────────────────────────────────────────────────────────

function loadSalesFromStorage(): Sale[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const all: Product[] = JSON.parse(raw)
    return all
      .filter(p => p.vendido && p.valorVenda)
      .map(p => ({
        id: p.id,
        date: p.dataVendaISO || '',
        client: 'PDV',
        amount: Number(p.valorVenda) || 0,
        items: 1,
        status: 'Concluído',
        paymentMethod: 'pix',
      }))
  } catch {
    return []
  }
}

export function useSalesStore() {
  const sales: Sale[] = loadSalesFromStorage()

  function addSale(sale: Sale): void {
    sales.push(sale)
  }

  return { sales, addSale }
}

// ─── Cash Store ───────────────────────────────────────────────────────────────

function loadCaixaFromStorage(): CaixaData {
  const defaults: CaixaData = {
    aberto: false,
    abertoEm: null,
    saldoInicial: 0,
    transacoes: [],
  }
  try {
    const raw = localStorage.getItem(CAIXA_KEY)
    if (!raw) return defaults
    return { ...defaults, ...JSON.parse(raw) }
  } catch {
    return defaults
  }
}

export function useCashStore() {
  const data: CaixaData = loadCaixaFromStorage()

  function updateBalance(amount: number): void {
    data.transacoes.push({
      id: String(Date.now()),
      tipo: 'entrada',
      descricao: 'Venda PDV',
      valor: amount,
      forma: 'pix',
      dataISO: new Date().toISOString().slice(0, 10),
      hora: new Date().toLocaleTimeString('pt-BR'),
    })
    try {
      localStorage.setItem(CAIXA_KEY, JSON.stringify(data))
    } catch {
      // no-op
    }
  }

  return { data, updateBalance }
}

// ─── Clients Store ────────────────────────────────────────────────────────────

function loadClientsFromStorage(): Client[] {
  try {
    const raw = localStorage.getItem(CLIENTS_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function useClientsStore() {
  const clients: Client[] = loadClientsFromStorage()

  function addClient(client: Client): void {
    clients.push(client)
    try {
      localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients))
    } catch {
      // no-op
    }
  }

  return { clients, addClient }
}
