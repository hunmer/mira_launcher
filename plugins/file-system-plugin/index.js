var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
const pluginSDK = window.__moduleCache["../plugin-sdk"];
const BasePlugin = pluginSDK?.BasePlugin;
class FileSystemPlugin extends BasePlugin {
  constructor() {
    super(...arguments);
    // 必需的抽象属性实现
    __publicField(this, "id", "com.mira.file-system-plugin");
    __publicField(this, "name", "\u6587\u4EF6\u7CFB\u7EDF\u63D2\u4EF6");
    __publicField(this, "version", "1.0.0");
    __publicField(this, "description", "\u667A\u80FD\u8BC6\u522B\u548C\u5904\u7406\u6587\u4EF6\u4E0E\u6587\u4EF6\u5939\u8DEF\u5F84\uFF0C\u63D0\u4F9B\u591A\u79CD\u6253\u5F00\u65B9\u5F0F\u9009\u9879");
    __publicField(this, "author", "Mira Launcher Team");
    __publicField(this, "dependencies", []);
    __publicField(this, "minAppVersion", "1.0.0");
    __publicField(this, "permissions", ["filesystem", "storage", "notification", "shell"]);
    // 文件路径搜索入口配置
    __publicField(this, "search_regexps", [
      {
        router: "file",
        title: "\u6587\u4EF6\u7CFB\u7EDF",
        icon: "pi pi-folder",
        tags: ["\u6587\u4EF6", "\u6587\u4EF6\u5939", "\u8DEF\u5F84"],
        regexps: [
          "^[A-Za-z]:[\\\\/].*",
          // Windows 绝对路径 (C:\path 或 C:/path)
          "^\\/[^/\\s]*",
          // Unix 绝对路径 (/path)
          "^~/.*",
          // Home 目录路径 (~/path)
          "^\\.{1,2}[\\\\/].*"
          // 相对路径 (./path 或 ../path)
        ],
        parser: async ({ args }) => {
          const { query } = args;
          return /^([A-Za-z]:[\\/]|\/|~\/|\.[\\/])/.test(query);
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        runner: async ({ args, api }) => {
          const { query } = args;
          console.log("\u6587\u4EF6\u7CFB\u7EDF\u63D2\u4EF6\uFF1A\u6253\u5F00\u8DEF\u5F84", query);
        }
      },
      {
        router: "file-extension",
        title: "\u6587\u4EF6\u6269\u5C55\u540D",
        icon: "pi pi-file",
        tags: ["\u6587\u4EF6\u7C7B\u578B", "\u6269\u5C55\u540D"],
        regexps: [
          ".*\\.(txt|doc|docx|pdf|xls|xlsx|ppt|pptx|jpg|png|gif|mp4|mp3|exe|msi|zip|rar|7z)$"
          // 常见文件扩展名
        ],
        parser: async ({ args }) => {
          const { query } = args;
          return /\.(txt|doc|docx|pdf|xls|xlsx|ppt|pptx|jpg|png|gif|mp4|mp3|exe|msi|zip|rar|7z)$/i.test(query);
        },
        runner: async ({ args, api }) => {
          const { query } = args;
          console.log("\u6587\u4EF6\u7CFB\u7EDF\u63D2\u4EF6\uFF1A\u6253\u5F00\u6587\u4EF6", query);
        }
      },
      {
        router: "common-folders",
        title: "\u5E38\u7528\u6587\u4EF6\u5939",
        icon: "pi pi-folder-open",
        tags: ["\u4E0B\u8F7D", "\u684C\u9762", "\u6587\u6863", "\u56FE\u7247"],
        regexps: [
          ".*[\\\\/](?:Downloads|Desktop|Documents|Pictures|Videos|Music)[\\\\/].*"
          // 常见文件夹路径
        ],
        // 这个入口没有parser，直接通过正则匹配即可
        runner: async ({ args, api }) => {
          const { query } = args;
          console.log("\u6587\u4EF6\u7CFB\u7EDF\u63D2\u4EF6\uFF1A\u6253\u5F00\u5E38\u7528\u6587\u4EF6\u5939", query);
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
          enum: ["system", "explorer", "custom"],
          title: "\u9ED8\u8BA4\u6253\u5F00\u65B9\u5F0F",
          description: "\u9009\u62E9\u6587\u4EF6\u7684\u9ED8\u8BA4\u6253\u5F00\u65B9\u5F0F"
        },
        customFileExplorer: {
          type: "string",
          default: "",
          title: "\u81EA\u5B9A\u4E49\u6587\u4EF6\u7BA1\u7406\u5668",
          description: "\u6307\u5B9A\u81EA\u5B9A\u4E49\u6587\u4EF6\u7BA1\u7406\u5668\u53EF\u6267\u884C\u6587\u4EF6\u8DEF\u5F84"
        },
        customTextEditor: {
          type: "string",
          default: "",
          title: "\u81EA\u5B9A\u4E49\u6587\u672C\u7F16\u8F91\u5668",
          description: "\u6307\u5B9A\u9ED8\u8BA4\u6587\u672C\u7F16\u8F91\u5668\u8DEF\u5F84"
        },
        enableHistory: {
          type: "boolean",
          default: true,
          title: "\u542F\u7528\u5386\u53F2\u8BB0\u5F55",
          description: "\u4FDD\u5B58\u8BBF\u95EE\u7684\u6587\u4EF6\u548C\u6587\u4EF6\u5939\u5386\u53F2"
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
          description: "\u663E\u793A\u6587\u4EF6\u64CD\u4F5C\u72B6\u6001\u901A\u77E5"
        },
        showHiddenFiles: {
          type: "boolean",
          default: false,
          title: "\u663E\u793A\u9690\u85CF\u6587\u4EF6",
          description: "\u5728\u6D4F\u89C8\u5668\u4E2D\u663E\u793A\u9690\u85CF\u6587\u4EF6\u548C\u6587\u4EF6\u5939"
        }
      },
      required: [],
      defaults: {
        defaultOpenMethod: "system",
        customFileExplorer: "",
        customTextEditor: "",
        enableHistory: true,
        maxHistoryEntries: 100,
        enableNotifications: true,
        showHiddenFiles: false
      }
    });
    __publicField(this, "contextMenus", [
      {
        id: "open-file-system",
        title: "\u7CFB\u7EDF\u9ED8\u8BA4\u6253\u5F00",
        contexts: ["selection"],
        icon: "pi pi-folder-open"
      },
      {
        id: "open-file-explorer",
        title: "\u5728\u6587\u4EF6\u7BA1\u7406\u5668\u4E2D\u663E\u793A",
        contexts: ["selection"],
        icon: "pi pi-eye"
      },
      {
        id: "open-with-editor",
        title: "\u7528\u7F16\u8F91\u5668\u6253\u5F00",
        contexts: ["selection"],
        icon: "pi pi-file-edit"
      },
      {
        id: "copy-path",
        title: "\u590D\u5236\u8DEF\u5F84",
        contexts: ["selection"],
        icon: "pi pi-copy"
      },
      {
        id: "view-file-history",
        title: "\u67E5\u770B\u6587\u4EF6\u5386\u53F2",
        contexts: ["page"],
        icon: "pi pi-history"
      }
    ]);
    __publicField(this, "hotkeys", [
      {
        id: "quick-open-file",
        combination: "Ctrl+Shift+F",
        description: "\u5FEB\u901F\u6253\u5F00\u9009\u4E2D\u7684\u6587\u4EF6\u6216\u6587\u4EF6\u5939",
        global: true,
        handler: () => this.quickOpenSelected()
      },
      {
        id: "show-in-explorer",
        combination: "Ctrl+Shift+E",
        description: "\u5728\u6587\u4EF6\u7BA1\u7406\u5668\u4E2D\u663E\u793A",
        global: true,
        handler: () => this.showInExplorer()
      },
      {
        id: "toggle-file-history",
        combination: "Ctrl+Shift+H",
        description: "\u5207\u6362\u6587\u4EF6\u5386\u53F2\u8BB0\u5F55\u9762\u677F",
        global: false,
        handler: () => this.toggleFileHistoryPanel()
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
      },
      {
        event: "file:dropped",
        handler: (data) => this.onFileDropped(data),
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
        file_opened: {
          title: "\u6587\u4EF6\u5DF2\u6253\u5F00",
          message: "\u6587\u4EF6\u5DF2\u6210\u529F\u6253\u5F00",
          type: "success"
        },
        folder_opened: {
          title: "\u6587\u4EF6\u5939\u5DF2\u6253\u5F00",
          message: "\u6587\u4EF6\u5939\u5DF2\u5728\u6587\u4EF6\u7BA1\u7406\u5668\u4E2D\u6253\u5F00",
          type: "success"
        },
        path_copied: {
          title: "\u8DEF\u5F84\u5DF2\u590D\u5236",
          message: "\u6587\u4EF6\u8DEF\u5F84\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F",
          type: "info"
        },
        file_not_found: {
          title: "\u6587\u4EF6\u672A\u627E\u5230",
          message: "\u6307\u5B9A\u7684\u6587\u4EF6\u6216\u6587\u4EF6\u5939\u4E0D\u5B58\u5728",
          type: "warning"
        },
        error: {
          title: "\u64CD\u4F5C\u5931\u8D25",
          message: "\u6587\u4EF6\u5904\u7406\u8FC7\u7A0B\u4E2D\u53D1\u751F\u9519\u8BEF",
          type: "error"
        }
      }
    });
    __publicField(this, "storage", {
      type: "localStorage",
      prefix: "file-system-plugin",
      encrypt: false,
      sizeLimit: 2 * 1024 * 1024
      // 2MB
    });
    __publicField(this, "queue", {
      type: "fifo",
      config: {
        concurrency: 3,
        autostart: true,
        timeout: 15e3,
        results: true
      }
    });
    __publicField(this, "builder", (options) => {
      console.log("[FileSystemPlugin] Builder executed with options:", options);
      if (options?.app) {
        this.setupAppIntegration(options.app);
      }
      return { initialized: true, timestamp: Date.now() };
    });
    // 私有状态
    __publicField(this, "fileHistory", []);
    __publicField(this, "isRunning", false);
    __publicField(this, "currentSelection", "");
    __publicField(this, "pluginConfig", {
      defaultOpenMethod: "system",
      customFileExplorer: "",
      customTextEditor: "",
      enableHistory: true,
      maxHistoryEntries: 100,
      enableNotifications: true,
      showHiddenFiles: false
    });
    __publicField(this, "registeredAddEntryId", null);
  }
  /**
     * 获取插件元数据
     */
  getMetadata() {
    const baseMetadata = this.metadata;
    return {
      ...baseMetadata,
      keywords: ["file", "folder", "path", "explorer", "filesystem"],
      configSchema: {
        type: "object",
        properties: {
          defaultOpenMethod: { type: "string", enum: ["system", "explorer", "custom"] },
          customFileExplorer: { type: "string" },
          customTextEditor: { type: "string" },
          enableHistory: { type: "boolean" },
          maxHistoryEntries: { type: "number", minimum: 10, maximum: 1e3 },
          enableNotifications: { type: "boolean" },
          showHiddenFiles: { type: "boolean" }
        }
      }
    };
  }
  /**
     * 插件加载生命周期
     */
  async onLoad() {
    console.log("[FileSystemPlugin] Loading plugin...");
    await this.loadConfiguration();
    await this.loadHistory();
    console.log("[FileSystemPlugin] Plugin loaded successfully");
  }
  /**
     * 插件激活生命周期
     */
  async onActivate() {
    console.log("[FileSystemPlugin] Activating plugin...");
    this.isRunning = true;
    this.registerCommands();
    if (this.pluginConfig.enableNotifications) {
      this.sendNotification("info", {
        title: "\u6587\u4EF6\u7CFB\u7EDF\u63D2\u4EF6\u5DF2\u6FC0\u6D3B",
        message: "\u667A\u80FD\u6587\u4EF6\u8DEF\u5F84\u8BC6\u522B\u529F\u80FD\u73B0\u5DF2\u53EF\u7528",
        duration: 3e3
      });
    }
    const registerAddEntry = async (retryCount = 0) => {
      try {
        if (!this._api || !this._api.addEntry) {
          if (retryCount < 3) {
            console.log(`[FileSystemPlugin] API not ready, retrying in 100ms... (attempt ${retryCount + 1}/3)`);
            setTimeout(() => registerAddEntry(retryCount + 1), 100);
            return;
          } else {
            console.warn("[FileSystemPlugin] API or addEntry not available after retries");
            return;
          }
        }
        const addEntryAPI = this._api.addEntry;
        const fileEntryId = addEntryAPI.register({
          id: "fs-add-file",
          label: "\u6DFB\u52A0\u6587\u4EF6",
          icon: "pi pi-file",
          type: "app",
          priority: 10,
          formDefaults: { category: "files" },
          appType: "file-system-file",
          fields: {
            path: {
              label: "\u6587\u4EF6\u8DEF\u5F84",
              input: "file",
              required: true,
              placeholder: "C:\\path\\to\\file.txt \u6216 /path/to/file.txt",
              validation: {
                pattern: "^.+",
                minLength: 1
              },
              filters: [
                { name: "\u6240\u6709\u6587\u4EF6", extensions: ["*"] },
                { name: "\u53EF\u6267\u884C\u6587\u4EF6", extensions: ["exe", "msi", "app", "deb", "rpm"] },
                { name: "\u6587\u6863\u6587\u4EF6", extensions: ["txt", "doc", "docx", "pdf", "md"] },
                { name: "\u56FE\u7247\u6587\u4EF6", extensions: ["jpg", "jpeg", "png", "gif", "bmp", "svg"] },
                { name: "\u97F3\u9891\u6587\u4EF6", extensions: ["mp3", "wav", "flac", "aac", "m4a"] },
                { name: "\u89C6\u9891\u6587\u4EF6", extensions: ["mp4", "avi", "mkv", "mov", "wmv"] }
              ]
            }
          },
          exec: async ({ fields }) => {
            const filePath = String(fields.path || "");
            if (!filePath) return false;
            const normalizedPath = this.normalizePath(filePath);
            await this.openPath(normalizedPath, "system");
            return true;
          }
        });
        const folderEntryId = addEntryAPI.register({
          id: "fs-add-folder",
          label: "\u6DFB\u52A0\u6587\u4EF6\u5939",
          icon: "pi pi-folder",
          type: "app",
          priority: 11,
          formDefaults: { category: "files" },
          appType: "file-system-folder",
          fields: {
            path: {
              label: "\u6587\u4EF6\u5939\u8DEF\u5F84",
              input: "path",
              required: true,
              placeholder: "C:\\path\\to\\folder \u6216 /path/to/folder",
              validation: {
                pattern: "^.+",
                minLength: 1
              }
            }
          },
          exec: async ({ fields }) => {
            const folderPath = String(fields.path || "");
            if (!folderPath) return false;
            const normalizedPath = this.normalizePath(folderPath);
            await this.openPath(normalizedPath, "explorer");
            return true;
          }
        });
        this.registeredAddEntryId = addEntryAPI.register({
          id: "fs-quick-create",
          label: "\u4ECE\u8DEF\u5F84\u5FEB\u901F\u521B\u5EFA",
          icon: "pi pi-hdd",
          type: "custom",
          priority: 19,
          handler: async () => {
            const path = prompt("\u8F93\u5165\u8DEF\u5F84(\u6587\u4EF6/\u6587\u4EF6\u5939):") || "";
            if (!path) return;
            const name = path.split(/[\\/]/).pop() || path;
            window.dispatchEvent(new CustomEvent("mira:add-app", {
              detail: {
                name,
                path,
                type: "file",
                category: "files",
                appType: this.isDirectory(path) ? "file-system-folder" : "file-system-file"
              }
            }));
          }
        });
        console.log("[FileSystemPlugin] Successfully registered addEntry entries:", {
          fileEntryId,
          folderEntryId,
          customEntryId: this.registeredAddEntryId
        });
      } catch (e) {
        console.warn("[FileSystemPlugin] addEntry register failed", e);
      }
    };
    await registerAddEntry();
    console.log("[FileSystemPlugin] Plugin activated successfully");
  }
  /**
     * 插件停用生命周期
     */
  async onDeactivate() {
    console.log("[FileSystemPlugin] Deactivating plugin...");
    this.isRunning = false;
    await this.saveHistory();
    try {
      const api = this._api;
      if (this.registeredAddEntryId && api?.addEntry) {
        api.addEntry.unregister(this.registeredAddEntryId);
      }
    } catch {
    }
    console.log("[FileSystemPlugin] Plugin deactivated successfully");
  }
  /**
     * 插件卸载生命周期
     */
  async onUnload() {
    console.log("[FileSystemPlugin] Unloading plugin...");
    await this.saveConfiguration();
    this.fileHistory = [];
    console.log("[FileSystemPlugin] Plugin unloaded successfully");
  }
  /**
     * 检测文本是否为有效文件路径
     */
  isValidPath(text) {
    if (!text) return false;
    return this.search_regexps.some((entry) => {
      return entry.regexps.some((pattern) => {
        const regex = new RegExp(pattern, "i");
        return regex.test(text.trim());
      });
    });
  }
  /**
     * 标准化文件路径
     */
  normalizePath(path) {
    let normalized = path.trim();
    if (normalized.startsWith('"') && normalized.endsWith('"') || normalized.startsWith("'") && normalized.endsWith("'")) {
      normalized = normalized.slice(1, -1);
    }
    const isWindows = navigator.userAgent.includes("Windows");
    if (isWindows) {
      normalized = normalized.replace(/\//g, "\\");
    }
    return normalized;
  }
  /**
     * 简单判断路径是否可能是目录（基于常见模式）
     */
  isDirectory(path) {
    const name = path.split(/[\\/]/).pop() || "";
    const hasExtension = /\.[a-zA-Z0-9]+$/.test(name);
    const commonFolders = ["Documents", "Downloads", "Desktop", "Pictures", "Videos", "Music", "temp", "tmp", "bin", "lib", "src", "assets"];
    const isCommonFolder = commonFolders.some((folder) => name.toLowerCase().includes(folder.toLowerCase()));
    return !hasExtension || isCommonFolder;
  }
  /**
     * 检查文件或文件夹是否存在
     */
  async pathExists(path) {
    try {
      const fs = await window.__importModule("@tauri-apps/plugin-fs");
      return await fs.exists(path);
    } catch (error) {
      this.log("error", "Failed to check if path exists:", error);
      return false;
    }
  }
  /**
     * 获取文件信息
     */
  async getFileInfo(path) {
    try {
      const fs = await window.__importModule("@tauri-apps/plugin-fs");
      const stats = await fs.stat(path);
      return {
        path,
        name: path.split(/[\\/]/).pop() || path,
        isDirectory: stats.isDirectory,
        isFile: stats.isFile,
        size: stats.size || 0,
        modified: stats.mtime ? new Date(stats.mtime) : /* @__PURE__ */ new Date()
      };
    } catch (error) {
      this.log("error", "Failed to get file info:", error);
      return null;
    }
  }
  /**
     * 使用系统默认程序打开文件或文件夹
     */
  async openWithSystem(path) {
    try {
      const opener = await window.__importModule("@tauri-apps/plugin-opener");
      await opener.openPath(path);
      this.log("info", `Opened with system default: ${path}`);
      const fileInfo = await this.getFileInfo(path);
      const isDirectory = fileInfo?.isDirectory || false;
      if (this.pluginConfig.enableNotifications) {
        this.sendNotification("success", {
          title: isDirectory ? "\u6587\u4EF6\u5939\u5DF2\u6253\u5F00" : "\u6587\u4EF6\u5DF2\u6253\u5F00",
          message: `\u5DF2\u4F7F\u7528\u9ED8\u8BA4\u7A0B\u5E8F\u6253\u5F00${isDirectory ? "\u6587\u4EF6\u5939" : "\u6587\u4EF6"}`
        });
      }
    } catch (error) {
      this.log("error", "Failed to open with system default:", error);
      if (this.pluginConfig.enableNotifications) {
        this.sendNotification("error", {
          title: "\u6253\u5F00\u5931\u8D25",
          message: "\u65E0\u6CD5\u4F7F\u7528\u9ED8\u8BA4\u7A0B\u5E8F\u6253\u5F00"
        });
      }
      throw error;
    }
  }
  /**
     * 在文件管理器中显示文件或文件夹
     */
  async showInFileExplorer(path) {
    try {
      const core = await window.__importModule("@tauri-apps/api/core");
      const userAgent = navigator.userAgent;
      if (userAgent.includes("Windows")) {
        await core.invoke("execute_command", {
          command: "explorer",
          args: [`/select,"${path}"`]
        });
      } else if (userAgent.includes("Macintosh")) {
        await core.invoke("execute_command", {
          command: "open",
          args: ["-R", path]
        });
      } else {
        const parentDir = path.replace(/[^/\\]+$/, "");
        await core.invoke("execute_command", {
          command: this.pluginConfig.customFileExplorer || "xdg-open",
          args: [parentDir]
        });
      }
      this.log("info", `Showed in file explorer: ${path}`);
      if (this.pluginConfig.enableNotifications) {
        this.sendNotification("success", {
          title: "\u5DF2\u5728\u6587\u4EF6\u7BA1\u7406\u5668\u4E2D\u663E\u793A",
          message: "\u6587\u4EF6\u4F4D\u7F6E\u5DF2\u5728\u6587\u4EF6\u7BA1\u7406\u5668\u4E2D\u663E\u793A"
        });
      }
    } catch (error) {
      this.log("error", "Failed to show in file explorer:", error);
      if (this.pluginConfig.enableNotifications) {
        this.sendNotification("error", {
          title: "\u663E\u793A\u5931\u8D25",
          message: "\u65E0\u6CD5\u5728\u6587\u4EF6\u7BA1\u7406\u5668\u4E2D\u663E\u793A\u6587\u4EF6"
        });
      }
      throw error;
    }
  }
  /**
     * 使用文本编辑器打开文件
     */
  async openWithEditor(path) {
    if (!this.pluginConfig.customTextEditor) {
      await this.openWithSystem(path);
      return;
    }
    try {
      const core = await window.__importModule("@tauri-apps/api/core");
      await core.invoke("execute_command", {
        command: this.pluginConfig.customTextEditor,
        args: [path]
      });
      this.log("info", `Opened with text editor: ${path}`);
      if (this.pluginConfig.enableNotifications) {
        this.sendNotification("success", {
          title: "\u6587\u4EF6\u5DF2\u6253\u5F00",
          message: "\u5DF2\u4F7F\u7528\u6587\u672C\u7F16\u8F91\u5668\u6253\u5F00\u6587\u4EF6"
        });
      }
    } catch (error) {
      this.log("error", "Failed to open with text editor:", error);
      await this.openWithSystem(path);
    }
  }
  /**
     * 根据配置打开文件或文件夹
     */
  async openPath(path, method) {
    const normalizedPath = this.normalizePath(path);
    const openMethod = method || this.pluginConfig.defaultOpenMethod;
    const exists = await this.pathExists(normalizedPath);
    if (!exists) {
      this.log("warn", `Path does not exist: ${normalizedPath}`);
      if (this.pluginConfig.enableNotifications) {
        this.sendNotification("warning", {
          title: "\u6587\u4EF6\u672A\u627E\u5230",
          message: "\u6307\u5B9A\u7684\u6587\u4EF6\u6216\u6587\u4EF6\u5939\u4E0D\u5B58\u5728"
        });
      }
      return;
    }
    try {
      switch (openMethod) {
        case "system":
          await this.openWithSystem(normalizedPath);
          break;
        case "explorer":
          await this.showInFileExplorer(normalizedPath);
          break;
        case "custom":
          await this.openWithEditor(normalizedPath);
          break;
        default:
          await this.openWithSystem(normalizedPath);
      }
      if (this.pluginConfig.enableHistory) {
        await this.addToHistory(normalizedPath);
      }
    } catch (error) {
      this.log("error", "Failed to open path:", error);
      throw error;
    }
  }
  /**
     * 复制文件路径到剪贴板
     */
  async copyPath(path) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(path);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = path;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      this.log("info", `Copied path to clipboard: ${path}`);
      if (this.pluginConfig.enableNotifications) {
        this.sendNotification("info", {
          title: "\u8DEF\u5F84\u5DF2\u590D\u5236",
          message: "\u6587\u4EF6\u8DEF\u5F84\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F"
        });
      }
    } catch (error) {
      this.log("error", "Failed to copy path to clipboard:", error);
      if (this.pluginConfig.enableNotifications) {
        this.sendNotification("error", {
          title: "\u590D\u5236\u5931\u8D25",
          message: "\u65E0\u6CD5\u590D\u5236\u8DEF\u5F84\u5230\u526A\u8D34\u677F"
        });
      }
    }
  }
  /**
     * 添加文件到历史记录
     */
  async addToHistory(path) {
    const fileInfo = await this.getFileInfo(path);
    if (!fileInfo) return;
    const entry = {
      id: Date.now().toString(),
      path,
      name: fileInfo.name,
      isDirectory: fileInfo.isDirectory,
      size: fileInfo.size,
      accessTime: /* @__PURE__ */ new Date(),
      accessCount: 1
    };
    const existingIndex = this.fileHistory.findIndex((item) => item.path === path);
    if (existingIndex >= 0 && this.fileHistory[existingIndex]) {
      this.fileHistory[existingIndex].accessCount += 1;
      this.fileHistory[existingIndex].accessTime = /* @__PURE__ */ new Date();
    } else {
      this.fileHistory.unshift(entry);
    }
    if (this.fileHistory.length > this.pluginConfig.maxHistoryEntries) {
      this.fileHistory = this.fileHistory.slice(0, this.pluginConfig.maxHistoryEntries);
    }
    await this.saveHistory();
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
          this.pluginConfig = { ...this.pluginConfig, ...savedConfig };
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
      const storage = this.getStorage();
      if (storage && typeof storage === "object" && "get" in storage) {
        const savedHistory = await storage.get("history");
        if (savedHistory && Array.isArray(savedHistory)) {
          this.fileHistory = savedHistory;
        }
      }
    } catch (error) {
      this.log("error", "Failed to load history:", error);
    }
  }
  /**
     * 保存历史记录
     */
  async saveHistory() {
    try {
      const storage = this.getStorage();
      if (storage && typeof storage === "object" && "set" in storage) {
        await storage.set("history", this.fileHistory);
      }
    } catch (error) {
      this.log("error", "Failed to save history:", error);
    }
  }
  /**
     * 注册命令
     */
  registerCommands() {
    this.registerCommand("fileSystem.openSystem", (data) => {
      if (data?.path) {
        this.openPath(data.path, "system");
      } else if (this.currentSelection) {
        this.openPath(this.currentSelection, "system");
      }
    });
    this.registerCommand("fileSystem.openExplorer", (data) => {
      if (data?.path) {
        this.openPath(data.path, "explorer");
      } else if (this.currentSelection) {
        this.openPath(this.currentSelection, "explorer");
      }
    });
    this.registerCommand("fileSystem.openEditor", (data) => {
      if (data?.path) {
        this.openPath(data.path, "custom");
      } else if (this.currentSelection) {
        this.openPath(this.currentSelection, "custom");
      }
    });
    this.registerCommand("fileSystem.copyPath", (data) => {
      if (data?.path) {
        this.copyPath(data.path);
      } else if (this.currentSelection) {
        this.copyPath(this.currentSelection);
      }
    });
    this.registerCommand("fileSystem.viewHistory", () => {
      this.showFileHistoryPanel();
    });
  }
  /**
     * 注册命令（简化版本）
     */
  registerCommand(command, handler) {
    console.log(`[FileSystemPlugin] Registered command: ${command}`);
  }
  /**
     * 快速打开选中的文件或文件夹
     */
  quickOpenSelected() {
    if (this.currentSelection && this.isValidPath(this.currentSelection)) {
      this.openPath(this.currentSelection);
    } else {
      this.log("info", "No valid file path selected");
    }
  }
  /**
     * 在文件管理器中显示选中项
     */
  showInExplorer() {
    if (this.currentSelection && this.isValidPath(this.currentSelection)) {
      this.openPath(this.currentSelection, "explorer");
    } else {
      this.log("info", "No valid file path selected");
    }
  }
  /**
     * 切换文件历史记录面板
     */
  toggleFileHistoryPanel() {
    this.log("info", "Toggling file history panel...");
    this.showFileHistoryPanel();
  }
  /**
     * 显示文件历史记录面板
     */
  showFileHistoryPanel() {
    this.log("info", "Showing file history panel...");
    console.log("File History:", this.fileHistory);
  }
  /**
     * 事件处理器 - 搜索查询
     */
  onSearchQuery(query) {
    if (!query) return;
    this.log("info", `Search query received: ${query}`);
    if (this.isValidPath(query)) {
      this.log("info", "Query is a valid file path");
      this.handlePathDetected(query);
    }
  }
  /**
     * 事件处理器 - 选择变化
     */
  onSelectionChanged(selection) {
    this.currentSelection = selection;
    this.log("info", `Selection changed: ${selection}`);
    if (this.isValidPath(selection)) {
      this.log("info", "Selection is a valid file path");
    }
  }
  /**
     * 事件处理器 - 文件拖放
     */
  onFileDropped(dropInfo) {
    this.log("info", `File dropped: ${dropInfo.path}`);
    if (dropInfo.path) {
      this.addToHistory(dropInfo.path);
    }
  }
  /**
     * 处理检测到的文件路径
     */
  handlePathDetected(path) {
    this.log("info", `File path detected: ${path}`);
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
    return [...this.fileHistory];
  }
  /**
     * 清空历史记录
     */
  async clearHistory() {
    this.fileHistory = [];
    await this.saveHistory();
    this.log("info", "File history cleared");
  }
  /**
     * 获取文件类型图标
     */
  getFileTypeIcon(path) {
    const extension = path.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "txt":
      case "log":
      case "md":
        return "pi pi-file";
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "bmp":
        return "pi pi-image";
      case "mp4":
      case "avi":
      case "mkv":
      case "mov":
        return "pi pi-video";
      case "mp3":
      case "wav":
      case "flac":
      case "aac":
        return "pi pi-volume-up";
      case "pdf":
        return "pi pi-file-pdf";
      case "doc":
      case "docx":
        return "pi pi-file-word";
      case "xls":
      case "xlsx":
        return "pi pi-file-excel";
      case "zip":
      case "rar":
      case "7z":
        return "pi pi-box";
      case "exe":
      case "msi":
        return "pi pi-cog";
      default:
        return "pi pi-file";
    }
  }
}
if (typeof window.__pluginInstances === "object") {
  const pluginInstance = new FileSystemPlugin();
  window.__pluginInstances["file-system-plugin"] = pluginInstance;
  console.log("[FileSystemPlugin] Exported instance to global __pluginInstances");
}
