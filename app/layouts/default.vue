<script setup lang="ts">
import { useTabbarConfig } from '@/composables/useTabbarConfig'

const { tabbarItems, activeIndex } = useTabbarConfig()
</script>

<template>
  <div class="relative flex min-h-screen w-full flex-col max-w-[430px] mx-auto shadow-2xl overflow-hidden bg-white">
    <!-- 页面内容 -->
    <slot />
    
    <!-- Tabbar -->
    <Tabbar v-if="tabbarItems.length > 0" :items="tabbarItems" :active-index="activeIndex" />
  </div>
</template>

<style scoped></style>
