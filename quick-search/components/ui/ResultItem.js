/**
 * 搜索结果项组件
 * 基于 PrimeVue Card 包装
 */
const ResultItem = {
  name: 'ResultItem',
  template: `
        <Card 
            :class="[
                'result-item cursor-pointer transition-all duration-200 border border-surface-200',
                isSelected 
                    ? 'ring-2 ring-primary-500 bg-primary-50 shadow-md' 
                    : 'hover:bg-surface-50 hover:shadow-md',
                result.type && 'result-type-' + result.type
            ]"
            @click="handleClick"
            @mouseenter="handleMouseEnter"
            @mouseleave="handleMouseLeave"
        >
            <template #content>
                <div class="flex items-center gap-3 p-2">
                    <!-- 图标区域 -->
                    <div class="flex-shrink-0 result-icon">
                        <i v-if="result.icon && result.icon.startsWith('pi')" 
                           :class="result.icon" 
                           class="text-2xl text-surface-600"
                        ></i>
                        <div v-else-if="result.icon" 
                             class="text-2xl emoji-icon">
                            {{ result.icon }}
                        </div>
                        <div v-else 
                             class="w-8 h-8 bg-surface-300 rounded flex items-center justify-center fallback-icon">
                            <span class="text-sm font-bold text-surface-600">
                                {{ getIconFallback(result) }}
                            </span>
                        </div>
                    </div>

                    <!-- 内容区域 -->
                    <div class="flex-1 min-w-0 result-content">
                        <!-- 标题和类型徽章 -->
                        <div class="flex items-center gap-2 mb-1">
                            <h3 class="text-lg font-medium text-surface-900 truncate result-title">
                                {{ result.title || result.name }}
                            </h3>
                            <Badge 
                                :value="getTypeBadgeText(result)" 
                                :severity="getTypeBadgeSeverity(result)"
                                class="text-xs type-badge"
                            />
                            <Badge 
                                v-if="result.version"
                                :value="'v' + result.version"
                                severity="info"
                                class="text-xs version-badge"
                            />
                        </div>
                        
                        <!-- 描述 -->
                        <p v-if="result.description" 
                           class="text-sm text-surface-600 truncate result-description mb-2">
                            {{ result.description }}
                        </p>
                        
                        <!-- 标签 -->
                        <div v-if="result.tags && result.tags.length > 0" 
                             class="flex flex-wrap gap-1 mt-2 result-tags">
                            <Tag 
                                v-for="tag in result.tags" 
                                :key="tag"
                                :value="tag"
                                severity="secondary"
                                class="text-xs tag-item"
                            />
                        </div>
                        
                        <!-- 路径或操作信息 -->
                        <div v-if="result.path || result.action" 
                             class="text-xs text-surface-400 mt-1 truncate result-meta">
                            {{ result.path || result.action }}
                        </div>
                    </div>

                    <!-- 操作区域 -->
                    <div class="flex-shrink-0 result-actions">
                        <!-- 快捷键提示 -->
                        <div v-if="isSelected" class="mb-2">
                            <Tag 
                                value="Enter" 
                                severity="secondary" 
                                class="text-xs shortcut-hint" 
                            />
                        </div>
                        
                        <!-- 分数显示（调试模式） -->
                        <div v-if="showScore && result.score !== undefined" 
                             class="text-xs text-surface-400">
                            {{ result.score }}
                        </div>
                    </div>
                </div>
            </template>
        </Card>
    `,

  props: {
    result: {
      type: Object,
      required: true,
    },
    isSelected: {
      type: Boolean,
      default: false,
    },
    showScore: {
      type: Boolean,
      default: false,
    },
    index: {
      type: Number,
      default: 0,
    },
  },

  emits: ['click', 'mouseenter', 'mouseleave', 'select'],

  methods: {
    handleClick() {
      this.$emit('click', this.result, this.index)
      this.$emit('select', this.result, this.index)
    },

    handleMouseEnter() {
      this.$emit('mouseenter', this.result, this.index)
    },

    handleMouseLeave() {
      this.$emit('mouseleave', this.result, this.index)
    },

    getIconFallback(result) {
      const name = result.title || result.name || ''
      return name.charAt(0).toUpperCase() || '?'
    },

    getTypeBadgeText(result) {
      const typeMap = {
        'system': '系统',
        'page': '页面',
        'plugin': '插件',
        'plugin_entry': '入口',
        'application': '应用',
        'file': '文件',
        'function': '功能',
      }
      return typeMap[result.type] || result.type || '未知'
    },

    getTypeBadgeSeverity(result) {
      const severityMap = {
        'system': 'info',
        'page': 'success',
        'plugin': 'warning',
        'plugin_entry': 'secondary',
        'application': 'primary',
        'file': 'help',
        'function': 'contrast',
      }
      return severityMap[result.type] || 'secondary'
    },
  },
}

// 导出组件
if (typeof window !== 'undefined') {
  window.ResultItem = ResultItem
}
