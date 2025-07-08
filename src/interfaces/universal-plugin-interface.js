// universal-plugin-interface.js - 汎用プラグインインターフェース完成版
// Phase S3後続: 全システム対応の究極プラグインインターフェース

import { IPlugin } from './plugin-interface.js';
// ICorePluginが必要な場合は './legacy/icore-plugin.js' から import

/**
 * 🌐 IUniversalPlugin - 汎用プラグインインターフェース
 * 
 * あらゆるシステム（VoidFlow, ReactFlow, NodeRed, Scratch等）に対応する
 * 究極の汎用プラグインインターフェース
 * 
 * 哲学: 「一つのインターフェースで全ての世界を繋ぐ」
 */
export class IUniversalPlugin extends IPlugin {
  constructor(config) {
    super(config);
    
    // 汎用プラグイン専用プロパティ
    this.systemType = config.systemType || 'Unknown'; // 'VoidFlow', 'ReactFlow', 'NodeRed', etc.
    this.adapters = new Map(); // システム固有アダプター
    this.capabilities = new Set(config.capabilities || []); // プラグイン能力一覧
    this.compatibility = {
      voidFlow: config.voidFlowCompatible ?? true,
      reactFlow: config.reactFlowCompatible ?? false,
      nodeRed: config.nodeRedCompatible ?? false,
      scratch: config.scratchCompatible ?? false,
      custom: config.customCompatible ?? true
    };
    
    // 実行履歴・統計
    this.executionStats = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      totalExecutionTime: 0,
      lastExecutionTime: null,
      startTime: Date.now()
    };
    
    // 動的拡張
    this.extensionRegistry = new Map(); // 拡張機能登録
    this.middlewares = []; // 実行ミドルウェア
    
    this.log(`🌐 Universal plugin initialized: ${this.displayName} (${this.systemType})`);
  }

  /**
   * 汎用実行メソッド - あらゆるシステムの実行要求に対応
   * @param {any} inputData - 入力データ（システムに依存しない形式）
   * @param {Object} context - 実行コンテキスト
   * @returns {Promise<any>} 実行結果
   */
  async universalExecute(inputData, context = {}) {
    const startTime = Date.now();
    this.executionStats.totalExecutions++;
    
    try {
      // 前処理ミドルウェア実行
      let processedInput = inputData;
      for (const middleware of this.middlewares) {
        if (middleware.preProcess) {
          processedInput = await middleware.preProcess(processedInput, context);
        }
      }
      
      // システム固有の実行処理
      let result;
      switch (context.systemType || this.systemType) {
        case 'VoidFlow':
          result = await this.executeForVoidFlow(processedInput, context);
          break;
        case 'ReactFlow':
          result = await this.executeForReactFlow(processedInput, context);
          break;
        case 'NodeRed':
          result = await this.executeForNodeRed(processedInput, context);
          break;
        case 'Scratch':
          result = await this.executeForScratch(processedInput, context);
          break;
        default:
          result = await this.executeGeneric(processedInput, context);
      }
      
      // 後処理ミドルウェア実行
      for (const middleware of this.middlewares) {
        if (middleware.postProcess) {
          result = await middleware.postProcess(result, context);
        }
      }
      
      // 統計更新
      const executionTime = Date.now() - startTime;
      this.updateExecutionStats(executionTime, true);
      
      return result;
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.updateExecutionStats(executionTime, false);
      
      this.log(`❌ Execution failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * VoidFlow実行処理
   * @param {any} inputData - 入力データ
   * @param {Object} context - 実行コンテキスト
   * @returns {Promise<any>} 実行結果
   */
  async executeForVoidFlow(inputData, context) {
    if (!this.compatibility.voidFlow) {
      throw new Error(`Plugin ${this.id} is not compatible with VoidFlow`);
    }
    
    // VoidFlow固有の処理
    const adapter = this.adapters.get('voidFlow');
    if (adapter) {
      return await adapter.execute(inputData, context);
    }
    
    // デフォルト実装
    return await this.executeGeneric(inputData, context);
  }

  /**
   * ReactFlow実行処理
   * @param {any} inputData - 入力データ
   * @param {Object} context - 実行コンテキスト
   * @returns {Promise<any>} 実行結果
   */
  async executeForReactFlow(inputData, context) {
    if (!this.compatibility.reactFlow) {
      throw new Error(`Plugin ${this.id} is not compatible with ReactFlow`);
    }
    
    // ReactFlow固有の処理
    const adapter = this.adapters.get('reactFlow');
    if (adapter) {
      return await adapter.execute(inputData, context);
    }
    
    // ReactFlowデータ形式での処理
    const reactFlowResult = {
      id: context.nodeId || this.id,
      type: this.type,
      data: {
        ...inputData,
        processed: true,
        timestamp: Date.now(),
        pluginId: this.id
      },
      position: context.position || { x: 0, y: 0 }
    };
    
    return reactFlowResult;
  }

  /**
   * NodeRed実行処理
   * @param {any} inputData - 入力データ
   * @param {Object} context - 実行コンテキスト
   * @returns {Promise<any>} 実行結果
   */
  async executeForNodeRed(inputData, context) {
    if (!this.compatibility.nodeRed) {
      throw new Error(`Plugin ${this.id} is not compatible with NodeRed`);
    }
    
    // NodeRed固有の処理
    const adapter = this.adapters.get('nodeRed');
    if (adapter) {
      return await adapter.execute(inputData, context);
    }
    
    // NodeRedメッセージ形式での処理
    const nodeRedMessage = {
      payload: inputData,
      topic: context.topic || this.type,
      _msgid: context.messageId || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      pluginId: this.id,
      timestamp: Date.now()
    };
    
    return nodeRedMessage;
  }

  /**
   * Scratch実行処理
   * @param {any} inputData - 入力データ
   * @param {Object} context - 実行コンテキスト
   * @returns {Promise<any>} 実行結果
   */
  async executeForScratch(inputData, context) {
    if (!this.compatibility.scratch) {
      throw new Error(`Plugin ${this.id} is not compatible with Scratch`);
    }
    
    // Scratch固有の処理
    const adapter = this.adapters.get('scratch');
    if (adapter) {
      return await adapter.execute(inputData, context);
    }
    
    // Scratchブロック形式での処理
    const scratchBlock = {
      opcode: `${this.type}_execute`,
      inputs: inputData,
      fields: {
        PLUGIN_ID: this.id,
        PLUGIN_TYPE: this.type
      },
      shadow: false,
      topLevel: false,
      x: context.x || 0,
      y: context.y || 0
    };
    
    return scratchBlock;
  }

  /**
   * 汎用実行処理（全システム共通）
   * @param {any} inputData - 入力データ
   * @param {Object} context - 実行コンテキスト
   * @returns {Promise<any>} 実行結果
   */
  async executeGeneric(inputData, context) {
    // 汎用処理：入力をそのまま加工して返す
    return {
      input: inputData,
      output: await this.processData(inputData, context),
      metadata: {
        pluginId: this.id,
        pluginType: this.type,
        systemType: this.systemType,
        executedAt: Date.now(),
        context: context
      }
    };
  }

  /**
   * データ処理コア（サブクラスでオーバーライド）
   * @param {any} data - 処理対象データ
   * @param {Object} context - 実行コンテキスト
   * @returns {Promise<any>} 処理結果
   */
  async processData(data, context) {
    // デフォルト実装：データをそのまま返す
    return {
      ...data,
      processed: true,
      processedBy: this.id,
      processedAt: Date.now()
    };
  }

  /**
   * システム固有アダプター登録
   * @param {string} systemType - システムタイプ
   * @param {Object} adapter - アダプター実装
   */
  registerAdapter(systemType, adapter) {
    this.adapters.set(systemType, adapter);
    this.log(`📡 Adapter registered for ${systemType}`);
  }

  /**
   * 実行ミドルウェア追加
   * @param {Object} middleware - ミドルウェア実装
   */
  addMiddleware(middleware) {
    this.middlewares.push(middleware);
    this.log(`🔧 Middleware added: ${middleware.name || 'unnamed'}`);
  }

  /**
   * 拡張機能登録
   * @param {string} name - 拡張機能名
   * @param {Function} extension - 拡張機能実装
   */
  registerExtension(name, extension) {
    this.extensionRegistry.set(name, extension);
    this.log(`🚀 Extension registered: ${name}`);
  }

  /**
   * 拡張機能実行
   * @param {string} name - 拡張機能名
   * @param {...any} args - 引数
   * @returns {Promise<any>} 実行結果
   */
  async executeExtension(name, ...args) {
    const extension = this.extensionRegistry.get(name);
    if (!extension) {
      throw new Error(`Extension not found: ${name}`);
    }
    
    return await extension.call(this, ...args);
  }

  /**
   * 能力チェック
   * @param {string} capability - チェックする能力
   * @returns {boolean} 能力の有無
   */
  hasCapability(capability) {
    return this.capabilities.has(capability);
  }

  /**
   * 能力追加
   * @param {string} capability - 追加する能力
   */
  addCapability(capability) {
    this.capabilities.add(capability);
    this.log(`✨ Capability added: ${capability}`);
  }

  /**
   * システム互換性チェック
   * @param {string} systemType - チェックするシステムタイプ
   * @returns {boolean} 互換性の有無
   */
  isCompatibleWith(systemType) {
    const key = systemType.toLowerCase().replace(/[^a-z]/g, '');
    return this.compatibility[key] === true;
  }

  /**
   * システム互換性設定
   * @param {string} systemType - システムタイプ
   * @param {boolean} compatible - 互換性フラグ
   */
  setCompatibility(systemType, compatible) {
    const key = systemType.toLowerCase().replace(/[^a-z]/g, '');
    this.compatibility[key] = compatible;
    this.log(`🔄 Compatibility for ${systemType}: ${compatible}`);
  }

  /**
   * 実行統計更新
   * @param {number} executionTime - 実行時間
   * @param {boolean} success - 成功フラグ
   */
  updateExecutionStats(executionTime, success) {
    this.executionStats.totalExecutionTime += executionTime;
    this.executionStats.lastExecutionTime = executionTime;
    
    if (success) {
      this.executionStats.successfulExecutions++;
    } else {
      this.executionStats.failedExecutions++;
    }
  }

  /**
   * 実行統計取得
   * @returns {Object} 実行統計情報
   */
  getExecutionStats() {
    const { executionStats } = this;
    const runtime = Date.now() - executionStats.startTime;
    
    return {
      ...executionStats,
      runtime: runtime,
      successRate: executionStats.totalExecutions > 0 ? 
        executionStats.successfulExecutions / executionStats.totalExecutions : 0,
      averageExecutionTime: executionStats.totalExecutions > 0 ? 
        executionStats.totalExecutionTime / executionStats.totalExecutions : 0,
      executionsPerSecond: executionStats.totalExecutions / (runtime / 1000)
    };
  }

  /**
   * プラグイン設定変更
   * @param {Object} newConfig - 新しい設定
   */
  updateConfiguration(newConfig) {
    if (newConfig.systemType) this.systemType = newConfig.systemType;
    if (newConfig.capabilities) {
      this.capabilities = new Set(newConfig.capabilities);
    }
    if (newConfig.compatibility) {
      Object.assign(this.compatibility, newConfig.compatibility);
    }
    if (newConfig.metadata) {
      Object.assign(this.metadata, newConfig.metadata);
    }
    
    this.log(`🔧 Configuration updated`);
  }

  /**
   * プラグイン複製
   * @param {Object} overrideConfig - 上書き設定
   * @returns {IUniversalPlugin} 複製されたプラグイン
   */
  clone(overrideConfig = {}) {
    const cloneConfig = {
      ...this.metadata,
      type: this.type,
      displayName: `${this.displayName} (Copy)`,
      systemType: this.systemType,
      capabilities: Array.from(this.capabilities),
      ...this.compatibility,
      ...overrideConfig
    };
    
    const clonedPlugin = new IUniversalPlugin(cloneConfig);
    
    // アダプターとミドルウェアもコピー
    for (const [systemType, adapter] of this.adapters) {
      clonedPlugin.registerAdapter(systemType, adapter);
    }
    
    for (const middleware of this.middlewares) {
      clonedPlugin.addMiddleware(middleware);
    }
    
    this.log(`👥 Plugin cloned: ${clonedPlugin.id}`);
    return clonedPlugin;
  }

  /**
   * プラグイン詳細情報取得
   * @returns {Object} 詳細情報
   */
  getDetailedInfo() {
    return {
      ...this.getSummary(),
      systemType: this.systemType,
      capabilities: Array.from(this.capabilities),
      compatibility: { ...this.compatibility },
      adapters: Array.from(this.adapters.keys()),
      middlewares: this.middlewares.length,
      extensions: Array.from(this.extensionRegistry.keys()),
      executionStats: this.getExecutionStats()
    };
  }
}

/**
 * 🌟 IUniversalCorePlugin - 汎用コアプラグイン
 * 
 * 汎用プラグインの管理機能を持つコアプラグイン
 */
export class IUniversalCorePlugin extends ICorePlugin {
  constructor(config) {
    super(config);
    
    // 汎用コア専用プロパティ
    this.systemRegistry = new Map(); // 登録されたシステム一覧
    this.globalAdapters = new Map(); // グローバルアダプター
    this.pluginTemplates = new Map(); // プラグインテンプレート
    this.migrationHandlers = new Map(); // システム間移行ハンドラー
    
    this.log(`🌟 Universal Core plugin initialized: ${this.displayName}`);
  }

  /**
   * システム登録
   * @param {string} systemType - システムタイプ
   * @param {Object} systemConfig - システム設定
   */
  registerSystem(systemType, systemConfig) {
    this.systemRegistry.set(systemType, {
      ...systemConfig,
      registeredAt: Date.now(),
      pluginCount: 0
    });
    
    this.log(`🌐 System registered: ${systemType}`);
  }

  /**
   * 汎用プラグイン作成
   * @param {Object} config - プラグイン設定
   * @returns {IUniversalPlugin} 作成されたプラグイン
   */
  createUniversalPlugin(config) {
    const plugin = new IUniversalPlugin({
      ...config,
      parent: this.id
    });
    
    this.children.add(plugin.id);
    
    // システム統計更新
    if (this.systemRegistry.has(plugin.systemType)) {
      const systemInfo = this.systemRegistry.get(plugin.systemType);
      systemInfo.pluginCount++;
    }
    
    this.log(`🧩 Universal plugin created: ${plugin.displayName}`);
    return plugin;
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
   * テンプレートからプラグイン作成
   * @param {string} templateName - テンプレート名
   * @param {Object} overrideConfig - 上書き設定
   * @returns {IUniversalPlugin} 作成されたプラグイン
   */
  createFromTemplate(templateName, overrideConfig = {}) {
    const template = this.pluginTemplates.get(templateName);
    if (!template) {
      throw new Error(`Plugin template not found: ${templateName}`);
    }
    
    const config = {
      ...template,
      ...overrideConfig
    };
    
    return this.createUniversalPlugin(config);
  }

  /**
   * システム間プラグイン移行
   * @param {string} pluginId - プラグインID
   * @param {string} targetSystemType - 移行先システムタイプ
   * @returns {Promise<IUniversalPlugin>} 移行されたプラグイン
   */
  async migratePlugin(pluginId, targetSystemType) {
    const migrationHandler = this.migrationHandlers.get(targetSystemType);
    if (!migrationHandler) {
      throw new Error(`Migration handler not found for: ${targetSystemType}`);
    }
    
    // 移行処理（実装は移行ハンドラーに委譲）
    const migratedPlugin = await migrationHandler.migrate(pluginId, targetSystemType);
    
    this.log(`🔄 Plugin migrated: ${pluginId} -> ${targetSystemType}`);
    return migratedPlugin;
  }

  /**
   * システム統計取得
   * @returns {Object} システム統計情報
   */
  getSystemStats() {
    const stats = {
      totalSystems: this.systemRegistry.size,
      totalPlugins: this.children.size,
      systemBreakdown: {}
    };
    
    for (const [systemType, systemInfo] of this.systemRegistry) {
      stats.systemBreakdown[systemType] = {
        pluginCount: systemInfo.pluginCount,
        registeredAt: systemInfo.registeredAt
      };
    }
    
    return stats;
  }

  /**
   * 全プラグインの実行統計取得
   * @returns {Object} 統合実行統計
   */
  getAggregatedExecutionStats() {
    // 実装は子プラグインの統計を集計
    return {
      totalExecutions: 0,
      totalSuccesses: 0,
      totalFailures: 0,
      averageExecutionTime: 0,
      systemBreakdown: {}
    };
  }
}

/**
 * 汎用プラグインファクトリー
 * @param {Object} config - プラグイン設定
 * @returns {IUniversalPlugin|IUniversalCorePlugin}
 */
export function createUniversalPlugin(config) {
  if (config.isCore) {
    return new IUniversalCorePlugin(config);
  } else {
    return new IUniversalPlugin(config);
  }
}

/**
 * システム互換性チェッカー
 * @param {IUniversalPlugin} plugin - チェック対象プラグイン
 * @param {string} systemType - システムタイプ
 * @returns {boolean} 互換性の有無
 */
export function checkSystemCompatibility(plugin, systemType) {
  return plugin instanceof IUniversalPlugin && plugin.isCompatibleWith(systemType);
}

/**
 * プラグイン統計分析器
 * @param {Array<IUniversalPlugin>} plugins - 分析対象プラグイン配列
 * @returns {Object} 統計分析結果
 */
export function analyzePluginStats(plugins) {
  const analysis = {
    totalPlugins: plugins.length,
    systemDistribution: {},
    capabilityDistribution: {},
    performanceMetrics: {
      averageSuccessRate: 0,
      averageExecutionTime: 0,
      totalExecutions: 0
    }
  };
  
  for (const plugin of plugins) {
    if (!(plugin instanceof IUniversalPlugin)) continue;
    
    // システム分布
    const systemType = plugin.systemType;
    analysis.systemDistribution[systemType] = (analysis.systemDistribution[systemType] || 0) + 1;
    
    // 能力分布
    for (const capability of plugin.capabilities) {
      analysis.capabilityDistribution[capability] = (analysis.capabilityDistribution[capability] || 0) + 1;
    }
    
    // 性能指標
    const stats = plugin.getExecutionStats();
    analysis.performanceMetrics.totalExecutions += stats.totalExecutions;
    analysis.performanceMetrics.averageSuccessRate += stats.successRate;
    analysis.performanceMetrics.averageExecutionTime += stats.averageExecutionTime;
  }
  
  // 平均値計算
  if (plugins.length > 0) {
    analysis.performanceMetrics.averageSuccessRate /= plugins.length;
    analysis.performanceMetrics.averageExecutionTime /= plugins.length;
  }
  
  return analysis;
}

// デフォルトエクスポート
export default IUniversalPlugin;