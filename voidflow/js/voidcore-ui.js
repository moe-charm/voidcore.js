// voidcore-ui.js - UI専用VoidCore拡張クラス
// VoidFlow VoidCore化のための汎用UI基盤

import { VoidCore } from '/src/core/voidcore.js'
import { Message } from '/src/messaging/message.js'
import { initializeVoidFlowHybridCommunication } from './voidflow-hybrid-communication.js'
import { ButtonSendUI } from './ui-nodes/button-send-ui.js'
import { InputTextUI } from './ui-nodes/input-text-ui.js'
import { OutputConsoleUI } from './ui-nodes/output-console-ui.js'
import { StringUppercaseUI } from './ui-nodes/string-uppercase-ui.js'
import { CanvasManager } from './ui-components/canvas-manager.js'
import { DragDropManager } from './ui-components/drag-drop-manager.js'
import { SelectionManager } from './ui-components/selection-manager.js'
import { ConnectionManager } from './ui-components/connection-manager.js'
import { ElementManager } from './ui-components/element-manager.js'
import { ContextMenuManager } from './ui-components/context-menu-manager.js'

/**
 * 🎨 VoidCoreUI - UI操作専用のVoidCore拡張クラス
 * 
 * 設計原則:
 * - VoidCoreをコンポジションでUI専用機能を追加
 * - 高頻度UI操作のための最適化
 * - DOM操作とVoidCoreメッセージングの橋渡し
 * - UI状態管理の統一
 * 
 * 🔧 Phase3対応: 継承 → コンポジション設計
 */
export class VoidCoreUI {
  constructor(options = {}) {
    // 🔧 Phase3対応: コンポジション設計
    this.voidCore = new VoidCore(null, {
      debug: options.debug || true,
      uiMode: true
    })
    
    // VoidCoreの主要メソッドを委譲
    this.id = this.voidCore.id
    this.coreId = this.voidCore.coreId
    this.name = this.voidCore.name
    this.version = this.voidCore.version
    this.initialized = this.voidCore.initialized
    this.enableLogging = this.voidCore.enableLogging
    this.logLevel = this.voidCore.logLevel
    this.logElement = this.voidCore.logElement
    
    // 統合システムへの参照
    this.unifiedPluginManager = this.voidCore.unifiedPluginManager
    this.unifiedIntentHandler = this.voidCore.unifiedIntentHandler
    this.unifiedStatsManager = this.voidCore.unifiedStatsManager
    
    // Phase 2: VoidFlowCore統合
    this.voidFlowCore = null  // main-voidcore.jsで設定される
    
    // UI専用設定
    this.canvasManager = new CanvasManager(this)
    this.dragDropManager = new DragDropManager(this)
    this.selectionManager = new SelectionManager(this)
    this.connectionManager = new ConnectionManager(this)
    this.elementManager = new ElementManager(this)
    this.contextMenuManager = new ContextMenuManager(this)
    
    // 後方互換性のためのエイリアス
    this.uiElements = this.elementManager.uiElements
    this.uiPlugins = this.elementManager.uiPlugins
    
    // 高頻度UI操作用の直接チャンネル
    this.uiChannel = {
      updatePosition: this.createDirectUIChannel('position'),
      updateSelection: this.createDirectUIChannel('selection'),
      updateConnection: this.createDirectUIChannel('connection')
    }
    
    // 🚨 デバッグ: document レベルでクリックを監視
    document.addEventListener('click', (e) => {
      console.log(`🚨 DOCUMENT CLICK DEBUG:`)
      console.log(`  - Target: ${e.target.tagName}, ID: ${e.target.id}, Class: ${e.target.className}`)
      console.log(`  - Parent: ${e.target.parentElement?.tagName}, Class: ${e.target.parentElement?.className}`)
      console.log(`  - Closest .voidcore-ui-element: ${e.target.closest('.voidcore-ui-element')?.id}`)
      console.log(`  - Event phase: ${e.eventPhase}`)
    }, true) // キャプチャフェーズで監視
    
    this.log('🎨 VoidCoreUI initialized - UI-optimized VoidCore ready (Phase3)')
  }
  
  // 🔧 Phase3対応: VoidCoreメソッドの委譲
  log(message) {
    return this.voidCore.log(message)
  }
  
  debugLog(message) {
    return this.voidCore.base.debugLog(message)
  }
  
  setLogElement(element) {
    return this.voidCore.setLogElement(element)
  }
  
  getStats() {
    return this.voidCore.getStats()
  }
  
  getPlugins() {
    return this.voidCore.getPlugins()
  }
  
  registerPlugin(plugin) {
    return this.voidCore.unifiedPluginManager.registerPlugin(plugin)
  }
  
  removePlugin(pluginId) {
    return this.voidCore.unifiedPluginManager.removePlugin(pluginId)
  }

  /**
   * 🏭 静的ファクトリメソッド: 安全な非同期初期化
   * VoidCore.create()と同様のパターンを踏襲
   */
  static async create(options = {}) {
    // 1. 基本インスタンス生成
    const instance = new VoidCoreUI(options)
    
    // 2. 🔧 Phase3対応: VoidCore初期化
    await instance.voidCore.initPromise
    
    // 3. UI専用の追加初期化
    await instance._performUIAsyncInitialization()
    
    // 4. 完全に初期化されたインスタンスを返却
    instance.log('🎨 VoidCoreUI async initialization completed (Phase3)')
    return instance
  }

  /**
   * 🎨 UI専用非同期初期化
   */
  async _performUIAsyncInitialization() {
    // UI専用の非同期処理があれば追加
    // 例：UI Intent Handler登録など
    await this._registerUIIntentHandlers()
    
    // ハイブリッド通信システム初期化
    await this._initializeHybridCommunication()
  }

  /**
   * 🎯 UI専用Intent処理登録
   */
  async _registerUIIntentHandlers() {
    // UI専用のIntent処理を登録
    // voidflow.ui.* Intent群
    this.log('🎯 UI Intent handlers registered')
  }

  /**
   * 🌐 ハイブリッド通信システム初期化
   */
  async _initializeHybridCommunication() {
    try {
      this.hybridComm = await initializeVoidFlowHybridCommunication(this)
      this.log('🌐 Hybrid communication system integrated')
    } catch (error) {
      this.log(`❌ Hybrid communication initialization failed: ${error.message}`)
    }
  }

  /**
   * 🖥️ Canvas要素設定
   */
  setCanvas(canvasElement) {
    this.canvasManager.setCanvas(canvasElement)
  }

  /**
   * ⚡ 高頻度UI操作用直接チャンネル作成
   */
  createDirectUIChannel(channelType) {
    const channel = {
      type: channelType,
      queue: [],
      processing: false,
      
      // 直接更新（60FPS制限付き）
      update: (data) => {
        channel.queue.push({
          data: data,
          timestamp: Date.now()
        })
        
        if (!channel.processing) {
          channel.processing = true
          requestAnimationFrame(() => {
            this.processUIChannelQueue(channel)
            channel.processing = false
          })
        }
      }
    }
    
    return channel
  }

  /**
   * 🔄 UIチャンネルキュー処理 (ハイブリッド通信システム統合版)
   */
  processUIChannelQueue(channel) {
    // ハイブリッド通信システムが利用可能な場合はそちらを使用
    if (this.hybridComm) {
      return this.hybridComm.processUIChannelQueue(channel)
    }
    
    // フォールバック: 従来の処理
    const batch = [...channel.queue]
    channel.queue = []
    
    // 重複除去（最新の状態のみ保持）
    const deduped = new Map()
    batch.forEach(item => {
      const key = this.getUpdateKey(item.data, channel.type)
      deduped.set(key, item)
    })
    
    // バッチ処理実行
    for (const item of deduped.values()) {
      this.applyUIUpdate(item.data, channel.type)
    }
    
    this.debugLog(`🔄 Processed ${deduped.size} UI updates (${channel.type})`)
  }

  /**
   * 🔑 更新キー生成（重複除去用）
   */
  getUpdateKey(data, channelType) {
    switch (channelType) {
      case 'position':
        return `pos_${data.elementId}`
      case 'selection':
        return `sel_${data.elementId}`
      case 'connection':
        return `conn_${data.sourceId}_${data.targetId}`
      default:
        return `${channelType}_${data.elementId || data.id}`
    }
  }

  /**
   * ✨ UI更新適用
   */
  applyUIUpdate(data, channelType) {
    switch (channelType) {
      case 'position':
        this.updateElementPosition(data)
        break
      case 'selection':
        this.selectionManager.updateElementSelection(data)
        break
      case 'connection':
        this.connectionManager.updateConnectionLine(data)
        break
    }
  }

  /**
   * 📍 要素位置更新
   */
  updateElementPosition(data) {
    const { elementId, x, y } = data
    
    // elementIdを安全に文字列に変換
    const safeElementId = String(elementId)
    
    this.log(`📍 updateElementPosition called with elementId: ${safeElementId} (type: ${typeof elementId})`)
    
    const element = this.elementManager.getElement(safeElementId)
    
    if (element) {
      // ログ出力を無効化（パフォーマンス最適化）
      // this.log(`📍 Updating position for ${safeElementId} to (${x}, ${y})`)
      // this.log(`📍 Element found: ${element.id}, current position: (${element.style.left}, ${element.style.top})`)
      
      element.style.left = `${x}px`
      element.style.top = `${y}px`
      
      // 接続線の再描画を無効化（パフォーマンス最適化）
      // this.connectionManager.redrawConnectionsForElement(safeElementId)
      
      // VoidCoreメッセージ発行も無効化（パフォーマンス最適化）
      // this.publish(Message.notice('ui.element.moved', {
      //   elementId: safeElementId,
      //   position: { x, y },
      //   timestamp: Date.now()
      // }))
    } else {
      // エラーログのみ残す
      this.log(`❌ Element not found for updateElementPosition: ${safeElementId}`)
    }
  }




  /**
   * 🧩 UIプラグイン作成
   */
  async createUIPlugin(nodeType, position) {
    try {
      this.log(`🧩 createUIPlugin called: ${nodeType} at (${position.x}, ${position.y})`)
      
      // Canvas要素チェック
      if (!this.canvasManager.hasCanvas()) {
        throw new Error('Canvas element not set')
      }
      
      // 一意のプラグインID生成（Intent失敗時のフォールバック）
      const timestamp = Date.now()
      const random = Math.random().toString(36).substr(2, 9)
      const tempPluginId = `voidcore-plugin-${timestamp}-${random}`
      this.log(`🔧 Generated temp plugin ID: ${tempPluginId}`)
      
      // Phase 2: VoidFlowCore統合 - UI要素作成Intent発行
      let pluginId
      try {
        if (this.voidFlowCore) {
          this.log(`📤 Sending VoidFlowCore UI.ELEMENT.CREATE Intent for: ${nodeType}`)
          const intentResult = await this.voidFlowCore.sendIntent('voidflow.ui.element.create', {
            nodeType: nodeType,
            position: position,
            pluginId: tempPluginId,
            config: {
              uiMode: true,
              source: 'voidcore-ui'
            }
          })
          pluginId = intentResult.pluginId || intentResult.id || tempPluginId
          this.log(`📨 VoidFlowCore Intent returned: ${pluginId}`)
        } else {
          // フォールバック: 従来のVoidCore Intent
          this.log(`📤 Fallback: Sending legacy system.plugin.create Intent for: ${nodeType}`)
          const intentResponse = await this.voidCore.unifiedIntentHandler.processIntent({
            action: 'system.plugin.create',
            payload: {
              type: `voidflow.node.${nodeType}`,
              config: {
                nodeType: nodeType,
                position: position,
                uiMode: true
              }
            }
          })
          pluginId = intentResponse.pluginId || intentResponse.id || tempPluginId
          this.log(`📨 Legacy Intent returned: ${pluginId}`)
        }
      } catch (intentError) {
        this.log(`⚠️ Intent failed, using fallback ID: ${intentError.message}`)
        pluginId = tempPluginId
      }
      
      // プラグインIDが無効な場合はフォールバック
      if (!pluginId || pluginId === '' || typeof pluginId === 'object') {
        pluginId = tempPluginId
      }
      
      // pluginIdを確実に文字列に変換
      if (typeof pluginId === 'object') {
        pluginId = pluginId.id || pluginId.pluginId || tempPluginId
      }
      pluginId = String(pluginId)
      
      // UI要素作成
      const uiElement = this.createUIElement(nodeType, position, pluginId)
      
      // UI要素をMapに保存（確実に文字列キーで保存）
      this.elementManager.registerElement(pluginId, uiElement, nodeType)
      
      // Canvas要素に追加
      this.canvasManager.appendChild(uiElement)
      
      this.log(`🧩 UI Plugin created: ${nodeType} at (${position.x}, ${position.y}) with ID: ${pluginId}`)
      
      return pluginId
      
    } catch (error) {
      this.log(`❌ UI Plugin creation failed: ${error.message}`)
      this.log(`❌ Error stack: ${error.stack}`)
      throw error
    }
  }
  
  /**
   * 🎨 UI要素直接作成（VoidFlowCore専用）
   * Phase 2: Intent化対応のための直接作成メソッド
   */
  async createUIElementDirect(nodeType, position, pluginId) {
    try {
      this.log(`🎨 Direct UI element creation: ${nodeType} at (${position.x}, ${position.y}) with ID: ${pluginId}`)
      
      // Canvas要素チェック
      if (!this.canvasManager.hasCanvas()) {
        throw new Error('Canvas element not set')
      }
      
      // UI要素作成（Intent処理をスキップ）
      const uiElement = this.createUIElement(nodeType, position, pluginId)
      
      // UI要素をMapに保存
      this.elementManager.registerElement(pluginId, uiElement, nodeType)
      
      // Canvas要素に追加
      this.canvasManager.appendChild(uiElement)
      
      this.log(`✅ Direct UI element created: ${nodeType} with ID: ${pluginId}`)
      
      return {
        pluginId: pluginId,
        elementId: `ui-element-${pluginId}`,
        nodeType: nodeType,
        position: position,
        uiElement: uiElement
      }
      
    } catch (error) {
      this.log(`❌ Direct UI element creation failed: ${error.message}`)
      throw error
    }
  }

  /**
   * 🎨 UI要素作成
   */
  createUIElement(nodeType, position, pluginId) {
    const element = document.createElement('div')
    element.className = 'voidcore-ui-element'  // HTMLスタイルと一致
    element.id = `ui-element-${pluginId}`
    element.style.left = `${position.x}px`
    element.style.top = `${position.y}px`
    element.style.position = 'absolute'
    element.setAttribute('data-plugin-id', pluginId)
    element.setAttribute('data-node-type', nodeType)
    
    // 🚨 重要: プラグインパレット由来のクラスを削除
    element.classList.remove('plugin-item', 'plugin-icon')  // パレット由来のクラスを削除
    
    this.log(`🎨 createUIElement: ID=${element.id}, Class=${element.className}, data-plugin-id=${element.getAttribute('data-plugin-id')}`)
    
    this.log(`🎨 createUIElement: nodeType=${nodeType}, position={x:${position.x}, y:${position.y}}, pluginId=${pluginId}`) // 追加ログ

    // 視覚的コンテンツ追加
    this.addVisualContent(element, nodeType, pluginId)
    
    // ドラッグ可能にする
    this.dragDropManager.makeElementDraggable(element, pluginId)
    
    // クリック選択（キャプチャフェーズで確実に捕捉）
    element.addEventListener('click', (e) => {
      this.log(`🖱️ Click detected for: ${pluginId}, target: ${e.target.tagName}, class: ${e.target.className}`)
      
      // 接続ポートのクリックでない場合のみ選択処理
      const isConnectionPort = e.target.closest('.connection-port')
      if (!isConnectionPort) {
        // 🔗 接続管理のためにConnectionManagerに処理を委譲
        this.log(`🔍 Checking connectionManager: ${!!window.connectionManager}`)
        if (window.connectionManager) {
          this.log(`🔍 handlePluginClick method exists: ${!!window.connectionManager.handlePluginClick}`)
          if (window.connectionManager.handlePluginClick) {
            this.log(`🔗 Delegating click to ConnectionManager for: ${pluginId}`)
            window.connectionManager.handlePluginClick(pluginId, e)
          }
        } else {
          this.log(`❌ window.connectionManager is not available`)
        }
        
        // 通常の選択処理
        this.selectUIElement(pluginId)
        // e.stopPropagation() // バブリング防止 - 一時的に無効化してConnectionManagerに到達させる
      }
    }, true) // キャプチャフェーズで処理
    
    // 内部要素からのクリックもキャッチ
    element.addEventListener('click', (e) => {
      this.log(`🖱️ Bubble click detected for: ${pluginId}, target: ${e.target.tagName}, class: ${e.target.className}`)
      
      // ボタンなどの内部要素がクリックされた場合も処理
      const isConnectionPort = e.target.closest('.connection-port')
      if (!isConnectionPort) {
        // 🔗 接続管理のためにConnectionManagerに処理を委譲
        if (window.connectionManager && window.connectionManager.handlePluginClick) {
          this.log(`🔗 Delegating bubble click to ConnectionManager for: ${pluginId}`)
          window.connectionManager.handlePluginClick(pluginId, e)
        }
      }
    })
    
    // 右クリックメニュー
    element.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      e.stopPropagation() // バブリング防止
      this.log(`🖱️ Right-click detected for: ${pluginId}`)
      
      // 接続モード中かチェック
      const connectionManager = this.voidFlowCore?.connectionManager || window.voidFlowCore?.connectionManager
      if (connectionManager && connectionManager.smartConnectionManager && connectionManager.smartConnectionManager.isConnecting) {
        this.log('🚫 右クリック：接続モード中のためメニューを無効化')
        return false
      }
      
      // 接続ポートでなければプラグインメニューを表示
      const isConnectionPort = e.target.closest('.connection-port')
      if (!isConnectionPort) {
        this.contextMenuManager.showPluginMenu(pluginId, e.clientX, e.clientY)
      }
    })
    
    this.log(`🎨 UI element created: ${nodeType} (${pluginId})`)
    
    // Canvas要素に追加
    this.canvasManager.appendChild(element)

    return element
  }

  /**
   * 📄 視覚的コンテンツ追加
   */
  addVisualContent(element, nodeType, pluginId) {
    // ノードタイプに応じた表示名とアイコン
    const nodeInfo = this.getNodeDisplayInfo(nodeType)
    
    // pluginIdを安全に文字列に変換
    const pluginIdStr = String(pluginId)
    const displayId = pluginIdStr.length > 8 ? pluginIdStr.substring(0, 8) + '...' : pluginIdStr
    
    // ノードタイプに応じた追加コンテンツ
    const additionalContent = this.getAdditionalContent(nodeType, pluginId)
    
    element.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <div style="font-size: 16px; margin-right: 8px;">${nodeInfo.icon}</div>
        <div style="font-weight: bold; font-size: 12px; color: #00ff88;">${nodeInfo.name}</div>
      </div>
      <div style="font-size: 10px; color: #aaa; margin-bottom: 8px;">${nodeInfo.description}</div>
      ${additionalContent}
      <div style="font-size: 9px; color: #555; font-family: monospace;">ID: ${displayId}</div>
      <div class="connection-ports" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10;">
        <div class="connection-port input-port" style="position: absolute; left: -8px; top: 50%; transform: translateY(-50%); width: 12px; height: 12px; border-radius: 50%; background: #4a90e2; border: 2px solid #ffffff; cursor: crosshair; pointer-events: auto;"></div>
        <div class="connection-port output-port" style="position: absolute; right: -8px; top: 50%; transform: translateY(-50%); width: 12px; height: 12px; border-radius: 50%; background: #4a90e2; border: 2px solid #ffffff; cursor: crosshair; pointer-events: auto;"></div>
      </div>
    `
    
    // ノードタイプに応じた追加機能を初期化
    this.initializeNodeFeatures(element, nodeType, pluginId)
    
    // 🚨 デバッグ: パレット由来のクラスを完全削除
    this.removeUnwantedClasses(element)
  }
  
  /**
   * 🧹 パレット由来の不要なクラスを削除
   */
  removeUnwantedClasses(element) {
    // 自分自身と全ての子要素から不要なクラスを削除
    const unwantedClasses = ['plugin-item', 'plugin-icon', 'plugin-name', 'plugin-info', 'plugin-description', 'plugin-tags', 'plugin-priority']
    
    // 自分自身をチェック
    unwantedClasses.forEach(className => {
      element.classList.remove(className)
    })
    
    // 全ての子要素をチェック
    const allChildren = element.querySelectorAll('*')
    allChildren.forEach(child => {
      unwantedClasses.forEach(className => {
        child.classList.remove(className)
      })
    })
    
    this.log(`🧹 Removed unwanted classes from element: ${element.id}`)
  }

  /**
   * 📄 ノードタイプに応じた追加コンテンツ
   */
  getAdditionalContent(nodeType, pluginId) {
    // 🎨 モジュール化された UI コンポーネントを使用
    switch (nodeType) {
      case 'button.send':
        return ButtonSendUI.getAdditionalContent(pluginId)
      case 'input.text':
        return InputTextUI.getAdditionalContent(pluginId)
      case 'output.console':
        return OutputConsoleUI.getAdditionalContent(pluginId)
      case 'string.uppercase':
        return StringUppercaseUI.getAdditionalContent(pluginId)
      default:
        return ''
    }
  }

  /**
   * 🔧 ノードタイプに応じた追加機能初期化
   */
  initializeNodeFeatures(element, nodeType, pluginId) {
    // 🎨 モジュール化された UI コンポーネントを使用
    switch (nodeType) {
      case 'button.send':
        ButtonSendUI.initializeNodeFeatures(element, pluginId, this)
        break
      case 'input.text':
        InputTextUI.initializeNodeFeatures(element, pluginId, this)
        break
      case 'output.console':
      case 'string.uppercase':
        // 初期化処理が不要なコンポーネント
        break
    }
  }

  /**
   * 🚀 送信ボタンクリック処理
   */
  async handleSendButtonClick(pluginId) {
    this.log(`🚀 Send button clicked for: ${pluginId}`)
    
    try {
      // 接続されたプラグインにトリガーを送信
      if (window.connectionManager) {
        this.log(`🚀 Executing data flow from button: ${pluginId}`)
        await window.connectionManager.executeDataFlow(pluginId, 'trigger')
      }
      
      // 🎨 視覚的フィードバック復活
      const element = this.elementManager.getElement(pluginId)
      if (element) {
        element.classList.add('executing')
        setTimeout(() => {
          element.classList.remove('executing')
          element.classList.add('success')
          setTimeout(() => {
            element.classList.remove('success')
          }, 1000)
        }, 200)
      }
      
    } catch (error) {
      this.log(`❌ Send button execution failed: ${error.message}`)
      
      // 🎨 エラー視覚的フィードバック復活
      const element = this.elementManager.getElement(pluginId)
      if (element) {
        element.classList.add('error')
        setTimeout(() => {
          element.classList.remove('error')
        }, 1000)
      }
    }
  }

  /**
   * 📝 テキスト入力変更処理
   */
  handleTextInputChange(pluginId, value) {
    this.log(`📝 Text input changed for ${pluginId}: ${value}`)
    
    // 入力値を保存
    const element = this.elementManager.getElement(pluginId)
    if (element) {
      element.setAttribute('data-current-value', value)
    }
  }

  /**
   * ✅ テキスト入力送信処理
   */
  async handleTextInputSubmit(pluginId, value) {
    this.log(`✅ Text input submitted for ${pluginId}: "${value}"`)
    
    try {
      // 接続されたプラグインに文字列として送信
      if (window.connectionManager) {
        await window.connectionManager.executeDataFlow(pluginId, value)
      }
      
    } catch (error) {
      this.log(`❌ Text input submission failed: ${error.message}`)
    }
  }

  /**
   * 📊 コンソール出力処理
   */
  updateConsoleOutput(pluginId, data) {
    const element = this.elementManager.getElement(pluginId)
    if (!element) return
    
    const consoleOutput = element.querySelector('.console-output')
    if (!consoleOutput) return
    
    // データを表示用に整形
    let displayData = ''
    if (typeof data === 'string') {
      displayData = data
    } else if (typeof data === 'object') {
      displayData = JSON.stringify(data, null, 2)
    } else {
      displayData = String(data)
    }
    
    const timestamp = new Date().toLocaleTimeString()
    
    // 出力を追加
    consoleOutput.innerHTML += `<div style="margin-bottom: 2px; word-wrap: break-word;">[${timestamp}] ${displayData}</div>`
    
    // 自動スクロール
    consoleOutput.scrollTop = consoleOutput.scrollHeight
    
    this.log(`📊 Console output updated for ${pluginId}: "${displayData}"`)
  }

  /**
   * 🔄 データフロー受信処理
   */
  async handleDataFlowReceived(pluginId, data) {
    this.log(`🔄 Data flow received for ${pluginId}:`, data)
    
    const element = this.elementManager.getElement(pluginId)
    if (!element) {
      this.log(`❌ Element not found for plugin: ${pluginId}`)
      return
    }
    
    // 🎨 シンプル視覚フィードバック: メッセージ受け取ったら緑 → 3秒後に元の色
    // 接続状態をクリーンアップしてから元の色を記憶
    element.classList.remove('connecting-source', 'connecting-target')
    
    // 元の色を記憶（クリーンアップ後）
    const originalBorderColor = getComputedStyle(element).borderColor
    const originalBoxShadow = getComputedStyle(element).boxShadow
    
    element.classList.add('success')
    setTimeout(() => {
      element.classList.remove('success')
      // 念のため接続状態も再度クリーンアップ
      element.classList.remove('connecting-source', 'connecting-target')
      // 元の色を明示的に復元
      element.style.borderColor = originalBorderColor
      element.style.boxShadow = originalBoxShadow
      this.log(`🔄 ${pluginId}: Visual feedback completed - restored to original colors`)
    }, 3000)
    
    const nodeType = element.getAttribute('data-node-type')
    this.log(`🔄 Processing data flow for node type: ${nodeType}`)
    
    switch (nodeType) {
      case 'input.text':
        // input.textノードがデータを受信した場合、現在の値を送信
        const textInput = element.querySelector('.text-input')
        if (textInput) {
          const currentValue = textInput.value || element.getAttribute('data-current-value') || ''
          this.log(`📝 Input.text forwarding current value: "${currentValue}"`)
          
          // 接続されたプラグインに文字列として送信
          if (window.connectionManager) {
            await window.connectionManager.executeDataFlow(pluginId, currentValue)
          }
        }
        break
        
      case 'output.console':
        // 受信データから表示用データを抽出
        let displayData = ''
        if (typeof data === 'string') {
          displayData = data
        } else if (data && typeof data === 'object') {
          displayData = data.data || data.text || JSON.stringify(data)
        } else {
          displayData = String(data)
        }
        
        this.updateConsoleOutput(pluginId, displayData)
        
        // 🎨 console も同じシンプルフィードバック（3秒緑表示）
        break
        
      case 'string.uppercase':
        // 受信データから文字列を抽出
        let inputText = ''
        if (typeof data === 'string') {
          inputText = data
        } else if (data && typeof data === 'object') {
          inputText = data.data || data.text || String(data)
        } else {
          inputText = String(data)
        }
        
        // 文字列を大文字に変換
        const uppercased = inputText.toUpperCase()
        this.log(`🔤 String uppercased: "${inputText}" → "${uppercased}"`)
        
        // 接続されたプラグインに文字列として送信
        if (window.connectionManager) {
          await window.connectionManager.executeDataFlow(pluginId, uppercased)
        }
        break
        
      case 'web.fetch':
        // Web APIを呼び出して結果を送信
        try {
          const url = String(data.data || data)
          this.log(`🌐 Web fetch: ${url}`)
          
          const response = await fetch(url)
          const result = await response.text()
          
          if (window.connectionManager) {
            await window.connectionManager.executeDataFlow(pluginId, {
              type: 'response',
              source: 'web.fetch',
              timestamp: Date.now(),
              data: result
            })
          }
        } catch (error) {
          this.log(`❌ Web fetch failed: ${error.message}`)
        }
        break
        
      case 'json.parser':
        // JSONをパースして結果を送信
        try {
          const jsonString = String(data.data || data)
          const parsed = JSON.parse(jsonString)
          this.log(`📋 JSON parsed successfully`)
          
          if (window.connectionManager) {
            await window.connectionManager.executeDataFlow(pluginId, {
              type: 'object',
              source: 'json.parser',
              timestamp: Date.now(),
              data: parsed
            })
          }
        } catch (error) {
          this.log(`❌ JSON parse failed: ${error.message}`)
        }
        break
        
      case 'core.plugin-lister':
        // 🔍 VoidCore自己観測：全プラグイン情報を収集
        try {
          // 🔍 複数レイヤーの観測
          const corePlugins = this.voidCore.getPlugins() // VoidCore内部プラグイン
          const uiPlugins = Array.from(this.uiElements.keys()) // VoidCoreUI要素
          const registeredPlugins = this.voidCore.unifiedPluginManager.getAllPlugins() // 統合管理
          
          this.log(`🔍 観測範囲詳細:`)
          this.log(`  - VoidCore内部: ${corePlugins.length}個`)
          this.log(`  - VoidCoreUI要素: ${uiPlugins.length}個`)
          this.log(`  - 統合プラグイン管理: ${registeredPlugins.length}個`)
          
          const pluginInfo = {
            timestamp: Date.now(),
            observationLayers: {
              corePlugins: {
                count: corePlugins.length,
                plugins: corePlugins.map(plugin => ({
                  id: plugin.id,
                  type: plugin.type,
                  status: plugin.status || 'active',
                  displayName: plugin.displayName || plugin.id
                }))
              },
              uiElements: {
                count: uiPlugins.length,
                elements: uiPlugins.map(id => ({
                  id: id,
                  type: 'ui-element',
                  nodeType: this.uiElements.get(id)?.getAttribute('data-node-type') || 'unknown'
                }))
              },
              unifiedPlugins: {
                count: registeredPlugins.length,
                plugins: registeredPlugins.map(plugin => ({
                  id: plugin.id,
                  type: plugin.type,
                  status: plugin.status || 'active'
                }))
              }
            },
            totalVisible: corePlugins.length + uiPlugins.length + registeredPlugins.length,
            coreInfo: {
              coreId: this.voidCore.coreId,
              initialized: this.voidCore.initialized,
              version: this.voidCore.version
            }
          }
          
          this.log(`🔍 Plugin Lister: 総観測数 ${pluginInfo.totalVisible}個 (Core:${corePlugins.length} + UI:${uiPlugins.length} + Unified:${registeredPlugins.length})`)
          
          // 接続されたプラグインに自己観測データを送信
          if (window.connectionManager) {
            await window.connectionManager.executeDataFlow(pluginId, {
              type: 'core-metadata',
              source: 'core.plugin-lister',
              timestamp: Date.now(),
              data: pluginInfo
            })
          }
        } catch (error) {
          this.log(`❌ Plugin Lister failed: ${error.message}`)
        }
        break
        
      case 'flow.connector':
        // 🌀 Flow Connector：接続線の動的操作
        try {
          const connectionStats = window.connectionManager ? 
            window.connectionManager.getConnectionStats() : 
            { message: 'ConnectionManager not available' }
          
          this.log(`🌀 Flow Connector: Processing connection metadata`)
          
          // 接続情報をメタデータとして送信
          if (window.connectionManager) {
            await window.connectionManager.executeDataFlow(pluginId, {
              type: 'connection-metadata', 
              source: 'flow.connector',
              timestamp: Date.now(),
              data: connectionStats
            })
          }
        } catch (error) {
          this.log(`❌ Flow Connector failed: ${error.message}`)
        }
        break
        
      default:
        this.log(`⚠️ Unknown node type for data flow: ${nodeType}`)
    }
  }

  /**
   * 📋 ノード表示情報取得
   */
  getNodeDisplayInfo(nodeType) {
    const nodeMap = {
      'button.send': { icon: '🔘', name: 'Button: Send', description: '自律プラグインを刺激する' },
      'input.text': { icon: '📝', name: 'Input: Text', description: '宇宙の起源、意志の表明' },
      'string.uppercase': { icon: '🔤', name: 'String: UpperCase', description: '意志が変化する様を体感' },
      'output.console': { icon: '📊', name: 'Output: Console', description: '観測手段＝現実の確定' },
      'web.fetch': { icon: '🌐', name: 'Web: Fetch API', description: '外宇宙に扉を開ける' },
      'json.parser': { icon: '📋', name: 'JSON: Parser', description: '混沌に意味を与える' },
      'ui.card': { icon: '🎨', name: 'UI: Simple Card', description: '美しさは意味の完成' },
      'core.plugin-lister': { icon: '🔍', name: 'Core: Plugin Lister', description: 'VoidCore自己観測' },
      'core.connection-manager': { icon: '🔗', name: 'Core: Connection Manager', description: 'VoidCore接続管理' },
      'flow.connector': { icon: '🌀', name: 'Flow: Connector', description: '自己編集＝創造の完成' },

      // simple-plugins.js の type に対応するエントリを追加するにゃ！
      'ui.button': { icon: '🔘', name: 'Interactive Button', description: 'インタラクティブなボタン' },
      'logic.calculator': { icon: '🧮', name: 'Math Calculator', description: '高度な計算機' },
      'data.json': { icon: '📊', name: 'JSON Parser', description: 'JSONデータを解析' },
      'network.http': { icon: '🌐', name: 'HTTP Client', description: 'HTTPリクエストを送信' },
      'visualization.chart': { icon: '📈', name: 'Interactive Chart', description: 'インタラクティブなグラフ' },
      'media.image': { icon: '🖼️', name: 'Image Processor', description: '画像処理' },
      'utility.string': { icon: '🔤', name: 'String Helper', description: '文字列操作ユーティリティ' },
      'ai.text': { icon: '🤖', name: 'AI Text Generator', description: 'AIによるテキスト生成' },
      'storage.database': { icon: '💾', name: 'Database Storage', description: 'データベースアダプター' },
      'workflow.automation': { icon: '⚡', name: 'Workflow Automation', description: 'ワークフロー自動化' }
    }
    
    return nodeMap[nodeType] || { 
      icon: '❓', 
      name: nodeType, 
      description: 'Unknown node type' 
    }
  }


  /**
   * 🎯 UI要素選択（ハイブリッド通信システム統合版）
   */
  selectUIElement(pluginId) {
    // 🚨 デバッグ: どこから呼ばれているかスタックトレース
    console.log(`🎯 selectUIElement called for: ${pluginId}`)
    console.log(`🎯 Call stack:`, new Error().stack)
    
    if (this.hybridComm) {
      // ハイブリッド通信システムを使用
      this.hybridComm.fastUIUpdate('selection', {
        selectedIds: [pluginId],
        deselectedIds: this.selectionManager.getSelectedElementIds()
      })
    } else {
      // フォールバック: 従来の処理
      // 選択管理をSelectionManagerに委譲
      this.selectionManager.clearAllSelections()
      this.selectionManager.selectElement(pluginId)
    }
  }

  /**
   * ❌ 接続モードキャンセル（ConnectionManagerに委譲）
   */
  cancelConnectionMode() {
    this.connectionManager.cancelConnectionMode()
  }

  /**
   * 🔄 要素の接続線再描画（ConnectionManagerに委譲）
   */
  redrawConnectionsForElement(pluginId) {
    this.connectionManager.redrawConnectionsForElement(pluginId)
  }

  /**
   * 🔍 UIプラグイン取得
   */
  getUIPlugin(pluginId) {
    return this.elementManager.getPlugin(pluginId)
  }

  /**
   * 🗑️ UIプラグイン削除
   */
  async removeUIPlugin(pluginId) {
    // UI要素削除
    const element = this.elementManager.getElement(pluginId)
    if (element && element.parentNode) {
      element.parentNode.removeChild(element)
    }
    
    this.elementManager.removeElement(pluginId)
    this.elementManager.removePlugin(pluginId)
    this.selectionManager.deselectElement(pluginId)
    
    // 🔧 Phase3対応: VoidCoreプラグイン削除
    await this.voidCore.unifiedIntentHandler.processIntent({
      action: 'system.plugin.remove',
      payload: {
        pluginId: pluginId
      }
    })
    
    this.log(`🗑️ UI Plugin removed: ${pluginId}`)
  }

  /**
   * 📊 UI状態取得
   */
  getUIState() {
    return {
      elementCount: this.elementManager.uiElements.size,
      selectedCount: this.selectionManager.getSelectedCount(),
      pluginCount: this.elementManager.uiPlugins.size,
      canvasAttached: this.canvasManager.hasCanvas()
    }
  }


  /**
   * 🔍 デバッグ情報取得
   */
  getDebugInfo() {
    const canvasInfo = this.canvasManager.getCanvasInfo()
    return {
      canvasElement: canvasInfo.attached,
      canvasElementId: canvasInfo.id,
      canvasElementClassName: canvasInfo.className,
      elementCount: this.elementManager.uiElements.size,
      elementIds: this.elementManager.getElementIds(),
      selectedCount: this.selectionManager.getSelectedCount(),
      selectedIds: this.selectionManager.getSelectedElementIds(),
      pluginCount: this.elementManager.uiPlugins.size,
      pluginIds: this.elementManager.getPluginIds(),
      hybridCommAvailable: !!this.hybridComm
    }
  }
}

export default VoidCoreUI