/**
 * 🐛 CharmFlowDebugManager - 統合デバッグシステム
 * 
 * 🎯 機能:
 * - リアルタイムIntent監視・トレース
 * - システム状態ダンプ・履歴管理
 * - パフォーマンス分析・計測
 * - エラー統合レポート
 * - デバッグコンソール・可視化
 * 
 * Created: 2025-07-09
 * Phase 4: デバッグ機能完成
 */

/**
 * CharmFlow専用デバッグマネージャー
 */
export class CharmFlowDebugManager {
  constructor(charmFlowCore) {
    this.charmFlowCore = charmFlowCore
    
    // トレース設定
    this.traceEnabled = false
    this.tracePatterns = ['*']
    this.traceLevel = 'basic' // basic, detailed, verbose
    this.tracedIntents = []
    this.maxTraceHistory = 1000
    
    // パフォーマンス計測
    this.performanceMarkers = new Map()
    this.performanceMetrics = new Map()
    this.performanceHistory = []
    
    // 状態管理
    this.stateHistory = []
    this.maxStateHistory = 100
    this.lastStateCapture = 0
    
    // エラー統計
    this.errorLog = []
    this.errorStats = new Map()
    
    // デバッグコンソール
    this.consoleCommands = new Map()
    
    this.log('🐛 VoidFlowDebugManager initialized')
    this.setupDebugConsole()
    // Intent監視は一時的に無効化（循環参照防止）
    // this.setupIntentMonitoring()
  }
  
  /**
   * デバッグコンソール設定
   */
  setupDebugConsole() {
    // グローバルデバッグ関数
    window.charmflowDebug = {
      // トレース機能
      trace: (pattern) => this.enableTrace(pattern),
      stopTrace: () => this.disableTrace(),
      getTrace: () => this.getTraceHistory(),
      clearTrace: () => this.clearTraceHistory(),
      
      // 状態機能
      dump: (format) => this.dumpState(format),
      history: () => this.getStateHistory(),
      capture: () => this.captureState(),
      
      // 統計機能
      stats: () => this.getSystemStats(),
      perf: () => this.getPerformanceStats(),
      errors: () => this.getErrorStats(),
      
      // パフォーマンス機能
      measure: (name, fn) => this.measurePerformance(name, fn),
      benchmark: (name, iterations) => this.runBenchmark(name, iterations),
      
      // システム制御
      reset: () => this.resetAllData(),
      export: () => this.exportDebugData(),
      
      // ショートカット
      ui: () => this.dumpUIState(),
      conn: () => this.dumpConnectionState(),
      intent: () => this.getIntentStats()
    }
    
    // コマンド登録
    this.registerCommand('help', () => this.showHelp())
    this.registerCommand('status', () => this.getSystemStatus())
    this.registerCommand('clear', () => this.clearAllLogs())
    
    this.log('🔧 Debug console commands registered')
  }
  
  /**
   * Intent監視設定
   */
  setupIntentMonitoring() {
    if (!this.voidFlowCore) return
    
    // VoidFlowCoreのIntent送信をフック
    const originalSendIntent = this.voidFlowCore.sendIntent.bind(this.voidFlowCore)
    this.voidFlowCore.sendIntent = async (type, payload) => {
      const startTime = performance.now()
      
      try {
        // Intent送信前にトレース
        if (this.shouldTrace(type)) {
          this.traceIntent('send', type, payload, startTime)
        }
        
        // 元のIntent送信実行
        const result = await originalSendIntent(type, payload)
        
        const endTime = performance.now()
        const duration = endTime - startTime
        
        // Intent完了後にトレース
        if (this.shouldTrace(type)) {
          this.traceIntent('complete', type, { result, duration }, endTime)
        }
        
        // パフォーマンス記録
        this.recordPerformance('intent.' + type, duration)
        
        return result
        
      } catch (error) {
        const endTime = performance.now()
        const duration = endTime - startTime
        
        // エラー記録
        this.recordError('Intent execution failed', error, { type, payload })
        
        // エラーもトレース
        if (this.shouldTrace(type)) {
          this.traceIntent('error', type, { error: error.message, duration }, endTime)
        }
        
        throw error
      }
    }
    
    this.log('📡 Intent monitoring enabled')
  }
  
  /**
   * リアルタイムIntent監視有効化
   */
  enableTrace(patterns = ['*'], level = 'basic') {
    this.traceEnabled = true
    this.tracePatterns = Array.isArray(patterns) ? patterns : [patterns]
    this.traceLevel = level
    
    this.log(`🔍 Intent tracing enabled: ${this.tracePatterns.join(', ')} (${level})`)
    return `Tracing enabled for: ${this.tracePatterns.join(', ')}`
  }
  
  /**
   * Intent監視無効化
   */
  disableTrace() {
    this.traceEnabled = false
    this.log('🔍 Intent tracing disabled')
    return 'Tracing disabled'
  }
  
  /**
   * Intentをトレースすべきか判定
   */
  shouldTrace(intentType) {
    if (!this.traceEnabled) return false
    
    return this.tracePatterns.some(pattern => {
      if (pattern === '*') return true
      if (pattern.endsWith('*')) {
        return intentType.startsWith(pattern.slice(0, -1))
      }
      return intentType === pattern
    })
  }
  
  /**
   * Intentトレース記録
   */
  traceIntent(action, type, data, timestamp) {
    const trace = {
      id: `trace-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      action,
      type,
      data,
      timestamp,
      level: this.traceLevel
    }
    
    this.tracedIntents.push(trace)
    
    // 履歴サイズ制限
    if (this.tracedIntents.length > this.maxTraceHistory) {
      this.tracedIntents.shift()
    }
    
    // リアルタイム出力（詳細レベル以上）
    if (this.traceLevel !== 'basic') {
      console.group(`🎯 Intent ${action}: ${type}`)
      console.log('Data:', data)
      console.log('Timestamp:', new Date(timestamp).toLocaleTimeString())
      console.groupEnd()
    }
  }
  
  /**
   * トレース履歴取得
   */
  getTraceHistory(filter = null) {
    let traces = this.tracedIntents
    
    if (filter) {
      traces = traces.filter(trace => 
        trace.type.includes(filter) || 
        trace.action.includes(filter)
      )
    }
    
    return traces
  }
  
  /**
   * トレース履歴クリア
   */
  clearTraceHistory() {
    this.tracedIntents = []
    this.log('🧹 Trace history cleared')
    return 'Trace history cleared'
  }
  
  /**
   * システム状態ダンプ
   */
  dumpState(format = 'table') {
    const state = this.captureState()
    
    switch (format) {
      case 'table':
        console.table(state)
        break
      case 'json':
        console.log(JSON.stringify(state, null, 2))
        break
      case 'tree':
        console.dir(state, { depth: null })
        break
      default:
        console.log(state)
    }
    
    return state
  }
  
  /**
   * 現在の状態キャプチャ
   */
  captureState() {
    const timestamp = Date.now()
    
    const state = {
      timestamp,
      system: this.getSystemState(),
      ui: this.getUIState(),
      connections: this.getConnectionState(),
      performance: this.getPerformanceSnapshot(),
      errors: this.getRecentErrors(10)
    }
    
    // 状態履歴に追加
    this.stateHistory.push(state)
    if (this.stateHistory.length > this.maxStateHistory) {
      this.stateHistory.shift()
    }
    
    this.lastStateCapture = timestamp
    return state
  }
  
  /**
   * システム状態取得
   */
  getSystemState() {
    return {
      voidFlowCore: this.voidFlowCore ? this.voidFlowCore.getSystemStatus() : null,
      debugManager: {
        traceEnabled: this.traceEnabled,
        tracePatterns: this.tracePatterns,
        traceCount: this.tracedIntents.length,
        stateHistoryCount: this.stateHistory.length,
        errorCount: this.errorLog.length
      },
      features: this.voidFlowCore ? this.voidFlowCore.getAvailableFeatures() : [],
      timestamp: Date.now()
    }
  }
  
  /**
   * UI状態取得
   */
  getUIState() {
    const uiElements = document.querySelectorAll('.voidcore-ui-element')
    
    return {
      elementCount: uiElements.length,
      elements: Array.from(uiElements).map(el => ({
        id: el.id,
        pluginId: el.dataset.pluginId,
        nodeType: el.dataset.nodeType,
        position: {
          x: parseInt(el.style.left) || 0,
          y: parseInt(el.style.top) || 0
        },
        visible: el.offsetParent !== null,
        classes: Array.from(el.classList)
      })),
      canvas: {
        present: !!document.getElementById('canvas'),
        size: this.getCanvasSize()
      }
    }
  }
  
  /**
   * 接続状態取得
   */
  getConnectionState() {
    // ConnectionManagerからの情報取得
    const connectionManager = this.voidFlowCore?.connectionManager
    
    if (!connectionManager) {
      return { available: false, message: 'ConnectionManager not available' }
    }
    
    return {
      available: true,
      isConnecting: connectionManager.smartConnectionManager?.isConnecting || false,
      firstSelected: connectionManager.smartConnectionManager?.firstSelected || null,
      secondSelected: connectionManager.smartConnectionManager?.secondSelected || null,
      connectionCount: connectionManager.connections?.size || 0,
      activeConnections: Array.from(connectionManager.connections?.values() || [])
    }
  }
  
  /**
   * パフォーマンス計測
   */
  measurePerformance(name, fn) {
    const startMarker = `${name}-start`
    const endMarker = `${name}-end`
    
    performance.mark(startMarker)
    
    let result
    try {
      result = fn()
    } catch (error) {
      performance.mark(endMarker)
      this.recordError('Performance measurement failed', error, { name })
      throw error
    }
    
    performance.mark(endMarker)
    performance.measure(name, startMarker, endMarker)
    
    const measure = performance.getEntriesByName(name)[0]
    const duration = measure.duration
    
    this.recordPerformance(name, duration)
    
    console.log(`⚡ ${name}: ${duration.toFixed(2)}ms`)
    
    return { result, duration }
  }
  
  /**
   * パフォーマンス記録
   */
  recordPerformance(operation, duration) {
    if (!this.performanceMetrics.has(operation)) {
      this.performanceMetrics.set(operation, {
        count: 0,
        total: 0,
        min: Infinity,
        max: 0,
        average: 0,
        recent: []
      })
    }
    
    const metric = this.performanceMetrics.get(operation)
    metric.count++
    metric.total += duration
    metric.min = Math.min(metric.min, duration)
    metric.max = Math.max(metric.max, duration)
    metric.average = metric.total / metric.count
    
    // 最近の記録を保持（最大100件）
    metric.recent.push({ duration, timestamp: Date.now() })
    if (metric.recent.length > 100) {
      metric.recent.shift()
    }
  }
  
  /**
   * パフォーマンス統計取得
   */
  getPerformanceStats() {
    const stats = {}
    
    for (const [operation, metric] of this.performanceMetrics) {
      stats[operation] = {
        count: metric.count,
        average: Number(metric.average.toFixed(2)),
        min: Number(metric.min.toFixed(2)),
        max: Number(metric.max.toFixed(2)),
        total: Number(metric.total.toFixed(2))
      }
    }
    
    return stats
  }
  
  /**
   * ベンチマーク実行
   */
  async runBenchmark(name, iterations = 1000) {
    this.log(`🏃 Running benchmark: ${name} (${iterations} iterations)`)
    
    const results = []
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      
      // ベンチマーク対象の処理（例：Intent送信）
      try {
        await this.voidFlowCore.sendIntent('voidflow.system.status')
      } catch (error) {
        // エラーも計測に含める
      }
      
      const end = performance.now()
      results.push(end - start)
    }
    
    const stats = {
      iterations,
      average: results.reduce((a, b) => a + b) / results.length,
      min: Math.min(...results),
      max: Math.max(...results),
      median: results.sort((a, b) => a - b)[Math.floor(results.length / 2)]
    }
    
    console.table(stats)
    this.log(`🏁 Benchmark ${name} completed`)
    
    return stats
  }
  
  /**
   * エラー記録
   */
  recordError(message, error, context = {}) {
    const errorRecord = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context,
      timestamp: Date.now()
    }
    
    this.errorLog.push(errorRecord)
    
    // エラー統計更新
    const errorType = error.name || 'Unknown'
    if (!this.errorStats.has(errorType)) {
      this.errorStats.set(errorType, { count: 0, recent: [] })
    }
    
    const stat = this.errorStats.get(errorType)
    stat.count++
    stat.recent.push(errorRecord)
    
    // 最近のエラーを制限
    if (stat.recent.length > 10) {
      stat.recent.shift()
    }
    
    this.log(`❌ Error recorded: ${message}`)
  }
  
  /**
   * ヘルパーメソッド
   */
  getCanvasSize() {
    const canvas = document.getElementById('canvas')
    if (!canvas) return { width: 0, height: 0 }
    
    const rect = canvas.getBoundingClientRect()
    return { width: rect.width, height: rect.height }
  }
  
  getStateHistory() {
    return this.stateHistory
  }
  
  getSystemStats() {
    return {
      system: this.getSystemState(),
      performance: this.getPerformanceStats(),
      errors: this.getErrorStats(),
      trace: {
        enabled: this.traceEnabled,
        count: this.tracedIntents.length,
        patterns: this.tracePatterns
      }
    }
  }
  
  getErrorStats() {
    const stats = {}
    for (const [type, data] of this.errorStats) {
      stats[type] = {
        count: data.count,
        recentCount: data.recent.length
      }
    }
    return stats
  }
  
  getRecentErrors(limit = 10) {
    return this.errorLog.slice(-limit)
  }
  
  getPerformanceSnapshot() {
    return {
      timestamp: Date.now(),
      memory: performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      } : null,
      timing: performance.timing ? {
        loadStart: performance.timing.loadStart,
        loadEnd: performance.timing.loadEventEnd
      } : null
    }
  }
  
  // UI状態専用ダンプ
  dumpUIState() {
    return this.getUIState()
  }
  
  // 接続状態専用ダンプ
  dumpConnectionState() {
    return this.getConnectionState()
  }
  
  // Intent統計取得
  getIntentStats() {
    const intentTypes = {}
    
    this.tracedIntents.forEach(trace => {
      if (!intentTypes[trace.type]) {
        intentTypes[trace.type] = { send: 0, complete: 0, error: 0 }
      }
      intentTypes[trace.type][trace.action]++
    })
    
    return intentTypes
  }
  
  // コマンド登録
  registerCommand(name, handler) {
    this.consoleCommands.set(name, handler)
  }
  
  // データリセット
  resetAllData() {
    this.tracedIntents = []
    this.stateHistory = []
    this.errorLog = []
    this.errorStats.clear()
    this.performanceMetrics.clear()
    
    this.log('🔄 All debug data reset')
    return 'All debug data reset'
  }
  
  // デバッグデータエクスポート
  exportDebugData() {
    const data = {
      timestamp: Date.now(),
      traces: this.tracedIntents,
      states: this.stateHistory,
      errors: this.errorLog,
      performance: this.getPerformanceStats(),
      system: this.getSystemState()
    }
    
    const dataStr = JSON.stringify(data, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `voidflow-debug-${Date.now()}.json`
    a.click()
    
    URL.revokeObjectURL(url)
    
    this.log('💾 Debug data exported')
    return 'Debug data exported'
  }
  
  // ヘルプ表示
  showHelp() {
    const help = `
🐛 VoidFlow Debug Console Commands:

🔍 Tracing:
  voidflowDebug.trace('pattern')     - Enable Intent tracing
  voidflowDebug.stopTrace()          - Disable tracing
  voidflowDebug.getTrace()           - Get trace history
  voidflowDebug.clearTrace()         - Clear trace history

📊 State:
  voidflowDebug.dump('format')       - Dump system state (table/json/tree)
  voidflowDebug.capture()            - Capture current state
  voidflowDebug.history()            - Get state history

📈 Performance:
  voidflowDebug.stats()              - Get system statistics
  voidflowDebug.perf()               - Get performance stats
  voidflowDebug.measure(name, fn)    - Measure function performance
  voidflowDebug.benchmark(name, n)   - Run benchmark

❌ Errors:
  voidflowDebug.errors()             - Get error statistics

🔧 System:
  voidflowDebug.reset()              - Reset all debug data
  voidflowDebug.export()             - Export debug data

📋 Shortcuts:
  voidflowDebug.ui()                 - Dump UI state
  voidflowDebug.conn()               - Dump connection state
  voidflowDebug.intent()             - Get Intent statistics
    `
    
    console.log(help)
    return help
  }
  
  // 全ログクリア
  clearAllLogs() {
    console.clear()
    this.log('🧹 Console cleared')
  }
  
  // システム状態確認
  getSystemStatus() {
    return this.getSystemState()
  }
  
  // 終了処理
  async shutdown() {
    this.log('🔄 VoidFlowDebugManager shutting down...')
    
    // グローバル関数削除
    if (window.charmflowDebug) {
      delete window.charmflowDebug
    }
    
    // データクリア
    this.resetAllData()
    
    this.log('✅ VoidFlowDebugManager shutdown complete')
  }
  
  /**
   * ログ出力
   */
  log(message) {
    console.log(`[DebugManager] ${message}`)
  }
}

// グローバル公開（デバッグ用）
window.CharmFlowDebugManager = CharmFlowDebugManager