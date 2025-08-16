<!-- IconField 组件 - 包装 PrimeVue IconField -->
<template>
    <IconField
        v-bind="$attrs"
    >
        <slot />
    </IconField>
</template>

<script setup lang="ts">
import IconField from 'primevue/iconfield'
</script>
