/* eslint-disable indent */
/**
 * ResultList 结果展示组件
 * 功能：不同类型结果展示、选中状态管理、高亮匹配、键盘导航
 */

const ResultList = {
    template: `
    <div class="result-list-container">
      <!-- 无结果状态 -->
      <div v-if="results.length === 0 && emptyState" class="empty-state">
        <div class="empty-state-icon">
          <i :class="emptyState.icon" :style="{ color: emptyState.iconColor }"></i>
        </div>
        <div class="empty-state-title">{{ emptyState.title }}</div>
        <div class="empty-state-subtitle">{{ emptyState.subtitle }}</div>
      </div>
      
      <!-- 结果列表 -->
      <div v-else-if="results.length > 0" class="results-list">
        <div
          v-for="(result, index) in results"
          :key="result.id || index"
          :class="getItemClass(index)"
          @click="selectItem(result, index)"
          @mouseenter="updateSelectedIndex(index)"
          @mouseleave="handleMouseLeave"
          :data-index="index"
          :data-type="result.type"
        >
          <!-- 结果项图标 -->
          <div class="result-icon">
            <!-- 应用图标 -->
            <img 
              v-if="(result.searchEntry?.icon || result.icon) && result.type === 'app'" 
              :src="result.searchEntry?.icon || result.icon" 
              :alt="result.name"
              @error="handleIconError"
            />
            <!-- 搜索入口图标 -->
            <i v-else-if="result.searchEntry?.icon" :class="result.searchEntry.icon"></i>
            <!-- 类型图标 -->
            <i v-else :class="getTypeIcon(result.type)"></i>
          </div>
          
          <!-- 结果项内容 -->
          <div class="result-content">
            <!-- 如果有搜索入口，优先显示入口标题 -->
            <div class="result-title" v-html="highlightText(result.searchEntry?.title || result.name || result.title)"></div>
            <!-- 搜索入口描述或原描述 -->
            <div v-if="result.description" class="result-description">
              {{ result.description }}
            </div>
            <!-- 如果有搜索入口，显示原插件名称作为副标题 -->
            <div v-if="result.searchEntry && result.name && result.searchEntry.title !== result.name" class="result-subtitle">
              来自: {{ result.name }}
            </div>
            <div class="result-meta">
              <!-- 类型标识 Badge -->
              <span :class="getTypeBadgeClass(result.type)" class="result-type-badge">
                {{ getTypeBadgeText(result.type) }}
              </span>
              
              <!-- 插件入口路由 Badge（仅对 plugin_entry 类型显示） -->
              <span v-if="result.type === 'plugin_entry' && result.searchEntry?.router" class="result-entry-badge">
                {{ result.searchEntry.router }}
              </span>
              
              <!-- 版本信息 Badge -->
              <span v-if="result.version || result.pluginInfo?.version" class="result-version-badge">
                v{{ result.version || result.pluginInfo?.version }}
              </span>
              
              <!-- 显示搜索入口标签 -->
              <div v-if="result.searchEntry?.tags" class="result-tags">
                <span v-for="tag in (result.searchEntry.tags || []).slice(0, 3)" :key="tag" class="result-tag">
                  {{ tag }}
                </span>
              </div>
              <!-- 显示原始标签（如果没有搜索入口标签） -->
              <div v-else-if="result.tags" class="result-tags">
                <span v-for="tag in (result.tags || []).slice(0, 3)" :key="tag" class="result-tag">
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- 结果项操作 -->
          <div class="result-actions">
            <div class="result-score" v-if="showScore && result.score">
              {{ Math.round(result.score) }}
            </div>
            <i v-if="index === selectedIndex" class="pi pi-angle-right selected-indicator"></i>
          </div>
        </div>
      </div>
      
      <!-- 加载状态 -->
      <div v-else-if="loading" class="loading-state">
        <div class="loading-spinner">
          <i class="pi pi-spin pi-spinner"></i>
        </div>
        <div class="loading-text">搜索中...</div>
      </div>
    </div>
  `,

    props: {
        results: {
            type: Array,
            default: () => [],
        },
        selectedIndex: {
            type: Number,
            default: -1,
        },
        searchQuery: {
            type: String,
            default: '',
        },
        loading: {
            type: Boolean,
            default: false,
        },
        emptyState: {
            type: Object,
            default: () => ({
                icon: 'pi pi-search',
                iconColor: '#6b7280',
                title: '开始输入以搜索',
                subtitle: '搜索应用程序、文件或功能',
            }),
        },
        showScore: {
            type: Boolean,
            default: false,
        },
        maxVisibleItems: {
            type: Number,
            default: 10,
        },
    },

    emits: ['select', 'selectedIndexChange', 'mouseEnter', 'mouseLeave'],

    setup(props, { emit }) {
        const { computed, nextTick, watch } = window.Vue

        // 类型图标映射
        const typeIcons = {
            app: 'pi pi-desktop',
            page: 'pi pi-file',
            plugin: 'pi pi-puzzle-piece',
            file: 'pi pi-file-o',
            folder: 'pi pi-folder',
            web: 'pi pi-globe',
            system: 'pi pi-cog',
            default: 'pi pi-file',
        }

        // 类型标签映射
        const typeLabels = {
            app: '应用',
            page: '页面',
            plugin: '插件',
            file: '文件',
            folder: '文件夹',
            web: '网页',
            system: '系统',
            default: '其他',
        }

        // 获取项目样式类
        const getItemClass = (index) => {
            return [
                'result-item',
                {
                    'result-item-selected': index === props.selectedIndex,
                    'result-item-odd': index % 2 === 1,
                },
            ]
        }

        // 获取类型图标
        const getTypeIcon = (type) => {
            return typeIcons[type] || typeIcons.default
        }

        // 获取类型标签
        const getTypeLabel = (type) => {
            return typeLabels[type] || typeLabels.default
        }

        // 获取类型 Badge 的 CSS 类
        const getTypeBadgeClass = (type) => {
            const badgeClasses = {
                'function': 'badge-system',
                'page': 'badge-page',
                'plugin': 'badge-plugin',
                'plugin_entry': 'badge-plugin-entry',
                'app': 'badge-app',
                'file': 'badge-file',
                'web': 'badge-web',
                'default': 'badge-default'
            }
            return badgeClasses[type] || badgeClasses.default
        }

        // 获取类型 Badge 的文本
        const getTypeBadgeText = (type) => {
            const badgeTexts = {
                'function': '系统',
                'page': '页面',
                'plugin': '插件',
                'plugin_entry': '入口',
                'app': '应用',
                'file': '文件',
                'web': '网页',
                'default': '其他'
            }
            return badgeTexts[type] || badgeTexts.default
        }

        // 高亮搜索关键词
        const highlightText = (text) => {
            if (!text || !props.searchQuery.trim()) {
                return text
            }

            const query = props.searchQuery.trim()
            const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi')

            return text.replace(regex, '<span class="highlight">$1</span>')
        }

        // 转义正则表达式特殊字符
        const escapeRegExp = (string) => {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        }

        // 处理图标加载错误
        const handleIconError = (event) => {
            // 替换为默认图标
            event.target.style.display = 'none'
            const parent = event.target.parentElement
            if (parent && !parent.querySelector('.pi')) {
                const fallbackIcon = document.createElement('i')
                fallbackIcon.className = 'pi pi-file'
                parent.appendChild(fallbackIcon)
            }
        }

        // 选择项目
        const selectItem = (item, index) => {
            emit('select', { item, index })
        }

        // 更新选中索引
        const updateSelectedIndex = (index) => {
            if (props.selectedIndex !== index) {
                emit('selectedIndexChange', index)
                emit('mouseEnter', { index, item: props.results[index] })
            }
        }

        // 鼠标离开处理
        const handleMouseLeave = () => {
            emit('mouseLeave')
        }

        // 滚动到选中项
        const scrollToSelected = () => {
            nextTick(() => {
                const selectedElement = document.querySelector('.result-item-selected')
                if (selectedElement) {
                    selectedElement.scrollIntoView({
                        block: 'nearest',
                        behavior: 'smooth',
                    })
                }
            })
        }

        // 监听选中索引变化以自动滚动
        watch(() => props.selectedIndex, () => {
            if (props.selectedIndex >= 0) {
                scrollToSelected()
            }
        })

        // 计算显示的结果
        const visibleResults = computed(() => {
            return props.results.slice(0, props.maxVisibleItems)
        })

        return {
            getItemClass,
            getTypeIcon,
            getTypeLabel,
            getTypeBadgeClass,
            getTypeBadgeText,
            highlightText,
            handleIconError,
            selectItem,
            updateSelectedIndex,
            handleMouseLeave,
            scrollToSelected,
            visibleResults,
        }
    },
}

// 导出组件
if (typeof window !== 'undefined') {
    window.ResultList = ResultList
}
