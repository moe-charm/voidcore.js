# 🌟 VoidCore Network - 静寂の器 (The Vessel of Silence)

> **"メッセージをtypeだけ見てルーティングする純粋な配達員"**  
> _中身は一切知らない。ただ確実に届ける。_

**Latest: v13.0 - Heart Transplant Ready** 💓

---

## 🚀 Quick Start

### Installation
```bash
git clone https://github.com/moe-charm/voidcore.js
cd voidcore-js
npm start
```

### Basic Usage
```javascript
import { voidCore, Message } from './src/voidcore.js'

// Subscribe to messages
voidCore.subscribe('hello.world', (message) => {
  console.log('Received:', message.payload)
})

// Send a message
await voidCore.publish(Message.intent('greeter', 'hello.world', {
  text: 'Hello, VoidCore!'
}))
```

### 💓 Heart Transplant (v13.0)
```javascript
import { WebSocketTransport } from './src/transport.js'

// Swap communication layer without stopping the system
await voidCore.setTransport(new WebSocketTransport('ws://localhost:8080'))
```

---

## 🎯 Core Philosophy

VoidCore embodies three fundamental principles:

1. **静寂 (Silence)** - The core knows nothing about message content, only types
2. **非命令型 (Non-Imperative)** - No commands, only suggestions and proposals  
3. **尊厳尊重 (Dignity)** - Plugins maintain complete autonomy

---

## ✨ Key Features

- 💓 **Heart Transplant** - Swap transport layers at runtime (v13.0)
- 🚀 **Multi-Channel Performance** - 40% faster with dedicated channels (v12.0)
- 🔄 **Perfect Backward Compatibility** - All versions work together
- 🤖 **Autonomous Plugins** - 5-stage lifecycle management
- 🌐 **Browser-Native** - Pure JavaScript, no build tools
- 📦 **Zero Dependencies** - Lightweight and self-contained

---

## 🌟 Evolution Timeline

| Version | Feature | Description |
|---------|---------|-------------|
| **v13.0** | 💓 Transport Adapters | Heart-swappable communication layers |
| **v12.0** | 🚀 Multi-Channel | Performance boost with message separation |
| **v11.0** | 🤖 Autonomous Core | Plugin lifecycle and message routing |

---

## 📬 Message Types

VoidCore uses four clear message types for all communication:

### 1. IntentRequest - "Please do X"
```javascript
const request = Message.intentRequest('file_manager', 'file.open', {
  path: '/documents/readme.txt'
})
```

### 2. IntentResponse - "X completed"
```javascript
const response = Message.intentResponse('file.open.result', {
  status: 'success',
  content: 'File content here...'
})
```

### 3. Notice - "X happened" 
```javascript
const notice = Message.notice('system.status', {
  status: 'File saved successfully',
  timestamp: Date.now()
})
```

### 4. Proposal - "Shall we do X?"
```javascript
const proposal = Message.proposal('backup_manager', 'system.backup', {
  action: 'Create daily backup',
  estimatedTime: 30000
})
```

---

## 🔌 Transport Adapters (v13.0)

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

## 🎮 Live Demos

Experience VoidCore in action:

- **💓 [Heart Transplant Demo](http://localhost:8080/challenge/voidcore-v13-transport-demo.html)** - Watch transport swapping live
- **🚀 [Multi-Channel Demo](http://localhost:8080/challenge/voidcore-v12-demo.html)** - See performance improvements
- **🎯 [All Examples](http://localhost:8080/examples/)** - Complete demo collection

---

## 🤖 AI-Powered Development

Get started in 3 simple steps:

1. `git clone this repo`
2. Tell Claude Code to read the docs
3. Say "build [your app] with VoidCore" - done!

---

## 📚 Documentation

- **[v13.0 Transport Architecture](./docs/VoidCore_Architecture_Specification_v13.0.md)** - Heart transplant guide
- **[v12.0 Multi-Channel](./docs/VoidCore_Architecture_Specification_v12.0.md)** - Performance improvements  
- **[Plugin Lifecycle](./docs/Plugin_Lifecycle_Guide_v2.0.md)** - Autonomous plugin development
- **[Implementation Guide](./docs/JavaScript_Implementation_Guide.md)** - Technical details

---

## 🏗️ Project Structure

```
voidcore-js/
├── src/                    # Core library
│   ├── voidcore.js        # Main VoidCore class
│   ├── message.js         # Message types
│   ├── transport.js       # Transport adapters
│   └── channel-manager.js # Channel management
├── challenge/             # Interactive demos
├── examples/              # Code samples
├── docs/                  # Documentation
└── plugins/               # Example plugins
```

---

## 🤝 Contributing

VoidCore thrives on community contributions:

1. Fork the repository
2. Create your feature branch
3. Add tests and documentation
4. Submit a pull request

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

---

## 💖 Philosophy in Action

*"哲学的に聞こえるかもしれませんが、実用性を徹底追求した結果です！"*

**Beautiful simplicity, infinite scalability, autonomous dignity.**

---

⭐ **Star this repo if VoidCore sparks joy in your development workflow!**