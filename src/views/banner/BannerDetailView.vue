<template>
  <div class="mx-auto max-w-2xl px-4 sm:px-6 py-6 pb-24">
    <div v-if="loading" class="space-y-4" aria-busy="true">
      <BaseSkeleton class="h-56" />
      <BaseSkeleton class="h-6 w-2/3 !rounded-md" />
      <BaseSkeleton class="h-24" />
    </div>

    <template v-else-if="banner">
      <PageHeader :title="banner.title" :subtitle="banner.subtitle || ''" back />

      <div class="mb-5 overflow-hidden rounded-2xl bg-gradient-to-br from-q-card2 via-q-card to-q-bg">
        <img
          v-if="imageUrl && !imageFailed"
          :src="getImgUrl(imageUrl)"
          :alt="banner.title"
          class="w-full object-cover"
          @error="imageFailed = true"
        />
        <div v-else class="flex h-40 items-center justify-center text-q-primary-l">
          <Megaphone class="size-10" aria-hidden="true" />
        </div>
      </div>

      <p v-if="banner.description" class="mb-6 whitespace-pre-line text-sm leading-relaxed text-q-text-2">{{ banner.description }}</p>

      <BaseButton v-if="authStore.isLoggedIn" to="/booking" size="lg" block>Booking sekarang</BaseButton>
      <!-- Guest: pakai modal login global (CustomerLayout), bukan modal kedua di halaman ini -->
      <BaseButton v-else size="lg" block @click="authStore.openAuthModal('/booking')">Booking sekarang</BaseButton>
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
