<template>
  <div class="max-w-lg mx-auto px-4 py-8">

    <h1 class="text-2xl font-bold text-white mb-6">Profil Saya</h1>

    <!-- Avatar + info -->
    <div class="bg-q-card border border-q-border rounded-2xl p-6 mb-4">
      <div class="flex items-center gap-4 mb-6">
        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-q-primary to-q-primary-d flex items-center justify-center text-white font-black text-2xl shadow-purple">
          {{ customerInitial }}
        </div>
        <div>
          <div class="text-white font-bold text-lg">{{ authStore.customer?.name }}</div>
          <span
            class="text-xs px-2 py-0.5 rounded-full font-semibold"
            :class="authStore.isMember ? 'bg-q-primary/20 text-q-primary-l' : 'bg-q-card2 text-q-text-2'"
          >
            {{ authStore.isMember ? '⭐ Member' : 'Regular' }}
          </span>
        </div>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-q-text-2 mb-1.5">Nama</label>
          <input
            v-model="form.name"
            type="text"
            class="w-full bg-q-card2 border border-q-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-q-primary transition-colors"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-q-text-2 mb-1.5">Nomor WhatsApp</label>
          <input
            v-model="form.whatsapp"
            type="tel"
            class="w-full bg-q-card2 border border-q-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-q-primary transition-colors"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-q-text-2 mb-1.5">
            Email
            <span class="text-q-text-3 font-normal ml-1">(tidak bisa diubah)</span>
          </label>
          <input
            :value="authStore.customer?.email"
            type="email"
            disabled
            class="w-full bg-q-card2/50 border border-q-border/50 rounded-xl px-4 py-3 text-q-text-3 text-sm cursor-not-allowed"
          />
        </div>

        <button
          @click="handleSaveProfile"
          :disabled="savingProfile"
          class="w-full py-3 bg-q-primary hover:bg-q-primary-d text-white font-bold rounded-xl transition-colors disabled:opacity-50 shadow-purple-sm"
        >
          {{ savingProfile ? 'Menyimpan...' : 'Simpan Perubahan' }}
        </button>
      </div>
    </div>

    <!-- Ganti Password -->
    <div class="bg-q-card border border-q-border rounded-2xl p-6 mb-4">
      <h2 class="text-base font-bold text-white mb-4">Ganti Password</h2>

      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-q-text-2 mb-1.5">Password Lama</label>
          <div class="relative">
            <input
              v-model="passForm.old_password"
              :type="showOld ? 'text' : 'password'"
              placeholder="Masukkan password lama"
              class="w-full bg-q-card2 border border-q-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-q-primary transition-colors pr-11"
            />
            <button type="button" @click="showOld = !showOld"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-q-text-3 hover:text-q-text-2 transition-colors text-sm">
              {{ showOld ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-q-text-2 mb-1.5">Password Baru</label>
          <div class="relative">
            <input
              v-model="passForm.new_password"
              :type="showNew ? 'text' : 'password'"
              placeholder="Minimal 8 karakter"
              class="w-full bg-q-card2 border border-q-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-q-primary transition-colors pr-11"
            />
            <button type="button" @click="showNew = !showNew"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-q-text-3 hover:text-q-text-2 transition-colors text-sm">
              {{ showNew ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-q-text-2 mb-1.5">Konfirmasi Password Baru</label>
          <input
            v-model="passForm.confirm_password"
            :type="showNew ? 'text' : 'password'"
            placeholder="Ulangi password baru"
            class="w-full bg-q-card2 border border-q-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-q-primary transition-colors"
          />
        </div>

        <p v-if="passError" class="text-q-red text-sm bg-red-500/10 rounded-xl px-3 py-2">{{ passError }}</p>

        <button
          @click="handleChangePassword"
          :disabled="savingPass"
          class="w-full py-3 bg-q-card2 border border-q-border text-white font-semibold rounded-xl hover:border-q-primary transition-colors disabled:opacity-50 text-sm"
        >
          {{ savingPass ? 'Memproses...' : 'Ganti Password' }}
        </button>
      </div>
    </div>

    <!-- Logout -->
    <div class="bg-q-card border border-q-border rounded-2xl p-4">
      <button
        @click="handleLogout"
        class="w-full py-3 text-q-red font-semibold text-sm hover:text-red-300 transition-colors flex items-center justify-center gap-2"
      >
        <span>🚪</span> Keluar dari Akun
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/composables/useToast'
import { updateCustomerProfile, changeCustomerPassword, customerLogout } from '@/api/authApi'

const router    = useRouter()
const authStore = useAuthStore()
const toast     = useToast()

const savingProfile = ref(false)
const savingPass    = ref(false)
const showOld       = ref(false)
const showNew       = ref(false)
const passError     = ref('')

const customerInitial = computed(() => authStore.customer?.name?.[0]?.toUpperCase() ?? '')

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
  if (!form.name.trim()) return
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
    toast.success('Password berhasil diubah!')
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
