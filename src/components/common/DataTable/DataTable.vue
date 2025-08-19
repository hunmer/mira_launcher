<!-- DataTable 组件 - 包装 PrimeVue DataTable 以支持自定义样式和暗色模式 -->
<template>
    <DataTable v-bind="$attrs" :class="computedClass">
        <template
            v-for="name in Object.keys($slots)"
            #[name]="slotProps"
            :key="name"
        >
            <slot
                v-if="$slots[name]"
                :name="name"
                v-bind="slotProps || {}"
            />
        </template>
    </DataTable>
</template>

<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
import DataTable from 'primevue/datatable'
import { computed } from 'vue'

// 启用透传所有属性
defineOptions({
    inheritAttrs: false,
})

const themeStore = useThemeStore()

// 计算表格样式类
const computedClass = computed(() => {
    const classes = ['custom-datatable']

    if (themeStore.currentTheme === 'dark') {
        classes.push('dark-theme')
    }

    return classes.join(' ')
})
</script>

<style>
/* DataTable wrapper样式 */
.custom-datatable {
  width: 100%;
}
</style>
