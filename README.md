# 🌟 VoidCore Network - 静寂の器 (The Vessel of Silence)

> **"メッセージをtypeだけ見てルーティングする純粋な配達員"**  
> _中身は一切知らない。ただ確実に届ける。_
> 
> _Intent（願い）、Notice（事実）、Proposal（提案）—— すべては3つのパターンに集約される。_
> 
> **VoidCore Network v11.0 – 完全自律プラグインの世界**  
> _(5段階ライフサイクルで生き、自ら引退する)_

---

## 🌟 核心哲学: VoidCore = 静寂の器

**VoidCore**は、メッセージをtypeだけ見てルーティングする純粋な配達員です。中身は一切知りません。

### 三つの根幹原則

1. **静寂 (Silence)** - コア自身は一切の意味を知らない純粋な媒体
2. **非命令型 (Non-Imperative)** - 強制しない、提案のみ
3. **尊厳尊重 (Dignity)** - プラグインが自律判断

---

## 🚀 Features

- 🌱 **Autonomous Lifecycle** — Plugins initialize, declare their capabilities, observe the environment, and clean up themselves.
- 🧩 **Decentralized Architecture** — The Core never sends commands. It only provides a shared message board.
- 🧼 **No Global State, No Dependencies** — Every plugin is fully responsible for its own life.
- 🛠️ **Ultra-light** — Core fits in just a few lines. You can start in seconds.
- 🌐 **Browser-native** — Works entirely in JavaScript. No build tools required.

---

## 🎯 3つのメッセージ分類

すべてのコミュニケーションは、たった3つのパターンに集約されます。

### 1. Intent (意図) - 「〜してほしい」

**特徴**: 特定の役割に願いを送る (1対1通信)

```javascript
{
  type: "Intent",
  target_role: "file_explorer",  // 特定の役割を指定
  action: "file.open",
  payload: { path: "/doc.txt" }
}
```

### 2. Notice (通知) - 「〜が起きた」

**特徴**: 事実を世界に放送 (1対多通信)

```javascript
{
  type: "Notice",
  event_name: "file.saved",
  payload: { path: "/doc.txt", size: 2048 }
}
```

### 3. Proposal (提案) - 「〜しませんか」

**特徴**: 特定プラグインに提案 (1対1通信、非強制)

```javascript
{
  type: "Proposal",
  target_plugin: "VideoProcessor",
  suggestion: "pause",
  payload: { reason: "メモリ不足" }
}
```

---

## 🚀 完全自律プラグイン 5段階ライフサイクル

すべてのプラグインは、この5つの段階を経て、自律的に生き、そして引退します。

### Phase 1: Preparation (準備)
- 内部リソースの初期化
- 設定の読み込み
- UIコンポーネントの準備

### Phase 2: Debut (登場)
- 自己紹介: `provide(capability)` で能力を世界に宣言
- 他のプラグインから発見可能になる

### Phase 3: Observation (観測)
- 依存する能力を監視: `observe(capability)`
- 必要なメッセージを購読: `subscribe(type, event)`
- 世界の状態を把握

### Phase 4: Work (活動)
- 自律的な動作ループ
- メッセージの送受信
- 本来の機能を実行

### Phase 5: Retirement (引退)
- 自己判断による引退決定
- `retract(capability)` で能力を撤回
- リソースのクリーンアップ

---

## 💡 プラグイン開発ガイド

### AutonomousPlugin 基底クラス

VoidCore.jsでは、完全自律存在モデルを実現するための`AutonomousPlugin`基底クラスを提供しています。

**Key Features of `AutonomousPlugin`:**

-   **Automated Debut**: Automatically `provide`s the plugin's capability to the `CoreBulletinBoard` upon instantiation.
-   **Simplified Retirement**: Provides a `retire()` method to gracefully `retract` the plugin's capability from the board.
-   **Board Access**: Offers convenient access to `board.observe()`, `board.publish()`, and `board.subscribe()` methods.
-   **Lifecycle Hooks**: Includes an overridable `_prepare()` method for internal setup before debut.

**How to use `AutonomousPlugin`:**

Simply extend the `AutonomousPlugin` class and call `super()` with your plugin's unique capability name. Your plugin will automatically `provide` itself to the `CoreBulletinBoard`.

```js
// Example: A simple plugin extending AutonomousPlugin
import { AutonomousPlugin } from './src/autonomous_plugin.js';

export class MyAwesomePlugin extends AutonomousPlugin {
  constructor() {
    super("MyAwesomeService"); // This plugin provides 'MyAwesomeService'
    this.board.log('MyAwesomePlugin is alive!');

    // Example: Observe another service
    const logger = this.observe("LoggerService");
    if (logger) {
      logger.log("MyAwesomePlugin is using the Logger!");
    }

    // Example: Publish a Notice message
    this.publish({
      type: 'Notice',
      source: 'plugins/my-awesome-plugin/v1.0',
      event_name: 'my.awesome.event',
      payload: { data: 'some data' },
      message_id: `notice-${Date.now()}`
    });

    // Example: Subscribe to an Intent message
    this.subscribe('Intent', 'do.something.awesome', (message) => {
      this.board.log(`Received intent to do something awesome: ${JSON.stringify(message.payload)}`);
      // Perform awesome action
    });
  }

  // You can override the _prepare method for custom setup
  _prepare() {
    super._prepare(); // Always call the parent's _prepare
    this.board.log('MyAwesomePlugin is preparing its awesomeness...');
    // Add custom preparation logic here
  }

  // Call this method when the plugin needs to retire
  retireMyAwesomeService() {
    this.retire(); // Uses the base class retirement logic
  }
}

// To initialize your plugin (e.g., in main.js)
// export function init() {
//   new MyAwesomePlugin();
// }
```

### Plugin Structure

Plugins are designed around a simple "provide, observe, retract" lifecycle, reflecting the "flow of life" within VoidCore. Each plugin is a self-contained unit responsible for its own actions and interactions with the `CoreBulletinBoard`.

```js
// Example of a Plugin (simplified for conceptual understanding)
// For actual implementation, consider extending AutonomousPlugin as shown above.
export class FileExplorerPlugin {
  constructor(core) {
    core.provide("file.explorer", this);
    this.reactTo(core.observe("file.selected"));
  }

  reactTo(file) {
    if (file) console.log("Showing file:", file.name);
  }

  shutdown() {
    core.retract("file.explorer");
  }
}
```

### Recommended Vocabulary for Messages

To ensure clear and consistent communication across the VoidCore ecosystem, we recommend using the following prefixes for your message `event_name`s (for `Notice` and `Intent` types) and `suggestion`s (for `Proposal` types):

-   `Intent.*` – Wishes/Requests (what you want to happen)
-   `Notice.*` – Notifications (what has happened)
-   `Proposal.*` – Gentle suggestions to others

This vocabulary helps other developers understand the intent behind your messages and promotes a harmonious, self-organizing system.

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

## 🎮 Live Demo

**Experience VoidCore in action:** https://moe-charm.github.io/voidcore.js/

Try all 6 interactive demos showcasing autonomous plugins, message-driven architecture, and real-time collaboration!

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

### The Vision: AI-driven Self-Evolution

Beyond the current implementation, VoidCore envisions an AI residing within the core that observes and learns from plugin communications and user interactions. This AI could:

-   **Automatically mediate meanings**: Propose compatibility rules between different plugin protocols.
-   **Enable self-evolution**: Allow the system to adapt and evolve based on user context and plugin interactions, transforming into a new kind of self-evolving life form.

This perfect balance of **"Freedom"** (for plugins to create protocols) and **"Control"** (for the AI to bring order to chaos) is the essence of the VoidCore architecture.

---

## ☕ Support This Project

If VoidCore helps bring your ideas to life, consider [☕ buying me a coffee](https://coff.ee/moecharmde6) to fuel more autonomous adventures!

---

## 📄 License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.