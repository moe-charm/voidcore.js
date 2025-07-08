// voidflow-hybrid-communication.js - VoidFlow ハイブリッド通信システム統合
// Phase 3: VoidCore通信システムとVoidFlow高速通信の統合

import { Message } from '/src/messaging/message.js'
import { CoreMessageBus } from '/src/core/core-communication.js'

/**
 * 🌐 VoidFlowHybridCommunication - VoidFlow専用ハイブリッド通信システム
 * 
 * 統合機能:
 * - CoreMessageBus統合（標準メッセージング）
 * - DirectUIChannel統合（60FPS高速UI更新）
 * - VoidPacket↔VoidCoreMessage変換
 * - プラグイン間データフロー管理
 */
export class VoidFlowHybridCommunication {
  constructor(voidCore) {
    this.voidCore = voidCore
    this.coreId = 'voidflow-main'
    
    // 通信システム初期化
    this.messageBus = new CoreMessageBus()
    this.uiChannels = new Map()
    this.dataFlowChannels = new Map()
    
    // 統計情報
    this.stats = {
      messagesProcessed: 0,
      uiUpdatesProcessed: 0,
      dataFlowsExecuted: 0,
      lastResetTime: Date.now()
    }
    
    this.log('🌐 VoidFlowHybridCommunication initialized')
  }
  
  /**
   * 🚀 ハイブリッド通信システム開始
   */
  async start() {
    // VoidCoreをMessageBusに登録
    if (this.voidCore) {
      this.messageBus.registerCore(this.coreId, this.voidCore)
    }
    
    // 高速UIチャンネル初期化
    this.initializeHighSpeedUIChannels()
    
    // データフローチャンネル初期化
    this.initializeDataFlowChannels()
    
    // メッセージ監視開始
    this.startMessageMonitoring()
    
    this.log('🌐 Hybrid communication system started')
  }
  
  /**
   * 🎨 高速UIチャンネル初期化
   */
  initializeHighSpeedUIChannels() {
    // 60FPS UI更新チャンネル
    this.uiChannels.set('position', this.createFastUIChannel('position'))
    this.uiChannels.set('selection', this.createFastUIChannel('selection'))
    this.uiChannels.set('connection', this.createFastUIChannel('connection'))
    this.uiChannels.set('animation', this.createFastUIChannel('animation'))
    
    this.log('🎨 High-speed UI channels initialized')
  }
  
  /**
   * 🔄 データフローチャンネル初期化
   */
  initializeDataFlowChannels() {
    // プラグイン間データフロー専用チャンネル
    this.dataFlowChannels.set('plugin-data', this.createDataFlowChannel('plugin-data'))
    this.dataFlowChannels.set('connection-data', this.createDataFlowChannel('connection-data'))
    this.dataFlowChannels.set('execution-flow', this.createDataFlowChannel('execution-flow'))
    
    this.log('🔄 Data flow channels initialized')
  }
  
  /**
   * 🎯 高速UIチャンネル作成
   */
  createFastUIChannel(channelType) {
    const channel = {
      type: channelType,
      queue: [],
      processing: false,
      batchSize: 50,
      frameInterval: 16, // 60FPS
      
      /**
       * 高速更新（60FPS制限付き）
       */
      update: (data) => {
        channel.queue.push({
          data: data,
          timestamp: Date.now(),
          channelType: channelType
        })
        
        if (!channel.processing) {
          channel.processing = true
          requestAnimationFrame(() => {
            this.processUIChannelQueue(channel)
            channel.processing = false
          })
        }
      },
      
      /**
       * 緊急更新（即座に処理）
       */
      urgentUpdate: (data) => {
        this.processUIUpdate(data, channelType)
      }
    }
    
    return channel
  }
  
  /**
   * 🔄 データフローチャンネル作成
   */
  createDataFlowChannel(channelType) {
    const channel = {
      type: channelType,
      queue: [],
      processing: false,
      
      /**
       * データフロー送信
       */
      send: async (sourceId, targetId, data) => {
        const flowMessage = Message.notice('voidflow.dataflow', {
          channelType: channelType,
          sourceId: sourceId,
          targetId: targetId,
          data: data,
          timestamp: Date.now(),
          flowId: this.generateFlowId()
        })
        
        await this.sendMessage(flowMessage)
        this.stats.dataFlowsExecuted++
      },
      
      /**
       * バッチデータフロー送信
       */
      sendBatch: async (flows) => {
        const batchMessage = Message.notice('voidflow.dataflow.batch', {
          channelType: channelType,
          flows: flows,
          timestamp: Date.now(),
          batchId: this.generateBatchId()
        })
        
        await this.sendMessage(batchMessage)
        this.stats.dataFlowsExecuted += flows.length
      }
    }
    
    return channel
  }
  
  /**
   * 🎨 UIチャンネルキュー処理
   */
  processUIChannelQueue(channel) {
    const batch = [...channel.queue]
    channel.queue = []
    
    if (batch.length === 0) return
    
    // バッチ処理で効率化
    const grouped = this.groupUIUpdates(batch)
    
    for (const [updateType, updates] of grouped.entries()) {
      this.processUIUpdateBatch(updateType, updates, channel.type)
    }
    
    this.stats.uiUpdatesProcessed += batch.length
  }
  
  /**
   * 🔄 UI更新グループ化
   */
  groupUIUpdates(updates) {
    const grouped = new Map()
    
    for (const update of updates) {
      const key = update.data.updateType || 'default'
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key).push(update)
    }
    
    return grouped
  }
  
  /**
   * 🎯 UI更新バッチ処理
   */
  processUIUpdateBatch(updateType, updates, channelType) {
    switch (channelType) {
      case 'position':
        this.handlePositionUpdates(updates)
        break
      case 'selection':
        this.handleSelectionUpdates(updates)
        break
      case 'connection':
        this.handleConnectionUpdates(updates)
        break
      case 'animation':
        this.handleAnimationUpdates(updates)
        break
      default:
        this.handleGenericUIUpdates(updates)
    }
  }
  
  /**
   * 📍 位置更新処理
   */
  handlePositionUpdates(updates) {
    // 最新の位置のみを適用（中間フレームをスキップ）
    const latestPositions = new Map()
    
    for (const update of updates) {
      const elementId = update.data.elementId
      if (!latestPositions.has(elementId) || 
          update.timestamp > latestPositions.get(elementId).timestamp) {
        latestPositions.set(elementId, update)
      }
    }
    
    // DOM更新を実行
    for (const [elementId, update] of latestPositions) {
      this.updateElementPosition(elementId, update.data)
    }
  }
  
  /**
   * 🎯 選択更新処理
   */
  handleSelectionUpdates(updates) {
    // 最新の選択状態のみを適用
    const latestUpdate = updates[updates.length - 1]
    this.updateElementSelection(latestUpdate.data)
  }
  
  /**
   * 🔗 接続更新処理
   */
  handleConnectionUpdates(updates) {
    for (const update of updates) {
      this.updateConnection(update.data)
    }
  }
  
  /**
   * ✨ アニメーション更新処理
   */
  handleAnimationUpdates(updates) {
    for (const update of updates) {
      this.updateAnimation(update.data)
    }
  }
  
  /**
   * 📡 メッセージ送信（統合システム）
   */
  async sendMessage(message) {
    try {
      // VoidCoreメッセージシステム経由で送信
      if (this.voidCore && this.voidCore.publish) {
        await this.voidCore.publish(message)
      }
      
      // MessageBus経由での配信
      await this.messageBus.broadcast(message, this.coreId)
      
      this.stats.messagesProcessed++
      
    } catch (error) {
      this.log(`❌ Message send failed: ${error.message}`)
    }
  }
  
  /**
   * 📡 メッセージ監視開始
   */
  startMessageMonitoring() {
    // VoidCoreメッセージ監視
    if (this.voidCore) {
      this.voidCore.on('Notice', 'voidflow.*', (message) => {
        this.handleVoidFlowMessage(message)
      })
    }
    
    // MessageBusメッセージ監視
    this.messageBus.subscriptions.set('voidflow.*', new Set([
      (message) => this.handleVoidFlowMessage(message)
    ]))
  }
  
  /**
   * 📨 VoidFlowメッセージ処理
   */
  handleVoidFlowMessage(message) {
    const { eventName, payload } = message
    
    switch (eventName) {
      case 'voidflow.dataflow':
        this.handleDataFlowMessage(payload)
        break
      case 'voidflow.ui.update':
        this.handleUIUpdateMessage(payload)
        break
      case 'voidflow.connection.created':
        this.handleConnectionMessage(payload)
        break
      default:
        this.log(`📨 Unknown VoidFlow message: ${eventName}`)
    }
  }
  
  /**
   * 🎯 DOM要素位置更新
   */
  updateElementPosition(elementId, data) {
    const element = document.getElementById(elementId) || 
                   document.querySelector(`[data-plugin-id="${elementId}"]`)
    
    if (element && data.x !== undefined && data.y !== undefined) {
      element.style.left = `${data.x}px`
      element.style.top = `${data.y}px`
    }
  }
  
  /**
   * 🎯 要素選択状態更新
   */
  updateElementSelection(data) {
    // 前の選択を解除
    document.querySelectorAll('.selected').forEach(el => {
      el.classList.remove('selected')
    })
    
    // 新しい選択を適用
    if (data.selectedIds && data.selectedIds.length > 0) {
      data.selectedIds.forEach(id => {
        const element = document.getElementById(id) || 
                       document.querySelector(`[data-plugin-id="${id}"]`)
        if (element) {
          element.classList.add('selected')
        }
      })
    }
  }
  
  /**
   * 🔗 接続更新
   */
  updateConnection(data) {
    // 接続線の更新処理
    if (data.action === 'redraw' && data.elementId) {
      // 特定要素の接続線を再描画
      if (window.connectionManager && window.connectionManager.redrawConnectionsFromNode) {
        window.connectionManager.redrawConnectionsFromNode(data.elementId)
      }
    } else if (window.connectionManager) {
      window.connectionManager.updateConnection(data)
    }
  }
  
  /**
   * ✨ アニメーション更新
   */
  updateAnimation(data) {
    const element = document.getElementById(data.elementId)
    if (element && data.animationType) {
      element.style.animation = data.animationType
    }
  }
  
  /**
   * 🎯 高速UI更新API
   */
  fastUIUpdate(channelType, data) {
    const channel = this.uiChannels.get(channelType)
    if (channel) {
      channel.update(data)
    }
  }
  
  /**
   * 📊 統計情報取得
   */
  getStats() {
    const now = Date.now()
    const elapsed = now - this.stats.lastResetTime
    
    return {
      ...this.stats,
      elapsedTime: elapsed,
      messagesPerSecond: (this.stats.messagesProcessed / elapsed) * 1000,
      uiUpdatesPerSecond: (this.stats.uiUpdatesProcessed / elapsed) * 1000,
      dataFlowsPerSecond: (this.stats.dataFlowsExecuted / elapsed) * 1000
    }
  }
  
  /**
   * 🎲 ユーティリティ
   */
  generateFlowId() {
    return `flow-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
  }
  
  generateBatchId() {
    return `batch-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
  }
  
  log(message) {
    console.log(`🌐 [VoidFlowHybridCommunication] ${message}`)
  }
  
  /**
   * 🧹 クリーンアップ
   */
  cleanup() {
    this.messageBus.unregisterCore(this.coreId)
    this.uiChannels.clear()
    this.dataFlowChannels.clear()
    this.log('🧹 Hybrid communication system cleaned up')
  }
}

// グローバルインスタンス
export let voidFlowHybridComm = null

/**
 * 🚀 VoidFlowハイブリッド通信システム初期化
 */
export async function initializeVoidFlowHybridCommunication(voidCore) {
  if (!voidFlowHybridComm) {
    voidFlowHybridComm = new VoidFlowHybridCommunication(voidCore)
    await voidFlowHybridComm.start()
    
    // グローバルアクセス
    window.voidFlowHybridComm = voidFlowHybridComm
  }
  
  return voidFlowHybridComm
}

export default VoidFlowHybridCommunication