/**
 * 自定义搜索输入框组件
 * 基于 PrimeVue InputText 包装
 */
const SearchInput = {
  name: 'SearchInput',
  template: `
        <div class="search-input-container w-full">
            <div class="relative" :class="{ 'search-loading': isSearching }">
                <InputText 
                    v-model="internalValue"
                    :placeholder="placeholder"
                    class="w-full text-lg py-4 pl-12 pr-20 rounded-xl shadow-lg border-0 bg-white/95 backdrop-blur-sm focus:ring-2 focus:ring-white/50 focus:bg-white transition-all duration-300 placeholder:text-gray-400 dark:bg-gray-800/95 dark:text-white dark:placeholder:text-gray-300 dark:focus:bg-gray-800"
                    @input="handleInput"
                    @keydown="handleKeyDown"
                    @focus="handleFocus"
                    @blur="handleBlur"
                    ref="inputRef"
                />
         
                <!-- 右侧控制区域 -->
                <div class="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                    <!-- 搜索加载指示器 -->
                    <div v-if="isSearching" class="flex items-center">
                        <i class="pi pi-spin pi-spinner text-primary-500 text-sm dark:text-primary-400"></i>
                    </div>
                    
                    <!-- 清除按钮 -->
                    <button 
                        v-if="internalValue && showClearButton && !isSearching"
                        @click="clearInput"
                        class="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 dark:text-gray-300 dark:hover:text-gray-200 dark:hover:bg-gray-700"
                        title="清除搜索"
                    >
                        <i class="pi pi-times text-sm"></i>
                    </button>
                </div>
            </div>
            
            <!-- 搜索提示 -->
            <div v-if="showHints && hints.length > 0 && !isSearching" class="mt-4 px-2">
                <div class="flex flex-wrap gap-2">
                    <Tag 
                        v-for="hint in hints" 
                        :key="hint"
                        :value="hint"
                        severity="secondary"
                        class="text-xs px-3 py-1 cursor-pointer bg-white/20 text-white border-white/30 hover:bg-white/30 transition-all duration-200 rounded-full"
                        @click="selectHint(hint)"
                    />
                </div>
            </div>
        </div>
    `,

  props: {
    modelValue: {
      type: String,
      default: '',
    },
    placeholder: {
      type: String,
      default: '搜索应用程序、插件...',
    },
    showClearButton: {
      type: Boolean,
      default: true,
    },
    showHints: {
      type: Boolean,
      default: false,
    },
    hints: {
      type: Array,
      default: () => [],
    },
    autofocus: {
      type: Boolean,
      default: false,
    },
    isSearching: {
      type: Boolean,
      default: false,
    },
  },

  emits: ['update:modelValue', 'search', 'keydown', 'focus', 'blur', 'clear', 'hint-select'],

  data() {
    return {
      internalValue: this.modelValue,
      isFocused: false,
    }
  },

  watch: {
    modelValue(newValue) {
      this.internalValue = newValue
    },
  },

  mounted() {
    if (this.autofocus) {
      this.$nextTick(() => {
        this.$refs.inputRef.$el.focus()
      })
    }
  },

  methods: {
    handleInput(event) {
      this.internalValue = event.target.value
      this.$emit('update:modelValue', this.internalValue)
      this.$emit('search', this.internalValue)
    },

    handleKeyDown(event) {
      this.$emit('keydown', event)
    },

    handleFocus(event) {
      this.isFocused = true
      this.$emit('focus', event)
    },

    handleBlur(event) {
      this.isFocused = false
      this.$emit('blur', event)
    },

    clearInput() {
      this.internalValue = ''
      this.$emit('update:modelValue', '')
      this.$emit('search', '')
      this.$emit('clear')
      this.$refs.inputRef.$el.focus()
    },

    selectHint(hint) {
      this.internalValue = hint
      this.$emit('update:modelValue', hint)
      this.$emit('search', hint)
      this.$emit('hint-select', hint)
    },

    focus() {
      this.$refs.inputRef.$el.focus()
    },

    blur() {
      this.$refs.inputRef.$el.blur()
    },
  },
}

// 导出组件
if (typeof window !== 'undefined') {
  window.SearchInput = SearchInput
}
