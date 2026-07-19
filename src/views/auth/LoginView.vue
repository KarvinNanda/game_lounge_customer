<template>
  <div class="min-h-screen bg-q-bg flex items-center justify-center p-4">
    <div class="w-full max-w-sm">

      <button
        v-if="route.query.redirect"
        @click="$router.back()"
        class="flex items-center gap-2 text-q-text-2 hover:text-white text-sm mb-6 transition-colors"
      >
        ← Kembali
      </button>

      <!-- Logo -->
      <div class="text-center mb-8">
        <img
          src="@/assets/logo.png"
          alt="Quantum Gaming Center"
          class="h-16 w-auto mx-auto mb-3 object-contain"
          @error="logoError = true"
        />
        <div v-if="logoError" class="text-white font-black text-3xl tracking-wide">Quantum</div>
        <div class="text-q-text-3 text-xs font-medium tracking-[0.25em] uppercase mt-1">Gaming Center</div>
      </div>

      <!-- Card -->
      <div class="bg-q-card border border-q-border rounded-3xl p-7">
        <h2 class="text-xl font-bold text-white mb-1">Selamat Datang!</h2>
        <p class="text-q-text-3 text-sm mb-6">Login untuk mulai bermain</p>

        <form @submit.prevent="handleLogin" class="space-y-4">

          <div>
            <label class="block text-sm font-medium text-q-text-2 mb-1.5">Email</label>
            <input
              v-model="form.email"
              type="email"
              placeholder="email@kamu.com"
              required
              class="w-full bg-q-card2 border border-q-border rounded-xl px-4 py-3 text-white text-sm placeholder-q-text-3 focus:outline-none focus:border-q-primary transition-colors"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-q-text-2 mb-1.5">Password</label>
            <div class="relative">
              <input
                v-model="form.password"
                :type="showPass ? 'text' : 'password'"
                placeholder="Password kamu"
                required
                class="w-full bg-q-card2 border border-q-border rounded-xl px-4 py-3 text-white text-sm placeholder-q-text-3 focus:outline-none focus:border-q-primary transition-colors pr-11"
              />
              <button
                type="button"
                @click="showPass = !showPass"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-q-text-3 hover:text-q-text-2 transition-colors text-sm"
              >
                {{ showPass ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          <p v-if="error" class="text-q-red text-sm text-center bg-red-500/10 rounded-xl py-2 px-3">
            {{ error }}
          </p>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3.5 bg-q-primary hover:bg-q-primary-d text-white font-bold rounded-xl transition-colors shadow-purple disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Memproses...' : 'Login Sekarang' }}
          </button>

        </form>

        <div class="text-center mt-4">
          <RouterLink
            to="/forgot-password"
            class="text-q-primary hover:text-q-primary-l text-sm transition-colors"
          >
            Lupa Password?
          </RouterLink>
        </div>

        <p class="text-center text-q-text-3 text-xs mt-4 border-t border-q-border pt-4 leading-relaxed">
          Belum punya akun? Hubungi admin atau kasir Quantum terdekat.
        </p>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { customerLogin } from '@/api/authApi'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/composables/useToast'
import { sanitizeRedirect } from '@/utils/security'

const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()
const toast     = useToast()

const loading   = ref(false)
const error     = ref('')
const showPass  = ref(false)
const logoError = ref(false)
const form      = reactive({ email: '', password: '' })

const handleLogin = async () => {
  error.value   = ''
  loading.value = true
  try {
    const { data } = await customerLogin(form)
    authStore.setAuth(data.data.token, data.data.customer)
    const name = data.data.customer?.name?.split(' ')[0] || 'Kamu'
    toast.success(`Selamat datang, ${name}! 🎮`)
    // sanitizeRedirect: hanya internal path — cegah open redirect (?redirect=//evil.com)
    const target = sanitizeRedirect(route.query.redirect)
    router.push(target === '/login' ? '/' : target)
  } catch (e) {
    error.value = e?.response?.data?.message || 'Email atau password salah'
    toast.error(error.value)
  } finally {
    loading.value = false
  }
}
</script>
