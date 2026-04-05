<script setup lang="ts">
import { useTabbarConfig } from '@/composables/useTabbarConfig'
import { useToast } from '@/composables/useToast'

const { tabbarItems, activeIndex } = useTabbarConfig()
const { toasts, removeToast } = useToast()
</script>

<template>
  <div class="relative flex min-h-screen w-full flex-col max-w-[430px] mx-auto shadow-2xl overflow-hidden bg-white">
    <!-- 页面内容 -->
    <slot />

    <!-- Toast 通知 -->
    <div class="fixed top-0 right-0 z-50 p-4 space-y-2">
      <Toast
        v-for="toast in toasts"
        :key="toast.id"
        :message="toast.message"
        :type="toast.type"
        :duration="toast.duration"
        @close="removeToast(toast.id)"
      />
    </div>

    <!-- Tabbar -->
    <Tabbar v-if="tabbarItems.length > 0" :items="tabbarItems" :active-index="activeIndex" />
  </div>
</template>

<style scoped></style>
