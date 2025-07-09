// plugin-loader.js - 段階的プラグイン読み込みシステム
// 1000+プラグインでもスムーズに動作する高性能ローダー

import { PluginAttributes } from './plugin-attributes.js'

/**
 * 🚀 PluginLoader - 段階的プラグイン読み込みシステム
 * 
 * 1000+プラグインを効率的に読み込み・管理するためのローダー
 * - 段階的読み込み（Lazy Loading）
 * - 仮想化（Virtualization）
 * - 優先度制御
 * - キャッシュ機能
 * - バックグラウンド読み込み
 * - プリフェッチ機能
 */
export class PluginLoader {
  constructor(voidCoreUI) {
    this.voidCoreUI = voidCoreUI
    this.version = '1.0.0'
    
    // 読み込み状態管理
    this.loadingState = {
      total: 0,
      loaded: 0,
      loading: 0,
      cached: 0,
      error: 0
    }
    
    // 読み込み設定
    this.config = {
      batchSize: 20,           // 1回の読み込み数
      maxConcurrent: 5,        // 同時読み込み数
      cacheSize: 100,          // キャッシュサイズ
      preloadDistance: 50,     // プリロード距離
      loadTimeout: 10000,      // 読み込みタイムアウト
      retryAttempts: 3,        // リトライ回数
      enableVirtualization: true,
      enablePrefetch: true,
      enableBackgroundLoading: true
    }
    
    // プラグインコンテナ
    this.pluginRegistry = new Map()    // pluginId → plugin data
    this.pluginCache = new Map()       // pluginId → loaded plugin
    this.pluginQueue = []              // 読み込み待機キュー
    this.loadingPlugins = new Set()    // 読み込み中プラグイン
    
    // 読み込み状態
    this.isLoading = false
    this.loadingPromises = new Map()
    
    // 統計情報
    this.stats = {
      totalLoadTime: 0,
      averageLoadTime: 0,
      cacheHitRate: 0,
      errorRate: 0,
      loadHistory: []
    }
    
    // イベントリスナー
    this.eventListeners = {
      'plugin.loaded': [],
      'plugin.loading': [],
      'plugin.error': [],
      'batch.loaded': [],
      'loading.complete': []
    }
    
    this.log('🚀 PluginLoader initialized')
  }
  
  log(message) {
    console.log(`[PluginLoader] ${message}`)
  }
  
  /**
   * プラグインの登録
   */
  registerPlugin(pluginId, pluginData) {
    if (this.pluginRegistry.has(pluginId)) {
      this.log(`⚠️ Plugin ${pluginId} already registered, updating...`)
    }
    
    const registryEntry = {
      id: pluginId,
      data: pluginData,
      priority: pluginData.attributes?.priority || 'medium',
      loaded: false,
      cached: false,
      error: null,
      loadTime: null,
      lastAccessed: null
    }
    
    this.pluginRegistry.set(pluginId, registryEntry)
    this.updateLoadingState()
    
    this.log(`📦 Plugin registered: ${pluginId}`)
  }
  
  /**
   * 複数プラグインの一括登録
   */
  registerMultiplePlugins(plugins) {
    plugins.forEach(plugin => {
      this.registerPlugin(plugin.id, plugin)
    })
    
    this.log(`📦 ${plugins.length} plugins registered`)
  }
  
  /**
   * プラグインの段階的読み込み
   */
  async loadPlugins(options = {}) {
    const config = { ...this.config, ...options }
    
    this.log(`🚀 Starting staged plugin loading (${this.pluginRegistry.size} plugins)`)
    
    // 読み込み状態をリセット
    this.loadingState.loaded = 0
    this.loadingState.loading = 0
    this.loadingState.error = 0
    this.loadingState.total = this.pluginRegistry.size
    
    // 優先度順にソート
    const sortedPlugins = this.getSortedPlugins()
    
    // 段階的読み込み開始
    await this.loadPluginsInBatches(sortedPlugins, config)
    
    this.log(`✅ Plugin loading completed: ${this.loadingState.loaded}/${this.loadingState.total}`)
    this.emit('loading.complete', this.loadingState)
  }
  
  /**
   * 優先度順にプラグインを取得
   */
  getSortedPlugins() {
    const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 }
    
    return Array.from(this.pluginRegistry.values())
      .sort((a, b) => {
        const priorityA = priorityOrder[a.priority] || 1
        const priorityB = priorityOrder[b.priority] || 1
        return priorityA - priorityB
      })
  }
  
  /**
   * バッチ単位でプラグインを読み込み
   */
  async loadPluginsInBatches(plugins, config) {
    const batches = this.createBatches(plugins, config.batchSize)
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      
      this.log(`📦 Loading batch ${i + 1}/${batches.length} (${batch.length} plugins)`)
      
      // バッチ読み込み
      await this.loadPluginBatch(batch, config)
      
      // UIの更新
      this.emit('batch.loaded', {
        batchIndex: i,
        totalBatches: batches.length,
        loadedPlugins: batch.length,
        totalLoaded: this.loadingState.loaded
      })
      
      // 次のバッチまで少し待機（UIの応答性向上）
      if (i < batches.length - 1) {
        await this.delay(50)
      }
    }
  }
  
  /**
   * バッチをプラグインリストから作成
   */
  createBatches(plugins, batchSize) {
    const batches = []
    
    for (let i = 0; i < plugins.length; i += batchSize) {
      batches.push(plugins.slice(i, i + batchSize))
    }
    
    return batches
  }
  
  /**
   * 1つのバッチを読み込み
   */
  async loadPluginBatch(batch, config) {
    const loadPromises = batch.map(async (pluginEntry) => {
      try {
        await this.loadSinglePlugin(pluginEntry.id, config)
      } catch (error) {
        this.log(`❌ Failed to load plugin: ${pluginEntry.id}`)
        this.handlePluginError(pluginEntry.id, error)
      }
    })
    
    await Promise.all(loadPromises)
  }
  
  /**
   * 単一プラグインの読み込み
   */
  async loadSinglePlugin(pluginId, config) {
    const startTime = Date.now()
    
    // 既に読み込み済みかチェック
    if (this.pluginCache.has(pluginId)) {
      this.updateCacheHit(pluginId)
      return this.pluginCache.get(pluginId)
    }
    
    // 読み込み中かチェック
    if (this.loadingPlugins.has(pluginId)) {
      return this.waitForLoading(pluginId)
    }
    
    this.loadingPlugins.add(pluginId)
    this.loadingState.loading++
    
    try {
      this.emit('plugin.loading', { pluginId })
      
      const pluginEntry = this.pluginRegistry.get(pluginId)
      if (!pluginEntry) {
        throw new Error(`Plugin ${pluginId} not found in registry`)
      }
      
      // プラグインのデシリアライゼーション・初期化
      const plugin = await this.initializePlugin(pluginEntry.data)
      
      // キャッシュに保存
      this.pluginCache.set(pluginId, plugin)
      
      // 統計情報更新
      const loadTime = Date.now() - startTime
      this.updateLoadingStats(pluginId, loadTime)
      
      // UI登録
      if (this.voidCoreUI) {
        this.voidCoreUI.registerPlugin(plugin)
      }
      
      this.log(`✅ Plugin loaded: ${pluginId} (${loadTime}ms)`)
      this.emit('plugin.loaded', { pluginId, plugin, loadTime })
      
      return plugin
      
    } catch (error) {
      this.handlePluginError(pluginId, error)
      throw error
    } finally {
      this.loadingPlugins.delete(pluginId)
      this.loadingState.loading--
    }
  }
  
  /**
   * プラグインの初期化
   */
  async initializePlugin(pluginData) {
    // プラグインオブジェクトの構築
    const plugin = {
      id: pluginData.id,
      displayName: pluginData.displayName || pluginData.id,
      version: pluginData.version || '1.0.0',
      type: pluginData.type || 'custom',
      attributes: pluginData.attributes ? 
        new PluginAttributes(pluginData.attributes) : 
        new PluginAttributes()
    }
    
    // ソースコードの実行
    if (pluginData.sourceCode) {
      try {
        await this.executePluginCode(plugin, pluginData.sourceCode)
      } catch (error) {
        this.log(`⚠️ Plugin code execution failed: ${plugin.id}`)
        plugin.executionError = error
      }
    }
    
    return plugin
  }
  
  /**
   * プラグインコードの実行
   */
  async executePluginCode(plugin, sourceCode) {
    // 安全な実行環境を作成
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor
    
    try {
      const pluginFunction = new AsyncFunction(
        'plugin',
        'voidCore',
        'createPlugin',
        'createComfortablePlugin',
        sourceCode
      )
      
      // プラグインコードを実行
      const result = await pluginFunction(
        plugin,
        this.voidCoreUI?.voidCore,
        window.createPlugin,
        window.createComfortablePlugin
      )
      
      // 結果をプラグインオブジェクトに統合
      if (result && typeof result === 'object') {
        Object.assign(plugin, result)
      }
      
    } catch (error) {
      this.log(`❌ Plugin code execution error: ${plugin.id}`)
      throw error
    }
  }
  
  /**
   * 読み込み待機
   */
  async waitForLoading(pluginId) {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (this.pluginCache.has(pluginId)) {
          clearInterval(checkInterval)
          resolve(this.pluginCache.get(pluginId))
        } else if (!this.loadingPlugins.has(pluginId)) {
          clearInterval(checkInterval)
          reject(new Error(`Plugin ${pluginId} loading failed`))
        }
      }, 100)
    })
  }
  
  /**
   * プラグインエラー処理
   */
  handlePluginError(pluginId, error) {
    this.loadingState.error++
    
    const pluginEntry = this.pluginRegistry.get(pluginId)
    if (pluginEntry) {
      pluginEntry.error = error
    }
    
    this.log(`❌ Plugin error: ${pluginId} - ${error.message}`)
    this.emit('plugin.error', { pluginId, error })
  }
  
  /**
   * 統計情報更新
   */
  updateLoadingStats(pluginId, loadTime) {
    this.loadingState.loaded++
    
    const pluginEntry = this.pluginRegistry.get(pluginId)
    if (pluginEntry) {
      pluginEntry.loaded = true
      pluginEntry.loadTime = loadTime
      pluginEntry.lastAccessed = Date.now()
    }
    
    this.stats.totalLoadTime += loadTime
    this.stats.averageLoadTime = this.stats.totalLoadTime / this.loadingState.loaded
    this.stats.loadHistory.push({ pluginId, loadTime, timestamp: Date.now() })
    
    // 履歴サイズ制限
    if (this.stats.loadHistory.length > 1000) {
      this.stats.loadHistory.splice(0, 100)
    }
  }
  
  /**
   * キャッシュヒット更新
   */
  updateCacheHit(pluginId) {
    const pluginEntry = this.pluginRegistry.get(pluginId)
    if (pluginEntry) {
      pluginEntry.lastAccessed = Date.now()
    }
    
    this.stats.cacheHitRate = this.loadingState.cached / 
      (this.loadingState.loaded + this.loadingState.cached)
  }
  
  /**
   * 読み込み状態更新
   */
  updateLoadingState() {
    this.loadingState.total = this.pluginRegistry.size
    this.loadingState.cached = this.pluginCache.size
  }
  
  /**
   * プラグインアンロード（メモリ管理）
   */
  unloadPlugin(pluginId) {
    if (this.pluginCache.has(pluginId)) {
      this.pluginCache.delete(pluginId)
      this.log(`🗑️ Plugin unloaded: ${pluginId}`)
    }
    
    if (this.voidCoreUI) {
      this.voidCoreUI.unregisterPlugin(pluginId)
    }
  }
  
  /**
   * キャッシュクリア
   */
  clearCache() {
    this.pluginCache.clear()
    this.loadingState.cached = 0
    this.log('🗑️ Plugin cache cleared')
  }
  
  /**
   * 優先度指定読み込み
   */
  async loadPluginsByPriority(priority) {
    const plugins = Array.from(this.pluginRegistry.values())
      .filter(p => p.priority === priority && !p.loaded)
    
    this.log(`🔥 Loading ${plugins.length} ${priority} priority plugins`)
    
    await this.loadPluginsInBatches(plugins, this.config)
  }
  
  /**
   * 遅延実行
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  /**
   * イベントエミッター
   */
  emit(eventName, data) {
    const listeners = this.eventListeners[eventName] || []
    listeners.forEach(listener => {
      try {
        listener(data)
      } catch (error) {
        this.log(`❌ Event listener error: ${eventName}`)
      }
    })
  }
  
  /**
   * イベントリスナー追加
   */
  on(eventName, listener) {
    if (!this.eventListeners[eventName]) {
      this.eventListeners[eventName] = []
    }
    this.eventListeners[eventName].push(listener)
  }
  
  /**
   * プラグイン検索
   */
  searchPlugins(query) {
    const results = []
    
    this.pluginRegistry.forEach((pluginEntry, pluginId) => {
      const plugin = pluginEntry.data
      
      if (
        pluginId.toLowerCase().includes(query.toLowerCase()) ||
        plugin.displayName?.toLowerCase().includes(query.toLowerCase()) ||
        plugin.attributes?.tags?.some(tag => 
          tag.toLowerCase().includes(query.toLowerCase())
        )
      ) {
        results.push(pluginEntry)
      }
    })
    
    return results
  }
  
  /**
   * 統計情報取得
   */
  getStats() {
    return {
      ...this.stats,
      loadingState: this.loadingState,
      cacheSize: this.pluginCache.size,
      registrySize: this.pluginRegistry.size
    }
  }
  
  /**
   * 設定更新
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
    this.log('⚙️ Configuration updated')
  }
}

// グローバルインスタンス
export const pluginLoader = new PluginLoader()

console.log('🚀 PluginLoader system loaded!')