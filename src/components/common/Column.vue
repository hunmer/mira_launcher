<!-- Column 组件 - 包装 PrimeVue Column -->
<template>
  <Column
    v-bind="$attrs"
  >
    <template 
      v-for="(_, name) in $slots" 
      #[name]="slotData"
      :key="name"
    >
      <slot 
        :name="name" 
        v-bind="slotData" 
      />
    </template>
  </Column>
</template>

<script setup lang="ts">
import Column from 'primevue/column'
</script>
