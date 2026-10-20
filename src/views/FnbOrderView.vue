<template>
  <div class="mx-auto max-w-6xl px-4 pt-4 pb-40 sm:px-6 lg:pb-10">
    <ResultScreen
      v-if="orderSent"
      tone="success"
      title="Pesanan Terkirim"
      message="Staff sedang menyiapkan pesananmu dan akan mengantarnya ke ruangan. Pembayaran F&B di kasir."
    >
      <template #actions>
        <BaseButton to="/my-fnb-orders" size="lg" block>Lihat status pesanan</BaseButton>
        <BaseButton variant="ghost" block @click="orderSent = false">Pesan lagi</BaseButton>
      </template>
    </ResultScreen>

    <template v-else>
      <PageHeader title="Pesan F&B" subtitle="Diantar ke ruanganmu · bayar di kasir" back />
      <!-- Satu region untuk mengumumkan perubahan jumlah: "Es Teh: 2" -->
      <p class="sr-only" aria-live="polite">{{ qtyAnnouncement }}</p>

      <BaseEmptyState
        v-if="!bookingId"
        :icon="UtensilsCrossed"
        title="Pesan dari booking aktif"
        text="Buka booking aktif di My Bookings, lalu pilih Pesan F&B supaya pesanan diantar ke ruanganmu."
      >
        <BaseButton to="/my-bookings">Ke My Bookings</BaseButton>
      </BaseEmptyState>

      <div v-else class="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
        <div>
          <p class="hud-cut-sm mb-4 flex items-center gap-2 bg-q-primary/10 p-3 text-sm text-q-text">
            <Gamepad2 class="size-4 shrink-0 text-q-primary-l" aria-hidden="true" />
            <span class="hud-label shrink-0 text-q-primary-l!">Antar ke</span>
            <span class="truncate">{{ roomInfo }}</span>
          </p>

          <div v-if="loadingMenu" class="grid gap-2 lg:grid-cols-2" aria-busy="true">
            <BaseSkeleton v-for="i in 6" :key="i" class="h-[68px]" />
          </div>

          <p v-else-if="menuError" role="alert" class="hud-cut-sm flex items-center justify-between gap-3 bg-q-red/10 p-3 text-sm text-q-red">
            Gagal memuat menu.
            <button type="button" class="min-h-11 shrink-0 cursor-pointer font-semibold text-q-text underline hud-focus" @click="loadMenu">Coba lagi</button>
          </p>

          <BaseEmptyState v-else-if="!menu.length" :icon="UtensilsCrossed" title="Menu belum tersedia" text="Tanyakan langsung ke staff kami." />

          <template v-else>
            <!-- Filter kategori: chip yang membungkus, bukan strip geser -->
            <div aria-label="Kategori" role="group" class="mb-4 flex flex-wrap gap-1.5">
              <button
                v-for="cat in [{ id: null, name: 'Semua' }, ...menu]"
                :key="cat.id ?? 'all'"
                type="button"
                :aria-pressed="activeCategory === cat.id"
                class="hud-option min-h-11 px-4 text-sm font-semibold"
                @click="activeCategory = cat.id"
              >{{ cat.name }}</button>
            </div>

            <section v-for="cat in visibleMenu" :key="cat.id" class="mb-5" :aria-labelledby="`cat-${cat.id}`">
              <h2 :id="`cat-${cat.id}`" class="hud-label mb-2">{{ cat.name }}</h2>
              <ul class="grid gap-1.5 lg:grid-cols-2">
                <li v-for="item in cat.items" :key="item.id">
                  <HudPanel cut="sm" class="flex items-center gap-3 p-2.5">
                    <img v-if="item.image_url" :src="getImgUrl(item.image_url)" alt="" loading="lazy" class="hud-cut-sm size-12 shrink-0 object-cover" />
                    <span v-else class="hud-cut-sm flex size-12 shrink-0 items-center justify-center bg-surface-raised text-q-text-3">
                      <UtensilsCrossed class="size-5" aria-hidden="true" />
                    </span>
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-sm font-semibold text-q-text">{{ item.name }}</p>
                      <p v-if="item.description" class="truncate text-xs text-q-text-3">{{ item.description }}</p>
                      <p class="text-sm font-semibold text-q-gold tabular-nums">{{ formatRp(item.price) }}</p>
                    </div>
                    <QtyStepper :name="item.name" :qty="cart.qty(item.id)" @add="changeQty(item, 1)" @remove="changeQty(item, -1)" />
                  </HudPanel>
                </li>
              </ul>
            </section>
          </template>
        </div>

        <!-- Desktop: keranjang menempel di kanan -->
        <aside v-if="isDesktop" aria-label="Pesananmu" class="lg:sticky lg:top-20">
          <HudPanel class="p-4">
            <HudLabel tag="h2" class="mb-3">Pesananmu · {{ cart.count.value }} item</HudLabel>
            <p v-if="!cart.count.value" class="py-4 text-center text-sm text-q-text-3">Belum ada item. Tambah dari menu di kiri.</p>
            <template v-else>
              <ul class="divide-y divide-border-subtle">
                <li v-for="line in cart.items.value" :key="line.id" class="flex items-center gap-3 py-2">
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-semibold text-q-text">{{ line.name }}</p>
                    <p class="text-xs text-q-text-3 tabular-nums">{{ formatRp(line.price * line.qty) }}</p>
                  </div>
                  <QtyStepper :name="line.name" :qty="line.qty" @add="changeQty(line, 1)" @remove="changeQty(line, -1)" />
                </li>
              </ul>
              <label for="fnb-notes" class="mt-3 mb-1.5 block text-xs font-semibold text-q-text-2">Catatan (opsional)</label>
              <textarea id="fnb-notes" v-model="orderNotes" rows="2" maxlength="300" placeholder="Contoh: es sedikit, tanpa sambal" class="hud-input resize-none" />
            </template>
            <BaseButton class="mt-4" size="lg" block :loading="submitting" :disabled="!cart.count.value" @click="handleSubmitOrder">
              {{ submitting ? 'Mengirim...' : `Kirim pesanan · ${formatRp(cart.total.value)}` }}
            </BaseButton>
          </HudPanel>
        </aside>
      </div>
    </template>

    <!-- HP: bar keranjang, di atas BottomNav -->
    <div
      v-if="!isDesktop && !orderSent && cart.count.value > 0"
      data-cart-bar
      class="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 border-t border-border-subtle bg-q-bg/95 backdrop-blur-xl"
    >
      <div class="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
        <div class="min-w-0 flex-1">
          <p class="hud-label">{{ cart.count.value }} item</p>
          <p class="font-display text-lg leading-tight text-q-text tabular-nums">{{ formatRp(cart.total.value) }}</p>
        </div>
        <BaseButton size="lg" @click="showCart = true">
          <ShoppingBag class="size-4" aria-hidden="true" /> Lihat pesanan
        </BaseButton>
      </div>
    </div>

    <BaseSheet v-if="!isDesktop" v-model="showCart" title="Pesananmu" :description="`${cart.count.value} item · ${formatRp(cart.total.value)}`">
      <ul class="divide-y divide-border-subtle">
        <li v-for="line in cart.items.value" :key="line.id" class="flex items-center gap-3 px-5 py-3">
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-q-text">{{ line.name }}</p>
            <p class="text-xs text-q-text-3 tabular-nums">{{ formatRp(line.price * line.qty) }}</p>
          </div>
          <QtyStepper :name="line.name" :qty="line.qty" @add="changeQty(line, 1)" @remove="changeQty(line, -1)" />
        </li>
      </ul>
      <div class="px-5 py-3">
        <label for="fnb-notes" class="mb-1.5 block text-xs font-semibold text-q-text-2">Catatan (opsional)</label>
        <textarea id="fnb-notes" v-model="orderNotes" rows="2" maxlength="300" placeholder="Contoh: es sedikit, tanpa sambal" class="hud-input resize-none" />
      </div>
      <template #footer>
        <BaseButton size="lg" block :loading="submitting" :disabled="!cart.count.value" @click="handleSubmitOrder">
          {{ submitting ? 'Mengirim...' : `Kirim pesanan · ${formatRp(cart.total.value)}` }}
        </BaseButton>
      </template>
    </BaseSheet>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, defineComponent, h } from 'vue'
import { useRoute } from 'vue-router'
import { Gamepad2, UtensilsCrossed, ShoppingBag, Minus, Plus } from 'lucide-vue-next'
import { getFnbMenu, createFnbOrder } from '@/api/fnbApi'
import { useToast } from '@/composables/useToast'
import { useCart } from '@/composables/useCart'
import { getImgUrl } from '@/utils/security'
import { formatRp } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import BaseEmptyState from '@/components/ui/BaseEmptyState.vue'
import BaseSheet from '@/components/ui/BaseSheet.vue'
import ResultScreen from '@/components/ui/ResultScreen.vue'
import HudPanel from '@/components/ui/HudPanel.vue'
import HudLabel from '@/components/ui/HudLabel.vue'
import { useMediaQuery } from '@/composables/useMediaQuery'

// Tombol −/jumlah/+ (dipakai di daftar menu dan di sheet keranjang)
const STEP_BTN = 'hud-option size-11 flex items-center justify-center'
const QtyStepper = defineComponent({
  props: { name: String, qty: Number },
  emits: ['add', 'remove'],
  setup(props, { emit }) {
    return () => h('div', { class: 'flex shrink-0 items-center gap-1' }, [
      props.qty > 0 && h('button', { type: 'button', 'aria-label': `Kurangi ${props.name}`, class: [STEP_BTN, 'text-q-text-2'], onClick: () => emit('remove') }, [h(Minus, { class: 'size-4', 'aria-hidden': 'true' })]),
      props.qty > 0 && h('span', { class: 'w-6 text-center font-mono text-sm font-semibold tabular-nums text-q-text' }, String(props.qty)),
      h('button', { type: 'button', 'aria-label': `Tambah ${props.name}`, class: [STEP_BTN, 'bg-q-primary-strong! text-white!'], onClick: () => emit('add') }, [h(Plus, { class: 'size-4', 'aria-hidden': 'true' })]),
    ])
  },
})

const ROOM_INFO_MAX = 80
const queryString   = (v) => (typeof v === 'string' ? v : '') // ?a=1&a=2 → array → abaikan

const route = useRoute()
const toast = useToast()
const cart  = useCart()
const isDesktop = useMediaQuery('(min-width: 1024px)')

// booking_id dari URL: hanya angka atau UUID; selain itu dianggap tidak ada
const BOOKING_ID_RE = /^(\d{1,12}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i
const rawBookingId  = queryString(route.query.booking_id)
const bookingId     = BOOKING_ID_RE.test(rawBookingId) ? rawBookingId : ''
// Teks dari URL (link dibagikan) — dibatasi supaya tidak bisa jadi pesan panjang yang menyesatkan
const roomInfo  = queryString(route.query.room_info).slice(0, ROOM_INFO_MAX) || 'Sesi bermain aktif'

const menu            = ref([])
const loadingMenu     = ref(true)
const menuError       = ref(false)
const qtyAnnouncement = ref('')
const activeCategory = ref(null)
const showCart       = ref(false)
const orderNotes     = ref('')
const submitting     = ref(false)
const orderSent      = ref(false)

const visibleMenu = computed(() =>
  activeCategory.value === null ? menu.value : menu.value.filter((c) => c.id === activeCategory.value))

const changeQty = (item, delta) => {
  if (delta > 0) cart.add(item)
  else cart.remove(item)
  qtyAnnouncement.value = `${item.name}: ${cart.qty(item.id)}`
}

// Keranjang kosong (mis. semua item dikurangi di sheet) → tutup sheet, fokus ke judul
// (bar keranjang yang membuka sheet sudah hilang, jadi fokus tidak bisa kembali ke sana)
watch(() => cart.count.value, async (n) => {
  if (n !== 0 || !showCart.value) return
  showCart.value = false
  await nextTick()
  document.querySelector('h1')?.focus()
})

const handleSubmitOrder = async () => {
  submitting.value = true
  try {
    await createFnbOrder({ booking_id: bookingId, notes: orderNotes.value, items: cart.toPayload() })
    cart.clear()
    orderNotes.value = ''
    showCart.value   = false
    orderSent.value  = true
  } catch (e) {
    toast.error(e?.response?.data?.message || 'Gagal mengirim pesanan')
  } finally {
    submitting.value = false
  }
}

const loadMenu = async () => {
  loadingMenu.value = true
  menuError.value   = false
  try {
    const { data } = await getFnbMenu()
    menu.value = (data.data || []).filter((cat) => cat.items?.length > 0)
  } catch {
    menuError.value = true
  } finally {
    loadingMenu.value = false
  }
}

onMounted(() => {
  if (!bookingId) { loadingMenu.value = false; return }
  loadMenu()
})
</script>
