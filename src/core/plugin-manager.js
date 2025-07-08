// core/plugin-manager.js - プラグイン管理コアモジュール
// VoidCore v14.0 コア分割: プラグインライフサイクル管理の専門化

/**
 * 🧩 PluginManager - プラグイン管理専門モジュール
 * 
 * 🔧 大工事Phase3完了: 本ファイルは廃止予定
 * ⚠️ 統合完了: UnifiedPluginManagerに機能統合済み
 * 
 * 新しいプラグイン管理:
 * - UnifiedPluginManager (/src/core/unified-plugin-manager.js)
 * - 統一されたプラグインライフサイクル管理
 * - Intent処理統合
 * - 効率的な統計収集
 * 
 * 🚨 DEPRECATED: このファイルは削除予定です
 * 
 * 哲学: 「プラグインライフサイクルの完全制御」
 */
export class PluginManager {
  constructor(config = {}) {
    this.coreId = config.coreId || 'core-plugin-manager';
    this.hierarchyManager = config.hierarchyManager || null;
    this.resourceManager = config.resourceManager || null;
    this.intentHandler = config.intentHandler || null;
    
    // プラグイン管理
    this.plugins = new Map(); // pluginId -> plugin instance
    this.pluginsByType = new Map(); // type -> Set<pluginId>
    this.pluginsByParent = new Map(); // parentId -> Set<pluginId>
    this.pluginRegistry = new Map(); // type -> PluginClass
    
    // プラグインライフサイクル統計
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
    };
    
    // プラグイン操作履歴（最新50件）
    this.operationHistory = [];
    this.maxHistorySize = 50;
    
    // プラグインファクトリー
    this.pluginFactories = new Map(); // type -> factory function
    this.pluginTemplates = new Map(); // templateName -> config
    
    // プラグインイベント
    this.eventHandlers = new Map();
    
    this.log('🧩 PluginManager initialized');
  }

  /**
   * プラグイン作成
   * @param {Object} config - プラグイン設定
   * @returns {Promise<Object>} 作成されたプラグイン
   */
  async createPlugin(config) {
    const startTime = Date.now();
    
    try {
      // 設定検証
      this.validatePluginConfig(config);
      
      // プラグインID生成
      const pluginId = config.id || this.generatePluginId(config.type);
      
      // 既存チェック
      if (this.plugins.has(pluginId)) {
        throw new Error(`Plugin already exists: ${pluginId}`);
      }
      
      // プラグインクラス取得
      const PluginClass = this.getPluginClass(config.type);
      
      // プラグインインスタンス生成
      const plugin = new PluginClass({
        ...config,
        id: pluginId,
        createdAt: Date.now(),
        status: 'active'
      });
      
      // プラグイン登録
      this.registerPluginInstance(plugin);
      
      // 階層管理への登録
      if (this.hierarchyManager && config.parentId) {
        await this.hierarchyManager.addChild(config.parentId, pluginId);
      }
      
      // 統計更新
      this.updateCreationStats(plugin, Date.now() - startTime);
      
      // 履歴記録
      this.recordOperation('create', pluginId, config, Date.now() - startTime);
      
      // イベント発火
      await this.emitEvent('pluginCreated', { plugin, config });
      
      this.log(`✅ Plugin created: ${plugin.displayName} (${pluginId})`);
      
      return plugin;
      
    } catch (error) {
      this.log(`❌ Plugin creation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * プラグイン削除
   * @param {string} pluginId - プラグインID
   * @param {boolean} force - 強制削除フラグ
   * @returns {Promise<boolean>} 削除成功フラグ
   */
  async destroyPlugin(pluginId, force = false) {
    const startTime = Date.now();
    
    try {
      const plugin = this.plugins.get(pluginId);
      if (!plugin) {
        throw new Error(`Plugin not found: ${pluginId}`);
      }
      
      // 依存関係チェック
      if (!force && this.hierarchyManager) {
        const children = await this.hierarchyManager.getChildren(pluginId);
        if (children.length > 0) {
          throw new Error(`Cannot destroy plugin with children: ${children.join(', ')}`);
        }
      }
      
      // 子プラグイン削除（強制時）
      if (force && this.hierarchyManager) {
        const children = await this.hierarchyManager.getChildren(pluginId);
        for (const childId of children) {
          await this.destroyPlugin(childId, true);
        }
      }
      
      // プラグイン終了処理
      if (plugin.destroy && typeof plugin.destroy === 'function') {
        await plugin.destroy();
      }
      
      // 登録解除
      this.unregisterPluginInstance(pluginId);
      
      // 階層管理からの削除
      if (this.hierarchyManager) {
        await this.hierarchyManager.removeChild(plugin.parent, pluginId);
      }
      
      // 統計更新
      this.updateDestroyStats(plugin, Date.now() - startTime);
      
      // 履歴記録
      this.recordOperation('destroy', pluginId, { force }, Date.now() - startTime);
      
      // イベント発火
      await this.emitEvent('pluginDestroyed', { pluginId, plugin, force });
      
      this.log(`✅ Plugin destroyed: ${pluginId}${force ? ' (forced)' : ''}`);
      
      return true;
      
    } catch (error) {
      this.log(`❌ Plugin destruction failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * プラグイン親子関係変更
   * @param {string} childId - 子プラグインID
   * @param {string} newParentId - 新親プラグインID
   * @param {string} oldParentId - 旧親プラグインID
   * @returns {Promise<boolean>} 変更成功フラグ
   */
  async reparentPlugin(childId, newParentId, oldParentId) {
    const startTime = Date.now();
    
    try {
      const plugin = this.plugins.get(childId);
      if (!plugin) {
        throw new Error(`Plugin not found: ${childId}`);
      }
      
      // 階層管理での親子関係変更
      if (this.hierarchyManager) {
        await this.hierarchyManager.reparentPlugin(childId, newParentId, oldParentId);
      }
      
      // プラグイン親情報更新
      plugin.parent = newParentId;
      
      // 親子関係インデックス更新
      this.updateParentChildIndex(childId, newParentId, oldParentId);
      
      // 履歴記録
      this.recordOperation('reparent', childId, { newParentId, oldParentId }, Date.now() - startTime);
      
      // イベント発火
      await this.emitEvent('pluginReparented', { childId, newParentId, oldParentId });
      
      this.log(`✅ Plugin reparented: ${childId} -> ${newParentId}`);
      
      return true;
      
    } catch (error) {
      this.log(`❌ Plugin reparenting failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * プラグイン登録
   * @param {Object} plugin - プラグインインスタンス
   * @returns {Promise<boolean>} 登録成功フラグ
   */
  async registerPlugin(plugin) {
    try {
      if (this.plugins.has(plugin.id)) {
        throw new Error(`Plugin already registered: ${plugin.id}`);
      }
      
      this.registerPluginInstance(plugin);
      
      // イベント発火
      await this.emitEvent('pluginRegistered', { plugin });
      
      this.log(`✅ Plugin registered: ${plugin.displayName} (${plugin.id})`);
      
      return true;
      
    } catch (error) {
      this.log(`❌ Plugin registration failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * プラグイン登録解除
   * @param {string} pluginId - プラグインID
   * @returns {Promise<boolean>} 登録解除成功フラグ
   */
  async unregisterPlugin(pluginId) {
    try {
      const plugin = this.plugins.get(pluginId);
      if (!plugin) {
        throw new Error(`Plugin not found: ${pluginId}`);
      }
      
      this.unregisterPluginInstance(pluginId);
      
      // イベント発火
      await this.emitEvent('pluginUnregistered', { pluginId, plugin });
      
      this.log(`✅ Plugin unregistered: ${pluginId}`);
      
      return true;
      
    } catch (error) {
      this.log(`❌ Plugin unregistration failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Intent処理
   * @param {string} intent - Intent名
   * @param {Object} payload - ペイロード
   * @param {string} correlationId - 相関ID
   * @returns {Promise<Object>} 処理結果
   */
  async handleIntent(intent, payload, correlationId) {
    const targetPluginId = this.extractPluginIdFromIntent(intent);
    
    if (!targetPluginId) {
      throw new Error(`Cannot extract plugin ID from intent: ${intent}`);
    }
    
    const plugin = this.plugins.get(targetPluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${targetPluginId}`);
    }
    
    // プラグインにIntent処理を委譲
    if (plugin.handleIntent && typeof plugin.handleIntent === 'function') {
      return await plugin.handleIntent({ intent, payload, correlationId });
    }
    
    // デフォルト処理
    return {
      status: 'handled',
      pluginId: targetPluginId,
      intent: intent,
      correlationId: correlationId,
      timestamp: Date.now()
    };
  }

  // ==========================================
  // 🔧 プラグイン管理内部メソッド
  // ==========================================

  /**
   * プラグインインスタンス登録
   * @param {Object} plugin - プラグインインスタンス
   */
  registerPluginInstance(plugin) {
    // メインマップに登録
    this.plugins.set(plugin.id, plugin);
    
    // タイプ別インデックス
    if (!this.pluginsByType.has(plugin.type)) {
      this.pluginsByType.set(plugin.type, new Set());
    }
    this.pluginsByType.get(plugin.type).add(plugin.id);
    
    // 親子関係インデックス
    if (plugin.parent) {
      if (!this.pluginsByParent.has(plugin.parent)) {
        this.pluginsByParent.set(plugin.parent, new Set());
      }
      this.pluginsByParent.get(plugin.parent).add(plugin.id);
    }
    
    // 統計更新
    this.stats.totalPlugins++;
    this.stats.activePlugins++;
    
    if (!this.stats.pluginsByType[plugin.type]) {
      this.stats.pluginsByType[plugin.type] = 0;
    }
    this.stats.pluginsByType[plugin.type]++;
  }

  /**
   * プラグインインスタンス登録解除
   * @param {string} pluginId - プラグインID
   */
  unregisterPluginInstance(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;
    
    // メインマップから削除
    this.plugins.delete(pluginId);
    
    // タイプ別インデックスから削除
    if (this.pluginsByType.has(plugin.type)) {
      this.pluginsByType.get(plugin.type).delete(pluginId);
      if (this.pluginsByType.get(plugin.type).size === 0) {
        this.pluginsByType.delete(plugin.type);
      }
    }
    
    // 親子関係インデックスから削除
    if (plugin.parent && this.pluginsByParent.has(plugin.parent)) {
      this.pluginsByParent.get(plugin.parent).delete(pluginId);
      if (this.pluginsByParent.get(plugin.parent).size === 0) {
        this.pluginsByParent.delete(plugin.parent);
      }
    }
    
    // 統計更新
    this.stats.activePlugins--;
    this.stats.destroyedPlugins++;
    
    if (this.stats.pluginsByType[plugin.type]) {
      this.stats.pluginsByType[plugin.type]--;
      if (this.stats.pluginsByType[plugin.type] === 0) {
        delete this.stats.pluginsByType[plugin.type];
      }
    }
  }

  /**
   * プラグインクラス取得
   * @param {string} type - プラグインタイプ
   * @returns {Function} プラグインクラス
   */
  getPluginClass(type) {
    // 登録されたプラグインクラスを検索
    if (this.pluginRegistry.has(type)) {
      return this.pluginRegistry.get(type);
    }
    
    // ファクトリーを検索
    if (this.pluginFactories.has(type)) {
      return this.pluginFactories.get(type);
    }
    
    // デフォルトプラグインクラスを使用
    return this.getDefaultPluginClass();
  }

  /**
   * デフォルトプラグインクラス取得
   * @returns {Function} デフォルトプラグインクラス
   */
  getDefaultPluginClass() {
    // IPluginクラスを動的にインポート
    return class DefaultPlugin {
      constructor(config) {
        this.id = config.id;
        this.type = config.type;
        this.displayName = config.displayName || this.type;
        this.parent = config.parent;
        this.status = config.status || 'active';
        this.createdAt = config.createdAt || Date.now();
        this.metadata = config.metadata || {};
      }
      
      async destroy() {
        this.status = 'destroyed';
      }
    };
  }

  /**
   * プラグインID生成
   * @param {string} type - プラグインタイプ
   * @returns {string} プラグインID
   */
  generatePluginId(type) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6);
    return `${type}-${timestamp}-${random}`;
  }

  /**
   * プラグイン設定検証
   * @param {Object} config - プラグイン設定
   */
  validatePluginConfig(config) {
    if (!config) {
      throw new Error('Plugin config is required');
    }
    
    if (!config.type) {
      throw new Error('Plugin type is required');
    }
    
    if (typeof config.type !== 'string') {
      throw new Error('Plugin type must be a string');
    }
    
    if (config.type.trim() === '') {
      throw new Error('Plugin type cannot be empty');
    }
  }

  /**
   * Intent からプラグインID抽出
   * @param {string} intent - Intent名
   * @returns {string|null} プラグインID
   */
  extractPluginIdFromIntent(intent) {
    // intent形式: "plugin.{pluginId}.{action}"
    const match = intent.match(/^plugin\.([^.]+)\./);
    return match ? match[1] : null;
  }

  /**
   * 親子関係インデックス更新
   * @param {string} childId - 子プラグインID
   * @param {string} newParentId - 新親プラグインID
   * @param {string} oldParentId - 旧親プラグインID
   */
  updateParentChildIndex(childId, newParentId, oldParentId) {
    // 旧親から削除
    if (oldParentId && this.pluginsByParent.has(oldParentId)) {
      this.pluginsByParent.get(oldParentId).delete(childId);
      if (this.pluginsByParent.get(oldParentId).size === 0) {
        this.pluginsByParent.delete(oldParentId);
      }
    }
    
    // 新親に追加
    if (newParentId) {
      if (!this.pluginsByParent.has(newParentId)) {
        this.pluginsByParent.set(newParentId, new Set());
      }
      this.pluginsByParent.get(newParentId).add(childId);
    }
  }

  // ==========================================
  // 📊 統計・情報取得
  // ==========================================

  /**
   * プラグイン取得
   * @param {string} pluginId - プラグインID
   * @returns {Object|null} プラグインインスタンス
   */
  getPlugin(pluginId) {
    return this.plugins.get(pluginId) || null;
  }

  /**
   * タイプ別プラグイン取得
   * @param {string} type - プラグインタイプ
   * @returns {Array} プラグインインスタンス配列
   */
  getPluginsByType(type) {
    const pluginIds = this.pluginsByType.get(type) || new Set();
    return Array.from(pluginIds).map(id => this.plugins.get(id)).filter(p => p);
  }

  /**
   * 子プラグイン取得
   * @param {string} parentId - 親プラグインID
   * @returns {Array} 子プラグインインスタンス配列
   */
  getChildren(parentId) {
    const childIds = this.pluginsByParent.get(parentId) || new Set();
    return Array.from(childIds).map(id => this.plugins.get(id)).filter(p => p);
  }

  /**
   * 全プラグイン取得
   * @returns {Array} 全プラグインインスタンス配列
   */
  getAllPlugins() {
    return Array.from(this.plugins.values());
  }

  /**
   * プラグイン統計取得
   * @returns {Object} プラグイン統計
   */
  getStats() {
    const runtime = Date.now() - this.stats.startTime;
    
    return {
      ...this.stats,
      runtime: runtime,
      creationRate: this.stats.createdPlugins / (runtime / 1000),
      destructionRate: this.stats.destroyedPluginCount / (runtime / 1000),
      averageLifecycleTime: this.stats.createdPlugins > 0 ? 
        this.stats.totalLifecycleTime / this.stats.createdPlugins : 0
    };
  }

  /**
   * 操作履歴取得
   * @param {number} limit - 取得件数制限
   * @returns {Array} 操作履歴
   */
  getOperationHistory(limit = 10) {
    return this.operationHistory.slice(-limit);
  }

  // ==========================================
  // 🔧 統計・履歴更新
  // ==========================================

  /**
   * 作成統計更新
   * @param {Object} plugin - プラグインインスタンス
   * @param {number} creationTime - 作成時間
   */
  updateCreationStats(plugin, creationTime) {
    this.stats.createdPlugins++;
    this.stats.totalLifecycleTime += creationTime;
  }

  /**
   * 削除統計更新
   * @param {Object} plugin - プラグインインスタンス
   * @param {number} destructionTime - 削除時間
   */
  updateDestroyStats(plugin, destructionTime) {
    this.stats.destroyedPluginCount++;
    this.stats.totalLifecycleTime += destructionTime;
  }

  /**
   * 操作履歴記録
   * @param {string} operation - 操作名
   * @param {string} pluginId - プラグインID
   * @param {Object} payload - ペイロード
   * @param {number} executionTime - 実行時間
   */
  recordOperation(operation, pluginId, payload, executionTime) {
    const record = {
      timestamp: Date.now(),
      operation: operation,
      pluginId: pluginId,
      payload: payload,
      executionTime: executionTime
    };
    
    this.operationHistory.push(record);
    
    // 履歴サイズ制限
    if (this.operationHistory.length > this.maxHistorySize) {
      this.operationHistory.shift();
    }
  }

  // ==========================================
  // 📡 イベント管理
  // ==========================================

  /**
   * イベントハンドラー登録
   * @param {string} eventName - イベント名
   * @param {Function} handler - ハンドラー関数
   */
  on(eventName, handler) {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, new Set());
    }
    this.eventHandlers.get(eventName).add(handler);
  }

  /**
   * イベント発火
   * @param {string} eventName - イベント名
   * @param {Object} eventData - イベントデータ
   */
  async emitEvent(eventName, eventData) {
    const handlers = this.eventHandlers.get(eventName);
    if (!handlers) return;
    
    for (const handler of handlers) {
      try {
        await handler(eventData);
      } catch (error) {
        this.log(`❌ Event handler error: ${error.message}`);
      }
    }
  }

  // ==========================================
  // 🔧 プラグインファクトリー・テンプレート
  // ==========================================

  /**
   * プラグインクラス登録
   * @param {string} type - プラグインタイプ
   * @param {Function} PluginClass - プラグインクラス
   */
  registerPluginClass(type, PluginClass) {
    this.pluginRegistry.set(type, PluginClass);
    this.log(`📋 Plugin class registered: ${type}`);
  }

  /**
   * プラグインファクトリー登録
   * @param {string} type - プラグインタイプ
   * @param {Function} factory - ファクトリー関数
   */
  registerPluginFactory(type, factory) {
    this.pluginFactories.set(type, factory);
    this.log(`🏭 Plugin factory registered: ${type}`);
  }

  /**
   * プラグインテンプレート登録
   * @param {string} templateName - テンプレート名
   * @param {Object} template - テンプレート設定
   */
  registerPluginTemplate(templateName, template) {
    this.pluginTemplates.set(templateName, template);
    this.log(`📋 Plugin template registered: ${templateName}`);
  }

  /**
   * モジュール連携設定
   * @param {Object} managers - 各種マネージャー
   */
  setManagers(managers) {
    if (managers.hierarchyManager) {
      this.hierarchyManager = managers.hierarchyManager;
      this.log('🔧 HierarchyManager connected');
    }
    
    if (managers.resourceManager) {
      this.resourceManager = managers.resourceManager;
      this.log('🔧 ResourceManager connected');
    }
    
    if (managers.intentHandler) {
      this.intentHandler = managers.intentHandler;
      this.log('🔧 IntentHandler connected');
    }
  }

  /**
   * ログ出力
   * @param {string} message - ログメッセージ
   */
  log(message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] 🧩 PluginManager: ${message}`);
  }
}

/**
 * PluginManager ファクトリー
 * @param {Object} config - 設定
 * @returns {PluginManager} PluginManager インスタンス
 */
export function createPluginManager(config = {}) {
  return new PluginManager(config);
}

// デフォルトエクスポート
export default PluginManager;