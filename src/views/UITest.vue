<template>
    <Container class="max-w-4xl mx-auto p-6">
        <div class="space-y-6">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                PrimeVue 测试页面
            </h1>

            <!-- 基础组件测试 -->
            <Card title="基础组件测试">
                <div class="space-y-4">
                    <!-- 按钮 -->
                    <div>
                        <h3 class="text-lg font-medium mb-2">
                            按钮组件
                        </h3>
                        <div class="space-x-2">
                            <PrimeButton severity="primary">
                                主要按钮
                            </PrimeButton>
                            <PrimeButton>
                                默认按钮
                            </PrimeButton>
                            <PrimeButton severity="info">
                                信息按钮
                            </PrimeButton>
                            <PrimeButton severity="success">
                                成功按钮
                            </PrimeButton>
                            <PrimeButton severity="warn">
                                警告按钮
                            </PrimeButton>
                            <PrimeButton severity="danger">
                                错误按钮
                            </PrimeButton>
                        </div>
                    </div>

                    <!-- 输入框 -->
                    <div>
                        <h3 class="text-lg font-medium mb-2">
                            输入框组件
                        </h3>
                        <div class="space-y-2">
                            <InputText
                                v-model="inputValue"
                                placeholder="请输入内容"
                            />
                            <InputText
                                v-model="inputValue"
                                placeholder="禁用状态"
                                disabled
                            />
                        </div>
                    </div>

                    <!-- 卡片 -->
                    <div>
                        <h3 class="text-lg font-medium mb-2">
                            卡片组件
                        </h3>
                        <PrimeCard>
                            <template #title>
                                <div class="flex items-center justify-between">
                                    <span>测试卡片</span>
                                    <Tag severity="success">
                                        成功
                                    </Tag>
                                </div>
                            </template>
                            <template #content>
                                这是一个 PrimeVue 卡片组件的内容区域。
                            </template>
                            <template #footer>
                                <PrimeButton size="small">
                                    操作
                                </PrimeButton>
                            </template>
                        </PrimeCard>
                    </div>

                    <!-- 其他组件 -->
                    <div>
                        <h3 class="text-lg font-medium mb-2">
                            其他组件
                        </h3>
                        <div class="space-y-2">
                            <InputSwitch v-model="switchValue" />
                            <Tag severity="info">
                                信息标签
                            </Tag>
                            <Badge :value="5">
                                <PrimeButton>徽章按钮</PrimeButton>
                            </Badge>
                        </div>
                    </div>
                </div>
            </Card>

            <!-- 主题测试 -->
            <Card title="主题测试">
                <div class="space-y-4">
                    <p>当前主题: {{ currentTheme }}</p>
                    <PrimeButton @click="toggleTheme">
                        切换主题
                    </PrimeButton>
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

// PrimeVue 组件
import Badge from 'primevue/badge'
import PrimeButton from 'primevue/button'
import PrimeCard from 'primevue/card'
import InputText from 'primevue/inputtext'
import InputSwitch from 'primevue/inputswitch'
import Tag from 'primevue/tag'

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
