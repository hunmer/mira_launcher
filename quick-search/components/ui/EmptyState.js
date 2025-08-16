/**
 * 空状态组件
 * 显示无结果、默认状态等
 */
const EmptyState = {
    name: 'EmptyState',
    template: `
        <Card class="text-center py-8 border border-surface-200 empty-state" :class="'empty-state-' + type">
            <template #content>
                <div class="text-surface-500">
                    <!-- 图标 -->
                    <i :class="iconClass" class="text-4xl mb-4 block empty-icon"></i>
                    
                    <!-- 主标题 -->
                    <p class="text-lg mb-2 empty-title">{{ title }}</p>
                    
                    <!-- 副标题 -->
                    <p class="text-sm empty-subtitle">{{ subtitle }}</p>
                    
                    <!-- 操作按钮 -->
                    <div v-if="showActions" class="mt-4 space-y-2">
                        <Button 
                            v-for="action in actions"
                            :key="action.key"
                            :label="action.label"
                            :severity="action.severity || 'secondary'"
                            :size="action.size || 'small'"
                            @click="handleAction(action)"
                            class="mx-1"
                        />
                    </div>
                    
                    <!-- 提示信息 -->
                    <div v-if="hints.length > 0" class="mt-4">
                        <p class="text-xs text-surface-400 mb-2">尝试搜索：</p>
                        <div class="flex flex-wrap justify-center gap-1">
                            <Tag 
                                v-for="hint in hints"
                                :key="hint"
                                :value="hint"
                                severity="secondary"
                                class="text-xs cursor-pointer hover:bg-primary-100 transition-colors"
                                @click="selectHint(hint)"
                            />
                        </div>
                    </div>
                </div>
            </template>
        </Card>
    `,

    props: {
        type: {
            type: String,
            default: 'no-results',
            validator: value => ['no-results', 'default', 'error', 'loading', 'empty'].includes(value)
        },
        customTitle: String,
        customSubtitle: String,
        customIcon: String,
        showActions: {
            type: Boolean,
            default: false
        },
        actions: {
            type: Array,
            default: () => []
        },
        hints: {
            type: Array,
            default: () => []
        }
    },

    emits: ['action', 'hint-select'],

    computed: {
        iconClass() {
            if (this.customIcon) return this.customIcon;

            const iconMap = {
                'no-results': 'pi pi-search',
                'default': 'pi pi-bolt',
                'error': 'pi pi-exclamation-triangle',
                'loading': 'pi pi-spin pi-spinner',
                'empty': 'pi pi-inbox'
            };
            return iconMap[this.type] || 'pi pi-info-circle';
        },

        title() {
            if (this.customTitle) return this.customTitle;

            const titleMap = {
                'no-results': '未找到匹配结果',
                'default': '快速搜索',
                'error': '搜索出错',
                'loading': '搜索中...',
                'empty': '暂无数据'
            };
            return titleMap[this.type] || '信息';
        },

        subtitle() {
            if (this.customSubtitle) return this.customSubtitle;

            const subtitleMap = {
                'no-results': '尝试不同的关键词或检查拼写',
                'default': '输入关键词搜索应用程序、插件和功能',
                'error': '请稍后重试或联系管理员',
                'loading': '正在搜索相关内容...',
                'empty': '没有可显示的内容'
            };
            return subtitleMap[this.type] || '';
        }
    },

    methods: {
        handleAction(action) {
            this.$emit('action', action);
        },

        selectHint(hint) {
            this.$emit('hint-select', hint);
        }
    }
};

// 导出组件
if (typeof window !== 'undefined') {
    window.EmptyState = EmptyState;
}
