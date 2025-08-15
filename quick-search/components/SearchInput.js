/* eslint-disable indent */
/**
 * SearchInput 轻量化组件
 * 功能：防抖搜索、键盘导航、输入状态管理
 */

// 防抖函数
function debounce(func, wait) {
    let timeout = null
    return function (...args) {
        if (timeout !== null) {
            clearTimeout(timeout)
        }
        timeout = setTimeout(() => func.apply(this, args), wait)
    }
}

const SearchInput = {
    template: `
    <div class="search-input-container">
      <div class="search-input-wrapper">
        <i class="pi pi-search search-icon"></i>
        <input 
          ref="input"
          v-model="query" 
          @input="handleInput" 
          @keydown="handleKeyDown"
          @focus="handleFocus"
          @blur="handleBlur"
          class="search-input"
          type="text"
          placeholder="搜索应用、文件或功能..."
          autocomplete="off"
        />
        <div v-if="isSearching" class="loading-spinner">
          <i class="pi pi-spin pi-spinner"></i>
        </div>
        <button 
          v-if="query.length > 0"
          @click="clearSearch"
          class="clear-button"
          title="清空搜索"
        >
          <i class="pi pi-times"></i>
        </button>
      </div>
    </div>
  `,

    props: {
        placeholder: {
            type: String,
            default: '搜索应用、文件或功能...',
        },
        debounceMs: {
            type: Number,
            default: 300,
        },
        autoFocus: {
            type: Boolean,
            default: true,
        },
    },

    emits: ['search', 'keydown', 'focus', 'blur', 'clear'],

    setup(props, { emit }) {
        // 在CDN环境下直接从全局Vue对象获取API
        const { ref, nextTick, onMounted } = window.Vue

        // 响应式数据
        const query = ref('')
        const isSearching = ref(false)
        const isFocused = ref(false)
        const input = ref(null)

        // 防抖搜索函数
        const debouncedSearch = debounce((searchQuery) => {
            isSearching.value = true
            emit('search', searchQuery)
            // 模拟搜索完成后重置loading状态
            setTimeout(() => {
                isSearching.value = false
            }, 100)
        }, props.debounceMs)

        // 输入处理
        const handleInput = () => {
            const trimmedQuery = query.value.trim()

            if (trimmedQuery === '') {
                // 空查询立即处理
                isSearching.value = false
                emit('search', '')
            } else {
                // 非空查询使用防抖
                debouncedSearch(trimmedQuery)
            }
        }

        // 键盘事件处理
        const handleKeyDown = (e) => {
            // 发送键盘事件给父组件处理导航逻辑
            emit('keydown', e)

            // ESC键清空搜索
            if (e.key === 'Escape') {
                if (query.value) {
                    e.preventDefault()
                    clearSearch()
                }
            }
        }

        // 焦点事件
        const handleFocus = (e) => {
            isFocused.value = true
            emit('focus', e)
        }

        const handleBlur = (e) => {
            isFocused.value = false
            emit('blur', e)
        }

        // 清空搜索
        const clearSearch = () => {
            query.value = ''
            isSearching.value = false
            emit('search', '')
            emit('clear')
            // 重新聚焦输入框
            nextTick(() => {
                if (input.value) {
                    input.value.focus()
                }
            })
        }

        // 聚焦输入框
        const focus = () => {
            if (input.value) {
                input.value.focus()
            }
        }

        // 失焦输入框
        const blur = () => {
            if (input.value) {
                input.value.blur()
            }
        }

        // 设置搜索查询
        const setQuery = (newQuery) => {
            query.value = newQuery
            handleInput()
        }

        // 获取当前查询
        const getQuery = () => query.value

        // 组件挂载后自动聚焦
        onMounted(() => {
            if (props.autoFocus) {
                nextTick(() => focus())
            }
        })

        // 暴露给外部的方法和数据
        return {
            query,
            isSearching,
            isFocused,
            input,
            handleInput,
            handleKeyDown,
            handleFocus,
            handleBlur,
            clearSearch,
            focus,
            blur,
            setQuery,
            getQuery,
        }
    },
}

// 导出组件
if (typeof window !== 'undefined') {
    window.SearchInput = SearchInput
}
