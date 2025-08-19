<template>
  <Dialog
    v-model:visible="visibleProxy"
    :header="`配置插件: ${plugin?.metadata.name || ''}`"
    :style="{ width: '600px' }"
    modal
    :closable="true"
    @update:visible="$emit('update:show', $event)"
  >
    <div v-if="plugin" class="plugin-config-dialog">
      <!-- 插件基本信息 -->
      <div class="plugin-info mb-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <div class="flex items-center gap-3 mb-2">
          <Avatar
            :label="plugin.metadata.name.charAt(0).toUpperCase()"
            shape="circle"
            size="normal"
            :style="{
              backgroundColor: getPluginColor(plugin.metadata.id),
              color: 'white',
            }"
          />
          <div>
            <h3 class="font-medium text-gray-900 dark:text-gray-100">
              {{ plugin.metadata.name }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              v{{ plugin.metadata.version }} by {{ plugin.metadata.author }}
            </p>
          </div>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-300">
          {{ plugin.metadata.description }}
        </p>
      </div>

      <!-- 配置表单 -->
      <div class="config-form space-y-4">
        <div v-if="configLoading" class="text-center py-8">
          <ProgressSpinner style="width: 50px; height: 50px" stroke-width="8" />
          <p class="text-gray-500 mt-4">
            加载配置...
          </p>
        </div>
        
        <div v-else-if="configError" class="text-center py-8 text-red-500">
          <i class="pi pi-exclamation-triangle text-4xl mb-4" />
          <p>{{ configError }}</p>
          <Button
            label="重试"
            severity="secondary"
            class="mt-3"
            @click="loadPluginConfig"
          />
        </div>
        
        <div v-else class="space-y-4">
          <div v-if="!configSchema || Object.keys(configSchema).length === 0" class="text-center py-8">
            <i class="pi pi-info-circle text-4xl text-gray-400 mb-4" />
            <p class="text-gray-500">
              此插件暂无可配置项
            </p>
          </div>
          
          <div v-else>
            <!-- 动态配置表单 -->
            <div
              v-for="(schema, key) in configSchema"
              :key="key"
              class="form-field"
            >
              <label :for="`config-${key}`" class="block text-sm font-medium mb-2">
                {{ schema.label || key }}
                <span v-if="schema.required" class="text-red-500 ml-1">*</span>
              </label>
              
              <!-- 字符串输入 -->
              <InputText
                v-if="schema.type === 'string'"
                :id="`config-${key}`"
                class="w-full"
                :placeholder="schema.placeholder || ''"
                :disabled="configSaving"
                :model-value="String(configValues[key] || '')"
                @update:model-value="configValues[key] = $event || ''"
              />
              
              <!-- 数字输入 -->
              <InputNumber
                v-else-if="schema.type === 'number'"
                :id="`config-${key}`"
                class="w-full"
                :min="schema.min"
                :max="schema.max"
                :disabled="configSaving"
                :model-value="Number(configValues[key] || 0)"
                @update:model-value="configValues[key] = $event || 0"
              />
              
              <!-- 布尔值开关 -->
              <div v-else-if="schema.type === 'boolean'" class="flex items-center gap-2">
                <ToggleSwitch
                  :id="`config-${key}`"
                  :disabled="configSaving"
                  :model-value="Boolean(configValues[key])"
                  @update:model-value="configValues[key] = $event"
                />
                <label :for="`config-${key}`" class="text-sm">
                  {{ schema.description || '启用此选项' }}
                </label>
              </div>
              
              <!-- 选择框 -->
              <Dropdown
                v-else-if="schema.type === 'select'"
                :id="`config-${key}`"
                class="w-full"
                :options="schema.options || []"
                :option-label="schema.optionLabel || 'label'"
                :option-value="schema.optionValue || 'value'"
                :placeholder="schema.placeholder || '请选择'"
                :disabled="configSaving"
                :model-value="configValues[key]"
                @update:model-value="configValues[key] = $event"
              />
              
              <!-- 多行文本 -->
              <Textarea
                v-else-if="schema.type === 'textarea'"
                :id="`config-${key}`"
                class="w-full"
                :placeholder="schema.placeholder || ''"
                :disabled="configSaving"
                :rows="schema.rows || 3"
                :model-value="String(configValues[key] || '')"
                @update:model-value="configValues[key] = $event || ''"
              />
              
              <!-- 默认文本输入 -->
              <InputText
                v-else
                :id="`config-${key}`"
                class="w-full"
                :placeholder="schema.placeholder || ''"
                :disabled="configSaving"
                :model-value="String(configValues[key] || '')"
                @update:model-value="configValues[key] = $event || ''"
              />
              
              <small v-if="schema.description" class="text-gray-500 mt-1 block">
                {{ schema.description }}
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="取消"
          severity="secondary"
          :disabled="configSaving"
          @click="$emit('update:show', false)"
        />
        <Button
          label="保存配置"
          :disabled="configSaving || !hasConfigSchema"
          :loading="configSaving"
          @click="saveConfig"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import Button from '@/components/common/Button.vue'
import Dialog from '@/components/common/Dialog.vue'
import type { PluginRegistryEntry } from '@/types/plugin'
import Avatar from 'primevue/avatar'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import ProgressSpinner from 'primevue/progressspinner'
import Textarea from 'primevue/textarea'
import ToggleSwitch from 'primevue/toggleswitch'
import { computed, ref, watch } from 'vue'

interface ConfigSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'select' | 'textarea'
    label?: string
    description?: string
    placeholder?: string
    required?: boolean
    min?: number
    max?: number
    rows?: number
    options?: Array<{ label: string; value: string | number | boolean }>
    optionLabel?: string
    optionValue?: string
  }
}

interface Props {
  show: boolean
  plugin: PluginRegistryEntry | null
}

interface Emits {
  (e: 'update:show', value: boolean): void
  (e: 'config-saved', plugin: PluginRegistryEntry, config: Record<string, string | number | boolean>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const configLoading = ref(false)
const configSaving = ref(false)
const configError = ref('')
const configSchema = ref<ConfigSchema>({})
const configValues = ref<Record<string, string | number | boolean>>({})

// 计算属性
const visibleProxy = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
})

const hasConfigSchema = computed(() => {
  return configSchema.value && Object.keys(configSchema.value).length > 0
})

// 生成插件颜色的函数
const getPluginColor = (pluginId: string): string => {
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#F97316', '#06B6D4', '#84CC16',
  ]
  let hash = 0
  for (let i = 0; i < pluginId.length; i++) {
    hash = pluginId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length] || '#3B82F6'
}

// 加载插件配置
const loadPluginConfig = async () => {
  if (!props.plugin) return
  
  configLoading.value = true
  configError.value = ''
  
  try {
    // 尝试从插件获取配置架构
    const response = await fetch(`/plugins/${props.plugin.metadata.id}/config-schema.json`)
    
    if (response.ok) {
      const schema = await response.json()
      configSchema.value = schema
      
      // 初始化配置值
      const initialValues: Record<string, string | number | boolean> = {}
      Object.keys(schema).forEach(key => {
        const field = schema[key]
        initialValues[key] = field.default ?? (
          field.type === 'boolean' ? false :
          field.type === 'number' ? 0 :
          ''
        )
      })
      
      // 加载现有配置
      try {
        const configResponse = await fetch(`/api/plugins/${props.plugin.metadata.id}/config`)
        if (configResponse.ok) {
          const existingConfig = await configResponse.json()
          Object.assign(initialValues, existingConfig)
        }
      } catch (error) {
        console.warn('Failed to load existing config:', error)
      }
      
      configValues.value = initialValues
    } else {
      // 没有配置架构文件，显示空状态
      configSchema.value = {}
      configValues.value = {}
    }
  } catch (error) {
    console.error('Failed to load plugin config:', error)
    configError.value = '加载配置失败，请稍后重试'
  } finally {
    configLoading.value = false
  }
}

// 保存配置
const saveConfig = async () => {
  if (!props.plugin || !hasConfigSchema.value) return
  
  configSaving.value = true
  
  try {
    const response = await fetch(`/api/plugins/${props.plugin.metadata.id}/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(configValues.value),
    })
    
    if (response.ok) {
      emit('config-saved', props.plugin, configValues.value)
      emit('update:show', false)
    } else {
      throw new Error('Failed to save config')
    }
  } catch (error) {
    console.error('Failed to save plugin config:', error)
    configError.value = '保存配置失败，请稍后重试'
  } finally {
    configSaving.value = false
  }
}

// 监听插件变化，重新加载配置
watch(() => props.plugin, (newPlugin) => {
  if (newPlugin && props.show) {
    loadPluginConfig()
  }
}, { immediate: true })

watch(() => props.show, (show) => {
  if (show && props.plugin) {
    loadPluginConfig()
  }
})
</script>

<style scoped>
.plugin-config-dialog {
  max-height: 60vh;
  overflow-y: auto;
}

.form-field {
  margin-bottom: 1rem;
}

.plugin-info {
  position: sticky;
  top: 0;
  z-index: 1;
}
</style>
