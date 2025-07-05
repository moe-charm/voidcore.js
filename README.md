# 🌟 VoidCore.js v14.0 - Pure Message System

> **「すべての存在は、メッセージで生まれ、メッセージで終わる」**  
> _セリンの大改革完了 - 基底クラス継承完全排除！_

**Latest: v14.0 - Pure Message System** 🚀

[![GitHub Pages](https://img.shields.io/badge/Demo-GitHub%20Pages-blue)](https://moe-charm.github.io/voidcore.js/)
[![JavaScript](https://img.shields.io/badge/Language-JavaScript-yellow)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![MIT License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

---

## 🎯 What is VoidCore?

**VoidCore** is a **pure message-based system** that enables beautiful plugin communication without inheritance. Think of it as a **"postal service"** for your application:

- 🏛️ **VoidCore** = Postal office that routes messages
- 🤖 **Plugins** = Customers who send and receive mail
- 📮 **Messages** = Letters with specific types (Notice, Request, Response, Proposal)
- 📋 **Subscribe** = Write on bulletin board "I want this type of mail"

---

## 📮 Try It Now - Super Beginner Friendly!

**New to VoidCore?** Start with our interactive demo:

🎯 **[📮 Simple VoidCore Demo!](https://moe-charm.github.io/voidcore.js/examples/voidcore-demo-visual.html)**

Watch plugins talk to each other in real-time! See exactly which functions are called and how messages flow through the system.

---

## 🚀 Quick Start

### Installation
```bash
git clone https://github.com/moe-charm/voidcore.js
cd voidcore-js
# Open examples/index.html in your browser - no build required!
```

### Basic Usage (v14.0 Pure System)
```javascript
import { voidCore, Message, createPlugin } from './src/index.js'

// Create a plugin (no inheritance!)
const myPlugin = createPlugin({
  pluginId: 'my-awesome-plugin',
  autoHealth: true
}, {
  async run() {
    await this.initialize();
    
    // Listen for messages
    this.on('Notice', 'user.login', (msg) => {
      console.log('User logged in:', msg.payload.userId);
    });
    
    // Send messages
    await this.notice('plugin.ready', {
      timestamp: Date.now()
    });
  }
});

// Start the plugin
await myPlugin.run();
```

---

## 🌟 Serin's Great Reform (v14.0)

### ✅ What Changed
- **❌ Base Class Inheritance** → **✅ Pure Composition**
- **❌ Forced Lifecycle** → **✅ Optional Methods**
- **❌ Type Constraints** → **✅ Message-based Cooperation**
- **❌ Complex Code** → **✅ "Pleasant from the Start" Code**

### 🎭 Before vs After

**Before (Inheritance Hell):**
```javascript
class MyPlugin extends AutonomousPlugin {
  constructor() {
    super('my-plugin');  // Required base class
  }
  
  async _prepare() { /* Forced implementation */ }
  async _work() { /* Forced lifecycle */ }
}
```

**After (Pure Beauty):**
```javascript
const myPlugin = createPlugin({
  pluginId: 'my-plugin'
}, {
  // Complete freedom - implement what you need
  async run() {
    await this.initialize();  // Optional
    // Your logic here
  }
});
```

---

## 📬 Message Types

VoidCore uses four clear message types for all communication:

### 1. Notice - "Something happened" (1-to-many)
```javascript
await plugin.notice('user.login', {
  userId: 123,
  timestamp: Date.now()
});
```

### 2. IntentRequest - "Please do X" (1-to-1)
```javascript
const request = Message.intentRequest('file_manager', 'file.open', {
  path: '/documents/readme.txt'
});
await voidCore.publish(request);
```

### 3. IntentResponse - "X completed" (1-to-1)
```javascript
const response = Message.intentResponse('file.open', {
  status: 'success',
  content: 'File content here...'
});
```

### 4. Proposal - "Shall we do X?" (1-to-1, non-forceful)
```javascript
await plugin.propose('backup_manager', 'system.backup', {
  action: 'Create daily backup',
  estimatedTime: 30000
});
```

---

## 🎮 Live Demos

Experience VoidCore in action:

### 🎯 **For Beginners**
- **📮 [Simple VoidCore Demo](https://moe-charm.github.io/voidcore.js/examples/voidcore-demo-visual.html)** - Interactive postal service visualization
- **🌌 [Galaxy Viewer](https://moe-charm.github.io/voidcore.js/examples/legacy/galaxy-viewer-simple.html)** - Beautiful space physics

### 🚀 **Advanced Examples**  
- **🌟 [Message City](https://moe-charm.github.io/voidcore.js/examples/message-city-modern.html)** - Pure v14.0 system with traffic simulation
- **💓 [Heart Transplant Demo](https://moe-charm.github.io/voidcore.js/challenge/voidcore-v13-transport-demo.html)** - Transport swapping live
- **📚 [All Examples](https://moe-charm.github.io/voidcore.js/examples/)** - Complete demo collection

---

## 🤝 Gentleman's Agreement System

VoidCore v14.0 uses **optional protocols** instead of forced inheritance:

### 💊 Health Check Protocol
```javascript
// Plugins can optionally respond to health checks
registerHealthCheck('my-plugin', {
  customStatus: 'All systems operational'
});

// Send health check request
await voidCore.publish(Message.intentRequest('*', 'core.health.ping', {}));
```

### 🧠 Process Declaration
```javascript
// Plugins can declare their process info
declareProcess('my-plugin', {
  name: 'My Awesome Plugin',
  version: '1.0.0'
});
```

---

## 🔌 Transport Adapters (Heart Transplant)

### Built-in Transports

**DefaultTransport** - Local memory (automatic)
```javascript
// No setup needed - works out of the box
```

**WebSocketTransport** - Real-time networking
```javascript
import { WebSocketTransport } from './src/transport.js'
await voidCore.setTransport(new WebSocketTransport('ws://server.com'))
```

**BroadcastChannelTransport** - Inter-tab communication
```javascript
import { BroadcastChannelTransport } from './src/transport.js'
await voidCore.setTransport(new BroadcastChannelTransport('my-app'))
```

### Custom Transport
```javascript
export class MyTransport extends ITransport {
  async initialize() { /* Setup */ }
  async send(message, channel) { /* Send logic */ }
  subscribe(handler, channel) { /* Subscribe logic */ }
  getStats() { /* Statistics */ }
  async destroy() { /* Cleanup */ }
}
```

---

## 🌟 Evolution Timeline

| Version | Feature | Philosophy |
|---------|---------|------------|
| **v14.0** | 🚀 Pure Message System | "All existence is born from messages and ends with messages" |
| **v13.0** | 💓 Transport Adapters | Heart-swappable communication layers |
| **v12.0** | 🚀 Multi-Channel | Performance boost with message separation |
| **v11.0** | 🤖 Autonomous Core | Plugin lifecycle and message routing |

---

## 🏗️ Project Structure

```
voidcore-js/
├── src/                         # Core library (v14.0)
│   ├── index.js                # New entry point
│   ├── pure_plugin_system.js   # Serin's Great Reform
│   ├── voidcore.js             # "The Vessel of Silence"
│   ├── message.js              # Message types
│   ├── transport.js            # Transport adapters
│   ├── channel-manager.js      # Channel management
│   └── legacy/                 # v13.0 compatibility
├── examples/                    # v14.0 demos
│   ├── voidcore-demo-visual.html  # Beginner-friendly
│   ├── message-city-modern.html   # Pure system demo
│   └── legacy/                 # Previous examples
├── challenge/                   # Interactive demos
├── docs/                       # Documentation
└── VOIDCORE_V14_CPP_SPEC.md    # C++ implementation spec
```

---

## 🤖 AI-Powered Development

Get started in 3 simple steps:

1. **Clone**: `git clone https://github.com/moe-charm/voidcore.js`
2. **Open**: Load examples in your browser
3. **Build**: Tell Claude Code to read the docs and "build [your app] with VoidCore"

---

## 📚 Documentation

### v14.0 Pure System
- **[C++ Implementation Spec](./VOIDCORE_V14_CPP_SPEC.md)** - Complete specification for C++ port
- **[Pure Plugin Guide](https://moe-charm.github.io/voidcore.js/examples/voidcore-demo-visual.html)** - Interactive learning

### Legacy Documentation  
- **[v13.0 Transport Architecture](./docs/VoidCore_Architecture_Specification_v13.0.md)** - Heart transplant guide
- **[v12.0 Multi-Channel](./docs/VoidCore_Architecture_Specification_v12.0.md)** - Performance improvements  
- **[Plugin Lifecycle](./docs/Plugin_Lifecycle_Guide_v2.0.md)** - Autonomous plugin development

---

## 🎯 Core Philosophy

VoidCore embodies the principle of **"静寂の器" (The Vessel of Silence)**:

1. **🤐 Silent Routing** - Core knows nothing about message content, only types
2. **🕊️ Non-Invasive** - No forced inheritance, pure composition
3. **🤝 Gentleman's Agreement** - Optional protocols, maximum freedom
4. **💫 Pure Beauty** - "Pleasant from the start" code

### The VoidCore Way
```javascript
// ❌ Don't fight the system
class MyPlugin extends BaseClass {
  // Complex inheritance hierarchy
}

// ✅ Flow with the messages
const myPlugin = createPlugin(config, {
  // Pure, beautiful, simple
});
```

---

## ✨ Key Features

- 🚀 **Pure Message System** - No inheritance, pure composition (v14.0)
- 💓 **Heart Transplant** - Swap transport layers at runtime (v13.0)
- 🚀 **Multi-Channel Performance** - 40% faster with dedicated channels (v12.0)
- 🔄 **Perfect Backward Compatibility** - All versions work together
- 🌐 **Browser-Native** - Pure JavaScript, no build tools
- 📦 **Zero Dependencies** - Lightweight and self-contained
- 🤝 **Gentleman's Agreement** - Optional protocols, maximum freedom

---

## 🤝 Contributing

VoidCore thrives on community contributions:

1. Fork the repository
2. Try the **[📮 Simple VoidCore Demo](https://moe-charm.github.io/voidcore.js/examples/voidcore-demo-visual.html)** first
3. Create your feature branch
4. Add tests and documentation
5. Submit a pull request

---

## 🌍 Language Versions

- **🟢 JavaScript** - **Current** (v14.0 - Production Ready)
- **🚧 C++** - **In Development** (Specification ready)

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

---

## 💖 Philosophy in Action

*"哲学的に聞こえるかもしれませんが、実用性を徹底追求した結果です！"*

**Beautiful simplicity, infinite scalability, autonomous dignity.**

### The Journey
- **v11.0**: Birth of autonomous plugins
- **v12.0**: Performance breakthrough  
- **v13.0**: Heart transplant revolution
- **v14.0**: Serin's Great Reform - Pure perfection achieved

---

## 🎉 What's Next?

**JavaScript Version**: Stable and production-ready
**C++ Version**: Next frontier for ultimate performance

⭐ **Star this repo if VoidCore sparked joy in your development workflow!**

---

*Ready to experience the beauty of pure message-based architecture?*  
**[🚀 Start with the Simple Demo](https://moe-charm.github.io/voidcore.js/examples/voidcore-demo-visual.html)**