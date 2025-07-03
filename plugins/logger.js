// plugins/logger.js
import { AutonomousPlugin } from '../src/autonomous_plugin.js';

export class LoggerPlugin extends AutonomousPlugin {
  constructor() {
    super("LoggerService"); // Provide this plugin as 'LoggerService'
  }

  log(msg) {
    this.board.log("🧾 " + msg);
  }
}

export function init() {
  const instance = new LoggerPlugin();
  instance._prepare(); // Explicitly call _prepare
  return instance;
}

