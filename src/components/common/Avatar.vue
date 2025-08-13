<!-- Avatar 组件 - 包装 PrimeVue Avatar 以支持自定义样式和暗色模式 -->
<template>
  <Avatar
    v-bind="{
      ...$attrs,
      class: avatarClass
    }"
  >
    <slot />
  </Avatar>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Avatar from 'primevue/avatar'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

// 计算头像样式类
const avatarClass = computed(() => {
  const classes = ['custom-avatar']
  
  if (themeStore.currentTheme === 'dark') {
    classes.push('dark-theme')
  }
  
  return classes.join(' ')
})
</script>

<style scoped>
.custom-avatar {
  transition: all 0.2s ease;
}

.custom-avatar.dark-theme :deep(.p-avatar) {
  background-color: rgb(55, 65, 81);
  color: rgb(229, 231, 235);
  border-color: rgb(75, 85, 99);
}

.custom-avatar.dark-theme :deep(.p-avatar.p-avatar-circle) {
  background-color: rgb(55, 65, 81);
}
</style>
