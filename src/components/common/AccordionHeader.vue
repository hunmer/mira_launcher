<!-- AccordionHeader 组件 - 包装 PrimeVue AccordionHeader -->
<template>
    <AccordionHeader
        v-bind="$attrs"
    >
        <slot />
    </AccordionHeader>
</template>

<script setup lang="ts">
import AccordionHeader from 'primevue/accordionheader'
</script>
