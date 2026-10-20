<template>
  <div class="mx-auto max-w-6xl px-4 pt-4 pb-6 sm:px-6">
    <PageHeader title="Profil Saya" />

    <!-- Kartu pemain -->
    <HudPanel brackets class="mb-4 flex items-center gap-4 p-4">
      <span class="hud-hex flex size-14 shrink-0 items-center justify-center bg-gradient-to-br from-q-primary-l to-q-primary-strong font-display text-xl text-white" aria-hidden="true">
        {{ customerInitial }}
      </span>
      <div class="min-w-0">
        <HudLabel tone="accent">PLAYER</HudLabel>
        <p class="truncate font-display text-lg uppercase leading-tight text-q-text">{{ authStore.customer?.name }}</p>
        <BaseBadge :tone="authStore.isMember ? 'gold' : 'neutral'" class="mt-1">
          <Crown v-if="authStore.isMember" class="size-3" aria-hidden="true" />
          {{ authStore.isMember ? 'Member' : 'Regular' }}
        </BaseBadge>
      </div>
    </HudPanel>

    <!-- HP: tab supaya tidak scroll panjang; desktop: dua panel berdampingan -->
    <div class="mb-4 lg:hidden">
      <BaseSegmented v-model="tab" :options="TABS" label="Bagian profil" />
    </div>

    <div class="grid gap-4 lg:grid-cols-2 lg:items-start">
      <div v-show="isDesktop || tab === 'data'" data-panel>
        <HudPanel class="p-4">
          <HudLabel tag="h2" class="mb-4 hidden lg:block">Data diri</HudLabel>
          <form aria-label="Data diri" class="space-y-4" novalidate @submit.prevent="handleSaveProfile">
            <div>
              <label for="profile-name" :class="LABEL">Nama</label>
              <input id="profile-name" v-model="form.name" type="text" autocomplete="name" required class="hud-input" :aria-invalid="nameError ? 'true' : undefined" :aria-describedby="nameError ? 'profile-name-error' : undefined" />
              <p v-if="nameError" id="profile-name-error" role="alert" class="mt-1 text-xs text-q-red">{{ nameError }}</p>
            </div>
            <div>
              <label for="profile-whatsapp" :class="LABEL">Nomor WhatsApp</label>
              <input id="profile-whatsapp" v-model="form.whatsapp" type="tel" inputmode="tel" autocomplete="tel" placeholder="08xxxxxxxxxx" required class="hud-input" :aria-invalid="waError ? 'true' : undefined" :aria-describedby="waError ? 'profile-wa-error' : undefined" />
              <p v-if="waError" id="profile-wa-error" role="alert" class="mt-1 text-xs text-q-red">{{ waError }}</p>
            </div>
            <div>
              <p :class="LABEL">Email</p>
              <p class="text-sm text-q-text-3">{{ authStore.customer?.email || '—' }}</p>
            </div>
            <BaseButton type="submit" block :loading="savingProfile">Simpan perubahan</BaseButton>
          </form>
        </HudPanel>
      </div>

      <div v-show="isDesktop || tab === 'password'" data-panel>
        <HudPanel class="p-4">
          <HudLabel tag="h2" class="mb-4 hidden lg:block">Ganti password</HudLabel>
          <form aria-label="Ganti password" class="space-y-4" novalidate @submit.prevent="handleChangePassword">
            <div>
              <label for="pass-old" :class="LABEL">Password lama</label>
              <PasswordInput id="pass-old" v-model="passForm.old_password" autocomplete="current-password" />
            </div>
            <div>
              <label for="pass-new" :class="LABEL">Password baru</label>
              <PasswordInput id="pass-new" v-model="passForm.new_password" autocomplete="new-password" aria-describedby="pass-hint" />
              <p id="pass-hint" class="mt-1 text-xs text-q-text-3">Minimal 8 karakter.</p>
            </div>
            <div>
              <label for="pass-confirm" :class="LABEL">Konfirmasi password baru</label>
              <PasswordInput id="pass-confirm" v-model="passForm.confirm_password" autocomplete="new-password" />
            </div>
            <p v-if="passError" role="alert" class="hud-cut-sm bg-q-red/10 px-3 py-2 text-sm text-q-red">{{ passError }}</p>
            <BaseButton type="submit" variant="secondary" block :loading="savingPass">Ganti password</BaseButton>
          </form>
        </HudPanel>
      </div>
    </div>

    <div class="mt-5 flex flex-col items-center gap-3 border-t border-border-subtle pt-5 sm:flex-row sm:justify-between lg:justify-end">
      <!-- Desktop: link sosial sudah ada di footer -->
      <div class="flex items-center gap-3 lg:hidden">
        <p class="text-sm text-q-text-3">Ikuti Quantum</p>
        <SocialLinks size="sm" />
      </div>
      <BaseButton variant="danger" @click="handleLogout">
        <LogOut class="size-4" aria-hidden="true" /> Keluar dari akun
      </BaseButton>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Crown, LogOut } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'
import PageHeader from '@/components/ui/PageHeader.vue'
import HudPanel from '@/components/ui/HudPanel.vue'
import HudLabel from '@/components/ui/HudLabel.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import SocialLinks from '@/components/SocialLinks.vue'
import { useMediaQuery } from '@/composables/useMediaQuery'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import PasswordInput from '@/components/ui/PasswordInput.vue'
import { useToast } from '@/composables/useToast'
import { updateCustomerProfile, changeCustomerPassword, customerLogout } from '@/api/authApi'

const router    = useRouter()
const authStore = useAuthStore()
const toast     = useToast()

const savingProfile = ref(false)
const savingPass    = ref(false)
const passError     = ref('')
const nameError     = ref('')
const waError       = ref('')

const LABEL = 'mb-1.5 block text-xs font-semibold text-q-text-2'

const customerInitial = computed(() => authStore.customer?.name?.[0]?.toUpperCase() ?? '')

const TABS      = [{ label: 'Data diri', value: 'data' }, { label: 'Ganti password', value: 'password' }]
const tab       = ref('data')
const isDesktop = useMediaQuery('(min-width: 1024px)')

const form = reactive({
  name:     '',
  whatsapp: '',
})

const passForm = reactive({
  old_password:     '',
  new_password:     '',
  confirm_password: '',
})

const handleSaveProfile = async () => {
  // Sama dengan validasi backend: nama min 2 karakter, WhatsApp wajib
  nameError.value = form.name.trim().length >= 2 ? '' : 'Nama minimal 2 karakter'
  waError.value   = form.whatsapp.trim() ? '' : 'Nomor WhatsApp wajib diisi'
  if (nameError.value || waError.value) return
  savingProfile.value = true
  try {
    const { data } = await updateCustomerProfile(form)
    authStore.setAuth(data.data)
    toast.success('Profil berhasil diperbarui!')
  } catch (e) {
    toast.error(e?.response?.data?.message || 'Gagal menyimpan profil')
  } finally {
    savingProfile.value = false
  }
}

const handleChangePassword = async () => {
  passError.value = ''
  if (passForm.new_password !== passForm.confirm_password) {
    passError.value = 'Konfirmasi password tidak cocok'
    return
  }
  if (passForm.new_password.length < 8) {
    passError.value = 'Password baru minimal 8 karakter'
    return
  }
  savingPass.value = true
  try {
    await changeCustomerPassword(passForm)
    // Backend mengeluarkan semua sesi lain; sesi ini tetap login
    toast.success('Password berhasil diubah. Perangkat lain sudah dikeluarkan.')
    Object.assign(passForm, { old_password: '', new_password: '', confirm_password: '' })
  } catch (e) {
    passError.value = e?.response?.data?.message || 'Gagal mengganti password'
  } finally {
    savingPass.value = false
  }
}

const handleLogout = async () => {
  try { await customerLogout() } catch {}
  authStore.logout()
  toast.success('Berhasil keluar dari akun')
  router.push('/')
}

onMounted(() => {
  form.name     = authStore.customer?.name     || ''
  form.whatsapp = authStore.customer?.whatsapp || ''
})
</script>
