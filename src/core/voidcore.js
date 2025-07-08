/**
 * 🌟 VoidCore v14.0 - 革新的メッセージベースアーキテクチャ
 * 
 * 🎯 設計哲学:
 * - "すべての存在は、メッセージで生まれ、メッセージで終わる"
 * - 純粋なComposition（継承を排除）
 * - IPlugin統一インターフェース
 * - Intent駆動の意図明確システム
 * - 3層責任分離: Base → Core → FastLink
 * 
 * 🚀 核心革新:
 * - SystemBootManager内蔵（外部プラグインではなく）
 * - HandlerMap方式によるif文撲滅
 * - 統一Factory（Message/Response）
 * - 状態管理の独立化
 * 
 * 📊 Phase S4成果: 963行→645行（35%削減）
 * 
 * Created: 2025-01-25
 * Last Updated: 2025-07-08 (大工事Phase2: 継承関係改革完了)
 * 
 * 🔧 大工事Phase2完了: 継承廃止→コンポジション設計移行
 * - VoidCore extends VoidCoreBase → コンポジション
 * - 依存性注入による疎結合設計
 * - 明確な責任分離実現
 * 
 * 🌟 Phase 5.2機能追加:
 * - SimpleMessagePool統合
 * - CoreFusion統合
 * - ハイブリッド通信システム
 * 
 * 設計原則:
 * - 親コアとしての管理責任を持つ
 * - 子コア・プラグインの起動を管理
 * - SystemBootManagerは外部プラグインではなく内蔵機能
 */

import { VoidCoreBase } from './voidcore_base.js'
import { Message } from '../messaging/message.js'
import { SimpleMessagePool } from '../messaging/simple-message-pool.js'
import { CoreFusion } from './core-fusion.js'
import { globalMessageBus, globalUIChannel } from './core-communication.js'

class VoidCore {
  constructor(transport = null, options = {}) {
    // 🔧 大工事Phase2: 継承廃止→コンポジション設計
    // VoidCoreBase機能をコンポジションで統合
    this.base = new VoidCoreBase(transport, options)
    
    // 🎯 基本プロパティ移行
    this.id = this.base.id
    this.name = this.base.name
    this.version = this.base.version
    this.channelManager = this.base.channelManager
    this.pluginStore = this.base.pluginStore
    this.enableLogging = this.base.enableLogging
    this.logLevel = this.base.logLevel
    this.messageHandlers = this.base.messageHandlers
    this.initialized = this.base.initialized
    this.coreId = this.base.coreId
    this.debugMode = this.base.debugMode
    this.logElement = this.base.logElement
    
    // 拡張機能の初期化
    this.messagePool = new SimpleMessagePool()
    this.coreFusion = new CoreFusion()
    
    // ハイブリッド通信システム統合
    this.messageBus = globalMessageBus
    this.uiChannel = globalUIChannel
    
    // SystemBootManager機能（内蔵）
    this.systemBootManager = {
      bootSequence: [],
      systemStatus: 'inactive',
      bootTime: Date.now(),
      isBootComplete: false,
      childPlugins: new Map(),
      bootOrder: [],
      
      // 親コアとしての管理状態
      parentCoreReady: false,
      childCoreCount: 0,
      managedPlugins: new Map(),
      
      // 通信バス統合
      messageBus: this.messageBus,
      uiChannel: this.uiChannel
    }
    
    // 非同期初期化開始
    this.initPromise = this._performAsyncInitialization()
  }

  async _performAsyncInitialization() {
    try {
      // 基本初期化
      await this._ensureInitialized()
      
      // 親コア初期化
      await this._initializeAsParentCore()
      
      // システムメッセージハンドラー初期化
      await this._initializeSystemMessageHandlers()
      
      this.log('🎆 VoidCore (Parent Core) fully initialized')
    } catch (error) {
      this.log(`❌ VoidCore async initialization failed: ${error.message}`)
      throw error
    }
  }

  async _performInitialization() {
    try {
      // 🔧 大工事Phase2: super呼び出し→コンポジション委譲
      await this.base._performInitialization()
      
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
   * システム起動シーケンス
   */
  async _startSystemBootSequence() {
    this.systemBootManager.bootSequence.push('System boot sequence started')
    
    // 🌟 system.boot.ready Intent送信
    await this._sendSystemBootReadyIntent()
    
    this.systemBootManager.systemStatus = 'ready'
    this.systemBootManager.isBootComplete = true
    this.systemBootManager.parentCoreReady = true
    
    this.log('✅ SystemBootManager: Boot sequence completed')
  }

  /**
   * system.boot.ready Intent送信
   */
  async _sendSystemBootReadyIntent() {
    const bootReadyIntent = Message.IntentRequest('system.boot.ready', {
      timestamp: Date.now(),
      coreId: this.coreId,
      bootSequence: this.systemBootManager.bootSequence,
      systemStatus: this.systemBootManager.systemStatus
    })
    
    await this.sendMessage(bootReadyIntent)
    this.systemBootManager.bootSequence.push('system.boot.ready Intent sent')
  }

  // ==========================================
  // メッセージング機能（大工事Phase2: コンポジション委譲）
  // ==========================================

  /**
   * メッセージ送信
   */
  async sendMessage(message) {
    await this._ensureInitialized()
    return await this.base.sendMessage(message)
  }

  /**
   * メッセージ受信
   */
  receiveMessage(message) {
    return this.base.receiveMessage(message)
  }

  /**
   * メッセージ購読
   */
  async subscribe(type, handler) {
    return await this.base.subscribe(type, handler)
  }

  /**
   * メッセージ発行
   */
  async publish(message) {
    return await this.sendMessage(message)
  }

  // ==========================================
  // プラグイン管理機能（大工事Phase2: コンポジション委譲）
  // ==========================================

  /**
   * プラグイン登録
   */
  async registerPlugin(plugin) {
    await this._ensureInitialized()
    return this.base.registerPlugin(plugin)
  }

  /**
   * プラグイン取得
   */
  getPlugins() {
    return this.base.getPlugins()
  }

  /**
   * プラグイン削除
   */
  removePlugin(pluginId) {
    return this.base.removePlugin(pluginId)
  }

  // ==========================================
  // Intent処理システム
  // ==========================================

  /**
   * Intent処理の統一エントリポイント
   */
  async _processIntent(intentMessage) {
    const { action, payload } = intentMessage
    
    // システム起動関連Intent処理
    if (action?.startsWith('system.boot.')) {
      return await this._handleSystemBootIntent(action, payload)
    }
    
    // プラグイン管理Intent処理
    if (action?.startsWith('system.plugin.')) {
      return await this._handlePluginManagementIntent(action, payload)
    }
    
    // CoreFusion Intent処理
    if (action?.startsWith('system.fusion.')) {
      return await this._handleCoreFusionIntent(action, payload)
    }
    
    // 通常のIntent処理
    return await this._handleRegularIntent(action, payload)
  }

  async _handleSystemBootIntent(action, payload) {
    switch (action) {
      case 'system.boot.ready':
        return { status: 'acknowledged', message: 'System boot ready acknowledged' }
      case 'system.boot.status':
        return { status: 'success', systemStatus: this.systemBootManager.systemStatus }
      default:
        return { status: 'unknown', message: `Unknown system boot intent: ${action}` }
    }
  }

  async _handlePluginManagementIntent(action, payload) {
    switch (action) {
      case 'system.plugin.create':
        return await this._handleCreatePluginIntent(payload)
      case 'system.plugin.destroy':
        return await this._handleDestroyPluginIntent(payload)
      default:
        return { status: 'unknown', message: `Unknown plugin management intent: ${action}` }
    }
  }

  async _handleCoreFusionIntent(action, payload) {
    switch (action) {
      case 'system.fusion.fuse':
        return await this._handleFusionIntent(payload)
      default:
        return { status: 'unknown', message: `Unknown fusion intent: ${action}` }
    }
  }

  async _handleRegularIntent(action, payload) {
    // 通常Intent処理またはシステムに転送
    return await this._forwardToExistingSystem({ action, payload })
  }

  async _handleCreatePluginIntent(payload) {
    // 🔧 大工事Phase3: プラグイン管理統合対象（重複実装マーキング）
    this.log(`🔧 Creating plugin via Intent: ${payload.type}`)
    return { status: 'created', pluginId: `plugin_${Date.now()}`, message: 'Plugin created via Intent system' }
  }

  async _handleDestroyPluginIntent(payload) {
    // 🔧 大工事Phase3: プラグイン管理統合対象（重複実装マーキング）
    const pluginId = payload.pluginId
    this.log(`🔧 Destroying plugin via Intent: ${pluginId}`)
    return { status: 'destroyed', pluginId: payload.pluginId, message: 'Plugin destroyed via Intent system' }
  }

  async _forwardToExistingSystem(intentMessage) {
    return { status: 'forwarded', intent: intentMessage.action, message: 'Forwarded to existing system' }
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
    return await this.messagePool.submitBatch(messages)
  }

  // ==========================================
  // 統計・状態管理
  // ==========================================
  
  getStats() {
    return {
      ...this.base.getStats(),
      systemBootManager: {
        systemStatus: this.systemBootManager.systemStatus,
        isBootComplete: this.systemBootManager.isBootComplete,
        parentCoreReady: this.systemBootManager.parentCoreReady,
        childCoreCount: this.systemBootManager.childCoreCount,
        bootSequence: this.systemBootManager.bootSequence
      }
    }
  }

  getSystemStats() {
    const poolStats = this.messagePool.getStats()
    return {
      coreId: this.coreId,
      systemStatus: this.systemBootManager.systemStatus,
      isBootComplete: this.systemBootManager.isBootComplete,
      parentCoreReady: this.systemBootManager.parentCoreReady,
      childCoreCount: this.systemBootManager.childCoreCount,
      messagePool: poolStats,
      fusionHistory: this.coreFusion.getFusionHistory().length
    }
  }

  // ==========================================
  // ユーティリティ機能（大工事Phase2: コンポジション委譲）
  // ==========================================

  /**
   * ログ出力
   */
  log(message, ...args) {
    return this.base.log(message, ...args)
  }

  /**
   * ログ要素設定
   */
  setLogElement(element) {
    this.base.setLogElement(element)
    this.logElement = element
  }

  /**
   * 初期化確認
   */
  async _ensureInitialized() {
    return await this.base._ensureInitialized()
  }

  /**
   * チャンネルマネージャー取得
   */
  getChannelManager() {
    return this.base.getChannelManager()
  }

  /**
   * クリーンアップ
   */
  async clear() {
    // ハイブリッド通信システムから登録解除
    this.messageBus.unregisterCore(this.coreId)
    
    // 🔧 大工事Phase2: super呼び出し→コンポジション委譲
    await this.base.clear()
    this.messagePool.clear()
    this.coreFusion.clear()
    
    // SystemBootManager状態リセット
    this.systemBootManager.systemStatus = 'inactive'
    this.systemBootManager.isBootComplete = false
    this.systemBootManager.parentCoreReady = false
    this.systemBootManager.childCoreCount = 0
    
    this.log('🧹 VoidCore cleared')
  }

  // ==========================================
  // システムハンドラー登録
  // ==========================================

  static INTENT_REQUEST_HANDLERS = {
    'system.createPlugin': async (message, ctx) => await ctx._handleCreatePlugin(message),
    'system.destroyPlugin': async (message, ctx) => await ctx._handleDestroyPlugin(message),
    'system.reparentPlugin': async (message, ctx) => await ctx._handleReparentPlugin(message),
    'system.connect': async (message, ctx) => await ctx._handleConnect(message)
  }

  async _initializeSystemMessageHandlers() {
    // 🔧 大工事Phase2: subscribe→コンポジション委譲
    await this.base.subscribe('IntentRequest', async (message) => {
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
    return { status: 'reparented', pluginId: message.payload.pluginId, newParent: message.payload.newParent }
  }

  async _handleConnect(message) {
    return { status: 'connected', source: message.payload.source, target: message.payload.target }
  }
}

// 🎯 デフォルトインスタンス作成
export const voidCore = new VoidCore(null, { debug: false })
export { VoidCore }