// core-communication.js - Phase S5: ハイブリッドコア間通信システム
// にゃー提案のMessageBus + 専用チャンネル方式

import { Message } from '../messaging/message.js'

/**
 * 🌐 CoreMessageBus - コア間通信の統一MessageBus
 * 
 * にゃー設計の原則:
 * - 通常時: MessageBus経由の統一通信
 * - UI層特例: DirectUIChannel経由の高速通信
 */
export class CoreMessageBus {
  constructor() {
    this.coreRegistry = new Map() // coreId → VoidCore instance
    this.messageHistory = [] // 通信履歴（デバッグ用）
    this.subscriptions = new Map() // messageType → Set<handler>
    this.maxHistorySize = 1000
  }

  /**
   * 🔌 コア登録 - MessageBusにコアを登録
   */
  registerCore(coreId, coreInstance) {
    this.coreRegistry.set(coreId, coreInstance)
    console.log(`🌐 CoreMessageBus: Core registered - ${coreId}`)
    
    // 登録通知をブロードキャスト
    this.broadcast(Message.notice('core.registered', {
      coreId,
      timestamp: Date.now()
    }), coreId)
  }

  /**
   * 🔌 コア登録解除
   */
  unregisterCore(coreId) {
    const existed = this.coreRegistry.delete(coreId)
    if (existed) {
      console.log(`🌐 CoreMessageBus: Core unregistered - ${coreId}`)
      
      // 登録解除通知
      this.broadcast(Message.notice('core.unregistered', {
        coreId,
        timestamp: Date.now()
      }), coreId)
    }
  }

  /**
   * 📡 メッセージブロードキャスト - 全コアに送信
   */
  async broadcast(message, excludeCoreId = null) {
    const timestamp = Date.now()
    
    // 履歴記録
    this._recordMessage({
      type: 'broadcast',
      message,
      excludeCoreId,
      timestamp,
      targetCores: Array.from(this.coreRegistry.keys()).filter(id => id !== excludeCoreId)
    })

    const deliveryPromises = []
    
    // 全登録コアに配信
    for (const [coreId, coreInstance] of this.coreRegistry.entries()) {
      if (coreId === excludeCoreId) continue
      
      deliveryPromises.push(
        this._deliverToCore(coreId, coreInstance, message).catch(error => {
          console.warn(`🚨 CoreMessageBus: Delivery failed to ${coreId}: ${error.message}`)
          return { coreId, success: false, error: error.message }
        })
      )
    }

    const results = await Promise.allSettled(deliveryPromises)
    return {
      totalCores: this.coreRegistry.size,
      delivered: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length
    }
  }

  /**
   * 🎯 特定コアに送信
   */
  async sendToCore(targetCoreId, message, senderCoreId = null) {
    const targetCore = this.coreRegistry.get(targetCoreId)
    if (!targetCore) {
      throw new Error(`Target core not found: ${targetCoreId}`)
    }

    // 履歴記録
    this._recordMessage({
      type: 'direct',
      message,
      targetCoreId,
      senderCoreId,
      timestamp: Date.now()
    })

    return await this._deliverToCore(targetCoreId, targetCore, message)
  }

  /**
   * 🔍 コア検索・取得
   */
  getCoreById(coreId) {
    return this.coreRegistry.get(coreId)
  }

  getRegisteredCores() {
    return Array.from(this.coreRegistry.keys())
  }

  getCoreCount() {
    return this.coreRegistry.size
  }

  /**
   * 📊 通信履歴・統計
   */
  getMessageHistory(limit = 50) {
    return this.messageHistory.slice(-limit)
  }

  getCommunicationStats() {
    const recentMessages = this.messageHistory.slice(-100)
    const messageTypes = {}
    
    recentMessages.forEach(record => {
      const type = record.message?.type || 'unknown'
      messageTypes[type] = (messageTypes[type] || 0) + 1
    })

    return {
      totalMessages: this.messageHistory.length,
      registeredCores: this.coreRegistry.size,
      recentMessageTypes: messageTypes,
      averageDeliveryTime: this._calculateAverageDeliveryTime(recentMessages)
    }
  }

  /**
   * 🚀 private: コアへの配信実行
   */
  async _deliverToCore(coreId, coreInstance, message) {
    const startTime = Date.now()
    
    try {
      // VoidCoreのpublishメソッド経由で配信
      await coreInstance.publish(message)
      
      const deliveryTime = Date.now() - startTime
      return { coreId, success: true, deliveryTime }
      
    } catch (error) {
      const deliveryTime = Date.now() - startTime
      console.error(`🚨 CoreMessageBus: Delivery error to ${coreId}:`, error)
      return { coreId, success: false, error: error.message, deliveryTime }
    }
  }

  /**
   * 📝 private: メッセージ履歴記録
   */
  _recordMessage(record) {
    this.messageHistory.push(record)
    
    // 履歴サイズ制限
    if (this.messageHistory.length > this.maxHistorySize) {
      this.messageHistory.splice(0, this.messageHistory.length - this.maxHistorySize)
    }
  }

  /**
   * 📊 private: 平均配信時間計算
   */
  _calculateAverageDeliveryTime(records) {
    const deliveryTimes = records
      .filter(r => r.deliveryTime)
      .map(r => r.deliveryTime)
    
    return deliveryTimes.length > 0 
      ? deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length
      : 0
  }
}

/**
 * ⚡ DirectUIChannel - UI層専用高速チャンネル
 * 
 * にゃー設計の特例:
 * - MessageBusを迂回した直接通信
 * - 高頻度UI操作専用（ドラッグ、スクロール等）
 */
export class DirectUIChannel {
  constructor(messageBus) {
    this.messageBus = messageBus
    this.uiCores = new Map() // coreId → UI専用インターフェース
    this.operationQueue = []
    this.batchingEnabled = true
    this.batchInterval = 16 // 60FPS = 16ms間隔
    this.batchTimer = null
  }

  /**
   * ⚡ UI専用コア登録
   */
  registerUICore(coreId, uiInterface) {
    this.uiCores.set(coreId, uiInterface)
    console.log(`⚡ DirectUIChannel: UI Core registered - ${coreId}`)
  }

  /**
   * ⚡ 高速UI更新 - バッチ処理対応
   */
  async fastUpdate(targetCoreId, updateData) {
    const operation = {
      type: 'fastUpdate',
      targetCoreId,
      updateData,
      timestamp: Date.now()
    }

    if (this.batchingEnabled) {
      // バッチ処理キューに追加
      this.operationQueue.push(operation)
      this._scheduleBatchProcessing()
    } else {
      // 即座実行
      return await this._executeUIOperation(operation)
    }
  }

  /**
   * ⚡ 高頻度イベント処理（ドラッグ等）
   */
  async handleHighFrequencyEvent(targetCoreId, eventType, eventData) {
    return await this.fastUpdate(targetCoreId, {
      type: 'highFrequencyEvent',
      eventType,
      eventData,
      priority: 'high'
    })
  }

  /**
   * 🔧 バッチ処理設定
   */
  configureBatching(enabled = true, interval = 16) {
    this.batchingEnabled = enabled
    this.batchInterval = interval
    console.log(`⚡ DirectUIChannel: Batching ${enabled ? 'enabled' : 'disabled'} (${interval}ms)`)
  }

  /**
   * 📊 UI通信統計
   */
  getUIStats() {
    return {
      registeredUICores: this.uiCores.size,
      queuedOperations: this.operationQueue.length,
      batchingEnabled: this.batchingEnabled,
      batchInterval: this.batchInterval
    }
  }

  /**
   * 🚀 private: バッチ処理スケジュール
   */
  _scheduleBatchProcessing() {
    if (this.batchTimer) return // 既にスケジュール済み
    
    this.batchTimer = setTimeout(async () => {
      await this._processBatch()
      this.batchTimer = null
    }, this.batchInterval)
  }

  /**
   * 🚀 private: バッチ実行
   */
  async _processBatch() {
    if (this.operationQueue.length === 0) return
    
    const batch = [...this.operationQueue]
    this.operationQueue.length = 0
    
    // 同一コア・同一タイプの操作をまとめる
    const groupedOps = this._groupOperations(batch)
    
    const promises = Object.entries(groupedOps).map(([key, operations]) => {
      return this._executeBatchedOperations(operations)
    })
    
    await Promise.allSettled(promises)
  }

  /**
   * 🚀 private: UI操作実行
   */
  async _executeUIOperation(operation) {
    const { targetCoreId, updateData } = operation
    const uiInterface = this.uiCores.get(targetCoreId)
    
    if (!uiInterface) {
      console.warn(`⚡ DirectUIChannel: UI Core not found - ${targetCoreId}`)
      return { success: false, error: 'UI Core not found' }
    }
    
    try {
      await uiInterface.directUpdate(updateData)
      return { success: true }
    } catch (error) {
      console.error(`⚡ DirectUIChannel: UI operation failed:`, error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 🚀 private: 操作グループ化
   */
  _groupOperations(operations) {
    const groups = {}
    
    operations.forEach(op => {
      const key = `${op.targetCoreId}:${op.updateData?.type || 'default'}`
      if (!groups[key]) groups[key] = []
      groups[key].push(op)
    })
    
    return groups
  }

  /**
   * 🚀 private: バッチ操作実行
   */
  async _executeBatchedOperations(operations) {
    // 最新の操作のみ実行（古い操作はスキップ）
    const latestOp = operations[operations.length - 1]
    return await this._executeUIOperation(latestOp)
  }
}

// シングルトンインスタンス
export const globalMessageBus = new CoreMessageBus()
export const globalUIChannel = new DirectUIChannel(globalMessageBus)