<!-- AccordionPanel 组件 - 包装 PrimeVue AccordionPanel -->
<template>
    <AccordionPanel
        v-bind="{
            ...$attrs,
            value: value
        }"
    >
        <slot />
    </AccordionPanel>
</template>

<script setup lang="ts">
import AccordionPanel from 'primevue/accordionpanel'

interface Props {
    value: string | number
}

defineProps<Props>()
</script>
