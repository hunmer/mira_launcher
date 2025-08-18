<template>
  <Dialog
    v-model:visible="visibleProxy"
    :header="title"
    :style="{ width: width }"
    :modal="true"
    :closable="true"
    @update:visible="$emit('update:show', $event)"
  >
    <div class="confirm-body">
      <slot>
        <p class="message">
          {{ message }}
        </p>
      </slot>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <Button
          :label="cancelLabel"
          class="p-button-secondary"
          @click="onCancel"
        />
        <Button
          :label="confirmLabel"
          :severity="danger ? 'danger' : 'primary'"
          @click="onConfirm"
        />
      </div>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import Button from '@/components/common/Button.vue'
import Dialog from '@/components/common/Dialog.vue'
import { computed } from 'vue'

interface Props {
  show: boolean
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  width?: string
}

interface Emits {
  (e: 'update:show', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  title: '确认操作',
  message: '确定执行该操作吗？',
  confirmLabel: '确定',
  cancelLabel: '取消',
  danger: false,
  width: '380px',
})
const emit = defineEmits<Emits>()

const visibleProxy = computed({
  get: () => props.show,
  set: v => emit('update:show', v),
})

const onConfirm = () => {
  emit('confirm')
  emit('update:show', false)
}
const onCancel = () => {
  emit('cancel')
  emit('update:show', false)
}
</script>
<style scoped>
.confirm-body { padding: 0.75rem 0.25rem; }
.message { margin:0; line-height:1.5; color: var(--text-color, #374151); }
.dialog-footer { display:flex; justify-content:flex-end; gap:0.75rem; }
</style>
