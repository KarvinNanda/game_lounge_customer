<template>
  <div class="min-h-screen flex flex-col">
    <CustomerNavbar />
    <!-- Ruang untuk BottomNav (64px + padding) + safe area notch iPhone; BottomNav hilang di lg -->
    <main class="flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
      <RouterView v-slot="{ Component, route }">
        <Transition name="page" mode="out-in" @after-leave="notifyPageLeft">
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>
    </main>
    <SiteFooter class="hidden lg:block" />
    <BottomNav class="lg:hidden" />

    <!-- Global auth modal — ditrigger router guard atau navTo() -->
    <LoginPromptModal v-model="authStore.showAuthModal" />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import CustomerNavbar    from '@/components/CustomerNavbar.vue'
import BottomNav         from '@/components/BottomNav.vue'
import SiteFooter        from '@/components/SiteFooter.vue'
import LoginPromptModal  from '@/components/LoginPromptModal.vue'
import { useAuthStore }  from '@/stores/authStore'
import { notifyPageLeft } from '@/router/scroll'

const authStore = useAuthStore()
onMounted(() => { if (authStore.isLoggedIn) authStore.fetchMe() })
</script>
