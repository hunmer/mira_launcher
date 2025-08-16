<template>
    <div class="not-found-page">
        <Container class="max-w-2xl mx-auto text-center">
            <div class="mb-8">
                <AppIcon
                    name="alert-circle"
                    :size="96"
                    class="mx-auto mb-6 text-gray-400"
                />
                <h1 class="text-6xl font-bold text-gray-900 dark:text-white mb-4">
                    404
                </h1>
                <h2 class="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    页面未找到
                </h2>
                <p class="text-gray-500 dark:text-gray-400 mb-8">
                    抱歉，您访问的页面不存在。可能是URL输入错误，或者页面已被移动或删除。
                </p>
            </div>

            <div class="space-y-4 mb-8">
                <div class="flex justify-center space-x-4">
                    <Button
                        severity="primary"
                        @click="$router.push('/')"
                    >
                        返回首页
                    </Button>
                    <Button
                        variant="outline"
                        @click="$router.back()"
                    >
                        返回上页
                    </Button>
                </div>
            </div>
        </Container>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
    document.title = 'Mira Launcher - 页面未找到'
})
</script>

<style scoped>
.not-found-page {
  min-height: 100vh;
  padding: 2rem 1rem;
  background-color: #f9fafb;
  display: flex;
  align-items: center;
}

.dark .not-found-page {
  background-color: #111827;
}
</style>
