/**
 * 通信服务
 * 处理与主应用的通信
 */
class CommunicationService {
    constructor() {
        this.environment = 'unknown';
        this.isInitialized = false;
        this.listeners = new Map();
        this.searchData = [];
    }

    /**
     * 初始化通信服务
     */
    async initialize() {
        try {
            this.environment = this.detectEnvironment();

            if (this.environment === 'tauri') {
                await this.initializeTauri();
            } else {
                await this.initializeWeb();
            }

            this.isInitialized = true;
            this.emit('initialized', { environment: this.environment });

            console.log(`[通信服务] 已初始化 (${this.environment})`);
        } catch (error) {
            console.error('[通信服务] 初始化失败:', error);
            this.emit('error', { error: error.message });
            throw error;
        }
    }

    /**
     * 检测运行环境
     */
    detectEnvironment() {
        if (typeof window !== 'undefined' && window.__TAURI__) {
            return 'tauri';
        }
        return 'web';
    }

    /**
     * 初始化 Tauri 环境
     */
    async initializeTauri() {
        if (!window.__TAURI__) {
            throw new Error('Tauri API not available');
        }

        const { event, webviewWindow } = window.__TAURI__;
        const currentWindow = webviewWindow.getCurrentWebviewWindow();

        // 监听搜索数据更新
        await currentWindow.listen('search-data-updated', (eventData) => {
            this.searchData = eventData.payload || [];
            this.emit('search-data-updated', this.searchData);
            console.log('[Tauri] 搜索数据已更新:', this.searchData.length, '项');
        });

        // 监听其他事件
        await currentWindow.listen('window-focus', () => {
            this.emit('window-focus');
        });

        await currentWindow.listen('window-blur', () => {
            this.emit('window-blur');
        });

        // 请求搜索数据
        await event.emit('request-search-data', {});
        console.log('[Tauri] 已请求搜索数据');
    }

    /**
     * 初始化 Web 环境
     */
    async initializeWeb() {
        // 监听来自父窗口的消息
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type) {
                switch (event.data.type) {
                    case 'search-data-updated':
                        this.searchData = event.data.payload || [];
                        this.emit('search-data-updated', this.searchData);
                        console.log('[Web] 搜索数据已更新:', this.searchData.length, '项');
                        break;

                    case 'window-focus':
                        this.emit('window-focus');
                        break;

                    case 'window-blur':
                        this.emit('window-blur');
                        break;
                }
            }
        });

        // 请求搜索数据
        this.requestSearchDataWeb();
        console.log('[Web] 已请求搜索数据');
    }

    /**
     * Web 环境请求搜索数据
     */
    requestSearchDataWeb() {
        try {
            const message = { type: 'request-search-data' };

            if (window.opener) {
                window.opener.postMessage(message, '*');
            } else if (window.parent && window.parent !== window) {
                window.parent.postMessage(message, '*');
            } else {
                document.dispatchEvent(new CustomEvent('request-search-data'));
            }
        } catch (error) {
            console.error('[Web] 请求搜索数据失败:', error);
        }
    }

    /**
     * 获取搜索数据
     */
    async getSearchData() {
        // 如果已经有数据，直接返回
        if (this.searchData.length > 0) {
            return this.searchData;
        }

        // 等待数据或超时
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve(this.getFallbackData());
            }, 5000);

            const unsubscribe = this.on('search-data-updated', (data) => {
                clearTimeout(timeout);
                unsubscribe();
                resolve(data);
            });
        });
    }

    /**
     * 获取降级数据
     */
    getFallbackData() {
        return [
            {
                type: 'system',
                title: 'Visual Studio Code',
                description: '代码编辑器',
                icon: 'pi pi-code',
                path: 'code.exe',
                category: '应用程序',
            },
            {
                type: 'system',
                title: '设置',
                description: '应用程序设置',
                icon: 'pi pi-cog',
                action: 'open-settings',
                category: '系统功能',
            },
        ];
    }

    /**
     * 执行搜索结果
     */
    async executeResult(result) {
        try {
            if (this.environment === 'tauri') {
                await this.executeResultTauri(result);
            } else {
                await this.executeResultWeb(result);
            }

            this.emit('result-executed', result);
            console.log('[通信服务] 已执行结果:', result);
        } catch (error) {
            console.error('[通信服务] 执行结果失败:', error);
            this.emit('error', { error: error.message, result });
            throw error;
        }
    }

    /**
     * Tauri 环境执行结果
     */
    async executeResultTauri(result) {
        const { event } = window.__TAURI__;
        await event.emit('quick-search-result-selected', result);
    }

    /**
     * Web 环境执行结果
     */
    async executeResultWeb(result) {
        const message = {
            type: 'quick-search-result-selected',
            data: result,
        };

        if (window.opener) {
            window.opener.postMessage(message, '*');
        } else if (window.parent && window.parent !== window) {
            window.parent.postMessage(message, '*');
        } else {
            document.dispatchEvent(
                new CustomEvent('quick-search-result-selected', {
                    detail: result,
                })
            );
        }
    }

    /**
     * 关闭窗口
     */
    async closeWindow() {
        try {
            if (this.environment === 'tauri') {
                const { webviewWindow } = window.__TAURI__;
                const currentWindow = webviewWindow.getCurrentWebviewWindow();
                await currentWindow.close();
            } else {
                if (window.close) {
                    window.close();
                } else {
                    document.body.style.display = 'none';
                }
            }

            this.emit('window-closed');
            console.log('[通信服务] 窗口已关闭');
        } catch (error) {
            console.error('[通信服务] 关闭窗口失败:', error);
            document.body.style.display = 'none';
        }
    }

    /**
     * 事件监听
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);

        // 返回取消监听的函数
        return () => {
            const callbacks = this.listeners.get(event);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                }
            }
        };
    }

    /**
     * 取消事件监听
     */
    off(event, callback) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * 触发事件
     */
    emit(event, data) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[通信服务] 事件回调执行失败 (${event}):`, error);
                }
            });
        }
    }

    /**
     * 获取连接状态
     */
    getConnectionStatus() {
        return {
            isInitialized: this.isInitialized,
            environment: this.environment,
            dataCount: this.searchData.length,
            status: this.isInitialized ? 'connected' : 'disconnected'
        };
    }

    /**
     * 刷新数据
     */
    async refreshData() {
        try {
            if (this.environment === 'tauri') {
                const { event } = window.__TAURI__;
                await event.emit('request-search-data', {});
            } else {
                this.requestSearchDataWeb();
            }

            this.emit('data-refresh-requested');
            console.log('[通信服务] 已请求刷新数据');
        } catch (error) {
            console.error('[通信服务] 刷新数据失败:', error);
            this.emit('error', { error: error.message });
        }
    }
}

// 导出服务
if (typeof window !== 'undefined') {
    window.CommunicationService = CommunicationService;
}
