<script setup lang="ts">
import { onMounted } from 'vue'

definePageMeta({
  layout: 'default'
})

// 從 Logic Layer 取得邏輯與狀態
const { 
  userProfile, 
  recentActivities, 
  isLoading,
  loadUserData, 
  handleLogout 
} = useUser()

onMounted(() => {
  loadUserData()
})
</script>

<template>
  <!-- Header Section -->
    <header class="sky-gradient pt-6 pb-20 px-4 relative overflow-hidden">
      <div class="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
      <div class="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -ml-10 -mb-10"></div>
      <div class="relative z-10 flex items-center justify-between">
        <button class="p-2 text-white hover:bg-white/20 rounded-lg transition-colors">
          <span class="material-symbols-outlined text-3xl">menu</span>
        </button>
        <h1 class="text-white text-xl font-bold tracking-tight">User Data</h1>
        <div class="flex items-center gap-2">
          <ZenLogo size="sm" />
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 -mt-14 px-4 pb-24 relative z-20 overflow-y-auto">
      <!-- Profile Info Card -->
      <div v-if="isLoading" class="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6 flex items-center justify-center min-h-64 mb-6">
        <span class="material-symbols-outlined animate-spin text-4xl text-sky-500">sync</span>
      </div>
      <div v-else-if="userProfile" class="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6 flex flex-col items-center text-center mb-6">
        <div class="relative -mt-20 mb-4 p-2 bg-white dark:bg-slate-800 rounded-full shadow-lg">
          <div class="w-32 h-32 rounded-full bg-sky-100 flex items-center justify-center border-4 border-sky-50">
            <span class="material-symbols-outlined text-sky-300 text-6xl">person</span>
          </div>
        </div>
        <div class="mb-4">
          <h2 class="text-2xl font-bold text-slate-900 dark:text-white">{{ userProfile.name }}</h2>
          <div class="flex items-center justify-center gap-2 mt-2">
            <span class="bg-sky-100 text-sky-600 text-sm font-semibold px-3 py-1 rounded-full border border-sky-200">
              {{ userProfile.role }}
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-1">{{ userProfile.joinDate }}</p>
        </div>
        <div class="w-full flex gap-4 border-t border-slate-100 dark:border-slate-700 pt-4">
          <div class="flex-1 text-center">
            <p class="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Meditation</p>
            <p class="font-bold text-sky-500 text-lg">{{ userProfile.totalMeditation }}</p>
          </div>
          <div class="flex-1 text-center">
            <p class="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Check-ins</p>
            <p class="font-bold text-sky-500 text-lg">{{ userProfile.monthlyCheckIns }}</p>
          </div>
        </div>
      </div>

      <!-- Recent Activities -->
      <div class="space-y-3 mb-8">
        <h3 class="px-2 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Recent Activities</h3>
        <div class="bg-white/80 dark:bg-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
          <div
            v-for="(activity, index) in recentActivities"
            :key="`${activity.type}-${index}`"
            class="flex items-center justify-between p-4 hover:bg-sky-50/40 dark:hover:bg-sky-900/20 transition-colors"
            :class="{ 'border-b border-slate-50 dark:border-slate-700': index < recentActivities.length - 1 }"
          >
            <div class="flex items-center gap-3">
              <div class="size-10 rounded-xl bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center text-sky-500">
                <span class="material-symbols-outlined">{{ activity.icon }}</span>
              </div>
              <div>
                <p class="font-medium text-slate-800 dark:text-white text-sm">{{ activity.title }}</p>
                <p class="text-xs text-slate-400">{{ activity.date }} • {{ activity.duration }}</p>
              </div>
            </div>
            <span class="material-symbols-outlined text-slate-300 dark:text-slate-600">chevron_right</span>
          </div>
        </div>
      </div>

      <!-- Account Settings -->
      <div class="space-y-3 mb-8">
        <h3 class="px-2 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Account Settings</h3>
        <div class="bg-white/80 dark:bg-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
          <a
            href="#"
            class="flex items-center justify-between p-4 hover:bg-sky-50/40 dark:hover:bg-sky-900/20 transition-colors border-b border-slate-50 dark:border-slate-700"
          >
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-slate-400">person_edit</span>
              <span class="font-medium">Edit Profile</span>
            </div>
            <span class="material-symbols-outlined text-slate-300">chevron_right</span>
          </a>
          <a
            href="#"
            class="flex items-center justify-between p-4 hover:bg-sky-50/40 dark:hover:bg-sky-900/20 transition-colors border-b border-slate-50 dark:border-slate-700"
          >
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-slate-400">lock</span>
              <span class="font-medium">Change Password</span>
            </div>
            <span class="material-symbols-outlined text-slate-300">chevron_right</span>
          </a>
          <a
            href="#"
            class="flex items-center justify-between p-4 hover:bg-sky-50/40 dark:hover:bg-sky-900/20 transition-colors border-b border-slate-50 dark:border-slate-700"
          >
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-slate-400">notifications</span>
              <span class="font-medium">Notifications</span>
            </div>
            <span class="material-symbols-outlined text-slate-300">chevron_right</span>
          </a>
          <button
            @click="handleLogout"
            class="w-full flex items-center justify-between p-4 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors bg-transparent border-none cursor-pointer"
          >
            <div class="flex items-center gap-3 text-red-500">
              <span class="material-symbols-outlined">logout</span>
              <span class="font-bold">Logout</span>
            </div>
          </button>
        </div>
      </div>
    </main>

</template>

<style scoped>
:root {
  --primary: #0ea5e9;
  --logo-red: #EF4444;
  --logo-yellow: #FBBF24;
  --logo-green: #22C55E;
}

.sky-gradient {
  background: linear-gradient(180deg, #38bdf8 0%, #0ea5e9 100%);
}
</style>
