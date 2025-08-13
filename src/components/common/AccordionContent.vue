<!-- AccordionContent 组件 - 包装 PrimeVue AccordionContent -->
<template>
  <AccordionContent
    v-bind="$attrs"
  >
    <slot />
  </AccordionContent>
</template>

<script setup lang="ts">
import AccordionContent from 'primevue/accordioncontent'
</script>
