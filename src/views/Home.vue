<template>
    <div class="home-page">
        <Container class="max-w-4xl mx-auto">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card
                    title="应用管理"
                    description="快速启动和管理您的应用程序"
                    class="cursor-pointer hover:shadow-lg transition-shadow"
                    @click="$router.push('/applications')"
                >
                    <template #icon>
                        <AppIcon name="grid-3x3" class="text-blue-500" />
                    </template>
                </Card>

                <Card
                    title="插件系统"
                    description="扩展功能，自定义您的启动器"
                    class="cursor-pointer hover:shadow-lg transition-shadow"
                    @click="$router.push('/plugins')"
                >
                    <template #icon>
                        <AppIcon name="puzzle" class="text-green-500" />
                    </template>
                </Card>

                <Card
                    title="系统设置"
                    description="个性化配置和偏好设置"
                    class="cursor-pointer hover:shadow-lg transition-shadow"
                    @click="$router.push('/settings')"
                >
                    <template #icon>
                        <AppIcon name="settings" class="text-orange-500" />
                    </template>
                </Card>
            </div>

            <Divider class="my-8" />

            <div class="text-center">
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    Mira Launcher v1.0.0 - 基于 Tauri + Vue 3 构建
                </p>
            </div>
        </Container>
    </div>
</template>

<script setup lang="ts">
import Card from '@/components/common/Card.vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import Container from '@/components/layout/Container.vue'
import Divider from '@/components/layout/Divider.vue'
import { onMounted } from 'vue'

// 页面标题
onMounted(() => {
    document.title = 'Mira Launcher - 主页'
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  padding: 2rem 1rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.dark .home-page {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d3748 100%);
}
</style>
