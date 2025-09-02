var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// plugins/window-test-plugin/index.ts
var pluginSDK = window.__moduleCache["../plugin-sdk"];
var BasePlugin = pluginSDK?.BasePlugin;
var console = pluginSDK?.console || window.console;
var WindowTestPlugin = class extends BasePlugin {
  constructor() {
    super(...arguments);
    __publicField(this, "id", "window-test-plugin");
    __publicField(this, "name", "\u7A97\u53E3\u6D4B\u8BD5\u63D2\u4EF6");
    __publicField(this, "version", "1.0.0");
    __publicField(this, "description", "\u7528\u4E8E\u6D4B\u8BD5\u63D2\u4EF6\u7A97\u53E3\u7BA1\u7406\u7CFB\u7EDF\u7684\u793A\u4F8B\u63D2\u4EF6");
    __publicField(this, "author", "Mira Launcher Team");
    __publicField(this, "dependencies", []);
    __publicField(this, "permissions", []);
    __publicField(this, "minAppVersion", "1.0.0");
    // 实现必需的抽象属性
    __publicField(this, "search_regexps");
    __publicField(this, "logs");
    __publicField(this, "configs");
    __publicField(this, "contextMenus");
    __publicField(this, "hotkeys");
    __publicField(this, "subscriptions");
    __publicField(this, "notifications");
    __publicField(this, "storage");
    __publicField(this, "queue");
    __publicField(this, "builder");
    __publicField(this, "windowCount", 0);
  }
  /**
   * 插件加载生命周期方法
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async onLoad() {
    console.log("[WindowTestPlugin] \u63D2\u4EF6\u52A0\u8F7D\u5B8C\u6210");
  }
  /**
   * 插件激活生命周期方法
   */
  async onActivate() {
    console.log("[WindowTestPlugin] ===== \u63D2\u4EF6\u6FC0\u6D3B\u5F00\u59CB =====");
    if (!this.api) {
      console.error("[WindowTestPlugin] API \u672A\u521D\u59CB\u5316!");
      return;
    }
    console.log("[WindowTestPlugin] API \u68C0\u67E5:");
    console.log("  - API \u5BF9\u8C61:", !!this.api);
    console.log("  - window API:", !!this.api.window);
    console.log("  - protocol API:", !!this.api.protocol);
    console.log("[WindowTestPlugin] \u6CE8\u518C\u534F\u8BAE\u5904\u7406\u5668...");
    this.api.protocol.registerHandler("demo", (params) => {
      console.log("[WindowTestPlugin] [\u534F\u8BAE] demo \u88AB\u8C03\u7528:", params);
      this.showDemoWindow();
    });
    this.api.protocol.registerHandler("settings", (params) => {
      console.log("[WindowTestPlugin] [\u534F\u8BAE] settings \u88AB\u8C03\u7528:", params);
      this.openSettingsWindow();
    });
    this.api.protocol.registerHandler("config", (params) => {
      console.log("[WindowTestPlugin] [\u534F\u8BAE] config \u88AB\u8C03\u7528:", params);
      this.openConfigWindow();
    });
    this.api.protocol.registerHandler("help", (params) => {
      console.log("[WindowTestPlugin] [\u534F\u8BAE] help \u88AB\u8C03\u7528:", params);
      this.openHelpWindow();
    });
    console.log("[WindowTestPlugin] \u534F\u8BAE\u5904\u7406\u5668\u6CE8\u518C\u5B8C\u6210");
    console.log("[WindowTestPlugin] ===== \u63D2\u4EF6\u6FC0\u6D3B\u5B8C\u6210 =====");
  }
  /**
   * 插件停用生命周期方法
   */
  async onDeactivate() {
    console.log("[WindowTestPlugin] ===== \u63D2\u4EF6\u505C\u7528\u5F00\u59CB =====");
    try {
      await this.api?.window.closeAll();
      console.log("[WindowTestPlugin] \u6240\u6709\u7A97\u53E3\u5DF2\u5173\u95ED");
      this.api?.protocol.unregisterHandler("demo");
      this.api?.protocol.unregisterHandler("settings");
      this.api?.protocol.unregisterHandler("config");
      this.api?.protocol.unregisterHandler("help");
      console.log("[WindowTestPlugin] \u534F\u8BAE\u5904\u7406\u5668\u5DF2\u6E05\u7406");
    } catch (error) {
      console.error("[WindowTestPlugin] \u505C\u7528\u8FC7\u7A0B\u4E2D\u51FA\u9519:", error);
    }
    console.log("[WindowTestPlugin] ===== \u63D2\u4EF6\u505C\u7528\u5B8C\u6210 =====");
  }
  /**
   * 插件卸载生命周期方法
   */
  async onUnload() {
    console.log("[WindowTestPlugin] ===== \u63D2\u4EF6\u5378\u8F7D\u5F00\u59CB =====");
    try {
      await this.onDeactivate();
    } catch (error) {
      console.error("[WindowTestPlugin] \u5378\u8F7D\u8FC7\u7A0B\u4E2D\u51FA\u9519:", error);
    }
    console.log("[WindowTestPlugin] ===== \u63D2\u4EF6\u5378\u8F7D\u5B8C\u6210 =====");
  }
  /**
   * 处理插件启动事件（由 PluginWindowManager 直接调用）
   */
  async onLaunch(event) {
    console.log(this);
    console.log("[WindowTestPlugin] \u63A5\u6536\u5230\u542F\u52A8\u4E8B\u4EF6:", JSON.stringify(event, null, 2));
    console.log("[WindowTestPlugin] \u4E8B\u4EF6\u8BE6\u60C5:");
    console.log("  - pluginId:", event.pluginId);
    console.log("  - action:", event.action);
    console.log("  - route:", event.route);
    console.log("  - params:", event.params);
    console.log("  - windowOptions:", event.windowOptions);
    if (!this.api) {
      console.error("[WindowTestPlugin] API \u4E0D\u53EF\u7528\uFF0C\u65E0\u6CD5\u5904\u7406\u542F\u52A8\u4E8B\u4EF6");
      return;
    }
    console.log("[WindowTestPlugin] API \u72B6\u6001\u68C0\u67E5:");
    console.log("  - API \u5BF9\u8C61:", !!this.api);
    console.log("  - window API:", !!this.api?.window);
    console.log("  - createWindow \u65B9\u6CD5:", !!this.api?.window?.createWindow);
    const { action, route, params, windowOptions } = event;
    try {
      switch (action) {
        case "launch":
          console.log("[WindowTestPlugin] \u5904\u7406 launch action - \u9ED8\u8BA4\u6253\u5F00\u4E3B\u9875\u9762");
          await this.openMainPage({ route, ...params, ...windowOptions });
          break;
        case "settings":
          console.log("[WindowTestPlugin] \u5904\u7406 settings action");
          await this.openSettingsPage({ route, ...params, ...windowOptions });
          break;
        case "config":
        case "configure":
          console.log("[WindowTestPlugin] \u5904\u7406 config/configure action");
          await this.openConfigPage({ route, ...params, ...windowOptions });
          break;
        case "help":
          console.log("[WindowTestPlugin] \u5904\u7406 help action");
          await this.openHelpPage({ route, ...params, ...windowOptions });
          break;
        case "homepage":
        case "main":
          console.log("[WindowTestPlugin] \u5904\u7406 homepage/main action");
          await this.openMainPage({ route, ...params, ...windowOptions });
          break;
        case "test":
          console.log("[WindowTestPlugin] \u5904\u7406 test action - \u8FD0\u884C\u6240\u6709\u529F\u80FD\u6D4B\u8BD5");
          await this.testAllFeatures();
          break;
        default:
          console.log(`[WindowTestPlugin] \u5904\u7406\u672A\u77E5 action: ${action}`);
          if (windowOptions && Object.keys(windowOptions).length > 0) {
            console.log("[WindowTestPlugin] \u521B\u5EFA\u81EA\u5B9A\u4E49\u7A97\u53E3");
            await this.createCustomWindow(action, { route, ...params, ...windowOptions });
          } else if (route) {
            console.log("[WindowTestPlugin] \u5C1D\u8BD5\u5BFC\u822A\u5230\u8DEF\u7531:", route);
            await this.navigateToRoute(route, params);
          } else {
            console.log("[WindowTestPlugin] \u9ED8\u8BA4\u6253\u5F00\u4E3B\u9875\u9762");
            await this.openMainPage({ route, ...params });
          }
          break;
      }
      console.log(`[WindowTestPlugin] \u6210\u529F\u5904\u7406\u542F\u52A8\u4E8B\u4EF6 action: ${action}`);
    } catch (error) {
      console.error(`[WindowTestPlugin] \u5904\u7406\u542F\u52A8\u4E8B\u4EF6\u5931\u8D25 action: ${action}`, error);
      throw error;
    }
  }
  /**
   * 创建自定义窗口
   */
  async createCustomWindow(action, options) {
    console.log(`[WindowTestPlugin] \u521B\u5EFA\u81EA\u5B9A\u4E49\u7A97\u53E3: ${action}`, options);
    if (!this.api) {
      console.error("[WindowTestPlugin] API \u4E0D\u53EF\u7528\uFF0C\u65E0\u6CD5\u521B\u5EFA\u81EA\u5B9A\u4E49\u7A97\u53E3");
      return;
    }
    try {
      const windowOptions = {
        title: `${this.name} - ${action}`,
        width: options?.width || 800,
        height: options?.height || 600,
        html: `
          <!DOCTYPE html>
          <html lang="zh-CN">
          <head>
            <meta charset="UTF-8">
            <title>${action} - ${this.name}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; }
              .action { font-size: 24px; font-weight: bold; color: #333; }
              .options { margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>\u63D2\u4EF6\u7A97\u53E3\u6D4B\u8BD5</h1>
              <div class="action">Action: ${action}</div>
              <div class="options">
                <h3>\u9009\u9879:</h3>
                <pre>${JSON.stringify(options, null, 2)}</pre>
              </div>
            </div>
          </body>
          </html>
        `
      };
      const window2 = await this.api?.window.createWindow(windowOptions);
      console.log(`[WindowTestPlugin] \u81EA\u5B9A\u4E49\u7A97\u53E3\u5DF2\u521B\u5EFA: ${action}`, window2?.id);
      return window2;
    } catch (error) {
      console.error(`[WindowTestPlugin] \u521B\u5EFA\u81EA\u5B9A\u4E49\u7A97\u53E3\u5931\u8D25: ${action}`, error);
      throw error;
    }
  }
  /**
   * 打开设置页面
   */
  async openSettingsPage(options) {
    console.log("[WindowTestPlugin] openSettingsPage \u88AB\u8C03\u7528\uFF0C\u53C2\u6570:", options);
    if (!this.api) {
      console.error("[WindowTestPlugin] API \u4E0D\u53EF\u7528\uFF0C\u65E0\u6CD5\u521B\u5EFA\u8BBE\u7F6E\u7A97\u53E3");
      return;
    }
    try {
      const windowConfig = {
        title: "\u63D2\u4EF6\u8BBE\u7F6E",
        width: 600,
        height: 400,
        html: `
          <!DOCTYPE html>
          <html lang="zh-CN">
          <head>
            <meta charset="UTF-8">
            <title>\u63D2\u4EF6\u8BBE\u7F6E - ${this.name}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; }
              .title { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 20px; }
              .options { padding: 15px; background: #f5f5f5; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="title">\u63D2\u4EF6\u8BBE\u7F6E</div>
              <div class="options">
                <h3>\u8BBE\u7F6E\u9009\u9879:</h3>
                <pre>${JSON.stringify(options, null, 2)}</pre>
              </div>
            </div>
          </body>
          </html>
        `
      };
      console.log("[WindowTestPlugin] \u521B\u5EFA\u8BBE\u7F6E\u7A97\u53E3\uFF0C\u914D\u7F6E:", windowConfig);
      const window2 = await this.api?.window.createWindow(windowConfig);
      console.log("[WindowTestPlugin] \u8BBE\u7F6E\u7A97\u53E3\u5DF2\u521B\u5EFA:", window2?.id);
      return window2;
    } catch (error) {
      console.error("[WindowTestPlugin] \u521B\u5EFA\u8BBE\u7F6E\u7A97\u53E3\u5931\u8D25:", error);
      throw error;
    }
  }
  /**
   * 打开配置页面
   */
  async openConfigPage(options) {
    console.log("[WindowTestPlugin] openConfigPage \u88AB\u8C03\u7528\uFF0C\u53C2\u6570:", options);
    if (!this.api) {
      console.error("[WindowTestPlugin] API \u4E0D\u53EF\u7528\uFF0C\u65E0\u6CD5\u521B\u5EFA\u914D\u7F6E\u7A97\u53E3");
      return;
    }
    try {
      const windowConfig = {
        title: "\u63D2\u4EF6\u914D\u7F6E",
        width: 700,
        height: 500,
        html: `
          <!DOCTYPE html>
          <html lang="zh-CN">
          <head>
            <meta charset="UTF-8">
            <title>\u63D2\u4EF6\u914D\u7F6E - ${this.name}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .container { max-width: 700px; margin: 0 auto; }
              .title { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 20px; }
              .options { padding: 15px; background: #f5f5f5; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="title">\u63D2\u4EF6\u914D\u7F6E</div>
              <div class="options">
                <h3>\u914D\u7F6E\u9009\u9879:</h3>
                <pre>${JSON.stringify(options, null, 2)}</pre>
              </div>
            </div>
          </body>
          </html>
        `
      };
      console.log("[WindowTestPlugin] \u521B\u5EFA\u914D\u7F6E\u7A97\u53E3\uFF0C\u914D\u7F6E:", windowConfig);
      const window2 = await this.api?.window.createWindow(windowConfig);
      console.log("[WindowTestPlugin] \u914D\u7F6E\u7A97\u53E3\u5DF2\u521B\u5EFA:", window2?.id);
      return window2;
    } catch (error) {
      console.error("[WindowTestPlugin] \u521B\u5EFA\u914D\u7F6E\u7A97\u53E3\u5931\u8D25:", error);
      throw error;
    }
  }
  /**
   * 打开帮助页面
   */
  async openHelpPage(options) {
    console.log("[WindowTestPlugin] openHelpPage \u88AB\u8C03\u7528\uFF0C\u53C2\u6570:", options);
    if (!this.api) {
      console.error("[WindowTestPlugin] API \u4E0D\u53EF\u7528\uFF0C\u65E0\u6CD5\u521B\u5EFA\u5E2E\u52A9\u7A97\u53E3");
      return;
    }
    try {
      const windowConfig = {
        title: "\u63D2\u4EF6\u5E2E\u52A9",
        width: 900,
        height: 700,
        html: `
          <!DOCTYPE html>
          <html lang="zh-CN">
          <head>
            <meta charset="UTF-8">
            <title>\u63D2\u4EF6\u5E2E\u52A9 - ${this.name}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .container { max-width: 800px; margin: 0 auto; }
              .title { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 20px; }
              .options { padding: 15px; background: #f5f5f5; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="title">\u63D2\u4EF6\u5E2E\u52A9</div>
              <div class="options">
                <h3>\u5E2E\u52A9\u9009\u9879:</h3>
                <pre>${JSON.stringify(options, null, 2)}</pre>
              </div>
            </div>
          </body>
          </html>
        `
      };
      console.log("[WindowTestPlugin] \u521B\u5EFA\u5E2E\u52A9\u7A97\u53E3\uFF0C\u914D\u7F6E:", windowConfig);
      const window2 = await this.api?.window.createWindow(windowConfig);
      console.log("[WindowTestPlugin] \u5E2E\u52A9\u7A97\u53E3\u5DF2\u521B\u5EFA:", window2?.id);
      return window2;
    } catch (error) {
      console.error("[WindowTestPlugin] \u521B\u5EFA\u5E2E\u52A9\u7A97\u53E3\u5931\u8D25:", error);
      throw error;
    }
  }
  /**
   * 打开主页面
   */
  async openMainPage(options) {
    console.log("[WindowTestPlugin] openMainPage \u88AB\u8C03\u7528\uFF0C\u53C2\u6570:", options);
    if (!this.api) {
      console.error("[WindowTestPlugin] API \u4E0D\u53EF\u7528\uFF0C\u65E0\u6CD5\u521B\u5EFA\u4E3B\u7A97\u53E3");
      return;
    }
    try {
      const windowConfig = {
        title: "\u7A97\u53E3\u6D4B\u8BD5\u63D2\u4EF6",
        width: 700,
        height: 500,
        html: `
          <!DOCTYPE html>
          <html lang="zh-CN">
          <head>
            <meta charset="UTF-8">
            <title>\u7A97\u53E3\u6D4B\u8BD5\u63D2\u4EF6 - ${this.name}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .container { max-width: 650px; margin: 0 auto; }
              .title { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 20px; }
              .options { padding: 15px; background: #f5f5f5; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="title">\u7A97\u53E3\u6D4B\u8BD5\u63D2\u4EF6\u4E3B\u9875</div>
              <div class="options">
                <h3>\u542F\u52A8\u9009\u9879:</h3>
                <pre>${JSON.stringify(options, null, 2)}</pre>
              </div>
            </div>
          </body>
          </html>
        `
      };
      console.log("[WindowTestPlugin] \u521B\u5EFA\u4E3B\u7A97\u53E3\uFF0C\u914D\u7F6E:", windowConfig);
      console.log("[WindowTestPlugin] \u51C6\u5907\u8C03\u7528 createWindow API...");
      console.log("[WindowTestPlugin] API \u5BF9\u8C61\u5B58\u5728:", this.api);
      console.log("[WindowTestPlugin] window API \u5B58\u5728:", this.api?.window);
      console.log("[WindowTestPlugin] createWindow \u65B9\u6CD5\u5B58\u5728:", this.api?.window?.createWindow);
      const window2 = await this.api?.window.createWindow(windowConfig);
      console.log("[WindowTestPlugin] createWindow \u8FD4\u56DE\u7ED3\u679C:", window2);
      console.log("[WindowTestPlugin] \u4E3B\u7A97\u53E3\u5DF2\u521B\u5EFA:", window2?.id);
      return window2;
    } catch (error) {
      console.error("[WindowTestPlugin] \u521B\u5EFA\u4E3B\u7A97\u53E3\u5931\u8D25:", error);
      throw error;
    }
  }
  /**
   * 显示模态窗口
   */
  async showConfirmModal(message, onConfirm) {
    try {
      const result = await this.api?.window.showModal({
        title: "\u786E\u8BA4\u64CD\u4F5C",
        content: message,
        buttons: [
          { label: "\u786E\u8BA4", action: "confirm", primary: true },
          { label: "\u53D6\u6D88", action: "cancel" }
        ]
      });
      if (result === "confirm" && onConfirm) {
        onConfirm();
      }
      return result;
      console.log("[WindowTestPlugin] \u786E\u8BA4\u6A21\u6001\u7A97\u53E3\u5DF2\u663E\u793A");
    } catch (error) {
      console.error("[WindowTestPlugin] \u663E\u793A\u6A21\u6001\u7A97\u53E3\u5931\u8D25:", error);
    }
  }
  /**
   * 导航到指定路由
   */
  async navigateToRoute(route, params) {
    try {
      await this.api?.protocol.navigate(this.id, route, params);
      console.log("[WindowTestPlugin] \u5BFC\u822A\u5230\u8DEF\u7531:", route, params);
    } catch (error) {
      console.error("[WindowTestPlugin] \u5BFC\u822A\u5931\u8D25:", error);
    }
  }
  /**
   * 测试所有窗口功能
   */
  async testAllFeatures() {
    console.log("[WindowTestPlugin] \u5F00\u59CB\u6D4B\u8BD5\u6240\u6709\u7A97\u53E3\u529F\u80FD");
    try {
      await this.openSettingsPage({ theme: "dark" });
      setTimeout(async () => {
        await this.openConfigPage({ advanced: true });
      }, 1e3);
      setTimeout(async () => {
        await this.openHelpPage({ section: "getting-started" });
      }, 2e3);
      setTimeout(async () => {
        await this.showConfirmModal("\u8FD9\u662F\u4E00\u4E2A\u6D4B\u8BD5\u786E\u8BA4\u6D88\u606F");
      }, 3e3);
      console.log("[WindowTestPlugin] \u6240\u6709\u6D4B\u8BD5\u5DF2\u542F\u52A8");
    } catch (error) {
      console.error("[WindowTestPlugin] \u6D4B\u8BD5\u5931\u8D25:", error);
    }
  }
  /**
   * 显示演示窗口
   */
  async showDemoWindow() {
    await this.createCustomWindow("demo", { width: 600, height: 400 });
  }
  /**
   * 打开设置窗口
   */
  async openSettingsWindow() {
    await this.openSettingsPage({ theme: "default" });
  }
  /**
   * 打开配置窗口
   */
  async openConfigWindow() {
    await this.openConfigPage({ mode: "basic" });
  }
  /**
   * 打开帮助窗口
   */
  async openHelpWindow() {
    await this.openHelpPage({ section: "overview" });
  }
};
function createPlugin() {
  return new WindowTestPlugin();
}
var metadata = {
  id: "window-test-plugin",
  name: "\u7A97\u53E3\u6D4B\u8BD5\u63D2\u4EF6",
  version: "1.0.0",
  description: "\u7528\u4E8E\u6D4B\u8BD5\u63D2\u4EF6\u7A97\u53E3\u7BA1\u7406\u7CFB\u7EDF\u7684\u793A\u4F8B\u63D2\u4EF6",
  author: "Mira Launcher Team",
  type: "app"
};
var windowObj = window;
if (typeof windowObj.__pluginInstances === "object") {
  const pluginInstance = new WindowTestPlugin();
  windowObj.__pluginInstances["window-test-plugin"] = pluginInstance;
  console.log("[WindowTestPlugin] Exported instance to global __pluginInstances");
}
export {
  WindowTestPlugin,
  createPlugin,
  metadata
};
