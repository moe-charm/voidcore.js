// demo/test_split.js

// --- src/core.js ---
class CoreBulletinBoard {
  constructor() {
    this.board = new Map();
    this.logElement = null;
  }

  setLogElement(element) {
    this.logElement = element;
  }

  log(msg) {
    if (this.logElement) {
      this.logElement.innerHTML += msg + "<br>";
    } else {
      console.log(msg);
    }
  }

  provide(cap, val) {
    this.board.set(cap, val);
    this.log(`📌 provide: ${cap}`);
  }

  retract(cap) {
    this.board.delete(cap);
    this.log(`❌ retract: ${cap}`);
  }

  observe(cap) {
    return this.board.get(cap);
  }
}
const board = new CoreBulletinBoard();

// --- plugins/logger.js ---
class LoggerPlugin {
  constructor() {
    this.board = board;
    this.board.provide("LoggerService", this);
  }

  log(msg) {
    this.board.log("🧾 " + msg);
  }
}

// --- plugins/demo.js ---
class DemoPlugin {
  constructor() {
    this.board = board;
    this.prepare();
    this.provide_self();
    setTimeout(() => this.run(), 500);
  }

  prepare() {
    this.board.log("🛠️ Plugin prepared");
  }

  provide_self() {
    this.board.provide("DemoService", this);
  }

  run() {
    let logger = this.board.observe("LoggerService");
    if (logger) {
      logger.log("📣 Hello from DemoPlugin");
    } else {
      this.board.log("⚠️ LoggerService not found");
    }
  }

  destroy() {
    this.board.retract("DemoService");
    this.board.log("👋 Plugin destroyed");
  }
}

// --- main logic ---
window.addEventListener('DOMContentLoaded', () => {
  const logElement = document.getElementById('log');
  board.setLogElement(logElement);

  new LoggerPlugin();
  const plugin = new DemoPlugin();

  setTimeout(() => plugin.destroy(), 3000);
});
