<!-- Avatar 组件 - 包装 PrimeVue Avatar 以支持自定义样式和暗色模式 -->
<template>
    <Avatar
        v-bind="{
            ...$attrs,
            class: avatarClass,
        }"
    >
        <slot />
    </Avatar>
</template>

<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
import Avatar from 'primevue/avatar'
import { computed } from 'vue'

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
</style>
