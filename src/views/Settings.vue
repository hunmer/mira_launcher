<template>
    <div class="settings-page">
        <Container class="max-w-4xl mx-auto">
            <Tabs v-model:value="activeTab">
                <TabList class="flex border-b border-gray-200 dark:border-gray-700">
                    <Tab
                        v-for="tab in tabs"
                        :key="tab.value"
                        :value="tab.value"
                        class="tab-item"
                    >
                        <div v-ripple class="flex items-center gap-3 text-inherit">
                            <i :class="tab.icon" style="padding-right: 10px" />
                            <span>{{ tab.label }}</span>
                        </div>
                    </Tab>
                </TabList>

                <TabPanels>
                    <!-- 常规设置 -->
                    <TabPanel value="general">
                        <div class="pt-6">
                            <GeneralSettings />
                        </div>
                    </TabPanel>

                    <!-- 快捷键设置 -->
                    <TabPanel value="shortcuts">
                        <div class="pt-6">
                            <ShortcutSettings />
                        </div>
                    </TabPanel>

                    <!-- 启动设置 -->
                    <TabPanel value="startup">
                        <div class="pt-6">
                            <StartupSettings />
                        </div>
                    </TabPanel>

                    <!-- 插件设置 -->
                    <TabPanel value="plugins">
                        <div class="pt-6">
                            <PluginSettings />
                        </div>
                    </TabPanel>

                    <!-- 高级设置 -->
                    <TabPanel value="advanced">
                        <div class="pt-6">
                            <AdvancedSettings />
                        </div>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Container>
    </div>
</template>

<script setup lang="ts">
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@/components/common'
import Container from '@/components/layout/Container.vue'
import {
    AdvancedSettings,
    GeneralSettings,
    PluginSettings,
    ShortcutSettings,
    StartupSettings,
} from '@/components/settings'
import { onMounted, ref } from 'vue'

// Tab 状态
const activeTab = ref('general')

// Tab 配置
const tabs = ref([
    {
        value: 'general',
        label: '常规',
        icon: 'i-mdi-cog',
    },
    {
        value: 'shortcuts',
        label: '快捷键',
        icon: 'i-mdi-keyboard',
    },
    {
        value: 'startup',
        label: '启动设置',
        icon: 'i-mdi-rocket-launch',
    },
    {
        value: 'plugins',
        label: '插件设置',
        icon: 'i-mdi-puzzle',
    },
    {
        value: 'advanced',
        label: '高级',
        icon: 'i-mdi-tune-variant',
    },
])

onMounted(() => {
    document.title = 'Mira Launcher - 设置'
})
</script>

<style scoped>
.settings-page {
  height: 100%;
  background-color: #f9fafb;
  overflow-y: auto;
}

.dark .settings-page {
  background-color: #111827;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}
</style>
