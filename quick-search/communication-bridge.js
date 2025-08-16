/**
 * 简化版通信桥接器
 * 为旧版兼容性保留
 */

// 简单的降级实现，确保旧代码不会出错
function getCommunicationBridge() {
  return {
    getConnectionStatus: () => ({
      isInitialized: false,
      environment: 'unknown',
      dataCount: 0,
      status: 'disconnected',
    }),
    getSearchData: () => [],
    search: () => [],
    addEventListener: () => () => { },
    sendResultSelection: () => Promise.resolve(),
    closeWindow: () => Promise.resolve(),
    refreshData: () => Promise.resolve(),
  }
}

// 导出到全局
if (typeof window !== 'undefined') {
  window.getCommunicationBridge = getCommunicationBridge
}

console.log('[CommunicationBridge] 简化版通信桥接器已加载')
