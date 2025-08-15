<!-- SettingCard 组件 - 包装 PrimeVue AccordionPanel 以支持设置页面的统一样式 -->
<template>
    <AccordionPanel v-bind="$attrs" :value="value">
        <AccordionHeader>
            <div class="flex items-center py-2">
                <i v-if="icon" :class="[icon, iconColor]" style="margin-right: 8px;" />
                <span class="font-medium">{{ title }}</span>
            </div>
        </AccordionHeader>
        <AccordionContent>
            <div class="p-6">
                <Card class="shadow-sm">
                    <div class="space-y-6">
                        <slot />
                    </div>
                </Card>
            </div>
        </AccordionContent>
    </AccordionPanel>
</template>

<script setup lang="ts">
import { Card } from '@/components/common'
import AccordionContent from 'primevue/accordioncontent'
import AccordionHeader from 'primevue/accordionheader'
import AccordionPanel from 'primevue/accordionpanel'

interface Props {
    value: string
    title: string
    icon?: string
    iconColor?: string
}

const props = withDefaults(defineProps<Props>(), {
    icon: '',
    iconColor: 'text-gray-600 dark:text-gray-400'
})
</script>

<style scoped></style>
