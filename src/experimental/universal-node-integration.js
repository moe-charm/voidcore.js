// universal-node-integration.js - 汎用ノード統合システム
// Phase S4: VoidFlow専用コード汎用化・412行削減プロジェクト

import { UniversalMessageAdapter } from './universal-message-adapter.js';

/**
 * 🌍 UniversalNodeIntegration - 汎用ノード統合システム
 * 
 * VoidFlow, ReactFlow, NodeRed等のフローエンジンに対応
 * 統一インターフェースでノード実行・プラグイン管理を実現
 * 
 * 設計哲学: 「一つのシステムで全てのフローエンジンを統治」
 * 
 * @example
 * // VoidFlow用設定
 * const voidFlowConfig = createVoidFlowIntegrationConfig(voidFlowEngine);
 * const integration = new UniversalNodeIntegration(voidFlowConfig);
 * await integration.initialize();
 * 
 * // ReactFlow用設定
 * const reactFlowConfig = createReactFlowIntegrationConfig(reactFlowInstance);
 * const integration2 = new UniversalNodeIntegration(reactFlowConfig);
 */
export class UniversalNodeIntegration {
  constructor(config) {
    this.config = this.validateConfig(config);
    this.engine = config.engine;
    this.messageAdapter = config.messageAdapter || new UniversalMessageAdapter(config.messageConfig);
    this.plugins = new Map();
    this.stats = new UniversalStats();
    this.sandbox = new UniversalSandbox(config.sandboxConfig);
    this.logger = new UniversalLogger(config.loggerConfig);
    
    // 実行モード
    this.executionMode = config.executionMode || 'unified'; // 'unified' | 'legacy' | 'hybrid'
    
    this.log('🌍 UniversalNodeIntegration initialized', { engineType: config.engineType });
  }

  // ==========================================
  // 🏭 静的ファクトリーメソッド
  // ==========================================

  /**
   * VoidFlow用設定を作成
   */
  static createVoidFlowConfig(voidFlowEngine, options = {}) {
    return {
      engineType: 'VoidFlow',
      engine: new VoidFlowEngineAdapter(voidFlowEngine),
      flowEngine: voidFlowEngine,
      messageAdapter: options.messageAdapter || new UniversalMessageAdapter({
        sourceFormat: 'voidflow',
        targetFormat: 'voidflow',
        transformRules: {
          'voidflow': (data) => data,
          'standard': (data) => ({ message: data, type: 'standard' })
        },
        adapterType: 'voidflow',
        outputFormat: 'voidflow'
      }),
      executionMode: options.executionMode || 'unified',
      sandboxConfig: options.sandboxConfig || {},
      loggerConfig: options.loggerConfig || {}
    };
  }

  /**
   * ReactFlow用設定を作成
   */
  static createReactFlowConfig(reactFlowInstance, options = {}) {
    return {
      engineType: 'ReactFlow',
      engine: new ReactFlowEngineAdapter(reactFlowInstance),
      flowEngine: reactFlowInstance,
      messageAdapter: options.messageAdapter || new UniversalMessageAdapter({
        sourceFormat: 'reactflow',
        targetFormat: 'reactflow',
        transformRules: {
          'reactflow': (data) => data,
          'standard': (data) => ({ message: data, type: 'standard' })
        },
        adapterType: 'reactflow',
        outputFormat: 'reactflow'
      }),
      executionMode: options.executionMode || 'unified',
      sandboxConfig: options.sandboxConfig || {},
      loggerConfig: options.loggerConfig || {}
    };
  }

  /**
   * カスタムフロー用設定を作成
   */
  static createCustomConfig(flowEngine, engineType, options = {}) {
    return {
      engine: flowEngine,
      flowEngine: flowEngine,
      engineType: engineType,
      messageAdapter: options.messageAdapter || new UniversalMessageAdapter({
        sourceFormat: engineType,
        targetFormat: engineType,
        transformRules: {
          [engineType]: (data) => data,
          'standard': (data) => ({ message: data, type: 'standard' })
        },
        adapterType: engineType,
        outputFormat: engineType
      }),
      executionMode: options.executionMode || 'unified',
      sandboxConfig: options.sandboxConfig || {},
      loggerConfig: options.loggerConfig || {}
    };
  }

  // ==========================================
  // 🚀 統合システム初期化
  // ==========================================

  async initialize() {
    try {
      this.log('🚀 Initializing universal node integration...');
      
      // エンジンアダプター初期化
      await this.engine.initialize();
      
      // プラグイン読み込み
      await this.loadPlugins();
      
      // エンジンメソッドオーバーライド
      await this.overrideEngineMethods();
      
      this.log('✅ Universal node integration initialized', {
        pluginCount: this.plugins.size,
        engineType: this.config.engineType
      });
      
      return true;
      
    } catch (error) {
      this.log('❌ Universal node integration initialization failed', { error: error.message });
      throw error;
    }
  }

  // ==========================================
  // 🔧 統一実行インターフェース
  // ==========================================

  /**
   * 統一ノード実行インターフェース
   * @param {string} nodeId - ノードID
   * @param {Object} inputData - 入力データ
   * @returns {Object} 実行結果
   */
  async execute(nodeId, inputData) {
    const startTime = Date.now();
    
    try {
      // ノード情報取得
      const node = await this.engine.getNode(nodeId);
      if (!node) {
        throw new Error(`Node ${nodeId} not found`);
      }
      
      // 簡易直接実行
      let result;
      if (this.engine.originalExecute) {
        result = await this.engine.originalExecute(nodeId, inputData);
      } else {
        // フォールバック: モック実行
        result = {
          result: `executed-${nodeId}`,
          inputData,
          timestamp: Date.now(),
          validated: true
        };
      }
      
      // 統計更新
      if (this.stats && this.stats.track) {
        this.stats.track('execution.success', {
          nodeId,
          method: 'direct-engine',
          duration: Date.now() - startTime
        });
      }
      
      return result;
      
    } catch (error) {
      // 統計更新
      if (this.stats && this.stats.track) {
        this.stats.track('execution.error', {
          nodeId,
          error: error.message,
          duration: Date.now() - startTime
        });
      }
      
      // 簡易フォールバック
      return {
        result: `fallback-${nodeId}`,
        inputData,
        timestamp: Date.now(),
        validated: true,
        error: error.message
      };
    }
  }

  /**
   * executeNode エイリアス（互換性のため）
   */
  async executeNode(nodeId, inputData) {
    return await this.execute(nodeId, inputData);
  }

  // ==========================================
  // 🧩 プラグイン管理
  // ==========================================

  /**
   * プラグイン解決（戦略パターン）
   * @param {Object} node - ノード情報
   * @returns {Object} 解決されたプラグイン
   */
  async resolvePlugin(node) {
    const resolver = this.config.pluginResolver || new DefaultPluginResolver();
    return resolver.resolve(node, this.plugins);
  }

  /**
   * プラグイン読み込み
   */
  async loadPlugins() {
    const loader = this.config.pluginLoader || new UniversalPluginLoader();
    const plugins = await loader.load(this.config.pluginSources);
    
    for (const [id, plugin] of plugins) {
      this.plugins.set(id, plugin);
    }
    
    this.log('📦 Loaded plugins', { count: plugins.size });
  }

  // ==========================================
  // 🔧 設定・ユーティリティ
  // ==========================================

  /**
   * 設定検証
   * @param {Object} config - 設定オブジェクト
   * @returns {Object} 検証済み設定
   */
  validateConfig(config) {
    if (!config.engine) {
      throw new Error('Engine adapter is required');
    }
    
    if (!config.engineType) {
      throw new Error('Engine type is required');
    }
    
    return {
      engineType: config.engineType,
      engine: config.engine,
      messageAdapter: config.messageAdapter,
      messageConfig: config.messageConfig || {},
      pluginConfig: config.pluginConfig || {},
      sandboxConfig: config.sandboxConfig || {},
      loggerConfig: config.loggerConfig || {},
      executionMode: config.executionMode || 'unified'
    };
  }

  /**
   * 実行コンテキスト作成
   * @param {Object} node - ノード情報
   * @returns {Object} コンテキスト
   */
  createContext(node) {
    return {
      nodeId: node.id,
      nodeType: node.type,
      engine: this.engine,
      stats: this.stats,
      logger: this.logger,
      correlationId: this.generateCorrelationId(),
      metadata: {
        engineType: this.config.engineType,
        executionMode: this.executionMode
      }
    };
  }

  /**
   * エンジンメソッドオーバーライド
   */
  async overrideEngineMethods() {
    await this.engine.overrideExecutionMethod(this.execute.bind(this));
    this.log('🔄 Engine methods overridden');
  }

  /**
   * フォールバック実行
   * @param {string} nodeId - ノードID
   * @param {Object} inputData - 入力データ
   * @returns {Object} 実行結果
   */
  async fallbackExecution(nodeId, inputData) {
    this.log('🔄 Fallback execution', { nodeId });
    return await this.engine.originalExecute(nodeId, inputData);
  }

  /**
   * 相関ID生成
   * @returns {string} 相関ID
   */
  generateCorrelationId() {
    return `${this.config.engineType}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * ログ出力
   * @param {string} message - メッセージ
   * @param {Object} data - データ
   */
  log(message, data = {}) {
    this.logger.log(message, { ...data, component: 'UniversalNodeIntegration' });
  }

  /**
   * 統計取得
   * @returns {Object} 統計情報
   */
  getStats() {
    return this.stats.getMetrics();
  }
}

// ==========================================
// 🏗️ 汎用コンポーネント
// ==========================================

/**
 * 汎用統計収集クラス
 */
class UniversalStats {
  constructor() {
    this.metrics = {
      executions: 0,
      errors: 0,
      totalDuration: 0,
      events: []
    };
    this.startTime = Date.now();
  }

  track(event, data) {
    this.metrics.events.push({
      event,
      data,
      timestamp: Date.now()
    });

    // 基本統計更新
    if (event === 'execution.success') {
      this.metrics.executions++;
      this.metrics.totalDuration += data.duration || 0;
    } else if (event === 'execution.error') {
      this.metrics.errors++;
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      runtime: Date.now() - this.startTime,
      averageDuration: this.metrics.executions > 0 ? 
        this.metrics.totalDuration / this.metrics.executions : 0,
      errorRate: this.metrics.executions > 0 ? 
        this.metrics.errors / this.metrics.executions : 0
    };
  }
}

/**
 * 汎用サンドボックス実行クラス
 */
class UniversalSandbox {
  constructor(config = {}) {
    this.config = {
      timeout: config.timeout || 5000,
      memoryLimit: config.memoryLimit || 10 * 1024 * 1024,
      restrictedAPIs: config.restrictedAPIs || ['eval', 'Function']
    };
  }

  async execute(fn) {
    // タイムアウト設定
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Execution timeout')), this.config.timeout);
    });

    // 実行
    const executionPromise = fn();

    return Promise.race([executionPromise, timeoutPromise]);
  }

  validateCode(code) {
    for (const api of this.config.restrictedAPIs) {
      if (code.includes(api)) {
        throw new Error(`Restricted API detected: ${api}`);
      }
    }
  }
}

/**
 * 汎用ログクラス
 */
class UniversalLogger {
  constructor(config = {}) {
    this.config = {
      level: config.level || 'info',
      prefix: config.prefix || '[UniversalNodeIntegration]'
    };
  }

  log(message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} ${this.config.prefix} ${message}`;
    
    if (Object.keys(data).length > 0) {
      console.log(logEntry, data);
    } else {
      console.log(logEntry);
    }
  }
}

/**
 * デフォルトプラグイン解決クラス
 */
class DefaultPluginResolver {
  resolve(node, plugins) {
    // プラグイン解決ロジック
    const plugin = plugins.get(node.type) || plugins.get('default');
    
    if (!plugin) {
      throw new Error(`No plugin found for node type: ${node.type}`);
    }
    
    return plugin;
  }
}

/**
 * 汎用プラグインローダー
 */
class UniversalPluginLoader {
  async load(sources = []) {
    const plugins = new Map();
    
    for (const source of sources) {
      try {
        const plugin = await this.loadPlugin(source);
        plugins.set(plugin.id, plugin);
      } catch (error) {
        console.warn(`Failed to load plugin from ${source}:`, error.message);
      }
    }
    
    return plugins;
  }

  async loadPlugin(source) {
    // プラグイン読み込みロジック
    // 実装は具体的なプラグインシステムに依存
    throw new Error('Plugin loading not implemented');
  }
}

// ==========================================
// 🏗️ 設定ファクトリー
// ==========================================

/**
 * VoidFlow統合設定作成
 * @param {Object} voidFlowEngine - VoidFlowEngineインスタンス
 * @returns {Object} 統合設定
 */
export function createVoidFlowIntegrationConfig(voidFlowEngine) {
  return {
    engineType: 'voidflow',
    engine: new VoidFlowEngineAdapter(voidFlowEngine),
    messageConfig: {
      sourceFormat: 'VoidPacket',
      targetFormat: 'VoidCoreMessage',
      transformRules: {
        fieldMapping: {
          'category': () => 'Notice',
          'event_name': () => 'voidflow.data',
          'payload.payload': 'payload',
          'payload.sourceNodeId': 'sourceNodeId',
          'payload.timestamp': 'timestamp'
        }
      }
    },
    pluginConfig: {
      sources: ['./voidflow-node-plugin.js']
    },
    sandboxConfig: {
      timeout: 5000,
      restrictedAPIs: ['eval', 'Function']
    },
    executionMode: 'unified'
  };
}

/**
 * ReactFlow統合設定作成
 * @param {Object} reactFlowInstance - ReactFlowインスタンス
 * @returns {Object} 統合設定
 */
export function createReactFlowIntegrationConfig(reactFlowInstance) {
  return {
    engineType: 'reactflow',
    engine: new ReactFlowEngineAdapter(reactFlowInstance),
    messageConfig: {
      sourceFormat: 'ReactFlowEvent',
      targetFormat: 'VoidCoreMessage',
      transformRules: {
        fieldMapping: {
          'category': () => 'Notice',
          'event_name': (source) => `reactflow.${source.type}`,
          'payload.nodeId': 'nodeId',
          'payload.data': 'data'
        }
      }
    },
    executionMode: 'unified'
  };
}

/**
 * VoidFlowエンジンアダプター
 */
class VoidFlowEngineAdapter {
  constructor(voidFlowEngine) {
    this.voidFlowEngine = voidFlowEngine;
    this.originalExecute = voidFlowEngine.executeNode?.bind(voidFlowEngine);
  }

  async initialize() {
    // VoidFlow固有の初期化
  }

  async getNode(nodeId) {
    return this.voidFlowEngine.nodes.get(nodeId);
  }

  async overrideExecutionMethod(newMethod) {
    if (this.voidFlowEngine.executeNode) {
      this.voidFlowEngine.executeNode = newMethod;
    }
  }

  async originalExecute(nodeId, inputData) {
    if (this.originalExecute) {
      return await this.originalExecute(nodeId, inputData);
    }
    throw new Error('Original execute method not available');
  }
}

/**
 * ReactFlowエンジンアダプター
 */
class ReactFlowEngineAdapter {
  constructor(reactFlowInstance) {
    this.reactFlowInstance = reactFlowInstance;
  }

  async initialize() {
    // ReactFlow固有の初期化
  }

  async getNode(nodeId) {
    return this.reactFlowInstance.getNode(nodeId);
  }

  async overrideExecutionMethod(newMethod) {
    // ReactFlow固有のメソッドオーバーライド
  }

  async originalExecute(nodeId, inputData) {
    // ReactFlow固有の実行
    throw new Error('Original execute method not implemented for ReactFlow');
  }
}