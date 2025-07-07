// voidflow-integration-wrapper.js - VoidFlow統合互換ラッパー
// Phase 5.3: 既存VoidFlow機能との完全互換性維持レイヤー

import { voidFlowAdapter } from './voidflow-message-adapter.js';
import { voidCore } from './voidcore.js';

/**
 * 🎭 VoidFlowIntegrationWrapper - 完全互換性保証
 * 
 * 既存のVoidFlowEngineと100%互換性を保ちながら、
 * 内部的にVoidCoreメッセージシステムを使用する統合ラッパー
 * 
 * 哲学: 「外見は変えず、魂を統一する」
 */
export class VoidFlowIntegrationWrapper {
  constructor(originalVoidFlowEngine) {
    this.originalEngine = originalVoidFlowEngine;
    this.adapter = voidFlowAdapter;
    this.voidCore = voidCore;
    
    // 互換性維持フラグ
    this.compatibilityMode = true;
    this.legacySupport = true;
    
    // 統合統計
    this.integrationStats = {
      legacyCalls: 0,
      unifiedCalls: 0,
      errors: 0,
      startTime: Date.now()
    };
    
    // 既存APIをオーバーライド
    this.wrapExistingMethods();
    
    this.log('🎭 VoidFlow Integration Wrapper initialized');
  }

  // ==========================================
  // 🔄 既存メソッドのオーバーライド
  // ==========================================

  /**
   * 既存VoidFlowEngineメソッドをラップ
   */
  wrapExistingMethods() {
    // createVoidPacket メソッドをオーバーライド
    this.originalCreateVoidPacket = this.originalEngine.createVoidPacket.bind(this.originalEngine);
    this.originalEngine.createVoidPacket = this.createVoidPacket.bind(this);
    
    // executeNode メソッドをオーバーライド
    this.originalExecuteNode = this.originalEngine.executeNode.bind(this.originalEngine);
    this.originalEngine.executeNode = this.executeNode.bind(this);
    
    // executeFromNode メソッドをオーバーライド
    this.originalExecuteFromNode = this.originalEngine.executeFromNode.bind(this.originalEngine);
    this.originalEngine.executeFromNode = this.executeFromNode.bind(this);
    
    // log メソッドをオーバーライド
    this.originalLog = this.originalEngine.log.bind(this.originalEngine);
    this.originalEngine.log = this.log.bind(this);
    
    this.log('🔄 Existing methods wrapped for integration');
  }

  // ==========================================
  // 🎯 統合版 createVoidPacket
  // ==========================================

  /**
   * 統合版VoidPacket作成（互換性維持）
   * @param {*} payload - ペイロード
   * @param {Object} metadata - メタデータ
   * @returns {Object} 統合VoidPacket
   */
  createVoidPacket(payload, metadata = {}) {
    try {
      this.integrationStats.unifiedCalls++;
      
      // 従来のVoidPacket作成
      const legacyPacket = this.originalCreateVoidPacket(payload, metadata);
      
      // VoidCoreメッセージも同時作成
      const voidCoreMessage = this.adapter.adaptVoidPacketToMessage(legacyPacket, {
        flowId: this.originalEngine.flowId || 'default-flow',
        nodeType: metadata.nodeType || 'unknown',
        executionId: metadata.executionId,
        correlationId: metadata.correlationId
      });
      
      // 統合VoidPacket（レガシー互換 + VoidCore統合）
      const integratedPacket = {
        ...legacyPacket,
        
        // 従来互換フィールド維持
        payload: legacyPacket.payload,
        timestamp: legacyPacket.timestamp,
        sourceNodeId: legacyPacket.sourceNodeId,
        error: legacyPacket.error,
        
        // VoidCore統合情報
        __voidcore_integration: {
          message: voidCoreMessage,
          adapterId: this.adapter.adapterId,
          integratedAt: Date.now(),
          version: '5.3.0'
        },
        
        // 統合API
        toVoidCoreMessage: () => voidCoreMessage,
        publish: async () => await this.voidCore.publish(voidCoreMessage),
        getCorrelationId: () => voidCoreMessage.payload.correlationId
      };
      
      this.log(`📦 Integrated VoidPacket created: ${legacyPacket.sourceNodeId}`);
      
      return integratedPacket;
      
    } catch (error) {
      this.integrationStats.errors++;
      this.log(`❌ Integrated VoidPacket creation failed: ${error.message}`);
      
      // フォールバック: 従来のVoidPacket
      this.integrationStats.legacyCalls++;
      return this.originalCreateVoidPacket(payload, metadata);
    }
  }

  // ==========================================
  // 🚀 統合版 executeNode
  // ==========================================

  /**
   * 統合版ノード実行（VoidCoreメッセージ対応）
   * @param {string} nodeId - ノードID
   * @param {Object} inputPacket - 入力パケット
   * @returns {Object} 実行結果
   */
  async executeNode(nodeId, inputPacket) {
    try {
      this.integrationStats.unifiedCalls++;
      
      // 実行開始通知（VoidCore Message）
      const executionStartMessage = this.adapter.createFlowMessage('node.execution.start', {
        nodeId: nodeId,
        inputData: inputPacket,
        startTime: Date.now()
      }, {
        sourceNodeId: nodeId,
        flowId: this.originalEngine.flowId || 'default-flow',
        nodeType: this.getNodeType(nodeId)
      });
      
      await this.voidCore.publish(executionStartMessage);
      
      // 従来の実行処理
      const result = await this.originalExecuteNode(nodeId, inputPacket);
      
      // 実行完了通知（VoidCore Message）
      const executionCompleteMessage = this.adapter.createFlowMessage('node.execution.complete', {
        nodeId: nodeId,
        result: result,
        executionTime: Date.now() - executionStartMessage.payload.startTime
      }, {
        sourceNodeId: nodeId,
        flowId: this.originalEngine.flowId || 'default-flow',
        nodeType: this.getNodeType(nodeId),
        correlationId: executionStartMessage.payload.correlationId,
        causationId: executionStartMessage.payload.correlationId
      });
      
      await this.voidCore.publish(executionCompleteMessage);
      
      this.log(`⚡ Integrated node execution: ${nodeId} (${this.getNodeType(nodeId)})`);
      
      return result;
      
    } catch (error) {
      this.integrationStats.errors++;
      
      // エラー通知（VoidCore Message）
      const errorMessage = this.adapter.createFlowMessage('node.execution.error', {
        nodeId: nodeId,
        error: error.message,
        stack: error.stack
      }, {
        sourceNodeId: nodeId,
        flowId: this.originalEngine.flowId || 'default-flow',
        nodeType: this.getNodeType(nodeId)
      });
      
      await this.voidCore.publish(errorMessage);
      
      this.log(`❌ Integrated node execution failed: ${nodeId} - ${error.message}`);
      
      // フォールバック: 従来の実行
      this.integrationStats.legacyCalls++;
      return await this.originalExecuteNode(nodeId, inputPacket);
    }
  }

  // ==========================================
  // 🌊 統合版 executeFromNode
  // ==========================================

  /**
   * 統合版フロー実行（VoidCoreメッセージ伝搬）
   * @param {string} nodeId - 開始ノードID
   * @param {Object} inputPacket - 入力パケット
   * @returns {Object} 実行結果
   */
  async executeFromNode(nodeId, inputPacket) {
    try {
      this.integrationStats.unifiedCalls++;
      
      // フロー開始通知
      const flowStartMessage = this.adapter.createFlowMessage('flow.execution.start', {
        startNodeId: nodeId,
        flowId: this.originalEngine.flowId || 'default-flow',
        inputData: inputPacket
      }, {
        sourceNodeId: nodeId,
        flowId: this.originalEngine.flowId || 'default-flow'
      });
      
      await this.voidCore.publish(flowStartMessage);
      
      // 統合ノード実行
      const result = await this.executeNode(nodeId, inputPacket);
      
      // 接続先ノードへの統合伝搬
      await this.propagateToConnectedNodes(nodeId, result, flowStartMessage.payload.correlationId);
      
      // フロー完了通知
      const flowCompleteMessage = this.adapter.createFlowMessage('flow.execution.complete', {
        startNodeId: nodeId,
        flowId: this.originalEngine.flowId || 'default-flow',
        result: result
      }, {
        sourceNodeId: nodeId,
        flowId: this.originalEngine.flowId || 'default-flow',
        correlationId: flowStartMessage.payload.correlationId,
        causationId: flowStartMessage.payload.correlationId
      });
      
      await this.voidCore.publish(flowCompleteMessage);
      
      this.log(`🌊 Integrated flow execution: ${nodeId} → completed`);
      
      return result;
      
    } catch (error) {
      this.integrationStats.errors++;
      this.log(`❌ Integrated flow execution failed: ${error.message}`);
      
      // フォールバック: 従来のフロー実行
      this.integrationStats.legacyCalls++;
      return await this.originalExecuteFromNode(nodeId, inputPacket);
    }
  }

  // ==========================================
  // 🔗 統合版接続先伝搬
  // ==========================================

  /**
   * 接続先ノードへの統合メッセージ伝搬
   * @param {string} sourceNodeId - ソースノードID
   * @param {Object} result - 実行結果
   * @param {string} correlationId - 相関ID
   */
  async propagateToConnectedNodes(sourceNodeId, result, correlationId) {
    try {
      const connectedEdges = Array.from(this.originalEngine.edges.values())
        .filter(e => e.sourceNodeId === sourceNodeId);

      if (connectedEdges.length === 0) {
        return; // 接続先なし
      }

      // 伝搬開始通知
      const propagationMessage = this.adapter.createFlowMessage('flow.propagation.start', {
        sourceNodeId: sourceNodeId,
        targetNodes: connectedEdges.map(e => e.targetNodeId),
        connectionCount: connectedEdges.length
      }, {
        sourceNodeId: sourceNodeId,
        flowId: this.originalEngine.flowId || 'default-flow',
        correlationId: correlationId
      });
      
      await this.voidCore.publish(propagationMessage);

      // 並列実行（VoidCoreメッセージ対応）
      const promises = connectedEdges.map(async (edge) => {
        // 接続メッセージ
        const connectionMessage = this.adapter.createFlowMessage('flow.connection.data', result, {
          sourceNodeId: sourceNodeId,
          targetNodeId: edge.targetNodeId,
          flowId: this.originalEngine.flowId || 'default-flow',
          connectionId: edge.id,
          correlationId: correlationId
        });
        
        await this.voidCore.publish(connectionMessage);
        
        // 従来の遅延維持（視覚効果）
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // 統合実行
        return this.executeFromNode(edge.targetNodeId, result);
      });

      await Promise.all(promises);
      
      this.log(`🔗 Propagated to ${connectedEdges.length} connected nodes`);
      
    } catch (error) {
      this.log(`❌ Propagation failed: ${error.message}`);
      throw error;
    }
  }

  // ==========================================
  // 📊 統合版ログ
  // ==========================================

  /**
   * 統合版ログ（VoidCore + レガシー）
   * @param {string} message - ログメッセージ
   */
  log(message) {
    // 従来のログ出力
    this.originalLog(message);
    
    // VoidCoreメッセージとしても発行
    const logMessage = this.adapter.createFlowMessage('flow.log', {
      message: message,
      level: 'info',
      source: 'VoidFlowIntegration'
    }, {
      flowId: this.originalEngine.flowId || 'default-flow',
      sourceNodeId: 'integration-wrapper'
    });
    
    // 非同期でVoidCoreに送信（ログの遅延防止）
    this.voidCore.publish(logMessage).catch(error => {
      console.error('VoidCore log publish failed:', error);
    });
  }

  // ==========================================
  // 🛠️ ユーティリティ
  // ==========================================

  /**
   * ノードタイプ取得
   * @param {string} nodeId - ノードID
   * @returns {string} ノードタイプ
   */
  getNodeType(nodeId) {
    const node = this.originalEngine.nodes.get(nodeId);
    return node ? node.type : 'unknown';
  }

  /**
   * 統合統計情報取得
   * @returns {Object} 統計情報
   */
  getIntegrationStats() {
    const runtime = Date.now() - this.integrationStats.startTime;
    const totalCalls = this.integrationStats.unifiedCalls + this.integrationStats.legacyCalls;
    
    return {
      ...this.integrationStats,
      runtime: runtime,
      totalCalls: totalCalls,
      unificationRate: totalCalls > 0 ? this.integrationStats.unifiedCalls / totalCalls : 0,
      errorRate: totalCalls > 0 ? this.integrationStats.errors / totalCalls : 0,
      adapterStats: this.adapter.getAdapterStats()
    };
  }

  /**
   * 互換性モード切り替え
   * @param {boolean} enabled - 互換性モード有効/無効
   */
  setCompatibilityMode(enabled) {
    this.compatibilityMode = enabled;
    this.log(`🎭 Compatibility mode: ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * レガシーサポート切り替え
   * @param {boolean} enabled - レガシーサポート有効/無効
   */
  setLegacySupport(enabled) {
    this.legacySupport = enabled;
    this.log(`🏛️ Legacy support: ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * 統合ラッパー解除
   */
  unwrap() {
    // 元のメソッドを復元
    this.originalEngine.createVoidPacket = this.originalCreateVoidPacket;
    this.originalEngine.executeNode = this.originalExecuteNode;
    this.originalEngine.executeFromNode = this.originalExecuteFromNode;
    this.originalEngine.log = this.originalLog;
    
    this.log('🎭 VoidFlow Integration Wrapper unwrapped');
  }
}

/**
 * VoidFlowEngine統合ヘルパー関数
 * @param {Object} voidFlowEngine - 既存VoidFlowEngine
 * @returns {VoidFlowIntegrationWrapper} 統合ラッパー
 */
export function wrapVoidFlowEngine(voidFlowEngine) {
  return new VoidFlowIntegrationWrapper(voidFlowEngine);
}

/**
 * グローバル統合適用
 * @param {Object} voidFlowEngine - VoidFlowEngine
 */
export function applyVoidFlowIntegration(voidFlowEngine) {
  const wrapper = wrapVoidFlowEngine(voidFlowEngine);
  
  // グローバル参照設定
  if (typeof window !== 'undefined') {
    window.voidFlowIntegration = wrapper;
  }
  
  return wrapper;
}