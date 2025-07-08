// src/channel-manager.js - Channel Management for VoidCore v13.0
// Elegant Transport Adapter integration with backward compatibility

import { DefaultTransport } from '../messaging/transport.js'

export class ChannelManager {
  constructor(transport = null) {
    // v13.0: Heart-swappable Transport Layer
    this.transport = transport || new DefaultTransport()
    this.multiChannelEnabled = false
    this.logElement = null
    this.initialized = false
    this.initPromise = null  // Promise-based initialization
    
    // Subscribe tracking for statistics (message.type -> channelName)
    this.typeToChannelMap = new Map()
    this.subscriptionCount = 0
    
  }

  // v13.0: Initialize transport with proper Promise pattern
  async initialize() {
    // 既に初期化済みなら即座に返す
    if (this.initialized) {
      return;
    }
    
    // 初期化Promiseがない場合のみ作成
    if (!this.initPromise) {
      this.initPromise = this._performInitialization();
    }
    
    // 必ずPromiseを待つ
    await this.initPromise;
  }
  
  // 実際の初期化処理
  async _performInitialization() {
    try {
      await this.transport.initialize();
      this.initialized = true;
      this.log(`🔌 ChannelManager initialized with ${this.transport.constructor.name}`);
    } catch (error) {
      this.log(`❌ ChannelManager initialization failed: ${error.message}`);
      throw error;
    }
  }

  // v13.0: Inject new transport (heart transplant!)
  async setTransport(newTransport) {
    if (this.transport) {
      await this.transport.destroy()
    }
    
    this.transport = newTransport
    this.initialized = false
    await this.initialize()
    
    this.log(`💓 Transport swapped to ${newTransport.constructor.name}`)
  }

  // Enable multi-channel mode
  enableMultiChannel(config = {}) {
    this.multiChannelEnabled = true
    this.log(`🚀 Multi-channel mode enabled`)
  }

  // Disable multi-channel mode (back to v11.0 compatibility)
  disableMultiChannel() {
    this.multiChannelEnabled = false
    this.log(`📡 Single-channel mode enabled (v11.0 compatibility)`)
  }

  // v13.0: Select appropriate channel name based on message
  selectChannelName(message) {
    if (!this.multiChannelEnabled) {
      return 'default'
    }

    // Route based on message category
    switch (message.category) {
      case 'IntentRequest':
        return 'intentRequest'
      case 'IntentResponse':
        return 'intentResponse'
      case 'Intent': // v11.0 backward compatibility -> treat as IntentRequest
        return 'intentRequest'
      case 'Notice':
        return 'notice'
      case 'Proposal':
        return 'proposal'
      default:
        return 'default'
    }
  }

  // v13.0: Subscribe to message type (Transport-based) with proper async
  async subscribe(type, handler) {
    // v13.0: 必ず初期化を待つ
    await this.initialize();

    // Track type -> handler mapping for statistics
    if (!this.typeToChannelMap.has(type)) {
      this.typeToChannelMap.set(type, new Set())
    }
    this.typeToChannelMap.get(type).add(handler)
    
    if (this.multiChannelEnabled) {
      // Subscribe to all channels - we don't know which channel a type will use
      const channelNames = ['default', 'intentRequest', 'intentResponse', 'notice', 'proposal']
      const unsubscribeFunctions = await Promise.all(channelNames.map(async channelName => 
        await this.transport.subscribe(this.createTypeHandler(type, handler), channelName)
      ))
      
      // Return unified unsubscribe function
      return () => {
        unsubscribeFunctions.forEach(unsub => unsub())
        this.typeToChannelMap.get(type)?.delete(handler)
        if (this.typeToChannelMap.get(type)?.size === 0) {
          this.typeToChannelMap.delete(type)
        }
      }
    } else {
      // Single-channel mode - use default channel only
      const unsubscribe = await this.transport.subscribe(
        this.createTypeHandler(type, handler), 
        'default'
      )
      
      return () => {
        unsubscribe()
        this.typeToChannelMap.get(type)?.delete(handler)
        if (this.typeToChannelMap.get(type)?.size === 0) {
          this.typeToChannelMap.delete(type)
        }
      }
    }
  }

  // v13.0: Create type-filtered handler for Transport
  createTypeHandler(expectedType, originalHandler) {
    return (message) => {
      // Only call handler if message type matches
      // Phase 5.2 FIX: Use message.type instead of message.category
      if (message && message.type === expectedType) {
        return originalHandler(message)
      }
    }
  }

  // v13.0: Publish message via Transport
  async publish(message) {
    // v13.0: Auto-initialize if needed
    if (!this.initialized) {
      await this.initialize()
    }

    const channelName = this.selectChannelName(message)
    
    this.log(`📨 Publish: ${message.type} (${message.category}) → ${channelName}`)
    
    const deliveredCount = await this.transport.send(message, channelName)
    
    if (deliveredCount > 0) {
      this.log(`✅ Delivered to ${deliveredCount} subscribers via ${channelName}`)
    } else {
      this.log(`📭 No subscribers for ${message.type} on ${channelName}`)
    }
    
    return deliveredCount
  }

  // v13.0: Get subscriber count for a specific type (Transport-based)
  getSubscriberCount(type) {
    return this.typeToChannelMap.get(type)?.size || 0
  }

  // v13.0: Get comprehensive stats (Transport + ChannelManager)
  getStats() {
    const transportStats = this.transport.getStats()
    
    // Create virtual channel stats for backward compatibility
    const virtualChannels = []
    
    if (this.multiChannelEnabled) {
      // Show stats for each logical channel
      const channelNames = ['default', 'intentRequest', 'intentResponse', 'notice', 'proposal']
      channelNames.forEach(name => {
        virtualChannels.push({
          name,
          messageTypes: this.getMessageTypesForChannel(name),
          totalSubscribers: this.getSubscribersForChannel(name),
          messageCount: transportStats.messageCount || 0, // Transport doesn't track per virtual channel
          lastActivity: Date.now()
        })
      })
    } else {
      // Single channel mode
      virtualChannels.push({
        name: 'default',
        messageTypes: this.typeToChannelMap.size,
        totalSubscribers: Array.from(this.typeToChannelMap.values())
          .reduce((sum, handlers) => sum + handlers.size, 0),
        messageCount: transportStats.messageCount || 0,
        lastActivity: Date.now()
      })
    }
    
    return {
      mode: this.multiChannelEnabled ? 'multi-channel' : 'single-channel',
      transport: transportStats,
      channels: virtualChannels,
      totalMessageTypes: this.typeToChannelMap.size,
      totalSubscribers: Array.from(this.typeToChannelMap.values())
        .reduce((sum, handlers) => sum + handlers.size, 0),
      totalMessages: transportStats.messageCount || 0
    }
  }

  // Helper: Get message types for a virtual channel (for stats)
  getMessageTypesForChannel(channelName) {
    // This is approximation - we don't track which types go to which channels
    // In reality, types can go to different channels based on message category
    return Math.ceil(this.typeToChannelMap.size / (this.multiChannelEnabled ? 5 : 1))
  }

  // Helper: Get subscribers for a virtual channel (for stats)
  getSubscribersForChannel(channelName) {
    // Approximation for virtual channel stats
    const totalSubs = Array.from(this.typeToChannelMap.values())
      .reduce((sum, handlers) => sum + handlers.size, 0)
    return Math.ceil(totalSubs / (this.multiChannelEnabled ? 5 : 1))
  }

  // v13.0: Clear all subscriptions and reset Transport
  async clear() {
    this.typeToChannelMap.clear()
    
    if (this.transport) {
      await this.transport.destroy()
      this.transport = new DefaultTransport()
      this.initialized = false
      await this.initialize()
    }
    
    this.log("🧹 All channels cleared and Transport reset")
  }

  // Set log element for debugging
  setLogElement(element) {
    this.logElement = element
  }

  // Internal logging
  log(msg) {
    if (this.logElement) {
      this.logElement.innerHTML += msg + "<br>"
      setTimeout(() => {
        this.logElement.scrollTop = this.logElement.scrollHeight
      }, 0)
    } else {
      console.log(msg)
    }
  }
}