<template>
  <NMessageProvider>
    <NNotificationProvider>
      <slot />
    </NNotificationProvider>
  </NMessageProvider>
</template>

<script setup lang="ts">
import { NMessageProvider, NNotificationProvider } from 'naive-ui'

// 这个组件提供全局的消息和通知服务
// 应该包装在应用的最外层
</script>
