/**
 * 🌟 UnifiedPluginManager - 統一プラグイン管理システム
 * 
 * 🔧 大工事Phase3: プラグイン管理統合完了版
 * 
 * 🎯 統合対象:
 * - VoidCoreBase.registerPlugin() 
 * - VoidCore._handleCreatePluginIntent()
 * - PluginManager クラス全体
 * 
 * 🚀 設計思想:
 * - 単一責任原則遵守
 * - 統一されたプラグインライフサイクル管理
 * - 効率的な統計収集
 * 
 * Created: 2025-07-08 (大工事Phase3)
 */

import { IPlugin } from '../interfaces/plugin-interface.js'
import { VoidCore } from './voidcore.js'

export class UnifiedPluginManager {
  constructor(config = {}) {
    this.coreId = config.coreId || 'unified-plugin-manager'
    this.core = config.core || null
    
    // 🎯 統一プラグイン管理
    this.plugins = new Map() // pluginId -> plugin instance
    this.pluginsByType = new Map() // type -> Set<pluginId>
    this.pluginsByParent = new Map() // parentId -> Set<pluginId>
    this.pluginRegistry = new Map() // type -> PluginClass
    
    // 🔧 統一統計システム
    this.stats = {
      totalPlugins: 0,
      activePlugins: 0,
      inactivePlugins: 0,
      destroyedPlugins: 0,
      pluginsByType: {},
      createdPlugins: 0,
      destroyedPluginCount: 0,
      totalLifecycleTime: 0,
      startTime: Date.now()
    }
    
    // 🌟 統一操作履歴
    this.operationHistory = []
    this.maxHistorySize = 100
    
    // 🚀 統一プラグインファクトリー
    this.pluginFactories = new Map()
    this.pluginTemplates = new Map()
    
    this.log('🌟 UnifiedPluginManager initialized')
  }

  // ==========================================
  // 統一プラグイン登録システム
  // ==========================================

  /**
   * 統一プラグイン登録
   * @param {IPlugin|Object} plugin - プラグインインスタンス
   * @returns {Promise<boolean>} 登録成功・失敗
   */
  async registerPlugin(plugin) {
    const startTime = Date.now()
    
    try {
      // 🔧 統一バリデーション
      if (!this.validatePlugin(plugin)) {
        return false
      }
      
      // 🎯 重複チェック
      if (this.plugins.has(plugin.id)) {
        this.log(`⚠️ Plugin ${plugin.id} already registered`)
        return false
      }
      
      // 🌟 プラグイン登録実行
      plugin.core = this.core
      this.plugins.set(plugin.id, plugin)
      
      // 🔧 型別管理
      this.addToTypeMap(plugin)
      
      // 🚀 親子関係管理
      this.addToParentMap(plugin)
      
      // 📊 統計更新
      this.updateRegistrationStats(plugin, startTime)
      
      // 📋 履歴記録
      this.recordOperation('register', plugin.id, { 
        type: plugin.type,
        executionTime: Date.now() - startTime
      })
      
      this.log(`🔌 Plugin registered: ${plugin.id}`)
      return true
      
    } catch (error) {
      this.log(`❌ Plugin registration failed: ${error.message}`)
      return false
    }
  }

  /**
   * 統一プラグイン削除
   * @param {string} pluginId - プラグインID
   * @returns {Promise<boolean>} 削除成功・失敗
   */
  async unregisterPlugin(pluginId) {
    const startTime = Date.now()
    
    try {
      const plugin = this.plugins.get(pluginId)
      if (!plugin) {
        this.log(`⚠️ Plugin not found: ${pluginId}`)
        return false
      }
      
      // 🔧 プラグイン削除実行
      plugin.core = null
      this.plugins.delete(pluginId)
      
      // 🎯 型別管理削除
      this.removeFromTypeMap(plugin)
      
      // 🌟 親子関係削除
      this.removeFromParentMap(plugin)
      
      // 📊 統計更新
      this.updateUnregistrationStats(plugin, startTime)
      
      // 📋 履歴記録
      this.recordOperation('unregister', pluginId, {
        type: plugin.type,
        executionTime: Date.now() - startTime
      })
      
      this.log(`🗑️ Plugin unregistered: ${pluginId}`)
      return true
      
    } catch (error) {
      this.log(`❌ Plugin unregistration failed: ${error.message}`)
      return false
    }
  }

  // ==========================================
  // 統一Intent処理システム
  // ==========================================

  /**
   * 統一プラグイン作成Intent
   * @param {Object} payload - Intent ペイロード
   * @returns {Promise<Object>} 作成結果
   */
  async handleCreatePluginIntent(payload) {
    const startTime = Date.now()
    
    try {
      const { type, config = {} } = payload
      
      // 🔧 プラグインファクトリー取得
      const factory = this.pluginFactories.get(type)
      if (!factory) {
        this.log(`⚠️ Plugin factory not found: ${type}`)
        return { status: 'failed', error: `Unknown plugin type: ${type}` }
      }
      
      // 🎯 プラグインインスタンス作成
      const pluginId = `plugin_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
      const plugin = await factory({ ...config, id: pluginId, type })
      
      // 🌟 統一登録
      const registered = await this.registerPlugin(plugin)
      
      if (registered) {
        this.log(`🔧 Plugin created via Intent: ${pluginId}`)
        return { 
          status: 'created', 
          pluginId,
          executionTime: Date.now() - startTime
        }
      } else {
        return { status: 'failed', error: 'Registration failed' }
      }
      
    } catch (error) {
      this.log(`❌ Plugin creation failed: ${error.message}`)
      return { status: 'failed', error: error.message }
    }
  }

  /**
   * 統一プラグイン削除Intent
   * @param {Object} payload - Intent ペイロード
   * @returns {Promise<Object>} 削除結果
   */
  async handleDestroyPluginIntent(payload) {
    const startTime = Date.now()
    
    try {
      const { pluginId } = payload
      
      // 🔧 統一削除
      const unregistered = await this.unregisterPlugin(pluginId)
      
      if (unregistered) {
        this.log(`🔧 Plugin destroyed via Intent: ${pluginId}`)
        return { 
          status: 'destroyed', 
          pluginId,
          executionTime: Date.now() - startTime
        }
      } else {
        return { status: 'failed', error: 'Plugin not found' }
      }
      
    } catch (error) {
      this.log(`❌ Plugin destruction failed: ${error.message}`)
      return { status: 'failed', error: error.message }
    }
  }

  // ==========================================
  // 統一プラグイン取得システム
  // ==========================================

  /**
   * プラグイン取得
   * @param {string} pluginId - プラグインID
   * @returns {IPlugin|null} プラグインインスタンス
   */
  getPlugin(pluginId) {
    return this.plugins.get(pluginId) || null
  }

  /**
   * 全プラグイン取得
   * @returns {Array<IPlugin>} 全プラグイン配列
   */
  getAllPlugins() {
    return Array.from(this.plugins.values())
  }

  /**
   * 型別プラグイン取得
   * @param {string} type - プラグイン型
   * @returns {Array<IPlugin>} 型別プラグイン配列
   */
  getPluginsByType(type) {
    const pluginIds = this.pluginsByType.get(type) || new Set()
    return Array.from(pluginIds).map(id => this.plugins.get(id)).filter(Boolean)
  }

  /**
   * 親別プラグイン取得
   * @param {string} parentId - 親ID
   * @returns {Array<IPlugin>} 親別プラグイン配列
   */
  getPluginsByParent(parentId) {
    const pluginIds = this.pluginsByParent.get(parentId) || new Set()
    return Array.from(pluginIds).map(id => this.plugins.get(id)).filter(Boolean)
  }

  /**
   * プラグイン数取得
   * @returns {number} プラグイン総数
   */
  getPluginCount() {
    return this.plugins.size
  }

  // ==========================================
  // 統一統計システム
  // ==========================================

  /**
   * 統一統計取得
   * @returns {Object} 統計情報
   */
  getStats() {
    return {
      ...this.stats,
      runtime: Date.now() - this.stats.startTime,
      pluginsByType: this.getTypeDistribution(),
      recentOperations: this.operationHistory.slice(-10)
    }
  }

  /**
   * 型分布取得
   * @returns {Object} 型別プラグイン数
   */
  getTypeDistribution() {
    const distribution = {}
    for (const [type, pluginIds] of this.pluginsByType) {
      distribution[type] = pluginIds.size
    }
    return distribution
  }

  // ==========================================
  // 統一プラグインファクトリー管理
  // ==========================================

  /**
   * プラグインファクトリー登録
   * @param {string} type - プラグイン型
   * @param {Function} factory - ファクトリー関数
   */
  registerPluginFactory(type, factory) {
    this.pluginFactories.set(type, factory)
    this.log(`🏭 Plugin factory registered: ${type}`)
  }

  /**
   * プラグインテンプレート登録
   * @param {string} templateName - テンプレート名
   * @param {Object} template - テンプレート設定
   */
  registerPluginTemplate(templateName, template) {
    this.pluginTemplates.set(templateName, template)
    this.log(`📋 Plugin template registered: ${templateName}`)
  }

  // ==========================================
  // 内部ヘルパーメソッド
  // ==========================================

  /**
   * プラグインバリデーション
   * @param {any} plugin - 検証対象
   * @returns {boolean} バリデーション結果
   */
  validatePlugin(plugin) {
    if (!plugin || typeof plugin !== 'object') {
      this.log('❌ Invalid plugin: must be an object')
      return false
    }

    if (!plugin.id || typeof plugin.id !== 'string') {
      this.log('❌ Invalid plugin: missing id')
      return false
    }

    if (!plugin.type || typeof plugin.type !== 'string') {
      this.log('❌ Invalid plugin: missing type')
      return false
    }

    // 🔧 大工事Phase1対応: IPlugin統一インターフェース
    if (!(plugin instanceof IPlugin) && !plugin.receiveMessage) {
      this.log('❌ Invalid plugin: must implement IPlugin interface')
      return false
    }

    return true
  }

  /**
   * 型別管理追加
   * @param {IPlugin} plugin - プラグインインスタンス
   */
  addToTypeMap(plugin) {
    if (!this.pluginsByType.has(plugin.type)) {
      this.pluginsByType.set(plugin.type, new Set())
    }
    this.pluginsByType.get(plugin.type).add(plugin.id)
  }

  /**
   * 型別管理削除
   * @param {IPlugin} plugin - プラグインインスタンス
   */
  removeFromTypeMap(plugin) {
    const typeSet = this.pluginsByType.get(plugin.type)
    if (typeSet) {
      typeSet.delete(plugin.id)
      if (typeSet.size === 0) {
        this.pluginsByType.delete(plugin.type)
      }
    }
  }

  /**
   * 親子関係追加
   * @param {IPlugin} plugin - プラグインインスタンス
   */
  addToParentMap(plugin) {
    if (plugin.parent) {
      if (!this.pluginsByParent.has(plugin.parent)) {
        this.pluginsByParent.set(plugin.parent, new Set())
      }
      this.pluginsByParent.get(plugin.parent).add(plugin.id)
    }
  }

  /**
   * 親子関係削除
   * @param {IPlugin} plugin - プラグインインスタンス
   */
  removeFromParentMap(plugin) {
    if (plugin.parent) {
      const parentSet = this.pluginsByParent.get(plugin.parent)
      if (parentSet) {
        parentSet.delete(plugin.id)
        if (parentSet.size === 0) {
          this.pluginsByParent.delete(plugin.parent)
        }
      }
    }
  }

  /**
   * 登録統計更新
   * @param {IPlugin} plugin - プラグインインスタンス
   * @param {number} startTime - 開始時間
   */
  updateRegistrationStats(plugin, startTime) {
    this.stats.totalPlugins++
    this.stats.activePlugins++
    this.stats.createdPlugins++
    this.stats.totalLifecycleTime += Date.now() - startTime
    
    if (!this.stats.pluginsByType[plugin.type]) {
      this.stats.pluginsByType[plugin.type] = 0
    }
    this.stats.pluginsByType[plugin.type]++
  }

  /**
   * 削除統計更新
   * @param {IPlugin} plugin - プラグインインスタンス
   * @param {number} startTime - 開始時間
   */
  updateUnregistrationStats(plugin, startTime) {
    this.stats.activePlugins--
    this.stats.destroyedPlugins++
    this.stats.destroyedPluginCount++
    this.stats.totalLifecycleTime += Date.now() - startTime
    
    if (this.stats.pluginsByType[plugin.type]) {
      this.stats.pluginsByType[plugin.type]--
    }
  }

  /**
   * 操作履歴記録
   * @param {string} operation - 操作種別
   * @param {string} pluginId - プラグインID
   * @param {Object} details - 詳細情報
   */
  recordOperation(operation, pluginId, details) {
    this.operationHistory.push({
      timestamp: Date.now(),
      operation,
      pluginId,
      details
    })
    
    // 履歴サイズ制限
    if (this.operationHistory.length > this.maxHistorySize) {
      this.operationHistory.shift()
    }
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
    // 全プラグイン削除
    const pluginIds = Array.from(this.plugins.keys())
    for (const pluginId of pluginIds) {
      await this.unregisterPlugin(pluginId)
    }
    
    // 管理データクリア
    this.plugins.clear()
    this.pluginsByType.clear()
    this.pluginsByParent.clear()
    this.pluginFactories.clear()
    this.pluginTemplates.clear()
    this.operationHistory = []
    
    // 統計リセット
    this.stats = {
      totalPlugins: 0,
      activePlugins: 0,
      inactivePlugins: 0,
      destroyedPlugins: 0,
      pluginsByType: {},
      createdPlugins: 0,
      destroyedPluginCount: 0,
      totalLifecycleTime: 0,
      startTime: Date.now()
    }
    
    this.log('🧹 UnifiedPluginManager cleared')
  }
}

export default UnifiedPluginManager