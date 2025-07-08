// voidflow-message-adapter.js - VoidPacket ↔ VoidCore Message 変換アダプター

import { Message } from '/src/message.js'

/**
 * 🔄 VoidFlowMessageAdapter - VoidPacketとVoidCore Messageの双方向変換
 * 
 * 目的:
 * - 既存VoidFlow（VoidPacket）と新VoidCore（Message）の橋渡し
 * - 段階的移行の支援
 * - 互換性レイヤーの提供
 */
export class VoidFlowMessageAdapter {
  constructor(voidCoreUI) {
    this.voidCoreUI = voidCoreUI
    this.flowIdCounter = 0
    this.activeFlows = new Map() // flowId → flow metadata
    this.messageHistory = []
    
    this.log('🔄 VoidFlowMessageAdapter initialized')
  }

  /**
   * 📝 ログ出力
   */
  log(message) {
    if (this.voidCoreUI && this.voidCoreUI.debugMode) {
      console.log(`[VoidFlowMessageAdapter] ${message}`)
    }
  }

  /**
   * 🎯 Flow ID生成
   */
  generateFlowId() {
    return `flow-${++this.flowIdCounter}-${Date.now()}`
  }

  /**
   * 📦 VoidPacket → VoidCore Message 変換
   */
  adaptVoidPacket(voidPacket, options = {}) {
    try {
      // VoidPacketの基本構造確認
      if (!voidPacket || typeof voidPacket !== 'object') {
        throw new Error('Invalid VoidPacket: must be object')
      }
      
      // Flow IDの取得または生成
      const flowId = options.flowId || voidPacket.flowId || this.generateFlowId()
      
      // VoidCore Message作成
      const message = Message.notice('voidflow.data', {
        // 基本データ
        payload: voidPacket.payload,
        sourceNodeId: voidPacket.sourceNodeId || options.sourceNodeId,
        targetNodeId: voidPacket.targetNodeId || options.targetNodeId,
        
        // Flow管理
        flowId: flowId,
        executionId: voidPacket.executionId || `exec-${Date.now()}`,
        
        // メタデータ
        timestamp: voidPacket.timestamp || Date.now(),
        error: voidPacket.error || null,
        connectionType: options.connectionType || 'data-flow',
        
        // 変換情報
        adaptedFrom: 'VoidPacket',
        adapterVersion: '1.0',
        originalPacket: this.sanitizeForLogging(voidPacket)
      })
      
      // Flow記録更新
      this.updateFlowRecord(flowId, 'packet_to_message', voidPacket, message)
      
      this.log(`📦 VoidPacket → Message: ${voidPacket.sourceNodeId} → ${voidPacket.targetNodeId}`)
      
      return message
      
    } catch (error) {
      this.log(`❌ VoidPacket adaptation failed: ${error.message}`)
      throw new Error(`VoidPacket adaptation failed: ${error.message}`)
    }
  }

  /**
   * 💌 VoidCore Message → VoidPacket 変換
   */
  adaptMessage(message, options = {}) {
    try {
      // Message構造確認
      if (!message || !message.payload) {
        throw new Error('Invalid VoidCore Message: missing payload')
      }
      
      const payload = message.payload
      
      // VoidPacket作成
      const voidPacket = {
        // 基本データ
        payload: payload.payload || payload.data || payload,
        sourceNodeId: payload.sourceNodeId,
        targetNodeId: payload.targetNodeId,
        
        // メタデータ
        timestamp: payload.timestamp || Date.now(),
        error: payload.error || null,
        
        // Flow情報（オプション）
        flowId: payload.flowId,
        executionId: payload.executionId,
        
        // 変換情報
        adaptedFrom: 'VoidCoreMessage',
        adapterVersion: '1.0',
        messageType: message.type,
        eventName: message.event_name
      }
      
      // Flow記録更新
      if (payload.flowId) {
        this.updateFlowRecord(payload.flowId, 'message_to_packet', message, voidPacket)
      }
      
      this.log(`💌 Message → VoidPacket: ${payload.sourceNodeId} → ${payload.targetNodeId}`)
      
      return voidPacket
      
    } catch (error) {
      this.log(`❌ Message adaptation failed: ${error.message}`)
      throw new Error(`Message adaptation failed: ${error.message}`)
    }
  }

  /**
   * 🔗 ノード接続メッセージ作成
   */
  createConnectionMessage(sourceNodeId, targetNodeId, connectionType = 'data-flow') {
    return Message.notice('voidflow.connect', {
      sourceNodeId: sourceNodeId,
      targetNodeId: targetNodeId,
      connectionType: connectionType,
      timestamp: Date.now(),
      flowId: this.generateFlowId()
    })
  }

  /**
   * ✂️ ノード切断メッセージ作成
   */
  createDisconnectionMessage(sourceNodeId, targetNodeId) {
    return Message.notice('voidflow.disconnect', {
      sourceNodeId: sourceNodeId,
      targetNodeId: targetNodeId,
      timestamp: Date.now()
    })
  }

  /**
   * 🚀 ノード実行メッセージ作成
   */
  createExecutionMessage(nodeId, input = {}, options = {}) {
    const flowId = options.flowId || this.generateFlowId()
    
    return Message.notice('voidflow.execute', {
      nodeId: nodeId,
      input: input,
      flowId: flowId,
      executionId: `exec-${Date.now()}`,
      timestamp: Date.now(),
      triggerType: options.triggerType || 'manual',
      sourceNodeId: options.sourceNodeId || null
    })
  }

  /**
   * 📊 Flow記録更新
   */
  updateFlowRecord(flowId, operation, source, target) {
    if (!this.activeFlows.has(flowId)) {
      this.activeFlows.set(flowId, {
        id: flowId,
        created: Date.now(),
        operations: [],
        messageCount: 0
      })
    }
    
    const flow = this.activeFlows.get(flowId)
    flow.operations.push({
      operation: operation,
      timestamp: Date.now(),
      source: this.sanitizeForLogging(source),
      target: this.sanitizeForLogging(target)
    })
    flow.messageCount++
    flow.lastActivity = Date.now()
  }

  /**
   * 🧹 ログ用データのサニタイズ
   */
  sanitizeForLogging(data) {
    if (!data) return null
    
    // 循環参照と大きなオブジェクトを除去
    try {
      return JSON.parse(JSON.stringify(data, (key, value) => {
        if (key.startsWith('_') || key === 'voidCore' || key === 'parent') {
          return '[Excluded]'
        }
        if (typeof value === 'function') {
          return '[Function]'
        }
        if (value && typeof value === 'object' && Object.keys(value).length > 20) {
          return '[LargeObject]'
        }
        return value
      }))
    } catch (error) {
      return { error: 'Serialization failed', type: typeof data }
    }
  }

  /**
   * 📈 統計情報取得
   */
  getAdapterStats() {
    const activeFlowCount = this.activeFlows.size
    const totalMessages = Array.from(this.activeFlows.values())
      .reduce((sum, flow) => sum + flow.messageCount, 0)
    
    return {
      activeFlows: activeFlowCount,
      totalMessages: totalMessages,
      adapterVersion: '1.0',
      uptime: Date.now() - (this.initTime || Date.now())
    }
  }

  /**
   * 🧪 デバッグ情報取得
   */
  getDebugInfo() {
    return {
      stats: this.getAdapterStats(),
      activeFlows: Array.from(this.activeFlows.entries()).map(([id, flow]) => ({
        id: id,
        messageCount: flow.messageCount,
        created: flow.created,
        lastActivity: flow.lastActivity,
        operationCount: flow.operations.length
      })),
      recentOperations: Array.from(this.activeFlows.values())
        .flatMap(flow => flow.operations)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10)
    }
  }

  /**
   * 🗑️ 古いFlow記録のクリーンアップ
   */
  cleanupOldFlows(maxAge = 300000) { // 5分
    const cutoff = Date.now() - maxAge
    
    for (const [flowId, flow] of this.activeFlows.entries()) {
      if (flow.lastActivity && flow.lastActivity < cutoff) {
        this.activeFlows.delete(flowId)
        this.log(`🗑️ Cleaned up old flow: ${flowId}`)
      }
    }
  }

  /**
   * 🔄 バッチ変換: VoidPacket配列 → Message配列
   */
  adaptVoidPacketBatch(voidPackets, options = {}) {
    const flowId = options.flowId || this.generateFlowId()
    
    return voidPackets.map((packet, index) => {
      return this.adaptVoidPacket(packet, {
        ...options,
        flowId: flowId,
        batchIndex: index,
        batchSize: voidPackets.length
      })
    })
  }

  /**
   * 🎭 互換性モード設定
   */
  setCompatibilityMode(mode) {
    this.compatibilityMode = mode
    this.log(`🎭 Compatibility mode set: ${mode}`)
  }
}

export default VoidFlowMessageAdapter