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
            <div 
              v-ripple 
              class="flex items-center gap-2 text-inherit"
            >
              <i :class="tab.icon" />
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
import Container from '@/components/layout/Container.vue'
import { GeneralSettings, ShortcutSettings, StartupSettings, AdvancedSettings, PluginSettings } from '@/components/settings'
import { onMounted, ref } from 'vue'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'

// Tab 状态
const activeTab = ref('general')

// Tab 配置
const tabs = ref([
  {
    value: 'general',
    label: '常规',
    icon: 'pi pi-cog',
  },
  {
    value: 'shortcuts', 
    label: '快捷键',
    icon: 'pi pi-keyboard',
  },
  {
    value: 'startup',
    label: '启动设置',
    icon: 'pi pi-power-off',
  },
  {
    value: 'plugins',
    label: '插件设置',
    icon: 'pi pi-puzzle-piece',
  },
  {
    value: 'advanced',
    label: '高级',
    icon: 'pi pi-wrench',
  },
])

onMounted(() => {
  document.title = 'Mira Launcher - 设置'
})
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  padding: 2rem 1rem;
  background-color: #f9fafb;
}

.dark .settings-page {
  background-color: #111827;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background-color: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: #6b7280;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-item:hover {
  color: #374151;
  background-color: #f9fafb;
}

.dark .tab-item {
  color: #9ca3af;
}

.dark .tab-item:hover {
  color: #d1d5db;
  background-color: #1f2937;
}

.tab-item[data-state="active"] {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
  background-color: transparent;
}

.dark .tab-item[data-state="active"] {
  color: #60a5fa;
  border-bottom-color: #60a5fa;
}
</style>
