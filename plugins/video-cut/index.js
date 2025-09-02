var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// plugins/video-cut/index.ts
var pluginSDK = window.__moduleCache["../plugin-sdk"];
var BasePlugin = pluginSDK?.BasePlugin;
var VideoCutPlugin = class extends BasePlugin {
  constructor() {
    super(...arguments);
    /**
     * 插件唯一標識符
     */
    __publicField(this, "id", "video-cut");
    /**
     * 插件名稱
     */
    __publicField(this, "name", "Video Cut Editor");
    /**
     * 插件版本
     */
    __publicField(this, "version", "1.0.0");
    /**
     * 插件类型
     */
    __publicField(this, "type", "app");
    /**
     * 插件描述
     */
    __publicField(this, "description", "\u5C08\u696D\u8996\u983B\u526A\u8F2F\u63D2\u4EF6\uFF0C\u652F\u6301\u7CBE\u78BA\u526A\u8F2F\u3001\u6C34\u5370\u6DFB\u52A0\u3001\u6279\u91CF\u8655\u7406\u7B49\u529F\u80FD");
    /**
     * 插件作者
     */
    __publicField(this, "author", "Mira Launcher Team");
    /**
     * 插件依賴
     */
    __publicField(this, "dependencies", ["shell:execute", "fs:read", "fs:write"]);
    /**
     * 最小應用版本要求
     */
    __publicField(this, "minAppVersion", "1.0.0");
    /**
     * 權限要求
     */
    __publicField(this, "permissions", [
      "shell:execute",
      // 執行 FFmpeg 命令
      "fs:read",
      // 讀取視頻文件
      "fs:write",
      // 寫入導出文件
      "network:request"
      // HTTP 上傳功能
    ]);
    /**
     * 搜索正則規則
     */
    __publicField(this, "search_regexps", [
      {
        title: "\u8996\u983B\u6587\u4EF6",
        regexps: ["\\.(?:mp4|mov|avi|mkv|wmv|flv|webm|m4v|3gp)$"],
        router: "/video-editor",
        runner: async () => {
          await this.openVideoEditor();
        }
      },
      {
        title: "\u8996\u983B\u526A\u8F2F",
        regexps: ["(?:video|cut|edit|trim|\u526A\u8F2F|\u8996\u983B|\u7F16\u8F91)"],
        router: "/video-editor",
        runner: async () => {
          await this.openVideoEditor();
        }
      }
    ]);
    /**
     * 日誌配置
     */
    __publicField(this, "logs", {
      level: "info"
    });
    /**
     * 插件配置定義
     */
    __publicField(this, "configs", {
      properties: {
        ffmpegPath: {
          type: "string",
          default: "",
          title: "FFmpeg \u53EF\u57F7\u884C\u6587\u4EF6\u8DEF\u5F91",
          description: "\u6307\u5B9A FFmpeg \u7A0B\u5E8F\u7684\u5B8C\u6574\u8DEF\u5F91\uFF0C\u7559\u7A7A\u5C07\u4F7F\u7528\u7CFB\u7D71 PATH"
        },
        outputDir: {
          type: "string",
          default: "",
          title: "\u9ED8\u8A8D\u8F38\u51FA\u76EE\u9304",
          description: "\u8996\u983B\u5C0E\u51FA\u7684\u9ED8\u8A8D\u4FDD\u5B58\u76EE\u9304"
        },
        maxConcurrentTasks: {
          type: "number",
          default: 2,
          minimum: 1,
          maximum: 8,
          title: "\u6700\u5927\u4E26\u767C\u4EFB\u52D9\u6578",
          description: "\u540C\u6642\u8655\u7406\u7684\u8996\u983B\u4EFB\u52D9\u6578\u91CF\u9650\u5236"
        },
        enableWatermark: {
          type: "boolean",
          default: false,
          title: "\u555F\u7528\u5168\u5C40\u6C34\u5370",
          description: "\u662F\u5426\u5728\u6240\u6709\u5C0E\u51FA\u7684\u8996\u983B\u4E2D\u6DFB\u52A0\u6C34\u5370"
        },
        thumbnailQuality: {
          type: "string",
          default: "medium",
          enum: ["low", "medium", "high"],
          title: "\u7E2E\u7565\u5716\u8CEA\u91CF",
          description: "\u751F\u6210\u7E2E\u7565\u5716\u7684\u8CEA\u91CF\u8A2D\u7F6E"
        }
      },
      defaults: {
        ffmpegPath: "",
        outputDir: "",
        maxConcurrentTasks: 2,
        enableWatermark: false,
        thumbnailQuality: "medium"
      }
    });
    /**
     * 右鍵菜單
     */
    __publicField(this, "contextMenus", [
      {
        id: "open-with-video-editor",
        title: "\u4F7F\u7528\u8996\u983B\u7DE8\u8F2F\u5668\u6253\u958B",
        contexts: ["selection"],
        icon: "pi pi-video"
      },
      {
        id: "extract-audio",
        title: "\u63D0\u53D6\u97F3\u983B",
        contexts: ["selection"],
        icon: "pi pi-volume-up"
      },
      {
        id: "generate-thumbnails",
        title: "\u751F\u6210\u7E2E\u7565\u5716",
        contexts: ["selection"],
        icon: "pi pi-images"
      }
    ]);
    /**
     * 快捷鍵配置
     */
    __publicField(this, "hotkeys", [
      {
        id: "open-video-editor",
        combination: "Ctrl+Shift+V",
        description: "\u6253\u958B\u8996\u983B\u7DE8\u8F2F\u5668",
        global: false,
        handler: () => this.openVideoEditor()
      },
      {
        id: "quick-cut",
        combination: "Ctrl+Alt+C",
        description: "\u5FEB\u901F\u526A\u8F2F",
        global: false,
        handler: () => this.quickCut()
      }
    ]);
    /**
     * 事件訂閱
     */
    __publicField(this, "subscriptions", [
      {
        event: "file:dropped",
        handler: (data) => this.onFileDropped(data),
        options: { once: false }
      },
      {
        event: "selection:changed",
        handler: (data) => this.onSelectionChanged(data),
        options: { once: false }
      }
    ]);
    /**
     * 通知配置
     */
    __publicField(this, "notifications", {
      defaults: {
        type: "info",
        duration: 3e3,
        closable: true
      },
      templates: {
        task_completed: {
          title: "\u4EFB\u52D9\u5B8C\u6210",
          message: "\u8996\u983B\u8655\u7406\u4EFB\u52D9\u5DF2\u5B8C\u6210",
          type: "success"
        },
        task_failed: {
          title: "\u4EFB\u52D9\u5931\u6557",
          message: "\u8996\u983B\u8655\u7406\u4EFB\u52D9\u57F7\u884C\u5931\u6557",
          type: "error"
        },
        export_success: {
          title: "\u5C0E\u51FA\u6210\u529F",
          message: "\u8996\u983B\u5DF2\u6210\u529F\u5C0E\u51FA\u5230\u6307\u5B9A\u4F4D\u7F6E",
          type: "success"
        }
      }
    });
    /**
     * 存儲配置
     */
    __publicField(this, "storage", {
      type: "localStorage",
      prefix: "video-cut-plugin",
      encrypt: false,
      sizeLimit: 10 * 1024 * 1024
      // 10MB
    });
    /**
     * 任務隊列配置
     */
    __publicField(this, "queue", {
      type: "fifo",
      config: {
        concurrency: 2,
        autostart: true,
        timeout: 3e5,
        // 5分鐘超時
        results: true
      }
    });
    /**
     * 插件構建器函數
     */
    __publicField(this, "builder", (options) => {
      this.log("info", "Builder executed with options:", options);
      return {
        initialized: true,
        timestamp: Date.now(),
        version: this.version
      };
    });
    // 私有狀態
    __publicField(this, "_ffmpegService", null);
    __publicField(this, "isInitialized", false);
  }
  /**
   * 插件加載生命週期方法
   */
  async onLoad() {
    try {
      this.log("info", "Loading Video Cut Plugin...");
      await this.initializeServices();
      await this.checkFFmpegEnvironment();
      this.registerComponents();
      this.setupEventListeners();
      this.isInitialized = true;
      this.log("info", "Video Cut Plugin loaded successfully");
    } catch (error) {
      this.log("error", "Failed to load Video Cut Plugin:", error);
      throw error;
    }
  }
  /**
   * 插件卸載生命週期方法
   */
  async onUnload() {
    try {
      this.log("info", "Unloading Video Cut Plugin...");
      await this.stopAllTasks();
      this.clearCache();
      this.removeEventListeners();
      this.isInitialized = false;
      this.log("info", "Video Cut Plugin unloaded successfully");
    } catch (error) {
      this.log("error", "Failed to unload Video Cut Plugin:", error);
      throw error;
    }
  }
  /**
   * 插件激活生命週期方法
   */
  async onActivate() {
    try {
      this.log("info", "Activating Video Cut Plugin...");
      await this.initializeFFmpegService();
      await this.loadComponents();
      this.registerAddEntry();
      this.registerContextMenus();
      this.registerHotkeys();
      this.log("info", "Video Cut Plugin activated successfully");
    } catch (error) {
      this.log("error", "Failed to activate Video Cut Plugin:", error);
      throw error;
    }
  }
  /**
   * 插件啟動生命週期方法
   * 當插件被啟動時調用，默認打開主頁面
   */
  async onLaunch() {
    try {
      this.log("info", "Launching Video Cut Plugin...");
      await this.openMainPage();
      this.log("info", "Video Cut Plugin launched successfully");
    } catch (error) {
      this.log("error", "Failed to launch Video Cut Plugin:", error);
      throw error;
    }
  }
  getMetadata() {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      type: this.type,
      description: this.description,
      author: this.author,
      dependencies: this.dependencies,
      minAppVersion: this.minAppVersion,
      permissions: this.permissions
    };
  }
  /**
   * 初始化核心服務
   */
  async initializeServices() {
    this.log("info", "Initializing core services...");
  }
  /**
   * 檢查 FFmpeg 環境
   */
  async checkFFmpegEnvironment() {
    this.log("info", "Checking FFmpeg environment...");
  }
  /**
   * 註冊組件
   */
  registerComponents() {
    this.log("info", "Registering components...");
  }
  /**
   * 設置事件監聽
   */
  setupEventListeners() {
    this.log("info", "Setting up event listeners...");
    if (this.api) {
      this.subscriptions?.forEach((subscription) => {
        this.api?.events.on(subscription.event, subscription.handler, subscription.options);
      });
    }
  }
  /**
   * 移除事件監聽
   */
  removeEventListeners() {
    if (this.api) {
      this.subscriptions?.forEach((subscription) => {
        this.api?.events.off(subscription.event, subscription.handler);
      });
    }
  }
  /**
   * 註冊添加入口
   */
  registerAddEntry() {
    if (this.api?.addEntry) {
      this.api.addEntry.register({
        id: "video-editor",
        label: "\u8996\u983B\u7DE8\u8F2F\u5668",
        icon: "pi pi-video",
        type: "custom",
        priority: 100,
        handler: async () => await this.openVideoEditor()
      });
    }
  }
  /**
   * 取消註冊添加入口
   */
  unregisterAddEntry() {
    if (this.api?.addEntry) {
      this.api.addEntry.unregister("video-editor");
    }
  }
  /**
   * 註冊右鍵菜單
   */
  registerContextMenus() {
    this.log("info", "Registering context menus...");
  }
  /**
   * 取消註冊右鍵菜單
   */
  unregisterContextMenus() {
    this.log("info", "Unregistering context menus...");
  }
  /**
   * 註冊快捷鍵
   */
  registerHotkeys() {
    this.log("info", "Registering hotkeys...");
  }
  /**
   * 取消註冊快捷鍵
   */
  unregisterHotkeys() {
    this.log("info", "Unregistering hotkeys...");
  }
  /**
   * 停止所有任務
   */
  async stopAllTasks() {
    this.log("info", "Stopping all tasks...");
  }
  /**
   * 清理緩存
   */
  clearCache() {
    this.log("info", "Clearing cache...");
  }
  /**
   * 打開視頻編輯器
   */
  async openVideoEditor() {
    this.log("info", "Opening video editor...");
    await this.openMainPage();
  }
  /**
   * 打開主頁面
   */
  async openMainPage() {
    try {
      this.log("info", "Opening main page...");
      if (!this.api) {
        throw new Error("Plugin API not available");
      }
      const window2 = await this.api.window.createWindow({
        title: "Video Cut Editor - \u8996\u983B\u526A\u8F2F\u7DE8\u8F2F\u5668",
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        resizable: true,
        maximizable: true,
        minimizable: true,
        center: true,
        url: "/plugins/video-cut/index.html",
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });
      this.log("info", "Main page window created successfully:", window2.id);
    } catch (error) {
      this.log("error", "Failed to open main page:", error);
      throw error;
    }
  }
  /**
   * 快速剪輯
   */
  quickCut() {
    this.log("info", "Quick cut triggered...");
  }
  /**
   * 文件拖放事件處理
   */
  onFileDropped(data) {
    this.log("info", "File dropped:", data);
  }
  /**
   * 選擇變更事件處理
   */
  onSelectionChanged(data) {
    this.log("info", "Selection changed:", data);
  }
  /**
   * 初始化 FFmpeg 服务
   */
  async initializeFFmpegService() {
    try {
      this.log("info", "Initializing FFmpeg service...");
      const shell = await window.__importModule("@tauri-apps/plugin-shell");
      if (shell) {
        this._ffmpegService = {
          isAvailable: false,
          async checkAvailability() {
            try {
              const output = await shell.Command.create("ffmpeg", ["-version"]).execute();
              return output.code === 0;
            } catch {
              return false;
            }
          },
          async execute(args) {
            return await shell.Command.create("ffmpeg", args).execute();
          }
        };
        this._ffmpegService.isAvailable = await this._ffmpegService.checkAvailability();
      }
      this.log("info", "FFmpeg service initialized successfully");
    } catch (error) {
      this.log("error", "Failed to initialize FFmpeg service:", error);
      this.log("warn", "Plugin will run with limited functionality without FFmpeg");
    }
  }
  /**
   * 動態載入組件
   */
  async loadComponents() {
    try {
      this.log("info", "Loading components...");
      this.log("info", "Components loaded successfully");
    } catch (error) {
      this.log("error", "Failed to load components:", error);
      throw error;
    }
  }
  /**
   * 日誌記錄輔助方法
   */
  log(level, message, ...args) {
    const prefix = "[VideoCut]";
    const logMessage = `${prefix} ${message}`;
    try {
      if (this.api) {
        super.log(level, message, ...args);
      } else {
        console[level](logMessage, ...args);
      }
    } catch (error) {
      console[level](logMessage, ...args);
    }
  }
};
var videoCutPlugin = new VideoCutPlugin();
if (typeof window !== "undefined") {
  if (typeof window.__pluginInstances === "object") {
    window.__pluginInstances["video-cut"] = videoCutPlugin;
    console.log("[VideoCutPlugin] Exported instance to global __pluginInstances");
  }
}
