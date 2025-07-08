// core/intent-handler.js - Intent処理コアモジュール
// VoidCore v14.0 コア分割: Intent処理の専門化

/**
 * 🎯 IntentHandler - Intent処理専門モジュール
 * 
 * 🔧 大工事Phase3完了: 本ファイルは廃止予定
 * ⚠️ 統合完了: UnifiedIntentHandlerに機能統合済み
 * 
 * 新しいIntent処理:
 * - UnifiedIntentHandler (/src/core/unified-intent-handler.js)
 * - 統一されたIntent処理フロー
 * - 効率的な並行処理制御
 * - 統一された統計収集
 * 
 * 🚨 DEPRECATED: このファイルは削除予定です
 * 
 * 哲学: 「Intent処理の統一と効率化」
 */
export class IntentHandler {
  constructor(config = {}) {
    this.coreId = config.coreId || 'core-intent-handler';
    this.pluginManager = config.pluginManager || null;
    this.hierarchyManager = config.hierarchyManager || null;
    this.resourceManager = config.resourceManager || null;
    
    // Intent処理統計
    this.stats = {
      totalIntents: 0,
      systemIntents: 0,
      pluginIntents: 0,
      customIntents: 0,
      successfulIntents: 0,
      failedIntents: 0,
      totalProcessingTime: 0,
      startTime: Date.now()
    };
    
    // Intent処理履歴（最新100件）
    this.intentHistory = [];
    this.maxHistorySize = 100;
    
    // Intent処理ルール
    this.intentRules = new Map();
    this.middleware = [];
    
    // 並行処理制御
    this.pendingIntents = new Map(); // correlationId -> Promise
    this.maxConcurrentIntents = config.maxConcurrentIntents || 50;
    
    this.log('🎯 IntentHandler initialized');
  }

  /**
   * Intent処理メイン関数
   * @param {Object} intentMessage - Intent メッセージ
   * @returns {Promise<Object>} 処理結果
   */
  async processIntent(intentMessage) {
    const startTime = Date.now();
    const correlationId = this.generateCorrelationId();
    
    try {
      // バリデーション
      this.validateIntentMessage(intentMessage);
      
      // 統計更新
      this.stats.totalIntents++;
      
      // 並行処理制御
      if (this.pendingIntents.size >= this.maxConcurrentIntents) {
        throw new Error(`Maximum concurrent intents exceeded: ${this.maxConcurrentIntents}`);
      }
      
      // Intent処理Promise作成
      const processingPromise = this._executeIntent(intentMessage, correlationId);
      this.pendingIntents.set(correlationId, processingPromise);
      
      // Intent実行
      const result = await processingPromise;
      
      // 成功統計更新
      this.stats.successfulIntents++;
      const processingTime = Date.now() - startTime;
      this.updateProcessingStats(processingTime, true);
      
      // 履歴記録
      this.recordIntentHistory(intentMessage, result, processingTime, 'success');
      
      return result;
      
    } catch (error) {
      // 失敗統計更新
      this.stats.failedIntents++;
      const processingTime = Date.now() - startTime;
      this.updateProcessingStats(processingTime, false);
      
      // 履歴記録
      this.recordIntentHistory(intentMessage, null, processingTime, 'error', error.message);
      
      this.log(`❌ Intent processing failed: ${intentMessage.intent} - ${error.message}`);
      throw error;
      
    } finally {
      // クリーンアップ
      this.pendingIntents.delete(correlationId);
    }
  }

  /**
   * Intent実行
   * @param {Object} intentMessage - Intent メッセージ
   * @param {string} correlationId - 相関ID
   * @returns {Promise<Object>} 処理結果
   */
  async _executeIntent(intentMessage, correlationId) {
    const { intent, payload } = intentMessage;
    
    // ミドルウェア前処理
    let processedPayload = payload;
    for (const middleware of this.middleware) {
      if (middleware.preProcess) {
        processedPayload = await middleware.preProcess(processedPayload, intent, correlationId);
      }
    }
    
    // Intent種別判定・処理
    let result;
    if (intent.startsWith('system.')) {
      result = await this.handleSystemIntent(intent, processedPayload, correlationId);
      this.stats.systemIntents++;
    } else if (intent.startsWith('plugin.')) {
      result = await this.handlePluginIntent(intent, processedPayload, correlationId);
      this.stats.pluginIntents++;
    } else {
      result = await this.handleCustomIntent(intent, processedPayload, correlationId);
      this.stats.customIntents++;
    }
    
    // ミドルウェア後処理
    for (const middleware of this.middleware) {
      if (middleware.postProcess) {
        result = await middleware.postProcess(result, intent, correlationId);
      }
    }
    
    return result;
  }

  /**
   * システムIntent処理
   * @param {string} intent - Intent名
   * @param {Object} payload - ペイロード
   * @param {string} correlationId - 相関ID
   * @returns {Promise<Object>} 処理結果
   */
  async handleSystemIntent(intent, payload, correlationId) {
    this.log(`🔧 Processing system intent: ${intent}`);
    
    switch (intent) {
      case 'system.createPlugin':
        return await this.createPlugin(payload, correlationId);
        
      case 'system.reparentPlugin':
        return await this.reparentPlugin(payload, correlationId);
        
      case 'system.destroyPlugin':
        return await this.destroyPlugin(payload, correlationId);
        
      case 'system.getStats':
        return this.getSystemStats();
        
      case 'system.getHierarchy':
        return this.getSystemHierarchy();
        
      case 'system.getResources':
        return this.getResourceStatus();
        
      case 'system.registerPlugin':
        return await this.registerPlugin(payload, correlationId);
        
      case 'system.unregisterPlugin':
        return await this.unregisterPlugin(payload, correlationId);
        
      default:
        throw new Error(`Unknown system intent: ${intent}`);
    }
  }

  /**
   * プラグインIntent処理
   * @param {string} intent - Intent名
   * @param {Object} payload - ペイロード
   * @param {string} correlationId - 相関ID
   * @returns {Promise<Object>} 処理結果
   */
  async handlePluginIntent(intent, payload, correlationId) {
    this.log(`📨 Processing plugin intent: ${intent}`);
    
    if (!this.pluginManager) {
      throw new Error('PluginManager not initialized');
    }
    
    // プラグインマネージャーに委譲
    return await this.pluginManager.handleIntent(intent, payload, correlationId);
  }

  /**
   * カスタムIntent処理
   * @param {string} intent - Intent名
   * @param {Object} payload - ペイロード
   * @param {string} correlationId - 相関ID
   * @returns {Promise<Object>} 処理結果
   */
  async handleCustomIntent(intent, payload, correlationId) {
    this.log(`🎨 Processing custom intent: ${intent}`);
    
    // カスタムルール確認
    if (this.intentRules.has(intent)) {
      const rule = this.intentRules.get(intent);
      return await rule.handler(payload, correlationId);
    }
    
    // デフォルト処理
    return {
      status: 'processed',
      intent: intent,
      correlationId: correlationId,
      timestamp: Date.now(),
      message: 'Custom intent processed with default handler'
    };
  }

  // ==========================================
  // 🔧 システムIntent実装
  // ==========================================

  /**
   * プラグイン作成
   * @param {Object} payload - 作成パラメータ
   * @param {string} correlationId - 相関ID
   * @returns {Promise<Object>} 作成結果
   */
  async createPlugin(payload, correlationId) {
    const { type, config, parentId } = payload;
    
    if (!this.pluginManager) {
      throw new Error('PluginManager not initialized');
    }
    
    // リソースチェック
    if (this.resourceManager) {
      const resourceCheck = await this.resourceManager.checkResourceAvailability({
        operation: 'createPlugin',
        type: type,
        parentId: parentId
      });
      
      if (!resourceCheck.available) {
        throw new Error(`Resource limit exceeded: ${resourceCheck.reason}`);
      }
    }
    
    // 階層チェック
    if (this.hierarchyManager && parentId) {
      const hierarchyCheck = await this.hierarchyManager.validateHierarchy(parentId, 'add');
      if (!hierarchyCheck.valid) {
        throw new Error(`Hierarchy constraint violation: ${hierarchyCheck.reason}`);
      }
    }
    
    // プラグイン作成
    const plugin = await this.pluginManager.createPlugin({
      type: type,
      config: config,
      parentId: parentId,
      correlationId: correlationId
    });
    
    this.log(`✅ Plugin created: ${plugin.id} (type: ${type})`);
    
    return {
      status: 'created',
      pluginId: plugin.id,
      type: type,
      parentId: parentId,
      correlationId: correlationId,
      createdAt: Date.now()
    };
  }

  /**
   * プラグイン親子関係変更
   * @param {Object} payload - 変更パラメータ
   * @param {string} correlationId - 相関ID
   * @returns {Promise<Object>} 変更結果
   */
  async reparentPlugin(payload, correlationId) {
    const { childId, newParentId, oldParentId } = payload;
    
    if (!this.pluginManager) {
      throw new Error('PluginManager not initialized');
    }
    
    // 階層チェック
    if (this.hierarchyManager) {
      const hierarchyCheck = await this.hierarchyManager.validateReparenting(childId, newParentId, oldParentId);
      if (!hierarchyCheck.valid) {
        throw new Error(`Reparenting constraint violation: ${hierarchyCheck.reason}`);
      }
    }
    
    // 親子関係変更実行
    await this.pluginManager.reparentPlugin(childId, newParentId, oldParentId);
    
    this.log(`✅ Plugin reparented: ${childId} -> ${newParentId}`);
    
    return {
      status: 'reparented',
      childId: childId,
      oldParentId: oldParentId,
      newParentId: newParentId,
      correlationId: correlationId,
      reparentedAt: Date.now()
    };
  }

  /**
   * プラグイン削除
   * @param {Object} payload - 削除パラメータ
   * @param {string} correlationId - 相関ID
   * @returns {Promise<Object>} 削除結果
   */
  async destroyPlugin(payload, correlationId) {
    const { pluginId, force } = payload;
    
    if (!this.pluginManager) {
      throw new Error('PluginManager not initialized');
    }
    
    // 依存関係チェック
    if (this.hierarchyManager && !force) {
      const dependencyCheck = await this.hierarchyManager.checkDependencies(pluginId);
      if (dependencyCheck.hasChilden) {
        throw new Error(`Cannot destroy plugin with children: ${dependencyCheck.childrenIds.join(', ')}`);
      }
    }
    
    // プラグイン削除実行
    await this.pluginManager.destroyPlugin(pluginId, force);
    
    this.log(`✅ Plugin destroyed: ${pluginId}${force ? ' (forced)' : ''}`);
    
    return {
      status: 'destroyed',
      pluginId: pluginId,
      forced: !!force,
      correlationId: correlationId,
      destroyedAt: Date.now()
    };
  }

  /**
   * プラグイン登録
   * @param {Object} payload - 登録パラメータ
   * @param {string} correlationId - 相関ID
   * @returns {Promise<Object>} 登録結果
   */
  async registerPlugin(payload, correlationId) {
    const { plugin } = payload;
    
    if (!this.pluginManager) {
      throw new Error('PluginManager not initialized');
    }
    
    await this.pluginManager.registerPlugin(plugin);
    
    this.log(`✅ Plugin registered: ${plugin.id}`);
    
    return {
      status: 'registered',
      pluginId: plugin.id,
      correlationId: correlationId,
      registeredAt: Date.now()
    };
  }

  /**
   * プラグイン登録解除
   * @param {Object} payload - 登録解除パラメータ
   * @param {string} correlationId - 相関ID
   * @returns {Promise<Object>} 登録解除結果
   */
  async unregisterPlugin(payload, correlationId) {
    const { pluginId } = payload;
    
    if (!this.pluginManager) {
      throw new Error('PluginManager not initialized');
    }
    
    await this.pluginManager.unregisterPlugin(pluginId);
    
    this.log(`✅ Plugin unregistered: ${pluginId}`);
    
    return {
      status: 'unregistered',
      pluginId: pluginId,
      correlationId: correlationId,
      unregisteredAt: Date.now()
    };
  }

  // ==========================================
  // 📊 統計・情報取得
  // ==========================================

  /**
   * システム統計取得
   * @returns {Object} システム統計
   */
  getSystemStats() {
    const runtime = Date.now() - this.stats.startTime;
    
    return {
      intentHandler: {
        ...this.stats,
        runtime: runtime,
        successRate: this.stats.totalIntents > 0 ? 
          this.stats.successfulIntents / this.stats.totalIntents : 0,
        averageProcessingTime: this.stats.totalIntents > 0 ? 
          this.stats.totalProcessingTime / this.stats.totalIntents : 0,
        intentsPerSecond: this.stats.totalIntents / (runtime / 1000),
        pendingIntents: this.pendingIntents.size
      },
      pluginManager: this.pluginManager ? this.pluginManager.getStats() : null,
      hierarchyManager: this.hierarchyManager ? this.hierarchyManager.getStats() : null,
      resourceManager: this.resourceManager ? this.resourceManager.getStats() : null
    };
  }

  /**
   * システム階層取得
   * @returns {Object} システム階層情報
   */
  getSystemHierarchy() {
    if (!this.hierarchyManager) {
      return { error: 'HierarchyManager not initialized' };
    }
    
    return this.hierarchyManager.getHierarchy();
  }

  /**
   * リソース状況取得
   * @returns {Object} リソース状況
   */
  getResourceStatus() {
    if (!this.resourceManager) {
      return { error: 'ResourceManager not initialized' };
    }
    
    return this.resourceManager.getResourceStatus();
  }

  // ==========================================
  // 🔧 ユーティリティメソッド
  // ==========================================

  /**
   * Intent メッセージバリデーション
   * @param {Object} intentMessage - Intent メッセージ
   */
  validateIntentMessage(intentMessage) {
    if (!intentMessage) {
      throw new Error('Intent message is required');
    }
    
    if (!intentMessage.intent) {
      throw new Error('Intent name is required');
    }
    
    if (typeof intentMessage.intent !== 'string') {
      throw new Error('Intent name must be a string');
    }
    
    if (intentMessage.intent.trim() === '') {
      throw new Error('Intent name cannot be empty');
    }
  }

  /**
   * 相関ID生成
   * @returns {string} 相関ID
   */
  generateCorrelationId() {
    return `intent-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
  }

  /**
   * 処理統計更新
   * @param {number} processingTime - 処理時間
   * @param {boolean} success - 成功フラグ
   */
  updateProcessingStats(processingTime, success) {
    this.stats.totalProcessingTime += processingTime;
  }

  /**
   * Intent履歴記録
   * @param {Object} intentMessage - Intent メッセージ
   * @param {Object} result - 処理結果
   * @param {number} processingTime - 処理時間
   * @param {string} status - ステータス
   * @param {string} error - エラーメッセージ
   */
  recordIntentHistory(intentMessage, result, processingTime, status, error = null) {
    const historyEntry = {
      timestamp: Date.now(),
      intent: intentMessage.intent,
      payload: intentMessage.payload,
      result: result,
      processingTime: processingTime,
      status: status,
      error: error
    };
    
    this.intentHistory.push(historyEntry);
    
    // 履歴サイズ制限
    if (this.intentHistory.length > this.maxHistorySize) {
      this.intentHistory.shift();
    }
  }

  /**
   * ミドルウェア追加
   * @param {Object} middleware - ミドルウェア
   */
  addMiddleware(middleware) {
    this.middleware.push(middleware);
    this.log(`🔧 Middleware added: ${middleware.name || 'unnamed'}`);
  }

  /**
   * カスタムIntent ルール追加
   * @param {string} intent - Intent名
   * @param {Function} handler - ハンドラー関数
   */
  addIntentRule(intent, handler) {
    this.intentRules.set(intent, { handler: handler, addedAt: Date.now() });
    this.log(`🎨 Custom intent rule added: ${intent}`);
  }

  /**
   * Intent処理履歴取得
   * @param {number} limit - 取得件数制限
   * @returns {Array} Intent履歴
   */
  getIntentHistory(limit = 10) {
    return this.intentHistory.slice(-limit);
  }

  /**
   * モジュール連携設定
   * @param {Object} managers - 各種マネージャー
   */
  setManagers(managers) {
    if (managers.pluginManager) {
      this.pluginManager = managers.pluginManager;
      this.log('🔧 PluginManager connected');
    }
    
    if (managers.hierarchyManager) {
      this.hierarchyManager = managers.hierarchyManager;
      this.log('🔧 HierarchyManager connected');
    }
    
    if (managers.resourceManager) {
      this.resourceManager = managers.resourceManager;
      this.log('🔧 ResourceManager connected');
    }
  }

  /**
   * ログ出力
   * @param {string} message - ログメッセージ
   */
  log(message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] 🎯 IntentHandler: ${message}`);
  }
}

/**
 * IntentHandler ファクトリー
 * @param {Object} config - 設定
 * @returns {IntentHandler} IntentHandler インスタンス
 */
export function createIntentHandler(config = {}) {
  return new IntentHandler(config);
}

// デフォルトエクスポート
export default IntentHandler;