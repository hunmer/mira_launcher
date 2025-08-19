var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { BasePlugin } from "../plugin-sdk";
var require_web_link_plugin = __commonJS({
  "plugins/web-link-plugin/index.ts"(exports, module) {
    class WebLinkPlugin extends BasePlugin {
      constructor() {
        super(...arguments);
        // 必需的抽象属性实现
        __publicField(this, "id", "com.mira.web-link-plugin");
        __publicField(this, "name", "\u7F51\u9875\u94FE\u63A5\u63D2\u4EF6");
        __publicField(this, "version", "1.0.0");
        __publicField(this, "description", "\u667A\u80FD\u8BC6\u522B\u548C\u5904\u7406\u7F51\u9875\u94FE\u63A5\uFF0C\u63D0\u4F9B\u591A\u79CD\u6253\u5F00\u65B9\u5F0F\u9009\u9879");
        __publicField(this, "author", "Mira Launcher Team");
        __publicField(this, "dependencies", []);
        __publicField(this, "minAppVersion", "1.0.0");
        __publicField(this, "permissions", ["shell", "storage", "notification"]);
        // 网页链接搜索入口配置
        __publicField(this, "search_regexps", [
          {
            router: "url",
            title: "\u7F51\u9875\u94FE\u63A5",
            icon: "pi pi-globe",
            tags: ["\u94FE\u63A5", "\u7F51\u9875", "URL"],
            regexps: [
              "^https?:\\/\\/",
              // http:// 或 https:// 开头
              "^www\\."
              // www. 开头
            ],
            runner: async ({ args, api }) => {
              const { query } = args;
              const url = this.normalizeUrl(query);
              console.log("\u7F51\u9875\u94FE\u63A5\u63D2\u4EF6\uFF1A\u6253\u5F00\u94FE\u63A5", url);
            }
          },
          {
            router: "domain",
            title: "\u57DF\u540D",
            icon: "pi pi-server",
            tags: ["\u57DF\u540D", "\u7F51\u7AD9"],
            regexps: [
              ".*\\.(com|org|net|edu|gov|io|cn|co\\.uk|de|fr|jp)\\b",
              // 常见域名后缀
              "\\b\\w+\\.(com|org|net|edu|gov|io)\\b"
              // 域名格式
            ],
            runner: async ({ args, api }) => {
              const { query } = args;
              const url = this.normalizeUrl(query);
              console.log("\u7F51\u9875\u94FE\u63A5\u63D2\u4EF6\uFF1A\u6253\u5F00\u57DF\u540D", url);
            }
          },
          {
            router: "localhost",
            title: "\u672C\u5730\u670D\u52A1",
            icon: "pi pi-desktop",
            tags: ["\u672C\u5730", "\u5F00\u53D1", "\u670D\u52A1\u5668"],
            regexps: [
              "localhost:\\d+",
              // localhost端口
              "\\d+\\.\\d+\\.\\d+\\.\\d+:\\d+"
              // IP地址端口
            ],
            // 本地服务地址无需额外验证，直接通过正则匹配
            runner: async ({ args, api }) => {
              const { query } = args;
              const url = this.normalizeUrl(query);
              console.log("\u7F51\u9875\u94FE\u63A5\u63D2\u4EF6\uFF1A\u6253\u5F00\u672C\u5730\u670D\u52A1", url);
            }
          }
        ]);
        __publicField(this, "logs", {
          level: "info",
          maxEntries: 500,
          persist: true,
          format: "simple"
        });
        __publicField(this, "configs", {
          properties: {
            defaultOpenMethod: {
              type: "string",
              default: "system",
              enum: ["system", "tauri-window", "custom"],
              title: "\u9ED8\u8BA4\u6253\u5F00\u65B9\u5F0F",
              description: "\u9009\u62E9\u94FE\u63A5\u7684\u9ED8\u8BA4\u6253\u5F00\u65B9\u5F0F"
            },
            customBrowser: {
              type: "string",
              default: "",
              title: "\u81EA\u5B9A\u4E49\u6D4F\u89C8\u5668",
              description: "\u6307\u5B9A\u81EA\u5B9A\u4E49\u6D4F\u89C8\u5668\u53EF\u6267\u884C\u6587\u4EF6\u8DEF\u5F84"
            },
            enableHistory: {
              type: "boolean",
              default: true,
              title: "\u542F\u7528\u5386\u53F2\u8BB0\u5F55",
              description: "\u4FDD\u5B58\u8BBF\u95EE\u7684\u7F51\u9875\u94FE\u63A5\u5386\u53F2"
            },
            maxHistoryEntries: {
              type: "number",
              default: 100,
              minimum: 10,
              maximum: 1e3,
              title: "\u5386\u53F2\u8BB0\u5F55\u6570\u91CF",
              description: "\u6700\u5927\u4FDD\u5B58\u7684\u5386\u53F2\u8BB0\u5F55\u6761\u6570"
            },
            enableNotifications: {
              type: "boolean",
              default: true,
              title: "\u542F\u7528\u901A\u77E5",
              description: "\u663E\u793A\u94FE\u63A5\u5904\u7406\u72B6\u6001\u901A\u77E5"
            }
          },
          required: [],
          defaults: {
            defaultOpenMethod: "system",
            customBrowser: "",
            enableHistory: true,
            maxHistoryEntries: 100,
            enableNotifications: true
          }
        });
        __publicField(this, "contextMenus", [
          {
            id: "open-link-system",
            title: "\u9ED8\u8BA4\u6D4F\u89C8\u5668\u6253\u5F00",
            contexts: ["selection"],
            icon: "pi pi-external-link"
          },
          {
            id: "open-link-tauri",
            title: "\u65B0\u7A97\u53E3\u6253\u5F00",
            contexts: ["selection"],
            icon: "pi pi-window-maximize"
          },
          {
            id: "copy-link",
            title: "\u590D\u5236\u94FE\u63A5",
            contexts: ["selection"],
            icon: "pi pi-copy"
          },
          {
            id: "view-history",
            title: "\u67E5\u770B\u5386\u53F2\u8BB0\u5F55",
            contexts: ["page"],
            icon: "pi pi-history"
          }
        ]);
        __publicField(this, "hotkeys", [
          {
            id: "quick-open-link",
            combination: "Ctrl+Shift+O",
            description: "\u5FEB\u901F\u6253\u5F00\u9009\u4E2D\u7684\u94FE\u63A5",
            global: true,
            handler: () => this.quickOpenSelectedLink()
          },
          {
            id: "toggle-history",
            combination: "Ctrl+H",
            description: "\u5207\u6362\u5386\u53F2\u8BB0\u5F55\u9762\u677F",
            global: false,
            handler: () => this.toggleHistoryPanel()
          }
        ]);
        __publicField(this, "subscriptions", [
          {
            event: "search:query",
            handler: (data) => this.onSearchQuery(data),
            options: { once: false }
          },
          {
            event: "selection:changed",
            handler: (data) => this.onSelectionChanged(data),
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
            link_opened: {
              title: "\u94FE\u63A5\u5DF2\u6253\u5F00",
              message: "\u7F51\u9875\u94FE\u63A5\u5DF2\u6210\u529F\u6253\u5F00",
              type: "success"
            },
            link_copied: {
              title: "\u94FE\u63A5\u5DF2\u590D\u5236",
              message: "\u94FE\u63A5\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F",
              type: "info"
            },
            error: {
              title: "\u64CD\u4F5C\u5931\u8D25",
              message: "\u94FE\u63A5\u5904\u7406\u8FC7\u7A0B\u4E2D\u53D1\u751F\u9519\u8BEF",
              type: "error"
            }
          }
        });
        __publicField(this, "storage", {
          type: "localStorage",
          prefix: "web-link-plugin",
          encrypt: false,
          sizeLimit: 2 * 1024 * 1024
          // 2MB
        });
        __publicField(this, "queue", {
          type: "fifo",
          config: {
            concurrency: 2,
            autostart: true,
            timeout: 1e4,
            results: true
          }
        });
        __publicField(this, "builder", (options) => {
          console.log("[WebLinkPlugin] Builder executed with options:", options);
          if (options?.app) {
            this.setupAppIntegration(options.app);
          }
          return { initialized: true, timestamp: Date.now() };
        });
        // 私有状态
        __publicField(this, "linkHistory", []);
        __publicField(this, "isRunning", false);
        __publicField(this, "currentSelection", "");
        __publicField(this, "pluginConfig", {
          defaultOpenMethod: "system",
          customBrowser: "",
          enableHistory: true,
          maxHistoryEntries: 100,
          enableNotifications: true
        });
      }
      /**
         * 获取插件元数据
         */
      getMetadata() {
        const baseMetadata = this.metadata;
        return {
          ...baseMetadata,
          keywords: ["web", "link", "url", "browser", "internet"],
          configSchema: {
            type: "object",
            properties: {
              defaultOpenMethod: { type: "string", enum: ["system", "tauri-window", "custom"] },
              customBrowser: { type: "string" },
              enableHistory: { type: "boolean" },
              maxHistoryEntries: { type: "number", minimum: 10, maximum: 1e3 },
              enableNotifications: { type: "boolean" }
            }
          }
        };
      }
      /**
         * 插件加载生命周期
         */
      async onLoad() {
        console.log("[WebLinkPlugin] Loading plugin...");
        await this.loadConfiguration();
        await this.loadHistory();
        console.log("[WebLinkPlugin] Plugin loaded successfully");
      }
      /**
         * 插件激活生命周期
         */
      async onActivate() {
        console.log("[WebLinkPlugin] Activating plugin...");
        console.log("[WebLinkPlugin] API status:", {
          hasApi: !!this._api,
          hasAddEntry: !!(this._api && this._api.addEntry),
          apiKeys: this._api ? Object.keys(this._api) : []
        });
        this.isRunning = true;
        this.registerCommands();
        if (this.pluginConfig.enableNotifications) {
          this.sendNotification("info", {
            title: "\u7F51\u9875\u94FE\u63A5\u63D2\u4EF6\u5DF2\u6FC0\u6D3B",
            message: "\u667A\u80FD\u94FE\u63A5\u8BC6\u522B\u529F\u80FD\u73B0\u5DF2\u53EF\u7528",
            duration: 3e3
          });
        }
        const registerAddEntry = async (retryCount = 0) => {
          try {
            if (!this._api || !this._api.addEntry) {
              if (retryCount < 3) {
                console.log(`[WebLinkPlugin] API not ready, retrying in 100ms... (attempt ${retryCount + 1}/3)`);
                setTimeout(() => registerAddEntry(retryCount + 1), 100);
                return;
              } else {
                console.warn("[WebLinkPlugin] API or addEntry not available after retries");
                return;
              }
            }
            const addEntryAPI = this._api.addEntry;
            const entryId = addEntryAPI.register({
              id: "weblink-add-url",
              label: "\u6DFB\u52A0\u7F51\u5740",
              icon: "pi pi-link",
              type: "app",
              priority: 12,
              formDefaults: { category: "productivity" },
              appType: "web-url",
              fields: {
                url: {
                  label: "\u7F51\u9875\u5730\u5740",
                  input: "url",
                  required: true,
                  placeholder: "https://example.com",
                  validation: {
                    pattern: "^https?:\\/\\/.+",
                    minLength: 7
                  }
                }
              },
              exec: async ({ fields }) => {
                const raw = String(fields.url || "");
                if (!raw) return false;
                const url = this.normalizeUrl(raw);
                await this.openLink(url, "system");
                return true;
              }
            });
            console.log(`[WebLinkPlugin] Successfully registered addEntry with ID: ${entryId}`);
          } catch (e) {
            console.warn("[WebLinkPlugin] addEntry register failed", e);
          }
        };
        await registerAddEntry();
        console.log("[WebLinkPlugin] Plugin activated successfully");
      }
      /**
         * 插件停用生命周期
         */
      async onDeactivate() {
        console.log("[WebLinkPlugin] Deactivating plugin...");
        this.isRunning = false;
        await this.saveHistory();
        console.log("[WebLinkPlugin] Plugin deactivated successfully");
      }
      /**
         * 插件卸载生命周期
         */
      async onUnload() {
        console.log("[WebLinkPlugin] Unloading plugin...");
        await this.saveConfiguration();
        this.linkHistory = [];
        console.log("[WebLinkPlugin] Plugin unloaded successfully");
      }
      /**
         * 检测文本是否为有效链接
         */
      isValidLink(text) {
        if (!text) return false;
        return this.search_regexps.some((entry) => {
          return entry.regexps.some((pattern) => {
            const regex = new RegExp(pattern, "i");
            return regex.test(text.trim());
          });
        });
      }
      /**
         * 标准化链接URL
         */
      normalizeUrl(url) {
        let normalized = url.trim();
        if (!normalized.match(/^https?:\/\//i)) {
          if (normalized.startsWith("www.") || normalized.includes(".")) {
            normalized = `https://${normalized}`;
          }
        }
        return normalized;
      }
      /**
         * 使用系统默认浏览器打开链接
         */
      async openWithSystemBrowser(url) {
        try {
          const { open } = await import("@tauri-apps/plugin-shell");
          await open(url);
          this.log("info", `Opened link with system browser: ${url}`);
          if (this.pluginConfig.enableNotifications) {
            this.sendNotification("success", {
              title: "\u94FE\u63A5\u5DF2\u6253\u5F00",
              message: "\u5DF2\u4F7F\u7528\u9ED8\u8BA4\u6D4F\u89C8\u5668\u6253\u5F00\u94FE\u63A5"
            });
          }
        } catch (error) {
          this.log("error", "Failed to open link with system browser:", error);
          if (this.pluginConfig.enableNotifications) {
            this.sendNotification("error", {
              title: "\u6253\u5F00\u5931\u8D25",
              message: "\u65E0\u6CD5\u4F7F\u7528\u9ED8\u8BA4\u6D4F\u89C8\u5668\u6253\u5F00\u94FE\u63A5"
            });
          }
          throw error;
        }
      }
      /**
         * 使用自定义浏览器打开链接
         */
      async openWithCustomBrowser(url) {
        if (!this.pluginConfig.customBrowser) {
          throw new Error("Custom browser not configured");
        }
        try {
          const { invoke } = await import("@tauri-apps/api/core");
          await invoke("execute_command", {
            command: this.pluginConfig.customBrowser,
            args: [url]
          });
          this.log("info", `Opened link with custom browser: ${url}`);
          if (this.pluginConfig.enableNotifications) {
            this.sendNotification("success", {
              title: "\u94FE\u63A5\u5DF2\u6253\u5F00",
              message: "\u5DF2\u4F7F\u7528\u81EA\u5B9A\u4E49\u6D4F\u89C8\u5668\u6253\u5F00\u94FE\u63A5"
            });
          }
        } catch (error) {
          this.log("error", "Failed to open link with custom browser:", error);
          if (this.pluginConfig.enableNotifications) {
            this.sendNotification("error", {
              title: "\u6253\u5F00\u5931\u8D25",
              message: "\u65E0\u6CD5\u4F7F\u7528\u81EA\u5B9A\u4E49\u6D4F\u89C8\u5668\u6253\u5F00\u94FE\u63A5"
            });
          }
          throw error;
        }
      }
      /**
         * 在Tauri新窗口中打开链接
         */
      async openInTauriWindow(url) {
        try {
          const { invoke } = await import("@tauri-apps/api/core");
          await invoke("create_webview_window", {
            label: `web-link-${Date.now()}`,
            url,
            title: "\u7F51\u9875\u6D4F\u89C8",
            width: 1200,
            height: 800,
            resizable: true
          });
          this.log("info", `Opened link in Tauri window: ${url}`);
          if (this.pluginConfig.enableNotifications) {
            this.sendNotification("success", {
              title: "\u94FE\u63A5\u5DF2\u6253\u5F00",
              message: "\u5DF2\u5728\u65B0\u7A97\u53E3\u4E2D\u6253\u5F00\u94FE\u63A5"
            });
          }
        } catch (error) {
          this.log("error", "Failed to open link in Tauri window:", error);
          await this.openWithSystemBrowser(url);
        }
      }
      /**
         * 根据配置打开链接
         */
      async openLink(url, method) {
        const normalizedUrl = this.normalizeUrl(url);
        const openMethod = method || this.pluginConfig.defaultOpenMethod;
        try {
          switch (openMethod) {
            case "system":
              await this.openWithSystemBrowser(normalizedUrl);
              break;
            case "tauri-window":
              await this.openInTauriWindow(normalizedUrl);
              break;
            case "custom":
              await this.openWithCustomBrowser(normalizedUrl);
              break;
            default:
              await this.openWithSystemBrowser(normalizedUrl);
          }
          if (this.pluginConfig.enableHistory) {
            await this.addToHistory(normalizedUrl);
          }
        } catch (error) {
          this.log("error", "Failed to open link:", error);
          throw error;
        }
      }
      /**
         * 复制链接到剪贴板
         */
      async copyLink(url) {
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(url);
          } else {
            const textArea = document.createElement("textarea");
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
          }
          this.log("info", `Copied link to clipboard: ${url}`);
          if (this.pluginConfig.enableNotifications) {
            this.sendNotification("info", {
              title: "\u94FE\u63A5\u5DF2\u590D\u5236",
              message: "\u94FE\u63A5\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F"
            });
          }
        } catch (error) {
          this.log("error", "Failed to copy link to clipboard:", error);
          if (this.pluginConfig.enableNotifications) {
            this.sendNotification("error", {
              title: "\u590D\u5236\u5931\u8D25",
              message: "\u65E0\u6CD5\u590D\u5236\u94FE\u63A5\u5230\u526A\u8D34\u677F"
            });
          }
        }
      }
      /**
         * 添加链接到历史记录
         */
      async addToHistory(url) {
        const entry = {
          id: Date.now().toString(),
          url,
          title: await this.getLinkTitle(url),
          visitTime: /* @__PURE__ */ new Date(),
          visitCount: 1
        };
        const existingIndex = this.linkHistory.findIndex((item) => item.url === url);
        if (existingIndex >= 0 && this.linkHistory[existingIndex]) {
          this.linkHistory[existingIndex].visitCount += 1;
          this.linkHistory[existingIndex].visitTime = /* @__PURE__ */ new Date();
        } else {
          this.linkHistory.unshift(entry);
        }
        if (this.linkHistory.length > this.pluginConfig.maxHistoryEntries) {
          this.linkHistory = this.linkHistory.slice(0, this.pluginConfig.maxHistoryEntries);
        }
        await this.saveHistory();
      }
      /**
         * 获取链接标题（简化实现）
         */
      async getLinkTitle(url) {
        try {
          const urlObj = new URL(url);
          return urlObj.hostname;
        } catch {
          return url;
        }
      }
      /**
         * 加载配置
         */
      async loadConfiguration() {
        try {
          console.log("[WebLinkPlugin] Loading configuration, API status:", {
            hasApi: !!this._api,
            apiKeys: this._api ? Object.keys(this._api) : [],
            hasGetStorage: !!(this._api && this._api.getStorage)
          });
          if (!this._api) {
            console.warn("[WebLinkPlugin] API not available in loadConfiguration, using defaults");
            return;
          }
          const storage = this.getStorage();
          console.log("[WebLinkPlugin] Storage object:", storage);
          if (storage && typeof storage === "object" && "get" in storage) {
            const savedConfig = await storage.get("config");
            if (savedConfig) {
              this.pluginConfig = { ...this.pluginConfig, ...savedConfig };
              console.log("[WebLinkPlugin] Loaded saved config:", savedConfig);
            }
          } else {
            console.log("[WebLinkPlugin] No storage available or invalid storage interface");
          }
        } catch (error) {
          console.error("[WebLinkPlugin] Failed to load configuration:", error);
        }
      }
      /**
         * 保存配置
         */
      async saveConfiguration() {
        try {
          const storage = this.getStorage();
          if (storage && typeof storage === "object" && "set" in storage) {
            await storage.set("config", this.pluginConfig);
          }
        } catch (error) {
          this.log("error", "Failed to save configuration:", error);
        }
      }
      /**
         * 加载历史记录
         */
      async loadHistory() {
        try {
          if (!this._api) {
            console.warn("[WebLinkPlugin] API not available in loadHistory, using empty history");
            return;
          }
          const storage = this.getStorage();
          if (storage && typeof storage === "object" && "get" in storage) {
            const savedHistory = await storage.get("history");
            if (savedHistory && Array.isArray(savedHistory)) {
              this.linkHistory = savedHistory;
              console.log("[WebLinkPlugin] Loaded history with", savedHistory.length, "entries");
            }
          }
        } catch (error) {
          console.error("[WebLinkPlugin] Failed to load history:", error);
        }
      }
      /**
         * 保存历史记录
         */
      async saveHistory() {
        try {
          const storage = this.getStorage();
          if (storage && typeof storage === "object" && "set" in storage) {
            await storage.set("history", this.linkHistory);
          }
        } catch (error) {
          this.log("error", "Failed to save history:", error);
        }
      }
      /**
         * 注册命令
         */
      registerCommands() {
        this.registerCommand("webLink.openSystem", (data) => {
          if (data?.url) {
            this.openLink(data.url, "system");
          } else if (this.currentSelection) {
            this.openLink(this.currentSelection, "system");
          }
        });
        this.registerCommand("webLink.openTauri", (data) => {
          if (data?.url) {
            this.openLink(data.url, "tauri-window");
          } else if (this.currentSelection) {
            this.openLink(this.currentSelection, "tauri-window");
          }
        });
        this.registerCommand("webLink.copy", (data) => {
          if (data?.url) {
            this.copyLink(data.url);
          } else if (this.currentSelection) {
            this.copyLink(this.currentSelection);
          }
        });
        this.registerCommand("webLink.viewHistory", () => {
          this.showHistoryPanel();
        });
      }
      /**
         * 注册命令（简化版本）
         */
      registerCommand(command, handler) {
        console.log(`[WebLinkPlugin] Registered command: ${command}`);
      }
      /**
         * 快速打开选中的链接
         */
      quickOpenSelectedLink() {
        if (this.currentSelection && this.isValidLink(this.currentSelection)) {
          this.openLink(this.currentSelection);
        } else {
          this.log("info", "No valid link selected");
        }
      }
      /**
         * 切换历史记录面板
         */
      toggleHistoryPanel() {
        this.log("info", "Toggling history panel...");
        this.showHistoryPanel();
      }
      /**
         * 显示历史记录面板
         */
      showHistoryPanel() {
        this.log("info", "Showing history panel...");
        console.log("Link History:", this.linkHistory);
      }
      /**
         * 事件处理器 - 搜索查询
         */
      onSearchQuery(query) {
        if (!query) return;
        this.log("info", `Search query received: ${query}`);
        if (this.isValidLink(query)) {
          this.log("info", "Query is a valid link");
          this.handleLinkDetected(query);
        }
      }
      /**
         * 事件处理器 - 选择变化
         */
      onSelectionChanged(selection) {
        this.currentSelection = selection;
        this.log("info", `Selection changed: ${selection}`);
        if (this.isValidLink(selection)) {
          this.log("info", "Selection is a valid link");
        }
      }
      /**
         * 处理检测到的链接
         */
      handleLinkDetected(link) {
        this.log("info", `Link detected: ${link}`);
      }
      /**
         * 设置应用集成
         */
      setupAppIntegration(app) {
        this.log("info", "Setting up app integration");
      }
      /**
         * 获取历史记录
         */
      getHistory() {
        return [...this.linkHistory];
      }
      /**
         * 清空历史记录
         */
      async clearHistory() {
        this.linkHistory = [];
        await this.saveHistory();
        this.log("info", "History cleared");
      }
    }
    function createWebLinkPlugin() {
      return new WebLinkPlugin();
    }
    const metadata = {
      id: "web-link-plugin",
      name: "\u7F51\u9875\u94FE\u63A5\u63D2\u4EF6",
      version: "1.0.0",
      description: "\u667A\u80FD\u8BC6\u522B\u548C\u5904\u7406\u7F51\u9875\u94FE\u63A5\uFF0C\u63D0\u4F9B\u591A\u79CD\u6253\u5F00\u65B9\u5F0F\u9009\u9879",
      author: "Mira Launcher Team"
    };
    if (typeof module !== "undefined" && module.exports) {
      module.exports = createWebLinkPlugin;
      module.exports.WebLinkPlugin = WebLinkPlugin;
      module.exports.metadata = metadata;
      module.exports.default = createWebLinkPlugin;
    }
    if (typeof window !== "undefined") {
      window.WebLinkPlugin = WebLinkPlugin;
      window.createWebLinkPlugin = createWebLinkPlugin;
      window.webLinkPluginMetadata = metadata;
      if (typeof window.__pluginInstances === "object") {
        const pluginInstance = createWebLinkPlugin();
        window.__pluginInstances["web-link-plugin"] = pluginInstance;
        console.log("[WebLinkPlugin] Exported instance to global __pluginInstances");
      }
    } else if (typeof global !== "undefined") {
      global.WebLinkPlugin = WebLinkPlugin;
      global.createWebLinkPlugin = createWebLinkPlugin;
      global.webLinkPluginMetadata = metadata;
    }
  }
});
export default require_web_link_plugin();
