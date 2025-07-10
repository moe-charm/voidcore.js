# VoidCore Architecture Specification v12.0

## 🌟 Overview

VoidCore v12.0 introduces a revolutionary **Flexible Channel Architecture** while maintaining complete backward compatibility. This version addresses performance bottlenecks through intelligent message type separation and optional multi-channel communication.

### Key Improvements

- **4-Type Message System**: Enhanced Intent separation with clear semantics
- **Flexible Channel Selection**: Choose between single-channel (legacy) or multi-channel (performance)
- **Zero API Changes**: Existing plugins work without modification
- **Intelligent Auto-Routing**: Internal optimization based on message characteristics

---

## 📬 Message Type System v12.0

### 1. IntentRequest
**Purpose**: Request specific actions from other plugins  
**Pattern**: "Please do X"  
**Communication**: 1-to-1, expecting response  
**Channel**: `intentRequest` (or default in single-channel mode)

```javascript
const request = Message.intentRequest('document_manager', 'search.urgent', {
    query: 'project phoenix',
    priority: 'high'
});
```

### 2. IntentResponse  
**Purpose**: Respond to IntentRequest messages  
**Pattern**: "I have done X" or "X completed"  
**Communication**: 1-to-1, response to specific request  
**Channel**: `intentResponse` (or default in single-channel mode)

```javascript
const response = Message.intentResponse('search.urgent.result', {
    documents: [...],
    count: 5,
    requestId: originalRequest.id
});
```

### 3. Notice
**Purpose**: Broadcast information about events/state changes  
**Pattern**: "X has happened"  
**Communication**: 1-to-many, informational only  
**Channel**: `notice` (or default in single-channel mode)  
**Rule**: User responses should NOT trigger automatic system actions

```javascript
const notice = Message.notice('file.saved', {
    filename: 'document.pdf',
    size: '2.4MB',
    timestamp: Date.now()
});
```

### 4. Proposal
**Purpose**: Request approval for future actions  
**Pattern**: "May I do X?" or "Shall we do X?"  
**Communication**: 1-to-1, requires approval/rejection  
**Channel**: `proposal` (or default in single-channel mode)  
**Rule**: Proposer MUST execute/cancel based on response

```javascript
const proposal = Message.proposal('system_optimizer', 'memory.cleanup', {
    action: 'Stop 3 low-usage plugins to free memory',
    affectedPlugins: ['plugin_a', 'plugin_b', 'plugin_c'],
    estimatedMemoryGain: '450MB'
});
```

---

## 🚀 Channel Architecture

### Single Channel Mode (Default)
**Backward Compatibility**: 100% compatible with VoidCore v11.0  
**Performance**: Standard  
**Configuration**: No changes required

```javascript
// Works exactly like v11.0
await voidCore.publish(message);
voidCore.subscribe('project.query', handler);
```

### Multi Channel Mode (Performance)
**Performance**: Optimized for high-throughput scenarios  
**Channels**: 4 dedicated channels prevent cross-contamination  
**Configuration**: Opt-in

```javascript
// Enable multi-channel mode
voidCore.enableMultiChannel({
    intentRequest: true,
    intentResponse: true, 
    notice: true,
    proposal: true
});
```

### Channel Selection Logic

```javascript
class VoidCore {
    selectChannel(message) {
        if (this.multiChannelEnabled) {
            switch(message.category) {
                case 'IntentRequest': return this.channels.intentRequest;
                case 'IntentResponse': return this.channels.intentResponse;
                case 'Notice': return this.channels.notice;
                case 'Proposal': return this.channels.proposal;
                default: return this.channels.default;
            }
        }
        return this.channels.default; // Single channel mode
    }
}
```

---

## 📋 Message Classification Rules

### Notice vs Proposal Boundary

| Aspect | Notice | Proposal |
|--------|---------|----------|
| **Purpose** | Information sharing | Decision making |
| **Timeline** | Past/Present events | Future actions |
| **Expected Response** | **Acknowledgment** | **Approval/Rejection** |
| **System Behavior** | No automatic actions | Execute/cancel based on response |
| **Button Examples** | "OK", "Acknowledge", "Close" | "Yes/No", "Approve/Reject", "Execute/Cancel" |

### Examples

#### ❌ Wrong Usage
```javascript
// DON'T: Notice that triggers actions
const notice = Message.notice('memory.high', {
    action: 'cleanup', // ❌ This should be a Proposal
    options: ['Yes', 'No'] // ❌ This implies future action
});
```

#### ✅ Correct Usage
```javascript
// ✅ Notice for information
const notice = Message.notice('memory.high', {
    level: '95%',
    timestamp: Date.now()
    // User can click "Acknowledge" but system won't auto-act
});

// ✅ Proposal for action
const proposal = Message.proposal('system_manager', 'memory.cleanup', {
    action: 'Clear cache and stop background tasks',
    estimatedTime: '30 seconds'
    // User approval triggers actual cleanup
});
```

---

## 🔧 Implementation Strategy

### Phase 1: Message Type Extension
1. Extend `Message` class with `intentRequest`, `intentResponse` methods
2. Add automatic category detection in `voidCore.publish()`
3. Maintain backward compatibility layer

### Phase 2: Multi-Channel Infrastructure  
1. Implement `ChannelManager` class
2. Add configuration options for channel selection
3. Implement smart routing logic

### Phase 3: Performance Optimization
1. Channel-specific optimizations (batching, prioritization)
2. Monitoring and metrics for each channel
3. Automatic fallback mechanisms

---

## 🛡️ Backward Compatibility

### Legacy Message Support
- All v11.0 `Message.intent()` calls automatically become `IntentRequest`
- Existing subscribe/publish patterns work unchanged
- No breaking changes to plugin APIs

### Migration Path
```javascript
// v11.0 (still works in v12.0)
const intent = Message.intent('system', 'project.query', payload);

// v12.0 (new, explicit)
const request = Message.intentRequest('system', 'project.query', payload);
```

---

## 📊 Performance Benefits

### Single Channel Bottlenecks Resolved
- **Request/Response Separation**: Heavy requests don't block light responses
- **Notice Broadcasting**: Optimized for 1-to-many distribution  
- **Proposal Processing**: Dedicated channel for decision workflows

### Expected Improvements
- 40% reduction in message latency under high load
- 60% improvement in concurrent plugin communication
- Elimination of head-of-line blocking scenarios

---

## 🏗️ Technical Architecture

### Channel Manager
```javascript
class ChannelManager {
    constructor() {
        this.channels = {
            default: new Channel(),
            intentRequest: new Channel(),
            intentResponse: new Channel(), 
            notice: new Channel(),
            proposal: new Channel()
        };
        this.multiChannelEnabled = false;
    }
    
    route(message) {
        const channel = this.selectChannel(message);
        return channel.publish(message);
    }
}
```

### Message Factory Updates
```javascript
export class Message {
    // v12.0 new methods
    static intentRequest(target, action, payload) {
        const msg = new Message(action, payload, 'IntentRequest');
        msg.target = target;
        return msg;
    }
    
    static intentResponse(action, payload) {
        return new Message(action, payload, 'IntentResponse');
    }
    
    // v11.0 compatibility (automatically becomes IntentRequest)
    static intent(target, action, payload) {
        return Message.intentRequest(target, action, payload);
    }
}
```

---

## 🎯 Use Case Examples

### High-Performance Scenario
```javascript
// System monitoring plugin with high-frequency updates
voidCore.enableMultiChannel();

// Frequent sensor data (Notice channel)
setInterval(() => {
    const notice = Message.notice('sensor.update', { 
        cpu: getCPU(), 
        memory: getMemory() 
    });
    voidCore.publish(notice);
}, 1000);

// Occasional optimization requests (IntentRequest channel)
if (memory > 90) {
    const request = Message.intentRequest('optimizer', 'memory.optimize', {
        threshold: 90,
        urgency: 'high'
    });
    voidCore.publish(request);
}
```

### User Interaction Workflow
```javascript
// 1. System detects issue (Notice)
const notice = Message.notice('disk.space.low', {
    available: '2GB',
    percentage: 15
});
voidCore.publish(notice);

// 2. User sees notification, system proposes solution (Proposal)
const proposal = Message.proposal('disk_manager', 'cleanup.temp', {
    action: 'Delete temporary files older than 30 days',
    spaceToRecover: '1.2GB',
    fileCount: 1547
});
voidCore.publish(proposal);

// 3. If approved, execute (IntentRequest)
if (userApproved) {
    const request = Message.intentRequest('file_manager', 'delete.temp_files', {
        age: 30,
        confirmed: true
    });
    voidCore.publish(request);
}
```

---

## 📚 Migration Guide

### For Plugin Developers
1. **No immediate action required** - v11.0 plugins work unchanged
2. **Optional optimization** - Use new message types for clarity
3. **Performance gains** - Enable multi-channel for high-throughput plugins

### For System Integrators  
1. **Evaluate workload** - High message volume benefits from multi-channel
2. **Enable selectively** - Start with single-channel, upgrade as needed
3. **Monitor performance** - Use built-in metrics to measure improvements

---

## 🔮 Future Roadmap

### v12.1: Advanced Channel Features
- Priority queues within channels
- Channel-specific retry policies  
- Message compression for bulk data

### v12.2: Smart Routing
- Machine learning-based channel selection
- Adaptive performance optimization
- Cross-channel load balancing

### v13.0: Plugin Mesh Architecture  
- Direct plugin-to-plugin channels
- Distributed VoidCore networks
- Edge computing optimizations

---

**Document Version**: v12.0  
**Last Updated**: 2025-01-05  
**Authors**: VoidCore Architecture Team  
**Status**: Specification Complete - Ready for Implementation

🌟 *"In the silence between request and response, wisdom emerges."*