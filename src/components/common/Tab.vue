<!-- Tab 组件 - 包装 PrimeVue Tab -->
<template>
    <Tab
        v-bind="{
            ...$attrs,
            value: value,
        }"
    >
        <slot />
    </Tab>
</template>

<script setup lang="ts">
import Tab from 'primevue/tab'

interface Props {
    value: string | number
}

defineProps<Props>()
</script>
