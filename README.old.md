# 🧠 VoidCore.js - The Autonomous Plugin System

> **"What if plugins could think for themselves?"**  
> _VoidCore.js is a minimalist and powerful system where each plugin is a self-aware actor, discovering, interacting, and retiring autonomously._

---

## 🚀 Features

- 🌱 **Autonomous Lifecycle** — Plugins initialize, declare their capabilities, observe the environment, and clean up themselves.
- 🧩 **Decentralized Architecture** — The Core never sends commands. It only provides a shared message board.
- 🧼 **No Global State, No Dependencies** — Every plugin is fully responsible for its own life.
- 🛠️ **Ultra-light** — Core fits in just a few lines. You can start in seconds.
- 🌐 **Browser-native** — Works entirely in JavaScript. No build tools required.

---

## 🔧 How It Works

```js
// Core Bulletin Board (simplified)
class CoreBulletinBoard {
  constructor() {
    this.board = new Map();
  }

  provide(name, service) {
    this.board.set(name, service);
  }

  retract(name) {
    this.board.delete(name);
  }

  observe(name) {
    return this.board.get(name);
  }
}
```

---

## ⚙️ Setup and Running the Demo

This repository is designed to run entirely in the browser. While no server environment is strictly required for the core logic, you'll need a local HTTP server to test the examples due to browser security restrictions on ES module imports from `file://` URLs.

### 🌐 How to run the demo locally:

**1. Using Python's built-in HTTP server (recommended for simplicity):**

```bash
python3 -m http.server
```

**2. Or, if you have Node.js installed, using `serve`:**

```bash
npx serve .
```

Once the server is running, open your browser and navigate to:

`http://localhost:8000/examples/index.html`

---

## 🎯 Project Purpose and Vision

VoidCore.js was developed to demonstrate that a fully autonomous plugin, as a self-aware entity, can be expressed with just a few lines of JavaScript.

Unlike traditional plugin managers or event-driven systems, this mechanism achieves the **"Complete Autonomous Existence Model"** where:

- The core never issues commands.
- Plugins register themselves on the bulletin board, observe, and terminate autonomously.
- State transitions and dependency resolution are handled by the plugins themselves.

This philosophy and architecture have broad applicability beyond the browser, including embedded systems, distributed systems, and data flow processing.

---

## 📄 License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.
