/**
 * 🌟 UnifiedStatsManager - 統一統計管理システム
 * 
 * 🔧 大工事Phase3: 統計システム統合完了版
 * 
 * 🎯 統合対象:
 * - VoidCoreBase.getStats()
 * - VoidCore.getStats()
 * - VoidCore.getSystemStats()
 * - PluginManager.stats
 * - IntentHandler.stats
 * - 各コアモジュール独自統計
 * 
 * 🚀 設計思想:
 * - 統一された統計収集・配信システム
 * - リアルタイム統計監視
 * - 統計データ永続化・分析
 * 
 * Created: 2025-07-08 (大工事Phase3)
 */

export class UnifiedStatsManager {
  constructor(config = {}) {
    this.coreId = config.coreId || 'unified-stats-manager'
    this.core = config.core || null
    this.pluginManager = config.pluginManager || null
    this.intentHandler = config.intentHandler || null
    this.channelManager = config.channelManager || null
    
    // 🎯 統一統計ストレージ
    this.statsStorage = new Map()
    this.statsHistory = []
    this.maxHistorySize = config.maxHistorySize || 1000
    
    // 🔧 統計収集設定
    this.collectInterval = config.collectInterval || 5000 // 5秒
    this.collectTimer = null
    this.autoCollect = config.autoCollect !== false
    
    // 🌟 統計カテゴリ
    this.categories = {
      core: 'Core Statistics',
      plugin: 'Plugin Statistics', 
      intent: 'Intent Statistics',
      message: 'Message Statistics',
      channel: 'Channel Statistics',
      fusion: 'Fusion Statistics',
      system: 'System Statistics',
      performance: 'Performance Statistics'
    }
    
    // 🚀 統計監視・通知
    this.statsListeners = new Map()
    this.thresholds = new Map()
    this.alerts = []
    
    // 🎯 統計データ型
    this.dataTypes = {
      counter: 'counter',
      gauge: 'gauge',
      histogram: 'histogram',
      timer: 'timer'
    }
    
    // 📊 統計計算キャッシュ
    this.calculationCache = new Map()
    this.cacheTimeout = config.cacheTimeout || 1000 // 1秒
    
    this.log('🌟 UnifiedStatsManager initialized')
    
    // 🔧 自動統計収集開始
    if (this.autoCollect) {
      this.startAutoCollection()
    }
  }

  // ==========================================
  // 統一統計収集システム
  // ==========================================

  /**
   * 統一統計収集
   * @returns {Promise<Object>} 統計データ
   */
  async collectAllStats() {
    const timestamp = Date.now()
    const stats = {
      timestamp,
      categories: {},
      summary: {},
      performance: {}
    }
    
    try {
      // 🔧 コア統計収集
      if (this.core) {
        stats.categories.core = await this.collectCoreStats()
      }
      
      // 🎯 プラグイン統計収集
      if (this.pluginManager) {
        stats.categories.plugin = await this.collectPluginStats()
      }
      
      // 🌟 Intent統計収集
      if (this.intentHandler) {
        stats.categories.intent = await this.collectIntentStats()
      }
      
      // 🚀 チャンネル統計収集
      if (this.channelManager) {
        stats.categories.channel = await this.collectChannelStats()
      }
      
      // 📊 システム統計収集
      stats.categories.system = await this.collectSystemStats()
      
      // 🔧 パフォーマンス統計収集
      stats.categories.performance = await this.collectPerformanceStats()
      
      // 🎯 統計サマリー作成
      stats.summary = this.createStatsSummary(stats.categories)
      
      // 🌟 統計履歴保存
      this.saveStatsHistory(stats)
      
      // 🚀 統計監視・通知
      await this.processStatsMonitoring(stats)
      
      return stats
      
    } catch (error) {
      this.log(`❌ Stats collection failed: ${error.message}`)
      return { error: error.message, timestamp }
    }
  }

  /**
   * コア統計収集
   * @returns {Promise<Object>} コア統計
   */
  async collectCoreStats() {
    const stats = {
      coreId: this.core.coreId,
      name: this.core.name,
      version: this.core.version,
      initialized: this.core.initialized,
      runtime: Date.now() - (this.core.stats?.startTime || Date.now())
    }
    
    // 🔧 SystemBootManager統計
    if (this.core.systemBootManager) {
      stats.systemBootManager = {
        systemStatus: this.core.systemBootManager.systemStatus,
        isBootComplete: this.core.systemBootManager.isBootComplete,
        parentCoreReady: this.core.systemBootManager.parentCoreReady,
        childCoreCount: this.core.systemBootManager.childCoreCount,
        bootSequence: this.core.systemBootManager.bootSequence?.length || 0
      }
    }
    
    // 🎯 基本統計取得
    if (this.core.base && this.core.base.getStats) {
      const baseStats = this.core.base.getStats()
      stats.base = baseStats
    }
    
    return stats
  }

  /**
   * プラグイン統計収集
   * @returns {Promise<Object>} プラグイン統計
   */
  async collectPluginStats() {
    const pluginStats = this.pluginManager.getStats()
    
    // 🔧 追加統計計算
    const plugins = this.pluginManager.getAllPlugins()
    const typeDistribution = this.pluginManager.getTypeDistribution()
    
    return {
      ...pluginStats,
      plugins: plugins.length,
      typeDistribution,
      healthyPlugins: plugins.filter(p => p.status === 'active').length,
      unhealthyPlugins: plugins.filter(p => p.status !== 'active').length,
      recentOperations: pluginStats.recentOperations?.length || 0
    }
  }

  /**
   * Intent統計収集
   * @returns {Promise<Object>} Intent統計
   */
  async collectIntentStats() {
    const intentStats = this.intentHandler.getStats()
    
    // 🔧 追加統計計算
    const successRate = intentStats.totalIntents > 0 ? 
      intentStats.successfulIntents / intentStats.totalIntents : 0
    
    const averageProcessingTime = intentStats.totalIntents > 0 ?
      intentStats.totalProcessingTime / intentStats.totalIntents : 0
    
    return {
      ...intentStats,
      successRate,
      averageProcessingTime,
      intentsPerSecond: intentStats.totalIntents / (intentStats.runtime / 1000),
      queueUtilization: intentStats.pendingIntents / 100 // maxConcurrentIntents
    }
  }

  /**
   * チャンネル統計収集
   * @returns {Promise<Object>} チャンネル統計
   */
  async collectChannelStats() {
    const channelStats = this.channelManager.getStats()
    
    return {
      ...channelStats,
      transportType: this.channelManager.transport?.constructor.name || 'Unknown',
      multiChannelEnabled: this.channelManager.multiChannelEnabled,
      subscriberEfficiency: channelStats.totalSubscribers > 0 ? 
        channelStats.totalMessages / channelStats.totalSubscribers : 0
    }
  }

  /**
   * システム統計収集
   * @returns {Promise<Object>} システム統計
   */
  async collectSystemStats() {
    const stats = {
      timestamp: Date.now(),
      uptime: process.uptime ? process.uptime() : 0,
      nodeVersion: process.version || 'Unknown',
      platform: process.platform || 'Unknown'
    }
    
    // 🔧 メモリ統計（可能な場合）
    if (process.memoryUsage) {
      stats.memory = process.memoryUsage()
    }
    
    // 🎯 CPU統計（可能な場合）
    if (process.cpuUsage) {
      stats.cpu = process.cpuUsage()
    }
    
    return stats
  }

  /**
   * パフォーマンス統計収集
   * @returns {Promise<Object>} パフォーマンス統計
   */
  async collectPerformanceStats() {
    const stats = {
      timestamp: Date.now(),
      collectionsPerformed: this.statsHistory.length,
      cacheHits: this.getCacheHits(),
      cacheMisses: this.getCacheMisses()
    }
    
    // 🔧 Performance API（可能な場合）
    if (performance && performance.now) {
      stats.performanceNow = performance.now()
    }
    
    return stats
  }

  // ==========================================
  // 統計サマリー・分析
  // ==========================================

  /**
   * 統計サマリー作成
   * @param {Object} categories - カテゴリ別統計
   * @returns {Object} 統計サマリー
   */
  createStatsSummary(categories) {
    const summary = {
      timestamp: Date.now(),
      overallHealth: 'healthy',
      keyMetrics: {},
      trends: {},
      recommendations: []
    }
    
    // 🔧 キー指標計算
    if (categories.plugin) {
      summary.keyMetrics.totalPlugins = categories.plugin.plugins
      summary.keyMetrics.activePlugins = categories.plugin.healthyPlugins
      summary.keyMetrics.pluginHealth = categories.plugin.plugins > 0 ? 
        categories.plugin.healthyPlugins / categories.plugin.plugins : 1
    }
    
    if (categories.intent) {
      summary.keyMetrics.intentSuccessRate = categories.intent.successRate
      summary.keyMetrics.intentThroughput = categories.intent.intentsPerSecond
    }
    
    if (categories.channel) {
      summary.keyMetrics.messageSubscribers = categories.channel.totalSubscribers
      summary.keyMetrics.messageCount = categories.channel.totalMessages
    }
    
    // 🎯 健全性判定
    summary.overallHealth = this.determineOverallHealth(summary.keyMetrics)
    
    // 🌟 推奨事項生成
    summary.recommendations = this.generateRecommendations(categories)
    
    return summary
  }

  /**
   * 全体健全性判定
   * @param {Object} keyMetrics - キー指標
   * @returns {string} 健全性レベル
   */
  determineOverallHealth(keyMetrics) {
    let healthScore = 100
    
    // 🔧 プラグイン健全性
    if (keyMetrics.pluginHealth < 0.8) {
      healthScore -= 20
    }
    
    // 🎯 Intent成功率
    if (keyMetrics.intentSuccessRate < 0.9) {
      healthScore -= 15
    }
    
    // 🌟 健全性レベル判定
    if (healthScore >= 80) return 'healthy'
    if (healthScore >= 60) return 'warning'
    if (healthScore >= 40) return 'critical'
    return 'failing'
  }

  /**
   * 推奨事項生成
   * @param {Object} categories - カテゴリ別統計
   * @returns {Array<string>} 推奨事項
   */
  generateRecommendations(categories) {
    const recommendations = []
    
    // 🔧 プラグイン推奨
    if (categories.plugin) {
      if (categories.plugin.unhealthyPlugins > 0) {
        recommendations.push(`Check ${categories.plugin.unhealthyPlugins} unhealthy plugins`)
      }
      
      if (categories.plugin.plugins > 50) {
        recommendations.push('Consider plugin optimization for large plugin count')
      }
    }
    
    // 🎯 Intent推奨
    if (categories.intent) {
      if (categories.intent.successRate < 0.9) {
        recommendations.push('Investigate Intent processing failures')
      }
      
      if (categories.intent.queueUtilization > 0.8) {
        recommendations.push('Consider increasing Intent queue size')
      }
    }
    
    // 🌟 パフォーマンス推奨
    if (categories.system) {
      if (categories.system.memory?.rss > 100 * 1024 * 1024) { // 100MB
        recommendations.push('Consider memory optimization')
      }
    }
    
    return recommendations
  }

  // ==========================================
  // 統計履歴・永続化
  // ==========================================

  /**
   * 統計履歴保存
   * @param {Object} stats - 統計データ
   */
  saveStatsHistory(stats) {
    this.statsHistory.push(stats)
    
    // 履歴サイズ制限
    if (this.statsHistory.length > this.maxHistorySize) {
      this.statsHistory.shift()
    }
    
    // 🔧 統計ストレージ更新
    this.statsStorage.set(stats.timestamp, stats)
  }

  /**
   * 統計履歴取得
   * @param {number} limit - 取得件数制限
   * @returns {Array<Object>} 統計履歴
   */
  getStatsHistory(limit = 100) {
    return this.statsHistory.slice(-limit)
  }

  /**
   * 統計トレンド分析
   * @param {string} metric - 分析対象指標
   * @param {number} samples - サンプル数
   * @returns {Object} トレンド分析結果
   */
  analyzeStatsTrend(metric, samples = 10) {
    const recentHistory = this.statsHistory.slice(-samples)
    
    if (recentHistory.length < 2) {
      return { trend: 'insufficient_data', samples: recentHistory.length }
    }
    
    const values = recentHistory.map(h => this.extractMetricValue(h, metric))
    const trend = this.calculateTrend(values)
    
    return {
      trend: trend.direction,
      slope: trend.slope,
      samples: values.length,
      current: values[values.length - 1],
      previous: values[0]
    }
  }

  // ==========================================
  // 統計監視・通知
  // ==========================================

  /**
   * 統計監視処理
   * @param {Object} stats - 統計データ
   */
  async processStatsMonitoring(stats) {
    // 🔧 閾値チェック
    for (const [metric, threshold] of this.thresholds) {
      const value = this.extractMetricValue(stats, metric)
      
      if (this.isThresholdExceeded(value, threshold)) {
        await this.triggerAlert(metric, value, threshold)
      }
    }
    
    // 🎯 統計リスナー通知
    for (const [category, listeners] of this.statsListeners) {
      if (stats.categories[category]) {
        for (const listener of listeners) {
          try {
            await listener(stats.categories[category])
          } catch (error) {
            this.log(`❌ Stats listener error: ${error.message}`)
          }
        }
      }
    }
  }

  /**
   * 統計閾値設定
   * @param {string} metric - 指標名
   * @param {Object} threshold - 閾値設定
   */
  setThreshold(metric, threshold) {
    this.thresholds.set(metric, {
      ...threshold,
      registeredAt: Date.now()
    })
    this.log(`📊 Stats threshold set: ${metric}`)
  }

  /**
   * 統計リスナー登録
   * @param {string} category - カテゴリ
   * @param {Function} listener - リスナー関数
   */
  addStatsListener(category, listener) {
    if (!this.statsListeners.has(category)) {
      this.statsListeners.set(category, new Set())
    }
    this.statsListeners.get(category).add(listener)
    this.log(`📊 Stats listener added: ${category}`)
  }

  // ==========================================
  // 自動統計収集
  // ==========================================

  /**
   * 自動統計収集開始
   */
  startAutoCollection() {
    if (this.collectTimer) {
      clearInterval(this.collectTimer)
    }
    
    this.collectTimer = setInterval(async () => {
      try {
        await this.collectAllStats()
      } catch (error) {
        this.log(`❌ Auto stats collection failed: ${error.message}`)
      }
    }, this.collectInterval)
    
    this.log('🔄 Auto stats collection started')
  }

  /**
   * 自動統計収集停止
   */
  stopAutoCollection() {
    if (this.collectTimer) {
      clearInterval(this.collectTimer)
      this.collectTimer = null
    }
    this.log('⏸️ Auto stats collection stopped')
  }

  // ==========================================
  // ユーティリティ
  // ==========================================

  /**
   * 指標値抽出
   * @param {Object} stats - 統計データ
   * @param {string} metric - 指標パス
   * @returns {any} 指標値
   */
  extractMetricValue(stats, metric) {
    const parts = metric.split('.')
    let value = stats
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part]
      } else {
        return null
      }
    }
    
    return value
  }

  /**
   * トレンド計算
   * @param {Array<number>} values - 値配列
   * @returns {Object} トレンド結果
   */
  calculateTrend(values) {
    if (values.length < 2) return { direction: 'stable', slope: 0 }
    
    const first = values[0]
    const last = values[values.length - 1]
    const slope = (last - first) / (values.length - 1)
    
    let direction = 'stable'
    if (slope > 0.1) direction = 'increasing'
    else if (slope < -0.1) direction = 'decreasing'
    
    return { direction, slope }
  }

  /**
   * 閾値超過判定
   * @param {number} value - 値
   * @param {Object} threshold - 閾値
   * @returns {boolean} 超過判定
   */
  isThresholdExceeded(value, threshold) {
    if (value === null || value === undefined) return false
    
    if (threshold.max !== undefined && value > threshold.max) return true
    if (threshold.min !== undefined && value < threshold.min) return true
    
    return false
  }

  /**
   * アラート発生
   * @param {string} metric - 指標名
   * @param {number} value - 値
   * @param {Object} threshold - 閾値
   */
  async triggerAlert(metric, value, threshold) {
    const alert = {
      timestamp: Date.now(),
      metric,
      value,
      threshold,
      severity: threshold.severity || 'warning'
    }
    
    this.alerts.push(alert)
    this.log(`🚨 Stats alert: ${metric} = ${value} (threshold: ${JSON.stringify(threshold)})`)
  }

  /**
   * キャッシュヒット数取得
   * @returns {number} キャッシュヒット数
   */
  getCacheHits() {
    return this.calculationCache.size
  }

  /**
   * キャッシュミス数取得
   * @returns {number} キャッシュミス数
   */
  getCacheMisses() {
    // 実装は後で
    return 0
  }

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
    // 自動収集停止
    this.stopAutoCollection()
    
    // データクリア
    this.statsStorage.clear()
    this.statsHistory = []
    this.calculationCache.clear()
    this.alerts = []
    
    // リスナーとミドルウェアクリア
    this.statsListeners.clear()
    this.thresholds.clear()
    
    this.log('🧹 UnifiedStatsManager cleared')
  }
}

export default UnifiedStatsManager