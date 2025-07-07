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
    
    // Phase 5.2: Dynamic Plugin Management System
    this.pendingRequests = new Map() // correlationId -> Promise resolver
    this.maxDepth = 10 // Default maximum hierarchy depth
    this.resourceCost = new Map() // coreId -> resource consumption
    
    // システムメッセージハンドラーの初期化
    this._initializeSystemMessageHandlers()
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

  // Ensure ChannelManager is initialized with proper Promise pattern
  async _ensureInitialized() {
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
      await this.channelManager.initialize();
      this.initialized = true;
      this.log('🎆 VoidCore fully initialized');
    } catch (error) {
      this.log(`❌ VoidCore initialization failed: ${error.message}`);
      throw error;
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

  // メッセージ購読（typeのみを知る） with proper async
  async subscribe(type, handler) {
    // v13.0: 必ず初期化を待つ
    await this._ensureInitialized();
    
    // v12.0: Delegate to ChannelManager
    const unsubscribe = await this.channelManager.subscribe(type, handler);
    
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
  
  // === Phase 5.2: DYNAMIC PLUGIN MANAGEMENT SYSTEM ===
  
  // 🚀 システムメッセージハンドラー初期化
  _initializeSystemMessageHandlers() {
    // 統一システムメッセージハンドラー
    this.subscribe('IntentRequest', async (message) => {
      try {
        if (message.action === 'system.createPlugin') {
          await this._handleCreatePlugin(message)
        } else if (message.action === 'system.destroyPlugin') {
          await this._handleDestroyPlugin(message)
        } else if (message.action === 'system.connect') {
          await this._handleConnect(message)
        }
      } catch (error) {
        this.log(`❌ System message handler error: ${error.message}`)
        console.error('System handler error:', error)
      }
    })
  }
  
  // 🔧 system.createPlugin ハンドラー
  async _handleCreatePlugin(message) {
    const { type, config, parent, correlationId, maxDepth, resourceCost } = message.payload
    
    try {
      // 階層深度チェック
      if (maxDepth && this._getCurrentDepth(parent) >= maxDepth) {
        throw new Error(`Maximum depth exceeded: ${maxDepth}`)
      }
      
      // リソースコストチェック
      if (resourceCost && !this._checkResourceAvailability(parent, resourceCost)) {
        throw new Error(`Insufficient resources for plugin creation`)
      }
      
      // 動的プラグイン生成
      const pluginId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
      
      // プラグインオブジェクト作成
      const plugin = this._createPluginObject({
        pluginId,
        type,
        config: config || {},
        parent,
        createdAt: Date.now(),
        correlationId
      })
      
      // プラグイン登録
      const success = this.registerPlugin(plugin)
      
      if (success) {
        // リソース消費を記録
        if (resourceCost) {
          this._consumeResource(parent, resourceCost)
        }
        
        // 成功レスポンス
        await this._sendSystemResponse('system.createPlugin', {
          success: true,
          pluginId,
          type,
          parent,
          correlationId,
          timestamp: Date.now()
        }, correlationId)
        
        this.log(`🚀 System: Plugin created - ${pluginId} (type: ${type}, parent: ${parent})`)
      } else {
        throw new Error(`Failed to register plugin: ${pluginId}`)
      }
      
    } catch (error) {
      // エラーレスポンス
      await this._sendSystemResponse('system.createPlugin', {
        success: false,
        error: error.message,
        correlationId,
        timestamp: Date.now()
      }, correlationId)
      
      this.log(`❌ System: Plugin creation failed - ${error.message}`)
    }
  }
  
  // 🗑️ system.destroyPlugin ハンドラー
  async _handleDestroyPlugin(message) {
    const { pluginId, correlationId } = message.payload
    
    try {
      const success = this.unregisterPlugin(pluginId)
      
      await this._sendSystemResponse('system.destroyPlugin', {
        success,
        pluginId,
        correlationId,
        timestamp: Date.now()
      }, correlationId)
      
      this.log(`🗑️ System: Plugin ${success ? 'destroyed' : 'not found'} - ${pluginId}`)
      
    } catch (error) {
      await this._sendSystemResponse('system.destroyPlugin', {
        success: false,
        error: error.message,
        correlationId,
        timestamp: Date.now()
      }, correlationId)
      
      this.log(`❌ System: Plugin destruction failed - ${error.message}`)
    }
  }
  
  // 🔗 system.connect ハンドラー
  async _handleConnect(message) {
    const { source, target, sourcePort, targetPort, correlationId } = message.payload
    
    try {
      // 動的接続の実装（将来拡張）
      // 現在はログ出力のみ
      
      await this._sendSystemResponse('system.connect', {
        success: true,
        source,
        target,
        sourcePort,
        targetPort,
        correlationId,
        timestamp: Date.now()
      }, correlationId)
      
      this.log(`🔗 System: Connection established - ${source}:${sourcePort} -> ${target}:${targetPort}`)
      
    } catch (error) {
      await this._sendSystemResponse('system.connect', {
        success: false,
        error: error.message,
        correlationId,
        timestamp: Date.now()
      }, correlationId)
      
      this.log(`❌ System: Connection failed - ${error.message}`)
    }
  }
  
  // 🏭 プラグインオブジェクト作成
  _createPluginObject({ pluginId, type, config, parent, createdAt, correlationId }) {
    return {
      pluginId,
      type,
      config,
      parent,
      createdAt,
      correlationId,
      core: this,
      
      // 基本的なプラグインAPI
      sendIntent: async (action, payload) => {
        const intentMessage = {
          type: 'IntentRequest',
          action,
          payload: {
            ...payload,
            sourcePlugin: pluginId,
            causationId: correlationId // 因果関係追跡
          },
          timestamp: Date.now()
        }
        return await this.publish(intentMessage)
      },
      
      notice: async (eventName, payload) => {
        const noticeMessage = {
          type: 'Notice',
          event: eventName,
          payload: {
            ...payload,
            sourcePlugin: pluginId,
            causationId: correlationId
          },
          timestamp: Date.now()
        }
        return await this.publish(noticeMessage)
      },
      
      observe: (eventName, handler) => {
        return this.subscribe('Notice', (message) => {
          if (message.event === eventName) {
            handler(message)
          }
        })
      }
    }
  }
  
  // 📤 システムレスポンス送信
  async _sendSystemResponse(action, payload, correlationId) {
    const responseMessage = {
      type: 'IntentResponse',
      action,
      payload,
      correlationId,
      timestamp: Date.now()
    }
    
    return await this.publish(responseMessage)
  }
  
  // 📏 現在の階層深度取得
  _getCurrentDepth(parentId) {
    // 簡易実装：親を辿って深度を計算
    let depth = 0
    let currentParent = parentId
    
    while (currentParent && depth < 100) { // 無限ループ防止
      const parentPlugin = this.getPlugin(currentParent)
      if (!parentPlugin) break
      
      currentParent = parentPlugin.parent
      depth++
    }
    
    return depth
  }
  
  // 💰 リソース可用性チェック
  _checkResourceAvailability(coreId, requiredCost) {
    const currentCost = this.resourceCost.get(coreId) || 0
    const maxCost = 100 // デフォルト最大リソース
    
    return (currentCost + requiredCost) <= maxCost
  }
  
  // 💸 リソース消費
  _consumeResource(coreId, cost) {
    const currentCost = this.resourceCost.get(coreId) || 0
    this.resourceCost.set(coreId, currentCost + cost)
  }
  
  // 🔄 リソース解放
  _releaseResource(coreId, cost) {
    const currentCost = this.resourceCost.get(coreId) || 0
    this.resourceCost.set(coreId, Math.max(0, currentCost - cost))
  }
  
  // 📊 システム統計情報
  getSystemStats() {
    return {
      ...this.getStats(),
      pendingRequests: this.pendingRequests.size,
      maxDepth: this.maxDepth,
      resourceUsage: Object.fromEntries(this.resourceCost),
      systemPlugins: this.plugins.filter(p => p.type && p.type.startsWith('system')).length,
      dynamicPlugins: this.plugins.filter(p => p.correlationId).length
    }
  }
}

export const voidCore = new VoidCore()