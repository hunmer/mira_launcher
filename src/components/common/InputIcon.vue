<!-- InputIcon 组件 - 包装 PrimeVue InputIcon -->
<template>
    <InputIcon
        v-bind="$attrs"
    >
        <slot />
    </InputIcon>
</template>

<script setup lang="ts">
import InputIcon from 'primevue/inputicon'
</script>
