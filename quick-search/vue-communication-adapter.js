/* eslint-disable indent */
/**
 * Vue组件通信适配器
 * 将CommunicationBridge与Vue组件系统集成
 */

// Vue组合式API集成
const useCommunicationBridge = () => {
    const { ref, onMounted, onUnmounted } = window.Vue

    // 响应式状态
    const communicationBridge = ref(null)
    const isConnected = ref(false)
    const searchData = ref([])
    const connectionStatus = ref('disconnected')
    const environment = ref('unknown')

    // 事件监听清理函数
    let cleanupFunctions = []

    // 初始化通信桥接器
    const initializeBridge = async () => {
        try {
            communicationBridge.value = window.getCommunicationBridge()

            // 监听通信就绪事件
            const cleanupReady = communicationBridge.value.addEventListener('communication-ready', (event) => {
                isConnected.value = true
                environment.value = event.detail.environment
                connectionStatus.value = 'connected'
                console.log('[Vue适配器] 通信桥接器已就绪:', event.detail)
            })

            // 监听搜索数据更新
            const cleanupDataUpdate = communicationBridge.value.addEventListener('search-data-updated', (event) => {
                searchData.value = event.detail.data || []
                console.log('[Vue适配器] 搜索数据已更新:', searchData.value.length, '项')
            })

            // 监听通信错误
            const cleanupError = communicationBridge.value.addEventListener('communication-error', (event) => {
                connectionStatus.value = 'error'
                console.error('[Vue适配器] 通信错误:', event.detail.error)
            })

            // 监听结果选择
            const cleanupResultSelected = communicationBridge.value.addEventListener('result-selected', (event) => {
                console.log('[Vue适配器] 结果已选择:', event.detail.result)
            })

            // 保存清理函数
            cleanupFunctions.push(cleanupReady, cleanupDataUpdate, cleanupError, cleanupResultSelected)

            // 更新初始状态
            const status = communicationBridge.value.getConnectionStatus()
            isConnected.value = status.isInitialized
            environment.value = status.environment
            connectionStatus.value = status.status
            searchData.value = communicationBridge.value.getSearchData()

        } catch (error) {
            console.error('[Vue适配器] 初始化通信桥接器失败:', error)
            connectionStatus.value = 'error'
        }
    }

    // 搜索方法
    const search = (query) => {
        if (!communicationBridge.value) return []
        return communicationBridge.value.search(query)
    }

    // 发送结果选择
    const selectResult = async (result) => {
        if (!communicationBridge.value) return
        try {
            await communicationBridge.value.sendResultSelection(result)
        } catch (error) {
            console.error('[Vue适配器] 发送结果选择失败:', error)
        }
    }

    // 关闭窗口
    const closeWindow = async () => {
        if (!communicationBridge.value) return
        try {
            await communicationBridge.value.closeWindow()
        } catch (error) {
            console.error('[Vue适配器] 关闭窗口失败:', error)
        }
    }

    // 刷新数据
    const refreshData = async () => {
        if (!communicationBridge.value) return
        try {
            await communicationBridge.value.refreshData()
        } catch (error) {
            console.error('[Vue适配器] 刷新数据失败:', error)
        }
    }

    // 获取连接状态
    const getConnectionInfo = () => {
        if (!communicationBridge.value) return null
        return communicationBridge.value.getConnectionStatus()
    }

    // 生命周期钩子
    onMounted(() => {
        initializeBridge()
    })

    onUnmounted(() => {
        // 清理事件监听器
        cleanupFunctions.forEach(cleanup => {
            if (typeof cleanup === 'function') {
                cleanup()
            }
        })
        cleanupFunctions = []
    })

    return {
        // 响应式状态
        isConnected,
        searchData,
        connectionStatus,
        environment,

        // 方法
        search,
        selectResult,
        closeWindow,
        refreshData,
        getConnectionInfo,

        // 原始桥接器实例（高级用法）
        communicationBridge,
    }
}

// 全局混入，为所有组件提供通信能力
const CommunicationMixin = {
    data() {
        return {
            $communication: null,
            $isCommReady: false,
            $searchData: [],
            $connectionStatus: 'disconnected',
        }
    },

    async mounted() {
        try {
            this.$communication = window.getCommunicationBridge()

            // 监听通信就绪
            this.$communication.addEventListener('communication-ready', (event) => {
                this.$isCommReady = true
                this.$connectionStatus = 'connected'
                this.$emit('communicationReady', event.detail)
            })

            // 监听数据更新
            this.$communication.addEventListener('search-data-updated', (event) => {
                this.$searchData = event.detail.data || []
                this.$emit('searchDataUpdated', this.$searchData)
            })

            // 监听通信错误
            this.$communication.addEventListener('communication-error', (event) => {
                this.$connectionStatus = 'error'
                this.$emit('communicationError', event.detail)
            })

            // 更新初始状态
            const status = this.$communication.getConnectionStatus()
            this.$isCommReady = status.isInitialized
            this.$connectionStatus = status.status
            this.$searchData = this.$communication.getSearchData()

        } catch (error) {
            console.error('[混入] 通信初始化失败:', error)
            this.$connectionStatus = 'error'
        }
    },

    methods: {
        // 搜索方法
        $search(query) {
            if (!this.$communication) return []
            return this.$communication.search(query)
        },

        // 发送结果选择
        async $selectResult(result) {
            if (!this.$communication) return
            try {
                await this.$communication.sendResultSelection(result)
                this.$emit('resultSelected', result)
            } catch (error) {
                console.error('[混入] 结果选择失败:', error)
                this.$emit('resultSelectionError', { result, error })
            }
        },

        // 关闭窗口
        async $closeWindow() {
            if (!this.$communication) return
            try {
                await this.$communication.closeWindow()
                this.$emit('windowClosing')
            } catch (error) {
                console.error('[混入] 关闭窗口失败:', error)
                this.$emit('windowCloseError', error)
            }
        },

        // 刷新数据
        async $refreshData() {
            if (!this.$communication) return
            try {
                await this.$communication.refreshData()
                this.$emit('dataRefreshRequested')
            } catch (error) {
                console.error('[混入] 刷新数据失败:', error)
                this.$emit('dataRefreshError', error)
            }
        },
    },
}

// 通信状态指示器组件
const CommunicationStatusIndicator = {
    name: 'CommunicationStatusIndicator',
    template: `
    <div class="communication-status" :class="statusClass">
      <i :class="statusIcon"></i>
      <span class="status-text">{{ statusText }}</span>
      <button 
        v-if="showRetry && canRetry" 
        @click="retry" 
        class="retry-button"
        :disabled="isRetrying"
      >
        {{ isRetrying ? '重试中...' : '重试' }}
      </button>
    </div>
  `,

    data() {
        return {
            status: 'disconnected',
            environment: 'unknown',
            dataCount: 0,
            isRetrying: false,
        }
    },

    computed: {
        statusClass() {
            return `status-${this.status}`
        },

        statusIcon() {
            const iconMap = {
                connected: 'pi pi-check-circle',
                disconnected: 'pi pi-times-circle',
                error: 'pi pi-exclamation-triangle',
                fallback: 'pi pi-info-circle',
            }
            return iconMap[this.status] || 'pi pi-question-circle'
        },

        statusText() {
            const textMap = {
                connected: `已连接 (${this.environment}, ${this.dataCount}项数据)`,
                disconnected: '未连接',
                error: '连接错误',
                fallback: '降级模式',
            }
            return textMap[this.status] || '未知状态'
        },

        canRetry() {
            return ['error', 'disconnected'].includes(this.status)
        },

        showRetry() {
            return this.$props.showRetry && this.canRetry
        },
    },

    props: {
        showRetry: {
            type: Boolean,
            default: true,
        },
    },

    mounted() {
        this.updateStatus()

        // 监听状态变化
        window.addEventListener('communication-ready', this.handleStatusChange)
        window.addEventListener('communication-error', this.handleStatusChange)
        window.addEventListener('search-data-updated', this.handleDataUpdate)
    },

    beforeUnmount() {
        window.removeEventListener('communication-ready', this.handleStatusChange)
        window.removeEventListener('communication-error', this.handleStatusChange)
        window.removeEventListener('search-data-updated', this.handleDataUpdate)
    },

    methods: {
        updateStatus() {
            const bridge = window.getCommunicationBridge()
            if (bridge) {
                const info = bridge.getConnectionStatus()
                this.status = info.status
                this.environment = info.environment
                this.dataCount = info.dataCount
            }
        },

        handleStatusChange(_event) {
            this.updateStatus()
        },

        handleDataUpdate(event) {
            this.dataCount = event.detail?.data?.length || 0
        },

        async retry() {
            if (this.isRetrying) return

            this.isRetrying = true
            try {
                const bridge = window.getCommunicationBridge()
                if (bridge) {
                    await bridge.refreshData()
                }

                // 等待一段时间让状态更新
                setTimeout(() => {
                    this.updateStatus()
                }, 1000)

            } catch (error) {
                console.error('[状态指示器] 重试失败:', error)
            } finally {
                this.isRetrying = false
            }
        },
    },
}

// 导出到全局
if (typeof window !== 'undefined') {
    window.useCommunicationBridge = useCommunicationBridge
    window.CommunicationMixin = CommunicationMixin
    window.CommunicationStatusIndicator = CommunicationStatusIndicator
}

// 模块导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        useCommunicationBridge,
        CommunicationMixin,
        CommunicationStatusIndicator,
    }
}
