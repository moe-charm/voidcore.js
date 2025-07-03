// plugins/demo.js
import { AutonomousPlugin } from '../src/autonomous_plugin.js';

export class DemoPlugin extends AutonomousPlugin {
  constructor() {
    super("DemoService"); // Provide this plugin as 'DemoService'
    setTimeout(() => this.run(), 500); // simulate delay
  }

  run() {
    let logger = this.observe("LoggerService");
    if (logger) {
      logger.log("📣 Hello from DemoPlugin");
    } else {
      this.board.log("⚠️ LoggerService not found");
    }
  }

  destroy() {
    this.retire(); // Use the base class retire method
  }
}

export function init() {
  const instance = new DemoPlugin();
  instance._prepare(); // Explicitly call _prepare
  return instance;
}

