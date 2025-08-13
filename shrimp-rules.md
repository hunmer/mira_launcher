# 輕量化應用啟動器開發規範

## 專案概述

- **專案性質**：跨平台桌面應用程式 (Tauri + Vue 3 + TypeScript)
- **核心功能**：應用啟動器、插件系統、拖拽排序、全局快捷鍵
- **目標平台**：Windows、macOS、Linux
- **架構模式**：前後端分離（Vue 3 前端 + Rust 後端）

## 強制目錄結構規範

### 根目錄必須包含
```
mira_launcher/
├── README.md                    # 專案說明
├── package.json                 # Node.js 依賴管理
├── pnpm-lock.yaml              # 鎖定依賴版本
├── tsconfig.json               # TypeScript 配置
├── vite.config.ts              # Vite 構建配置
├── tailwind.config.js          # Tailwind CSS 配置
├── .eslintrc.js                # ESLint 規則
├── .prettierrc                 # Prettier 格式化規則
├── .gitignore                  # Git 忽略規則
├── src/                        # Vue 3 前端源碼
├── src-tauri/                  # Tauri Rust 後端源碼
├── docs/                       # 專案文檔
├── plugins/                    # 內建插件目錄
└── dist/                       # 構建輸出目錄
```

### src/ 前端目錄強制結構
```
src/
├── main.ts                     # Vue 應用入口
├── App.vue                     # 根組件
├── assets/                     # 靜態資源
│   ├── icons/                  # 圖標檔案
│   ├── images/                 # 圖片資源
│   └── styles/                 # 全局樣式
├── components/                 # Vue 組件
│   ├── common/                 # 通用組件
│   ├── layout/                 # 布局組件
│   ├── grid/                   # 網格相關組件
│   └── ui/                     # UI 基礎組件
├── composables/                # Vue 組合式函數
├── stores/                     # Pinia 狀態管理
├── types/                      # TypeScript 類型定義
├── utils/                      # 工具函數
├── plugins/                    # 插件系統核心
│   ├── core/                   # 插件核心邏輯
│   ├── api/                    # 插件 API
│   └── loader/                 # 插件載入器
└── views/                      # 頁面組件
```

### src-tauri/ 後端目錄強制結構
```
src-tauri/
├── Cargo.toml                  # Rust 依賴配置
├── tauri.conf.json            # Tauri 應用配置
├── build.rs                   # Rust 構建腳本
├── src/
│   ├── main.rs                 # Rust 應用入口
│   ├── lib.rs                  # 庫檔案
│   ├── commands/               # Tauri 命令實現
│   ├── handlers/               # 事件處理器
│   ├── plugins/                # 後端插件系統
│   ├── tray/                   # 系統托盤邏輯
│   ├── shortcuts/              # 全局快捷鍵
│   └── utils/                  # Rust 工具函數
└── icons/                      # 應用圖標資源
```

## 檔案命名規範

### 必須遵循的命名慣例

#### Vue 組件檔案
- **PascalCase**：`GridContainer.vue`、`PluginManager.vue`
- **禁止**：`gridContainer.vue`、`plugin-manager.vue`

#### TypeScript 檔案
- **camelCase**：`pluginLoader.ts`、`eventBus.ts`
- **類型檔案後綴**：`types.ts`、`interfaces.ts`

#### Rust 檔案
- **snake_case**：`plugin_manager.rs`、`global_shortcuts.rs`
- **模組名稱**：小寫單數形式

#### 目錄命名
- **kebab-case**：`src/components/grid-layout/`
- **禁止**：`src/components/GridLayout/`、`src/components/grid_layout/`

## 技術框架特定規範

### Tauri 後端規範

#### 命令實現規則
- **位置**：所有 Tauri 命令必須放在 `src-tauri/src/commands/` 目錄
- **檔案結構**：每個功能模組一個檔案
  ```rust
  // src-tauri/src/commands/plugin_commands.rs
  #[tauri::command]
  pub async fn load_plugin(plugin_id: String) -> Result<PluginInfo, String> {
      // 實現邏輯
  }
  ```
- **註冊規則**：所有命令必須在 `main.rs` 中註冊
- **錯誤處理**：必須返回 `Result<T, String>` 類型

#### 配置檔案同步規則
- **修改 `tauri.conf.json` 時必須同步**：
  - 檢查 `src-tauri/Cargo.toml` 的依賴版本
  - 更新 `package.json` 中的 `@tauri-apps/api` 版本
  - 驗證 `src/types/tauri.ts` 的類型定義

### Vue 3 前端規範

#### 組件開發規則
- **組合式 API 優先**：禁止使用 Options API
- **script setup 語法**：所有組件必須使用 `<script setup>` 語法
- **類型定義**：所有 props 和 emits 必須有 TypeScript 類型定義
- **示例結構**：
  ```vue
  <script setup lang="ts">
  interface Props {
    items: GridItem[]
    columns: number
  }
  
  interface Emits {
    (e: 'item-click', item: GridItem): void
  }
  
  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()
  </script>
  ```

#### 狀態管理規範（Pinia）
- **Store 檔案位置**：`src/stores/`
- **命名慣例**：`useXxxStore`
- **檔案分割**：每個功能域一個 store 檔案
  ```typescript
  // src/stores/pluginStore.ts
  export const usePluginStore = defineStore('plugin', () => {
    // 組合式 API 風格
  })
  ```

### TypeScript 配置規範

#### 嚴格模式規則
- **啟用所有嚴格檢查**：`strict: true`
- **禁用 any 類型**：`noImplicitAny: true`
- **路徑別名設定**：
  ```json
  {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/plugins/*": ["./src/plugins/*"]
    }
  }
  ```

### Tailwind CSS 規範

#### 類名使用規則
- **優先使用 Tailwind 類名**：禁止自定義 CSS 類除非必要
- **響應式設計**：必須支援 `sm:`、`md:`、`lg:`、`xl:` 斷點
- **主題變數**：自定義顏色必須在 `tailwind.config.js` 中定義
- **暗黑模式**：所有組件必須支援 `dark:` 前綴

## 插件系統開發規範

### 插件基類規範

#### BasePlugin 實現規則
- **檔案位置**：`src/plugins/core/BasePlugin.ts`
- **必須實現方法**：
  ```typescript
  abstract class BasePlugin {
    abstract readonly id: string
    abstract readonly name: string
    abstract readonly version: string
    abstract onLoad(): Promise<void>
    abstract onUnload(): Promise<void>
    abstract onActivate(): Promise<void>
    abstract onDeactivate(): Promise<void>
  }
  ```

#### 插件配置規範
- **配置檔案**：每個插件必須有 `plugin.json`
- **配置結構**：
  ```json
  {
    "id": "com.mira.plugin.example",
    "name": "Example Plugin",
    "version": "1.0.0",
    "description": "插件描述",
    "author": "作者名稱",
    "dependencies": ["com.mira.core"],
    "permissions": ["storage", "shortcuts"],
    "entry": "index.js"
  }
  ```

### 事件系統規範

#### EventBus 實現規則
- **檔案位置**：`src/plugins/core/EventBus.ts`
- **事件命名**：使用 `domain:action` 格式
  - 例如：`plugin:loaded`、`window:minimized`、`shortcut:triggered`
- **類型定義**：所有事件必須有 TypeScript 介面定義

#### 隊列系統規範
- **檔案位置**：`src/plugins/core/Queue.ts`
- **任務結構**：
  ```typescript
  interface Task {
    id: string
    priority: number
    execute: () => Promise<any>
    onSuccess?: (result: any) => void
    onError?: (error: Error) => void
  }
  ```

## 跨檔案同步規則

### 強制同步更新規範

#### 當修改 `package.json` 時必須同步
- **檢查並更新**：`src-tauri/Cargo.toml` 的版本號
- **更新檔案**：`README.md` 中的版本資訊
- **驗證依賴**：確保前後端依賴版本相容

#### 當修改插件 API 時必須同步
- **更新檔案**：`src/types/plugin.ts` 的類型定義
- **更新檔案**：`docs/plugin-api.md` 的 API 文檔
- **更新範例**：`plugins/example/` 中的範例插件

#### 當修改 Tauri 命令時必須同步
- **更新檔案**：`src/types/tauri.ts` 的前端類型定義
- **註冊命令**：在 `src-tauri/src/main.rs` 中添加命令註冊
- **更新文檔**：在相應的 `.md` 檔案中記錄 API 變更

#### 當修改組件介面時必須同步
- **更新檔案**：相關的 `types.ts` 檔案
- **更新測試**：相關的 `.spec.ts` 測試檔案
- **更新文檔**：組件使用範例和說明

## 代碼品質規範

### ESLint 規則強制執行
- **Vue 規則**：`@vue/eslint-config-typescript` 嚴格模式
- **禁用規則**：
  - `console.log` 在生產環境（使用專用日誌系統）
  - `any` 類型（使用具體類型定義）
  - 未使用的變數和導入

### Prettier 格式化規則
- **縮排**：2 個空格
- **引號**：單引號優先
- **分號**：必須使用分號
- **行寬**：80 字元

### Git 提交規範
- **提交格式**：`type(scope): description`
- **類型規範**：
  - `feat`: 新功能
  - `fix`: 錯誤修復
  - `docs`: 文檔更新
  - `style`: 代碼格式修改
  - `refactor`: 重構
  - `test`: 測試相關
  - `chore`: 構建或輔助工具的變動

## AI 決策優先級規則

### 架構決策優先級
1. **最高優先級**：保持插件系統的向後相容性
2. **高優先級**：遵循 Tauri 最佳實踐
3. **中優先級**：Vue 3 組合式 API 慣例
4. **低優先級**：代碼美化和優化

### 衝突解決規則
- **前後端衝突**：後端 Rust 邏輯優先，前端適配
- **效能與可讀性衝突**：在關鍵路徑優先效能，其他場景優先可讀性
- **第三方庫衝突**：優先使用專案現有依賴，避免引入新依賴

### 模糊需求處理
- **缺少類型定義**：創建嚴格的 TypeScript 介面
- **未指定樣式**：使用 Tailwind CSS 預設主題
- **未指定功能細節**：參考 README.md 中的對應章節

## 嚴格禁止事項

### 技術選型禁止事項
- **禁止**：使用 jQuery 或其他 DOM 操作庫
- **禁止**：在 Vue 組件中直接操作 DOM
- **禁止**：使用 Options API 撰寫新組件
- **禁止**：在前端直接訪問檔案系統（必須通過 Tauri 命令）
- **禁止**：混用不同的狀態管理方案（只使用 Pinia）

### 架構設計禁止事項
- **禁止**：跨越模組直接引用內部實現
- **禁止**：在插件中直接修改核心系統狀態
- **禁止**：繞過事件系統進行插件間通信
- **禁止**：在 Rust 端儲存前端狀態

### 代碼品質禁止事項
- **禁止**：提交未格式化的代碼
- **禁止**：使用 `// @ts-ignore` 忽略類型錯誤
- **禁止**：在生產代碼中使用 `console.log`
- **禁止**：硬編碼路徑、URL 或配置值

### 檔案操作禁止事項
- **禁止**：直接修改 `node_modules/` 中的檔案
- **禁止**：在 `src/` 中放置 Rust 代碼
- **禁止**：在 `src-tauri/` 中放置前端資源
- **禁止**：破壞既定的目錄結構約定

## 範例說明

### ✅ 正確做法範例

#### 創建新插件
```typescript
// src/plugins/my-plugin/index.ts
import { BasePlugin } from '@/plugins/core/BasePlugin'

export class MyPlugin extends BasePlugin {
  readonly id = 'com.mira.plugin.my-plugin'
  readonly name = 'My Plugin'
  readonly version = '1.0.0'
  
  async onLoad(): Promise<void> {
    // 載入邏輯
  }
  
  async onUnload(): Promise<void> {
    // 清理邏輯
  }
}
```

#### 添加 Tauri 命令
```rust
// src-tauri/src/commands/window_commands.rs
#[tauri::command]
pub async fn minimize_window(window: tauri::Window) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}
```

### ❌ 錯誤做法範例

#### 錯誤的組件定義
```vue
<!-- 錯誤：使用 Options API -->
<script lang="ts">
export default {
  data() {
    return { count: 0 }
  }
}
</script>
```

#### 錯誤的插件結構
```typescript
// 錯誤：直接修改全域狀態
export class BadPlugin {
  onLoad() {
    window.globalState = { ... } // 禁止的做法
  }
}
```

## 版本控制規範

### 分支策略
- **main**：穩定發布版本
- **develop**：開發整合分支
- **feature/**：功能開發分支
- **hotfix/**：緊急修復分支

### 合併規則
- **所有變更**：必須通過 Pull Request
- **代碼審查**：至少一人審查批准
- **自動檢查**：必須通過 ESLint、TypeScript 檢查
- **測試要求**：關鍵功能必須有對應測試

---

**最後更新**：2025-08-13
**適用版本**：Mira Launcher v1.0.0+
