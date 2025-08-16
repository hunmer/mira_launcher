<template>
    <div class="about-page">
        <Container class="max-w-2xl mx-auto text-center">
            <div class="mb-8">
                <AppIcon
                    :size="96"
                    class="mx-auto mb-6 text-blue-500"
                />
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    Mira Launcher
                </h1>
                <p class="text-xl text-gray-600 dark:text-gray-300 mb-2">
                    版本 1.0.0
                </p>
                <p class="text-gray-500 dark:text-gray-400">
                    基于 Tauri + Vue 3 构建的轻量级桌面应用启动器
                </p>
            </div>

            <Card class="text-left mb-6">
                <h2 class="text-lg font-semibold mb-4">
                    技术栈
                </h2>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <h3 class="font-medium text-gray-900 dark:text-white mb-2">
                            前端技术
                        </h3>
                        <ul class="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                            <li>• Vue 3 (Composition API)</li>
                            <li>• TypeScript</li>
                            <li>• Tailwind CSS</li>
                            <li>• PrimeVue</li>
                            <li>• Pinia</li>
                            <li>• Vue Router</li>
                        </ul>
                    </div>
                    <div>
                        <h3 class="font-medium text-gray-900 dark:text-white mb-2">
                            后端技术
                        </h3>
                        <ul class="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                            <li>• Tauri 1.5</li>
                            <li>• Rust</li>
                            <li>• WebView2</li>
                        </ul>
                    </div>
                </div>
            </Card>

            <Card class="text-left mb-6">
                <h2 class="text-lg font-semibold mb-4">
                    主要特性
                </h2>
                <ul class="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                    <li>• 🚀 轻量级设计，启动快速</li>
                    <li>• 🎨 现代化界面，支持深色模式</li>
                    <li>• 🔌 插件系统，功能可扩展</li>
                    <li>• ⌨️ 全局快捷键支持</li>
                    <li>• 🔧 丰富的自定义选项</li>
                    <li>• 💾 低内存占用</li>
                </ul>
            </Card>

            <Card class="text-left mb-6">
                <h2 class="text-lg font-semibold mb-4">
                    系统信息
                </h2>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-gray-500">操作系统:</span>
                        <span class="font-mono">{{ systemInfo.os }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500">架构:</span>
                        <span class="font-mono">{{ systemInfo.arch }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500">内存使用:</span>
                        <span class="font-mono">{{ systemInfo.memory }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500">Tauri 版本:</span>
                        <span class="font-mono">{{ systemInfo.tauriVersion }}</span>
                    </div>
                </div>
            </Card>

            <div class="flex justify-center space-x-4">
                <Button
                    class="btn-primary"
                    @click="checkUpdate"
                >
                    检查更新
                </Button>
                <Button
                    variant="outline"
                    @click="openGithub"
                >
                    GitHub 仓库
                </Button>
                <Button
                    variant="outline"
                    @click="$router.back()"
                >
                    返回
                </Button>
            </div>

            <Divider class="my-8" />

            <div class="text-center text-sm text-gray-500 dark:text-gray-400">
                <p>© 2024 Mira Launcher. 保留所有权利.</p>
                <p class="mt-1">
                    使用 ❤️ 和 ☕ 制作
                </p>
            </div>
        </Container>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 系统信息
const systemInfo = ref({
    os: 'Windows 11',
    arch: 'x64',
    memory: '45.2 MB',
    tauriVersion: '1.5.0',
})

const checkUpdate = async () => {
    console.log('检查更新...')
    // 这里可以调用 Tauri API 检查更新
    alert('当前已是最新版本！')
}

const openGithub = () => {
    // 这里可以调用 Tauri API 打开外部链接
    window.open('https://github.com/your-username/mira-launcher', '_blank')
}

onMounted(async () => {
    document.title = 'Mira Launcher - 关于'
  
    // 这里可以调用 Tauri API 获取系统信息
    // const info = await invoke('get_system_info')
    // systemInfo.value = info
})
</script>

<style scoped>
.about-page {
  min-height: 100vh;
  padding: 2rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.dark .about-page {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}
</style>
