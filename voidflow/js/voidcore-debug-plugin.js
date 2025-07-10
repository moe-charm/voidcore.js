/**
 * 🐛 VoidCoreDebugPlugin - VoidCore統合デバッグプラグイン
 * 
 * 機能:
 * - Intent監視・追跡
 * - プラグイン間通信デバッグ
 * - 接続状態分析
 * - パフォーマンス監視
 * - リアルタイム統計
 * - デバッグオフ時の完全no-op化
 * 
 * パフォーマンス重視設計:
 * - デバッグオフ時: 0.1%未満のオーバーヘッド
 * - No-op メソッド置換
 * - Intent監視の登録/解除制御
 * 
 * Created: 2025-07-10
 * Phase 1.5: VoidCore統合デバッグシステム
 */

import { debugLogger } from './debug-file-logger.js'

export class VoidCoreDebugPlugin {
  constructor(options = {}) {
    // 基本プラグイン情報
    this.id = 'VoidCore.DebugPlugin'
    this.type = 'system.debug'
    this.displayName = 'VoidCore Debug Plugin'
    this.version = '1.0.0'
    this.isCore = true
    this.capabilities = [
      'intent-monitoring',
      'plugin-status-tracking',
      'connection-analysis', 
      'performance-profiling',
      'real-time-stats'
    ]
    
    // デバッグ設定
    this.options = {
      enabled: true,
      debugLevel: 'debug', // debug, info, warn, error
      monitorIntents: true,
      trackPerformance: true,
      enableRealTimeStats: true,
      autoExportOnError: true,
      maxTrackingHistory: 1000,
      ...options
    }
    
    // 状態管理
    this.isInitialized = false
    this.voidFlowCore = null
    this.intentListeners = new Map()
    this.pluginStates = new Map()
    this.performanceMetrics = new Map()
    this.connectionEvents = []
    this.errorLog = []
    
    // 統計情報
    this.stats = {
      intentCount: 0,
      connectionCount: 0,
      errorCount: 0,
      sessionStartTime: Date.now(),
      lastActivity: Date.now()
    }
    
    // パフォーマンス最適化: デバッグオフ時は即座にno-op化
    if (!this.options.enabled) {
      this.setupNoOpMethods()
      this.log('system', 'info', '🐛 VoidCoreDebugPlugin initialized (DISABLED - no-op mode)')
      return
    }
    
    // 有効時のみ初期化
    this.setupDebugMethods()
    this.log('system', 'info', '🐛 VoidCoreDebugPlugin initialized (ENABLED)', {
      capabilities: this.capabilities,
      options: this.options
    })
  }
  
  /**
   * 🚫 No-op メソッド設定（デバッグオフ時）
   */
  setupNoOpMethods() {
    // 全メソッドをno-opに置換 → パフォーマンス影響0
    this.onActivated = () => Promise.resolve()
    this.onDeactivated = () => Promise.resolve()
    this.onIntentReceived = () => {}
    this.onPluginStateChanged = () => {}
    this.trackConnection = () => {}
    this.trackPerformance = () => {}
    this.logError = () => {}
    this.getStats = () => ({})
    this.exportDebugData = () => {}
    this.startRealTimeMonitoring = () => {}
    this.stopRealTimeMonitoring = () => {}
    
    // 統計も無効化
    this.updateStats = () => {}
  }
  
  /**
   * 🔧 デバッグメソッド設定（デバッグオン時）
   */
  setupDebugMethods() {
    // 実際のデバッグ処理を設定
    this.setupIntentMonitoring()
    this.setupPerformanceTracking()
    this.setupConnectionTracking()
    this.setupErrorHandling()
  }
  
  /**
   * 📝 ログ出力（DebugFileLoggerと連携）
   */
  log(category, level, message, data = null) {
    if (!this.options.enabled) return
    
    // DebugFileLoggerに転送
    if (debugLogger) {
      debugLogger.log(category, level, `[VoidCoreDebugPlugin] ${message}`, {
        source: this.id,
        ...data
      })
    }
    
    // コンソール出力
    console.log(`[${this.id}:${category}:${level}] ${message}`, data)
  }
  
  /**
   * 🎯 プラグイン初期化
   */
  async onActivated() {
    if (!this.options.enabled) return
    
    try {
      this.log('system', 'info', '🚀 VoidCoreDebugPlugin activation start')
      
      // VoidFlowCore参照取得
      if (window.voidFlowCore) {
        this.voidFlowCore = window.voidFlowCore
        this.log('system', 'info', '✅ VoidFlowCore reference acquired')
      }
      
      // Intent監視開始
      if (this.options.monitorIntents) {
        await this.enableIntentMonitoring()
      }
      
      // リアルタイム統計開始
      if (this.options.enableRealTimeStats) {
        this.startRealTimeMonitoring()
      }
      
      this.isInitialized = true
      this.log('system', 'info', '✅ VoidCoreDebugPlugin activated successfully')
      
    } catch (error) {
      this.logError('Plugin activation failed', error)
    }
  }
  
  /**
   * 🛑 プラグイン無効化
   */
  async onDeactivated() {
    if (!this.options.enabled) return
    
    try {
      this.log('system', 'info', '🛑 VoidCoreDebugPlugin deactivation start')
      
      // Intent監視停止
      await this.disableIntentMonitoring()
      
      // リアルタイム監視停止
      this.stopRealTimeMonitoring()
      
      // 最終統計エクスポート
      if (this.options.autoExportOnError) {
        await this.exportDebugData()
      }
      
      this.isInitialized = false
      this.log('system', 'info', '✅ VoidCoreDebugPlugin deactivated')
      
    } catch (error) {
      this.logError('Plugin deactivation failed', error)
    }
  }
  
  /**
   * 📡 Intent監視設定
   */
  setupIntentMonitoring() {
    this.onIntentReceived = async (intent) => {
      if (!this.options.enabled) return
      
      try {
        this.stats.intentCount++
        this.stats.lastActivity = Date.now()
        
        // Intent詳細ログ
        this.log('intent', 'debug', 'Intent intercepted', {
          type: intent.type,
          source: intent.source,
          target: intent.target,
          data: intent.data,
          timestamp: Date.now()
        })
        
        // パフォーマンス追跡
        if (this.options.trackPerformance) {
          this.trackIntentPerformance(intent)
        }
        
        // 接続関連のIntent特別追跡
        if (intent.type && intent.type.includes('connection')) {
          this.trackConnection(intent)
        }
        
      } catch (error) {
        this.logError('Intent monitoring failed', error)
      }
    }
  }
  
  /**
   * 📊 パフォーマンス追跡設定
   */
  setupPerformanceTracking() {
    this.trackPerformance = (operation, startTime, endTime, metadata = {}) => {
      if (!this.options.enabled) return
      
      const duration = endTime - startTime
      const perfData = {
        operation,
        duration,
        startTime,
        endTime,
        metadata,
        timestamp: Date.now()
      }
      
      this.performanceMetrics.set(`${operation}-${Date.now()}`, perfData)
      
      // 長時間処理の警告
      if (duration > 100) {
        this.log('performance', 'warn', `Slow operation detected: ${operation}`, perfData)
      } else {
        this.log('performance', 'debug', `Performance tracked: ${operation}`, perfData)
      }
      
      // 履歴管理
      if (this.performanceMetrics.size > this.options.maxTrackingHistory) {
        this.cleanupOldMetrics()
      }
    }
  }
  
  /**
   * 🔗 接続追跡設定
   */
  setupConnectionTracking() {
    this.trackConnection = (event) => {
      if (!this.options.enabled) return
      
      const connectionEvent = {
        type: event.type || 'unknown',
        source: event.source,
        target: event.target,
        timestamp: Date.now(),
        metadata: event.data || {}
      }
      
      this.connectionEvents.push(connectionEvent)
      this.stats.connectionCount++
      
      this.log('connection', 'info', `Connection event: ${event.type}`, connectionEvent)
      
      // 接続履歴管理
      if (this.connectionEvents.length > this.options.maxTrackingHistory) {
        this.connectionEvents = this.connectionEvents.slice(-500)
      }
    }
  }
  
  /**
   * 🚨 エラーハンドリング設定
   */
  setupErrorHandling() {
    this.logError = (message, error, context = {}) => {
      if (!this.options.enabled) return
      
      const errorData = {
        message,
        error: {
          name: error?.name,
          message: error?.message,
          stack: error?.stack
        },
        context,
        timestamp: Date.now()
      }
      
      this.errorLog.push(errorData)
      this.stats.errorCount++
      
      this.log('error', 'error', `Error tracked: ${message}`, errorData)
      
      // 自動エクスポート
      if (this.options.autoExportOnError) {
        setTimeout(() => this.exportDebugData(), 1000)
      }
    }
  }
  
  /**
   * 🎯 Intent監視開始
   */
  async enableIntentMonitoring() {
    if (!this.voidFlowCore || !this.options.enabled) return
    
    try {
      // Intent監視登録
      if (this.voidFlowCore.addIntentListener) {
        this.voidFlowCore.addIntentListener('*', this.onIntentReceived)
        this.log('system', 'info', '📡 Intent monitoring enabled')
      }
    } catch (error) {
      this.logError('Failed to enable intent monitoring', error)
    }
  }
  
  /**
   * 🛑 Intent監視停止
   */
  async disableIntentMonitoring() {
    if (!this.voidFlowCore || !this.options.enabled) return
    
    try {
      // Intent監視解除
      if (this.voidFlowCore.removeIntentListener) {
        this.voidFlowCore.removeIntentListener('*', this.onIntentReceived)
        this.log('system', 'info', '📡 Intent monitoring disabled')
      }
    } catch (error) {
      this.logError('Failed to disable intent monitoring', error)
    }
  }
  
  /**
   * 📊 リアルタイム統計監視開始
   */
  startRealTimeMonitoring() {
    if (!this.options.enabled) return
    
    this.realTimeInterval = setInterval(() => {
      this.updateStats()
      this.updateDebugUI()
    }, 1000)
    
    this.log('system', 'info', '📊 Real-time monitoring started')
  }
  
  /**
   * 🛑 リアルタイム統計監視停止
   */
  stopRealTimeMonitoring() {
    if (this.realTimeInterval) {
      clearInterval(this.realTimeInterval)
      this.realTimeInterval = null
      this.log('system', 'info', '📊 Real-time monitoring stopped')
    }
  }
  
  /**
   * 📈 統計更新
   */
  updateStats() {
    if (!this.options.enabled) return
    
    const now = Date.now()
    this.stats.sessionDuration = now - this.stats.sessionStartTime
    this.stats.lastActivity = now
    
    // プラグイン状態更新
    if (this.voidFlowCore && this.voidFlowCore.getAllPlugins) {
      const plugins = this.voidFlowCore.getAllPlugins()
      this.stats.activePlugins = plugins.length
    }
  }
  
  /**
   * 🎨 デバッグUI更新
   */
  updateDebugUI() {
    if (!this.options.enabled) return
    
    // HTMLパネル更新
    const debugPanel = document.getElementById('voidcore-debug-stats')
    if (debugPanel) {
      debugPanel.innerHTML = `
        <div>Intent数: ${this.stats.intentCount}</div>
        <div>接続数: ${this.stats.connectionCount}</div>
        <div>エラー数: ${this.stats.errorCount}</div>
        <div>稼働時間: ${Math.floor(this.stats.sessionDuration / 1000)}s</div>
      `
    }
  }
  
  /**
   * 📊 統計情報取得
   */
  getStats() {
    if (!this.options.enabled) return {}
    
    return {
      ...this.stats,
      performanceMetrics: this.performanceMetrics.size,
      connectionEvents: this.connectionEvents.length,
      errorLog: this.errorLog.length,
      pluginStates: this.pluginStates.size
    }
  }
  
  /**
   * 📤 デバッグデータエクスポート
   */
  async exportDebugData() {
    if (!this.options.enabled) return
    
    try {
      const debugData = {
        stats: this.getStats(),
        connectionEvents: this.connectionEvents.slice(-100),
        errorLog: this.errorLog.slice(-50),
        performanceMetrics: Array.from(this.performanceMetrics.values()).slice(-100),
        exportTime: new Date().toISOString(),
        sessionId: debugLogger.options?.sessionId || 'unknown'
      }
      
      const blob = new Blob([JSON.stringify(debugData, null, 2)], { 
        type: 'application/json' 
      })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `voidcore-debug-${Date.now()}.json`
      a.click()
      
      URL.revokeObjectURL(url)
      
      this.log('system', 'info', '📤 Debug data exported', {
        filename: a.download,
        size: blob.size
      })
      
    } catch (error) {
      this.logError('Debug data export failed', error)
    }
  }
  
  /**
   * 🧹 古いメトリクスクリーンアップ
   */
  cleanupOldMetrics() {
    const entries = Array.from(this.performanceMetrics.entries())
    const keepCount = Math.floor(this.options.maxTrackingHistory / 2)
    
    entries.sort((a, b) => b[1].timestamp - a[1].timestamp)
    
    this.performanceMetrics.clear()
    entries.slice(0, keepCount).forEach(([key, value]) => {
      this.performanceMetrics.set(key, value)
    })
  }
  
  /**
   * 🎯 Intent処理パフォーマンス追跡
   */
  trackIntentPerformance(intent) {
    const startTime = Date.now()
    
    // Intent処理後の計測
    setTimeout(() => {
      const endTime = Date.now()
      this.trackPerformance(`intent-${intent.type}`, startTime, endTime, {
        intentType: intent.type,
        source: intent.source,
        target: intent.target
      })
    }, 0)
  }
  
  /**
   * 🔧 デバッグ設定変更
   */
  updateDebugSettings(newOptions) {
    if (!this.options.enabled) return
    
    this.options = { ...this.options, ...newOptions }
    this.log('system', 'info', '🔧 Debug settings updated', newOptions)
  }
  
  /**
   * 🎯 特定プラグインの状態追跡
   */
  trackPluginState(pluginId, state) {
    if (!this.options.enabled) return
    
    this.pluginStates.set(pluginId, {
      state,
      timestamp: Date.now(),
      previousState: this.pluginStates.get(pluginId)?.state
    })
    
    this.log('system', 'debug', `Plugin state tracked: ${pluginId}`, {
      pluginId,
      state,
      previousState: this.pluginStates.get(pluginId)?.previousState
    })
  }
}

// グローバルインスタンス
export const voidCoreDebugPlugin = new VoidCoreDebugPlugin()

// グローバル関数として公開
window.voidCoreDebugPlugin = voidCoreDebugPlugin
window.getVoidCoreDebugStats = () => voidCoreDebugPlugin.getStats()
window.exportVoidCoreDebugData = () => voidCoreDebugPlugin.exportDebugData()
window.toggleVoidCoreDebug = (enabled) => {
  voidCoreDebugPlugin.options.enabled = enabled
  if (enabled) {
    voidCoreDebugPlugin.setupDebugMethods()
  } else {
    voidCoreDebugPlugin.setupNoOpMethods()
  }
}