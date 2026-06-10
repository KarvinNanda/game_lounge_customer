<template>
  <div class="max-w-2xl mx-auto px-4 py-6 pb-36">

    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <button @click="$router.back()"
        class="w-9 h-9 flex items-center justify-center rounded-full
               bg-q-card border border-q-border text-q-text-2 hover:text-white">
        ←
      </button>
      <div>
        <h1 class="text-xl font-bold text-white">Pesan Makanan & Minuman</h1>
        <p class="text-q-text-3 text-xs mt-0.5">
          Pesanan akan diantar ke ruanganmu. Bayar di kasir.
        </p>
      </div>
    </div>

    <!-- Info booking aktif -->
    <div class="bg-q-card2 border border-q-border rounded-2xl p-4 mb-5
                flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-q-primary/20 flex items-center justify-center text-xl flex-shrink-0">
        🎮
      </div>
      <div>
        <div class="text-white font-semibold text-sm">{{ activeBookingInfo }}</div>
        <div class="text-q-text-3 text-xs mt-0.5">
          Pesanan diantar langsung ke ruanganmu
        </div>
      </div>
    </div>

    <!-- Loading menu -->
    <div v-if="loadingMenu" class="space-y-4">
      <div v-for="i in 2" :key="i">
        <div class="h-5 bg-q-card rounded w-32 mb-3 animate-pulse" />
        <div class="grid grid-cols-2 gap-3">
          <div v-for="j in 4" :key="j" class="h-40 bg-q-card rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>

    <!-- Menu categories -->
    <div v-else>
      <div v-for="cat in menu" :key="cat.id" class="mb-6">
        <h2 class="text-white font-bold text-base mb-3">{{ cat.name }}</h2>

        <div class="grid grid-cols-2 gap-3">
          <div
            v-for="item in cat.items"
            :key="item.id"
            class="bg-q-card border border-q-border rounded-2xl overflow-hidden
                   hover:border-q-primary transition-all"
          >
            <!-- Gambar -->
            <div class="h-28 bg-q-card2 flex items-center justify-center overflow-hidden">
              <img
                v-if="item.image_url"
                :src="item.image_url"
                :alt="item.name"
                class="w-full h-full object-cover"
              />
              <span v-else class="text-4xl">🍽️</span>
            </div>

            <div class="p-3">
              <div class="text-white font-semibold text-sm leading-tight mb-1">
                {{ item.name }}
              </div>
              <div class="text-q-primary font-bold text-sm mb-2">
                Rp {{ formatRp(item.price) }}
              </div>

              <!-- Quantity control -->
              <div v-if="getQty(item.id) > 0" class="flex items-center justify-between">
                <button
                  @click="decreaseQty(item)"
                  class="w-7 h-7 rounded-lg bg-q-card2 border border-q-border
                         text-white font-bold hover:border-q-primary transition-all"
                >
                  −
                </button>
                <span class="text-white font-bold text-sm">{{ getQty(item.id) }}</span>
                <button
                  @click="increaseQty(item)"
                  class="w-7 h-7 rounded-lg bg-q-primary text-white font-bold
                         hover:bg-q-primary-d transition-all"
                >
                  +
                </button>
              </div>

              <button
                v-else
                @click="increaseQty(item)"
                class="w-full py-1.5 bg-q-primary/10 border border-q-primary/30
                       text-q-primary text-sm font-semibold rounded-lg
                       hover:bg-q-primary hover:text-white transition-all"
              >
                + Tambah
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty menu -->
      <div v-if="!menu.length" class="text-center py-16">
        <div class="text-5xl mb-3">🍽️</div>
        <div class="text-white font-bold mb-1">Menu belum tersedia</div>
        <p class="text-q-text-3 text-sm">Tanyakan langsung ke staff kami.</p>
      </div>
    </div>

    <!-- Cart panel (muncul saat ada item dipilih) -->
    <Transition name="slide-up">
      <div
        v-if="cartTotal > 0"
        class="fixed bottom-0 left-0 right-0 z-50 bg-q-bg border-t border-q-border
               px-4 py-4 max-w-2xl mx-auto"
      >
        <!-- Cart items summary -->
        <div class="max-h-32 overflow-y-auto mb-3 space-y-1">
          <div
            v-for="item in cartItems"
            :key="item.id"
            class="flex justify-between text-sm"
          >
            <span class="text-q-text-2">{{ item.name }} ×{{ item.qty }}</span>
            <span class="text-white">Rp {{ formatRp(item.price * item.qty) }}</span>
          </div>
        </div>

        <!-- Notes -->
        <input
          v-model="orderNotes"
          type="text"
          placeholder="Catatan pesanan (opsional)..."
          class="w-full bg-q-card2 border border-q-border rounded-xl px-3 py-2
                 text-white text-sm outline-none mb-3 placeholder:text-q-text-3
                 focus:border-q-primary transition-colors"
        />

        <!-- Total + CTA -->
        <div class="flex items-center justify-between gap-3">
          <div class="flex-shrink-0">
            <div class="text-q-text-3 text-xs">Total</div>
            <div class="text-q-primary font-black text-lg">
              Rp {{ formatRp(cartTotal) }}
            </div>
          </div>
          <button
            @click="handleSubmitOrder"
            :disabled="submitting"
            class="flex-1 py-3 bg-[#0282DE] text-white font-bold rounded-2xl
                   hover:bg-[#0160A8] transition-colors
                   disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span v-if="submitting">⏳ Mengirim...</span>
            <span v-else>🛒 Pesan Sekarang</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- Success state -->
    <Transition name="fade">
      <div
        v-if="orderSuccess"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
      >
        <div class="bg-q-card border border-q-border rounded-3xl p-8 text-center max-w-sm w-full">
          <div class="text-6xl mb-4">✅</div>
          <h2 class="text-2xl font-bold text-white mb-2">Pesanan Dikirim!</h2>
          <p class="text-q-text-2 text-sm mb-1">
            Pesanan kamu sedang diproses. Staff akan segera menyiapkan dan mengantarkan ke ruanganmu.
          </p>
          <p class="text-q-text-3 text-xs mb-6">
            💡 Ingat: pembayaran FnB dilakukan terpisah di kasir ya!
          </p>
          <button
            @click="handleOrderDone"
            class="w-full py-4 bg-[#0282DE] text-white font-bold rounded-2xl hover:bg-[#0160A8] transition-colors"
          >
            Lihat Status Pesanan →
          </button>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter }      from 'vue-router'
import { getFnbMenu, createFnbOrder } from '@/api/fnbApi'
import { useToast } from '@/composables/useToast'

const route   = useRoute()
const router  = useRouter()
const toast   = useToast()

const menu         = ref([])
const cart         = ref({})      // { itemId: { id, name, price, qty } }
const orderNotes   = ref('')
const loadingMenu  = ref(true)
const submitting   = ref(false)
const orderSuccess = ref(false)

const bookingId         = route.query.booking_id || ''
const activeBookingInfo = route.query.room_info   || 'Sesi Bermain Aktif'

const cartItems = computed(() =>
  Object.values(cart.value).filter(i => i.qty > 0)
)
const cartTotal = computed(() =>
  cartItems.value.reduce((sum, i) => sum + i.price * i.qty, 0)
)

const getQty      = (id) => cart.value[id]?.qty || 0

const increaseQty = (item) => {
  if (!cart.value[item.id]) {
    cart.value[item.id] = { id: item.id, name: item.name, price: item.price, qty: 0 }
  }
  cart.value[item.id].qty++
}

const decreaseQty = (item) => {
  if (cart.value[item.id]) {
    cart.value[item.id].qty--
    if (cart.value[item.id].qty <= 0) delete cart.value[item.id]
  }
}

const handleSubmitOrder = async () => {
  if (!bookingId) {
    toast.error('Booking tidak ditemukan')
    return
  }
  submitting.value = true
  try {
    await createFnbOrder({
      booking_id: bookingId,
      notes:      orderNotes.value,
      items:      cartItems.value.map(i => ({
        item_id:  i.id,
        quantity: i.qty,
      })),
    })
    orderSuccess.value = true
    cart.value         = {}
    orderNotes.value   = ''
  } catch (e) {
    toast.error(e?.response?.data?.message || 'Gagal mengirim pesanan')
  } finally {
    submitting.value = false
  }
}

const handleOrderDone = () => {
  orderSuccess.value = false
  router.push('/my-fnb-orders')
}

const formatRp = (p) => Math.round(p || 0).toLocaleString('id-ID')

onMounted(async () => {
  try {
    const { data } = await getFnbMenu()
    menu.value = (data.data || []).filter(cat => cat.items?.length > 0)
  } catch {
    menu.value = []
  } finally {
    loadingMenu.value = false
  }
})
</script>

<style scoped>
.slide-up-enter-active { transition: all 0.3s ease; }
.slide-up-enter-from   { transform: translateY(100%); }
.fade-enter-active     { transition: opacity 0.2s; }
.fade-enter-from       { opacity: 0; }
</style>
