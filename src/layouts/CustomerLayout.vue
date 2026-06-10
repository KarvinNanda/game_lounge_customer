<template>
  <div class="min-h-screen bg-q-bg flex flex-col">
    <CustomerNavbar />
    <main class="flex-1 pb-20 md:pb-0">
      <RouterView />
    </main>
    <BottomNav class="md:hidden" />

    <!-- Global auth modal — ditrigger router guard atau navTo() -->
    <LoginPromptModal v-model="authStore.showAuthModal" />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import CustomerNavbar    from '@/components/CustomerNavbar.vue'
import BottomNav         from '@/components/BottomNav.vue'
import LoginPromptModal  from '@/components/LoginPromptModal.vue'
import { useAuthStore }  from '@/stores/authStore'

const authStore = useAuthStore()
onMounted(() => { if (authStore.isLoggedIn) authStore.fetchMe() })
</script>
