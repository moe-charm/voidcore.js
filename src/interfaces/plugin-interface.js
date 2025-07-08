// plugin-interface.js - ChatGPT提案の統一プラグインインターフェース
// Phase R: VoidCoreアーキテクチャリファクタリング

/**
 * 🧩 IPlugin - 基本となるプラグインのインターフェース
 * 
 * ChatGPT提案の要件:
 * - 明確なプロパティ構造（ID・型・親）
 * - isCore フラグで簡単判定
 * - handleMessage() の統一入口
 */
export class IPlugin {
  constructor(config) {
    this.id = config.id || `plugin_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    this.pluginId = this.id  // VoidCore互換性のため
    this.type = config.type || 'generic'
    this.parent = config.parent || null
    this.isCore = config.isCore || false
    
    // Phase R追加プロパティ
    this.displayName = config.displayName || this.type
    this.metadata = config.metadata || {}
    this.createdAt = Date.now()
    this.status = 'active' // 'active' | 'inactive' | 'destroyed'
  }

  /**
   * 統一メッセージハンドラー - すべての挙動がここに集約
   * @param {Object} message - IMessage形式のメッセージ
   * @returns {Promise<void>}
   */
  async handleMessage(message) {
    // デフォルト実装：Intentメッセージのルーティング
    if (message.category === 'IntentRequest' && message.intent) {
      return await this.handleIntent(message)
    }
    
    // 通常のメッセージ処理
    return await this.processMessage(message)
  }

  /**
   * Intent処理の統一エントリポイント
   * @param {Object} message - Intent付きメッセージ
   * @returns {Promise<void>}
   */
  async handleIntent(message) {
    const { intent, payload } = message
    
    switch (intent) {
      case 'plugin.getInfo':
        return await this.handleGetInfo(message)
      case 'plugin.updateConfig':
        return await this.handleUpdateConfig(message)
      case 'plugin.destroy':
        return await this.handleDestroy(message)
      default:
        // サブクラスでの実装を想定
        return await this.handleCustomIntent(message)
    }
  }

  /**
   * カスタムIntent処理（サブクラスでオーバーライド）
   * @param {Object} message - Intent付きメッセージ
   * @returns {Promise<void>}
   */
  async handleCustomIntent(message) {
    console.warn(`Unhandled intent: ${message.intent} in plugin: ${this.id}`)
  }

  /**
   * 通常のメッセージ処理（サブクラスでオーバーライド）
   * @param {Object} message - 通常メッセージ
   * @returns {Promise<void>}
   */
  async processMessage(message) {
    // デフォルト実装：ログ出力のみ
    console.log(`Plugin ${this.id} received message: ${message.type}`)
  }

  // ==========================================
  // 標準Intent実装
  // ==========================================

  async handleGetInfo(message) {
    const info = {
      id: this.id,
      type: this.type,
      parent: this.parent,
      isCore: this.isCore,
      displayName: this.displayName,
      metadata: this.metadata,
      createdAt: this.createdAt,
      status: this.status
    }
    
    // 応答メッセージを送信（実装は後で）
    console.log(`Plugin info for ${this.id}:`, info)
    return info
  }

  async handleUpdateConfig(message) {
    const { config } = message.payload
    if (config) {
      Object.assign(this.metadata, config)
      console.log(`Plugin ${this.id} config updated`)
    }
  }

  async handleDestroy(message) {
    this.status = 'destroyed'
    console.log(`Plugin ${this.id} destroyed`)
  }

  // ==========================================
  // ユーティリティメソッド
  // ==========================================

  /**
   * プラグインがコアかどうかの判定
   * @returns {boolean}
   */
  isCorePlugin() {
    return this.isCore === true
  }

  /**
   * プラグイン情報の要約取得
   * @returns {Object}
   */
  getSummary() {
    return {
      id: this.id,
      type: this.type,
      displayName: this.displayName,
      isCore: this.isCore,
      parent: this.parent,
      status: this.status
    }
  }

  /**
   * ログ出力ヘルパー
   * @param {string} message - ログメッセージ
   */
  log(message) {
    const timestamp = new Date().toLocaleTimeString()
    const prefix = this.isCore ? '🔷 Core' : '🧩 Plugin'
    console.log(`[${timestamp}] ${prefix} ${this.displayName}: ${message}`)
  }
}

/**
 * プラグイン型判定ユーティリティ
 * @param {Object} plugin - 判定対象プラグイン
 * @returns {boolean}
 */
export function isCorePlugin(plugin) {
  return plugin && plugin.isCore === true
}

// デフォルトエクスポート
export default IPlugin