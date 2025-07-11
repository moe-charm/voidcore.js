// charmflow-node-plugin.js - CharmFlowノードのVoidCoreプラグイン基底クラス

import { IPlugin } from '../../src/interfaces/plugin-interface.js'
import { Message } from '../../src/messaging/message.js'

/**
 * 🧩 CharmFlowNodePlugin - CharmFlowノードのVoidCoreプラグイン基底クラス
 * 
 * 設計原則:
 * - IPluginを継承してCharmFlow専用機能を追加
 * - ノード間通信をVoidCoreメッセージで実現
 * - UI操作とロジック処理の分離
 * - 非同期実行による真の並列処理
 */
export class CharmFlowNodePlugin extends IPlugin {
  constructor(nodeType, config = {}) {
    super({
      id: config.id || `charmflow.${nodeType}.${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: `charmflow.node.${nodeType}`,
      displayName: config.displayName || CharmFlowNodePlugin.getDisplayName(nodeType),
      isCore: false
    })
    
    // ノード固有設定
    this.nodeType = nodeType
    this.nodeConfig = config
    this.position = config.position || { x: 0, y: 0 }
    this.properties = config.properties || {}
    
    // 接続管理
    this.inputConnections = new Map()  // sourcePluginId → connection info
    this.outputConnections = new Map() // targetPluginId → connection info
    
    // 実行状態
    this.executionState = 'ready' // ready, executing, completed, error
    this.lastResult = null
    this.executionHistory = []
    
    // ノードタイプ別設定
    this.setupNodeTypeDefaults()
  }

  /**
   * 🎭 ノードタイプ別の表示名取得
   */
  static getDisplayName(nodeType) {
    const displayNames = {
      'button.send': 'Button: Send',
      'input.text': 'Input: Text',
      'string.uppercase': 'String: UpperCase',
      'output.console': 'Output: Console',
      'web.fetch': 'Web: Fetch API',
      'json.parser': 'JSON: Parser',
      'ui.card': 'UI: Simple Card',
      'core.plugin-lister': 'Core: Plugin Lister',
      'core.connection-manager': 'Core: Connection Manager',
      'flow.connector': 'Flow: Connector'
    }
    return displayNames[nodeType] || nodeType
  }

  /**
   * ⚙️ ノードタイプ別デフォルト設定
   */
  setupNodeTypeDefaults() {
    const defaults = {
      'input.text': {
        properties: { text: 'Hello VoidFlow!' },
        inputs: [],
        outputs: ['text']
      },
      'string.uppercase': {
        properties: {},
        inputs: ['text'],
        outputs: ['text']
      },
      'output.console': {
        properties: {},
        inputs: ['text'],
        outputs: []
      },
      'button.send': {
        properties: {},
        inputs: [],
        outputs: ['signal']
      },
      'web.fetch': {
        properties: { url: 'https://httpbin.org/json' },
        inputs: ['url'],
        outputs: ['response']
      },
      'json.parser': {
        properties: { path: '' },
        inputs: ['json'],
        outputs: ['data']
      },
      'ui.card': {
        properties: { title: 'VoidFlow Card' },
        inputs: ['data'],
        outputs: []
      }
    }
    
    const nodeDefaults = defaults[this.nodeType] || { properties: {}, inputs: ['input'], outputs: ['output'] }
    
    // デフォルト値をマージ
    this.properties = { ...nodeDefaults.properties, ...this.properties }
    this.inputs = nodeDefaults.inputs
    this.outputs = nodeDefaults.outputs
  }

  /**
   * 🔌 プラグイン初期化
   */
  async onLoad() {
    this.log(`🧩 VoidFlow Node loaded: ${this.nodeType}`)
    
    // ノード準備完了通知
    await this.sendIntent('charmflow.node.ready', {
      nodeId: this.id,
      nodeType: this.nodeType,
      position: this.position
    })
    
    // VoidFlowコア実行エンジンに登録
    await this.sendIntent('charmflow.engine.registerNode', {
      nodeId: this.id,
      nodeType: this.nodeType,
      inputs: this.inputs,
      outputs: this.outputs
    })
  }

  /**
   * 📨 メッセージハンドラー
   */
  async handleMessage(message) {
    const { type, payload } = message
    
    switch (type) {
      case 'charmflow.execute':
        return await this.handleExecuteRequest(payload)
      case 'charmflow.connect':
        return await this.handleConnectionRequest(payload)
      case 'charmflow.disconnect':
        return await this.handleDisconnectionRequest(payload)
      case 'charmflow.property.update':
        return await this.handlePropertyUpdate(payload)
      case 'charmflow.data':
        return await this.handleDataInput(payload)
      default:
        return await super.handleMessage(message)
    }
  }

  /**
   * 🚀 実行要求処理
   */
  async handleExecuteRequest(payload) {
    try {
      this.executionState = 'executing'
      
      // 実行履歴記録
      const execution = {
        id: `exec-${Date.now()}`,
        startTime: Date.now(),
        input: payload,
        nodeType: this.nodeType
      }
      
      this.log(`🚀 Executing node: ${this.nodeType}`)
      
      // ノード固有の実行処理
      const result = await this.executeNode(payload.input || {})
      
      // 実行完了
      execution.endTime = Date.now()
      execution.duration = execution.endTime - execution.startTime
      execution.result = result
      execution.success = true
      
      this.executionHistory.push(execution)
      this.lastResult = result
      this.executionState = 'completed'
      
      // 結果を接続先ノードに送信
      await this.sendResultToConnectedNodes(result, execution.id)
      
      this.log(`✅ Node execution completed: ${this.nodeType} (${execution.duration}ms)`)
      
      return {
        success: true,
        result: result,
        executionId: execution.id,
        duration: execution.duration
      }
      
    } catch (error) {
      this.executionState = 'error'
      this.log(`❌ Node execution failed: ${error.message}`)
      
      return {
        success: false,
        error: error.message,
        nodeType: this.nodeType
      }
    }
  }

  /**
   * ⚙️ ノード固有実行処理（サブクラスで実装）
   */
  async executeNode(input) {
    // 基本実装（サブクラスでオーバーライド）
    return {
      output: `Processed by ${this.nodeType}`,
      input: input,
      timestamp: Date.now()
    }
  }

  /**
   * 📤 結果を接続先ノードに送信
   */
  async sendResultToConnectedNodes(result, executionId) {
    const connections = Array.from(this.outputConnections.values())
    
    if (connections.length === 0) {
      this.log('📭 No output connections found')
      return
    }
    
    // 並列送信
    const sendPromises = connections.map(async (connection) => {
      try {
        await this.voidCore.publish(Message.notice('charmflow.data', {
          sourceNodeId: this.id,
          targetNodeId: connection.targetNodeId,
          data: result,
          executionId: executionId,
          connectionType: connection.type || 'data-flow',
          timestamp: Date.now()
        }))
        
        this.log(`📤 Data sent to: ${connection.targetNodeId}`)
        
      } catch (error) {
        this.log(`❌ Failed to send data to ${connection.targetNodeId}: ${error.message}`)
      }
    })
    
    await Promise.all(sendPromises)
  }

  /**
   * 📥 データ入力処理
   */
  async handleDataInput(payload) {
    const { sourceNodeId, data, executionId } = payload
    
    this.log(`📥 Data received from: ${sourceNodeId}`)
    
    // 自動実行（接続されたノードからのデータで自動実行）
    if (this.shouldAutoExecute(payload)) {
      await this.handleExecuteRequest({
        input: data,
        sourceExecutionId: executionId,
        autoTriggered: true
      })
    }
    
    return { success: true, received: true }
  }

  /**
   * 🤖 自動実行判定
   */
  shouldAutoExecute(payload) {
    // button.sendノードからの信号の場合は自動実行
    if (payload.connectionType === 'control-flow') {
      return true
    }
    
    // データフローの場合も自動実行（デフォルト）
    return true
  }

  /**
   * 🔗 接続要求処理
   */
  async handleConnectionRequest(payload) {
    const { sourceNodeId, targetNodeId, connectionType } = payload
    
    if (sourceNodeId === this.id) {
      // 出力接続
      this.outputConnections.set(targetNodeId, {
        targetNodeId: targetNodeId,
        type: connectionType || 'data-flow',
        created: Date.now()
      })
      this.log(`🔗 Output connection created: ${this.id} → ${targetNodeId}`)
    }
    
    if (targetNodeId === this.id) {
      // 入力接続
      this.inputConnections.set(sourceNodeId, {
        sourceNodeId: sourceNodeId,
        type: connectionType || 'data-flow',
        created: Date.now()
      })
      this.log(`🔗 Input connection created: ${sourceNodeId} → ${this.id}`)
    }
    
    return { success: true, connected: true }
  }

  /**
   * ✂️ 接続解除処理
   */
  async handleDisconnectionRequest(payload) {
    const { sourceNodeId, targetNodeId } = payload
    
    if (sourceNodeId === this.id) {
      this.outputConnections.delete(targetNodeId)
      this.log(`✂️ Output connection removed: ${this.id} → ${targetNodeId}`)
    }
    
    if (targetNodeId === this.id) {
      this.inputConnections.delete(sourceNodeId)
      this.log(`✂️ Input connection removed: ${sourceNodeId} → ${this.id}`)
    }
    
    return { success: true, disconnected: true }
  }

  /**
   * ⚙️ プロパティ更新処理
   */
  async handlePropertyUpdate(payload) {
    const { propertyName, value } = payload
    
    this.properties[propertyName] = value
    this.log(`⚙️ Property updated: ${propertyName} = ${value}`)
    
    // プロパティ変更通知
    await this.sendIntent('charmflow.property.changed', {
      nodeId: this.id,
      propertyName: propertyName,
      value: value
    })
    
    return { success: true, updated: true }
  }

  /**
   * 📊 ノード状態取得
   */
  getNodeState() {
    return {
      id: this.id,
      nodeType: this.nodeType,
      position: this.position,
      properties: this.properties,
      executionState: this.executionState,
      inputConnections: Array.from(this.inputConnections.keys()),
      outputConnections: Array.from(this.outputConnections.keys()),
      lastResult: this.lastResult,
      executionCount: this.executionHistory.length
    }
  }

  /**
   * 🎯 位置更新
   */
  updatePosition(x, y) {
    this.position = { x, y }
    
    // 位置変更通知（UI更新用）
    this.sendIntent('charmflow.node.moved', {
      nodeId: this.id,
      position: this.position
    })
  }

  /**
   * 🗑️ ノード削除準備
   */
  async onUnload() {
    // 全接続を解除
    for (const targetNodeId of this.outputConnections.keys()) {
      await this.handleDisconnectionRequest({
        sourceNodeId: this.id,
        targetNodeId: targetNodeId
      })
    }
    
    for (const sourceNodeId of this.inputConnections.keys()) {
      await this.handleDisconnectionRequest({
        sourceNodeId: sourceNodeId,
        targetNodeId: this.id
      })
    }
    
    this.log(`🗑️ VoidFlow Node unloaded: ${this.nodeType}`)
  }
}

export default CharmFlowNodePlugin