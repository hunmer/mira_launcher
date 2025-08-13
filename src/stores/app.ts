import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 应用加载状态
  const isLoading = ref(false)
  
  // 应用信息
  const appName = ref('Mira Launcher')
  const appVersion = ref('1.0.0')
  
  // 设置加载状态
  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }
  
  return {
    isLoading,
    appName,
    appVersion,
    setLoading,
  }
})
