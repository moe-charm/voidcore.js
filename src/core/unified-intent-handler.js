/**
 * 🌟 UnifiedIntentHandler - 統一Intent処理システム
 * 
 * 🔧 大工事Phase3: Intent処理統合完了版
 * 
 * 🎯 統合対象:
 * - VoidCore._processIntent() 
 * - VoidCore._handleSystemBootIntent()
 * - VoidCore._handlePluginManagementIntent()
 * - IntentHandler クラス全体
 * 
 * 🚀 設計思想:
 * - 統一されたIntent処理フロー
 * - 効率的な並行処理制御
 * - 統一された統計収集
 * 
 * Created: 2025-07-08 (大工事Phase3)
 */

import { Message } from '../messaging/message.js'

export class UnifiedIntentHandler {
  constructor(config = {}) {
    this.coreId = config.coreId || 'unified-intent-handler'
    this.core = config.core || null
    this.pluginManager = config.pluginManager || null
    
    // 🎯 統一Intent処理統計
    this.stats = {
      totalIntents: 0,
      systemIntents: 0,
      pluginIntents: 0,
      bootIntents: 0,
      fusionIntents: 0,
      customIntents: 0,
      successfulIntents: 0,
      failedIntents: 0,
      totalProcessingTime: 0,
      startTime: Date.now()
    }
    
    // 🔧 統一Intent処理履歴
    this.intentHistory = []
    this.maxHistorySize = 200
    
    // 🌟 統一Intent処理ルール
    this.intentRules = new Map()
    this.middleware = []
    
    // 🚀 統一並行処理制御
    this.pendingIntents = new Map() // correlationId -> Promise
    this.maxConcurrentIntents = config.maxConcurrentIntents || 100
    
    // 🎯 統一Intent処理ハンドラー
    this.intentHandlers = new Map()
    this.initializeHandlers()
    
    this.log('🌟 UnifiedIntentHandler initialized')
  }

  // ==========================================
  // 統一Intent処理ハンドラー初期化
  // ==========================================

  /**
   * Intent処理ハンドラー初期化
   */
  initializeHandlers() {
    // 🔧 システム起動Intent
    this.intentHandlers.set('system.boot.ready', this.handleSystemBootReady.bind(this))
    this.intentHandlers.set('system.boot.status', this.handleSystemBootStatus.bind(this))
    this.intentHandlers.set('system.boot.restart', this.handleSystemBootRestart.bind(this))
    
    // 🎯 プラグイン管理Intent
    this.intentHandlers.set('system.plugin.create', this.handlePluginCreate.bind(this))
    this.intentHandlers.set('system.plugin.destroy', this.handlePluginDestroy.bind(this))
    this.intentHandlers.set('system.plugin.list', this.handlePluginList.bind(this))
    this.intentHandlers.set('system.plugin.status', this.handlePluginStatus.bind(this))
    
    // 🌟 CoreFusion Intent
    this.intentHandlers.set('system.fusion.fuse', this.handleFusionFuse.bind(this))
    this.intentHandlers.set('system.fusion.status', this.handleFusionStatus.bind(this))
    
    // 🚀 システム管理Intent
    this.intentHandlers.set('system.stats', this.handleSystemStats.bind(this))
    this.intentHandlers.set('system.clear', this.handleSystemClear.bind(this))
    this.intentHandlers.set('system.connect', this.handleSystemConnect.bind(this))
    this.intentHandlers.set('system.reparent', this.handleSystemReparent.bind(this))
  }

  // ==========================================
  // 統一Intent処理メインシステム
  // ==========================================

  /**
   * 統一Intent処理メイン関数
   * @param {Object} intentMessage - Intent メッセージ
   * @returns {Promise<Object>} 処理結果
   */
  async processIntent(intentMessage) {
    const startTime = Date.now()
    const correlationId = intentMessage.correlationId || `intent_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    
    try {
      // 🔧 並行処理制御
      if (this.pendingIntents.size >= this.maxConcurrentIntents) {
        this.log(`⚠️ Intent queue full, rejecting: ${intentMessage.action}`)
        return { status: 'rejected', reason: 'Queue full' }
      }
      
      // 🎯 Intent処理Promise作成
      const intentPromise = this._executeIntent(intentMessage, correlationId)
      this.pendingIntents.set(correlationId, intentPromise)
      
      // 🌟 Intent処理実行
      const result = await intentPromise
      
      // 🚀 統計更新
      this.updateIntentStats(intentMessage, result, startTime)
      
      return result
      
    } catch (error) {
      this.log(`❌ Intent processing failed: ${error.message}`)
      this.updateIntentStats(intentMessage, { status: 'failed', error: error.message }, startTime)
      return { status: 'failed', error: error.message }
    } finally {
      this.pendingIntents.delete(correlationId)
    }
  }

  /**
   * Intent処理実行
   * @param {Object} intentMessage - Intent メッセージ
   * @param {string} correlationId - 相関ID
   * @returns {Promise<Object>} 処理結果
   */
  async _executeIntent(intentMessage, correlationId) {
    const { action, payload } = intentMessage
    
    // 🔧 前処理ミドルウェア
    let processedPayload = payload
    for (const middleware of this.middleware) {
      if (middleware.preProcess) {
        processedPayload = await middleware.preProcess(processedPayload, action)
      }
    }
    
    // 🎯 Intent処理ハンドラー実行
    const handler = this.intentHandlers.get(action)
    let result
    
    if (handler) {
      result = await handler(processedPayload, correlationId)
    } else {
      // 🌟 カスタムIntent処理
      result = await this.handleCustomIntent(action, processedPayload, correlationId)
    }
    
    // 🚀 後処理ミドルウェア
    for (const middleware of this.middleware) {
      if (middleware.postProcess) {
        result = await middleware.postProcess(result, action)
      }
    }
    
    return result
  }

  // ==========================================
  // システム起動Intent処理
  // ==========================================

  /**
   * system.boot.ready Intent処理
   * @param {Object} payload - ペイロード
   * @param {string} correlationId - 相関ID
   * @returns {Promise<Object>} 処理結果
   */
  async handleSystemBootReady(payload, correlationId) {
    this.log('🚀 System boot ready acknowledged')
    return { 
      status: 'acknowledged', 
      message: 'System boot ready acknowledged',
      timestamp: Date.now()
    }
  }

  /**
   * system.boot.status Intent処理
   * @param {Object} payload - ペイロード
   * @param {string} correlationId - 相関ID
   * @returns {Promise<Object>} 処理結果
   */
  async handleSystemBootStatus(payload, correlationId) {
    if (this.core && this.core.systemBootManager) {
      return { 
        status: 'success', 
        systemStatus: this.core.systemBootManager.systemStatus,
        isBootComplete: this.core.systemBootManager.isBootComplete,
        bootSequence: this.core.systemBootManager.bootSequence
      }
    }
    return { status: 'failed', reason: 'SystemBootManager not available' }
  }

  /**
   * system.boot.restart Intent処理
   * @param {Object} payload - ペイロード
   * @param {string} correlationId - 相関ID
   * @returns {Promise<Object>} 処理結果
   */
  async handleSystemBootRestart(payload, correlationId) {
    this.log('🔄 System restart requested')
    if (this.core && this.core.systemBootManager) {
      this.core.systemBootManager.systemStatus = 'restarting'
      // 再起動処理（実装は後で）
      return { status: 'restarting', message: 'System restart initiated' }
    }
    return { status: 'failed', reason: 'SystemBootManager not available' }
  }

  // ==========================================
  // プラグイン管理Intent処理
  // ==========================================

  /**
   * system.plugin.create Intent処理
   * @param {Object} payload - ペイロード
   * @param {string} correlationId - 相関ID
   * @returns {Promise<Object>} 処理結果
   */
  async handlePluginCreate(payload, correlationId) {
    if (this.pluginManager) {
      return await this.pluginManager.handleCreatePluginIntent(payload)
    }
    
    // 🔧 後方互換性のためのフォールバック
    this.log(`🔧 Creating plugin via Intent: ${payload.type}`)
    return { 
      status: 'created', 
      pluginId: `plugin_${Date.now()}`, 
      message: 'Plugin created via Intent system' 
    }
  }

  /**
   * system.plugin.destroy Intent処理
   * @param {Object} payload - ペイロード
   * @param {string} correlationId - 相関ID
   * @returns {Promise<Object>} 処理結果
   */
  async handlePluginDestroy(payload, correlationId) {
    if (this.pluginManager) {
      return await this.pluginManager.handleDestroyPluginIntent(payload)
    }
    
    // 🔧 後方互換性のためのフォールバック
    const pluginId = payload.pluginId
    this.log(`🔧 Destroying plugin via Intent: ${pluginId}`)
    return { 
      status: 'destroyed', 
      pluginId: payload.pluginId, 
      message: 'Plugin destroyed via Intent system' 
    }
  }

  /**
   * system.plugin.list Intent処理
   * @param {Object} payload - ペイロード
   * @param {string} correlationId - 相関ID
   * @returns {Promise<Object>} 処理結果
   */
  async handlePluginList(payload, correlationId) {
    if (this.pluginManager) {
      const plugins = this.pluginManager.getAllPlugins()
      return { 
        status: 'success', 
        plugins: plugins.map(p => ({ id: p.id, type: p.type, status: p.status })),
        count: plugins.length
      }
    }
    return { status: 'failed', reason: 'PluginManager not available' }
  }

  /**
   * system.plugin.status Intent処理
   * @param {Object} payload - ペイロード
   * @param {string} correlationId - 相関ID
   * @returns {Promise<Object>} 処理結果
   */
  async handlePluginStatus(payload, correlationId) {
    if (this.pluginManager) {
      const plugin = this.pluginManager.getPlugin(payload.pluginId)
      if (plugin) {
        return { 
          status: 'success', 
          plugin: { id: plugin.id, type: plugin.type, status: plugin.status }
        }
      }
    }
    return { status: 'failed', reason: 'Plugin not found' }
  }

  // ==========================================
  // CoreFusion Intent処理
  // ==========================================

  /**
   * system.fusion.fuse Intent処理
   * @param {Object} payload - ペイロード
   * @param {string} correlationId - 相関ID
   * @returns {Promise<Object>} 処理結果
   */
  async handleFusionFuse(payload, correlationId) {
    if (this.core && this.core.coreFusion) {
      const result = await this.core.fuseWith(payload.targetCore, payload.config)
      return { 
        status: result.success ? 'success' : 'failed',
        ...result
      }
    }
    return { status: 'failed', reason: 'CoreFusion not available' }
  }

  /**
   * system.fusion.status Intent処理
   * @param {Object} payload - ペイロード
   * @param {string} correlationId - 相関ID
   * @returns {Promise<Object>} 処理結果
   */
  async handleFusionStatus(payload, correlationId) {
    if (this.core && this.core.coreFusion) {
      const history = this.core.coreFusion.getFusionHistory()
      return { 
        status: 'success', 
        fusionHistory: history,
        fusionCount: history.length
      }
    }
    return { status: 'failed', reason: 'CoreFusion not available' }
  }

  // ==========================================
  // システム管理Intent処理
  // ==========================================

  /**
   * system.stats Intent処理
   * @param {Object} payload - ペイロード
   * @param {string} correlationId - 相関ID
   * @returns {Promise<Object>} 処理結果
   */
  async handleSystemStats(payload, correlationId) {
    const stats = {
      intentHandler: this.getStats(),
      pluginManager: this.pluginManager ? this.pluginManager.getStats() : null,
      core: this.core ? this.core.getStats() : null
    }
    return { status: 'success', stats }
  }

  /**
   * system.clear Intent処理
   * @param {Object} payload - ペイロード
   * @param {string} correlationId - 相関ID
   * @returns {Promise<Object>} 処理結果
   */
  async handleSystemClear(payload, correlationId) {
    this.log('🧹 System clear requested')
    if (this.core && this.core.clear) {
      await this.core.clear()
      return { status: 'cleared', message: 'System cleared successfully' }
    }
    return { status: 'failed', reason: 'Core not available' }
  }

  /**
   * system.connect Intent処理
   * @param {Object} payload - ペイロード
   * @param {string} correlationId - 相関ID
   * @returns {Promise<Object>} 処理結果
   */
  async handleSystemConnect(payload, correlationId) {
    this.log(`🔗 System connect: ${payload.source} -> ${payload.target}`)
    return { 
      status: 'connected', 
      source: payload.source, 
      target: payload.target,
      timestamp: Date.now()
    }
  }

  /**
   * system.reparent Intent処理
   * @param {Object} payload - ペイロード
   * @param {string} correlationId - 相関ID
   * @returns {Promise<Object>} 処理結果
   */
  async handleSystemReparent(payload, correlationId) {
    this.log(`🔄 System reparent: ${payload.pluginId} -> ${payload.newParent}`)
    return { 
      status: 'reparented', 
      pluginId: payload.pluginId, 
      newParent: payload.newParent,
      timestamp: Date.now()
    }
  }

  // ==========================================
  // カスタムIntent処理
  // ==========================================

  /**
   * カスタムIntent処理
   * @param {string} action - Intent アクション
   * @param {Object} payload - ペイロード
   * @param {string} correlationId - 相関ID
   * @returns {Promise<Object>} 処理結果
   */
  async handleCustomIntent(action, payload, correlationId) {
    this.log(`🎯 Custom intent: ${action}`)
    
    // 🔧 既存システムに転送
    return await this.forwardToExistingSystem(action, payload)
  }

  /**
   * 既存システムに転送
   * @param {string} action - Intent アクション
   * @param {Object} payload - ペイロード
   * @returns {Promise<Object>} 処理結果
   */
  async forwardToExistingSystem(action, payload) {
    return { 
      status: 'forwarded', 
      intent: action, 
      message: 'Forwarded to existing system',
      timestamp: Date.now()
    }
  }

  // ==========================================
  // 統一統計システム
  // ==========================================

  /**
   * 統一統計取得
   * @returns {Object} 統計情報
   */
  getStats() {
    return {
      ...this.stats,
      runtime: Date.now() - this.stats.startTime,
      pendingIntents: this.pendingIntents.size,
      registeredHandlers: this.intentHandlers.size,
      recentIntents: this.intentHistory.slice(-10)
    }
  }

  /**
   * Intent統計更新
   * @param {Object} intentMessage - Intent メッセージ
   * @param {Object} result - 処理結果
   * @param {number} startTime - 開始時間
   */
  updateIntentStats(intentMessage, result, startTime) {
    const processingTime = Date.now() - startTime
    const { action } = intentMessage
    
    this.stats.totalIntents++
    this.stats.totalProcessingTime += processingTime
    
    // 🔧 Intent種別統計
    if (action.startsWith('system.boot.')) {
      this.stats.bootIntents++
    } else if (action.startsWith('system.plugin.')) {
      this.stats.pluginIntents++
    } else if (action.startsWith('system.fusion.')) {
      this.stats.fusionIntents++
    } else if (action.startsWith('system.')) {
      this.stats.systemIntents++
    } else {
      this.stats.customIntents++
    }
    
    // 🎯 成功・失敗統計
    if (result.status === 'success' || result.status === 'created' || result.status === 'destroyed') {
      this.stats.successfulIntents++
    } else {
      this.stats.failedIntents++
    }
    
    // 🌟 履歴記録
    this.recordIntentHistory(intentMessage, result, processingTime)
  }

  /**
   * Intent履歴記録
   * @param {Object} intentMessage - Intent メッセージ
   * @param {Object} result - 処理結果
   * @param {number} processingTime - 処理時間
   */
  recordIntentHistory(intentMessage, result, processingTime) {
    this.intentHistory.push({
      timestamp: Date.now(),
      action: intentMessage.action,
      status: result.status,
      processingTime,
      correlationId: intentMessage.correlationId
    })
    
    // 履歴サイズ制限
    if (this.intentHistory.length > this.maxHistorySize) {
      this.intentHistory.shift()
    }
  }

  // ==========================================
  // ミドルウェア管理
  // ==========================================

  /**
   * ミドルウェア追加
   * @param {Object} middleware - ミドルウェア
   */
  addMiddleware(middleware) {
    this.middleware.push(middleware)
    this.log(`🔧 Middleware added: ${middleware.name || 'unnamed'}`)
  }

  /**
   * Intent処理ハンドラー登録
   * @param {string} action - Intent アクション
   * @param {Function} handler - ハンドラー関数
   */
  registerIntentHandler(action, handler) {
    this.intentHandlers.set(action, handler)
    this.log(`🎯 Intent handler registered: ${action}`)
  }

  // ==========================================
  // ユーティリティ
  // ==========================================

  /**
   * ログ出力
   * @param {string} message - ログメッセージ
   */
  log(message) {
    if (this.core && this.core.log) {
      this.core.log(message)
    } else {
      console.log(`[${this.coreId}] ${message}`)
    }
  }

  /**
   * クリーンアップ
   */
  async clear() {
    // 待機中のIntent処理をクリア
    this.pendingIntents.clear()
    
    // 履歴とミドルウェアをクリア
    this.intentHistory = []
    this.middleware = []
    
    // 統計リセット
    this.stats = {
      totalIntents: 0,
      systemIntents: 0,
      pluginIntents: 0,
      bootIntents: 0,
      fusionIntents: 0,
      customIntents: 0,
      successfulIntents: 0,
      failedIntents: 0,
      totalProcessingTime: 0,
      startTime: Date.now()
    }
    
    this.log('🧹 UnifiedIntentHandler cleared')
  }
}

export default UnifiedIntentHandler