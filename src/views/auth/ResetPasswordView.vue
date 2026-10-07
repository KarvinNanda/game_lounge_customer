<template>
  <AuthShell :title="TITLES[state]" :subtitle="state === 'form' ? 'Minimal 8 karakter.' : ''">
    <div v-if="state === 'validating'" class="flex items-center justify-center gap-2 py-6 text-sm text-q-text-2" role="status">
      <Loader2 class="size-5 animate-spin text-q-primary-l" aria-hidden="true" /> Memeriksa link…
    </div>

    <div v-else-if="state === 'invalid'" role="alert" class="space-y-4 text-sm text-q-text-2">
      <p class="flex gap-2 rounded-xl bg-q-red/10 p-3 text-q-red">
        <LinkIcon class="size-5 shrink-0" aria-hidden="true" /> Link reset tidak valid atau sudah kedaluwarsa.
      </p>
      <BaseButton to="/forgot-password" block>Minta link baru</BaseButton>
    </div>

    <div v-else-if="state === 'done'" role="status" class="space-y-4">
      <p class="flex gap-2 rounded-xl bg-q-green/10 p-3 text-sm text-q-text">
        <CircleCheck class="size-5 shrink-0 text-q-green" aria-hidden="true" /> Password berhasil diubah. Silakan login dengan password baru.
      </p>
      <BaseButton to="/login" size="lg" block>Login sekarang</BaseButton>
    </div>

    <form v-else class="space-y-4" novalidate @submit.prevent="handleReset">
      <div>
        <label for="reset-new" class="mb-1.5 block text-sm font-medium text-q-text-2">Password baru</label>
        <PasswordInput id="reset-new" v-model="form.new_password" autocomplete="new-password" />
      </div>
      <div>
        <label for="reset-confirm" class="mb-1.5 block text-sm font-medium text-q-text-2">Konfirmasi password baru</label>
        <PasswordInput id="reset-confirm" v-model="form.confirm_password" autocomplete="new-password" />
      </div>
      <p v-if="formError" role="alert" class="rounded-xl bg-q-red/10 px-3 py-2 text-center text-sm text-q-red">{{ formError }}</p>
      <BaseButton type="submit" size="lg" block :loading="saving">Simpan password</BaseButton>
    </form>
  </AuthShell>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Loader2, Link as LinkIcon, CircleCheck } from 'lucide-vue-next'
import { publicApi } from '@/api/index'
import AuthShell from '@/components/auth/AuthShell.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import PasswordInput from '@/components/ui/PasswordInput.vue'

const MIN_LENGTH = 8
const TITLES = {
  validating: 'Memeriksa Link',
  invalid:    'Link tidak valid',
  form:       'Buat Password Baru',
  done:       'Password Diubah',
}

const route = useRoute()
// encodeURIComponent: token masuk ke URL path — cegah path traversal/injection
const token = encodeURIComponent(String(route.params.token || ''))

const state     = ref('validating') // validating | invalid | form | done
const saving    = ref(false)
const formError = ref('')
const form      = reactive({ new_password: '', confirm_password: '' })

const validate = () => {
  if (form.new_password.length < MIN_LENGTH) return `Password minimal ${MIN_LENGTH} karakter`
  if (form.new_password !== form.confirm_password) return 'Konfirmasi password tidak cocok'
  return ''
}

const handleReset = async () => {
  formError.value = validate()
  if (formError.value) return
  saving.value = true
  try {
    await publicApi.post(`/customer/reset-password/${token}`, { ...form })
    state.value = 'done'
  } catch (e) {
    // Token kedaluwarsa saat form diisi (link berlaku 15 menit) → minta link baru
    if (e?.response?.status === 400) state.value = 'invalid'
    else formError.value = e?.response?.data?.message || 'Gagal mengubah password'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    await publicApi.get(`/customer/reset-password/${token}/validate`)
    state.value = 'form'
  } catch {
    state.value = 'invalid'
  }
})
</script>
