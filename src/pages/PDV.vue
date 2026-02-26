<template>
  <div class="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 bg-gray-100 min-h-screen">
    <!-- Products Section -->
    <div class="lg:col-span-2 space-y-4">
      <!-- Search and Filter -->
      <div class="bg-white rounded-lg shadow-md p-4">
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="🔍 Buscar produto por nome ou SKU..." 
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>

      <!-- Products Grid -->
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div 
          v-for="product in filteredProducts" 
          :key="product.id"
          @click="addToCart(product)"
          class="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg hover:scale-105 transition-all"
        >
          <div class="bg-gray-200 h-24 rounded-lg mb-3 flex items-center justify-center text-2xl">
            📦
          </div>
          <p class="font-bold text-gray-800 text-sm truncate">{{ product.name }}</p>
          <p class="text-xs text-gray-500 mb-2">{{ product.sku }}</p>
          <p class="text-lg font-bold text-green-600">R$ {{ product.salePrice.toFixed(2) }}</p>
          <p class="text-xs text-gray-400 mt-1">Est: {{ product.quantity }} unid.</p>
        </div>
      </div>
    </div>

    <!-- Cart Section -->
    <div class="lg:col-span-1">
      <div class="bg-white rounded-lg shadow-lg p-4 sticky top-6 space-y-4">
        <!-- Cart Header -->
        <h3 class="text-lg font-bold text-gray-800 border-b pb-3">🛒 Carrinho</h3>

        <!-- Cart Items -->
        <div v-if="cart.length > 0" class="space-y-2 max-h-64 overflow-y-auto">
          <div 
            v-for="(item, idx) in cart" 
            :key="idx"
            class="flex justify-between items-center p-2 bg-gray-50 rounded-lg hover:bg-blue-50"
          >
            <div class="flex-1">
              <p class="text-sm font-semibold text-gray-800">{{ item.name }}</p>
              <p class="text-xs text-gray-500">{{ item.quantity }}x R$ {{ item.salePrice.toFixed(2) }}</p>
            </div>
            <div class="flex gap-1">
              <button 
                @click="removeFromCart(idx)"
                class="text-red-500 hover:text-red-700 font-bold"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-6 text-gray-400">
          <p class="text-sm">Carrinho vazio</p>
          <p class="text-xs">Selecione produtos</p>
        </div>

        <!-- Totals -->
        <div class="border-t pt-3 space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Subtotal:</span>
            <span class="font-semibold">R$ {{ subtotal.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Desconto:</span>
            <input 
              v-model.number="discount"
              type="number" 
              class="w-20 px-2 py-1 border border-gray-300 rounded text-right text-sm"
              min="0"
            />
          </div>
          <div class="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total:</span>
            <span class="text-green-600">R$ {{ total.toFixed(2) }}</span>
          </div>
        </div>

        <!-- Payment Methods -->
        <div class="border-t pt-3 space-y-2">
          <p class="text-sm font-bold text-gray-800">Forma de Pagamento:</p>
          <div class="space-y-2">
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="paymentMethod" type="radio" value="cash" class="w-4 h-4">
              <span class="text-sm">💵 Dinheiro</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="paymentMethod" type="radio" value="card" class="w-4 h-4">
              <span class="text-sm">💳 Cartão</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="paymentMethod" type="radio" value="pix" class="w-4 h-4">
              <span class="text-sm">📱 PIX</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="paymentMethod" type="radio" value="credit" class="w-4 h-4">
              <span class="text-sm">📊 A Prazo</span>
            </label>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="grid grid-cols-2 gap-2 border-t pt-3">
          <button 
            @click="clearCart"
            class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-bold"
          >
            Limpar
          </button>
          <button 
            @click="completeSale"
            :disabled="cart.length === 0"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm font-bold"
          >
            Finalizar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStockStore, useSalesStore, useCashStore } from '../stores'

const stockStore = useStockStore()
const salesStore = useSalesStore()
const cashStore = useCashStore()

const searchQuery = ref('')
const cart = ref<any[]>([])  
const discount = ref(0)
const paymentMethod = ref('cash')

const filteredProducts = computed(() => {
  return stockStore.products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const subtotal = computed(() => 
  cart.value.reduce((sum, item) => sum + (item.salePrice * item.quantity), 0)
)

const total = computed(() => Math.max(0, subtotal.value - discount.value))

const addToCart = (product: any) => {
  const existingItem = cart.value.find(item => item.id === product.id)
  if (existingItem) {
    existingItem.quantity += 1
  } else {
    cart.value.push({ ...product, quantity: 1 })
  }
}

const removeFromCart = (idx: number) => {
  cart.value.splice(idx, 1)
}

const clearCart = () => {
  cart.value = []
  discount.value = 0
}

const completeSale = () => {
  if (cart.value.length === 0) return

  const sale = {
    id: Date.now(),
    date: new Date().toLocaleString('pt-BR'),
    client: 'Cliente PDV',
    amount: total.value,
    items: cart.value.length,
    status: 'Concluído',
    paymentMethod: paymentMethod.value
  }

  // Update stores
  salesStore.addSale(sale)
  cashStore.updateBalance(total.value)
  cart.value.forEach(item => {
    stockStore.updateProduct(item.id, { quantity: item.quantity - 1 })
  })

  // Show success message
  alert(`✅ Venda realizada com sucesso!\nTotal: R$ ${total.value.toFixed(2)}\nForma: ${paymentMethod.value}`)
  clearCart()
}
</script>