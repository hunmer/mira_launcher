import { createApp } from 'vue'
import './styles/main.css'

// 创建简化的 App 组件用于测试
const App = {
    template: `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center">
      <div class="bg-white p-8 rounded-lg shadow-lg">
        <h1 class="text-2xl font-bold text-gray-900 mb-4">Mira Launcher</h1>
        <p class="text-gray-600">开发服务器运行正常 ✅</p>
        <div class="mt-4 p-4 bg-blue-50 rounded">
          <p class="text-sm text-blue-800">Vue 3 + TypeScript + Vite + Tailwind CSS</p>
        </div>
      </div>
    </div>
  `
}

// 创建并挂载应用
const app = createApp(App)
app.mount('#app')

console.log('🚀 Mira Launcher 开发服务器启动成功')
