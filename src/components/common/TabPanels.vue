<!-- TabPanels 组件 - 包装 PrimeVue TabPanels -->
<template>
    <TabPanels
        v-bind="$attrs"
    >
        <slot />
    </TabPanels>
</template>

<script setup lang="ts">
import TabPanels from 'primevue/tabpanels'
</script>
