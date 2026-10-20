<template>
  <div class="mx-auto max-w-6xl px-4 pt-4 pb-40 sm:px-6 lg:pb-10">
    <div v-if="loading" class="space-y-4 lg:grid lg:grid-cols-2 lg:gap-8 lg:space-y-0" aria-busy="true">
      <BaseSkeleton class="aspect-video" />
      <div class="space-y-3">
        <BaseSkeleton class="h-6 w-2/3" />
        <BaseSkeleton class="h-24" />
      </div>
    </div>

    <template v-else-if="banner">
      <PageHeader :title="banner.title" :subtitle="banner.subtitle || ''" back />

      <div class="space-y-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8 lg:space-y-0">
        <HudPanel brackets cut="none">
          <div class="hud-cut overflow-hidden bg-gradient-to-br from-q-card2 via-q-card to-q-bg">
            <img
              v-if="imageUrl && !imageFailed"
              :src="getImgUrl(imageUrl)"
              alt=""
              class="w-full object-cover"
              @error="imageFailed = true"
            />
            <div v-else class="flex aspect-video items-center justify-center text-q-primary-l">
              <Megaphone class="size-10" aria-hidden="true" />
            </div>
          </div>
        </HudPanel>

        <div>
          <HudLabel tone="accent" tag="p" class="mb-2">// PROMO</HudLabel>
          <p v-if="banner.description" class="whitespace-pre-line text-sm leading-relaxed text-q-text-2">{{ banner.description }}</p>

          <!-- HP: CTA menempel di atas BottomNav; desktop: di bawah deskripsi -->
          <div class="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 border-t border-border-subtle bg-q-bg/95 px-4 py-2.5 backdrop-blur-xl lg:static lg:mt-6 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
            <BaseButton v-if="authStore.isLoggedIn" to="/booking" size="lg" block>Booking sekarang</BaseButton>
            <!-- Guest: pakai modal login global (CustomerLayout), bukan modal kedua di halaman ini -->
            <BaseButton v-else size="lg" block @click="authStore.openAuthModal('/booking')">Booking sekarang</BaseButton>
          </div>
        </div>
      </div>
    </template>

    <BaseEmptyState v-else :icon="SearchX" title="Promo tidak ditemukan" text="Promo ini mungkin sudah berakhir.">
      <BaseButton to="/" variant="secondary">Kembali ke Beranda</BaseButton>
    </BaseEmptyState>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Megaphone, SearchX } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/authStore'
import { getBannerById } from '@/api/bannerApi'
import { getImgUrl } from '@/utils/security'
import PageHeader from '@/components/ui/PageHeader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import BaseEmptyState from '@/components/ui/BaseEmptyState.vue'
import HudPanel from '@/components/ui/HudPanel.vue'
import HudLabel from '@/components/ui/HudLabel.vue'

const route     = useRoute()
const authStore = useAuthStore()

const banner      = ref(null)
const loading     = ref(true)
const imageFailed = ref(false)

const imageUrl = computed(() => banner.value?.detail_image_url || banner.value?.image_url || '')

onMounted(async () => {
  try {
    const { data } = await getBannerById(route.params.id)
    banner.value = data.data
  } catch {
    banner.value = null
  } finally {
    loading.value = false
  }
})
</script>
