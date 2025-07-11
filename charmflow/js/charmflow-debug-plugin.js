/**
 * 🐛 CharmFlowDebugPlugin - CharmFlow専用統合デバッグプラグイン
 * 
 * 🎯 設計哲学:
 * - VoidCore v14.0 IPlugin準拠の美しい単一ファイル実装
 * - GUI操作デバッグの革命的改善
 * - Intent-based統一アーキテクチャによる完全トレース
 * 
 * 🚀 核心機能:
 * - リアルタイムIntent監視・トレース
 * - システム状態ダンプ・履歴管理
 * - パフォーマンス分析・計測
 * - エラー統合レポート・統計
 * - グローバルデバッグコンソール
 * 
 * 🌟 VoidCoreルール完全準拠:
 * - IPlugin継承による統一インターフェース
 * - 明確な責任分離とメッセージベース処理
 * - 単一ファイル・自己完結型実装
 * 
 * Created: 2025-07-10
 * Phase 4: デバッグ機能完成 - VoidCoreルール準拠版
 */

import { IPlugin } from '../../src/interfaces/plugin-interface.js'
import { Message } from '../../src/messaging/message.js'

/**
 * 🐛 CharmFlowDebugPlugin - 統合デバッグシステム
 */
export class CharmFlowDebugPlugin extends IPlugin {
  constructor(config = {}) {
    super({
      id: 'VoidFlow.DebugPlugin',
      type: 'system.debug',
      displayName: 'VoidFlow Debug Plugin',
      ...config
    })
    
    // 🔧 デバッグ設定
    this.options = {
      enableDebug: true,
      enableStats: true,
      enableTrace: false,
      traceLevel: 'basic',  // basic, detailed, verbose
      maxTraceHistory: 1000,
      maxStateHistory: 100,
      ...config.options
    }
    
    // 📊 Intent監視・トレース
    this.intentTracking = {
      enabled: false,
      patterns: ['*'],
      level: 'basic',
      history: [],
      maxHistory: this.options.maxTraceHistory
    }
    
    // 📈 パフォーマンス計測
    this.performance = {
      markers: new Map(),
      metrics: new Map(),
      history: [],
      benchmarks: new Map()
    }
    
    // 📊 システム状態管理
    this.systemState = {
      history: [],
      maxHistory: this.options.maxStateHistory,
      lastCapture: 0
    }
    
    // ❌ エラー統計・追跡
    this.errorTracking = {
      log: [],
      stats: new Map(),
      categories: new Map()
    }
    
    // 🎯 VoidFlowCore参照（外部から設定）
    this.voidFlowCore = null
    this.targetSystem = null
    
    this.log('🐛 VoidFlowDebugPlugin initialized')
    this.initializeDebugConsole()
  }
  
  // ==========================================
  // 🧩 IPlugin必須メソッド
  // ==========================================
  
  /**
   * プラグイン有効化
   */
  async onActivated() {
    this.log('🚀 VoidFlowDebugPlugin activated')
    this.setupGlobalDebugFunctions()
    return { status: 'activated', timestamp: Date.now() }
  }
  
  /**
   * プラグイン無効化
   */
  async onDeactivated() {
    this.log('🔄 VoidFlowDebugPlugin deactivated')
    this.cleanup()
    return { status: 'deactivated', timestamp: Date.now() }
  }
  
  /**
   * メッセージ処理
   */
  async processMessage(message) {
    // デバッグ関連メッセージの処理
    switch (message.type) {
      case 'debug.trace.enable':
        return this.enableTrace(message.payload.patterns, message.payload.level)
      
      case 'debug.trace.disable':
        return this.disableTrace()
      
      case 'debug.state.dump':
        return this.dumpState(message.payload.format)
      
      case 'debug.state.capture':
        return this.captureState()
      
      case 'debug.performance.measure':
        return this.measurePerformance(message.payload.name, message.payload.fn)
      
      case 'debug.stats.get':
        return this.getSystemStats()
      
      case 'debug.export':
        return this.exportDebugData()
      
      case 'debug.reset':
        return this.resetAllData()
      
      default:
        return { status: 'ignored', message: `Unknown debug message: ${message.type}` }
    }
  }
  
  /**
   * Intent処理
   */
  async handleIntent(message) {
    const { intent, payload } = message
    
    this.log(`🎯 Debug Intent received: ${intent}`)
    
    switch (intent) {
      case 'voidflow.debug.trace.start':
        return { status: 'success', result: this.enableTrace(payload.patterns, payload.level) }
      
      case 'voidflow.debug.trace.stop':
        return { status: 'success', result: this.disableTrace() }
      
      case 'voidflow.debug.state.dump':
        return { status: 'success', result: this.dumpState(payload.format) }
      
      case 'voidflow.debug.state.capture':
        return { status: 'success', result: this.captureState() }
      
      case 'voidflow.debug.performance.measure':
        if (payload.name && payload.fn) {
          return { status: 'success', result: this.measurePerformance(payload.name, payload.fn) }
        } else {
          throw new Error('Performance measurement requires name and function')
        }
      
      case 'voidflow.debug.stats.get':
        return { status: 'success', result: this.getSystemStats() }
      
      case 'voidflow.debug.export':
        return { status: 'success', result: this.exportDebugData() }
      
      case 'voidflow.debug.reset':
        return { status: 'success', result: this.resetAllData() }
      
      default:
        throw new Error(`Unknown Debug Intent: ${intent}`)
    }
  }
  
  // ==========================================
  // 🔧 設定・初期化
  // ==========================================
  
  /**
   * ターゲットシステム設定
   */
  setTargetSystem(voidFlowCore) {
    this.voidFlowCore = voidFlowCore
    this.targetSystem = voidFlowCore
    this.log('📡 Target system registered')
    
    // Intent監視設定
    if (this.options.enableTrace) {
      this.setupIntentMonitoring()
    }
  }
  
  /**
   * デバッグコンソール初期化
   */
  initializeDebugConsole() {
    this.log('🔧 Debug console initializing...')
  }
  
  /**
   * グローバルデバッグ関数設定
   */
  setupGlobalDebugFunctions() {
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
    
    // VoidFlow専用デバッグ関数
    window.debugCharmFlow = {
      core: () => this.voidFlowCore,
      debugManager: () => this,
      startTrace: (patterns, level) => this.enableTrace(patterns, level),
      stopTrace: () => this.disableTrace(),
      dumpState: (format) => this.dumpState(format),
      getStats: () => this.getSystemStats(),
      reset: () => this.resetAllData(),
      export: () => this.exportDebugData()
    }
    
    this.log('🔧 Global debug functions registered')
  }
  
  // ==========================================
  // 🔍 Intent監視・トレース
  // ==========================================
  
  /**
   * Intent監視設定
   */
  setupIntentMonitoring() {
    if (!this.voidFlowCore || !this.voidFlowCore.sendIntent) {
      this.log('⚠️ VoidFlowCore not available for Intent monitoring')
      return
    }
    
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
   * トレース有効化
   */
  enableTrace(patterns = ['*'], level = 'basic') {
    this.intentTracking.enabled = true
    this.intentTracking.patterns = Array.isArray(patterns) ? patterns : [patterns]
    this.intentTracking.level = level
    
    this.log(`🔍 Intent tracing enabled: ${this.intentTracking.patterns.join(', ')} (${level})`)
    return `Tracing enabled for: ${this.intentTracking.patterns.join(', ')}`
  }
  
  /**
   * トレース無効化
   */
  disableTrace() {
    this.intentTracking.enabled = false
    this.log('🔍 Intent tracing disabled')
    return 'Tracing disabled'
  }
  
  /**
   * Intentをトレースすべきか判定
   */
  shouldTrace(intentType) {
    if (!this.intentTracking.enabled) return false
    
    return this.intentTracking.patterns.some(pattern => {
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
      level: this.intentTracking.level
    }
    
    this.intentTracking.history.push(trace)
    
    // 履歴サイズ制限
    if (this.intentTracking.history.length > this.intentTracking.maxHistory) {
      this.intentTracking.history.shift()
    }
    
    // リアルタイム出力（詳細レベル以上）
    if (this.intentTracking.level !== 'basic') {
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
    let traces = this.intentTracking.history
    
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
    this.intentTracking.history = []
    this.log('🧹 Trace history cleared')
    return 'Trace history cleared'
  }
  
  // ==========================================
  // 📊 システム状態管理
  // ==========================================
  
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
    this.systemState.history.push(state)
    if (this.systemState.history.length > this.systemState.maxHistory) {
      this.systemState.history.shift()
    }
    
    this.systemState.lastCapture = timestamp
    return state
  }
  
  /**
   * システム状態取得
   */
  getSystemState() {
    return {
      voidFlowCore: this.voidFlowCore ? this.getVoidFlowCoreStatus() : null,
      debugPlugin: {
        traceEnabled: this.intentTracking.enabled,
        tracePatterns: this.intentTracking.patterns,
        traceCount: this.intentTracking.history.length,
        stateHistoryCount: this.systemState.history.length,
        errorCount: this.errorTracking.log.length
      },
      plugin: {
        id: this.id,
        type: this.type,
        status: this.status,
        displayName: this.displayName
      },
      timestamp: Date.now()
    }
  }
  
  /**
   * VoidFlowCoreステータス取得
   */
  getVoidFlowCoreStatus() {
    if (!this.voidFlowCore) return null
    
    return {
      initialized: this.voidFlowCore.isInitialized,
      features: this.voidFlowCore.getAvailableFeatures ? this.voidFlowCore.getAvailableFeatures() : [],
      systemStatus: this.voidFlowCore.getSystemStatus ? this.voidFlowCore.getSystemStatus() : null
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
    // VoidFlowCoreのConnectionManagerからの情報取得
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
   * 状態履歴取得
   */
  getStateHistory() {
    return this.systemState.history
  }
  
  // ==========================================
  // ⚡ パフォーマンス分析
  // ==========================================
  
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
    if (!this.performance.metrics.has(operation)) {
      this.performance.metrics.set(operation, {
        count: 0,
        total: 0,
        min: Infinity,
        max: 0,
        average: 0,
        recent: []
      })
    }
    
    const metric = this.performance.metrics.get(operation)
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
    
    for (const [operation, metric] of this.performance.metrics) {
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
      
      // ベンチマーク対象の処理（重い処理をシミュレート）
      try {
        // 重い処理のシミュレーション
        switch (name) {
          case 'system-state':
            this.getSystemState()
            // DOM操作を追加してより重くする
            document.querySelectorAll('*').length
            break
          case 'ui-update':
            // UI状態取得（重め）
            this.getUIState()
            // 配列処理追加
            Array.from({ length: 100 }, (_, i) => i * Math.random()).sort()
            break
          case 'memory-test':
            // メモリテスト
            const tempArray = new Array(1000).fill(0).map(() => Math.random())
            tempArray.reduce((a, b) => a + b)
            break
          default:
            // デフォルト：計算集約的処理
            let sum = 0
            for (let j = 0; j < 1000; j++) {
              sum += Math.random() * Math.sin(j) * Math.cos(j)
            }
        }
      } catch (error) {
        // エラーも計測に含める
      }
      
      const end = performance.now()
      results.push(end - start)
    }
    
    const average = results.reduce((a, b) => a + b) / results.length
    const sortedResults = [...results].sort((a, b) => a - b)
    
    const stats = {
      iterations,
      average: Number(average.toFixed(3)),
      min: Number(Math.min(...results).toFixed(3)),
      max: Number(Math.max(...results).toFixed(3)),
      median: Number(sortedResults[Math.floor(sortedResults.length / 2)].toFixed(3)),
      total: Number((average * iterations).toFixed(3))
    }
    
    console.table(stats)
    this.log(`🏁 Benchmark ${name} completed: avg ${stats.average}ms`)
    
    return stats
  }
  
  /**
   * パフォーマンススナップショット取得
   */
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
  
  // ==========================================
  // ❌ エラー追跡・統計
  // ==========================================
  
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
    
    this.errorTracking.log.push(errorRecord)
    
    // エラー統計更新
    const errorType = error.name || 'Unknown'
    if (!this.errorTracking.stats.has(errorType)) {
      this.errorTracking.stats.set(errorType, { count: 0, recent: [] })
    }
    
    const stat = this.errorTracking.stats.get(errorType)
    stat.count++
    stat.recent.push(errorRecord)
    
    // 最近のエラーを制限
    if (stat.recent.length > 10) {
      stat.recent.shift()
    }
    
    this.log(`❌ Error recorded: ${message}`)
  }
  
  /**
   * エラー統計取得
   */
  getErrorStats() {
    const stats = {}
    for (const [type, data] of this.errorTracking.stats) {
      stats[type] = {
        count: data.count,
        recentCount: data.recent.length
      }
    }
    return stats
  }
  
  /**
   * 最近のエラー取得
   */
  getRecentErrors(limit = 10) {
    return this.errorTracking.log.slice(-limit)
  }
  
  // ==========================================
  // 📊 統計・レポート
  // ==========================================
  
  /**
   * システム統計取得
   */
  getSystemStats() {
    return {
      system: this.getSystemState(),
      performance: this.getPerformanceStats(),
      errors: this.getErrorStats(),
      trace: {
        enabled: this.intentTracking.enabled,
        count: this.intentTracking.history.length,
        patterns: this.intentTracking.patterns
      },
      plugin: {
        id: this.id,
        type: this.type,
        status: this.status,
        uptime: Date.now() - this.createdAt
      }
    }
  }
  
  /**
   * Intent統計取得
   */
  getIntentStats() {
    const intentTypes = {}
    
    this.intentTracking.history.forEach(trace => {
      if (!intentTypes[trace.type]) {
        intentTypes[trace.type] = { send: 0, complete: 0, error: 0 }
      }
      intentTypes[trace.type][trace.action]++
    })
    
    return intentTypes
  }
  
  // ==========================================
  // 🔧 ユーティリティ・ヘルパー
  // ==========================================
  
  /**
   * UI状態専用ダンプ
   */
  dumpUIState() {
    return this.getUIState()
  }
  
  /**
   * 接続状態専用ダンプ
   */
  dumpConnectionState() {
    return this.getConnectionState()
  }
  
  /**
   * キャンバスサイズ取得
   */
  getCanvasSize() {
    const canvas = document.getElementById('canvas')
    if (!canvas) return { width: 0, height: 0 }
    
    const rect = canvas.getBoundingClientRect()
    return { width: rect.width, height: rect.height }
  }
  
  /**
   * データリセット
   */
  resetAllData() {
    this.intentTracking.history = []
    this.systemState.history = []
    this.errorTracking.log = []
    this.errorTracking.stats.clear()
    this.performance.metrics.clear()
    
    this.log('🔄 All debug data reset')
    return 'All debug data reset'
  }
  
  /**
   * デバッグデータエクスポート
   */
  exportDebugData() {
    const data = {
      timestamp: Date.now(),
      plugin: {
        id: this.id,
        type: this.type,
        displayName: this.displayName
      },
      traces: this.intentTracking.history,
      states: this.systemState.history,
      errors: this.errorTracking.log,
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
  
  /**
   * クリーンアップ
   */
  cleanup() {
    // グローバル関数削除
    if (window.charmflowDebug) {
      delete window.charmflowDebug
    }
    if (window.debugCharmFlow) {
      delete window.debugCharmFlow
    }
    
    // データクリア
    this.resetAllData()
    
    this.log('🧹 VoidFlowDebugPlugin cleanup complete')
  }
  
  /**
   * ログ出力
   */
  log(message) {
    if (this.options.enableDebug) {
      console.log(`[${this.displayName}] ${message}`)
    }
  }
}

// グローバル公開（デバッグ用）
window.CharmFlowDebugPlugin = CharmFlowDebugPlugin