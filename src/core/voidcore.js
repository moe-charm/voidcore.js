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
 * 🌟 大工事Phase3完了: 機能統合・重複実装削除
 * - UnifiedPluginManager統合
 * - UnifiedIntentHandler統合
 * - UnifiedStatsManager統合
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
import { UnifiedPluginManager } from './unified-plugin-manager.js'
import { UnifiedIntentHandler } from './unified-intent-handler.js'
import { UnifiedStatsManager } from './unified-stats-manager.js'

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
    
    // 🔧 大工事Phase3: 統合システム初期化
    this.unifiedPluginManager = new UnifiedPluginManager({ 
      coreId: this.coreId, 
      core: this 
    })
    this.unifiedIntentHandler = new UnifiedIntentHandler({ 
      coreId: this.coreId, 
      core: this, 
      pluginManager: this.unifiedPluginManager 
    })
    this.unifiedStatsManager = new UnifiedStatsManager({ 
      coreId: this.coreId, 
      core: this, 
      pluginManager: this.unifiedPluginManager, 
      intentHandler: this.unifiedIntentHandler,
      channelManager: this.channelManager 
    })
    
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
   * プラグイン登録（大工事Phase3: 統合システム委譲）
   */
  async registerPlugin(plugin) {
    await this._ensureInitialized()
    return await this.unifiedPluginManager.registerPlugin(plugin)
  }

  /**
   * プラグイン取得（大工事Phase3: 統合システム委譲）
   */
  getPlugins() {
    return this.unifiedPluginManager.getAllPlugins()
  }

  /**
   * プラグイン削除（大工事Phase3: 統合システム委譲）
   */
  removePlugin(pluginId) {
    return this.unifiedPluginManager.unregisterPlugin(pluginId)
  }

  // ==========================================
  // Intent処理システム
  // ==========================================

  /**
   * Intent処理の統一エントリポイント（大工事Phase3: 統合システム委譲）
   */
  async _processIntent(intentMessage) {
    return await this.unifiedIntentHandler.processIntent(intentMessage)
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
    // 🔧 大工事Phase3: 統合統計システム委譲
    return this.unifiedStatsManager.collectAllStats()
  }

  getSystemStats() {
    // 🔧 大工事Phase3: 統合統計システム委譲
    return this.unifiedStatsManager.collectAllStats()
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
    // 🔧 大工事Phase3: 統合システムクリーンアップ
    await this.unifiedStatsManager.clear()
    await this.unifiedIntentHandler.clear()
    await this.unifiedPluginManager.clear()
    
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


  async _initializeSystemMessageHandlers() {
    // 🔧 大工事Phase3: Intent処理統合対応
    await this.base.subscribe('IntentRequest', async (message) => {
      try {
        const result = await this.unifiedIntentHandler.processIntent(message)
        this.log(`✅ Intent processed: ${message.action} - ${result.status}`)
      } catch (error) {
        this.log(`❌ System message handler error: ${error.message}`)
        console.error('System handler error:', error)
      }
    })
  }




}

// 🎯 デフォルトインスタンス作成
export const voidCore = new VoidCore(null, { debug: false })
export { VoidCore }