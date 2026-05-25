<template>
  <div class="fixed bottom-0 left-0 right-0 bg-q-card/95 backdrop-blur-xl border-t border-q-border z-50 pb-safe">
    <div class="flex items-center justify-around px-2 pt-2 pb-1">
      <RouterLink
        v-for="item in NAV_ITEMS"
        :key="item.path"
        :to="item.path"
        class="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all"
        :class="isActive(item.path) ? 'text-q-primary' : 'text-q-text-3'"
      >
        <div
          v-if="item.special"
          class="w-12 h-12 -mt-5 rounded-full bg-gradient-to-br from-q-primary to-q-primary-d flex items-center justify-center shadow-purple text-xl"
        >
          {{ item.icon }}
        </div>
        <span v-else class="text-xl">{{ item.icon }}</span>
        <span class="text-[10px] font-medium">{{ item.label }}</span>
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const NAV_ITEMS = [
  { label: 'Home',        path: '/',            icon: '🏠' },
  { label: 'My Bookings', path: '/my-bookings', icon: '📅' },
  { label: 'Credits',     path: '/credits',     icon: '🎮', special: true },
  { label: 'Promo',       path: '/promo',       icon: '🏷️' },
  { label: 'Profile',     path: '/profile',     icon: '👤' },
]

const isActive = (path) => path === '/' ? route.path === '/' : route.path.startsWith(path)
</script>
