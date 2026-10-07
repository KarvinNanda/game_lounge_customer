<template>
  <div class="relative min-h-dvh flex items-center justify-center p-4 overflow-hidden">
    <div class="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 size-[520px] rounded-full bg-q-primary/15 blur-3xl" aria-hidden="true" />

    <div class="relative w-full max-w-sm">
      <button
        v-if="route.query.redirect"
        type="button"
        class="mb-4 inline-flex items-center gap-1.5 min-h-11 rounded-md text-q-text-2 hover:text-q-text text-sm transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-focus-ring"
        @click="$router.back()"
      >
        <ArrowLeft class="size-4" aria-hidden="true" /> Kembali
      </button>

      <div class="text-center mb-6">
        <div class="font-display text-q-text font-bold text-3xl tracking-wide">Quantum</div>
        <div class="text-q-text-3 text-xs font-medium tracking-[0.25em] uppercase">Gaming Center</div>
      </div>

      <div class="bg-surface/80 backdrop-blur-sm border border-border-subtle rounded-3xl p-6 shadow-card">
        <h1 class="font-display text-xl font-semibold text-q-text mb-1">Selamat Datang!</h1>
        <p class="text-q-text-3 text-sm mb-5">Login untuk mulai bermain</p>

        <form class="space-y-4" novalidate @submit.prevent="handleLogin">
          <div>
            <label for="login-email" class="block text-sm font-medium text-q-text-2 mb-1.5">Email</label>
            <input
              id="login-email"
              v-model="form.email"
              type="email"
              autocomplete="email"
              placeholder="email@kamu.com"
              required
              :class="INPUT"
            />
          </div>

          <div>
            <label for="login-password" class="block text-sm font-medium text-q-text-2 mb-1.5">Password</label>
            <div class="relative">
              <input
                id="login-password"
                v-model="form.password"
                :type="showPass ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="Password kamu"
                required
                :class="[INPUT, 'pr-12']"
              />
              <button
                type="button"
                :aria-label="showPass ? 'Sembunyikan password' : 'Tampilkan password'"
                :aria-pressed="showPass"
                class="absolute right-0 top-0 size-11 flex items-center justify-center rounded-xl text-q-text-3 hover:text-q-text-2 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-focus-ring"
                @click="showPass = !showPass"
              >
                <EyeOff v-if="showPass" class="size-[18px]" aria-hidden="true" />
                <Eye v-else class="size-[18px]" aria-hidden="true" />
              </button>
            </div>
          </div>

          <p v-if="error" role="alert" class="text-q-red text-sm text-center bg-q-red/10 rounded-xl py-2 px-3">
            {{ error }}
          </p>

          <BaseButton type="submit" size="lg" block :loading="loading">
            {{ loading ? 'Memproses...' : 'Login Sekarang' }}
          </BaseButton>
        </form>

        <div class="text-center mt-4">
          <RouterLink
            to="/forgot-password"
            class="inline-flex min-h-11 items-center text-q-primary-l hover:text-q-text text-sm transition-colors rounded-md focus-visible:outline-2 focus-visible:outline-focus-ring"
          >
            Lupa Password?
          </RouterLink>
        </div>

        <p class="text-center text-q-text-3 text-xs mt-3 border-t border-border-subtle pt-4 leading-relaxed">
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
import { ArrowLeft, Eye, EyeOff } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'

const INPUT = 'w-full min-h-11 bg-surface-raised/60 border border-border-subtle rounded-xl px-4 py-2.5 text-q-text text-sm placeholder:text-q-text-3 transition-colors focus:outline-none focus:border-q-primary focus:ring-2 focus:ring-q-primary/30'

const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()
const toast     = useToast()

const loading   = ref(false)
const error     = ref('')
const showPass  = ref(false)
const form      = reactive({ email: '', password: '' })

// Cek ringan di client: jangan kirim request yang pasti ditolak
// (menghemat kuota rate limit login di backend). Validasi sebenarnya tetap di server.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const validate = () => {
  if (!EMAIL_RE.test(form.email.trim())) return 'Masukkan email yang valid'
  if (!form.password)                    return 'Masukkan password'
  return ''
}

const handleLogin = async () => {
  error.value = validate()
  if (error.value) return
  loading.value = true
  try {
    const { data } = await customerLogin(form)
    // Cookie httpOnly di-set otomatis oleh backend — body hanya berisi data customer
    authStore.setAuth(data.data.customer)
    const name = data.data.customer?.name?.split(' ')[0] || 'Kamu'
    toast.success(`Selamat datang, ${name}!`)
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
