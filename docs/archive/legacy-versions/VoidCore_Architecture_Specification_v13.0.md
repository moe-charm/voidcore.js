# VoidCore Architecture Specification v13.0

## 💓 Heart Transplant Revolution

VoidCore v13.0 introduces the **Transport Adapter Pattern** - the ability to swap VoidCore's communication "heart" without stopping the system. From local memory to WebSocket networks, change how messages flow with zero downtime.

### 🌟 Key Features

- **💓 Heart Transplant**: Swap transport layers at runtime
- **🔌 Zero Downtime**: System keeps running during transport changes
- **🌐 Network Ready**: WebSocket, BroadcastChannel, custom transports
- **🔄 Perfect Compatibility**: All v11.0 and v12.0 code works unchanged
- **🎯 Plug & Play**: Simple interface for custom transports

---

## 🏗️ Transport Adapter Architecture

### Core Concept

```javascript
// The "heart" of VoidCore is now swappable
const voidCore = new VoidCore(customTransport)

// Or transplant at runtime (heart surgery!)
await voidCore.setTransport(new WebSocketTransport('ws://example.com'))
```

### ITransport Interface

All transports implement this simple interface:

```javascript
export class ITransport {
  async initialize() { /* Setup transport */ }
  async send(message, channel = 'default') { /* Send message */ }
  subscribe(handler, channel = 'default') { /* Subscribe to messages */ }
  getStats() { /* Return transport statistics */ }
  async destroy() { /* Cleanup transport */ }
}
```

---

## 🚀 Built-in Transports

### 1. DefaultTransport
**Purpose**: Local memory (v12.0 compatible)
**Use Case**: Single-page applications, local plugins

```javascript
import { voidCore } from './src/voidcore.js'
// Uses DefaultTransport automatically
```

### 2. WebSocketTransport
**Purpose**: Real-time network communication
**Use Case**: Distributed systems, multi-user applications

```javascript
import { WebSocketTransport } from './src/transport.js'

const wsTransport = new WebSocketTransport('ws://localhost:8080')
await voidCore.setTransport(wsTransport)
```

### 3. BroadcastChannelTransport
**Purpose**: Inter-tab communication
**Use Case**: Multi-tab applications, browser-wide plugins

```javascript
import { BroadcastChannelTransport } from './src/transport.js'

const bcTransport = new BroadcastChannelTransport('my-app')
await voidCore.setTransport(bcTransport)
```

---

## 🔧 Creating Custom Transports

### Example: Redis Transport

```javascript
export class RedisTransport extends ITransport {
  constructor(redisUrl) {
    super()
    this.redisUrl = redisUrl
    this.redis = null
    this.handlers = new Map()
  }

  async initialize() {
    this.redis = new Redis(this.redisUrl)
    // Setup Redis pub/sub listeners
  }

  async send(message, channel = 'default') {
    await this.redis.publish(`voidcore:${channel}`, JSON.stringify(message))
  }

  subscribe(handler, channel = 'default') {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set())
      this.redis.subscribe(`voidcore:${channel}`)
    }
    this.handlers.get(channel).add(handler)
    
    return () => this.handlers.get(channel).delete(handler)
  }

  getStats() {
    return {
      type: 'RedisTransport',
      url: this.redisUrl,
      channels: Array.from(this.handlers.keys())
    }
  }

  async destroy() {
    await this.redis.disconnect()
  }
}
```

### Usage

```javascript
// Heart transplant to Redis
const redisTransport = new RedisTransport('redis://localhost:6379')
await voidCore.setTransport(redisTransport)

// All existing plugins continue working!
```

---

## 🔄 Migration Guide

### From v12.0 to v13.0

**Zero code changes required!** Your existing code automatically uses DefaultTransport.

```javascript
// v12.0 code (still works in v13.0)
import { voidCore } from './src/voidcore.js'
voidCore.subscribe('my.event', handler)
await voidCore.publish(Message.intent('target', 'action', payload))
```

### Adding Transport Features

```javascript
// Optional: Use transport features
await voidCore.setTransport(new WebSocketTransport('ws://server.com'))

// Your existing subscriptions and publishes work unchanged
```

---

## 🎯 Use Cases

### 1. Local Development
```javascript
// Use DefaultTransport (automatic)
const voidCore = new VoidCore()
```

### 2. Multi-User Real-time App
```javascript
// WebSocket for server communication
const wsTransport = new WebSocketTransport('wss://api.myapp.com')
await voidCore.setTransport(wsTransport)
```

### 3. Browser-wide Plugin System
```javascript
// BroadcastChannel for inter-tab communication
const bcTransport = new BroadcastChannelTransport('my-plugin-system')
await voidCore.setTransport(bcTransport)
```

### 4. Microservices Architecture
```javascript
// Custom transport for service mesh
const meshTransport = new ServiceMeshTransport({
  service: 'user-service',
  mesh: 'istio'
})
await voidCore.setTransport(meshTransport)
```

---

## 🔬 Testing & Debugging

### Transport Stats
```javascript
const stats = voidCore.getStats()
console.log('Transport:', stats.transport.type)
console.log('Status:', stats.transport.status)
console.log('Messages:', stats.transport.messageCount)
```

### Heart Transplant Demo
Run the interactive demo to see transport swapping in action:
```bash
npm start
# Visit: http://localhost:8080/challenge/voidcore-v13-transport-demo.html
```

---

## 📈 Performance Considerations

### Transport Selection Guidelines

- **DefaultTransport**: Fastest for single-page apps
- **WebSocketTransport**: Best for real-time distributed systems
- **BroadcastChannelTransport**: Optimal for multi-tab applications
- **Custom Transports**: Tailored to specific infrastructure needs

### Memory Management

All transports automatically handle cleanup when swapped:
```javascript
// Old transport is properly destroyed
await voidCore.setTransport(newTransport)
```

---

## 🌟 Philosophy

The Transport Adapter pattern embodies VoidCore's core philosophy:

- **静寂 (Silence)**: VoidCore remains message-agnostic regardless of transport
- **非命令型 (Non-Imperative)**: Plugins work the same across all transports  
- **尊厳尊重 (Dignity)**: Transport choice respects architectural needs

**The vessel remains silent, only the medium changes.**

---

*Beautiful simplicity, infinite scalability, autonomous dignity.*