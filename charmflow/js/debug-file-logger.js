/**
 * 🐛 DebugFileLogger - ファイル出力デバッグログシステム
 * 
 * 機能:
 * - 起動時ログ初期化
 * - カテゴリ別ログ分類
 * - VoidCoreデバッグプラグイン連携
 * - リアルタイムファイル出力
 * - パフォーマンス影響最小化
 * 
 * Created: 2025-07-09
 * Phase 1: 高度デバッグシステム
 */

export class DebugFileLogger {
  constructor(options = {}) {
    this.options = {
      logDirectory: './debug-logs',
      sessionId: this.generateSessionId(),
      maxFileSize: 10 * 1024 * 1024, // 10MB
      categories: ['system', 'connection', 'ui', 'intent', 'performance', 'error'],
      enableFileOutput: true,
      enableConsoleOutput: true,
      enableAutoExport: false, // F5時自動エクスポート無効化
      logLevel: 'debug', // debug, info, warn, error
      // 🎚️ カテゴリ別有効/無効設定
      enabledCategories: ['system', 'connection', 'ui', 'intent', 'performance', 'error'],
      verboseConnection: false, // 🔕 接続ログの詳細出力制御
      ...options
    }
    
    this.logBuffers = new Map() // カテゴリ別バッファ
    this.logCounts = new Map()  // カテゴリ別カウント
    this.sessionStartTime = Date.now()
    this.isInitialized = false
    
    // ログレベル定義
    this.logLevels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    }
    
    this.currentLogLevel = this.logLevels[this.options.logLevel] || 0
    
    // 保存された設定を読み込み
    this.loadLogSettings()
    
    this.log('system', 'info', '🐛 DebugFileLogger initialized', {
      sessionId: this.options.sessionId,
      logDirectory: this.options.logDirectory,
      enabledCategories: this.options.enabledCategories
    })
  }
  
  /**
   * 📁 ログシステム初期化
   */
  async initialize() {
    if (this.isInitialized) return
    
    try {
      // F5時: 前回セッションログを自動エクスポート
      if (this.options.enableAutoExport) {
        await this.exportPreviousSessionLogs()
      }
      
      // 新セッション用にLocalStorage初期化
      this.clearCurrentSessionLogs()
      
      // セッション開始ログ
      await this.initializeSession()
      
      // カテゴリ別バッファ初期化
      this.options.categories.forEach(category => {
        this.logBuffers.set(category, [])
        this.logCounts.set(category, 0)
      })
      
      // 定期フラッシュ開始
      this.startPeriodicFlush()
      
      // ページ離脱時の強制フラッシュ
      this.setupUnloadHandlers()
      
      this.isInitialized = true
      this.log('system', 'info', '✅ DebugFileLogger fully initialized with auto-export')
      
    } catch (error) {
      console.error('❌ DebugFileLogger initialization failed:', error)
    }
  }
  
  /**
   * 🎬 セッション初期化
   */
  async initializeSession() {
    const sessionInfo = {
      sessionId: this.options.sessionId,
      startTime: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: Date.now(),
      voidCoreVersion: '14.0',
      voidFlowVersion: 'Phase-1'
    }
    
    // セッション開始を全カテゴリに記録
    this.options.categories.forEach(category => {
      this.log(category, 'info', `🎬 Session Start [${category}]`, sessionInfo)
    })
  }
  
  /**
   * 📝 ログ記録
   */
  log(category, level, message, data = null) {
    // 🎚️ カテゴリ有効性チェック
    if (!this.options.enabledCategories.includes(category)) return
    
    // 🔕 接続ログの詳細制御
    if (category === 'connection' && !this.options.verboseConnection) {
      // 詳細な接続ログを抑制
      if (message.includes('からの接続:') || message.includes('→')) return
    }
    
    // ログレベルチェック
    const messageLevel = this.logLevels[level] || 0
    if (messageLevel < this.currentLogLevel) return
    
    const timestamp = Date.now()
    const relativeTime = timestamp - this.sessionStartTime
    
    const logEntry = {
      timestamp: new Date(timestamp).toISOString(),
      relativeTime: relativeTime,
      sessionId: this.options.sessionId,
      category: category,
      level: level,
      message: message,
      data: data,
      stackTrace: level === 'error' ? this.getStackTrace() : null
    }
    
    // コンソール出力
    if (this.options.enableConsoleOutput) {
      this.outputToConsole(logEntry)
    }
    
    // ファイル出力バッファに追加
    if (this.options.enableFileOutput) {
      this.addToBuffer(category, logEntry)
    }
    
    // カウント更新
    const currentCount = this.logCounts.get(category) || 0
    this.logCounts.set(category, currentCount + 1)
  }
  
  /**
   * 🖥️ コンソール出力
   */
  outputToConsole(logEntry) {
    const { level, category, message, relativeTime } = logEntry
    const timeStr = `+${(relativeTime / 1000).toFixed(3)}s`
    const prefix = `[${category}:${level}:${timeStr}]`
    
    switch (level) {
      case 'error':
        console.error(`🔴 ${prefix}`, message, logEntry.data)
        break
      case 'warn':
        console.warn(`🟡 ${prefix}`, message, logEntry.data)
        break
      case 'info':
        console.info(`🔵 ${prefix}`, message, logEntry.data)
        break
      default:
        console.log(`⚪ ${prefix}`, message, logEntry.data)
    }
  }
  
  /**
   * 📦 バッファに追加
   */
  addToBuffer(category, logEntry) {
    if (!this.logBuffers.has(category)) {
      this.logBuffers.set(category, [])
    }
    
    const buffer = this.logBuffers.get(category)
    buffer.push(logEntry)
    
    // バッファサイズ制限（メモリ保護）
    if (buffer.length > 1000) {
      this.flushBuffer(category)
    }
  }
  
  /**
   * 💾 バッファフラッシュ（ファイル出力）
   */
  async flushBuffer(category) {
    const buffer = this.logBuffers.get(category)
    if (!buffer || buffer.length === 0) return
    
    try {
      // ファイル名生成
      const filename = this.generateLogFileName(category)
      
      // ログデータを整形
      const logData = buffer.map(entry => this.formatLogEntry(entry)).join('\n') + '\n'
      
      // ブラウザでのファイル出力（Download API使用）
      await this.downloadLogFile(filename, logData)
      
      // バッファクリア
      this.logBuffers.set(category, [])
      
    } catch (error) {
      console.error(`❌ Failed to flush ${category} logs:`, error)
    }
  }
  
  /**
   * 📄 ログエントリ整形
   */
  formatLogEntry(entry) {
    const { timestamp, relativeTime, level, message, data } = entry
    const timeStr = `+${(relativeTime / 1000).toFixed(3)}s`
    const dataStr = data ? ` | ${JSON.stringify(data)}` : ''
    
    return `[${timestamp}][${timeStr}][${level.toUpperCase()}] ${message}${dataStr}`
  }
  
  /**
   * 💾 ログファイルダウンロード
   */
  async downloadLogFile(filename, content) {
    // 通常は自動ダウンロードしない（LocalStorageに蓄積）
    // F5時のみ自動エクスポートする
    this.saveToLocalStorage(filename, content)
  }
  
  /**
   * 💾 LocalStorageに保存
   */
  saveToLocalStorage(filename, content) {
    try {
      const key = `voidflow-debug-${filename}`
      const existingContent = localStorage.getItem(key) || ''
      const newContent = existingContent + content
      
      // LocalStorage容量制限対策（5MB程度で回転）
      if (newContent.length > 5 * 1024 * 1024) {
        const trimmedContent = newContent.slice(-3 * 1024 * 1024) // 最新3MBを保持
        localStorage.setItem(key, trimmedContent)
      } else {
        localStorage.setItem(key, newContent)
      }
      
    } catch (error) {
      console.warn(`⚠️ Failed to save logs to localStorage: ${error.message}`)
    }
  }
  
  /**
   * 📤 ログエクスポート
   */
  exportLogs(category = null) {
    if (category) {
      this.exportCategoryLogs(category)
    } else {
      // 全カテゴリをエクスポート
      this.options.categories.forEach(cat => {
        this.exportCategoryLogs(cat)
      })
    }
  }
  
  /**
   * 📤 カテゴリ別ログエクスポート
   */
  exportCategoryLogs(category) {
    // まずバッファをフラッシュ
    this.flushBuffer(category)
    
    // LocalStorageから取得
    const key = `voidflow-debug-${this.generateLogFileName(category)}`
    const content = localStorage.getItem(key)
    
    if (content) {
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = this.generateLogFileName(category)
      a.click()
      
      URL.revokeObjectURL(url)
      
      this.log('system', 'info', `📤 Exported ${category} logs`, {
        filename: this.generateLogFileName(category),
        size: content.length
      })
    }
  }
  
  /**
   * 🗑️ ログクリア
   */
  clearLogs(category = null) {
    if (category) {
      this.logBuffers.set(category, [])
      this.logCounts.set(category, 0)
      localStorage.removeItem(`voidflow-debug-${this.generateLogFileName(category)}`)
      this.log('system', 'info', `🗑️ Cleared ${category} logs`)
    } else {
      // 全ログクリア
      this.options.categories.forEach(cat => {
        this.logBuffers.set(cat, [])
        this.logCounts.set(cat, 0)
        localStorage.removeItem(`voidflow-debug-${this.generateLogFileName(cat)}`)
      })
      this.log('system', 'info', '🗑️ Cleared all logs')
    }
  }
  
  /**
   * 📊 ログ統計取得
   */
  getLogStats() {
    const stats = {
      sessionId: this.options.sessionId,
      sessionDuration: Date.now() - this.sessionStartTime,
      categories: {}
    }
    
    this.options.categories.forEach(category => {
      const bufferSize = (this.logBuffers.get(category) || []).length
      const totalCount = this.logCounts.get(category) || 0
      const storageKey = `voidflow-debug-${this.generateLogFileName(category)}`
      const storageSize = (localStorage.getItem(storageKey) || '').length
      
      stats.categories[category] = {
        bufferSize,
        totalCount,
        storageSize: `${(storageSize / 1024).toFixed(2)}KB`
      }
    })
    
    return stats
  }
  
  /**
   * 🔄 定期フラッシュ開始
   */
  startPeriodicFlush() {
    // 30秒ごとにバッファをフラッシュ
    setInterval(() => {
      this.options.categories.forEach(category => {
        const buffer = this.logBuffers.get(category)
        if (buffer && buffer.length > 0) {
          this.flushBuffer(category)
        }
      })
    }, 30000)
  }
  
  /**
   * 🚪 アンロードハンドラー設定
   */
  setupUnloadHandlers() {
    window.addEventListener('beforeunload', () => {
      // 最終フラッシュ
      this.options.categories.forEach(category => {
        this.flushBuffer(category)
      })
    })
    
    window.addEventListener('unload', () => {
      this.log('system', 'info', '🚪 Session End')
    })
  }
  
  /**
   * 🆔 セッションID生成
   */
  generateSessionId() {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    return `${timestamp}-${random}`
  }
  
  /**
   * 📁 ログファイル名生成
   */
  generateLogFileName(category) {
    const date = new Date().toISOString().split('T')[0]
    return `voidflow-${category}-${date}-${this.options.sessionId}.log`
  }
  
  /**
   * 📚 スタックトレース取得
   */
  getStackTrace() {
    try {
      throw new Error()
    } catch (e) {
      return e.stack
    }
  }
  
  /**
   * 🔄 F5時: 前回セッションログ自動エクスポート（無効化）
   */
  async exportPreviousSessionLogs() {
    // F5時の自動エクスポートは無効化
    // ユーザーが明示的にエクスポートボタンを押した時のみ実行
    console.log('🔍 F5 auto-export disabled - use export buttons instead')
    return
  }
  
  /**
   * 🗑️ 現在セッション用にLocalStorageクリア
   */
  clearCurrentSessionLogs() {
    try {
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('voidflow-debug-')) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
      })
      
      if (keysToRemove.length > 0) {
        console.log(`🗑️ Cleared ${keysToRemove.length} previous log entries from localStorage`)
      }
      
    } catch (error) {
      console.warn('⚠️ Failed to clear previous logs:', error)
    }
  }
  
  /**
   * 🎚️ カテゴリの有効/無効を設定
   */
  setCategoryEnabled(category, enabled) {
    if (!this.options.categories.includes(category)) {
      console.warn(`⚠️ Unknown log category: ${category}`)
      return false
    }
    
    if (enabled) {
      // カテゴリを有効化
      if (!this.options.enabledCategories.includes(category)) {
        this.options.enabledCategories.push(category)
        this.log('system', 'info', `🎚️ Log category enabled: ${category}`)
      }
    } else {
      // カテゴリを無効化
      const index = this.options.enabledCategories.indexOf(category)
      if (index > -1) {
        this.options.enabledCategories.splice(index, 1)
        this.log('system', 'info', `🎚️ Log category disabled: ${category}`)
      }
    }
    
    // localStorageに設定を保存
    this.saveLogSettings()
    return true
  }
  
  /**
   * 📝 ログ設定をlocalStorageに保存
   */
  saveLogSettings() {
    try {
      const settings = {
        enabledCategories: this.options.enabledCategories,
        logLevel: this.options.logLevel,
        verboseConnection: this.options.verboseConnection
      }
      localStorage.setItem('charmflow-log-settings', JSON.stringify(settings))
    } catch (error) {
      console.warn('⚠️ Failed to save log settings:', error)
    }
  }
  
  /**
   * 📖 ログ設定をlocalStorageから読み込み
   */
  loadLogSettings() {
    try {
      const stored = localStorage.getItem('charmflow-log-settings')
      if (stored) {
        const settings = JSON.parse(stored)
        if (settings.enabledCategories && Array.isArray(settings.enabledCategories)) {
          this.options.enabledCategories = settings.enabledCategories
        }
        if (settings.logLevel) {
          this.options.logLevel = settings.logLevel
          this.currentLogLevel = this.logLevels[settings.logLevel] || 0
        }
        if (typeof settings.verboseConnection === 'boolean') {
          this.options.verboseConnection = settings.verboseConnection
        }
        this.log('system', 'info', '📖 Log settings loaded from localStorage', settings)
      }
    } catch (error) {
      console.warn('⚠️ Failed to load log settings:', error)
    }
  }
  
  /**
   * 📊 有効カテゴリ一覧を取得
   */
  getEnabledCategories() {
    return [...this.options.enabledCategories]
  }
  
  /**
   * 📋 LocalStorageの全ログ情報を取得
   */
  getAllStoredLogs() {
    const logs = []
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('voidflow-debug-')) {
          // キーから情報抽出: voidflow-debug-voidflow-[category]-[date]-[sessionId].log
          const parts = key.split('-')
          if (parts.length >= 5) {
            const category = parts[3] // connection, ui, system, etc
            const timestamp = new Date().toISOString().split('T')[0]
            
            logs.push({
              key: key,
              category: category,
              timestamp: timestamp,
              size: (localStorage.getItem(key) || '').length
            })
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to scan localStorage:', error)
    }
    
    return logs
  }
  
  /**
   * 💾 ログファイルダウンロード（改良版）
   */
  async downloadLogsAsFile(filename, content) {
    try {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.style.display = 'none'
      
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      URL.revokeObjectURL(url)
      
      console.log(`📁 Downloaded: ${filename} (${(content.length / 1024).toFixed(1)}KB)`)
      
    } catch (error) {
      console.error(`❌ Failed to download ${filename}:`, error)
    }
  }
}

// グローバルインスタンス
export const debugLogger = new DebugFileLogger()

// グローバル関数として公開
window.debugLogger = debugLogger
window.exportDebugLogs = (category) => debugLogger.exportLogs(category)
window.clearDebugLogs = (category) => debugLogger.clearLogs(category)
window.getDebugStats = () => debugLogger.getLogStats()

// F5時自動エクスポート用グローバル関数
window.exportPreviousLogs = () => debugLogger.exportPreviousSessionLogs()
window.clearCurrentLogs = () => debugLogger.clearCurrentSessionLogs()

// ログカテゴリ制御用グローバル関数
window.setCategoryEnabled = (category, enabled) => debugLogger.setCategoryEnabled(category, enabled)
window.getEnabledCategories = () => debugLogger.getEnabledCategories()