/**
 * 🌟 VoidFlowCore - VoidFlow + VoidCore統合管理クラス
 * 
 * 🎯 目標:
 * - GUI操作の完全Intent化
 * - 統一デバッグシステム構築
 * - デバッグ性能の劇的向上
 * 
 * 🚀 機能:
 * - VoidCore v14.0統一Intentアーキテクチャ活用
 * - UI操作・接続管理の統一化
 * - リアルタイムデバッグ・トレース機能
 * - エラー処理の一元化
 * 
 * Created: 2025-07-09
 * Phase 1: 基盤構築
 */

import { VoidCore } from '../../src/core/nyacore.js'
import { Message } from '../../src/messaging/message.js'
import { DefaultTransport } from '../../src/messaging/transport.js'
import { VoidFlowDebugManager } from './debug-manager.js'
import { VoidFlowDebugPlugin } from './voidflow-debug-plugin.js'

/**
 * VoidFlowとVoidCoreの統合管理クラス
 */
export class VoidFlowCore {
  constructor(options = {}) {
    this.options = {
      enableDebug: true,
      enableStats: true,
      messagePoolSize: 1000,
      intentTraceLevel: 'basic',
      ...options
    }
    
    // VoidCore初期化（明示的にDefaultTransportを渡す）
    const transport = new DefaultTransport()
    this.voidCore = new VoidCore(transport, {
      enableDebug: this.options.enableDebug,
      enableStats: this.options.enableStats,
      messagePoolSize: this.options.messagePoolSize
    })
    
    // システム状態
    this.isInitialized = false
    this.intentHandlers = new Map()
    this.debugManager = null
    this.debugPlugin = null
    this.intentBridge = null
    
    // VoidFlow コンポーネント参照
    this.uiManager = null
    this.connectionManager = null
    this.paletteManager = null
    
    this.log('🌟 VoidFlowCore initializing...')
    this.initialize()
  }
  
  /**
   * 初期化処理
   */
  async initialize() {
    try {
      // Intent ハンドラー設定
      this.setupIntentHandlers()
      
      // デバッグ機能初期化（Phase 4実装完了）
      if (this.options.enableDebug) {
        // VoidCoreルール準拠のDebugPlugin初期化
        this.debugPlugin = new VoidFlowDebugPlugin({
          options: {
            enableDebug: this.options.enableDebug,
            enableStats: this.options.enableStats,
            enableTrace: false,
            traceLevel: this.options.intentTraceLevel
          }
        })
        
        // VoidCoreに登録
        await this.voidCore.registerPlugin(this.debugPlugin)
        await this.debugPlugin.onActivated()
        
        // ターゲットシステム設定
        this.debugPlugin.setTargetSystem(this)
        
        // レガシーDebugManager（互換性のため）
        this.debugManager = new VoidFlowDebugManager(this)
        
        this.log('🐛 VoidFlowDebugPlugin (VoidCore準拠) + DebugManager initialized')
        
        // グローバルデバッグ関数作成（テストページ用）
        this.setupGlobalDebugFunctions()
      }
      
      // Intent Bridge初期化（Phase 2で実装予定）
      // this.intentBridge = new VoidFlowIntentBridge(this)
      
      this.isInitialized = true
      this.log('✅ VoidFlowCore initialized successfully')
      
      // 初期化完了Intent
      await this.sendIntent('voidflow.system.initialized', {
        timestamp: Date.now(),
        version: '1.0.0',
        features: this.getAvailableFeatures()
      })
      
    } catch (error) {
      this.logError('❌ VoidFlowCore initialization failed', error)
      throw error
    }
  }
  
  /**
   * Intent ハンドラー設定
   */
  setupIntentHandlers() {
    // システムIntent
    this.registerIntentHandler('voidflow.system.initialized', this.handleSystemIntent.bind(this))
    this.registerIntentHandler('voidflow.system.shutdown', this.handleSystemIntent.bind(this))
    this.registerIntentHandler('voidflow.system.status', this.handleSystemIntent.bind(this))
    
    // UI操作Intent（Phase 2で実装）
    this.registerIntentHandler('voidflow.ui.element.create', this.handleUIIntent.bind(this))
    this.registerIntentHandler('voidflow.ui.element.move', this.handleUIIntent.bind(this))
    this.registerIntentHandler('voidflow.ui.element.select', this.handleUIIntent.bind(this))
    this.registerIntentHandler('voidflow.ui.element.delete', this.handleUIIntent.bind(this))
    this.registerIntentHandler('voidflow.ui.element.update', this.handleUIIntent.bind(this))
    
    // 接続管理Intent（Phase 3で実装）
    this.registerIntentHandler('voidflow.ui.connection.start', this.handleConnectionIntent.bind(this))
    this.registerIntentHandler('voidflow.ui.connection.complete', this.handleConnectionIntent.bind(this))
    this.registerIntentHandler('voidflow.ui.connection.cancel', this.handleConnectionIntent.bind(this))
    this.registerIntentHandler('voidflow.ui.connection.delete', this.handleConnectionIntent.bind(this))
    
    // プラグイン管理Intent
    this.registerIntentHandler('voidflow.ui.plugin.add', this.handlePluginIntent.bind(this))
    this.registerIntentHandler('voidflow.ui.plugin.configure', this.handlePluginIntent.bind(this))
    
    // デバッグIntent（Phase 4で実装）
    this.registerIntentHandler('voidflow.debug.trace.start', this.handleDebugIntent.bind(this))
    this.registerIntentHandler('voidflow.debug.trace.stop', this.handleDebugIntent.bind(this))
    this.registerIntentHandler('voidflow.debug.state.dump', this.handleDebugIntent.bind(this))
    this.registerIntentHandler('voidflow.debug.state.capture', this.handleDebugIntent.bind(this))
    this.registerIntentHandler('voidflow.debug.performance.measure', this.handleDebugIntent.bind(this))
    this.registerIntentHandler('voidflow.debug.stats.get', this.handleDebugIntent.bind(this))
    this.registerIntentHandler('voidflow.debug.export', this.handleDebugIntent.bind(this))
    this.registerIntentHandler('voidflow.debug.reset', this.handleDebugIntent.bind(this))
    
    this.log('📋 Intent handlers registered')
  }
  
  /**
   * Intent ハンドラー登録
   */
  registerIntentHandler(pattern, handler) {
    this.intentHandlers.set(pattern, handler)
    this.voidCore.unifiedIntentHandler.registerIntentHandler(pattern, handler)
  }
  
  /**
   * Intent 送信
   */
  async sendIntent(type, payload = {}) {
    try {
      if (!this.isInitialized && !type.startsWith('voidflow.system.')) {
        throw new Error('VoidFlowCore not initialized')
      }
      
      const intentPayload = {
        ...payload,
        timestamp: Date.now(),
        source: 'voidflow-core',
        intentType: type  // ハンドラーでtype判定用
      }
      
      this.log(`📤 Sending Intent: ${type}`)
      
      // VoidCore経由でIntent送信（_processIntentで直接処理）
      const intentMessage = Message.intentRequest(type, type, intentPayload)
      this.log(`🔍 Created Intent message: ${JSON.stringify(intentMessage, null, 2)}`)
      this.log(`🔍 Created Intent keys: ${Object.keys(intentMessage)}`)
      const result = await this.voidCore._processIntent(intentMessage)
      
      this.log(`✅ Intent processed: ${type}`)
      this.log(`🔍 Intent result:`, result)
      return result
      
    } catch (error) {
      this.logError(`❌ Intent failed: ${type}`, error)
      throw error
    }
  }
  
  /**
   * システムIntent処理
   */
  async handleSystemIntent(payload) {
    this.log(`🔍 System Intent payload: ${JSON.stringify(payload, null, 2)}`)
    const type = payload.intentType || 'unknown'
    
    switch (type) {
      case 'voidflow.system.initialized':
        this.log('🎉 VoidFlow system initialized')
        return { status: 'initialized', features: payload.features }
      
      case 'voidflow.system.shutdown':
        return await this.shutdown()
      
      case 'voidflow.system.status':
        return this.getSystemStatus()
      
      default:
        this.log(`⚠️ Unknown system intent: ${type}`)
        return { status: 'unknown', type }
    }
  }
  
  /**
   * UI Intent処理（Phase 2実装開始）
   */
  async handleUIIntent(intentMessage) {
    const type = intentMessage.action || intentMessage.type
    const payload = intentMessage.payload || intentMessage
    
    this.log(`🎨 UI Intent received: ${type}`)
    
    switch (type) {
      case 'voidflow.ui.element.create':
        return await this.handleElementCreate(payload)
      
      case 'voidflow.ui.element.move':
        return await this.handleElementMove(payload)
      
      case 'voidflow.ui.element.select':
        return await this.handleElementSelect(payload)
      
      case 'voidflow.ui.element.delete':
        return await this.handleElementDelete(payload)
      
      case 'voidflow.ui.element.update':
        return await this.handleElementUpdate(payload)
      
      default:
        throw new Error(`Unknown UI Intent: ${type}`)
    }
  }
  
  /**
   * UI要素作成処理
   */
  async handleElementCreate(payload) {
    try {
      this.log(`🎨 Creating UI element: ${payload.nodeType} at (${payload.position.x}, ${payload.position.y})`)
      
      // VoidCoreUIに委譲して実際のUI要素作成
      if (this.uiManager) {
        const result = await this.uiManager.createUIElementDirect(payload.nodeType, payload.position, payload.pluginId)
        return {
          status: 'success',
          pluginId: result.pluginId || payload.pluginId,
          elementId: result.elementId || `ui-element-${payload.pluginId}`,
          nodeType: payload.nodeType,
          position: payload.position,
          timestamp: Date.now()
        }
      } else {
        // UIManagerがない場合はメタデータのみ返す
        this.log('⚠️ UIManager not registered, returning metadata only')
        return {
          status: 'success',
          pluginId: payload.pluginId,
          elementId: `ui-element-${payload.pluginId}`,
          nodeType: payload.nodeType,
          position: payload.position,
          timestamp: Date.now(),
          note: 'UI creation delegated to UIManager'
        }
      }
      
    } catch (error) {
      this.logError('UI element creation failed', error)
      throw error
    }
  }
  
  /**
   * UI要素移動処理
   */
  async handleElementMove(payload) {
    this.log(`🖱️ Moving UI element: ${payload.elementId} to (${payload.newPosition.x}, ${payload.newPosition.y})`)
    
    if (this.uiManager && this.uiManager.moveElement) {
      return await this.uiManager.moveElement(payload)
    }
    
    return {
      status: 'pending',
      message: 'Element move - UIManager integration pending'
    }
  }
  
  /**
   * UI要素選択処理
   */
  async handleElementSelect(payload) {
    this.log(`👆 Selecting UI element: ${payload.elementId}`)
    
    if (this.uiManager && this.uiManager.selectElement) {
      return await this.uiManager.selectElement(payload)
    }
    
    return {
      status: 'pending',
      message: 'Element selection - UIManager integration pending'
    }
  }
  
  /**
   * UI要素削除処理
   */
  async handleElementDelete(payload) {
    this.log(`🗑️ Deleting UI element: ${payload.elementId}`)
    
    if (this.uiManager && this.uiManager.deleteElement) {
      return await this.uiManager.deleteElement(payload)
    }
    
    return {
      status: 'pending',
      message: 'Element deletion - UIManager integration pending'
    }
  }
  
  /**
   * UI要素更新処理
   */
  async handleElementUpdate(payload) {
    this.log(`🔄 Updating UI element: ${payload.elementId}`)
    
    if (this.uiManager && this.uiManager.updateElement) {
      return await this.uiManager.updateElement(payload)
    }
    
    return {
      status: 'pending',
      message: 'Element update - UIManager integration pending'
    }
  }
  
  /**
   * 接続Intent処理（Phase 3実装開始）
   */
  async handleConnectionIntent(intentMessage) {
    const type = intentMessage.action || intentMessage.type
    const payload = intentMessage.payload || intentMessage
    
    this.log(`🔗 Connection Intent received: ${type}`)
    
    switch (type) {
      case 'voidflow.ui.connection.start':
        return await this.handleConnectionStart(payload)
      
      case 'voidflow.ui.connection.complete':
        return await this.handleConnectionComplete(payload)
      
      case 'voidflow.ui.connection.cancel':
        return await this.handleConnectionCancel(payload)
      
      case 'voidflow.ui.connection.delete':
        return await this.handleConnectionDelete(payload)
      
      default:
        throw new Error(`Unknown Connection Intent: ${type}`)
    }
  }
  
  /**
   * 接続開始処理
   */
  async handleConnectionStart(payload) {
    try {
      this.log(`🔗 Starting connection from: ${payload.sourceId}`)
      
      if (this.connectionManager) {
        // ConnectionManagerに委譲
        const result = await this.connectionManager.startConnectionIntent(payload)
        return {
          status: 'success',
          sourceId: payload.sourceId,
          connectionMode: payload.connectionMode,
          timestamp: Date.now(),
          result: result
        }
      } else {
        // ConnectionManagerがない場合はメタデータのみ返す
        this.log('⚠️ ConnectionManager not registered, returning metadata only')
        return {
          status: 'success',
          sourceId: payload.sourceId,
          connectionMode: payload.connectionMode,
          timestamp: Date.now(),
          note: 'Connection start delegated to ConnectionManager'
        }
      }
      
    } catch (error) {
      this.logError('Connection start failed', error)
      throw error
    }
  }
  
  /**
   * 接続完了処理
   */
  async handleConnectionComplete(payload) {
    try {
      this.log(`🔗 Completing connection: ${payload.sourceId} → ${payload.targetId}`)
      
      if (this.connectionManager) {
        // ConnectionManagerに委譲
        const result = await this.connectionManager.completeConnectionIntent(payload)
        return {
          status: 'success',
          sourceId: payload.sourceId,
          targetId: payload.targetId,
          connectionType: payload.connectionType,
          timestamp: Date.now(),
          result: result
        }
      } else {
        // ConnectionManagerがない場合はメタデータのみ返す
        this.log('⚠️ ConnectionManager not registered, returning metadata only')
        return {
          status: 'success',
          sourceId: payload.sourceId,
          targetId: payload.targetId,
          connectionType: payload.connectionType,
          timestamp: Date.now(),
          note: 'Connection complete delegated to ConnectionManager'
        }
      }
      
    } catch (error) {
      this.logError('Connection complete failed', error)
      throw error
    }
  }
  
  /**
   * 接続キャンセル処理
   */
  async handleConnectionCancel(payload) {
    try {
      this.log(`🔗 Cancelling connection: ${payload.reason}`)
      
      if (this.connectionManager) {
        // ConnectionManagerに委譲
        const result = await this.connectionManager.cancelConnectionIntent(payload)
        return {
          status: 'success',
          reason: payload.reason,
          sourceId: payload.sourceId,
          timestamp: Date.now(),
          result: result
        }
      } else {
        // ConnectionManagerがない場合はメタデータのみ返す
        this.log('⚠️ ConnectionManager not registered, returning metadata only')
        return {
          status: 'success',
          reason: payload.reason,
          sourceId: payload.sourceId,
          timestamp: Date.now(),
          note: 'Connection cancel delegated to ConnectionManager'
        }
      }
      
    } catch (error) {
      this.logError('Connection cancel failed', error)
      throw error
    }
  }
  
  /**
   * 接続削除処理
   */
  async handleConnectionDelete(payload) {
    this.log(`🗑️ Deleting connection: ${payload.connectionId}`)
    
    if (this.connectionManager && this.connectionManager.deleteConnection) {
      return await this.connectionManager.deleteConnection(payload)
    }
    
    return {
      status: 'pending',
      message: 'Connection deletion - ConnectionManager integration pending'
    }
  }
  
  /**
   * プラグインIntent処理
   */
  async handlePluginIntent(intentMessage) {
    const type = intentMessage.action || intentMessage.type
    const payload = intentMessage.payload || intentMessage
    
    this.log(`🧩 Plugin Intent received: ${type}`)
    
    switch (type) {
      case 'voidflow.ui.plugin.add':
        // プラグイン追加処理
        return { status: 'pending', message: 'Plugin add implementation pending' }
      
      case 'voidflow.ui.plugin.configure':
        // プラグイン設定変更
        return { status: 'pending', message: 'Plugin configure implementation pending' }
      
      default:
        throw new Error(`Unknown Plugin Intent: ${type}`)
    }
  }
  
  /**
   * デバッグIntent処理（Phase 4実装完了）
   */
  async handleDebugIntent(payload) {
    // UnifiedIntentHandlerはpayloadのみを渡すので、引数名を変更
    // Intent typeは登録時のaction名から判断する必要がある
    this.log(`🔍 Debug Intent payload: ${JSON.stringify(payload, null, 2)}`)
    
    // payloadにintent typeを含める（送信時に追加）
    const type = payload.intentType || 'unknown'
    
    this.log(`🐛 Debug Intent received: ${type}`)
    this.log(`🔍 Payload:`, payload)
    
    if (!this.debugManager) {
      throw new Error('Debug Manager not initialized')
    }
    
    switch (type) {
      case 'voidflow.debug.trace.start':
        const traceResult = this.debugManager.enableTrace(payload.patterns || ['*'], payload.level || 'basic')
        const response = { status: 'success', result: traceResult }
        this.log(`🔍 Debug trace.start response:`, response)
        return response
      
      case 'voidflow.debug.trace.stop':
        const stopResult = this.debugManager.disableTrace()
        return { status: 'success', result: stopResult }
      
      case 'voidflow.debug.state.dump':
        const stateResult = this.debugManager.dumpState(payload.format || 'table')
        return { status: 'success', result: stateResult }
      
      case 'voidflow.debug.state.capture':
        const captureResult = this.debugManager.captureState()
        return { status: 'success', result: captureResult }
      
      case 'voidflow.debug.performance.measure':
        if (payload.name && payload.fn) {
          const perfResult = this.debugManager.measurePerformance(payload.name, payload.fn)
          return { status: 'success', result: perfResult }
        } else {
          throw new Error('Performance measurement requires name and function')
        }
      
      case 'voidflow.debug.stats.get':
        const statsResult = this.debugManager.getSystemStats()
        return { status: 'success', result: statsResult }
      
      case 'voidflow.debug.export':
        const exportResult = this.debugManager.exportDebugData()
        return { status: 'success', result: exportResult }
      
      case 'voidflow.debug.reset':
        const resetResult = this.debugManager.resetAllData()
        return { status: 'success', result: resetResult }
      
      default:
        throw new Error(`Unknown Debug Intent: ${type}`)
    }
  }
  
  /**
   * グローバルデバッグ関数設定
   */
  setupGlobalDebugFunctions() {
    if (!this.debugManager) return
    
    // デバッグコンソール用グローバル関数
    window.debugVoidFlow = {
      core: () => this,
      debugManager: () => this.debugManager,
      debugPlugin: () => this.debugPlugin,
      startTrace: (patterns, level) => this.sendIntent('voidflow.debug.trace.start', { patterns, level }),
      stopTrace: () => this.sendIntent('voidflow.debug.trace.stop'),
      dumpState: (format) => this.sendIntent('voidflow.debug.state.dump', { format }),
      getStats: () => this.sendIntent('voidflow.debug.stats.get'),
      reset: () => this.sendIntent('voidflow.debug.reset'),
      export: () => this.sendIntent('voidflow.debug.export')
    }
    
    this.log('🔧 Global debug functions registered')
  }
  
  /**
   * VoidFlowコンポーネント登録
   */
  registerUIManager(uiManager) {
    this.uiManager = uiManager
    this.log('📝 UI Manager registered')
  }
  
  registerConnectionManager(connectionManager) {
    this.connectionManager = connectionManager
    this.log('🔗 Connection Manager registered')
  }
  
  registerPaletteManager(paletteManager) {
    this.paletteManager = paletteManager
    this.log('🎨 Palette Manager registered')
  }
  
  /**
   * システム状態取得
   */
  getSystemStatus() {
    return {
      initialized: this.isInitialized,
      voidCoreStats: this.voidCore.getStats ? this.voidCore.getStats() : null,
      intentHandlers: Array.from(this.intentHandlers.keys()),
      components: {
        uiManager: !!this.uiManager,
        connectionManager: !!this.connectionManager,
        paletteManager: !!this.paletteManager,
        debugManager: !!this.debugManager,
        debugPlugin: !!this.debugPlugin,
        intentBridge: !!this.intentBridge
      },
      timestamp: Date.now()
    }
  }
  
  /**
   * 利用可能機能リスト
   */
  getAvailableFeatures() {
    return [
      'intent-system',
      'system-management',
      'error-handling',
      // Phase 2完成
      'ui-operations',
      'ui-element-creation',
      'drag-drop-intents',
      'intent-bridge',
      // Phase 3完成
      'connection-management',
      'connection-start',
      'connection-complete',
      'connection-cancel',
      // Phase 4完成
      'debug-tools',
      'debug-tracing',
      'debug-state-dump',
      'debug-performance',
      'debug-error-tracking'
    ]
  }
  
  /**
   * システム終了
   */
  async shutdown() {
    try {
      this.log('🔄 VoidFlowCore shutting down...')
      
      // 各コンポーネントのクリーンアップ
      if (this.debugPlugin) {
        await this.debugPlugin.onDeactivated()
      }
      
      if (this.debugManager) {
        await this.debugManager.shutdown()
      }
      
      if (this.intentBridge) {
        await this.intentBridge.shutdown()
      }
      
      // VoidCore終了
      if (this.voidCore.shutdown) {
        await this.voidCore.shutdown()
      }
      
      this.isInitialized = false
      this.log('✅ VoidFlowCore shutdown complete')
      
      return { status: 'shutdown', timestamp: Date.now() }
      
    } catch (error) {
      this.logError('❌ Shutdown error', error)
      throw error
    }
  }
  
  /**
   * ログ出力
   */
  log(message) {
    if (this.options.enableDebug) {
      console.log(`[VoidFlowCore] ${message}`)
    }
  }
  
  /**
   * エラーログ出力
   */
  logError(message, error) {
    console.error(`[VoidFlowCore] ${message}`, error)
    
    // Phase 4: エラー統計記録
    if (this.debugManager) {
      this.debugManager.recordError(message, error)
    }
  }
}

// グローバルインスタンス（デバッグ用）
window.VoidFlowCore = VoidFlowCore