var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { BasePlugin } from "../plugin-sdk";
class TestPlugin extends BasePlugin {
  constructor() {
    super(...arguments);
    // 必需的抽象属性实现
    __publicField(this, "id", "com.mira.test-plugin");
    __publicField(this, "name", "\u6D4B\u8BD5\u63D2\u4EF6");
    __publicField(this, "version", "1.0.0");
    __publicField(this, "description", "\u7528\u4E8E\u6D4B\u8BD5\u63D2\u4EF6\u7CFB\u7EDF\u529F\u80FD\u7684\u793A\u4F8B\u63D2\u4EF6\uFF0C\u5C55\u793A\u6240\u6709\u65B0\u7279\u6027");
    __publicField(this, "author", "Mira Launcher Team");
    __publicField(this, "dependencies", []);
    __publicField(this, "minAppVersion", "1.0.0");
    __publicField(this, "permissions", ["storage", "notification", "system"]);
    __publicField(this, "search_regexps", [
      "^test:.*",
      // 匹配 test: 开头的搜索
      ".*\\.(test|spec)\\.",
      // 匹配测试文件
      "demo|example|sample"
      // 匹配演示相关关键词
    ]);
    __publicField(this, "logs", {
      level: "info",
      maxEntries: 1e3,
      persist: true,
      format: "simple"
    });
    __publicField(this, "configs", {
      properties: {
        enableNotifications: {
          type: "boolean",
          default: true,
          title: "\u542F\u7528\u901A\u77E5",
          description: "\u662F\u5426\u663E\u793A\u63D2\u4EF6\u901A\u77E5\u6D88\u606F"
        },
        maxItems: {
          type: "number",
          default: 10,
          minimum: 1,
          maximum: 50,
          title: "\u6700\u5927\u9879\u76EE\u6570",
          description: "\u5355\u9875\u663E\u793A\u7684\u6700\u5927\u9879\u76EE\u6570\u91CF"
        },
        theme: {
          type: "string",
          default: "auto",
          enum: ["light", "dark", "auto"],
          title: "\u4E3B\u9898\u8BBE\u7F6E",
          description: "\u9009\u62E9\u63D2\u4EF6\u754C\u9762\u4E3B\u9898"
        }
      },
      required: [],
      defaults: {
        enableNotifications: true,
        maxItems: 10,
        theme: "auto"
      }
    });
    __publicField(this, "contextMenus", [
      {
        id: "test-action-1",
        title: "\u6D4B\u8BD5\u64CD\u4F5C1",
        contexts: ["selection"],
        icon: "pi pi-cog"
      },
      {
        id: "test-action-2",
        title: "\u6D4B\u8BD5\u64CD\u4F5C2",
        contexts: ["page"],
        icon: "pi pi-play"
      }
    ]);
    __publicField(this, "hotkeys", [
      {
        id: "test-hotkey-1",
        combination: "Ctrl+Shift+T",
        description: "\u5FEB\u901F\u6D4B\u8BD5\u529F\u80FD",
        global: true,
        handler: () => this.runQuickTest()
      },
      {
        id: "test-hotkey-2",
        combination: "Alt+T",
        description: "\u5207\u6362\u6D4B\u8BD5\u9762\u677F",
        global: false,
        handler: () => this.toggleTestPanel()
      }
    ]);
    __publicField(this, "subscriptions", [
      {
        event: "app:startup",
        handler: () => this.onAppStartup(),
        options: { once: true }
      },
      {
        event: "search:query",
        handler: (data) => this.onSearchQuery(data),
        options: { once: false }
      },
      {
        event: "grid:pageChanged",
        handler: (data) => this.onPageChanged(data),
        options: { once: false }
      }
    ]);
    __publicField(this, "notifications", {
      defaults: {
        type: "info",
        duration: 3e3,
        closable: true
      },
      templates: {
        activated: {
          title: "\u6D4B\u8BD5\u63D2\u4EF6\u5DF2\u6FC0\u6D3B",
          message: "\u63D2\u4EF6\u529F\u80FD\u73B0\u5DF2\u53EF\u7528",
          type: "success"
        },
        test_completed: {
          title: "\u6D4B\u8BD5\u5B8C\u6210",
          message: "\u6240\u6709\u6D4B\u8BD5\u5DF2\u6267\u884C\u5B8C\u6BD5",
          type: "info"
        }
      }
    });
    __publicField(this, "storage", {
      type: "localStorage",
      prefix: "test-plugin",
      encrypt: false,
      sizeLimit: 1024 * 1024
      // 1MB
    });
    __publicField(this, "queue", {
      type: "fifo",
      config: {
        concurrency: 3,
        autostart: true,
        timeout: 3e4,
        results: true
      }
    });
    __publicField(this, "builder", (options) => {
      console.log("[TestPlugin] Builder executed with options:", options);
      if (options?.api) {
        this.setupApiIntegration(options.api);
      }
      if (options?.app) {
        this.setupAppIntegration(options.app);
      }
      return { initialized: true, timestamp: Date.now() };
    });
    // 私有状态
    __publicField(this, "testData", []);
    __publicField(this, "isRunning", false);
    __publicField(this, "testConfig", {
      enableNotifications: true,
      maxItems: 10,
      theme: "auto"
    });
  }
  /**
     * 获取插件元数据
     */
  getMetadata() {
    const baseMetadata = this.metadata;
    return {
      ...baseMetadata,
      keywords: ["test", "example", "demo"],
      configSchema: {
        type: "object",
        properties: {
          enableNotifications: { type: "boolean" },
          maxItems: { type: "number", minimum: 1, maximum: 50 },
          theme: { type: "string", enum: ["light", "dark", "auto"] }
        }
      }
    };
  }
  /**
     * 插件加载生命周期
     */
  async onLoad() {
    console.log("[TestPlugin] Loading plugin...");
    await this.loadConfiguration();
    await this.initializeTestData();
    console.log("[TestPlugin] Plugin loaded successfully");
  }
  /**
     * 插件激活生命周期
     */
  async onActivate() {
    console.log("[TestPlugin] Activating plugin...");
    this.isRunning = true;
    this.registerCommands();
    this.startDataMonitoring();
    if (this.testConfig.enableNotifications) {
      this.sendNotification("info", {
        title: "\u6D4B\u8BD5\u63D2\u4EF6\u5DF2\u6FC0\u6D3B",
        message: "\u63D2\u4EF6\u529F\u80FD\u73B0\u5DF2\u53EF\u7528",
        duration: 3e3
      });
    }
    console.log("[TestPlugin] Plugin activated successfully");
  }
  /**
     * 插件停用生命周期
     */
  async onDeactivate() {
    console.log("[TestPlugin] Deactivating plugin...");
    this.isRunning = false;
    this.stopDataMonitoring();
    this.cleanup();
    console.log("[TestPlugin] Plugin deactivated successfully");
  }
  /**
     * 插件卸载生命周期
     */
  async onUnload() {
    console.log("[TestPlugin] Unloading plugin...");
    await this.saveConfiguration();
    this.testData = [];
    console.log("[TestPlugin] Plugin unloaded successfully");
  }
  /**
     * 加载配置
     */
  async loadConfiguration() {
    try {
      const storage = this.getStorage();
      if (storage && typeof storage === "object" && "get" in storage) {
        const savedConfig = await storage.get("config");
        if (savedConfig) {
          this.testConfig = { ...this.testConfig, ...savedConfig };
        }
      }
    } catch (error) {
      this.log("error", "Failed to load configuration:", error);
    }
  }
  /**
     * 保存配置
     */
  async saveConfiguration() {
    try {
      const storage = this.getStorage();
      if (storage && typeof storage === "object" && "set" in storage) {
        await storage.set("config", this.testConfig);
      }
    } catch (error) {
      this.log("error", "Failed to save configuration:", error);
    }
  }
  /**
     * 初始化测试数据
     */
  async initializeTestData() {
    this.testData = [
      {
        id: "1",
        name: "Visual Studio Code",
        path: "C:\\Users\\User\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe",
        category: "development",
        type: "app",
        icon: "vscode",
        description: "\u4EE3\u7801\u7F16\u8F91\u5668"
      },
      {
        id: "2",
        name: "Chrome Browser",
        path: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        category: "productivity",
        type: "app",
        icon: "chrome",
        description: "\u7F51\u9875\u6D4F\u89C8\u5668"
      },
      {
        id: "3",
        name: "Test Document",
        path: "D:\\Projects\\test.docx",
        category: "files",
        type: "file",
        description: "\u6D4B\u8BD5\u6587\u6863"
      }
    ];
    this.log("info", `Initialized test data with ${this.testData.length} items`);
  }
  /**
     * 注册命令
     */
  registerCommands() {
    this.registerCommand("testPlugin.action1", () => {
      this.log("info", "Test Action 1 executed");
      if (this.testConfig.enableNotifications) {
        this.sendNotification("success", {
          title: "\u64CD\u4F5C\u6210\u529F",
          message: "\u6D4B\u8BD5\u64CD\u4F5C1\u5DF2\u6267\u884C"
        });
      }
    });
    this.registerCommand("testPlugin.action2", () => {
      this.log("info", "Test Action 2 executed");
      this.openTestPanel();
    });
    this.registerCommand("testPlugin.quickTest", () => {
      this.runQuickTest();
    });
    this.registerCommand("testPlugin.togglePanel", () => {
      this.toggleTestPanel();
    });
  }
  /**
     * 注册命令（简化版本）
     */
  registerCommand(command, handler) {
    console.log(`[TestPlugin] Registered command: ${command}`);
  }
  /**
     * 开始数据监控
     */
  startDataMonitoring() {
    setInterval(() => {
      if (this.isRunning) {
        this.checkDataChanges();
      }
    }, 5e3);
  }
  /**
     * 停止数据监控
     */
  stopDataMonitoring() {
    this.log("info", "Data monitoring stopped");
  }
  /**
     * 检查数据变化
     */
  checkDataChanges() {
    const changeDetected = Math.random() > 0.8;
    if (changeDetected) {
      this.log("info", "Data change detected");
      if (this.testConfig.enableNotifications) {
        this.sendNotification("info", {
          title: "\u6570\u636E\u66F4\u65B0",
          message: "\u68C0\u6D4B\u5230\u5E94\u7528\u7A0B\u5E8F\u6570\u636E\u53D8\u5316"
        });
      }
    }
  }
  /**
     * 运行快速测试
     */
  runQuickTest() {
    this.log("info", "Running quick test...");
    const testResults = {
      passed: Math.floor(Math.random() * 10) + 5,
      failed: Math.floor(Math.random() * 3),
      total: 0
    };
    testResults.total = testResults.passed + testResults.failed;
    this.log("info", `Test completed: ${testResults.passed}/${testResults.total} passed`);
    if (this.testConfig.enableNotifications) {
      this.sendNotification(testResults.failed === 0 ? "success" : "warning", {
        title: "\u6D4B\u8BD5\u5B8C\u6210",
        message: `${testResults.passed}/${testResults.total} \u6D4B\u8BD5\u901A\u8FC7`
      });
    }
  }
  /**
     * 打开测试面板
     */
  openTestPanel() {
    this.log("info", "Opening test panel...");
  }
  /**
     * 切换测试面板
     */
  toggleTestPanel() {
    this.log("info", "Toggling test panel...");
  }
  /**
     * 事件处理器 - 应用启动
     */
  onAppStartup() {
    this.log("info", "App startup event received");
    if (this.testConfig.enableNotifications) {
      this.sendNotification("info", {
        title: "\u6D4B\u8BD5\u63D2\u4EF6",
        message: "\u5E94\u7528\u7A0B\u5E8F\u5DF2\u542F\u52A8\uFF0C\u63D2\u4EF6\u76D1\u63A7\u4E2D..."
      });
    }
  }
  /**
     * 事件处理器 - 搜索查询
     */
  onSearchQuery(query) {
    this.log("info", `Search query received: ${query}`);
    const isMatch = this.search_regexps.some((pattern) => {
      const regex = new RegExp(pattern, "i");
      return regex.test(query);
    });
    if (isMatch) {
      this.log("info", "Query matches plugin regex patterns");
      this.handlePluginSearch(query);
    }
  }
  /**
     * 事件处理器 - 页面变化
     */
  onPageChanged(pageIndex) {
    this.log("info", `Page changed to: ${pageIndex}`);
  }
  /**
     * 处理插件搜索
     */
  handlePluginSearch(query) {
    const results = this.testData.filter(
      (item) => item.name.toLowerCase().includes(query.toLowerCase()) || item.description?.toLowerCase().includes(query.toLowerCase())
    ).slice(0, this.testConfig.maxItems);
    this.log("info", `Plugin search returned ${results.length} results`);
  }
  /**
     * 设置API集成
     */
  setupApiIntegration(api) {
    this.log("info", "Setting up API integration");
  }
  /**
     * 设置应用集成
     */
  setupAppIntegration(app) {
    this.log("info", "Setting up app integration");
  }
  /**
     * 清理资源
     */
  cleanup() {
    this.log("info", "Cleaning up plugin resources");
  }
}
function createTestPlugin() {
  return new TestPlugin();
}
const metadata = {
  id: "test-plugin",
  name: "\u6D4B\u8BD5\u63D2\u4EF6",
  version: "1.0.0",
  description: "\u7528\u4E8E\u6D4B\u8BD5\u63D2\u4EF6\u7CFB\u7EDF\u529F\u80FD\u7684\u793A\u4F8B\u63D2\u4EF6",
  author: "Mira Launcher Team"
};
if (typeof module !== "undefined" && module.exports) {
  module.exports = createTestPlugin;
  module.exports.TestPlugin = TestPlugin;
  module.exports.metadata = metadata;
  module.exports.default = createTestPlugin;
}
if (typeof window !== "undefined") {
  window.TestPlugin = TestPlugin;
  window.createTestPlugin = createTestPlugin;
  window.testPluginMetadata = metadata;
  if (typeof window.__pluginInstances === "object") {
    const pluginInstance = createTestPlugin();
    window.__pluginInstances["test-plugin"] = pluginInstance;
    console.log("[TestPlugin] Exported instance to global __pluginInstances");
  }
} else if (typeof global !== "undefined") {
  global.TestPlugin = TestPlugin;
  global.createTestPlugin = createTestPlugin;
  global.testPluginMetadata = metadata;
}
