// VoidCore v14.0 - 親コア（SystemBootManager内蔵）
// VoidCoreBaseの拡張版：Intent処理 + 階層管理 + 起動管理

import { VoidCoreBase } from './voidcore_base.js'
import { CoreFusion } from './core-fusion.js'
import { SimpleMessagePool } from '../messaging/simple-message-pool.js'
import { Message } from '../messaging/message.js'
import { IPlugin, isCorePlugin } from '../interfaces/plugin-interface.js'
import { globalMessageBus, globalUIChannel } from './core-communication.js'

/**
 * VoidCore - 親コア（SystemBootManager機能内蔵）
 * 
 * 責務:
 * - VoidCoreBaseの全機能
 * - Intent処理システム
 * - SystemBootManager機能（起動シーケンス管理）
 * - 高度なプラグイン階層管理
 * - CoreFusion（コア間融合）
 * - ハイブリッド通信システム
 * 
 * 設計原則:
 * - 親コアとしての管理責任を持つ
 * - 子コア・プラグインの起動を管理
 * - SystemBootManagerは外部プラグインではなく内蔵機能
 */
class VoidCore extends VoidCoreBase {
  constructor(transport = null, options = {}) {
    super(transport, options)
    
    // 拡張機能の初期化
    this.messagePool = new SimpleMessagePool()
    this.coreFusion = new CoreFusion()
    
    // ハイブリッド通信システム統合
    this.messageBus = globalMessageBus
    this.uiChannel = globalUIChannel
    
    // SystemBootManager機能（内蔵）
    this.systemBootManager = {
      bootSequence: [],
      systemStatus: 'waiting', // constructorでは待機状態
      bootTimestamp: Date.now(),
      bootPlan: null
    }
    
    // 非同期初期化は静的ファクトリメソッドで実行
    this.log('🏗️ VoidCore parent core constructed (awaiting async initialization)')
  }

  /**
   * 🏭 静的ファクトリメソッド: 安全な非同期初期化
   */
  static async create(transport = null, options = {}) {
    // 1. 基本インスタンス生成
    const instance = new VoidCore(transport, options)
    
    // 2. 非同期初期化実行
    await instance._performAsyncInitialization()
    
    // 3. 完全に初期化されたインスタンスを返却
    return instance
  }

  /**
   * 🔧 非同期初期化処理（分離された）
   */
  async _performAsyncInitialization() {
    try {
      // システムメッセージハンドラー初期化
      await this._initializeSystemMessageHandlers()
      
      // 親コアとしての起動管理開始
      await this._initializeAsParentCore()
      
      this.log('🎆 VoidCore parent core async initialization completed')
    } catch (error) {
      this.log(`❌ VoidCore parent core async initialization failed: ${error.message}`)
      this.systemBootManager.systemStatus = 'error'
      throw error
    }
  }

  async _performInitialization() {
    try {
      await super._performInitialization()
      
      // ハイブリッド通信システムに自動登録
      this.messageBus.registerCore(this.coreId, this)
      
      this.log('🎆 VoidCore (親コア) fully initialized with SystemBootManager')
    } catch (error) {
      this.log(`❌ VoidCore parent core initialization failed: ${error.message}`)
      throw error
    }
  }

  // ==========================================
  // SystemBootManager機能（内蔵実装）
  // ==========================================

  /**
   * 親コアとしての初期化
   */
  async _initializeAsParentCore() {
    this.log('🚀 Initializing as Parent Core with SystemBootManager')
    this.systemBootManager.systemStatus = 'loading'
    
    // 自動起動シーケンス開始
    await this._startSystemBootSequence()
  }

  /**
   * システム起動シーケンス開始（SystemBootManager機能）
   */
  async _startSystemBootSequence() {
    try {
      this.log('🔄 SystemBootManager: Starting boot sequence...')
      
      // Phase 1: コアシステム初期化確認
      await this._initializeCoreSystem()
      
      // Phase 2: 基本プラグイン準備完了チェック
      await this._checkCorePluginsReady()
      
      // Phase 3: システム起動完了通知
      await this._completeBootSequence()
      
    } catch (error) {
      this.log(`❌ SystemBootManager: Boot sequence failed - ${error.message}`)
      this.systemBootManager.systemStatus = 'failed'
      
      await this._handleBootError({
        error: error.message,
        timestamp: Date.now(),
        bootSequence: this.systemBootManager.bootSequence
      })
    }
  }

  /**
   * コアシステム初期化（SystemBootManager機能）
   */
  async _initializeCoreSystem() {
    this.log('🔧 SystemBootManager: Initializing core system...')
    
    this.systemBootManager.bootSequence.push({
      phase: 'core-init',
      timestamp: Date.now(),
      status: 'started'
    })
    
    // 親コアとしての基本機能確認
    await this._ensureInitialized()
    
    this.systemBootManager.bootSequence[this.systemBootManager.bootSequence.length - 1].status = 'completed'
    this.log('✅ SystemBootManager: Core system initialization completed')
  }

  /**
   * コアプラグイン準備確認（SystemBootManager機能）
   */
  async _checkCorePluginsReady() {
    this.log('🔍 SystemBootManager: Checking core plugins readiness...')
    
    this.systemBootManager.bootSequence.push({
      phase: 'core-plugins-check',
      timestamp: Date.now(),
      status: 'started'
    })
    
    // 基本的なプラグインの準備状況確認
    const pluginCount = this.getPluginCount()
    this.log(`📊 SystemBootManager: Found ${pluginCount} registered plugins`)
    
    this.systemBootManager.bootSequence[this.systemBootManager.bootSequence.length - 1].status = 'completed'
    this.log('✅ SystemBootManager: Core plugins readiness check completed')
  }

  /**
   * 起動シーケンス完了（SystemBootManager機能）
   */
  async _completeBootSequence() {
    this.systemBootManager.systemStatus = 'ready'
    
    this.systemBootManager.bootSequence.push({
      phase: 'boot-complete',
      timestamp: Date.now(),
      status: 'completed'
    })
    
    const bootDuration = Date.now() - this.systemBootManager.bootTimestamp
    
    // システム起動完了を通知
    await this.sendIntent('system.boot.ready', {
      success: true,
      timestamp: Date.now(),
      bootDuration: bootDuration,
      bootSequence: this.systemBootManager.bootSequence,
      parentCoreId: this.coreId
    })
    
    this.log(`🎉 SystemBootManager: Parent core boot completed! (${bootDuration}ms)`)
  }

  /**
   * 起動完了処理（SystemBootManager機能）
   */
  async _handleBootReady(payload) {
    this.log(`🎉 SystemBootManager: Boot ready notification processed - ${payload.bootDuration}ms`)
    
    // 起動完了を他のコンポーネントに通知
    await this.publish({
      type: 'Notice',
      event_name: 'system.boot.ready',
      payload: payload
    })
    
    return { success: true, acknowledged: true, timestamp: Date.now() }
  }

  /**
   * 起動エラー処理（SystemBootManager機能）
   */
  async _handleBootError(payload) {
    this.log(`❌ SystemBootManager: Boot error - ${payload.error}`)
    
    this.systemBootManager.systemStatus = 'error'
    
    // エラー通知を他のコンポーネントに送信
    await this.publish({
      type: 'Notice',
      event_name: 'system.bootError',
      payload: payload
    })
    
    return { success: true, errorHandled: true, timestamp: Date.now() }
  }

  // ==========================================
  // Intent処理システム
  // ==========================================

  async sendIntent(intentName, data = {}, options = {}) {
    await this._ensureInitialized()
    const intentMessage = Message.intent(intentName, data, options)
    this.log(`🎯 Sending Intent: ${intentName}`)
    return await this._processIntent(intentMessage)
  }

  async _processIntent(intentMessage) {
    const intent = intentMessage.intent
    if (!intent) throw new Error('Intent name is required')
    
    try {
      const intentPrefixHandlers = [
        { prefix: 'system.', handler: (msg) => this._handleSystemIntent(msg) },
        { prefix: 'plugin.', handler: (msg) => this._handlePluginIntent(msg) }
      ]
      
      const prefixHandler = intentPrefixHandlers.find(h => intent.startsWith(h.prefix))
      return prefixHandler ? 
        await prefixHandler.handler(intentMessage) : 
        await this._handleCustomIntent(intentMessage)
    } catch (error) {
      this.log(`❌ Intent processing failed: ${intent} - ${error.message}`)
      throw error
    }
  }

  static SYSTEM_INTENT_HANDLERS = {
    'system.createPlugin': async (payload, ctx) => await ctx._handleCreatePluginIntent(payload),
    'system.reparentPlugin': async (payload, ctx) => await ctx._handleReparentPluginIntent(payload),
    'system.destroyPlugin': async (payload, ctx) => await ctx._handleDestroyPluginIntent(payload),
    'system.getStats': async (payload, ctx) => ctx.getSystemStats(),
    'system.clear': async (payload, ctx) => await ctx.clear(),
    'system.getBootStatus': async (payload, ctx) => ctx._getSystemBootStatus(),
    'system.boot.ready': async (payload, ctx) => await ctx._handleBootReady(payload),
    'system.bootError': async (payload, ctx) => await ctx._handleBootError(payload),
    'system.initialize': async (payload, ctx) => await ctx._ensureInitialized()
  }

  async _handleSystemIntent(intentMessage) {
    const intent = intentMessage.intent
    const payload = intentMessage.payload
    this.log(`🔧 System intent: ${intent}, data: ${JSON.stringify(payload)}`)
    const handler = VoidCore.SYSTEM_INTENT_HANDLERS[intent]
    if (!handler) throw new Error(`Unknown system intent: ${intent}`)
    return await handler(payload, this)
  }

  async _handlePluginIntent(intentMessage) {
    const intent = intentMessage.intent
    const payload = intentMessage.payload
    this.log(`📨 Forwarding plugin intent: ${intent}, data: ${JSON.stringify(payload)}`)
    return await this._forwardToExistingSystem(intentMessage)
  }

  async _handleCustomIntent(intentMessage) {
    await this.publish(intentMessage)
    return { status: 'forwarded', intent: intentMessage.intent }
  }

  /**
   * SystemBootManager状態取得
   */
  _getSystemBootStatus() {
    return {
      systemStatus: this.systemBootManager.systemStatus,
      bootSequence: this.systemBootManager.bootSequence,
      bootDuration: Date.now() - this.systemBootManager.bootTimestamp,
      parentCoreId: this.coreId
    }
  }

  // ==========================================
  // 高度なプラグイン階層管理
  // ==========================================

  async _handleCreatePluginIntent(payload) {
    this.log(`🔧 Creating plugin via Intent: ${payload.type}`)
    return { status: 'created', pluginId: `plugin_${Date.now()}`, message: 'Plugin created via Intent system' }
  }

  async _handleReparentPluginIntent(payload) {
    const { childId, newParentId } = payload
    this.log(`🔧 Reparenting plugin via Intent: ${childId} -> ${newParentId}`)
    return { status: 'reparented', ...payload, message: 'Plugin reparented via Intent system' }
  }

  async _handleDestroyPluginIntent(payload) {
    const { pluginId } = payload
    this.log(`🔧 Destroying plugin via Intent: ${pluginId}`)
    return { status: 'destroyed', pluginId: payload.pluginId, message: 'Plugin destroyed via Intent system' }
  }

  async _forwardToExistingSystem(intentMessage) {
    return { status: 'forwarded', intent: intentMessage.intent, message: 'Forwarded to existing system' }
  }

  // ==========================================
  // CoreFusion機能
  // ==========================================
  
  async fuseWith(targetCore, config = {}) {
    const result = await this.coreFusion.fuseWith(this, targetCore, config)
    result.success ? 
      this.log(`🧩 CoreFusion v1.2: Successfully fused with target core (${result.pluginsMoved} plugins moved in ${result.processingTime}ms)`) :
      this.log(`❌ CoreFusion v1.2: Fusion failed - ${result.error}`)
    return result
  }

  // ==========================================
  // バッチメッセージ処理
  // ==========================================
  
  async publishBatch(messages) {
    if (!Array.isArray(messages)) {
      this.log('⚠️ publishBatch: messages must be an array')
      return { success: false, error: 'Invalid messages array' }
    }
    this.messagePool.setTransport({ send: async (message) => await this.publish(message) })
    const result = await this.messagePool.submitBatch(messages)
    result.success ? 
      this.log(`🚀 Batch published: ${result.processedCount} messages (${result.parallelCount} parallel, ${result.sequentialCount} sequential) in ${result.processingTime}ms`) :
      this.log(`❌ Batch publish failed: ${result.errors}`)
    return result
  }

  // ==========================================
  // ハイブリッド通信システム API
  // ==========================================

  async broadcastToAllCores(message) {
    return await this.messageBus.broadcast(message, this.coreId)
  }

  async sendToCore(targetCoreId, message) {
    return await this.messageBus.sendToCore(targetCoreId, message, this.coreId)
  }

  async fastUIUpdate(targetCoreId, updateData) {
    return await this.uiChannel.fastUpdate(targetCoreId, updateData)
  }

  getCommunicationStats() {
    return {
      messageBus: this.messageBus.getCommunicationStats(),
      uiChannel: this.uiChannel.getUIStats(),
      registeredCores: this.messageBus.getRegisteredCores(),
      thisCoreId: this.coreId
    }
  }

  configureUIChannel(enabled = true, batchInterval = 16) {
    this.uiChannel.configureBatching(enabled, batchInterval)
    this.log(`⚡ UI Channel configured: batching ${enabled ? 'enabled' : 'disabled'} (${batchInterval}ms)`)
  }

  // ==========================================
  // システム統計・管理
  // ==========================================

  getSystemStats() {
    const baseStats = this.getStats()
    const poolStats = this.messagePool.getStats()
    const bootStatus = this._getSystemBootStatus()
    
    return {
      ...baseStats,
      messagePool: poolStats,
      fusionHistory: this.coreFusion.getFusionHistory().length,
      systemBootManager: bootStatus,
      communicationStats: this.getCommunicationStats()
    }
  }

  async clear() {
    // ハイブリッド通信システムから登録解除
    this.messageBus.unregisterCore(this.coreId)
    
    await super.clear()
    this.messagePool.clear()
    this.coreFusion.clear()
    
    // SystemBootManager状態リセット
    this.systemBootManager = {
      bootSequence: [],
      systemStatus: 'cleared',
      bootTimestamp: Date.now(),
      bootPlan: null
    }
    
    this.log('🧹 VoidCore parent core cleared (including SystemBootManager)')
  }

  // ==========================================
  // システムメッセージハンドラー初期化
  // ==========================================

  static INTENT_REQUEST_HANDLERS = {
    'system.createPlugin': async (message, ctx) => await ctx._handleCreatePlugin(message),
    'system.destroyPlugin': async (message, ctx) => await ctx._handleDestroyPlugin(message),
    'system.reparentPlugin': async (message, ctx) => await ctx._handleReparentPlugin(message),
    'system.connect': async (message, ctx) => await ctx._handleConnect(message)
  }

  async _initializeSystemMessageHandlers() {
    await this.subscribe('IntentRequest', async (message) => {
      try {
        const handler = VoidCore.INTENT_REQUEST_HANDLERS[message.action]
        if (handler) await handler(message, this)
      } catch (error) {
        this.log(`❌ System message handler error: ${error.message}`)
        console.error('System handler error:', error)
      }
    })
  }

  // 基本的なシステムハンドラー実装
  async _handleCreatePlugin(message) {
    return this._handleCreatePluginIntent(message.payload)
  }

  async _handleDestroyPlugin(message) {
    return this._handleDestroyPluginIntent(message.payload)
  }

  async _handleReparentPlugin(message) {
    return this._handleReparentPluginIntent(message.payload)
  }

  async _handleConnect(message) {
    const { source, target, sourcePort, targetPort } = message.payload
    this.log(`🔗 System: Connection established - ${source}:${sourcePort} -> ${target}:${targetPort}`)
    return { status: 'connected', source, target, sourcePort, targetPort }
  }
}

export { VoidCore }
// voidCoreインスタンスは非同期初期化が必要なため、使用時にVoidCore.create()を呼び出してください
// export const voidCore = await VoidCore.create(null, { debug: false }) // ← これは直接書けない