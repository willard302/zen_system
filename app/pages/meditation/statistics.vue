<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

definePageMeta({
  layout: 'default'
})

const router = useRouter()

// 时间段选择
const selectedPeriod = ref<'Day' | 'Week' | 'Month' | 'Year'>('Week')

// 模拟数据 - 每个时间段的禅修数据
const meditationData = {
  Day: {
    totalTime: 1.5,
    trend: 8,
    chartData: [
      { label: '00:00', value: 0 },
      { label: '04:00', value: 0 },
      { label: '08:00', value: 20 },
      { label: '12:00', value: 45 },
      { label: '16:00', value: 60 },
      { label: '20:00', value: 30 },
      { label: '23:59', value: 0 }
    ]
  },
  Week: {
    totalTime: 12.5,
    trend: 15,
    chartData: [
      { label: 'Mon', value: 60 },
      { label: 'Tue', value: 85 },
      { label: 'Wed', value: 40 },
      { label: 'Thu', value: 95 },
      { label: 'Fri', value: 70 },
      { label: 'Sat', value: 55 },
      { label: 'Sun', value: 30 }
    ]
  },
  Month: {
    totalTime: 45.3,
    trend: 22,
    chartData: [
      { label: 'Week 1', value: 40 },
      { label: 'Week 2', value: 65 },
      { label: 'Week 3', value: 80 },
      { label: 'Week 4', value: 70 }
    ]
  },
  Year: {
    totalTime: 156.8,
    trend: 35,
    chartData: [
      { label: 'Jan', value: 30 },
      { label: 'Feb', value: 45 },
      { label: 'Mar', value: 60 },
      { label: 'Apr', value: 75 },
      { label: 'May', value: 85 },
      { label: 'Jun', value: 70 },
      { label: 'Jul', value: 80 },
      { label: 'Aug', value: 65 },
      { label: 'Sep', value: 55 },
      { label: 'Oct', value: 90 },
      { label: 'Nov', value: 75 },
      { label: 'Dec', value: 60 }
    ]
  }
}

// 最近的冥想会话
const recentSessions = ref([
  {
    id: 1,
    title: 'Morning Mindful Flow',
    icon: 'self_improvement',
    date: 'Oct 24, 08:30',
    duration: '45m',
    quote: '"Felt very calm and centered today..."'
  },
  {
    id: 2,
    title: 'Evening Zen Reflection',
    icon: 'nightlight',
    date: 'Oct 23, 21:00',
    duration: '30m',
    quote: '"Released the stress from exams."'
  },
  {
    id: 3,
    title: 'Lunchtime Breathing',
    icon: 'wb_sunny',
    date: 'Oct 23, 12:15',
    duration: '15m',
    quote: '"Quick reset during classes."'
  }
])

// 当前数据
const currentData = computed(() => {
  return meditationData[selectedPeriod.value]
})

// 计算柱状图高度
const chartDataWithHeight = computed(() => {
  const maxValue = Math.max(...currentData.value.chartData.map(d => d.value))
  return currentData.value.chartData.map(item => ({
    ...item,
    height: (item.value / maxValue) * 100
  }))
})

// 返回
const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="relative flex h-full min-h-screen w-full flex-col sky-gradient overflow-x-hidden pb-24">
    <!-- Header -->
    <header class="flex items-center glass-effect sticky top-0 z-10 p-4 justify-between border-b border-white/20">
      <div class="flex items-center gap-3">
        <button 
          @click="goBack"
          class="flex items-center justify-center p-2 rounded-full hover:bg-slate-400/20 transition-colors"
        >
          <span class="material-symbols-outlined text-slate-900">arrow_back</span>
        </button>
        <div class="flex size-10 shrink-0 items-center overflow-hidden rounded-full bg-primary/20">
          <div 
            class="bg-center bg-no-repeat aspect-square bg-cover size-full" 
            style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuAUFuMw_aw2w5JQo2Aqbue5y-n9gNT3-9U6TkKHofpZj4xLa03BqA8d746-WdSyRWYSNCpY-TDTVLyC_wMqTdm0IpNC3jDVkJUiHTnHgHL7Uianf9jCLMjJrdF1ocSkmCHgmeB_mBjVQrsYktldoUlCUaBzEvzW9zHzAVV0ERNQ7CAKfj0y4cueWHT2P_SLUhjqjTB3sulVrNoUdWSw3lYMGPSid6nu9xSTF-4nUesLZI7Penyp3s0Jdh_B8TeqbUS28TeU9agSRSY");'
          />
        </div>
        <div class="flex-1">
          <h1 class="text-slate-900 text-lg font-bold leading-tight tracking-tight">TKU Zen Club</h1>
          <p class="text-xs text-primary font-medium">Statistics Overview</p>
        </div>
      </div>
      <button class="flex size-10 items-center justify-center rounded-full bg-white/40 text-slate-900 hover:bg-white/60 transition-colors">
        <span class="material-symbols-outlined">notifications</span>
      </button>
    </header>

    <!-- Main Content -->
    <main class="flex flex-col gap-6 p-4">
      <!-- Period Selector -->
      <div class="flex h-12 items-center justify-center rounded-xl glass-effect p-1">
        <label 
          v-for="period in ['Day', 'Week', 'Month', 'Year']"
          :key="period"
          class="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 text-slate-600 text-sm font-semibold transition-all"
          :class="{
            'bg-primary text-white': selectedPeriod === period
          }"
        >
          <span>{{ period }}</span>
          <input 
            v-model="selectedPeriod" 
            type="radio" 
            :value="period" 
            class="hidden"
          />
        </label>
      </div>

      <!-- Total Meditation Time Card -->
      <section class="glass-effect rounded-xl p-5 shadow-sm">
        <div class="flex justify-between items-end mb-6">
          <div>
            <p class="text-slate-500 text-sm font-medium">Total Meditation Time</p>
            <h2 class="text-slate-900 text-3xl font-extrabold tracking-tight">
              {{ currentData.totalTime.toFixed(1) }} 
              <span class="text-lg font-medium text-slate-500">
                {{ selectedPeriod === 'Day' ? 'hrs' : selectedPeriod === 'Week' ? 'hrs' : 'hrs' }}
              </span>
            </h2>
          </div>
          <div class="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
            <span class="material-symbols-outlined text-sm">trending_up</span>
            <span>{{ currentData.trend }}%</span>
          </div>
        </div>

        <!-- Bar Chart -->
        <div class="flex items-end justify-between h-40 gap-2 px-1">
          <div 
            v-for="(item, index) in chartDataWithHeight"
            :key="index"
            class="flex flex-col items-center flex-1 gap-2 h-full justify-end"
          >
            <div 
              v-if="item.height > 0"
              class="w-full bg-primary rounded-t-lg transition-all duration-300"
              :style="{ 
                height: `${item.height}%`,
                opacity: index % 2 === 0 ? 0.4 : 0.6
              }"
            />
            <span class="text-[10px] font-bold text-slate-500">{{ item.label }}</span>
          </div>
        </div>
      </section>

      <!-- Recent Sessions -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-slate-900 text-lg font-bold">Recent Sessions</h3>
          <NuxtLink to="/meditation/sessions" class="text-primary text-sm font-semibold hover:underline">
            View All
          </NuxtLink>
        </div>
        <div class="flex flex-col gap-3">
          <div 
            v-for="session in recentSessions"
            :key="session.id"
            class="glass-effect p-4 rounded-xl flex items-center gap-4"
          >
            <div class="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
              <span class="material-symbols-outlined">{{ session.icon }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-start gap-2">
                <h4 class="text-slate-900 font-bold text-sm">{{ session.title }}</h4>
                <span class="text-[11px] text-slate-500 font-medium whitespace-nowrap">{{ session.date }}</span>
              </div>
              <p class="text-slate-500 text-xs mt-1 italic">{{ session.quote }}</p>
            </div>
            <div class="text-right flex-shrink-0">
              <p class="text-slate-900 font-bold text-sm">{{ session.duration }}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.glass-effect {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.sky-gradient {
  background: linear-gradient(180deg, #87CEEB 0%, #E0F2F7 100%);
}

.material-symbols-outlined {
  font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24;
}
</style>
