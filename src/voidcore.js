// src/voidcore.js - 静寂の器 (The Vessel of Silence) v14.0
// セリンの大改革版: 純粋メッセージベースシステム
// 基底クラス継承完全排除、紳士協定システム実装

import { ChannelManager } from './channel-manager.js'

class VoidCore {
  constructor(transport = null) {
    // v13.0: ChannelManager with optional Transport injection
    this.channelManager = new ChannelManager(transport)
    this.initialized = false
    
    // v11.0 backward compatibility
    this.subscribers = new Map() // type -> Set<handler> (legacy access)
    this.logElement = null
    
    // v13.0: Auto-initialize for backward compatibility (lazy)
    this.initPromise = null
  }

  setLogElement(element) {
    this.logElement = element
    this.channelManager.setLogElement(element)
  }

  // === v13.0 TRANSPORT METHODS ===

  // Heart transplant! Swap the transport layer at runtime
  async setTransport(newTransport) {
    await this.channelManager.setTransport(newTransport)
    this.log(`💓 VoidCore v13.0: Transport swapped to ${newTransport.constructor.name}`)
  }

  // Ensure ChannelManager is initialized (called automatically)
  async _ensureInitialized() {
    if (!this.initialized && !this.initPromise) {
      this.initPromise = this.channelManager.initialize().then(() => {
        this.initialized = true
      })
    }
    
    if (this.initPromise) {
      await this.initPromise
    }
  }

  // === v12.0 CHANNEL METHODS ===

  // Enable multi-channel mode for high performance
  enableMultiChannel(config = {}) {
    this.channelManager.enableMultiChannel(config)
    this.log(`🌟 VoidCore v12.0: Multi-channel mode activated`)
  }

  // Disable multi-channel mode (back to v11.0 compatibility)
  disableMultiChannel() {
    this.channelManager.disableMultiChannel()
    this.log(`📡 VoidCore v12.0: Single-channel compatibility mode`)
  }

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

  // メッセージ購読（typeのみを知る）
  subscribe(type, handler) {
    // v13.0: Lazy initialization - defer to first publish/subscribe usage
    if (!this.initialized && !this.initPromise) {
      this._ensureInitialized().catch(console.error)
    }
    
    // v12.0: Delegate to ChannelManager
    const unsubscribe = this.channelManager.subscribe(type, handler)
    
    // v11.0 backward compatibility: maintain legacy subscribers map
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set())
    }
    this.subscribers.get(type).add(handler)
    
    this.log(`🔔 Subscribe: ${type}`)
    return unsubscribe // v12.0: return unsubscribe function
  }

  // 購読解除
  unsubscribe(type, handler) {
    const handlers = this.subscribers.get(type)
    if (handlers) {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.subscribers.delete(type)
      }
      this.log(`🔕 Unsubscribe: ${type}`)
    }
  }

  // メッセージ発行（中身は見ない、typeだけでルーティング）
  async publish(message) {
    if (!message || !message.type) {
      this.log("⚠️ Invalid message: missing type")
      return 0
    }

    // v13.0: Ensure initialization
    await this._ensureInitialized()

    // v12.0: Delegate to ChannelManager for smart routing
    const deliveredCount = await this.channelManager.publish(message)
    
    return deliveredCount
  }

  // 購読者数取得
  getSubscriberCount(type) {
    // v12.0: Use ChannelManager for accurate count across all channels
    return this.channelManager.getSubscriberCount(type)
  }

  // 全購読解除
  async clear() {
    // v13.0: Clear ChannelManager
    await this.channelManager.clear()
    this.initialized = false
    
    // v11.0 backward compatibility
    this.subscribers.clear()
    this.log("🧹 All subscriptions cleared")
  }

  // 統計情報
  getStats() {
    // v12.0: Get comprehensive stats from ChannelManager
    return this.channelManager.getStats()
  }
}

export const voidCore = new VoidCore()