<template>
    <Card :class="cardClass" v-bind="$attrs">
        <!-- Header slot for images or custom header content -->
        <template v-if="$slots['header']" #header>
            <slot name="header" />
        </template>

        <!-- Title slot with enhanced layout -->
        <template
            v-if="title || subtitle || closable || $slots['title-extra']"
            #title
        >
            <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                    <h3
                        v-if="title"
                        class="text-lg font-semibold text-gray-900 dark:text-gray-100 m-0 truncate"
                    >
                        {{ title }}
                    </h3>
                    <slot name="title-extra" />
                </div>
                <div class="flex items-center space-x-2 ml-3">
                    <slot name="header-actions" />
                    <Button
                        v-if="closable"
                        text
                        severity="secondary"
                        size="small"
                        icon="pi pi-times"
                        class="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                        @click="handleClose"
                    />
                </div>
            </div>
        </template>

        <!-- Subtitle slot -->
        <template v-if="subtitle || $slots['subtitle']" #subtitle>
            <p v-if="subtitle" class="text-sm text-gray-600 dark:text-gray-400 m-0">
                {{ subtitle }}
            </p>
            <slot name="subtitle" />
        </template>

        <!-- Content slot -->
        <template #content>
            <div :class="contentClass">
                <slot />
            </div>
        </template>

        <!-- Footer slot -->
        <template v-if="$slots['footer']" #footer>
            <slot name="footer" />
        </template>
    </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'

interface Props {
    title?: string
    subtitle?: string
    hoverable?: boolean
    closable?: boolean
    contentPadding?: boolean
    class?: string
}

const props = withDefaults(defineProps<Props>(), {
    title: '',
    subtitle: '',
    hoverable: false,
    closable: false,
    contentPadding: true,
    class: '',
})

const emit = defineEmits<Emits>()

interface Emits {
    (e: 'close'): void
}

// 样式类
const cardClass = computed(() => {
    return [
        'transition-all duration-200 ease-in-out',
        'bg-white dark:bg-gray-800',
        'border border-gray-200 dark:border-gray-700',
        'rounded-lg shadow-sm',
        props.hoverable && [
            'hover:shadow-md hover:shadow-gray-200/50 dark:hover:shadow-gray-900/25',
            'hover:border-primary-300 dark:hover:border-primary-600',
            'cursor-pointer transform hover:-translate-y-0.5',
        ],
        props.class,
    ]
        .flat()
        .filter(Boolean)
        .join(' ')
})

// 内容区域样式
const contentClass = computed(() => {
    return [props.contentPadding ? 'p-0' : ''].filter(Boolean).join(' ')
})

// 事件处理
const handleClose = () => {
    emit('close')
}
</script>
