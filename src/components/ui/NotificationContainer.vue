<template>
  <Toast />
  <ConfirmDialog />
  <slot />
</template>

<script setup lang="ts">
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'

// 这个组件提供全局的消息和通知服务
// Toast 用于消息通知，ConfirmDialog 用于确认对话框
// 应该包装在应用的最外层
</script>
