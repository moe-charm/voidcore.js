// ICorePlugin - レガシー実装（Phase R時代の設計）
// 注意: 現在のVoidCore統合アーキテクチャでは使用非推奨
// VoidFlowなど旧システムとの互換性のため保存

import { IPlugin } from '../plugin-interface.js'

/**
 * 🔷 ICorePlugin - コアプラグインのインターフェース
 * 
 * レガシー設計:
 * - isCore: true フラグで型レベル区別
 * - 特権的なメソッド（構造管理・ルーティング）
 * 
 * 現在の推奨: VoidCoreを直接継承
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
 * プラグインファクトリー（レガシー版）
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