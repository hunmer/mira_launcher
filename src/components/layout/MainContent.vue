<template>
  <main class="main-content">
    <RouterView v-slot="{ Component, route }">
      <Transition
        :name="transitionName"
        mode="out-in"
        appear
      >
        <component
          :is="Component"
          :key="route.fullPath"
        />
      </Transition>
    </RouterView>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

interface Props {
  transition?: string
}

const props = withDefaults(defineProps<Props>(), {
  transition: 'fade',
})

const route = useRoute()

// 动态过渡名称
const transitionName = computed(() => {
  return route.meta?.['transition'] as string || props.transition
})
</script>

<style scoped>
.main-content {
  height: calc(100vh - 3rem);
  overflow-y: auto;
  overflow-x: hidden;
}

/* 路由过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active {
  transition: all 0.3s ease-out;
}

.slide-leave-active {
  transition: all 0.3s ease-in;
}

.slide-enter-from {
  transform: translateX(20px);
  opacity: 0;
}

.slide-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}

.scale-enter-active,
.scale-leave-active {
  transition: all 0.2s ease-in-out;
}

.scale-enter-from,
.scale-leave-to {
  transform: scale(0.95);
  opacity: 0;
}
</style>
