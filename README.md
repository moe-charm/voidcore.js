# 🧠 VoidCore.js - The Autonomous Plugin System

> **"What if plugins could think for themselves?"**  
> _VoidCore.js is a minimalist and powerful system where each plugin is a self-aware actor, discovering, interacting, and retiring autonomously._

---

## 🌌 The Core Philosophy: Beyond an "App", a New "Life Form"

VoidCore is a new information infrastructure (platform) that transcends the traditional concept of an "application." It has no fixed form; it can operate as a desktop app, a background service, or anything else, as long as it's connected to the message path.

### Three Fundamental Principles:

1.  **『Silence (静寂)』**: The core itself is a pure medium, devoid of any inherent meaning.
2.  **『Demand-Driven (要求駆動)』**: It operates only when necessary, and only to the extent required.
3.  **『Void (虚無)』**: Its emptiness allows for infinite possibilities.

---

## 🚀 Features

- 🌱 **Autonomous Lifecycle** — Plugins initialize, declare their capabilities, observe the environment, and clean up themselves.
- 🧩 **Decentralized Architecture** — The Core never sends commands. It only provides a shared message board.
- 🧼 **No Global State, No Dependencies** — Every plugin is fully responsible for its own life.
- 🛠️ **Ultra-light** — Core fits in just a few lines. You can start in seconds.
- 🌐 **Browser-native** — Works entirely in JavaScript. No build tools required.

---

## 💬 Message Classification: Intent, Notice, Proposal

VoidCore.js introduces a revolutionary communication model for autonomous plugins, moving beyond traditional command-and-control. All inter-plugin communication is categorized into three elegant models, respecting the dignity and autonomy of each plugin:

1.  **Intent (意図) - "I wish for..." (Pull-based)**
    *   **Purpose**: A plugin expresses a desire for a specific role to accomplish something. It doesn't command, but rather states a wish to the world.
    *   **Example**: A text editor `Intent`s to `file.open`. Any file explorer plugin can choose to fulfill this wish.

2.  **Notice (通知) - "Something happened..." (Push-based)**
    *   **Purpose**: A plugin broadcasts a fact or an observed event to the entire world. It's not about commanding, but sharing information.
    *   **Example**: A file plugin `Notice`s that a `file.saved` event occurred. Any interested plugin can react to this fact.

3.  **Proposal (提案) - "Would you consider...?" (Respectful Suggestion)**
    *   **Purpose**: A plugin gently suggests a state change or action to another specific plugin. This is used for critical communications like plugin termination requests.
    *   **Example**: A system manager `Proposal`s to a plugin to `retire` due to a newer version being available. The plugin retains the autonomy to accept or reject.

This three-model system ensures clarity, scalability (O(1) complexity regardless of plugin count!), and philosophical alignment with the autonomous existence model.

---

## 💡 Plugin Development Guidelines

To maintain the philosophy of the Autonomous Existence Model, plugins should adhere to the following structure and communication vocabulary:

### The AutonomousPlugin Base Class

To streamline plugin development and enforce the "Complete Autonomous Existence Model," VoidCore.js provides the `AutonomousPlugin` base class. This class abstracts away the common boilerplate for plugin lifecycle management, allowing developers to focus on their plugin's unique functionality.

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

## 📄 License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.