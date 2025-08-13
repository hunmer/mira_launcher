<!-- Dialog 组件 - 包装 PrimeVue Dialog 以支持自定义样式和暗色模式 -->
<template>
  <Dialog
    v-model:visible="dialogVisible"
    v-bind="{
      ...$attrs,
      class: dialogClass
    }"
    @hide="handleHide"
  >
    <template #header>
      <slot name="header" />
    </template>
    <slot />
    <template #footer>
      <slot name="footer" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import { useThemeStore } from '@/stores/theme'

interface Props {
  visible?: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'hide'): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
})

const emit = defineEmits<Emits>()

const themeStore = useThemeStore()

const dialogVisible = ref(props.visible)

// 监听外部值变化
watch(() => props.visible, (newValue) => {
  dialogVisible.value = newValue
})

// 监听内部值变化
watch(dialogVisible, (newValue) => {
  emit('update:visible', newValue)
})

const handleHide = () => {
  emit('hide')
}

// 计算对话框样式类
const dialogClass = computed(() => {
  const classes = ['custom-dialog']
  
  if (themeStore.currentTheme === 'dark') {
    classes.push('dark-theme')
  }
  
  return classes.join(' ')
})
</script>

<style scoped>
.custom-dialog.dark-theme :deep(.p-dialog) {
  background-color: rgb(31, 41, 55);
  border-color: rgb(75, 85, 99);
}

.custom-dialog.dark-theme :deep(.p-dialog-header) {
  background-color: rgb(55, 65, 81);
  color: rgb(229, 231, 235);
  border-bottom-color: rgb(75, 85, 99);
}

.custom-dialog.dark-theme :deep(.p-dialog-content) {
  background-color: rgb(31, 41, 55);
  color: rgb(229, 231, 235);
}

.custom-dialog.dark-theme :deep(.p-dialog-footer) {
  background-color: rgb(55, 65, 81);
  border-top-color: rgb(75, 85, 99);
}

.custom-dialog.dark-theme :deep(.p-dialog-header-close) {
  color: rgb(156, 163, 175);
}

.custom-dialog.dark-theme :deep(.p-dialog-header-close:hover) {
  background-color: rgb(75, 85, 99);
  color: rgb(255, 255, 255);
}

.custom-dialog.dark-theme :deep(.p-dialog-mask) {
  background-color: rgba(0, 0, 0, 0.7);
}
</style>
