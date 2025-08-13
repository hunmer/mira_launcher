<template>
  <div class="plugin-settings">
    <Accordion value="0">
      <AccordionPanel value="0">
        <AccordionHeader>
          <div class="flex items-center gap-2">
            <i class="pi pi-folder text-blue-600 dark:text-blue-400" />
            <span>插件路径配置</span>
          </div>
        </AccordionHeader>
        <AccordionContent>
          <div class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                插件目录路径
              </label>
              <div class="flex gap-2">
                <InputText
                  v-model="pluginPath"
                  placeholder="选择插件目录路径"
                  class="flex-1"
                  readonly
                />
                <Button
                  icon="pi pi-folder-open"
                  label="浏览"
                  @click="selectPluginDirectory"
                />
              </div>
              <small class="text-gray-500 dark:text-gray-400 block mt-1">
                插件将从此目录加载。默认为应用程序目录下的 plugins 文件夹。
              </small>
            </div>

            <Divider />

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                插件加载设置
              </label>
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-medium text-gray-900 dark:text-gray-100">
                      自动加载插件
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      启动时自动加载插件目录中的所有插件
                    </div>
                  </div>
                  <ToggleSwitch v-model="autoLoadPlugins" />
                </div>

                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-medium text-gray-900 dark:text-gray-100">
                      开发模式热重载
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      开发环境下监听插件文件变化并自动重载
                    </div>
                  </div>
                  <ToggleSwitch v-model="hotReloadEnabled" />
                </div>

                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-medium text-gray-900 dark:text-gray-100">
                      插件错误处理
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      插件加载失败时显示详细错误信息
                    </div>
                  </div>
                  <ToggleSwitch v-model="showPluginErrors" />
                </div>
              </div>
            </div>

            <Divider />

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                插件安全设置
              </label>
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-medium text-gray-900 dark:text-gray-100">
                      验证插件签名
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      只加载经过数字签名验证的插件
                    </div>
                  </div>
                  <ToggleSwitch v-model="verifySignature" />
                </div>

                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-medium text-gray-900 dark:text-gray-100">
                      沙箱模式
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      在受限环境中运行插件，提高安全性
                    </div>
                  </div>
                  <ToggleSwitch v-model="sandboxMode" />
                </div>
              </div>
            </div>

            <div class="flex gap-3 pt-4">
              <Button
                label="应用设置"
                icon="pi pi-check"
                @click="applySettings"
              />
              <Button
                label="重置为默认"
                icon="pi pi-refresh"
                severity="secondary"
                @click="resetToDefaults"
              />
              <Button
                label="重新扫描插件"
                icon="pi pi-search"
                severity="info"
                @click="rescanPlugins"
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionPanel>

      <AccordionPanel value="1">
        <AccordionHeader>
          <div class="flex items-center gap-2">
            <i class="pi pi-chart-bar text-green-600 dark:text-green-400" />
            <span>插件统计信息</span>
          </div>
        </AccordionHeader>
        <AccordionContent>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {{ pluginStats.total }}
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                总插件数
              </div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                {{ pluginStats.active }}
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                已启用
              </div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {{ pluginStats.inactive }}
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                已禁用
              </div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-red-600 dark:text-red-400">
                {{ pluginStats.errors }}
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                错误插件
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionPanel>
    </Accordion>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  Accordion, 
  AccordionPanel, 
  AccordionHeader, 
  AccordionContent, 
  Button, 
  Input as InputText, 
  ToggleSwitch, 
  Divider,
} from '@/components/common'
import { usePluginStore } from '@/stores/plugin'
import { useToast } from 'primevue/usetoast'

// Store 和工具
const pluginStore = usePluginStore()
const toast = useToast()

// 插件设置状态
const pluginPath = ref('')
const autoLoadPlugins = ref(true)
const hotReloadEnabled = ref(true)
const showPluginErrors = ref(true)
const verifySignature = ref(false)
const sandboxMode = ref(false)

// 插件统计
const pluginStats = computed(() => {
  const plugins = pluginStore.plugins
  return {
    total: plugins.length,
    active: plugins.filter(p => p.state === 'active').length,
    inactive: plugins.filter(p => p.state === 'inactive').length,
    errors: plugins.filter(p => p.state === 'error').length,
  }
})

// 选择插件目录
const selectPluginDirectory = async () => {
  try {
    // 在实际应用中，这里应该调用 Tauri 的目录选择 API
    if (typeof window !== 'undefined' && (window as unknown as { __TAURI__?: unknown }).__TAURI__) {
      try {
        // 尝试使用 Tauri API
        const { open } = await import('@tauri-apps/api/dialog')
        const selected = await open({
          directory: true,
          multiple: false,
        })
        
        if (selected) {
          pluginPath.value = selected as string
        }
      } catch (tauriError) {
        console.warn('Tauri dialog not available:', tauriError)
        // 降级到模拟模式
        const mockPath = '/Users/Example/MiraLauncher/plugins'
        pluginPath.value = mockPath
        toast.add({
          severity: 'info',
          summary: '模拟模式',
          detail: `模拟选择路径: ${mockPath}`,
          life: 3000,
        })
      }
    } else {
      // 开发环境模拟
      const mockPath = '/Users/Example/MiraLauncher/plugins'
      pluginPath.value = mockPath
      toast.add({
        severity: 'info',
        summary: '开发模式',
        detail: `模拟选择路径: ${mockPath}`,
        life: 3000,
      })
    }
  } catch (error) {
    console.error('Failed to select directory:', error)
    toast.add({
      severity: 'error',
      summary: '错误',
      detail: '无法打开目录选择器',
      life: 3000,
    })
  }
}

// 应用设置
const applySettings = async () => {
  try {
    // 保存设置到本地存储或配置文件
    const settings = {
      pluginPath: pluginPath.value,
      autoLoadPlugins: autoLoadPlugins.value,
      hotReloadEnabled: hotReloadEnabled.value,
      showPluginErrors: showPluginErrors.value,
      verifySignature: verifySignature.value,
      sandboxMode: sandboxMode.value,
    }
    
    // 在实际应用中，这里应该保存到配置文件
    localStorage.setItem('pluginSettings', JSON.stringify(settings))
    
    // 如果插件路径改变了，重新初始化插件系统
    if (pluginPath.value && pluginStore.isInitialized) {
      await pluginStore.destroy()
      await pluginStore.initialize()
      await rescanPlugins()
    }
    
    toast.add({
      severity: 'success',
      summary: '成功',
      detail: '插件设置已保存',
      life: 3000,
    })
  } catch (error) {
    console.error('Failed to apply settings:', error)
    toast.add({
      severity: 'error',
      summary: '错误',
      detail: '保存设置失败',
      life: 3000,
    })
  }
}

// 重置为默认值
const resetToDefaults = () => {
  pluginPath.value = ''
  autoLoadPlugins.value = true
  hotReloadEnabled.value = true
  showPluginErrors.value = true
  verifySignature.value = false
  sandboxMode.value = false
  
  toast.add({
    severity: 'info',
    summary: '已重置',
    detail: '插件设置已重置为默认值',
    life: 3000,
  })
}

// 重新扫描插件
const rescanPlugins = async () => {
  try {
    // 重新初始化插件系统来重新扫描插件
    if (pluginStore.isInitialized) {
      await pluginStore.destroy()
    }
    await pluginStore.initialize()
    
    toast.add({
      severity: 'success',
      summary: '完成',
      detail: `重新扫描完成，发现 ${pluginStats.value.total} 个插件`,
      life: 3000,
    })
  } catch (error) {
    console.error('Failed to rescan plugins:', error)
    toast.add({
      severity: 'error',
      summary: '错误',
      detail: '重新扫描插件失败',
      life: 3000,
    })
  }
}

// 加载保存的设置
const loadSettings = () => {
  try {
    const saved = localStorage.getItem('pluginSettings')
    if (saved) {
      const settings = JSON.parse(saved)
      pluginPath.value = settings.pluginPath || ''
      autoLoadPlugins.value = settings.autoLoadPlugins ?? true
      hotReloadEnabled.value = settings.hotReloadEnabled ?? true
      showPluginErrors.value = settings.showPluginErrors ?? true
      verifySignature.value = settings.verifySignature ?? false
      sandboxMode.value = settings.sandboxMode ?? false
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.plugin-settings {
  max-width: 800px;
}

.space-y-6 > * + * {
  margin-top: 1.5rem;
}

.space-y-4 > * + * {
  margin-top: 1rem;
}
</style>
