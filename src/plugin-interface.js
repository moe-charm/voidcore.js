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
 * 🔷 ICorePlugin - コアプラグインのインターフェース
 * 
 * ChatGPT提案の要件:
 * - isCore: true フラグで型レベル区別
 * - 特権的なメソッド（構造管理・ルーティング）
 */
export class ICorePlugin extends IPlugin {
  constructor(config) {
    super({
      ...config,
      isCore: true // コアプラグインは必ずisCore=true
    })
    
    // コア専用プロパティ
    this.children = new Set() // 管理する子プラグインのID
    this.routingTable = new Map() // メッセージルーティング情報
  }

  /**
   * カスタムIntent処理（コア専用機能追加）
   * @param {Object} message - Intent付きメッセージ
   * @returns {Promise<void>}
   */
  async handleCustomIntent(message) {
    const { intent } = message
    
    switch (intent) {
      case 'system.createPlugin':
        return await this.handleCreatePlugin(message)
      case 'system.reparentPlugin':
        return await this.handleReparentPlugin(message)
      case 'system.destroyPlugin':
        return await this.handleDestroyPlugin(message)
      case 'system.routeMessage':
        return await this.handleRouteMessage(message)
      default:
        return await super.handleCustomIntent(message)
    }
  }

  // ==========================================
  // コア専用Intent実装
  // ==========================================

  /**
   * プラグイン生成処理
   * @param {Object} message - createPlugin Intent
   * @returns {Promise<void>}
   */
  async handleCreatePlugin(message) {
    const { type, config, parentId } = message.payload
    
    // プラグイン生成ロジック（実装は後で詳細化）
    const newPlugin = new IPlugin({
      type: type,
      parent: parentId || this.id,
      ...config
    })
    
    this.children.add(newPlugin.id)
    this.log(`Created plugin: ${newPlugin.displayName} (${newPlugin.id})`)
    
    return newPlugin
  }

  /**
   * プラグイン親子関係変更処理（戸籍異動届）
   * @param {Object} message - reparentPlugin Intent
   * @returns {Promise<void>}
   */
  async handleReparentPlugin(message) {
    const { childId, newParentId } = message.payload
    
    // 親子関係変更ロジック（実装は後で詳細化）
    this.log(`Reparenting plugin ${childId} to ${newParentId}`)
    
    // 旧親から削除
    this.children.delete(childId)
    
    // 新親に追加（実装は後で）
    // newParent.children.add(childId)
  }

  /**
   * プラグイン削除処理
   * @param {Object} message - destroyPlugin Intent
   * @returns {Promise<void>}
   */
  async handleDestroyPlugin(message) {
    const { pluginId } = message.payload
    
    this.children.delete(pluginId)
    this.log(`Destroyed plugin: ${pluginId}`)
  }

  /**
   * メッセージルーティング処理
   * @param {Object} message - routeMessage Intent
   * @returns {Promise<void>}
   */
  async handleRouteMessage(message) {
    const { targetId, routedMessage } = message.payload
    
    // ルーティングロジック（実装は後で詳細化）
    this.log(`Routing message to ${targetId}: ${routedMessage.type}`)
  }

  // ==========================================
  // コア専用メソッド
  // ==========================================

  /**
   * 子プラグイン一覧取得
   * @returns {Array} 子プラグインIDの配列
   */
  getChildren() {
    return Array.from(this.children)
  }

  /**
   * 管理中のプラグイン数取得
   * @returns {number}
   */
  getChildCount() {
    return this.children.size
  }

  /**
   * ルーティングテーブル追加
   * @param {string} pattern - メッセージパターン
   * @param {string} targetId - 転送先プラグインID
   */
  addRoute(pattern, targetId) {
    this.routingTable.set(pattern, targetId)
    this.log(`Added route: ${pattern} -> ${targetId}`)
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

/**
 * プラグインファクトリー
 * @param {Object} config - プラグイン設定
 * @returns {IPlugin|ICorePlugin}
 */
export function createPlugin(config) {
  if (config.isCore) {
    return new ICorePlugin(config)
  } else {
    return new IPlugin(config)
  }
}

// デフォルトエクスポート
export default IPlugin