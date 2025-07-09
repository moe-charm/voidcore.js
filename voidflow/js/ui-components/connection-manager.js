// connection-manager.js - 接続管理機能
// VoidCoreUI から分離された接続機能専用管理クラス

import { Message } from '/src/messaging/message.js'

/**
 * 🔗 ConnectionManager - UI要素間の接続管理
 * 
 * 責任:
 * - 要素間の接続線描画管理
 * - 接続ポートの管理
 * - 接続モードの制御
 * - 接続線の再描画
 * - 外部ConnectionManagerとの連携
 * - ハイブリッド通信での接続更新
 */
export class ConnectionManager {
  constructor(voidCoreUI) {
    this.voidCoreUI = voidCoreUI
    this.connections = new Map() // sourceId-targetId → connection data
    this.connectionMode = false
    this.pendingConnection = null
  }

  /**
   * 🔗 接続線更新
   */
  updateConnectionLine(data) {
    // 接続線の描画更新（SVG操作）
    const { sourceId, targetId, connectionType } = data
    
    // 接続データを保存
    const connectionKey = `${sourceId}-${targetId}`
    this.connections.set(connectionKey, {
      sourceId,
      targetId,
      connectionType: connectionType || 'data-flow',
      timestamp: Date.now()
    })
    
    this.voidCoreUI.voidCore.base.publish(Message.notice('ui.connection.updated', {
      sourceId: sourceId,
      targetId: targetId,
      connectionType: connectionType || 'data-flow'
    }))
  }

  /**
   * ❌ 接続モードキャンセル
   */
  cancelConnectionMode() {
    this.connectionMode = false
    this.pendingConnection = null
    
    this.voidCoreUI.voidCore.base.publish(Message.notice('ui.connection.cancelled', {
      timestamp: Date.now()
    }))
  }

  /**
   * 🔄 要素の接続線再描画
   */
  redrawConnectionsForElement(pluginId) {
    // pluginIdを安全に文字列に変換
    const safePluginId = String(pluginId)
    
    // ログ出力を無効化（パフォーマンス最適化）
    // this.voidCoreUI.log(`🔄 Redrawing connections for: ${safePluginId} (type: ${typeof pluginId})`)
    
    // ConnectionManagerがある場合は使用
    if (window.connectionManager && window.connectionManager.redrawConnectionsFromNode) {
      // this.voidCoreUI.log(`🔄 Using window.connectionManager.redrawConnectionsFromNode`)
      window.connectionManager.redrawConnectionsFromNode(safePluginId)
    } else {
      // エラーログは残す
      this.voidCoreUI.log(`❌ window.connectionManager.redrawConnectionsFromNode not found`)
    }
    
    // VoidCoreConnectionManagerがある場合も使用
    if (this.voidCoreUI.hybridComm && this.voidCoreUI.hybridComm.updateConnection) {
      // this.voidCoreUI.log(`🔄 Using hybridComm.fastUIUpdate`)
      this.voidCoreUI.hybridComm.fastUIUpdate('connection', {
        elementId: safePluginId,
        action: 'redraw'
      })
    }
    
    // 完了ログを無効化
    // this.voidCoreUI.log(`🔄 Connections redrawn for element: ${safePluginId}`)
  }

  /**
   * 🎯 接続モード開始
   */
  startConnectionMode(sourcePluginId) {
    this.connectionMode = true
    this.pendingConnection = {
      sourceId: sourcePluginId,
      startTime: Date.now()
    }
    
    this.voidCoreUI.voidCore.base.publish(Message.notice('ui.connection.mode.started', {
      sourceId: sourcePluginId,
      timestamp: Date.now()
    }))
  }

  /**
   * ✅ 接続完了
   */
  completeConnection(targetPluginId) {
    if (!this.pendingConnection) return false
    
    const { sourceId } = this.pendingConnection
    this.updateConnectionLine({
      sourceId,
      targetId: targetPluginId,
      connectionType: 'data-flow'
    })
    
    this.connectionMode = false
    this.pendingConnection = null
    
    return true
  }

  /**
   * 🔍 接続状態の確認
   */
  isInConnectionMode() {
    return this.connectionMode
  }

  /**
   * 📋 要素の接続一覧取得
   */
  getConnectionsForElement(pluginId) {
    const connections = []
    this.connections.forEach((connectionData, key) => {
      if (connectionData.sourceId === pluginId || connectionData.targetId === pluginId) {
        connections.push(connectionData)
      }
    })
    return connections
  }

  /**
   * 🗑️ 接続削除
   */
  removeConnection(sourceId, targetId) {
    const connectionKey = `${sourceId}-${targetId}`
    const removed = this.connections.delete(connectionKey)
    
    if (removed) {
      this.voidCoreUI.voidCore.base.publish(Message.notice('ui.connection.removed', {
        sourceId,
        targetId,
        timestamp: Date.now()
      }))
    }
    
    return removed
  }

  /**
   * 🗑️ 要素の全接続削除
   */
  removeAllConnectionsForElement(pluginId) {
    const connectionsToRemove = []
    
    this.connections.forEach((connectionData, key) => {
      if (connectionData.sourceId === pluginId || connectionData.targetId === pluginId) {
        connectionsToRemove.push(key)
      }
    })
    
    connectionsToRemove.forEach(key => {
      this.connections.delete(key)
    })
    
    return connectionsToRemove.length
  }

  /**
   * 📊 接続統計取得
   */
  getConnectionStats() {
    return {
      totalConnections: this.connections.size,
      connectionMode: this.connectionMode,
      pendingConnection: !!this.pendingConnection,
      connections: Array.from(this.connections.values())
    }
  }

  /**
   * 🔍 デバッグ情報取得
   */
  getDebugInfo() {
    return {
      connectionMode: this.connectionMode,
      pendingConnection: this.pendingConnection,
      totalConnections: this.connections.size,
      connectionList: Array.from(this.connections.entries())
    }
  }
}