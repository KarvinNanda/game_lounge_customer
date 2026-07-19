<template>
  <div class="min-h-screen bg-q-bg flex items-center justify-center p-4">
    <div class="w-full max-w-sm">

      <button
        @click="$router.back()"
        class="flex items-center gap-2 text-q-text-2 hover:text-white text-sm mb-6 transition-colors"
      >
        ← Kembali ke Login
      </button>

      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="text-white font-black text-3xl tracking-wide">Quantum</div>
        <div class="text-q-text-3 text-xs font-medium tracking-[0.25em] uppercase mt-0.5">Gaming Center</div>
      </div>

      <div class="bg-q-card border border-q-border rounded-3xl p-7">

        <!-- Form state -->
        <template v-if="!submitted">
          <div class="text-center mb-6">
            <div class="text-5xl mb-3">🔑</div>
            <h2 class="text-xl font-bold text-white mb-2">Lupa Password?</h2>
            <p class="text-q-text-2 text-sm leading-relaxed">
              Masukkan email akun kamu. Kami akan mengirimkan link untuk membuat password baru.
            </p>
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-q-text-2 mb-1.5">Email</label>
              <input
                v-model="email"
                type="email"
                placeholder="email@kamu.com"
                required
                class="w-full bg-q-card2 border border-q-border rounded-xl px-4 py-3 text-white text-sm placeholder-q-text-3 focus:outline-none focus:border-q-primary transition-colors"
              />
            </div>
            <button
              type="submit"
              :disabled="loading"
              class="w-full py-3.5 bg-q-primary hover:bg-q-primary-d text-white font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {{ loading ? 'Mengirim...' : 'Kirim Link Reset Password' }}
            </button>
          </form>
        </template>

        <!-- Success state -->
        <template v-else>
          <div class="text-center">
            <div class="w-16 h-16 rounded-full bg-q-green/20 flex items-center justify-center mx-auto mb-4">
              <span class="text-3xl">✅</span>
            </div>
            <h2 class="text-xl font-bold text-white mb-2">Cek Email Kamu</h2>
            <p class="text-q-text-2 text-sm leading-relaxed mb-4">
              Jika email terdaftar, link reset password akan dikirim dalam beberapa menit.
              Link berlaku selama <strong class="text-white">15 menit</strong>.
            </p>
            <p class="text-q-text-3 text-xs mb-6">
              Tidak menerima email? Cek folder Spam atau coba lagi.
            </p>
            <div class="flex items-center justify-center gap-6">
              <button
                @click="submitted = false; email = ''"
                class="text-q-primary hover:text-q-primary-l text-sm transition-colors"
              >
                Coba Lagi
              </button>
              <RouterLink to="/login" class="text-q-text-2 hover:text-white text-sm transition-colors">
                Kembali ke Login
              </RouterLink>
            </div>
          </div>
        </template>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { publicApi } from '@/api/index'

const email     = ref('')
const loading   = ref(false)
const submitted = ref(false)

const handleSubmit = async () => {
  loading.value = true
  try {
    await publicApi.post('/customer/forgot-password', { email: email.value })
  } catch {
    // Selalu tampilkan sukses — jangan bocorkan apakah email terdaftar atau tidak
  } finally {
    loading.value   = false
    submitted.value = true
  }
}
</script>
