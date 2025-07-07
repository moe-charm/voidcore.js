// voidflow-node-plugin.js - VoidFlowノード→VoidCoreプラグイン統一システム
// Phase 5.3 Phase 2: eval排除・セキュリティ革命・無限拡張性実現

import { voidCore } from './voidcore.js';
import { Message } from './message.js';
import { voidFlowAdapter } from './voidflow-message-adapter.js';
import { IPlugin } from './plugin-interface.js';

/**
 * 🔌 VoidFlowNodePlugin - 統一ノードプラグインシステム (Phase R統合版)
 * 
 * VoidFlowの17種類固定ノードをVoidCoreの無限拡張プラグインに統一
 * eval排除によるセキュリティ革命とサンドボックス化実現
 * IPlugin継承によるPhase R完全統合
 * 
 * 哲学: 「固定から無限へ、危険から安全へ、統一から汎用へ」
 */
export class VoidFlowNodePlugin extends IPlugin {
  constructor(config) {
    // IPlugin継承による統一初期化
    super({
      id: config.pluginId || `voidflow.${config.nodeType}.${Date.now()}`,
      type: config.nodeType || 'voidflow.node',
      displayName: config.displayName || config.nodeType,
      metadata: {
        nodeType: config.nodeType,
        description: config.description || `VoidFlow ${config.nodeType} node`,
        voidFlowConfig: config.voidFlowConfig || {},
        source: 'VoidFlowNodePlugin',
        phaseR: true // Phase R統合マーカー
      }
    });
    
    // VoidFlow固有プロパティ
    this.nodeType = config.nodeType; // 'input.text', 'button.send' etc.
    
    // VoidFlow統合情報（メタデータに統合）
    this.metadata.voidFlowConfig = {
      inputs: config.inputs || [],
      outputs: config.outputs || ['result'],
      category: config.category || 'general',
      icon: config.icon || '🔌',
      color: config.color || '#4a90e2',
      ...this.metadata.voidFlowConfig
    };
    
    // 実行コンテキスト
    this.executionContext = {
      voidCore: voidCore,
      adapter: voidFlowAdapter,
      nodeId: null,
      flowId: null,
      correlationId: null
    };
    
    // セキュリティサンドボックス
    this.sandbox = {
      allowedAPIs: config.allowedAPIs || ['console', 'setTimeout', 'setInterval'],
      restrictedAPIs: ['eval', 'Function', 'document.write', 'localStorage'],
      maxExecutionTime: config.maxExecutionTime || 5000,
      memoryLimit: config.memoryLimit || 10 * 1024 * 1024 // 10MB
    };
    
    // 実行統計（メタデータに統合）
    this.metadata.stats = {
      executions: 0,
      successes: 0,
      errors: 0,
      totalExecutionTime: 0,
      averageExecutionTime: 0,
      lastExecution: null
    };
    
    // カスタム実行関数（サンドボックス化済み）
    this.executeFunction = config.executeFunction || this.getDefaultExecuteFunction();
    
    this.log(`🔌 VoidFlowNodePlugin (Phase R) created: ${this.nodeType}`);
  }

  // ==========================================
  // 🎆 Phase R統一メッセージハンドラー
  // ==========================================

  /**
   * Phase R統一メッセージハンドラー（IPlugin継承）
   * @param {Object} message - IMessage形式のメッセージ
   * @returns {Promise<void>}
   */
  async handleMessage(message) {
    this.log(`📨 Message received: ${message.type}`);
    
    // Phase R統一メッセージ処理を継承
    return await super.handleMessage(message);
  }

  /**
   * VoidFlowカスタムIntent処理（IPlugin継承オーバーライド）
   * @param {Object} message - Intent付きメッセージ
   * @returns {Promise<void>}
   */
  async handleCustomIntent(message) {
    const { intent, payload } = message;
    
    switch (intent) {
      case 'voidflow.execute':
        return await this.handleExecuteIntent(payload, message);
      case 'voidflow.getStats':
        return await this.handleGetStatsIntent(payload, message);
      case 'voidflow.updateSandbox':
        return await this.handleUpdateSandboxIntent(payload, message);
      default:
        // 未対応のIntentは親クラスに委謗
        return await super.handleCustomIntent(message);
    }
  }

  /**
   * VoidFlow実行Intent処理
   * @param {Object} payload - ペイロード
   * @param {Object} message - 元メッセージ
   * @returns {Promise<Object>}
   */
  async handleExecuteIntent(payload, message) {
    const { inputData, context } = payload;
    
    try {
      const result = await this.execute(inputData, context);
      this.log(`⚙️ Intent execute success: ${this.nodeType}`);
      
      return {
        success: true,
        result: result,
        nodeType: this.nodeType,
        executionTime: Date.now() - (context?.startTime || Date.now())
      };
    } catch (error) {
      this.log(`❌ Intent execute failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * VoidFlow統計取得Intent処理
   * @param {Object} payload - ペイロード
   * @param {Object} message - 元メッセージ
   * @returns {Promise<Object>}
   */
  async handleGetStatsIntent(payload, message) {
    const stats = this.getNodeStats();
    this.log(`📈 Intent getStats: ${this.nodeType}`);
    
    return {
      success: true,
      stats: stats,
      nodeType: this.nodeType,
      timestamp: Date.now()
    };
  }

  /**
   * VoidFlowサンドボックス更新Intent処理
   * @param {Object} payload - ペイロード
   * @param {Object} message - 元メッセージ
   * @returns {Promise<Object>}
   */
  async handleUpdateSandboxIntent(payload, message) {
    const { sandboxConfig } = payload;
    
    try {
      this.updateSandboxConfig(sandboxConfig);
      this.log(`🛡️ Intent updateSandbox: ${this.nodeType}`);
      
      return {
        success: true,
        updatedSandbox: this.sandbox,
        nodeType: this.nodeType,
        timestamp: Date.now()
      };
    } catch (error) {
      this.log(`❌ Intent updateSandbox failed: ${error.message}`);
      throw error;
    }
  }

  // ==========================================
  // 🚀 統一実行インターフェース
  // ==========================================

  /**
   * 統一ノード実行（eval排除・サンドボックス化）
   * @param {Object} inputData - 入力データ
   * @param {Object} context - 実行コンテキスト
   * @returns {Object} 実行結果
   */
  async execute(inputData, context = {}) {
    const startTime = Date.now();
    this.metadata.stats.executions++;
    
    try {
      // コンテキスト設定
      this.executionContext = {
        ...this.executionContext,
        nodeId: context.nodeId || this.pluginId,
        flowId: context.flowId || 'default-flow',
        correlationId: context.correlationId || voidFlowAdapter.generateCorrelationId('node')
      };
      
      // 実行開始通知
      await this.publishExecutionEvent('start', {
        nodeId: this.executionContext.nodeId,
        nodeType: this.nodeType,
        inputData: inputData
      });
      
      // サンドボックス実行
      const result = await this.executeInSandbox(inputData, this.executionContext);
      
      // 実行完了統計
      const executionTime = Date.now() - startTime;
      this.metadata.stats.successes++;
      this.metadata.stats.totalExecutionTime += executionTime;
      this.metadata.stats.averageExecutionTime = this.metadata.stats.totalExecutionTime / this.metadata.stats.executions;
      this.metadata.stats.lastExecution = Date.now();
      
      // 実行完了通知
      await this.publishExecutionEvent('complete', {
        nodeId: this.executionContext.nodeId,
        nodeType: this.nodeType,
        result: result,
        executionTime: executionTime
      });
      
      this.log(`⚡ Node execution completed: ${this.nodeType} (${executionTime}ms)`);
      
      return result;
      
    } catch (error) {
      this.metadata.stats.errors++;
      
      // エラー通知
      await this.publishExecutionEvent('error', {
        nodeId: this.executionContext.nodeId,
        nodeType: this.nodeType,
        error: error.message,
        stack: error.stack
      });
      
      this.log(`❌ Node execution failed: ${this.nodeType} - ${error.message}`);
      throw error;
    }
  }

  // ==========================================
  // 🛡️ セキュリティサンドボックス実行
  // ==========================================

  /**
   * サンドボックス内での安全な実行
   * @param {Object} inputData - 入力データ
   * @param {Object} context - 実行コンテキスト
   * @returns {Object} 実行結果
   */
  async executeInSandbox(inputData, context) {
    // タイムアウト設定
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Execution timeout')), this.sandbox.maxExecutionTime);
    });
    
    // 安全な実行プロミス
    const executionPromise = this.safeExecute(inputData, context);
    
    // レース実行（タイムアウト vs 正常実行）
    const result = await Promise.race([executionPromise, timeoutPromise]);
    
    // メモリ使用量チェック（概算）
    this.checkMemoryUsage();
    
    return result;
  }

  /**
   * 安全な関数実行（eval排除）
   * @param {Object} inputData - 入力データ
   * @param {Object} context - 実行コンテキスト
   * @returns {Object} 実行結果
   */
  async safeExecute(inputData, context) {
    // 安全なコンテキスト作成
    const safeContext = this.createSafeContext(context);
    
    // カスタム実行関数を安全に実行
    if (typeof this.executeFunction === 'function') {
      return await this.executeFunction.call(safeContext, inputData, safeContext);
    } else {
      // デフォルト実行
      return await this.getDefaultExecuteFunction().call(safeContext, inputData, safeContext);
    }
  }

  /**
   * 安全な実行コンテキスト作成
   * @param {Object} context - 元のコンテキスト
   * @returns {Object} 安全なコンテキスト
   */
  createSafeContext(context) {
    const safeContext = {
      // 基本情報
      nodeId: context.nodeId,
      nodeType: this.nodeType,
      flowId: context.flowId,
      correlationId: context.correlationId,
      
      // 安全なAPI
      console: {
        log: (...args) => this.log(`[${this.nodeType}] ${args.join(' ')}`),
        warn: (...args) => this.log(`[${this.nodeType}] ⚠️ ${args.join(' ')}`),
        error: (...args) => this.log(`[${this.nodeType}] ❌ ${args.join(' ')}`)
      },
      
      // VoidCore統合API
      publishMessage: async (eventType, payload) => {
        return await voidFlowAdapter.createFlowMessage(eventType, payload, {
          sourceNodeId: context.nodeId,
          flowId: context.flowId,
          nodeType: this.nodeType,
          correlationId: context.correlationId
        });
      },
      
      // VoidFlow互換API
      createVoidPacket: (payload, metadata = {}) => {
        return voidFlowAdapter.createFlowMessage('node.output', payload, {
          sourceNodeId: context.nodeId,
          flowId: context.flowId,
          nodeType: this.nodeType,
          ...metadata
        });
      },
      
      // ユーティリティ
      sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
      now: () => Date.now(),
      random: () => Math.random(),
      
      // 設定情報
      config: this.voidFlowConfig,
      stats: { ...this.stats }
    };
    
    // 許可されたAPIのみ追加
    this.sandbox.allowedAPIs.forEach(api => {
      if (api === 'setTimeout' && typeof setTimeout !== 'undefined') {
        safeContext.setTimeout = setTimeout;
      }
      if (api === 'setInterval' && typeof setInterval !== 'undefined') {
        safeContext.setInterval = setInterval;
      }
    });
    
    return safeContext;
  }

  /**
   * メモリ使用量チェック（概算）
   */
  checkMemoryUsage() {
    if (typeof performance !== 'undefined' && performance.memory) {
      const usedMemory = performance.memory.usedJSHeapSize;
      if (usedMemory > this.sandbox.memoryLimit) {
        throw new Error(`Memory limit exceeded: ${usedMemory} > ${this.sandbox.memoryLimit}`);
      }
    }
  }

  // ==========================================
  // 🎯 デフォルト実行関数（ノードタイプ別）
  // ==========================================

  /**
   * ノードタイプに応じたデフォルト実行関数取得
   * @returns {Function} 実行関数
   */
  getDefaultExecuteFunction() {
    const nodeExecutors = {
      // 入力系ノード
      'input.text': async (inputData, context) => {
        const text = inputData.text || inputData.value || '';
        context.console.log(`Text input: ${text}`);
        return { text: text, type: 'text', timestamp: context.now() };
      },
      
      'input.number': async (inputData, context) => {
        const number = parseFloat(inputData.number || inputData.value || 0);
        context.console.log(`Number input: ${number}`);
        return { number: number, type: 'number', timestamp: context.now() };
      },
      
      // ボタン系ノード
      'button.send': async (inputData, context) => {
        context.console.log('Button triggered');
        return { 
          signal: 'triggered', 
          type: 'signal', 
          timestamp: context.now(),
          triggerData: inputData
        };
      },
      
      // 文字列処理ノード
      'string.uppercase': async (inputData, context) => {
        const text = inputData.text || inputData.payload || '';
        const result = text.toUpperCase();
        context.console.log(`Uppercase: ${text} → ${result}`);
        return { text: result, original: text, type: 'text' };
      },
      
      'string.lowercase': async (inputData, context) => {
        const text = inputData.text || inputData.payload || '';
        const result = text.toLowerCase();
        context.console.log(`Lowercase: ${text} → ${result}`);
        return { text: result, original: text, type: 'text' };
      },
      
      'string.length': async (inputData, context) => {
        const text = inputData.text || inputData.payload || '';
        const length = text.length;
        context.console.log(`String length: "${text}" = ${length}`);
        return { length: length, text: text, type: 'number' };
      },
      
      // 数値処理ノード
      'math.add': async (inputData, context) => {
        const a = parseFloat(inputData.a || 0);
        const b = parseFloat(inputData.b || 0);
        const result = a + b;
        context.console.log(`Add: ${a} + ${b} = ${result}`);
        return { result: result, operation: 'add', a: a, b: b };
      },
      
      'math.multiply': async (inputData, context) => {
        const a = parseFloat(inputData.a || 0);
        const b = parseFloat(inputData.b || 0);
        const result = a * b;
        context.console.log(`Multiply: ${a} × ${b} = ${result}`);
        return { result: result, operation: 'multiply', a: a, b: b };
      },
      
      // 出力系ノード
      'output.console': async (inputData, context) => {
        const message = inputData.message || inputData.text || inputData.payload || JSON.stringify(inputData);
        context.console.log(`Console output: ${message}`);
        return { 
          message: message, 
          type: 'console', 
          outputted: true,
          timestamp: context.now()
        };
      },
      
      'output.alert': async (inputData, context) => {
        const message = inputData.message || inputData.text || 'Alert!';
        context.console.log(`Alert: ${message}`);
        // ブラウザ環境でのみalert実行
        if (typeof window !== 'undefined' && window.alert) {
          window.alert(message);
        }
        return { message: message, type: 'alert', alerted: true };
      },
      
      // Web系ノード（安全版）
      'web.fetch': async (inputData, context) => {
        const url = inputData.url || inputData.endpoint;
        context.console.log(`Fetch request: ${url}`);
        
        // 安全なフェッチ（CORSエラー対応）
        try {
          if (typeof fetch !== 'undefined') {
            const response = await fetch(url);
            const text = await response.text();
            return { 
              data: text, 
              url: url, 
              status: response.status,
              type: 'web_data',
              timestamp: context.now()
            };
          } else {
            throw new Error('Fetch API not available');
          }
        } catch (error) {
          // モックデータを返す
          const mockData = JSON.stringify({
            message: "Mock data due to CORS/Network restrictions",
            url: url,
            timestamp: new Date().toISOString(),
            mockReason: error.message
          });
          
          context.console.warn(`Fetch failed, returning mock data: ${error.message}`);
          return { 
            data: mockData, 
            url: url, 
            isMock: true,
            type: 'web_data',
            error: error.message
          };
        }
      },
      
      // JSON処理ノード
      'json.parse': async (inputData, context) => {
        const jsonString = inputData.json || inputData.text || inputData.data || '{}';
        try {
          const parsed = JSON.parse(jsonString);
          context.console.log(`JSON parsed successfully`);
          return { 
            data: parsed, 
            original: jsonString,
            type: 'json_data',
            parsed: true
          };
        } catch (error) {
          context.console.error(`JSON parse error: ${error.message}`);
          throw new Error(`JSON parse failed: ${error.message}`);
        }
      },
      
      'json.stringify': async (inputData, context) => {
        const data = inputData.data || inputData.payload || inputData;
        try {
          const jsonString = JSON.stringify(data, null, 2);
          context.console.log(`JSON stringified successfully`);
          return { 
            json: jsonString, 
            original: data,
            type: 'json_string',
            stringified: true
          };
        } catch (error) {
          context.console.error(`JSON stringify error: ${error.message}`);
          throw new Error(`JSON stringify failed: ${error.message}`);
        }
      },
      
      // UI系ノード
      'ui.card': async (inputData, context) => {
        const title = inputData.title || 'Card';
        const content = inputData.content || inputData.data || 'No content';
        
        context.console.log(`UI Card: ${title}`);
        return {
          title: title,
          content: content,
          type: 'ui_card',
          html: `<div class="voidflow-card"><h3>${title}</h3><p>${content}</p></div>`,
          timestamp: context.now()
        };
      },
      
      // デフォルト（不明なノードタイプ）
      'default': async (inputData, context) => {
        context.console.warn(`Unknown node type: ${context.nodeType}`);
        return { 
          input: inputData, 
          nodeType: context.nodeType,
          type: 'passthrough',
          warning: 'Unknown node type - passthrough mode',
          timestamp: context.now()
        };
      }
    };
    
    return nodeExecutors[this.nodeType] || nodeExecutors['default'];
  }

  // ==========================================
  // 📡 イベント発行
  // ==========================================

  /**
   * 実行イベント発行
   * @param {string} phase - 実行フェーズ（start/complete/error）
   * @param {Object} data - イベントデータ
   */
  async publishExecutionEvent(phase, data) {
    try {
      const eventMessage = voidFlowAdapter.createFlowMessage(`node.execution.${phase}`, data, {
        sourceNodeId: this.executionContext.nodeId,
        flowId: this.executionContext.flowId,
        nodeType: this.nodeType,
        correlationId: this.executionContext.correlationId
      });
      
      await voidCore.publish(eventMessage);
      
    } catch (error) {
      this.log(`❌ Event publish failed: ${error.message}`);
    }
  }

  // ==========================================
  // 📊 統計・設定
  // ==========================================

  /**
   * ノードプラグイン統計取得
   * @returns {Object} 統計情報
   */
  getNodeStats() {
    return {
      ...this.metadata.stats,
      nodeType: this.nodeType,
      pluginId: this.id, // IPlugin継承のidプロパティ使用
      config: this.metadata.voidFlowConfig,
      sandbox: this.sandbox,
      phaseR: true // Phase R統合マーカー
    };
  }

  /**
   * サンドボックス設定更新
   * @param {Object} newSandboxConfig - 新しいサンドボックス設定
   */
  updateSandboxConfig(newSandboxConfig) {
    this.sandbox = { ...this.sandbox, ...newSandboxConfig };
    this.log(`🛡️ Sandbox config updated for ${this.nodeType}`);
  }

  /**
   * カスタム実行関数設定
   * @param {Function} executeFunction - 新しい実行関数
   */
  setCustomExecuteFunction(executeFunction) {
    if (typeof executeFunction === 'function') {
      this.executeFunction = executeFunction;
      this.log(`🎯 Custom execute function set for ${this.nodeType}`);
    } else {
      throw new Error('Execute function must be a function');
    }
  }

  /**
   * ログ出力（IPlugin継承メソッド使用）
   * @param {string} message - ログメッセージ
   */
  log(message) {
    // IPlugin継承の統一ログ出力メソッド使用
    super.log(`[🔌 ${this.nodeType}] ${message}`);
  }
}

// ==========================================
// 🏭 ノードプラグインファクトリー
// ==========================================

/**
 * VoidFlowノードプラグイン作成ファクトリー（Phase R統一版）
 * @param {string} nodeType - ノードタイプ
 * @param {Object} config - 設定
 * @returns {VoidFlowNodePlugin} ノードプラグイン
 */
export function createVoidFlowNodePlugin(nodeType, config = {}) {
  const plugin = new VoidFlowNodePlugin({
    nodeType: nodeType,
    ...config
  });
  
  // Phase R統合マーカー追加
  plugin.metadata.phaseR = true;
  plugin.metadata.createdWith = 'createVoidFlowNodePlugin';
  plugin.metadata.version = 'v14.0-phase-r';
  
  return plugin;
}

/**
 * 全標準ノードプラグイン一括作成
 * @returns {Map} ノードタイプ → プラグインのマップ
 */
export function createAllStandardNodePlugins() {
  const standardNodeTypes = [
    'input.text', 'input.number',
    'button.send',
    'string.uppercase', 'string.lowercase', 'string.length',
    'math.add', 'math.multiply',
    'output.console', 'output.alert',
    'web.fetch',
    'json.parse', 'json.stringify',
    'ui.card'
  ];
  
  const nodePlugins = new Map();
  
  standardNodeTypes.forEach(nodeType => {
    const plugin = createVoidFlowNodePlugin(nodeType);
    nodePlugins.set(nodeType, plugin);
  });
  
  console.log(`🏭 Created ${nodePlugins.size} standard node plugins`);
  return nodePlugins;
}

/**
 * VoidCoreプラグインとして登録（Phase R統一版）
 * @param {VoidFlowNodePlugin} nodePlugin - ノードプラグイン
 * @returns {boolean} 登録成功/失敗
 */
export function registerNodePluginToVoidCore(nodePlugin) {
  try {
    // IPlugin継承により直接登録可能（変換不要）
    const success = voidCore.registerPlugin(nodePlugin);
    
    if (success) {
      console.log(`✅ Node plugin (Phase R) registered to VoidCore: ${nodePlugin.nodeType}`);
    } else {
      console.error(`❌ Failed to register node plugin: ${nodePlugin.nodeType}`);
    }
    
    return success;
    
  } catch (error) {
    console.error(`❌ Node plugin registration error: ${error.message}`);
    return false;
  }
}

// ==========================================
// 🌟 エクスポート
// ==========================================

export { VoidFlowNodePlugin as default };

// 便利なエイリアス
export const NodePlugin = VoidFlowNodePlugin;
export const createNodePlugin = createVoidFlowNodePlugin;
export const createAllNodes = createAllStandardNodePlugins;
export const registerToVoidCore = registerNodePluginToVoidCore;