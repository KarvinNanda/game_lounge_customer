<template>
  <div class="max-w-2xl mx-auto px-4 py-6 pb-32">

    <!-- Header -->
    <div class="mb-4">
      <h1 class="text-2xl font-bold text-white">Booking Ruangan</h1>
      <p class="text-q-text-2 text-sm mt-0.5">Isi form di bawah untuk booking ruangan favoritmu</p>
    </div>

    <!-- ── STEP INDICATOR ──────────────────────────────────── -->
    <div class="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
      <div v-for="(step, i) in STEPS" :key="i" class="flex items-center gap-2 flex-shrink-0">
        <div class="flex flex-col items-center gap-1">
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
            :class="currentStep > i
              ? 'bg-q-primary text-white'
              : currentStep === i
                ? 'bg-q-primary text-white ring-2 ring-q-primary/30'
                : 'bg-q-card border border-q-border text-q-text-3'"
          >
            <span v-if="currentStep > i">✓</span>
            <span v-else>{{ i + 1 }}</span>
          </div>
          <span class="text-[10px] whitespace-nowrap" :class="currentStep >= i ? 'text-q-primary' : 'text-q-text-3'">
            {{ step }}
          </span>
        </div>
        <div
          v-if="i < STEPS.length - 1"
          class="w-8 h-px mt-[-14px] flex-shrink-0 transition-colors"
          :class="currentStep > i ? 'bg-q-primary' : 'bg-q-border'"
        />
      </div>
    </div>

    <!-- ── SECTION 1: PILIH CABANG ─────────────────────────── -->
    <section class="booking-section">
      <SectionHeader :num="1" title="Pilih Cabang" desc="Pilih cabang Quantum terdekat dari kamu" />

      <select v-model="form.storeId" @change="onStoreChange" class="booking-select">
        <option value="">-- Pilih Cabang --</option>
        <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>

      <Transition name="fade">
        <div v-if="selectedStore" class="mt-2 bg-q-card2 border border-q-border rounded-xl p-3">
          <div class="flex items-center gap-2.5">
            <img
              v-if="selectedStore.photo_url"
              :src="getImgUrl(selectedStore.photo_url)"
              class="w-12 h-12 rounded-lg object-cover flex-shrink-0"
            />
            <div v-else class="w-12 h-12 rounded-lg bg-q-card flex items-center justify-center text-xl flex-shrink-0">🏢</div>
            <div class="flex-1 min-w-0">
              <div class="text-white font-bold text-sm">{{ selectedStore.name }}</div>
              <div class="text-q-text-2 text-xs mt-0.5 line-clamp-1">{{ selectedStore.address }}</div>
              <div class="flex items-center gap-2 mt-0.5">
                <span class="text-q-green text-xs font-medium">Buka {{ storeHours }}</span>
                <a v-if="selectedStore.link_gmaps" :href="selectedStore.link_gmaps" target="_blank" class="text-q-primary text-xs hover:underline">📍 Maps</a>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </section>

    <!-- ── SECTION 2: PILIH RUANGAN ────────────────────────── -->
    <Transition name="slide-down">
      <section v-if="form.storeId" class="booking-section">
        <SectionHeader :num="2" title="Pilih Ruangan" desc="Pilih tipe ruangan sesuai kebutuhanmu" />

        <div v-if="loadingRooms" class="space-y-2">
          <div v-for="i in 3" :key="i" class="h-20 bg-q-card rounded-xl animate-pulse" />
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="room in roomTemplates"
            :key="room.id"
            @click="onRoomSelect(room)"
            class="flex items-center gap-2.5 bg-q-card2 border rounded-xl p-2.5 cursor-pointer transition-all relative"
            :class="form.roomTemplateId === room.id
              ? 'border-q-primary bg-q-primary/5'
              : 'border-q-border hover:border-q-primary'"
          >
            <img
              v-if="room.image_url"
              :src="getImgUrl(room.image_url)"
              class="w-12 h-12 rounded-lg object-cover flex-shrink-0"
            />
            <div v-else class="w-12 h-12 rounded-lg bg-q-card flex items-center justify-center text-xl flex-shrink-0">🎮</div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-white font-semibold text-sm">{{ room.name }}</span>
                <span class="text-[10px] bg-q-card text-q-text-2 px-1.5 py-0.5 rounded-full">
                  {{ formatCapacity(room.capacity_min, room.capacity_max) }}
                </span>
              </div>
              <div class="flex flex-wrap gap-1 mt-1">
                <span
                  v-for="f in room.facilities?.slice(0, 3)"
                  :key="f"
                  class="text-[10px] bg-q-card text-q-text-2 px-1.5 py-0.5 rounded"
                >{{ f }}</span>
              </div>
            </div>

            <div class="text-right flex-shrink-0">
              <div class="text-q-primary font-bold text-sm">{{ formatRp(room.min_price) }}</div>
              <div class="text-q-text-3 text-[10px]">/ jam</div>
            </div>

            <div
              v-if="form.roomTemplateId === room.id"
              class="absolute top-1.5 right-1.5 w-4 h-4 bg-q-primary rounded-full flex items-center justify-center text-white text-[10px]"
            >✓</div>
          </div>
        </div>

        <p class="text-q-text-3 text-xs mt-3 text-center">
          ⓘ Harga dapat berubah sesuai hari dan jam yang dipilih
        </p>
      </section>
    </Transition>

    <!-- ── SECTION 3: PILIH TANGGAL ─────────────────────────── -->
    <Transition name="slide-down">
      <section v-if="form.roomTemplateId" class="booking-section">
        <SectionHeader :num="3" title="Pilih Tanggal" desc="Pilih tanggal bermain kamu" />
        <div>
          <label class="block text-xs text-q-text-2 mb-1.5">Tanggal Bermain</label>
          <input
            type="date"
            v-model="form.date"
            :min="today"
            @change="onDateChange"
            class="booking-select"
          />
        </div>
      </section>
    </Transition>

    <!-- ── SECTION 4: PILIH JAM (Multi-Slot Grid) ─────────── -->
    <Transition name="slide-down">
      <section v-if="form.date && (hourlySlots.length > 0 || loadingSlots)" class="booking-section">
        <SectionHeader :num="4" title="Pilih Jam Bermain" desc="Pilih satu atau lebih jam sesuai rencana" />

        <!-- Jam operasional -->
        <div class="flex items-center gap-2 bg-q-card2 rounded-xl px-3 py-2 mb-3 text-xs text-q-text-2">
          <span>🕐</span>
          <span>Jam operasional: {{ storeHours }}</span>
        </div>

        <!-- Loading skeleton -->
        <div v-if="loadingSlots" class="grid grid-cols-3 gap-2 mb-3">
          <div v-for="i in 9" :key="i" class="h-14 bg-q-card2 rounded-xl animate-pulse" />
        </div>

        <!-- Slot grid -->
        <div v-else-if="hourlySlots.length" class="grid grid-cols-3 gap-2 mb-3">
          <button
            v-for="slot in hourlySlots"
            :key="slot.start_time"
            :disabled="!slot.available"
            @click="toggleSlot(slot.start_time)"
            class="py-3 px-2 rounded-xl text-center border transition-all relative"
            :class="[
              !slot.available
                ? 'bg-q-card2/50 border-q-border/30 opacity-40 cursor-not-allowed'
                : isSlotSelected(slot.start_time)
                  ? 'bg-q-primary border-q-primary text-white'
                  : 'bg-q-card border-q-border hover:border-q-primary cursor-pointer'
            ]"
          >
            <!-- Checkmark -->
            <div
              v-if="isSlotSelected(slot.start_time)"
              class="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center"
            >
              <span class="text-q-primary text-[9px] font-bold">✓</span>
            </div>
            <div class="font-semibold text-xs leading-tight">{{ slot.start_time }}–{{ slot.end_time }}</div>
            <!-- <div v-if="!slot.available" class="text-[10px] mt-0.5 opacity-60">Penuh</div> -->
            <!-- <div
              v-else-if="slot.price"
              class="text-[10px] mt-0.5"
              :class="isSlotSelected(slot.start_time) ? 'text-white/70' : 'text-q-text-3'"
            >{{ formatRp(slot.price) }}</div> -->
          </button>
        </div>

        <div v-else class="text-center py-6 text-q-text-3 text-sm">
          Tidak ada slot tersedia untuk tanggal ini
        </div>

        <!-- Jam yang dipilih -->
        <div v-if="selectedSlots.length > 0" class="bg-q-card2 rounded-xl p-3 mb-3">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-white">Dipilih ({{ totalSelectedHours }} Jam)</span>
            <button @click="clearAllSlots" class="text-red-400 text-xs hover:text-red-300 font-semibold transition-colors">Hapus Semua</button>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <div
              v-for="slotStart in selectedSlots"
              :key="slotStart"
              class="flex items-center gap-1 bg-q-primary/20 text-q-primary-l border border-q-primary/30 rounded-full px-2.5 py-1 text-xs"
            >
              <span>{{ slotStart }}–{{ minsToTimeStr(timeToMinsStr(slotStart) + 60) }}</span>
              <button @click="toggleSlot(slotStart)" class="hover:text-white ml-0.5">×</button>
            </div>
          </div>
        </div>

        <!-- Legend -->
        <div class="flex gap-4 text-xs text-q-text-3">
          <div class="flex items-center gap-1.5">
            <div class="w-3 h-3 bg-q-card border border-q-border rounded" /> Tersedia
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-3 h-3 bg-q-card/50 border border-q-border/30 rounded opacity-40" /> Penuh
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-3 h-3 bg-q-primary rounded" /> Dipilih
          </div>
        </div>
      </section>
    </Transition>

    <!-- ── SECTION 5: PEMBAYARAN ───────────────────────────── -->
    <Transition name="slide-down">
      <section v-if="selectedSlots.length > 0" class="booking-section">
        <SectionHeader :num="5" title="Pembayaran" desc="Periksa ringkasan dan pilih metode bayar" />

        <!-- Ringkasan -->
        <div class="bg-q-card2 rounded-xl p-3 mb-3 space-y-2 text-sm">
          <SummaryRow label="Cabang"  :value="selectedStore?.name" />
          <SummaryRow label="Ruangan" :value="selectedRoom?.name" />
          <SummaryRow label="Tanggal" :value="formatDate(form.date)" />
          <div class="flex justify-between gap-4">
            <span class="text-q-text-2">Jam Bermain</span>
            <span class="text-white font-medium text-right">
              {{ selectedSlots[0] }}–{{ minsToTimeStr(timeToMinsStr(selectedSlots[selectedSlots.length - 1]) + 60) }}
              ({{ totalSelectedHours }} Jam)
            </span>
          </div>
          <template v-if="selectedVoucher">
            <div class="flex justify-between text-sm text-green-400">
              <span>Diskon Voucher ({{ selectedVoucher.code }})</span>
              <span>- {{ formatRp(discountAmount) }}</span>
            </div>
          </template>
          <div class="border-t border-q-border pt-2.5 flex justify-between items-center">
            <span class="text-q-text-2">Total Pembayaran</span>
            <span class="text-q-primary font-bold text-lg">{{ formatRp(finalPrice) }}</span>
          </div>
        </div>

        <!-- Play Credits Option -->
        <div v-if="authStore.isLoggedIn" class="mb-3">
          <label class="block text-xs text-q-text-2 mb-2 font-medium">Gunakan Play Credits?</label>

          <div v-if="loadingCredits" class="text-xs text-q-text-3 py-1">Memuat credits...</div>

          <template v-else>
            <!-- Ada credits valid untuk tanggal ini -->
            <template v-if="validCredits.length > 0">
              <div
                v-for="cr in validCredits"
                :key="cr.id"
                @click="selectCredit(cr)"
                class="payment-card mb-2"
                :class="selectedCreditId === cr.id ? 'payment-card-active' : ''"
              >
                <div class="w-9 h-9 rounded-xl bg-q-primary/20 flex items-center justify-center flex-shrink-0 text-lg">🎮</div>
                <div class="flex-1 min-w-0">
                  <div class="text-white font-semibold text-sm">{{ cr.package?.name }}</div>
                  <div class="text-q-text-3 text-xs">
                    Sisa {{ cr.remaining_hours }} Jam ·
                    Berlaku s/d {{ formatDateCompact(cr.expires_at) }}
                  </div>
                </div>
                <div
                  class="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                  :class="selectedCreditId === cr.id ? 'border-q-primary bg-q-primary' : 'border-q-border'"
                >
                  <div v-if="selectedCreditId === cr.id" class="w-2 h-2 rounded-full bg-white" />
                </div>
              </div>
            </template>

            <!-- Ada credits tapi semua tidak berlaku untuk tanggal ini -->
            <div
              v-else-if="hasExpiredCreditsForDate"
              class="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm mb-2"
            >
              <div class="text-red-400 font-semibold mb-1">⚠️ Play Credits Tidak Berlaku</div>
              <div class="text-red-300/80 text-xs">
                Credits kamu sudah kadaluarsa untuk tanggal
                {{ formatDateCompact(form.date) }}. Gunakan metode pembayaran lain
                atau beli paket credits baru.
              </div>
            </div>

            <!-- Tidak punya credits sama sekali -->
            <div v-else class="text-xs text-q-text-3">
              Tidak ada play credits aktif.
              <RouterLink to="/credits" class="text-q-primary underline ml-1">Beli credits →</RouterLink>
            </div>
          </template>
        </div>

        <!-- Divider sebelum metode bayar biasa -->
        <div v-if="!selectedCreditId" class="flex items-center gap-2 mb-3">
          <div class="flex-1 h-px bg-q-border" />
          <span class="text-q-text-3 text-xs">atau bayar dengan</span>
          <div class="flex-1 h-px bg-q-border" />
        </div>

        <!-- Voucher (opsional) — single row trigger -->
        <div v-if="availableVouchers.length" class="mb-3">
          <!-- No voucher selected: picker button -->
          <button
            v-if="!selectedVoucher"
            @click="showVoucherSheet = true"
            class="w-full flex items-center gap-2.5 bg-q-card2 border border-q-border hover:border-q-primary rounded-xl p-2.5 transition-all text-left"
          >
            <div class="w-8 h-8 rounded-lg bg-q-primary/20 flex items-center justify-center text-base flex-shrink-0">🏷️</div>
            <div class="flex-1">
              <div class="text-q-text-2 text-sm">Punya voucher?</div>
            </div>
            <span class="text-q-primary-l text-xs font-semibold">{{ availableVouchers.length }} tersedia →</span>
          </button>

          <!-- Voucher selected: compact chip with remove -->
          <div
            v-else
            class="flex items-center gap-2.5 bg-q-primary/10 border border-q-primary/40 rounded-xl p-2.5"
          >
            <div class="w-8 h-8 rounded-lg bg-q-primary/20 flex items-center justify-center text-base flex-shrink-0">🏷️</div>
            <div class="flex-1 min-w-0">
              <div class="text-white text-sm font-semibold truncate">{{ selectedVoucher.name }}</div>
              <div class="text-q-primary-l text-xs font-bold">
                <span v-if="selectedVoucher.discount_type === 'percentage'">{{ selectedVoucher.discount_value }}% OFF</span>
                <span v-else>Hemat {{ formatRp(selectedVoucher.discount_value) }}</span>
                <span class="text-q-text-3 font-normal"> · {{ selectedVoucher.code }}</span>
              </div>
            </div>
            <button
              @click="onSelectVoucher(null)"
              class="w-6 h-6 rounded-full bg-q-border hover:bg-red-500/30 flex items-center justify-center text-q-text-2 hover:text-red-400 text-xs transition-all flex-shrink-0"
            >✕</button>
          </div>
        </div>

        <!-- Metode pembayaran — disembunyikan jika pakai Play Credits -->
        <div v-if="!selectedCreditId" class="mb-3">
          <label class="block text-xs text-q-text-2 mb-2 font-medium">Metode Pembayaran</label>
          <div class="space-y-1.5">
            <label
              v-for="method in PAYMENT_METHODS"
              :key="method.value"
              class="flex items-center gap-2.5 bg-q-card2 border rounded-xl p-2.5 cursor-pointer transition-all"
              :class="form.paymentMethod === method.value
                ? 'border-q-primary bg-q-primary/5'
                : 'border-q-border hover:border-q-primary'"
            >
              <input type="radio" v-model="form.paymentMethod" :value="method.value" class="hidden" />
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                :style="{ background: method.bg }"
              >{{ method.icon }}</div>
              <div class="flex-1">
                <div class="text-white font-semibold text-sm">{{ method.label }}</div>
                <div class="text-q-text-3 text-[11px]">{{ method.desc }}</div>
              </div>
              <div
                class="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                :class="form.paymentMethod === method.value ? 'border-q-primary bg-q-primary' : 'border-q-border'"
              >
                <div v-if="form.paymentMethod === method.value" class="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
            </label>
          </div>
        </div>

        <div class="flex items-center gap-1.5 text-[11px] text-q-text-3 mb-4">
          <span>🛡️</span><span>Transaksi aman & terenkripsi.</span>
        </div>

        <button
          @click="handleBooking"
          :disabled="(!form.paymentMethod && !selectedCreditId) || initiating"
          class="w-full py-4 bg-q-primary hover:bg-q-primary-d text-white font-bold rounded-2xl shadow-purple transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
        >
          <span v-if="initiating">⏳ Memproses...</span>
          <span v-else>Bayar Sekarang →</span>
        </button>

        <p class="text-center text-q-text-3 text-xs mt-3">
          Kamu akan diarahkan ke halaman pembayaran yang aman
        </p>
      </section>
    </Transition>

  </div>

  <!-- ── VOUCHER BOTTOM SHEET ──────────────────────────────── -->
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="showVoucherSheet" class="fixed inset-0 z-50 flex items-end justify-center">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60" @click="showVoucherSheet = false" />

        <!-- Sheet -->
        <div class="relative w-full max-w-lg bg-q-card border-t border-q-border rounded-t-2xl pb-safe z-10">

          <!-- Header -->
          <div class="flex items-center justify-between px-5 pt-4 pb-3 border-b border-q-border">
            <div>
              <div class="text-white font-bold">Pilih Voucher</div>
              <div class="text-q-text-2 text-xs mt-0.5">{{ availableVouchers.length }} voucher tersedia</div>
            </div>
            <button
              @click="showVoucherSheet = false"
              class="w-7 h-7 rounded-full bg-q-border flex items-center justify-center text-q-text-2 hover:text-white text-sm transition-colors"
            >✕</button>
          </div>

          <!-- List -->
          <div class="overflow-y-auto max-h-[60vh] divide-y divide-q-border">
            <!-- Tidak pakai voucher -->
            <div
              @click="onSelectVoucher(null); showVoucherSheet = false"
              class="flex items-center gap-3 px-5 py-3.5 hover:bg-q-card2 cursor-pointer transition-colors"
            >
              <div class="w-9 h-9 rounded-xl bg-q-card2 border border-q-border flex items-center justify-center text-base flex-shrink-0">💵</div>
              <div class="flex-1">
                <div class="text-white text-sm font-semibold">Tidak pakai voucher</div>
                <div class="text-q-text-3 text-xs">Bayar harga normal</div>
              </div>
              <div
                class="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                :class="!selectedVoucher ? 'border-q-primary bg-q-primary' : 'border-q-border'"
              >
                <div v-if="!selectedVoucher" class="w-2 h-2 rounded-full bg-white" />
              </div>
            </div>

            <!-- Voucher items -->
            <div
              v-for="v in availableVouchers"
              :key="v.voucher_id"
              @click="onSelectVoucher(v); showVoucherSheet = false"
              class="flex items-center gap-3 px-5 py-3.5 hover:bg-q-card2 cursor-pointer transition-colors"
            >
              <div class="w-9 h-9 rounded-xl bg-q-primary/20 flex items-center justify-center text-base flex-shrink-0">🏷️</div>
              <div class="flex-1 min-w-0">
                <div class="text-white text-sm font-semibold truncate">{{ v.name }}</div>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="text-q-primary-l text-xs font-bold">
                    <template v-if="v.discount_type === 'percentage'">{{ v.discount_value }}% OFF</template>
                    <template v-else>Hemat {{ formatRp(v.discount_value) }}</template>
                  </span>
                  <span class="text-q-text-3 text-xs">· {{ v.code }}</span>
                  <span v-if="v.min_purchase > 0" class="text-q-text-3 text-[10px]">· min {{ formatRp(v.min_purchase) }}</span>
                </div>
              </div>
              <div
                class="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                :class="selectedVoucher?.voucher_id === v.voucher_id ? 'border-q-primary bg-q-primary' : 'border-q-border'"
              >
                <div v-if="selectedVoucher?.voucher_id === v.voucher_id" class="w-2 h-2 rounded-full bg-white" />
              </div>
            </div>
          </div>

          <div class="h-4" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, defineComponent, h } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/composables/useToast'
import { getPublicStores, getPublicRoomTemplates, getBookingSlots, initiateBooking, getMyVouchersForBooking } from '@/api/bookingApi'
import { getMyCredits } from '@/api/authApi'

// ── Inline sub-components ──────────────────────────────────────
const SectionHeader = defineComponent({
  props: { num: Number, title: String, desc: String },
  setup(props) {
    return () => h('div', { class: 'flex items-start gap-3 mb-4' }, [
      h('div', { class: 'w-7 h-7 rounded-full bg-q-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5' }, String(props.num)),
      h('div', {}, [
        h('div', { class: 'text-white font-bold text-[15px]' }, props.title),
        h('div', { class: 'text-q-text-2 text-xs mt-0.5' }, props.desc),
      ]),
    ])
  },
})

const SummaryRow = defineComponent({
  props: { label: String, value: String },
  setup(props) {
    return () => h('div', { class: 'flex justify-between gap-4' }, [
      h('span', { class: 'text-q-text-2' }, props.label),
      h('span', { class: 'text-white font-medium text-right' }, props.value ?? '—'),
    ])
  },
})

// ── Constants ──────────────────────────────────────────────────
const STEPS = ['Cabang', 'Ruangan', 'Tanggal', 'Jam', 'Bayar']
const PAYMENT_METHODS = [
  { value: 'qris',    label: 'QRIS',                desc: 'Bayar cepat dengan semua e-wallet',  icon: '⬛', bg: 'rgba(2,130,222,0.15)'   },
  { value: 'ewallet', label: 'E-Wallet',             desc: 'OVO, GoPay, DANA, ShopeePay',        icon: '💳', bg: 'rgba(14,165,233,0.15)'  },
  { value: 'va',      label: 'Virtual Account',      desc: 'BCA, Mandiri, BNI, BRI, Permata',    icon: '🏦', bg: 'rgba(16,185,129,0.15)'  },
  { value: 'card',    label: 'Kartu Debit / Kredit', desc: 'Visa, Mastercard, JCB',              icon: '💳', bg: 'rgba(245,158,11,0.15)'  },
]

// ── Setup ──────────────────────────────────────────────────────
const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()
const toast     = useToast()

const stores        = ref([])
const roomTemplates = ref([])
const hourlySlots   = ref([])
const selectedSlots = ref([])   // array of start_time strings e.g. ["10:00","11:00"]
const loadingRooms  = ref(false)
const loadingSlots  = ref(false)
const initiating    = ref(false)
const availableCredits  = ref(0)
const availableVouchers = ref([])
const selectedVoucher   = ref(null)
const discountAmount    = ref(0)
const showVoucherSheet  = ref(false)

// Play Credits — per-booking validity
const allMyCredits     = ref([])   // semua credits milik customer (termasuk yang expired)
const validCredits     = ref([])   // credits yang valid untuk tanggal booking ini
const selectedCreditId = ref('')
const loadingCredits   = ref(false)

const today = new Date().toISOString().split('T')[0]

const form = reactive({
  storeId:       '',
  roomTemplateId: 0,
  date:          '',
  paymentMethod: '',
  useCredits:    false,
  voucherID:     '',
})

// ── Computed ───────────────────────────────────────────────────
const totalSelectedHours = computed(() => selectedSlots.value.length)

const totalPrice = computed(() =>
  selectedSlots.value.reduce((sum, slotStart) => {
    const slot = hourlySlots.value.find(s => s.start_time === slotStart)
    return sum + (slot?.price || 0)
  }, 0)
)

const finalPrice = computed(() => {
  if (!selectedVoucher.value || !totalPrice.value) return totalPrice.value
  return Math.max(0, totalPrice.value - discountAmount.value)
})

const currentStep = computed(() => {
  if (!form.storeId)        return 0
  if (!form.roomTemplateId) return 1
  if (!form.date)           return 2
  if (!selectedSlots.value.length) return 3
  return 4
})

const selectedStore = computed(() => stores.value.find((s) => s.id === form.storeId) ?? null)
const selectedRoom  = computed(() => roomTemplates.value.find((r) => r.id === form.roomTemplateId) ?? null)

const storeHours = computed(() => {
  const hours = selectedStore.value?.operating_hours?.[0]
  if (!hours) return '10:00 – 02:00'
  return `${hours.open_time?.slice(0, 5)} – ${hours.close_time?.slice(0, 5)}`
})

// ── Handlers ───────────────────────────────────────────────────
const onStoreChange = async () => {
  Object.assign(form, { roomTemplateId: 0, date: '' })
  hourlySlots.value   = []
  selectedSlots.value = []
  availableVouchers.value = []
  selectedVoucher.value   = null
  if (!form.storeId) return
  loadingRooms.value = true
  try {
    const { data } = await getPublicRoomTemplates(form.storeId)
    roomTemplates.value = data.data || []
  } catch {
    toast.error('Gagal memuat daftar ruangan')
  } finally {
    loadingRooms.value = false
  }
}

const onRoomSelect = (room) => {
  form.roomTemplateId     = room.id
  form.date               = ''
  hourlySlots.value       = []
  selectedSlots.value     = []
  availableVouchers.value = []
  selectedVoucher.value   = null
}

const onDateChange = () => {
  selectedSlots.value     = []
  availableVouchers.value = []
  selectedVoucher.value   = null
  discountAmount.value    = 0
  form.voucherID          = ''
  if (form.date && form.roomTemplateId && form.storeId) {
    loadHourlySlots()
  }
}

const loadHourlySlots = async () => {
  if (!form.storeId || !form.roomTemplateId || !form.date) return
  loadingSlots.value  = true
  hourlySlots.value   = []
  selectedSlots.value = []
  try {
    const { data } = await getBookingSlots({
      store_id:         form.storeId,
      room_template_id: form.roomTemplateId,
      date:             form.date,
    })
    hourlySlots.value = data.data?.slots || []

    // Fetch vouchers applicable for this store+room
    if (authStore.isLoggedIn) {
      try {
        const { data: vData } = await getMyVouchersForBooking({
          store_id:         form.storeId,
          room_template_id: form.roomTemplateId,
        })
        availableVouchers.value = vData.data || []
      } catch {}
    }
  } catch {
    toast.error('Gagal memuat jadwal')
  } finally {
    loadingSlots.value = false
  }
}

const toggleSlot = (slotStart) => {
  const slot = hourlySlots.value.find(s => s.start_time === slotStart)
  if (!slot?.available) return
  const idx = selectedSlots.value.indexOf(slotStart)
  if (idx === -1) {
    selectedSlots.value.push(slotStart)
    selectedSlots.value.sort()
  } else {
    selectedSlots.value.splice(idx, 1)
  }
  // Recalculate voucher discount based on new total
  if (selectedVoucher.value) recalcDiscount(selectedVoucher.value)
}

const clearAllSlots = () => {
  selectedSlots.value = []
  onSelectVoucher(null)
}

const isSlotSelected = (slotStart) => selectedSlots.value.includes(slotStart)

// ── Play Credits ───────────────────────────────────────────────
const hasExpiredCreditsForDate = computed(() => {
  if (!form.date || !authStore.isLoggedIn) return false
  return allMyCredits.value.length > 0 && validCredits.value.length === 0
})

const fetchValidCredits = async () => {
  if (!authStore.isLoggedIn || !form.date || selectedSlots.value.length === 0) return
  loadingCredits.value = true
  try {
    const { data } = await getMyCredits()
    allMyCredits.value = data.data || []
    const bookingDate  = new Date(form.date)

    validCredits.value = allMyCredits.value.filter(cr => {
      const expiresAt = new Date(cr.expires_at)
      return expiresAt >= bookingDate
        && cr.remaining_hours >= totalSelectedHours.value
        && cr.is_active
    })
  } catch {
    validCredits.value = []
  } finally {
    loadingCredits.value = false
  }
}

const selectCredit = (cr) => {
  if (selectedCreditId.value === cr.id) {
    // Toggle off
    selectedCreditId.value = ''
    form.paymentMethod     = ''
  } else {
    selectedCreditId.value = cr.id
    form.paymentMethod     = 'play_credits'
  }
}

// Re-fetch valid credits whenever selected slots change
watch(selectedSlots, fetchValidCredits)

const recalcDiscount = (voucher) => {
  if (!voucher) { discountAmount.value = 0; return }
  if (voucher.discount_type === 'percentage') {
    let disc = totalPrice.value * voucher.discount_value / 100
    if (voucher.max_discount && disc > voucher.max_discount) disc = voucher.max_discount
    discountAmount.value = disc
  } else {
    discountAmount.value = Math.min(voucher.discount_value, totalPrice.value)
  }
}

const onSelectVoucher = (voucher) => {
  if (!voucher) {
    selectedVoucher.value = null
    discountAmount.value  = 0
    form.voucherID        = ''
    return
  }
  selectedVoucher.value = voucher
  form.voucherID        = voucher.voucher_id
  recalcDiscount(voucher)
}

const handleBooking = async () => {
  if (!authStore.isLoggedIn) { router.push('/login'); return }
  if (selectedSlots.value.length === 0) {
    toast.error('Pilih minimal 1 jam bermain')
    return
  }
  initiating.value = true
  try {
    const { data } = await initiateBooking({
      store_id:         form.storeId,
      room_template_id: form.roomTemplateId,
      booking_date:     form.date,
      selected_slots:   selectedSlots.value,
      payment_method:   form.paymentMethod,
      voucher_id:       form.voucherID      || undefined,
      credit_id:        selectedCreditId.value || undefined,
    })

    if (form.paymentMethod === 'play_credits') {
      // Langsung ke success page — tidak perlu Xendit
      router.push({
        name:  'PaymentSuccess',
        query: { booking_code: data.data?.booking_code },
      })
      return
    }

    const invoiceURL = data.data?.invoice_url
    const holdId     = data.data?.hold_id
    if (invoiceURL) {
      if (holdId) sessionStorage.setItem('quantum_hold_id', holdId)
      window.location.href = invoiceURL
    }
  } catch (e) {
    const msg = e?.response?.data?.message || 'Gagal membuat booking'
    toast.error(msg)
  } finally {
    initiating.value = false
  }
}

// ── Helpers ────────────────────────────────────────────────────
const timeToMinsStr = (t) => {
  if (!t || t.length < 5) return 0
  return parseInt(t.slice(0, 2)) * 60 + parseInt(t.slice(3, 5))
}
const minsToTimeStr = (m) => {
  m = ((m % (24 * 60)) + 24 * 60) % (24 * 60)
  return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0')
}

const getImgUrl = (url) => {
  if (!url) return '/placeholder.jpg'
  if (url.startsWith('http')) return url
  return (import.meta.env.VITE_API_URL?.replace('/api', '') || '') + url
}

const formatRp = (price) =>
  price ? 'Rp ' + Math.round(price).toLocaleString('id-ID') : '—'

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''

const formatDateCompact = (d) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

const formatCapacity = (min, max) =>
  min === max ? `${max} Orang` : `Hingga ${max} Orang`

// ── Init ───────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const { data } = await getPublicStores()
    stores.value = data.data || []

    // Pre-fill dari query (e.g. dari RoomDetailView)
    if (route.query.store_id) {
      form.storeId = route.query.store_id
      await onStoreChange()
    }
    if (route.query.room_template_id && roomTemplates.value.length) {
      const rt = roomTemplates.value.find(r => String(r.id) === String(route.query.room_template_id))
      if (rt) onRoomSelect(rt)
    }
  } catch {
    toast.error('Gagal memuat daftar cabang')
  }
})
</script>

<style scoped>
.booking-section {
  background: var(--color-q-card);
  border: 1px solid var(--color-q-border);
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 12px;
}

.booking-select {
  width: 100%;
  background: var(--color-q-card2);
  border: 1px solid var(--color-q-border);
  border-radius: 12px;
  padding: 12px 14px;
  color: white;
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s;
  appearance: none;
}
.booking-select:focus { border-color: var(--color-q-primary); }
.booking-select option { background: #020B2E; }

.payment-card {
  display: flex; align-items: center; gap: 12px;
  background: var(--color-q-card2); border: 1px solid var(--color-q-border);
  border-radius: 12px; padding: 12px; cursor: pointer; transition: all 0.15s;
}
.payment-card:hover    { border-color: var(--color-q-primary); }
.payment-card-active   { border-color: var(--color-q-primary); background: rgba(2, 130, 222, 0.05); }

.slide-down-enter-active { transition: all 0.3s ease; }
.slide-down-enter-from   { opacity: 0; transform: translateY(-12px); }
.fade-enter-active { transition: opacity 0.2s ease; }
.fade-enter-from   { opacity: 0; }

.sheet-enter-active { transition: all 0.25s ease; }
.sheet-leave-active { transition: all 0.2s ease; }
.sheet-enter-from .relative,
.sheet-leave-to .relative { transform: translateY(100%); }
.sheet-enter-from .absolute,
.sheet-leave-to .absolute { opacity: 0; }
</style>
