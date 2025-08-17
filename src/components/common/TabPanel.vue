<!-- TabPanel 组件 - 包装 PrimeVue TabPanel -->
<template>
    <TabPanel
        v-bind="{
            ...$attrs,
            value: value,
        }"
    >
        <slot />
    </TabPanel>
</template>

<script setup lang="ts">
import TabPanel from 'primevue/tabpanel'

interface Props {
    value: string | number
}

defineProps<Props>()
</script>
