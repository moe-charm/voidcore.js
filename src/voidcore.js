// src/voidcore.js - 静寂の器 (The Vessel of Silence) v14.0
// セリンの大改革版: 純粋メッセージベースシステム
// 基底クラス継承完全排除、紳士協定システム実装

import { ChannelManager } from './channel-manager.js'
import { CoreFusion } from './core-fusion.js'
import { SimpleMessagePool } from './simple-message-pool.js'

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
    
    // v14.0: CoreFusion v1.2 & SimpleMessagePool
    this.coreId = `core-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    this.plugins = []
    this.messagePool = new SimpleMessagePool()
    this.coreFusion = new CoreFusion()
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
    const channelStats = this.channelManager.getStats()
    const poolStats = this.messagePool.getStats()
    
    return {
      ...channelStats,
      messagePool: poolStats,
      coreId: this.coreId,
      pluginCount: this.plugins.length,
      fusionHistory: this.coreFusion.getFusionHistory().length
    }
  }
  
  // === v14.0 CORE FUSION & MESSAGE POOL METHODS ===
  
  // 🧩 CoreFusion v1.2 - 複数コア統合
  async fuseWith(targetCore, config = {}) {
    const result = await this.coreFusion.fuseWith(this, targetCore, config)
    
    if (result.success) {
      this.log(`🧩 CoreFusion v1.2: Successfully fused with target core (${result.pluginsMoved} plugins moved in ${result.processingTime}ms)`)
    } else {
      this.log(`❌ CoreFusion v1.2: Fusion failed - ${result.error}`)
    }
    
    return result
  }
  
  // 📦 プラグイン登録
  registerPlugin(plugin) {
    if (!plugin || !plugin.pluginId) {
      this.log('⚠️ Invalid plugin: missing pluginId')
      return false
    }
    
    // 既存プラグインの重複チェック
    const existingPlugin = this.plugins.find(p => p.pluginId === plugin.pluginId)
    if (existingPlugin) {
      this.log(`⚠️ Plugin ${plugin.pluginId} already registered`)
      return false
    }
    
    // プラグインにコア参照を設定
    plugin.core = this
    
    // プラグインリストに追加
    this.plugins.push(plugin)
    
    this.log(`🔌 Plugin registered: ${plugin.pluginId}`)
    return true
  }
  
  // 🗑️ プラグイン削除
  unregisterPlugin(pluginId) {
    const index = this.plugins.findIndex(p => p.pluginId === pluginId)
    if (index !== -1) {
      const plugin = this.plugins.splice(index, 1)[0]
      plugin.core = null
      this.log(`🗑️ Plugin unregistered: ${pluginId}`)
      return true
    }
    
    this.log(`⚠️ Plugin not found: ${pluginId}`)
    return false
  }
  
  // 🔍 プラグイン取得
  getPlugin(pluginId) {
    return this.plugins.find(p => p.pluginId === pluginId)
  }
  
  // 📦 すべてのプラグインを取得
  getAllPlugins() {
    return [...this.plugins]
  }
  
  // 🚀 SimpleMessagePool - バッチ送信
  async publishBatch(messages) {
    if (!Array.isArray(messages)) {
      this.log('⚠️ publishBatch: messages must be an array')
      return { success: false, error: 'Invalid messages array' }
    }
    
    // MessagePoolにTransportを設定
    this.messagePool.setTransport({
      send: async (message) => {
        return await this.publish(message)
      }
    })
    
    const result = await this.messagePool.submitBatch(messages)
    
    if (result.success) {
      this.log(`🚀 Batch published: ${result.processedCount} messages (${result.parallelCount} parallel, ${result.sequentialCount} sequential) in ${result.processingTime}ms`)
    } else {
      this.log(`❌ Batch publish failed: ${result.errors}`)
    }
    
    return result
  }
  
  // 📊 MessagePool統計情報
  getMessagePoolStats() {
    return this.messagePool.getStats()
  }
  
  // 🧹 MessagePool統計リセット
  resetMessagePoolStats() {
    this.messagePool.resetStats()
    this.log('📊 MessagePool stats reset')
  }
  
  // 📈 Fusion履歴取得
  getFusionHistory() {
    return this.coreFusion.getFusionHistory()
  }
  
  // 🧹 Fusion履歴クリア
  clearFusionHistory() {
    this.coreFusion.clearFusionHistory()
    this.log('🧹 Fusion history cleared')
  }
}

export const voidCore = new VoidCore()