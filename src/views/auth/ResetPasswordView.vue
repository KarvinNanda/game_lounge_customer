<template>
  <div class="min-h-screen bg-q-bg flex items-center justify-center p-4">
    <div class="w-full max-w-sm">

      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="text-white font-black text-3xl tracking-wide">Quantum</div>
        <div class="text-q-text-3 text-xs font-medium tracking-[0.25em] uppercase mt-0.5">Gaming Center</div>
      </div>

      <div class="bg-q-card border border-q-border rounded-3xl p-7">

        <!-- Validating token -->
        <div v-if="validating" class="text-center py-8">
          <div class="text-4xl mb-3 animate-spin inline-block">⏳</div>
          <p class="text-q-text-2 text-sm mt-3">Memvalidasi link...</p>
        </div>

        <!-- Token invalid -->
        <div v-else-if="tokenError" class="text-center">
          <div class="text-5xl mb-4">❌</div>
          <h2 class="text-xl font-bold text-white mb-2">Link Tidak Valid</h2>
          <p class="text-q-text-2 text-sm leading-relaxed mb-6">
            Link reset password sudah kadaluwarsa atau sudah pernah digunakan.
            Silakan request link baru.
          </p>
          <RouterLink to="/forgot-password">
            <button class="w-full py-3.5 bg-q-primary hover:bg-q-primary-d text-white font-bold rounded-xl transition-colors">
              Request Link Baru
            </button>
          </RouterLink>
        </div>

        <!-- Form reset -->
        <template v-else-if="!resetSuccess">
          <div class="text-center mb-6">
            <div class="text-5xl mb-3">🔐</div>
            <h2 class="text-xl font-bold text-white mb-2">Buat Password Baru</h2>
            <p class="text-q-text-2 text-sm">Password baru minimal 8 karakter.</p>
          </div>

          <form @submit.prevent="handleReset" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-q-text-2 mb-1.5">Password Baru</label>
              <input
                v-model="form.new_password"
                :type="showPass ? 'text' : 'password'"
                placeholder="Minimal 8 karakter"
                required
                minlength="8"
                class="w-full bg-q-card2 border border-q-border rounded-xl px-4 py-3 text-white text-sm placeholder-q-text-3 focus:outline-none focus:border-q-primary transition-colors"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-q-text-2 mb-1.5">Konfirmasi Password</label>
              <input
                v-model="form.confirm_password"
                :type="showPass ? 'text' : 'password'"
                placeholder="Ulangi password baru"
                required
                class="w-full bg-q-card2 border border-q-border rounded-xl px-4 py-3 text-white text-sm placeholder-q-text-3 focus:outline-none focus:border-q-primary transition-colors"
              />
            </div>

            <button
              type="button"
              @click="showPass = !showPass"
              class="text-q-text-3 text-xs hover:text-q-text-2 transition-colors"
            >
              {{ showPass ? '🙈 Sembunyikan password' : '👁️ Tampilkan password' }}
            </button>

            <p v-if="formError" class="text-q-red text-sm bg-red-500/10 rounded-xl py-2 px-3">
              {{ formError }}
            </p>

            <button
              type="submit"
              :disabled="saving"
              class="w-full py-3.5 bg-q-primary hover:bg-q-primary-d text-white font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {{ saving ? 'Menyimpan...' : 'Simpan Password Baru' }}
            </button>
          </form>
        </template>

        <!-- Success -->
        <template v-else>
          <div class="text-center">
            <div class="w-16 h-16 rounded-full bg-q-green/20 flex items-center justify-center mx-auto mb-4">
              <span class="text-3xl">✅</span>
            </div>
            <h2 class="text-xl font-bold text-white mb-2">Password Berhasil Diubah!</h2>
            <p class="text-q-text-2 text-sm leading-relaxed mb-6">
              Password baru kamu sudah aktif. Silakan login dengan password baru.
            </p>
            <RouterLink to="/login">
              <button class="w-full py-3.5 bg-q-primary hover:bg-q-primary-d text-white font-bold rounded-xl transition-colors">
                Login Sekarang
              </button>
            </RouterLink>
          </div>
        </template>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { publicApi } from '@/api/index'

const route = useRoute()
// encodeURIComponent: token masuk ke URL path — cegah path traversal/injection
const token = encodeURIComponent(String(route.params.token || ''))

const validating   = ref(true)
const tokenError   = ref(false)
const resetSuccess = ref(false)
const saving       = ref(false)
const showPass     = ref(false)
const formError    = ref('')
const form         = reactive({ new_password: '', confirm_password: '' })

onMounted(async () => {
  try {
    await publicApi.get(`/customer/reset-password/${token}/validate`)
    validating.value = false
  } catch {
    validating.value = false
    tokenError.value = true
  }
})

const handleReset = async () => {
  formError.value = ''
  if (form.new_password !== form.confirm_password) {
    formError.value = 'Konfirmasi password tidak cocok'
    return
  }
  saving.value = true
  try {
    await publicApi.post(`/customer/reset-password/${token}`, form)
    resetSuccess.value = true
  } catch (e) {
    formError.value = e?.response?.data?.message || 'Gagal mengubah password'
  } finally {
    saving.value = false
  }
}
</script>
