<template>
  <div class="space-y-6">
    <Accordion 
      :value="['0', '1', '2']" 
      multiple
    >
      <AccordionPanel value="0">
        <AccordionHeader>外观设置</AccordionHeader>
        <AccordionContent>
          <div class="space-y-4 p-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium text-gray-900 dark:text-white">
                  主题模式
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  选择浅色或深色主题
                </p>
              </div>
              <Button @click="toggleTheme">
                {{ isDark ? '切换到浅色模式' : '切换到深色模式' }}
              </Button>
            </div>
          </div>
        </AccordionContent>
      </AccordionPanel>

      <AccordionPanel value="1">
        <AccordionHeader>语言设置</AccordionHeader>
        <AccordionContent>
          <div class="space-y-4 p-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium text-gray-900 dark:text-white">
                  界面语言
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  选择应用程序界面显示语言
                </p>
              </div>
              <select 
                v-model="language"
                class="px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                @change="saveLanguage"
              >
                <option value="zh-CN">
                  简体中文
                </option>
                <option value="en-US">
                  English
                </option>
              </select>
            </div>
          </div>
        </AccordionContent>
      </AccordionPanel>

      <AccordionPanel value="2">
        <AccordionHeader>应用设置</AccordionHeader>
        <AccordionContent>
          <div class="space-y-4 p-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium text-gray-900 dark:text-white">
                  窗口大小
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  设置启动器窗口的默认大小
                </p>
              </div>
              <select 
                v-model="windowSize"
                class="px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                @change="saveWindowSize"
              >
                <option value="small">
                  小
                </option>
                <option value="medium">
                  中
                </option>
                <option value="large">
                  大
                </option>
              </select>
            </div>
          </div>
        </AccordionContent>
      </AccordionPanel>
    </Accordion>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Button from '@/components/common/Button.vue'
import { useThemeStore } from '@/stores/theme'
import Accordion from 'primevue/accordion'
import AccordionPanel from 'primevue/accordionpanel'
import AccordionHeader from 'primevue/accordionheader'
import AccordionContent from 'primevue/accordioncontent'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.currentTheme === 'dark')

// 设置项
const language = ref('zh-CN')
const windowSize = ref('medium')

const toggleTheme = () => {
  themeStore.toggleTheme()
}

const saveLanguage = () => {
  console.log('保存语言设置:', language.value)
  // 这里可以调用 API 保存语言设置
}

const saveWindowSize = () => {
  console.log('保存窗口大小设置:', windowSize.value)
  // 这里可以调用 API 保存窗口大小设置
}

// 监听设置变化，实时保存
watch(language, saveLanguage)
watch(windowSize, saveWindowSize)
</script>
