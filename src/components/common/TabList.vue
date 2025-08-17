<!-- TabList 组件 - 包装 PrimeVue TabList -->
<template>
    <TabList v-bind="$attrs">
        <slot />
    </TabList>
</template>

<script setup lang="ts">
import TabList from 'primevue/tablist'
</script>
