<template>
  <AuthShell title="Lupa Password" subtitle="Kami kirim link untuk membuat password baru.">
    <!-- Pesan sama untuk email terdaftar maupun tidak: jangan bocorkan siapa yang punya akun -->
    <div v-if="submitted" class="space-y-3">
      <p role="status" class="flex gap-2 rounded-xl bg-q-green/10 p-3 text-sm text-q-text">
        <MailCheck class="size-5 shrink-0 text-q-green" aria-hidden="true" />
        Jika email terdaftar, link reset password sudah dikirim (berlaku 15 menit). Cek inbox dan folder spam.
      </p>
      <BaseButton variant="ghost" block @click="submitted = false">Kirim ulang / ganti email</BaseButton>
    </div>

    <form v-else class="space-y-4" novalidate @submit.prevent="handleSubmit">
      <div>
        <label for="forgot-email" class="mb-1.5 block text-sm font-medium text-q-text-2">Email</label>
        <input
          id="forgot-email"
          v-model="email"
          type="email"
          autocomplete="email"
          placeholder="email@kamu.com"
          required
          class="w-full min-h-11 rounded-xl border border-border-subtle bg-surface-raised/60 px-4 py-2.5 text-sm text-q-text placeholder:text-q-text-3 focus:outline-none focus:border-q-primary focus:ring-2 focus:ring-q-primary/30"
        />
      </div>
      <p v-if="error" role="alert" class="rounded-xl bg-q-red/10 px-3 py-2 text-center text-sm text-q-red">{{ error }}</p>
      <BaseButton type="submit" size="lg" block :loading="loading">Kirim link reset</BaseButton>
    </form>
  </AuthShell>
</template>

<script setup>
import { ref } from 'vue'
import { MailCheck } from 'lucide-vue-next'
import { publicApi } from '@/api/index'
import AuthShell from '@/components/auth/AuthShell.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const email     = ref('')
const error     = ref('')
const loading   = ref(false)
const submitted = ref(false)

const handleSubmit = async () => {
  error.value = EMAIL_RE.test(email.value.trim()) ? '' : 'Masukkan email yang valid'
  if (error.value) return
  loading.value = true
  try {
    await publicApi.post('/customer/forgot-password', { email: email.value.trim() })
  } catch {
    // Selalu tampilkan sukses — jangan bocorkan apakah email terdaftar atau tidak
  } finally {
    loading.value   = false
    submitted.value = true
  }
}
</script>
