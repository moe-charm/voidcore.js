# 🚀 VoidCore Quick Start Guide

Get up and running with VoidCore in 5 minutes!

## ⚡ Installation

```bash
# Clone the repository
git clone https://github.com/moe-charm/voidcore.js
cd voidcore-js

# Start local server
npm start
```

## 🎮 Try the Demos

Open your browser and visit:

- **💓 Heart Transplant Demo**: http://localhost:8080/challenge/voidcore-v13-transport-demo.html
- **🚀 Multi-Channel Demo**: http://localhost:8080/challenge/voidcore-v12-demo.html  
- **🎯 All Examples**: http://localhost:8080/examples/

## 🔧 Basic Usage

### 1. Create your first plugin

```html
<!DOCTYPE html>
<html>
<head>
    <title>My VoidCore App</title>
</head>
<body>
    <script type="module">
        import { voidCore, Message } from './src/voidcore.js'

        // Subscribe to messages
        voidCore.subscribe('hello.world', (message) => {
            console.log('Message received:', message.payload)
        })

        // Send a message
        const message = Message.intent('greeter', 'hello.world', {
            text: 'Hello, VoidCore!',
            timestamp: Date.now()
        })

        voidCore.publish(message)
    </script>
</body>
</html>
```

### 2. Create an autonomous plugin

```javascript
import { voidCore, Message } from './src/voidcore.js'

class MyPlugin {
    constructor(name) {
        this.name = name
        this.initialize()
    }

    async initialize() {
        // Subscribe to events
        voidCore.subscribe('task.request', (msg) => this.handleTask(msg))
        
        // Announce capabilities
        await voidCore.publish(Message.notice('plugin.ready', {
            plugin: this.name,
            capabilities: ['task.processing']
        }))
    }

    async handleTask(message) {
        console.log(`${this.name} processing:`, message.payload)
        
        // Process the task
        const result = await this.processTask(message.payload)
        
        // Send response
        await voidCore.publish(Message.intentResponse('task.result', {
            result: result,
            processedBy: this.name
        }))
    }

    async processTask(payload) {
        // Your task logic here
        return `Processed: ${payload.data}`
    }
}

// Create plugin instance
const myPlugin = new MyPlugin('TaskProcessor')
```

## 💓 Heart Transplant (v13.0)

### Switch to WebSocket transport

```javascript
import { voidCore } from './src/voidcore.js'
import { WebSocketTransport } from './src/transport.js'

// Swap to WebSocket without stopping the system
const wsTransport = new WebSocketTransport('ws://localhost:8080')
await voidCore.setTransport(wsTransport)

// All your existing plugins continue working!
```

### Switch to BroadcastChannel (multi-tab)

```javascript
import { BroadcastChannelTransport } from './src/transport.js'

// Enable inter-tab communication
const bcTransport = new BroadcastChannelTransport('my-app')
await voidCore.setTransport(bcTransport)
```

## 🚀 Performance Boost (v12.0)

```javascript
// Enable multi-channel mode for better performance
voidCore.enableMultiChannel()

// Send different message types
await voidCore.publish(Message.intentRequest('file_manager', 'file.open', data))
await voidCore.publish(Message.notice('system.status', { status: 'ready' }))
await voidCore.publish(Message.proposal('backup_system', 'backup.start', options))
```

## 📋 Message Types Cheat Sheet

```javascript
// Request something (expecting response)
Message.intentRequest(target, action, payload)

// Respond to a request  
Message.intentResponse(type, payload)

// Announce something happened
Message.notice(type, payload)

// Suggest an action
Message.proposal(target, action, payload)

// Legacy format (still works)
Message.intent(target, action, payload)
```

## 🤖 AI Development

Want AI to build your app? Just:

1. **Clone this repo**
2. **Tell Claude Code to read the docs**  
3. **Say "build [your app] with VoidCore"**

The AI will handle architecture, implementation, and debugging!

## 🎯 Common Patterns

### Plugin Discovery
```javascript
// Announce your plugin
await voidCore.publish(Message.notice('plugin.announce', {
    name: 'MyPlugin',
    version: '1.0.0',
    capabilities: ['file.processing', 'data.analysis']
}))

// Listen for other plugins
voidCore.subscribe('plugin.announce', (msg) => {
    console.log('New plugin:', msg.payload.name)
})
```

### Request-Response Pattern
```javascript
// Requester
const response = await new Promise(resolve => {
    const responseId = `response.${Date.now()}`
    
    voidCore.subscribe(responseId, resolve)
    voidCore.publish(Message.intentRequest('processor', 'data.process', {
        data: myData,
        responseId: responseId
    }))
})

// Responder  
voidCore.subscribe('data.process', async (msg) => {
    const result = await processData(msg.payload.data)
    
    await voidCore.publish(Message.intentResponse(msg.payload.responseId, {
        result: result
    }))
})
```

### Error Handling
```javascript
voidCore.subscribe('error.report', (msg) => {
    console.error('Plugin error:', msg.payload)
})

// In your plugin
try {
    // risky operation
} catch (error) {
    await voidCore.publish(Message.notice('error.report', {
        plugin: 'MyPlugin',
        error: error.message,
        timestamp: Date.now()
    }))
}
```

## 🆘 Troubleshooting

### Module import errors
```bash
# Make sure you're serving via HTTP, not file://
npm start
# Then open http://localhost:8080 (not file:// URLs)
```

### Transport connection issues
```javascript
// Check transport status
const stats = voidCore.getStats()
console.log('Transport:', stats.transport.type)
console.log('Status:', stats.transport.status)
```

### Message not received
```javascript
// Check if anyone is subscribed
const stats = voidCore.getStats()
console.log('Subscribers:', stats.totalSubscribers)

// Add debug logging
voidCore.subscribe('*', (msg) => console.log('All messages:', msg))
```

## 📚 Next Steps

1. **Explore the demos** - See VoidCore in action
2. **Read the docs** - Deep dive into architecture
3. **Build your plugin** - Start with autonomous lifecycle
4. **Try transports** - Experiment with WebSocket/BroadcastChannel
5. **Join the community** - Contribute to the project!

---

**Happy coding! 🌟**

*The silence awaits your creativity.*