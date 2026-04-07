<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUser } from '@/composables/useUser'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const { changePassword, isChangingPassword, error: userError } = useUser()
const { success: showSuccessToast, error: showErrorToast } = useToast()

definePageMeta({
  layout: 'default',
  hideTabbar: true
})

// 表單狀態
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const localError = ref<string | null>(null)

// 表單驗證
const isCurrentPasswordValid = computed(() => {
  return currentPassword.value.length > 0
})

const isNewPasswordValid = computed(() => {
  return newPassword.value.length >= 6
})

const isConfirmPasswordValid = computed(() => {
  return confirmPassword.value.length >= 6 && confirmPassword.value === newPassword.value
})

const isFormValid = computed(() => {
  return isCurrentPasswordValid.value && isNewPasswordValid.value && isConfirmPasswordValid.value
})

const passwordsMatch = computed(() => {
  if (confirmPassword.value.length === 0) return true // 未填時不顯示錯誤
  return newPassword.value === confirmPassword.value
})

// 密碼強度指示
const passwordStrength = computed<{ level: number; text: string; color: string }>(() => {
  const pwd = newPassword.value
  if (!pwd) return { level: 0, text: '', color: '' }
  
  let strength = 0
  if (pwd.length >= 6) strength++
  if (pwd.length >= 10) strength++
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++
  if (/\d/.test(pwd)) strength++
  if (/[!@#$%^&*]/.test(pwd)) strength++
  
  const levels = [
    { level: 0, text: '', color: '' },
    { level: 1, text: '弱', color: 'text-red-400' },
    { level: 2, text: '中', color: 'text-yellow-400' },
    { level: 3, text: '強', color: 'text-green-400' },
    { level: 4, text: '非常強', color: 'text-green-500' },
    { level: 5, text: '極強', color: 'text-green-600' }
  ]
  
  return levels[Math.min(strength, 5)]!
})

// 處理返回
const goBack = () => {
  router.back()
}

// 清除所有錯誤
const clearErrors = () => {
  localError.value = null
}

// 提交表單
const handleSubmit = async () => {
  localError.value = null
  
  // 客戶端驗證
  if (!isFormValid.value) {
    localError.value = '請填寫所有必填欄位'
    return
  }

  if (!passwordsMatch.value) {
    localError.value = '新密碼和確認密碼不相符'
    return
  }

  if (newPassword.value.length < 6) {
    localError.value = '新密碼至少需要6個字符'
    return
  }

  try {
    await changePassword(currentPassword.value, newPassword.value, confirmPassword.value)
    
    // 清除表單
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    
    showSuccessToast('密碼已成功修改')
    
    // 2秒後返回上一頁
    setTimeout(() => {
      router.back()
    }, 1500)
  } catch (err: any) {
    localError.value = err.message || '修改密碼失敗'
    showErrorToast(localError.value as string)
  }
}

// 監聽輸入框變化時清除錯誤
const handleInput = () => {
  if (localError.value) {
    localError.value = null
  }
}
</script>

<template>
  <div class="relative flex min-h-screen w-full flex-col bg-gradient-to-br from-blue-400 via-sky-300 to-cyan-200 overflow-x-hidden pb-16">
    <!-- 背景圖片效果 -->
    <div class="fixed inset-0 opacity-20 pointer-events-none">
      <div class="absolute top-0 left-0 w-96 h-96 bg-white rounded-full filter blur-3xl opacity-30"></div>
      <div class="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full filter blur-3xl opacity-20"></div>
    </div>

    <!-- Header -->
    <header class="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 py-6 backdrop-blur-md bg-white/5">
      <button 
        @click="goBack"
        class="w-12 h-12 flex items-center justify-center bg-white/20 rounded-full hover:bg-white/30 shadow-lg transition-all duration-300 backdrop-blur-md"
      >
        <span class="material-symbols-outlined text-white text-2xl" data-icon="arrow_back">arrow_back</span>
      </button>
      <h1 class="text-white text-2xl font-extrabold tracking-widest font-headline drop-shadow-md">
        變更密碼
      </h1>
      <div class="w-12"></div>
    </header>

    <!-- Main Content -->
    <main class="relative z-10 w-full max-w-md mx-auto flex flex-col items-center pt-24 px-6">
      <!-- Error Message -->
      <div 
        v-if="localError"
        class="w-full mb-6 p-4 rounded-lg bg-red-500/30 backdrop-blur-md border border-red-500/50 shadow-lg"
      >
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-red-200 text-xl">error</span>
          <p class="text-red-100 text-sm font-body">{{ localError }}</p>
        </div>
      </div>

      <!-- Form Section -->
      <div class="w-full space-y-6">
        <!-- Current Password Field -->
        <div class="flex flex-col gap-2">
          <label class="text-[12px] text-white/90 font-label tracking-widest uppercase ml-4">
            當前密碼
          </label>
          <div class="relative flex items-center">
            <span class="material-symbols-outlined absolute left-4 text-white/70">lock</span>
            <input 
              v-model="currentPassword"
              @input="handleInput"
              :type="showCurrentPassword ? 'text' : 'password'"
              class="w-full h-14 bg-white/10 border-none px-12 text-white placeholder:text-white/40 focus:ring-2 focus:ring-white/30 glass-panel transition-all outline-none"
              style="border-radius: 9999px;"
              placeholder="輸入當前密碼"
            />
            <button
              type="button"
              @click="showCurrentPassword = !showCurrentPassword"
              class="absolute right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <span 
                class="material-symbols-outlined text-white/70 text-xl"
                :data-icon="showCurrentPassword ? 'visibility' : 'visibility_off'"
              >
                {{ showCurrentPassword ? 'visibility' : 'visibility_off' }}
              </span>
            </button>
          </div>
        </div>

        <!-- New Password Field -->
        <div class="flex flex-col gap-2">
          <label class="text-[12px] text-white/90 font-label tracking-widest uppercase ml-4">
            新密碼
          </label>
          <div class="relative flex items-center">
            <span class="material-symbols-outlined absolute left-4 text-white/70">lock</span>
            <input 
              v-model="newPassword"
              @input="handleInput"
              :type="showNewPassword ? 'text' : 'password'"
              class="w-full h-14 bg-white/10 border-none px-12 text-white placeholder:text-white/40 focus:ring-2 focus:ring-white/30 glass-panel transition-all outline-none"
              style="border-radius: 9999px;"
              placeholder="輸入新密碼"
            />
            <button
              type="button"
              @click="showNewPassword = !showNewPassword"
              class="absolute right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <span 
                class="material-symbols-outlined text-white/70 text-xl"
                :data-icon="showNewPassword ? 'visibility' : 'visibility_off'"
              >
                {{ showNewPassword ? 'visibility' : 'visibility_off' }}
              </span>
            </button>
          </div>
          
          <!-- Password Strength Indicator -->
          <div v-if="newPassword" class="ml-4 flex items-center gap-2">
            <div class="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                class="h-full transition-all duration-300 rounded-full"
                :class="{
                  'w-1/5 bg-red-400': passwordStrength.level === 1,
                  'w-2/5 bg-yellow-400': passwordStrength.level === 2,
                  'w-3/5 bg-green-400': passwordStrength.level === 3,
                  'w-4/5 bg-green-500': passwordStrength.level === 4,
                  'w-full bg-green-600': passwordStrength.level === 5
                }"
              ></div>
            </div>
            <span class="text-[12px] text-white/80 min-w-12" :class="passwordStrength.color">
              {{ passwordStrength.text }}
            </span>
          </div>
        </div>

        <!-- Confirm Password Field -->
        <div class="flex flex-col gap-2">
          <label class="text-[12px] text-white/90 font-label tracking-widest uppercase ml-4">
            確認新密碼
          </label>
          <div 
            class="relative flex items-center"
            :class="{
              'ring-2 ring-red-400/50 rounded-full': !passwordsMatch && confirmPassword.length > 0
            }"
          >
            <span class="material-symbols-outlined absolute left-4 text-white/70">lock_reset</span>
            <input 
              v-model="confirmPassword"
              @input="handleInput"
              :type="showConfirmPassword ? 'text' : 'password'"
              class="w-full h-14 bg-white/10 border-none px-12 text-white placeholder:text-white/40 focus:ring-2 focus:ring-white/30 glass-panel transition-all outline-none"
              style="border-radius: 9999px;"
              placeholder="確認新密碼"
            />
            <button
              type="button"
              @click="showConfirmPassword = !showConfirmPassword"
              class="absolute right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <span 
                class="material-symbols-outlined text-white/70 text-xl"
                :data-icon="showConfirmPassword ? 'visibility' : 'visibility_off'"
              >
                {{ showConfirmPassword ? 'visibility' : 'visibility_off' }}
              </span>
            </button>
          </div>
          
          <!-- Password Match Indicator -->
          <div v-if="confirmPassword" class="ml-4 flex items-center gap-2">
            <span 
              v-if="!passwordsMatch"
              class="material-symbols-outlined text-red-300 text-sm"
            >
              close
            </span>
            <span 
              v-else
              class="material-symbols-outlined text-green-300 text-sm"
            >
              check_circle
            </span>
            <span 
              class="text-[12px]"
              :class="passwordsMatch ? 'text-green-200' : 'text-red-300'"
            >
              {{ passwordsMatch ? '密碼相符' : '密碼不相符' }}
            </span>
          </div>
        </div>

        <!-- Submit Button -->
        <button
          @click="handleSubmit"
          :disabled="!isFormValid || isChangingPassword || !passwordsMatch"
          class="w-full h-16 bg-primary text-white font-bold text-[18px] tracking-wide shadow-[0_0_20px_rgba(43,157,238,0.4)] hover:shadow-[0_0_30px_rgba(43,157,238,0.6)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:shadow-none"
          style="border-radius: 9999px;"
        >
          <span 
            v-if="isChangingPassword"
            class="material-symbols-outlined animate-spin"
            data-icon="sync"
          >
            sync
          </span>
          {{ isChangingPassword ? '修改中...' : '確認修改' }}
        </button>

        <!-- Password Requirements -->
        <div class="mt-8 p-4 bg-white/10 backdrop-blur-md rounded-lg"]>
          <p class="text-[12px] text-white/70 font-label tracking-widest uppercase mb-3">密碼要求</p>
          <ul class="space-y-2">
            <li class="flex items-center gap-2">
              <span 
                class="material-symbols-outlined text-sm"
                :class="newPassword.length >= 6 ? 'text-green-300' : 'text-white/40'"
              >
                {{ newPassword.length >= 6 ? 'check_circle' : 'radio_button_unchecked' }}
              </span>
              <span class="text-[12px] text-white/70">至少6個字符</span>
            </li>
            <li class="flex items-center gap-2">
              <span 
                class="material-symbols-outlined text-sm"
                :class="/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) ? 'text-green-300' : 'text-white/40'"
              >
                {{ /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) ? 'check_circle' : 'radio_button_unchecked' }}
              </span>
              <span class="text-[12px] text-white/70">包含大小寫字母</span>
            </li>
            <li class="flex items-center gap-2">
              <span 
                class="material-symbols-outlined text-sm"
                :class="/\d/.test(newPassword) ? 'text-green-300' : 'text-white/40'"
              >
                {{ /\d/.test(newPassword) ? 'check_circle' : 'radio_button_unchecked' }}
              </span>
              <span class="text-[12px] text-white/70">包含數字</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Footer Text -->
      <p class="mt-12 text-white/60 text-sm font-label tracking-widest uppercase">
        TKU Zen Club • 淡江大學禪學社
      </p>
    </main>
  </div>
</template>

<style scoped>
.glass-well {
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.glass-panel {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.material-symbols-outlined {
  font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
