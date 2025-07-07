// voidflow-message-adapter.js - VoidFlow-VoidCore統合アダプター
// Phase 5.3: VoidPacket ↔ VoidCore Message 双方向変換システム

import { Message } from './message.js';
import { voidCore } from './voidcore.js';

/**
 * 🌉 VoidFlowMessageAdapter - VoidFlow-VoidCore メッセージ橋渡し
 * 
 * VoidFlowの独自VoidPacketシステムとVoidCoreの純粋メッセージシステムを
 * シームレスに統合するアダプターレイヤー
 * 
 * 哲学: 「異なる世界の言語を統一する翻訳者」
 */
export class VoidFlowMessageAdapter {
  constructor(voidCore) {
    this.voidCore = voidCore;
    this.flowChannels = new Map(); // flowId -> channel info
    this.messageHistory = new Map(); // correlationId -> message chain
    this.adapterId = `voidflow-adapter-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    // Phase 5.3統計
    this.stats = {
      adaptedMessages: 0,
      voidPacketsConverted: 0,
      flowMessagesCreated: 0,
      errorCount: 0,
      startTime: Date.now()
    };
    
    this.log('🌉 VoidFlowMessageAdapter initialized');
  }

  // ==========================================
  // 🎯 VoidPacket → VoidCore Message 変換
  // ==========================================

  /**
   * VoidPacketをVoidCore Messageに変換
   * @param {Object} voidPacket - VoidFlowのVoidPacket
   * @param {Object} metadata - 追加メタデータ
   * @returns {Object} VoidCore Message
   */
  adaptVoidPacketToMessage(voidPacket, metadata = {}) {
    try {
      if (!voidPacket) {
        throw new Error('VoidPacket is required');
      }

      // VoidFlow専用Notice作成
      const flowMessage = Message.notice('voidflow.data', {
        // VoidPacket内容
        payload: voidPacket.payload,
        sourceNodeId: voidPacket.sourceNodeId,
        timestamp: voidPacket.timestamp || Date.now(),
        error: voidPacket.error || null,
        
        // VoidFlow統合情報
        flowId: metadata.flowId || 'default-flow',
        targetNodeId: metadata.targetNodeId || null,
        nodeType: metadata.nodeType || 'unknown',
        executionId: metadata.executionId || null,
        
        // Phase 5.3統合メタデータ
        adapterId: this.adapterId,
        originalFormat: 'VoidPacket',
        convertedAt: Date.now(),
        correlationId: metadata.correlationId || this.generateCorrelationId()
      });

      this.stats.voidPacketsConverted++;
      this.stats.adaptedMessages++;
      
      this.log(`📦 VoidPacket→Message: ${voidPacket.sourceNodeId} (${metadata.nodeType})`);
      
      return flowMessage;
      
    } catch (error) {
      this.stats.errorCount++;
      this.log(`❌ VoidPacket conversion failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * VoidCore MessageをVoidPacketに逆変換
   * @param {Object} voidCoreMessage - VoidCore Message
   * @returns {Object} VoidPacket
   */
  adaptMessageToVoidPacket(voidCoreMessage) {
    try {
      if (!voidCoreMessage || voidCoreMessage.category !== 'Notice') {
        throw new Error('Valid VoidCore Notice message required');
      }

      if (!voidCoreMessage.event_name.startsWith('voidflow.')) {
        throw new Error('Not a VoidFlow message');
      }

      const payload = voidCoreMessage.payload;
      
      // 従来のVoidPacket形式に変換
      const voidPacket = {
        payload: payload.payload,
        timestamp: payload.timestamp,
        sourceNodeId: payload.sourceNodeId,
        error: payload.error,
        
        // VoidFlow統合情報を付加
        __voidflow_metadata: {
          flowId: payload.flowId,
          targetNodeId: payload.targetNodeId,
          nodeType: payload.nodeType,
          correlationId: payload.correlationId,
          adapterId: payload.adapterId,
          originalFormat: 'VoidCoreMessage'
        }
      };

      this.log(`📨 Message→VoidPacket: ${payload.sourceNodeId}`);
      
      return voidPacket;
      
    } catch (error) {
      this.stats.errorCount++;
      this.log(`❌ Message conversion failed: ${error.message}`);
      throw error;
    }
  }

  // ==========================================
  // 🚀 VoidFlow専用メッセージ作成
  // ==========================================

  /**
   * VoidFlow専用統一メッセージ作成
   * @param {string} eventType - イベントタイプ
   * @param {Object} payload - ペイロード
   * @param {Object} metadata - メタデータ
   * @returns {Object} VoidCore Message
   */
  createFlowMessage(eventType, payload, metadata = {}) {
    try {
      const eventName = `voidflow.${eventType}`;
      
      const flowMessage = Message.notice(eventName, {
        // メインペイロード
        payload: payload,
        
        // ノード情報
        sourceNodeId: metadata.sourceNodeId || null,
        targetNodeId: metadata.targetNodeId || null,
        nodeType: metadata.nodeType || 'unknown',
        
        // フロー情報
        flowId: metadata.flowId || 'default-flow',
        executionId: metadata.executionId || this.generateExecutionId(),
        
        // 追跡情報
        correlationId: metadata.correlationId || this.generateCorrelationId(),
        causationId: metadata.causationId || null,
        
        // Phase 5.3統合情報
        adapterId: this.adapterId,
        createdAt: Date.now(),
        adapterVersion: '5.3.0'
      });

      this.stats.flowMessagesCreated++;
      this.stats.adaptedMessages++;
      
      this.log(`🌟 FlowMessage created: ${eventName} (${metadata.sourceNodeId})`);
      
      return flowMessage;
      
    } catch (error) {
      this.stats.errorCount++;
      this.log(`❌ FlowMessage creation failed: ${error.message}`);
      throw error;
    }
  }

  // ==========================================
  // 🔄 フロー実行支援メソッド
  // ==========================================

  /**
   * ノード実行用メッセージ作成
   * @param {string} nodeId - ノードID
   * @param {Object} inputData - 入力データ
   * @param {Object} nodeInfo - ノード情報
   * @returns {Object} 実行用メッセージ
   */
  createNodeExecutionMessage(nodeId, inputData, nodeInfo = {}) {
    return this.createFlowMessage('node.execute', inputData, {
      sourceNodeId: nodeId,
      nodeType: nodeInfo.type || 'unknown',
      flowId: nodeInfo.flowId || 'default-flow',
      executionId: this.generateExecutionId(),
      correlationId: this.generateCorrelationId()
    });
  }

  /**
   * ノード結果用メッセージ作成
   * @param {string} nodeId - ノードID
   * @param {Object} resultData - 結果データ
   * @param {Object} executionInfo - 実行情報
   * @returns {Object} 結果用メッセージ
   */
  createNodeResultMessage(nodeId, resultData, executionInfo = {}) {
    return this.createFlowMessage('node.result', resultData, {
      sourceNodeId: nodeId,
      nodeType: executionInfo.nodeType || 'unknown',
      flowId: executionInfo.flowId || 'default-flow',
      executionId: executionInfo.executionId,
      correlationId: executionInfo.correlationId,
      causationId: executionInfo.correlationId // 因果関係
    });
  }

  /**
   * フロー完了用メッセージ作成
   * @param {string} flowId - フローID
   * @param {Object} flowResults - フロー結果
   * @returns {Object} 完了用メッセージ
   */
  createFlowCompletionMessage(flowId, flowResults) {
    return this.createFlowMessage('flow.completed', flowResults, {
      flowId: flowId,
      executionId: this.generateExecutionId(),
      correlationId: this.generateCorrelationId()
    });
  }

  // ==========================================
  // 🌊 VoidCore統合支援
  // ==========================================

  /**
   * VoidFlowメッセージ監視開始
   * @param {string} flowId - 監視するフローID
   * @param {Function} handler - メッセージハンドラー
   */
  async startFlowMessageMonitoring(flowId, handler) {
    try {
      // VoidFlow専用メッセージを監視
      const unsubscribe = await this.voidCore.subscribe('Notice', async (message) => {
        if (message.event_name.startsWith('voidflow.') && 
            message.payload.flowId === flowId) {
          
          try {
            await handler(message);
          } catch (error) {
            this.log(`❌ Flow message handler error: ${error.message}`);
          }
        }
      });

      this.flowChannels.set(flowId, {
        unsubscribe: unsubscribe,
        handler: handler,
        startedAt: Date.now()
      });

      this.log(`👁️ Flow monitoring started: ${flowId}`);
      return unsubscribe;
      
    } catch (error) {
      this.log(`❌ Flow monitoring setup failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * VoidFlowメッセージ監視停止
   * @param {string} flowId - フローID
   */
  stopFlowMessageMonitoring(flowId) {
    const channelInfo = this.flowChannels.get(flowId);
    if (channelInfo) {
      channelInfo.unsubscribe();
      this.flowChannels.delete(flowId);
      this.log(`🛑 Flow monitoring stopped: ${flowId}`);
    }
  }

  // ==========================================
  // 🛠️ ユーティリティ
  // ==========================================

  /**
   * 相関ID生成
   * @param {string} prefix - プレフィックス
   * @returns {string} 相関ID
   */
  generateCorrelationId(prefix = 'voidflow') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
  }

  /**
   * 実行ID生成
   * @returns {string} 実行ID
   */
  generateExecutionId() {
    return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * アダプター統計情報取得
   * @returns {Object} 統計情報
   */
  getAdapterStats() {
    const runtime = Date.now() - this.stats.startTime;
    
    return {
      ...this.stats,
      runtime: runtime,
      messagesPerSecond: this.stats.adaptedMessages / (runtime / 1000),
      errorRate: this.stats.errorCount / Math.max(this.stats.adaptedMessages, 1),
      activeFlows: this.flowChannels.size,
      adapterId: this.adapterId
    };
  }

  /**
   * アダプター統計リセット
   */
  resetAdapterStats() {
    this.stats = {
      adaptedMessages: 0,
      voidPacketsConverted: 0,
      flowMessagesCreated: 0,
      errorCount: 0,
      startTime: Date.now()
    };
    
    this.log('📊 Adapter stats reset');
  }

  /**
   * ログ出力
   * @param {string} message - ログメッセージ
   */
  log(message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] 🌉 VoidFlowAdapter: ${message}`);
    
    // VoidCoreログにも出力
    if (this.voidCore && this.voidCore.log) {
      this.voidCore.log(`🌉 ${message}`);
    }
  }

  /**
   * アダプター終了処理
   */
  async destroy() {
    // 全フロー監視停止
    for (const [flowId] of this.flowChannels) {
      this.stopFlowMessageMonitoring(flowId);
    }
    
    this.log('🔚 VoidFlowMessageAdapter destroyed');
  }
}

// デフォルトアダプターインスタンス作成
export const voidFlowAdapter = new VoidFlowMessageAdapter(voidCore);

// レガシー互換用エイリアス
export const createFlowMessage = (eventType, payload, metadata) => 
  voidFlowAdapter.createFlowMessage(eventType, payload, metadata);

export const adaptVoidPacket = (voidPacket, metadata) => 
  voidFlowAdapter.adaptVoidPacketToMessage(voidPacket, metadata);