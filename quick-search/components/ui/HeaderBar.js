/**
 * 应用顶部标题栏组件
 * 包含拖动区域和控制按钮
 */
const HeaderBar = {
  name: 'HeaderBar',
  template: `
        <div class="header-bar bg-white/10 backdrop-blur-md border-b border-white/20 pt-4 pb-2 pl-2 pr-2">
            <div class="flex items-center justify-between">
                <!-- 左侧占位 -->
                <div class="w-24"></div>
                
                <!-- 中间拖动条 -->
                <div class="flex-1 flex justify-center drag-region" style="height: 20px;" >
                    <div class=" macos-dragbar"></div>
                </div>
                
                <!-- 右侧控制按钮 -->
                <div class="flex items-center space-x-2 no-drag">
                    <!-- 在线状态指示器 -->
                    <div class="flex items-center space-x-2">
                        <div 
                            :class="['status-indicator', statusClass]"
                            :title="statusTooltip"
                        ></div>
                        <span class="text-xs text-white/70">{{ statusText }}</span>
                    </div>
                    
                    <!-- 切换主题按钮 -->
                    <Button
                        :icon="currentTheme === 'dark' ? 'pi pi-sun' : 'pi pi-moon'"
                        severity="secondary"
                        text
                        rounded
                        size="small"
                        class="text-white/70 hover:text-white hover:bg-white/10"
                        @click="toggleTheme"
                        :v-tooltip="'切换主题'"
                    />
                    
                    <!-- 设置按钮 -->
                    <Button
                        icon="pi pi-cog"
                        severity="secondary"
                        text
                        rounded
                        size="small"
                        class="text-white/70 hover:text-white hover:bg-white/10"
                        @click="openSettings"
                        v-tooltip="'设置'"
                    />
                </div>
            </div>
        </div>
    `,

  props: {
    connectionStatus: {
      type: String,
      default: 'disconnected',
      validator: (value) => ['connected', 'disconnected', 'error'].includes(value),
    },
    currentTheme: {
      type: String,
      default: 'light',
    },
  },

  emits: ['theme-toggle', 'settings-open'],

  computed: {
    statusClass() {
      const statusMap = {
        'connected': 'status-connected',
        'disconnected': 'status-disconnected',
        'error': 'status-error',
      }
      return statusMap[this.connectionStatus] || 'status-disconnected'
    },

    statusText() {
      const statusMap = {
        'connected': '已连接',
        'disconnected': '未连接',
        'error': '连接错误',
      }
      return statusMap[this.connectionStatus] || '未知'
    },

    statusTooltip() {
      const statusMap = {
        'connected': '与主应用连接正常',
        'disconnected': '与主应用断开连接',
        'error': '连接出现错误',
      }
      return statusMap[this.connectionStatus] || '连接状态未知'
    },
  },

  methods: {
    /**
         * 切换主题
         */
    toggleTheme() {
      this.$emit('theme-toggle')
    },

    /**
         * 打开设置
         */
    openSettings() {
      this.$emit('settings-open')
    },
  },
}

// 导出组件
if (typeof window !== 'undefined') {
  window.HeaderBar = HeaderBar
}
