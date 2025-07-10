// voidcore-connection-manager.js - VoidCoreプラグイン間接続管理

import { Message } from '/src/messaging/message.js'
import { ConnectionLineRenderer } from './connection-line-renderer.js'
import { debugLogger } from './debug-file-logger.js'

/**
 * 🔗 VoidCoreConnectionManager - VoidCoreプラグイン間の接続・データフロー管理
 * 
 * 機能:
 * - プラグイン間接続の作成・削除
 * - データフローの制御・追跡
 * - 実行順序の管理
 * - 接続線の視覚化
 * 
 * 🔧 Phase3対応: IPlugin継承 → 統合プラグイン管理
 */
export class VoidCoreConnectionManager {
  constructor() {
    // 🔧 Phase3対応: 統合プラグイン管理
    this.id = 'VoidCore.ConnectionManager'
    this.type = 'system.connection'
    this.displayName = 'VoidCore Connection Manager'
    this.isCore = true
    this.status = 'active'
    
    // 接続管理
    this.connections = new Map() // connectionId → connection info
    this.pluginConnections = new Map() // pluginId → Set of connections
    this.executionQueue = []
    this.isExecuting = false
    
    // UI要素参照
    this.canvasElement = null
    this.svgElement = null
    
    // Phase 3: VoidFlowCore統合
    this.voidFlowCore = null  // main-voidcore.jsで設定される
    this.intentMode = false   // Phase 3で有効化
    
    this.log('🔗 VoidCoreConnectionManager initialized')
    
    // Phase 1: デバッグファイルロガー初期化
    if (debugLogger && !debugLogger.isInitialized) {
      debugLogger.initialize().then(() => {
        this.log('🐛 DebugFileLogger initialized for ConnectionManager')
      })
    }
  }
  
  // 🔧 Phase3対応: logメソッド追加（ファイル出力対応）
  log(message, data = null) {
    console.log(`[${this.id}] ${message}`)
    
    // Phase 1: ファイル出力デバッグログ
    if (debugLogger) {
      debugLogger.log('connection', 'debug', message, {
        source: this.id,
        data: data,
        timestamp: Date.now()
      })
    }
  }
  
  /**
   * Phase 3: Intent化モード制御
   */
  enableIntentMode() {
    this.intentMode = true
    this.log('🎯 ConnectionManager: Intent mode enabled')
  }
  
  disableIntentMode() {
    this.intentMode = false
    this.log('🎯 ConnectionManager: Intent mode disabled')
  }

  /**
   * 🎯 プラグイン初期化
   */
  async onActivated() {
    // UI要素取得
    this.canvasElement = document.querySelector('.canvas-area')
    this.svgElement = document.getElementById('connectionSvg')
    
    if (!this.svgElement) {
      this.log('⚠️ Connection SVG element not found')
      return
    }
    
    // 接続作成UI初期化
    this.initializeConnectionUI()
    
    this.log('🔗 Connection manager activated')
    this.log('🔗 Canvas element:', this.canvasElement)
    this.log('🔗 SVG element:', this.svgElement)
  }

  /**
   * 🎨 接続作成UI初期化（SmartConnection対応）
   */
  initializeConnectionUI() {
    // SmartConnectionManager初期化
    this.smartConnectionManager = new VoidCoreSmartConnectionManager(this)
    
    // Phase 1: ConnectionLineRenderer初期化
    this.lineRenderer = new ConnectionLineRenderer(this.svgElement)
    
    // 接続ポート作成（左クリック）
    document.addEventListener('click', (e) => {
      this.log(`🔍 Document click detected: target=${e.target.tagName}, id=${e.target.id}, class=${e.target.className}`)
      
      // 🚨 デバッグ: クリックされた要素の詳細情報
      this.log(`🔍 Click target details:`)
      this.log(`  - Element: ${e.target.outerHTML.substring(0, 200)}...`)
      this.log(`  - Parent: ${e.target.parentElement?.className}`)
      this.log(`  - Closest .plugin-item: ${e.target.closest('.plugin-item')?.className}`)
      this.log(`  - Closest .voidcore-ui-element: ${e.target.closest('.voidcore-ui-element')?.className}`)
      
      // クリックされた要素がプラグインパレットのアイテム、またはその内部要素である場合は処理をスキップするにゃ！
      const clickedPaletteItem = e.target.closest('.plugin-item');
      const isCanvasUIElement = e.target.closest('.voidcore-ui-element');
      
      // 🚨 修正: キャンバス上のUI要素の場合は、パレットアイテムとして扱わない
      if (clickedPaletteItem && !isCanvasUIElement) {
        this.log('🔍 Click: Detected click on plugin palette item, skipping connection mode entirely.')
        e.stopPropagation(); // イベントの伝播を完全に止めるにゃ
        return;
      }

      // クリックされた要素がvoidcore-ui-elementの内部にあるかチェック
      const clickedUIElement = e.target.closest('.voidcore-ui-element');
      this.log(`🔍 clickedUIElement: ${clickedUIElement ? clickedUIElement.id : 'null'}`)

      // ここから、SmartConnectionManagerに処理を委譲するロジックを再構築するにゃ
      if (clickedUIElement) { // voidcore-ui-element がクリックされた場合
        const pluginId = clickedUIElement.dataset.pluginId;
        if (pluginId) {
          this.log(`🔍 Delegating to SmartConnectionManager: ${pluginId}`);
          this.smartConnectionManager.handlePluginClick(pluginId, e);
          e.stopPropagation(); // SmartConnectionManagerが処理したら、それ以上伝播させないにゃ
        } else {
          this.log('🔍 Click: voidcore-ui-element found but no pluginId. Skipping SmartConnection.');
        }
        return; // voidcore-ui-element のクリックはここで処理を終えるにゃ
      }
      
      // それ以外のクリック（空白部分など）は接続モードをリセット
      this.log('🔍 Click: Not a plugin palette item or voidcore-ui-element. Checking for connection reset...');
      
      // 接続モード中なら接続をリセット
      if (this.smartConnectionManager && this.smartConnectionManager.isConnecting) {
        this.log('🔄 空白クリック検出: 接続モードをリセットします');
        this.smartConnectionManager.resetSelection();
      } else {
        this.log('🔍 Click: No active connection mode, ignoring.');
      }
    }) 
    
    // 右クリックキャンセル機能（どこでも右クリックでキャンセル＆色リセット）
    // キャプチャフェーズで最優先処理
    document.addEventListener('contextmenu', (e) => {
      if (this.smartConnectionManager.isConnecting) {
        e.preventDefault() // 右クリックメニューを無効化
        e.stopPropagation() // イベント伝播を停止
        e.stopImmediatePropagation() // 同じ要素の他のリスナーも停止
        this.log('🚫 右クリックで接続モードキャンセル')
        this.smartConnectionManager.resetSelection()
        this.showConnectionStatus('🚫 接続モードキャンセル')
        return false // 確実にイベントを停止
      }
      // 👈 一旦、通常時の右クリック処理を無効化
    }, true) // キャプチャフェーズで処理
    
    // マウス移動で一時的な線を更新
    document.addEventListener('mousemove', (e) => {
      if (this.smartConnectionManager && this.smartConnectionManager.isConnecting) {
        this.updateTempConnectionLine(e.clientX, e.clientY)
      }
    })
    
    // ESCキーで接続キャンセル
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.smartConnectionManager) {
        this.smartConnectionManager.resetSelection()
      }
    })
  }

  /**
   * 🔗 接続作成
   */
  createConnection(sourcePluginId, targetPluginId, connectionType = 'data-flow') {
    // Phase 1: 複数接続許可（Fan-out対応）
    // 既存接続チェックを無効化 - 同一プラグイン間の複数接続を許可
    this.log(`🔗 複数接続許可: ${sourcePluginId} → ${targetPluginId} (${connectionType})`)
    
    // 注意: 既存接続チェックをコメントアウト
    // const existingConnectionId = this.findConnection(sourcePluginId, targetPluginId)
    // if (existingConnectionId) {
    //   throw new Error('Connection already exists')
    // }
    
    // 循環参照チェック
    if (this.wouldCreateCycle(sourcePluginId, targetPluginId)) {
      throw new Error('Connection would create circular dependency')
    }
    
    // 接続ID生成
    const connectionId = `conn-${sourcePluginId}-${targetPluginId}-${Date.now()}`
    
    // 接続情報作成
    const connection = {
      id: connectionId,
      sourcePluginId: sourcePluginId,
      targetPluginId: targetPluginId,
      connectionType: connectionType,
      created: Date.now(),
      active: true,
      dataCount: 0,
      lastDataFlow: null
    }
    
    // 接続を保存
    this.connections.set(connectionId, connection)
    
    // プラグイン別接続リスト更新
    this.addPluginConnection(sourcePluginId, connectionId)
    this.addPluginConnection(targetPluginId, connectionId)
    
    // 視覚的な線を描画
    this.drawConnectionLine(connection)
    
    // 接続作成メッセージ送信
    this.log(`✅ Connection created: ${sourcePluginId} → ${targetPluginId}`)
    // TODO: VoidCore Intent送信
    // this.sendIntent('voidcore.connection.created', {
    //   connectionId: connectionId,
    //   sourcePluginId: sourcePluginId,
    //   targetPluginId: targetPluginId,
    //   connectionType: connectionType
    // })
    
    return connectionId
  }

  /**
   * ✂️ 接続削除
   */
  removeConnection(connectionId) {
    const connection = this.connections.get(connectionId)
    if (!connection) {
      throw new Error('Connection not found')
    }
    
    // プラグイン別接続リストから削除
    this.removePluginConnection(connection.sourcePluginId, connectionId)
    this.removePluginConnection(connection.targetPluginId, connectionId)
    
    // 視覚的な線を削除
    this.removeConnectionLine(connectionId)
    
    // 接続を削除
    this.connections.delete(connectionId)
    
    // 削除メッセージ送信
    this.log(`✅ Connection removed: ${connection.sourcePluginId} → ${connection.targetPluginId}`)
    // TODO: VoidCore Intent送信
    // this.sendIntent('voidcore.connection.removed', {
    //   connectionId: connectionId,
    //   sourcePluginId: connection.sourcePluginId,
    //   targetPluginId: connection.targetPluginId
    // })
    
    this.log(`✂️ Connection removed: ${connectionId}`)
  }

  /**
   * 📊 データフロー実行
   */
  async executeDataFlow(sourcePluginId, data) {
    this.log(`📊 executeDataFlow called: ${sourcePluginId}`)
    this.log(`📊 Data to send:`, data)
    
    const connections = this.getOutgoingConnections(sourcePluginId)
    this.log(`📊 Found ${connections.length} outgoing connections`)
    
    if (connections.length === 0) {
      this.log(`⚠️ No outgoing connections found for: ${sourcePluginId}`)
      return
    }
    
    for (const connectionId of connections) {
      const connection = this.connections.get(connectionId)
      if (!connection || !connection.active) {
        this.log(`⚠️ Connection not found or inactive: ${connectionId}`)
        continue
      }
      
      this.log(`📊 Processing connection: ${connectionId}`)
      this.log(`📊 Target plugin: ${connection.targetPluginId}`)
      
      try {
        // データフローメッセージ作成
        const flowMessage = Message.notice('voidcore.dataflow', {
          connectionId: connectionId,
          sourcePluginId: sourcePluginId,
          targetPluginId: connection.targetPluginId,
          data: data,
          timestamp: Date.now(),
          flowId: `flow-${Date.now()}`
        })
        
        this.log(`📊 Sending flow message to: ${connection.targetPluginId}`)
        
        // ターゲットプラグインに送信（自動実行されるはず）
        await this.sendToPlugin(connection.targetPluginId, flowMessage)
        
        // 統計更新
        connection.dataCount++
        connection.lastDataFlow = Date.now()
        
        // 視覚フィードバックを無効化（パフォーマンス最適化）
        // this.animateConnection(connectionId)
        
        this.log(`📊 Data flow completed: ${sourcePluginId} → ${connection.targetPluginId}`)
        
      } catch (error) {
        this.log(`❌ Data flow failed: ${connectionId} - ${error.message}`)
        this.log(`❌ Error details:`, error)
      }
    }
  }

  /**
   * 🎯 プラグインに直接メッセージ送信
   */
  async sendToPlugin(pluginId, message) {
    this.log(`📤 Sending message to plugin: ${pluginId}`)
    
    // VoidCoreUIからプラグインを取得
    if (this.voidCore && this.voidCore.getPlugin) {
      const plugin = this.voidCore.getPlugin(pluginId)
      if (plugin && plugin.handleMessage) {
        this.log(`📤 Plugin found, sending message via handleMessage`)
        await plugin.handleMessage(message)
        return
      }
    }
    
    // VoidCoreUIプラグインの場合
    if (window.voidCoreUI && window.voidCoreUI.uiElements.has(pluginId)) {
      this.log(`📤 VoidCoreUI plugin found, sending to handleDataFlowReceived`)
      await window.voidCoreUI.handleDataFlowReceived(pluginId, message.payload)
      return
    }
    
    // フォールバック: FlowExecutorでデータフロー処理
    if (window.flowExecutor) {
      this.log(`📤 Fallback: Using FlowExecutor for data flow`)
      await window.flowExecutor.handleDataFlow({
        targetPluginId: pluginId,
        data: message.payload.data,
        sourcePluginId: message.payload.sourcePluginId
      })
    } else {
      this.log(`⚠️ No plugin handler found for: ${pluginId}`)
    }
  }

  /**
   * 🎨 接続線描画（Phase 1: 高度な線表示対応）
   */
  drawConnectionLine(connection) {
    if (!this.svgElement || !this.lineRenderer) return
    
    const sourceElement = this.getPluginElement(connection.sourcePluginId)
    const targetElement = this.getPluginElement(connection.targetPluginId)
    
    if (!sourceElement || !targetElement) return
    
    const sourceRect = sourceElement.getBoundingClientRect()
    const targetRect = targetElement.getBoundingClientRect()
    const canvasRect = this.canvasElement.getBoundingClientRect()
    
    // 相対座標計算（より精密なポート位置）
    const sourcePos = {
      x: sourceRect.right - canvasRect.left,
      y: sourceRect.top + sourceRect.height/2 - canvasRect.top
    }
    const targetPos = {
      x: targetRect.left - canvasRect.left,
      y: targetRect.top + targetRect.height/2 - canvasRect.top
    }
    
    // Phase 1: 同じソースからの接続を検出（扇形分散用）
    const sourceConnections = this.getConnectionsFromSource(connection.sourcePluginId)
    
    this.log(`🌀 接続描画: ${connection.sourcePluginId} から ${sourceConnections.length}本の接続`)
    
    if (sourceConnections.length >= 2) {
      // 扇形分散表示を使用（2本以上で扇形）
      this.log(`🌀 扇形分散モード: ${sourceConnections.length}本`)
      this.renderFanOutConnections(connection.sourcePluginId)
    } else {
      // 通常の線表示（ConnectionLineRenderer使用）
      this.log(`🎨 通常線描画: ${connection.id}`)
      const path = this.lineRenderer.renderConnection(connection.id, sourcePos, targetPos, {
        color: '#4a90e2',
        width: 2,
        animated: true,
        arrow: true
      })
      
      // ダブルクリックで削除
      path.addEventListener('dblclick', () => {
        this.removeConnection(connection.id)
      })
    }
  }
  
  /**
   * 🌀 扇形分散接続を描画
   */
  renderFanOutConnections(sourcePluginId) {
    const connections = this.getConnectionsFromSource(sourcePluginId)
    const sourceElement = this.getPluginElement(sourcePluginId)
    
    if (!sourceElement) return
    
    const sourceRect = sourceElement.getBoundingClientRect()
    const canvasRect = this.canvasElement.getBoundingClientRect()
    const sourcePos = {
      x: sourceRect.right - canvasRect.left,
      y: sourceRect.top + sourceRect.height/2 - canvasRect.top
    }
    
    // 既存の接続線を削除（再描画のため）
    connections.forEach(conn => {
      const existingPath = document.getElementById(`connection-path-${conn.id}`)
      if (existingPath) existingPath.remove()
    })
    
    // 各接続のターゲット位置を計算
    const targetConnections = connections.map(conn => {
      const targetElement = this.getPluginElement(conn.targetPluginId)
      if (!targetElement) return null
      
      const targetRect = targetElement.getBoundingClientRect()
      return {
        id: conn.id,
        targetPos: {
          x: targetRect.left - canvasRect.left,
          y: targetRect.top + targetRect.height/2 - canvasRect.top
        },
        options: {
          color: '#4a90e2',
          width: 2,
          animated: false  // 扇形は初回のみアニメーション
        }
      }
    }).filter(conn => conn !== null)
    
    // 扇形分散レンダリング
    const paths = this.lineRenderer.renderFanOutConnections(sourcePluginId, sourcePos, targetConnections)
    
    // 各パスにイベントリスナー追加
    paths.forEach((path, index) => {
      const connectionId = connections[index].id
      path.addEventListener('dblclick', () => {
        this.removeConnection(connectionId)
      })
    })
  }
  
  /**
   * 🔍 特定ソースからの全接続を取得
   */
  getConnectionsFromSource(sourcePluginId) {
    const connections = []
    this.connections.forEach((conn, id) => {
      if (conn.sourcePluginId === sourcePluginId) {
        connections.push({ ...conn, id })
      }
    })
    this.log(`🔍 ${sourcePluginId} からの接続: ${connections.length}本`)
    connections.forEach(conn => {
      this.log(`   - ${conn.id}: ${conn.sourcePluginId} → ${conn.targetPluginId}`)
    })
    return connections
  }

  /**
   * 🎯 矢印マーカー作成・確保
   */
  _ensureArrowMarker() {
    // 既存のマーカーがあるかチェック
    if (this.svgElement.querySelector('#arrow-marker')) {
      return
    }
    
    // defsセクションを作成または取得
    let defs = this.svgElement.querySelector('defs')
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
      this.svgElement.appendChild(defs)
    }
    
    // 矢印マーカー定義
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker')
    marker.setAttribute('id', 'arrow-marker')
    marker.setAttribute('markerWidth', '10')
    marker.setAttribute('markerHeight', '10')
    marker.setAttribute('refX', '9')
    marker.setAttribute('refY', '3')
    marker.setAttribute('orient', 'auto')
    marker.setAttribute('markerUnits', 'strokeWidth')
    
    // 矢印の形状（三角形）
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('d', 'M0,0 L0,6 L9,3 z')
    path.setAttribute('fill', '#4a90e2')
    path.setAttribute('opacity', '0.8')
    
    marker.appendChild(path)
    defs.appendChild(marker)
    
    this.log('🎯 Arrow marker created for connection lines')
  }

  /**
   * 🗑️ 接続線削除（Phase 1: ConnectionLineRenderer対応）
   */
  removeConnectionLine(connectionId) {
    // 旧形式の線要素
    const lineElement = document.getElementById(`connection-line-${connectionId}`)
    if (lineElement) {
      lineElement.remove()
    }
    
    // Phase 1: ConnectionLineRenderer管理のパス
    if (this.lineRenderer) {
      this.lineRenderer.removeConnection(connectionId)
      
      // 削除後、同じソースの接続を再描画（扇形更新）
      const connection = this.connections.get(connectionId)
      if (connection) {
        const sourceConnections = this.getConnectionsFromSource(connection.sourcePluginId)
        if (sourceConnections.length >= 2) {
          // 扇形を再計算して再描画
          setTimeout(() => {
            this.renderFanOutConnections(connection.sourcePluginId)
          }, 100)
        }
      }
    }
  }

  /**
   * ✨ 接続線アニメーション
   */
  animateConnection(connectionId) {
    const lineElement = document.getElementById(`connection-line-${connectionId}`)
    if (!lineElement) return
    
    // データフローアニメーション
    lineElement.style.stroke = '#00ff88'
    lineElement.style.strokeWidth = '3'
    
    setTimeout(() => {
      lineElement.style.stroke = '#4a90e2'
      lineElement.style.strokeWidth = '2'
    }, 200)
  }

  /**
   * 🔍 プラグイン要素取得
   */
  getPluginElement(pluginId) {
    // VoidCoreUI要素を優先的に検索
    const voidcoreElement = document.querySelector(`[data-plugin-id="${pluginId}"]`)
    if (voidcoreElement) {
      return voidcoreElement
    }
    
    // レガシーVoidFlow要素もチェック
    const legacyElement = document.getElementById(`voidflow-node-${pluginId}`)
    if (legacyElement) {
      return legacyElement
    }
    
    // UI要素IDでも検索
    const uiElement = document.getElementById(`ui-element-${pluginId}`)
    if (uiElement) {
      return uiElement
    }
    
    this.log(`⚠️ Plugin element not found for ID: ${pluginId}`)
    return null
  }

  /**
   * 📋 発信接続取得
   */
  getOutgoingConnections(pluginId) {
    const pluginConnections = this.pluginConnections.get(pluginId) || new Set()
    return Array.from(pluginConnections).filter(connectionId => {
      const connection = this.connections.get(connectionId)
      return connection && connection.sourcePluginId === pluginId
    })
  }

  /**
   * 📋 受信接続取得
   */
  getIncomingConnections(pluginId) {
    const pluginConnections = this.pluginConnections.get(pluginId) || new Set()
    return Array.from(pluginConnections).filter(connectionId => {
      const connection = this.connections.get(connectionId)
      return connection && connection.targetPluginId === pluginId
    })
  }

  /**
   * 🔄 循環参照チェック
   */
  wouldCreateCycle(sourcePluginId, targetPluginId) {
    // 簡易循環チェック（深い循環は今後実装）
    const targetOutgoing = this.getOutgoingConnections(targetPluginId)
    
    for (const connectionId of targetOutgoing) {
      const connection = this.connections.get(connectionId)
      if (connection && connection.targetPluginId === sourcePluginId) {
        return true // 直接的な循環
      }
    }
    
    return false
  }

  /**
   * 🔍 接続検索
   */
  findConnection(sourcePluginId, targetPluginId) {
    for (const [connectionId, connection] of this.connections.entries()) {
      if (connection.sourcePluginId === sourcePluginId && 
          connection.targetPluginId === targetPluginId) {
        return connectionId
      }
    }
    return null
  }

  /**
   * 📋 プラグイン接続リスト管理
   */
  addPluginConnection(pluginId, connectionId) {
    if (!this.pluginConnections.has(pluginId)) {
      this.pluginConnections.set(pluginId, new Set())
    }
    this.pluginConnections.get(pluginId).add(connectionId)
  }

  removePluginConnection(pluginId, connectionId) {
    const connections = this.pluginConnections.get(pluginId)
    if (connections) {
      connections.delete(connectionId)
      if (connections.size === 0) {
        this.pluginConnections.delete(pluginId)
      }
    }
  }

  /**
   * 🎨 一時的な接続線作成
   */
  createTempConnectionLine(x, y) {
    if (!this.svgElement) return
    
    const canvasRect = this.canvasElement.getBoundingClientRect()
    const relativeX = x - canvasRect.left
    const relativeY = y - canvasRect.top
    
    const tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    tempLine.setAttribute('id', 'temp-connection-line')
    tempLine.setAttribute('x1', relativeX)
    tempLine.setAttribute('y1', relativeY)
    tempLine.setAttribute('x2', relativeX)
    tempLine.setAttribute('y2', relativeY)
    tempLine.setAttribute('stroke', '#ff6b6b')
    tempLine.setAttribute('stroke-width', '2')
    tempLine.setAttribute('stroke-dasharray', '5,5')
    tempLine.setAttribute('stroke-opacity', '0.8')
    
    this.svgElement.appendChild(tempLine)
  }

  /**
   * 🔄 一時的な接続線更新
   */
  updateTempConnectionLine(x, y) {
    const tempLine = document.getElementById('temp-connection-line')
    if (!tempLine) return
    
    const canvasRect = this.canvasElement.getBoundingClientRect()
    const relativeX = x - canvasRect.left
    const relativeY = y - canvasRect.top
    
    tempLine.setAttribute('x2', relativeX)
    tempLine.setAttribute('y2', relativeY)
  }

  /**
   * 🧹 接続UI リセット
   */
  resetConnectionUI() {
    // connecting-source クラス削除
    document.querySelectorAll('.connecting-source').forEach(el => {
      el.classList.remove('connecting-source')
    })
    
    // 一時的な線削除
    const tempLine = document.getElementById('temp-connection-line')
    if (tempLine) {
      tempLine.remove()
    }
    
    // カーソルリセット
    document.body.style.cursor = 'default'
  }

  /**
   * 📢 接続ステータス表示
   */
  showConnectionStatus(message) {
    console.log('📢 Status message:', message) // デバッグログ
    
    // ステータスエリア取得または作成
    let statusElement = document.getElementById('connection-status')
    if (!statusElement) {
      statusElement = document.createElement('div')
      statusElement.id = 'connection-status'
      statusElement.style.cssText = `
        position: fixed;
        top: 60px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(74, 144, 226, 0.95);
        color: white;
        padding: 12px 20px;
        border-radius: 25px;
        font-size: 13px;
        font-weight: bold;
        z-index: 1000;
        pointer-events: none;
        /* transition: all 0.3s ease; パフォーマンス最適化で無効化 */
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        border: 2px solid rgba(255,255,255,0.3);
      `
      document.body.appendChild(statusElement)
      console.log('📢 Status element created and added to body') // デバッグログ
    }
    
    statusElement.textContent = message
    statusElement.style.opacity = '1'
    statusElement.style.display = 'block'
    
    console.log('📢 Status element updated:', statusElement) // デバッグログ
    
    // 4秒後に非表示
    setTimeout(() => {
      if (statusElement) {
        statusElement.style.opacity = '0'
        setTimeout(() => {
          if (statusElement && statusElement.parentNode) {
            statusElement.style.display = 'none'
          }
        }, 300)
      }
    }, 4000)
  }

  /**
   * 📊 接続統計
   */
  getConnectionStats() {
    const activeConnections = Array.from(this.connections.values())
      .filter(conn => conn.active).length
    
    const totalDataFlows = Array.from(this.connections.values())
      .reduce((sum, conn) => sum + conn.dataCount, 0)
    
    return {
      totalConnections: this.connections.size,
      activeConnections: activeConnections,
      totalPlugins: this.pluginConnections.size,
      totalDataFlows: totalDataFlows
    }
  }

  /**
   * 🔄 特定ノードからの接続線再描画（main.js互換）
   */
  redrawConnectionsFromNode(nodeId) {
    // 🔧 修正: 発信・受信両方の接続を再描画
    const outgoingConnections = this.getOutgoingConnections(nodeId)
    const incomingConnections = this.getIncomingConnections(nodeId)
    const allConnections = [...outgoingConnections, ...incomingConnections]
    
    // 重複除去
    const uniqueConnections = [...new Set(allConnections)]
    
    // this.log(`🔄 redrawConnectionsFromNode: ${nodeId} - ${uniqueConnections.length}本 (out:${outgoingConnections.length} + in:${incomingConnections.length})`)
    
    // 既存の接続線を削除
    uniqueConnections.forEach(connectionId => {
      const connection = this.connections.get(connectionId)
      if (connection) {
        this.removeConnectionLine(connectionId)
      }
    })
    
    // 接続線を再描画
    uniqueConnections.forEach(connectionId => {
      const connection = this.connections.get(connectionId)
      if (connection) {
        this.drawConnectionLine(connection)
      }
    })
  }

  /**
   * 🧪 デバッグ情報
   */
  getDebugInfo() {
    return {
      connections: Array.from(this.connections.entries()),
      pluginConnections: Array.from(this.pluginConnections.entries()),
      stats: this.getConnectionStats()
    }
  }
}

/**
 * 🎯 VoidCoreSmartConnectionManager - 高度な接続管理（旧VoidFlow移植版）
 */
class VoidCoreSmartConnectionManager {
  constructor(connectionManager) {
    this.connectionManager = connectionManager
    this.firstSelected = null
    this.secondSelected = null
    this.isConnecting = false
    this.connectionCandidates = []
    
    this.log('🎯 VoidCoreSmartConnectionManager initialized')
  }
  
  log(msg) {
    this.connectionManager.log(msg)
  }
  
  async handlePluginClick(pluginId, event) {
    this.log(`🎯 handlePluginClick called with: ${pluginId}`)
    this.log(`🎯 Current state: firstSelected=${this.firstSelected}, isConnecting=${this.isConnecting}`)
    
    if (!this.firstSelected) {
      // 最初のプラグイン選択 - 接続開始
      this.firstSelected = pluginId
      this.highlightPlugin(pluginId, 'first')
      this.log(`🎯 接続ソース選択: ${this.getPluginDisplayName(pluginId)}`)
      this.log('💡 次に接続先プラグインをクリックしてください')
      this.isConnecting = true
      
      // Phase 3: 接続開始Intent送信
      if (this.intentMode && this.voidFlowCore) {
        await this._sendConnectionStartIntent(pluginId, event)
      }
      
      // 一時的な線を作成
      this.connectionManager.createTempConnectionLine(event.clientX, event.clientY)
      
      // ステータス表示
      this.connectionManager.showConnectionStatus(`🔗 接続元: ${this.getPluginDisplayName(pluginId)} | 接続先をクリックしてください`)
      
    } else if (this.firstSelected === pluginId) {
      // 同じプラグインクリック = キャンセル
      this.log('❌ 接続モードキャンセル - 同じプラグインクリック')
      
      // Phase 3: 接続キャンセルIntent送信
      if (this.intentMode && this.voidFlowCore) {
        await this._sendConnectionCancelIntent('user', this.firstSelected)
      }
      
      this.resetSelection()
      
    } else {
      // 2番目のプラグイン選択 = 接続候補分析
      this.secondSelected = pluginId
      this.highlightPlugin(pluginId, 'second')
      this.log(`🎯 接続ターゲット選択: ${this.getPluginDisplayName(pluginId)}`)
      
      // 接続候補を分析・表示
      this.connectionCandidates = this.analyzeConnectionCandidates(this.firstSelected, this.secondSelected)
      this.log(`🎯 接続候補数: ${this.connectionCandidates.length}`)
      
      // Phase 3: 接続完了Intent送信（候補がある場合）
      if (this.intentMode && this.voidFlowCore && this.connectionCandidates.length > 0) {
        await this._sendConnectionCompleteIntent(this.firstSelected, this.secondSelected, this.connectionCandidates)
      }
      
      this.showConnectionCandidates(this.connectionCandidates)
    }
  }
  
  getPluginDisplayName(pluginId) {
    const element = document.querySelector(`[data-plugin-id="${pluginId}"]`)
    if (!element) return pluginId
    
    const nodeType = element.dataset.nodeType
    const names = {
      'button.send': 'Button: Send',
      'input.text': 'Input: Text',
      'string.uppercase': 'String: UpperCase',
      'output.console': 'Output: Console',
      'web.fetch': 'Web: Fetch API',
      'json.parser': 'JSON: Parser',
      'ui.card': 'UI: Simple Card'
    }
    return names[nodeType] || nodeType
  }
  
  highlightPlugin(pluginId, type) {
    const element = document.querySelector(`[data-plugin-id="${pluginId}"]`)
    if (!element) return
    
    element.classList.remove('connecting-source', 'connecting-target')
    element.classList.add(type === 'first' ? 'connecting-source' : 'connecting-target')
  }
  
  analyzeConnectionCandidates(sourceId, targetId) {
    const sourceElement = document.querySelector(`[data-plugin-id="${sourceId}"]`)
    const targetElement = document.querySelector(`[data-plugin-id="${targetId}"]`)
    
    if (!sourceElement || !targetElement) return []
    
    const sourceType = sourceElement.dataset.nodeType
    const targetType = targetElement.dataset.nodeType
    
    const candidates = []
    
    // 基本的な接続候補
    candidates.push({
      type: 'data-flow',
      description: `${this.getPluginDisplayName(sourceId)} から ${this.getPluginDisplayName(targetId)} へのデータフロー`,
      compatibility: this.calculateCompatibility(sourceType, targetType),
      sourceId: sourceId,
      targetId: targetId
    })
    
    return candidates.filter(c => c.compatibility.score > 0)
  }
  
  calculateCompatibility(sourceType, targetType) {
    // 互換性ルール定義
    const compatibilityRules = {
      'button.send': ['string.uppercase', 'output.console', 'input.text'],
      'input.text': ['string.uppercase', 'output.console', 'web.fetch'],
      'string.uppercase': ['output.console', 'ui.card'],
      'web.fetch': ['json.parser', 'output.console'],
      'json.parser': ['output.console', 'ui.card']
    }
    
    const compatibleTargets = compatibilityRules[sourceType] || []
    const score = compatibleTargets.includes(targetType) ? 1 : 0.5
    
    return {
      score: score,
      reason: score === 1 ? '高い互換性' : '基本的な互換性'
    }
  }
  
  showConnectionCandidates(candidates) {
    this.log(`🎯 showConnectionCandidates called with ${candidates.length} candidates`)
    
    if (candidates.length === 0) {
      this.log('❌ 互換性のある接続候補が見つかりませんでした')
      this.resetSelection()
      return
    }
    
    this.log('🎯 Creating connection modal...')
    const modal = this.createCandidateModal(candidates)
    document.body.appendChild(modal)
    this.log('🎯 Modal appended to body')
    
    setTimeout(() => {
      modal.style.opacity = '1'
      modal.style.transform = 'translate(-50%, -50%) scale(1)'
      this.log('🎯 Modal displayed')
    }, 10)
  }
  
  createCandidateModal(candidates) {
    const modal = document.createElement('div')
    modal.className = 'connection-candidates-modal'
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.9);
      background: rgba(26, 26, 46, 0.95);
      border: 2px solid #4a90e2;
      border-radius: 12px;
      padding: 20px;
      z-index: 10000;
      min-width: 400px;
      max-width: 600px;
      opacity: 0;
      /* transition: all 0.3s ease; パフォーマンス最適化で無効化 */
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      color: white;
    `
    
    modal.innerHTML = `
      <div style="font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #4a90e2;">
        🔗 接続候補選択
      </div>
      <div style="margin-bottom: 15px; color: #aaa; font-size: 14px;">
        ${this.getPluginDisplayName(this.firstSelected)} → ${this.getPluginDisplayName(this.secondSelected)}
      </div>
      <div class="candidates-list">
        ${candidates.map((candidate, index) => `
          <div class="candidate-item" data-index="${index}" style="
            margin: 10px 0;
            padding: 12px;
            border: 1px solid #555;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
          ">
            <div style="font-weight: bold; color: #00ff88;">${candidate.type}</div>
            <div style="font-size: 12px; color: #ccc; margin-top: 5px;">${candidate.description}</div>
            <div style="font-size: 11px; color: #888; margin-top: 3px;">互換性: ${candidate.compatibility.reason}</div>
          </div>
        `).join('')}
      </div>
      <div style="margin-top: 20px; text-align: center;">
        <button class="cancel-btn" style="
          background: #666;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          color: white;
          cursor: pointer;
          margin-right: 10px;
        ">キャンセル</button>
      </div>
    `
    
    // イベントリスナー追加
    modal.querySelectorAll('.candidate-item').forEach((item, index) => {
      item.addEventListener('click', () => {
        this.executeConnection(candidates[index])
        modal.remove()
      })
      
      item.addEventListener('mouseenter', () => {
        item.style.borderColor = '#4a90e2'
        item.style.background = 'rgba(74, 144, 226, 0.1)'
      })
      
      item.addEventListener('mouseleave', () => {
        item.style.borderColor = '#555'
        item.style.background = 'transparent'
      })
    })
    
    modal.querySelector('.cancel-btn').addEventListener('click', () => {
      this.resetSelection()
      modal.remove()
    })
    
    return modal
  }
  
  async executeConnection(candidate) {
    try {
      this.connectionManager.createConnection(candidate.sourceId, candidate.targetId, candidate.type)
      this.log(`✅ 接続作成: ${candidate.description}`)
      this.connectionManager.showConnectionStatus(`✅ 接続完了: ${candidate.description}`)
      
      // Phase 1: 複数接続を継続するため、ソースを維持
      // resetSelection()を呼ばずに、セカンドセレクションのみリセット
      this.continueMultipleConnections()
      
    } catch (error) {
      this.log(`❌ 接続失敗: ${error.message}`)
      this.connectionManager.showConnectionStatus(`❌ 接続失敗: ${error.message}`)
      this.resetSelection()
    }
  }
  
  /**
   * Phase 1: 複数接続継続
   */
  continueMultipleConnections() {
    // セカンドセレクションをクリア（ファーストはキープ）
    if (this.secondSelected) {
      const secondElement = document.querySelector(`[data-plugin-id="${this.secondSelected}"]`)
      if (secondElement) {
        secondElement.classList.remove('connecting-target')
      }
    }
    
    this.secondSelected = null
    this.connectionCandidates = []
    
    // 接続モードを継続
    this.isConnecting = true
    
    this.log(`🔄 接続継続モード: ${this.getPluginDisplayName(this.firstSelected)} から次の接続先を選択可能`)
    this.connectionManager.showConnectionStatus(`🔗 接続元: ${this.getPluginDisplayName(this.firstSelected)} | 次の接続先をクリックしてください`)
  }
  
  async resetSelection() {
    // Phase 3: 接続キャンセルIntent送信（接続中の場合）
    if (this.intentMode && this.voidFlowCore && this.isConnecting) {
      await this._sendConnectionCancelIntent('reset', this.firstSelected)
    }
    
    // ハイライト解除と元の色復元
    document.querySelectorAll('.connecting-source, .connecting-target').forEach(el => {
      console.log('🔍 Resetting element:', el, 'Classes before:', el.className)
      el.classList.remove('connecting-source', 'connecting-target')
      // 強制的に元の色に復元（success状態・selected状態もクリア）
      el.classList.remove('success', 'executing', 'error', 'completed', 'selected')
      el.style.borderColor = ''
      el.style.boxShadow = ''
      console.log('🔍 Element after reset:', el, 'Classes after:', el.className)
    })
    
    // 一時的な線削除
    this.connectionManager.resetConnectionUI()
    
    // 状態リセット
    this.firstSelected = null
    this.secondSelected = null
    this.isConnecting = false
    this.connectionCandidates = []
    
    this.log('🔄 Connection selection reset - all elements restored to default colors')
    
    // デバッグ：1秒後に再確認
    setTimeout(() => {
      document.querySelectorAll('.voidcore-ui-element').forEach(el => {
        console.log('🔍 1秒後の状態:', el, 'Classes:', el.className, 'Border:', getComputedStyle(el).borderColor)
      })
    }, 1000)
  }
  
  /**
   * Phase 3: 接続開始Intent送信
   */
  async _sendConnectionStartIntent(sourceId, event) {
    try {
      await this.connectionManager.voidFlowCore.sendIntent('voidflow.ui.connection.start', {
        sourceId: sourceId,
        sourceType: 'plugin',
        cursor: { x: event.clientX, y: event.clientY },
        connectionMode: 'data',
        timestamp: Date.now()
      })
      this.log(`📤 Connection start intent sent: ${sourceId}`)
    } catch (error) {
      this.log(`⚠️ Connection start intent failed: ${error.message}`)
    }
  }
  
  /**
   * Phase 3: 接続完了Intent送信
   */
  async _sendConnectionCompleteIntent(sourceId, targetId, candidates) {
    try {
      const bestCandidate = candidates[0] // 最適な候補を選択
      
      await this.connectionManager.voidFlowCore.sendIntent('voidflow.ui.connection.complete', {
        sourceId: sourceId,
        targetId: targetId,
        connectionType: bestCandidate?.type || 'data-flow',
        metadata: {
          candidateCount: candidates.length,
          selectedCandidate: bestCandidate,
          allCandidates: candidates
        },
        timestamp: Date.now()
      })
      this.log(`📤 Connection complete intent sent: ${sourceId} → ${targetId}`)
    } catch (error) {
      this.log(`⚠️ Connection complete intent failed: ${error.message}`)
    }
  }
  
  /**
   * Phase 3: 接続キャンセルIntent送信
   */
  async _sendConnectionCancelIntent(reason, sourceId) {
    try {
      await this.connectionManager.voidFlowCore.sendIntent('voidflow.ui.connection.cancel', {
        reason: reason,
        sourceId: sourceId,
        timestamp: Date.now()
      })
      this.log(`📤 Connection cancel intent sent: ${reason}`)
    } catch (error) {
      this.log(`⚠️ Connection cancel intent failed: ${error.message}`)
    }
  }
}

export default VoidCoreConnectionManager