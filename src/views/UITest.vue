<template>
    <Container class="max-w-4xl mx-auto p-6">
        <div class="space-y-6">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Naive UI 测试页面
            </h1>

            <!-- 基础组件测试 -->
            <Card title="基础组件测试">
                <div class="space-y-4">
                    <!-- 按钮 -->
                    <div>
                        <h3 class="text-lg font-medium mb-2">按钮组件</h3>
                        <div class="space-x-2">
                            <n-button type="primary">主要按钮</n-button>
                            <n-button type="default">默认按钮</n-button>
                            <n-button type="info">信息按钮</n-button>
                            <n-button type="success">成功按钮</n-button>
                            <n-button type="warning">警告按钮</n-button>
                            <n-button type="error">错误按钮</n-button>
                        </div>
                    </div>

                    <!-- 输入框 -->
                    <div>
                        <h3 class="text-lg font-medium mb-2">输入框组件</h3>
                        <div class="space-y-2">
                            <n-input v-model:value="inputValue" placeholder="请输入内容" />
                            <n-input v-model:value="inputValue" placeholder="禁用状态" disabled />
                        </div>
                    </div>

                    <!-- 卡片 -->
                    <div>
                        <h3 class="text-lg font-medium mb-2">卡片组件</h3>
                        <n-card title="测试卡片" hoverable>
                            这是一个 Naive UI 卡片组件的内容区域。
                            <template #header-extra>
                                <n-tag type="success">成功</n-tag>
                            </template>
                            <template #action>
                                <n-button size="small">操作</n-button>
                            </template>
                        </n-card>
                    </div>

                    <!-- 其他组件 -->
                    <div>
                        <h3 class="text-lg font-medium mb-2">其他组件</h3>
                        <div class="space-y-2">
                            <n-switch v-model:value="switchValue" />
                            <n-tag type="info">信息标签</n-tag>
                            <n-badge :value="5">
                                <n-button>徽章按钮</n-button>
                            </n-badge>
                        </div>
                    </div>
                </div>
            </Card>

            <!-- 主题测试 -->
            <Card title="主题测试">
                <div class="space-y-4">
                    <p>当前主题: {{ currentTheme }}</p>
                    <n-button @click="toggleTheme">切换主题</n-button>
                </div>
            </Card>
        </div>
    </Container>
</template>

<script setup lang="ts">
import Card from '@/components/common/Card.vue'
import Container from '@/components/layout/Container.vue'
import { useThemeStore } from '@/stores/theme'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'

// Naive UI 组件
import {
    NBadge,
    NButton,
    NCard,
    NInput,
    NSwitch,
    NTag
} from 'naive-ui'

// Store
const themeStore = useThemeStore()
const { currentTheme } = storeToRefs(themeStore)

// 响应式数据
const inputValue = ref('')
const switchValue = ref(false)

// 方法
const toggleTheme = () => {
    themeStore.toggleTheme()
}
</script>
