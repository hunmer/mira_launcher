var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { BasePlugin } from "../plugin-sdk";
class SimpleTestPlugin extends BasePlugin {
  constructor() {
    super(...arguments);
    __publicField(this, "id", "simple-test-plugin");
    __publicField(this, "name", "\u7B80\u5355\u6D4B\u8BD5\u63D2\u4EF6");
    __publicField(this, "version", "1.0.0");
    __publicField(this, "description", "\u7528\u4E8E\u6D4B\u8BD5\u57FA\u672C\u63D2\u4EF6\u529F\u80FD\u7684\u7B80\u5355\u63D2\u4EF6");
    __publicField(this, "author", "Mira Launcher Team");
    __publicField(this, "dependencies", []);
    __publicField(this, "minAppVersion", "1.0.0");
    __publicField(this, "permissions", ["storage", "notification"]);
  }
  async onLoad() {
    this.log("info", "Simple test plugin loaded successfully!");
  }
  async onActivate() {
    this.log("info", "Simple test plugin activated!");
    if (this.sendNotification) {
      this.sendNotification("success", {
        title: "\u6D4B\u8BD5\u63D2\u4EF6\u5DF2\u6FC0\u6D3B",
        message: "\u7B80\u5355\u6D4B\u8BD5\u63D2\u4EF6\u73B0\u5DF2\u6B63\u5E38\u5DE5\u4F5C"
      });
    }
  }
  async onDeactivate() {
    this.log("info", "Simple test plugin deactivated");
  }
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = SimpleTestPlugin;
  module.exports.SimpleTestPlugin = SimpleTestPlugin;
  module.exports.default = SimpleTestPlugin;
}
if (typeof window !== "undefined") {
  window.SimpleTestPlugin = SimpleTestPlugin;
  window.createSimpleTestPlugin = () => new SimpleTestPlugin();
  if (typeof window.__pluginInstances === "object") {
    const pluginInstance = new SimpleTestPlugin();
    window.__pluginInstances["simple-test-plugin"] = pluginInstance;
    console.log("[SimpleTestPlugin] Exported instance to global __pluginInstances");
  }
} else if (typeof global !== "undefined") {
  global.SimpleTestPlugin = SimpleTestPlugin;
  global.createSimpleTestPlugin = () => new SimpleTestPlugin();
}
