// universal-flow-integration.js - 汎用フロー統合システム
// Phase S3後続: VoidFlowNodeIntegration汎用化による412行削減

import { voidCore } from './voidcore.js';
import { IPlugin } from './plugin-interface.js';

/**
 * 🌐 UniversalFlowIntegration - 汎用フロー統合システム
 * 
 * 設定ベースで任意のフローシステム（VoidFlow, ReactFlow, NodeRed等）を
 * VoidCoreプラグインシステムに統合する汎用統合レイヤー
 * 
 * 哲学: 「一つの統合システムで全てのフローエンジンを繋ぐ」
 */
export class UniversalFlowIntegration {
  constructor(config) {
    this.config = this.validateConfig(config);
    this.integrationId = `universal-integration-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    // 統合状態
    this.plugins = new Map(); // nodeId/pluginId -> IPlugin
    this.executionMode = this.config.executionMode || 'unified';
    
    // 統計情報
    this.stats = {
      executions: 0,
      successes: 0,
      errors: 0,
      totalExecutionTime: 0,
      startTime: Date.now()
    };
    
    this.log(`🌐 UniversalFlowIntegration initialized: ${this.config.flowType}`);
  }

  /**
   * 設定バリデーション
   * @param {Object} config - 統合設定
   * @returns {Object} 検証済み設定
   */
  validateConfig(config) {
    if (!config) {
      throw new Error('Integration config is required');
    }

    const requiredFields = ['flowType', 'flowEngine', 'nodeFactory'];
    for (const field of requiredFields) {
      if (!config[field]) {
        throw new Error(`Config field '${field}' is required`);
      }
    }

    return {
      flowType: config.flowType, // 'VoidFlow', 'ReactFlow', 'NodeRed', etc.
      flowEngine: config.flowEngine, // 対象フローエンジン
      nodeFactory: config.nodeFactory, // ノード作成ファクトリー
      messageAdapter: config.messageAdapter, // メッセージアダプター
      executionMode: config.executionMode || 'unified',
      pluginManager: config.pluginManager || voidCore,
      securityPolicy: config.securityPolicy || { allowCustomCode: false },
      metadata: config.metadata || {}
    };
  }

  /**
   * 統合システム初期化
   */
  async initialize() {
    try {
      this.log('🚀 Initializing universal flow integration...');
      
      // フローエンジン統合
      await this.integrateFlowEngine();
      
      // ノードプラグイン作成・登録
      await this.createAndRegisterNodes();
      
      // 実行フック設定
      this.setupExecutionHooks();
      
      this.log(`✅ Universal integration initialized: ${this.plugins.size} nodes integrated`);
      
      return true;
      
    } catch (error) {
      this.log(`❌ Universal integration failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * フローエンジン統合
   */
  async integrateFlowEngine() {
    const flowEngine = this.config.flowEngine;
    
    // フローエンジンのノード実行メソッドをオーバーライド
    if (flowEngine && typeof flowEngine.executeNode === 'function') {
      this.originalExecuteNode = flowEngine.executeNode.bind(flowEngine);
      flowEngine.executeNode = this.universalExecuteNode.bind(this);
      
      this.log(`🔄 ${this.config.flowType} engine integration completed`);
    }
  }

  /**
   * ノードプラグイン作成・登録
   */
  async createAndRegisterNodes() {
    const flowEngine = this.config.flowEngine;
    const nodeFactory = this.config.nodeFactory;
    
    // フローエンジンからノード情報取得
    const nodes = this.extractNodesFromEngine(flowEngine);
    
    // 各ノードをプラグインに変換
    for (const nodeInfo of nodes) {
      try {
        const plugin = await nodeFactory.createPlugin(nodeInfo, {
          messageAdapter: this.config.messageAdapter,
          integrationId: this.integrationId
        });
        
        if (plugin instanceof IPlugin) {
          this.plugins.set(nodeInfo.id, plugin);
          
          // VoidCoreに登録
          if (this.config.pluginManager.registerPlugin) {
            this.config.pluginManager.registerPlugin(plugin);
          }
          
        } else {
          this.log(`⚠️ Invalid plugin created for node: ${nodeInfo.id}`);
        }
        
      } catch (error) {
        this.log(`❌ Failed to create plugin for node ${nodeInfo.id}: ${error.message}`);
      }
    }
    
    this.log(`📦 Created ${this.plugins.size} node plugins`);
  }

  /**
   * フローエンジンからノード情報抽出
   * @param {Object} flowEngine - フローエンジン
   * @returns {Array} ノード情報配列
   */
  extractNodesFromEngine(flowEngine) {
    const nodes = [];
    
    // VoidFlow形式
    if (flowEngine.nodes && flowEngine.nodes instanceof Map) {
      for (const [nodeId, node] of flowEngine.nodes) {
        nodes.push({
          id: nodeId,
          type: node.type,
          config: node.config,
          customCode: node.customCode,
          title: node.title,
          metadata: node.metadata || {}
        });
      }
    }
    
    // ReactFlow形式
    else if (Array.isArray(flowEngine.nodes)) {
      for (const node of flowEngine.nodes) {
        nodes.push({
          id: node.id,
          type: node.type,
          config: node.data,
          title: node.data?.label,
          metadata: node.data?.metadata || {}
        });
      }
    }
    
    // NodeRed形式
    else if (flowEngine.flows) {
      for (const flow of flowEngine.flows) {
        if (flow.nodes) {
          for (const node of flow.nodes) {
            nodes.push({
              id: node.id,
              type: node.type,
              config: node.config,
              title: node.name,
              metadata: { flowId: flow.id }
            });
          }
        }
      }
    }
    
    return nodes;
  }

  /**
   * 実行フック設定
   */
  setupExecutionHooks() {
    // 統計情報収集フック
    if (this.config.pluginManager.on) {
      this.config.pluginManager.on('pluginExecution', (event) => {
        if (event.pluginId && this.plugins.has(event.pluginId)) {
          this.updateExecutionStats(event.executionTime, event.success);
        }
      });
    }
  }

  /**
   * 汎用ノード実行
   * @param {string} nodeId - ノードID
   * @param {Object} inputData - 入力データ
   * @returns {Object} 実行結果
   */
  async universalExecuteNode(nodeId, inputData) {
    const startTime = Date.now();
    
    try {
      this.stats.executions++;
      
      // プラグインで実行
      if (this.plugins.has(nodeId)) {
        const plugin = this.plugins.get(nodeId);
        
        // VoidCore Intent経由で実行
        const result = await this.config.pluginManager.sendIntent('voidflow.execute', {
          inputData: inputData,
          context: {
            nodeId: nodeId,
            flowType: this.config.flowType,
            integrationId: this.integrationId
          }
        });
        
        this.stats.successes++;
        const executionTime = Date.now() - startTime;
        this.updateExecutionStats(executionTime, true);
        
        return result;
      }
      
      // フォールバック: 元の実行方式
      else if (this.originalExecuteNode) {
        this.log(`🔄 Fallback execution for ${nodeId}`);
        return await this.originalExecuteNode(nodeId, inputData);
      }
      
      else {
        throw new Error(`No execution method available for node: ${nodeId}`);
      }
      
    } catch (error) {
      this.stats.errors++;
      const executionTime = Date.now() - startTime;
      this.updateExecutionStats(executionTime, false);
      
      this.log(`❌ Universal execution failed: ${nodeId} - ${error.message}`);
      throw error;
    }
  }

  /**
   * 実行統計更新
   * @param {number} executionTime - 実行時間
   * @param {boolean} success - 成功フラグ
   */
  updateExecutionStats(executionTime, success) {
    this.stats.totalExecutionTime += executionTime;
    
    if (this.stats.executions > 0) {
      this.stats.averageExecutionTime = this.stats.totalExecutionTime / this.stats.executions;
    }
  }

  /**
   * 統計情報取得
   * @returns {Object} 統計情報
   */
  getStats() {
    const runtime = Date.now() - this.stats.startTime;
    
    return {
      ...this.stats,
      runtime: runtime,
      successRate: this.stats.executions > 0 ? this.stats.successes / this.stats.executions : 0,
      executionsPerSecond: this.stats.executions / (runtime / 1000),
      averageExecutionTime: this.stats.averageExecutionTime || 0,
      totalPlugins: this.plugins.size,
      flowType: this.config.flowType,
      integrationId: this.integrationId
    };
  }

  /**
   * プラグイン一覧取得
   * @returns {Array} プラグイン情報配列
   */
  getPluginList() {
    return Array.from(this.plugins.entries()).map(([nodeId, plugin]) => ({
      nodeId: nodeId,
      pluginId: plugin.id,
      type: plugin.type,
      displayName: plugin.displayName,
      status: plugin.status
    }));
  }

  /**
   * 実行モード設定
   * @param {string} mode - 実行モード
   */
  setExecutionMode(mode) {
    const validModes = ['unified', 'legacy', 'hybrid'];
    if (!validModes.includes(mode)) {
      throw new Error(`Invalid execution mode: ${mode}`);
    }
    
    this.executionMode = mode;
    this.log(`🔄 Execution mode set to: ${mode}`);
  }

  /**
   * 統合停止・クリーンアップ
   */
  async destroy() {
    // フローエンジンのメソッド復元
    if (this.originalExecuteNode && this.config.flowEngine) {
      this.config.flowEngine.executeNode = this.originalExecuteNode;
    }
    
    // プラグイン登録解除
    for (const [nodeId, plugin] of this.plugins) {
      if (this.config.pluginManager.unregisterPlugin) {
        this.config.pluginManager.unregisterPlugin(plugin.id);
      }
    }
    
    this.plugins.clear();
    this.log('🔚 Universal flow integration destroyed');
  }

  /**
   * ログ出力
   * @param {string} message - ログメッセージ
   */
  log(message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] 🌐 UniversalFlow: ${message}`);
  }
}

// ==========================================
// 📦 VoidFlow専用設定ファクトリー
// ==========================================

/**
 * VoidFlow統合設定作成
 * @param {Object} voidFlowEngine - VoidFlowEngine
 * @param {Object} options - オプション
 * @returns {Object} 統合設定
 */
export function createVoidFlowIntegrationConfig(voidFlowEngine, options = {}) {
  const { VoidFlowNodePlugin, createVoidFlowNodePlugin } = options;
  
  return {
    flowType: 'VoidFlow',
    flowEngine: voidFlowEngine,
    
    nodeFactory: {
      createPlugin: async (nodeInfo, context) => {
        // VoidFlowNodePluginを使用
        if (createVoidFlowNodePlugin) {
          return createVoidFlowNodePlugin(nodeInfo.type, {
            pluginId: `integrated-${nodeInfo.id}`,
            displayName: nodeInfo.title || nodeInfo.type,
            description: `Integrated ${nodeInfo.type} node`,
            voidFlowConfig: nodeInfo.config,
            allowedAPIs: ['console', 'setTimeout'],
            maxExecutionTime: 5000
          });
        }
        
        // フォールバック: 簡易プラグイン作成
        return new IPlugin({
          id: `integrated-${nodeInfo.id}`,
          type: nodeInfo.type,
          displayName: nodeInfo.title || nodeInfo.type,
          description: `Integrated ${nodeInfo.type} node`,
          metadata: {
            integrated: true,
            nodeType: nodeInfo.type,
            config: nodeInfo.config
          }
        });
      }
    },
    
    messageAdapter: options.messageAdapter,
    executionMode: options.executionMode || 'unified',
    pluginManager: options.pluginManager || voidCore,
    
    metadata: {
      version: '14.0-universal',
      description: 'VoidFlow universal integration'
    }
  };
}

/**
 * ReactFlow統合設定作成例
 * @param {Object} reactFlowInstance - ReactFlow instance
 * @returns {Object} 統合設定
 */
export function createReactFlowIntegrationConfig(reactFlowInstance) {
  return {
    flowType: 'ReactFlow',
    flowEngine: reactFlowInstance,
    
    nodeFactory: {
      createPlugin: async (nodeInfo, context) => {
        // ReactFlow用の汎用プラグイン作成
        return new IPlugin({
          id: `reactflow-${nodeInfo.id}`,
          type: nodeInfo.type,
          displayName: nodeInfo.title || nodeInfo.type,
          metadata: {
            reactFlowNode: true,
            originalData: nodeInfo.config
          }
        });
      }
    },
    
    executionMode: 'unified',
    
    metadata: {
      version: '14.0-universal',
      description: 'ReactFlow universal integration'
    }
  };
}

// VoidFlow互換のデフォルト統合
export const voidFlowIntegration = {
  create: (voidFlowEngine, options = {}) => {
    const config = createVoidFlowIntegrationConfig(voidFlowEngine, options);
    return new UniversalFlowIntegration(config);
  }
};

// レガシー互換用エイリアス
export const integrateVoidFlowNodes = (voidFlowEngine, options = {}) => {
  return voidFlowIntegration.create(voidFlowEngine, options);
};

export const autoIntegrateVoidFlow = async (voidFlowEngine, options = {}) => {
  const integration = voidFlowIntegration.create(voidFlowEngine, options);
  await integration.initialize();
  return integration;
};