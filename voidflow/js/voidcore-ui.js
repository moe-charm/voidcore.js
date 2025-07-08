// voidcore-ui.js - UI専用VoidCore拡張クラス
// VoidFlow VoidCore化のための汎用UI基盤

import { VoidCore } from '/src/core/voidcore.js'
import { Message } from '/src/messaging/message.js'
import { initializeVoidFlowHybridCommunication } from './voidflow-hybrid-communication.js'

/**
 * 🎨 VoidCoreUI - UI操作専用のVoidCore拡張クラス
 * 
 * 設計原則:
 * - VoidCoreを継承してUI専用機能を追加
 * - 高頻度UI操作のための最適化
 * - DOM操作とVoidCoreメッセージングの橋渡し
 * - UI状態管理の統一
 */
export class VoidCoreUI extends VoidCore {
  constructor(options = {}) {
    super(null, {
      debug: options.debug || true,
      uiMode: true
    })
    
    // UI専用設定
    this.canvasElement = null
    this.selectedElements = new Set()
    this.dragState = null
    this.uiElements = new Map() // elementId → DOM element
    this.uiPlugins = new Map()  // pluginId → UI plugin instance
    
    // 高頻度UI操作用の直接チャンネル
    this.uiChannel = {
      updatePosition: this.createDirectUIChannel('position'),
      updateSelection: this.createDirectUIChannel('selection'),
      updateConnection: this.createDirectUIChannel('connection')
    }
    
    this.log('🎨 VoidCoreUI initialized - UI-optimized VoidCore ready')
  }

  /**
   * 🏭 静的ファクトリメソッド: 安全な非同期初期化
   * VoidCore.create()と同様のパターンを踏襲
   */
  static async create(options = {}) {
    // 1. 基本インスタンス生成
    const instance = new VoidCoreUI(options)
    
    // 2. 非同期初期化実行（親のSystemBootManager含む）
    await instance._performAsyncInitialization()
    
    // 3. UI専用の追加初期化
    await instance._performUIAsyncInitialization()
    
    // 4. 完全に初期化されたインスタンスを返却
    instance.log('🎨 VoidCoreUI async initialization completed')
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
    this.canvasElement = canvasElement
    this.setupCanvasEvents()
    this.log('🖥️ Canvas element registered')
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
        this.updateElementSelection(data)
        break
      case 'connection':
        this.updateConnectionLine(data)
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
    
    const element = this.uiElements.get(safeElementId)
    
    if (element) {
      // ログ出力を無効化（パフォーマンス最適化）
      // this.log(`📍 Updating position for ${safeElementId} to (${x}, ${y})`)
      // this.log(`📍 Element found: ${element.id}, current position: (${element.style.left}, ${element.style.top})`)
      
      element.style.left = `${x}px`
      element.style.top = `${y}px`
      
      // 接続線の再描画を無効化（パフォーマンス最適化）
      // this.redrawConnectionsForElement(safeElementId)
      
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
   * 🎯 要素選択更新
   */
  updateElementSelection(data) {
    const { elementId, selected } = data
    const element = this.uiElements.get(elementId)
    
    if (element) {
      if (selected) {
        element.classList.add('selected')
        this.selectedElements.add(elementId)
      } else {
        element.classList.remove('selected')
        this.selectedElements.delete(elementId)
      }
      
      this.publish(Message.notice('ui.element.selected', {
        elementId: elementId,
        selected: selected,
        selectedCount: this.selectedElements.size
      }))
    }
  }

  /**
   * 🔗 接続線更新
   */
  updateConnectionLine(data) {
    // 接続線の描画更新（SVG操作）
    const { sourceId, targetId, connectionType } = data
    
    this.publish(Message.notice('ui.connection.updated', {
      sourceId: sourceId,
      targetId: targetId,
      connectionType: connectionType || 'data-flow'
    }))
  }

  /**
   * 🖱️ Canvas イベント設定
   */
  setupCanvasEvents() {
    if (!this.canvasElement) return
    
    // ドラッグ&ドロップ
    this.canvasElement.addEventListener('dragover', (e) => {
      e.preventDefault()
    })
    
    this.canvasElement.addEventListener('drop', (e) => {
      e.preventDefault()
      const nodeType = e.dataTransfer.getData('text/plain')
      const rect = this.canvasElement.getBoundingClientRect()
      const position = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
      
      this.createUIPlugin(nodeType, position)
    })
    
    // 右クリックでの接続キャンセル
    this.canvasElement.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      this.cancelConnectionMode()
    })
  }

  /**
   * 🧩 UIプラグイン作成
   */
  async createUIPlugin(nodeType, position) {
    try {
      this.log(`🧩 createUIPlugin called: ${nodeType} at (${position.x}, ${position.y})`)
      
      // Canvas要素チェック
      if (!this.canvasElement) {
        throw new Error('Canvas element not set')
      }
      
      // 一意のプラグインID生成（Intent失敗時のフォールバック）
      const timestamp = Date.now()
      const random = Math.random().toString(36).substr(2, 9)
      const tempPluginId = `voidcore-plugin-${timestamp}-${random}`
      this.log(`🔧 Generated temp plugin ID: ${tempPluginId}`)
      
      // VoidCoreのプラグイン作成Intent発行
      let pluginId
      try {
        this.log(`📤 Sending system.createPlugin Intent for: ${nodeType}`)
        pluginId = await this.sendIntent('system.createPlugin', {
          type: `voidflow.node.${nodeType}`,
          config: {
            nodeType: nodeType,
            position: position,
            uiMode: true
          }
        })
        this.log(`📨 system.createPlugin Intent returned: ${pluginId}`)
      } catch (intentError) {
        this.log(`⚠️ Intent failed, using fallback ID: ${intentError.message}`)
        pluginId = tempPluginId
      }
      
      // プラグインIDが無効な場合はフォールバック
      this.log(`🔍 PluginId type: ${typeof pluginId}, value: ${JSON.stringify(pluginId)}`)
      if (!pluginId || pluginId === '' || typeof pluginId === 'object') {
        this.log(`⚠️ Invalid pluginId received (type: ${typeof pluginId}), using fallback: ${tempPluginId}`)
        pluginId = tempPluginId
      }
      
      // pluginIdを確実に文字列に変換
      if (typeof pluginId === 'object') {
        this.log(`⚠️ PluginId is object, converting to string: ${JSON.stringify(pluginId)}`)
        pluginId = pluginId.id || pluginId.pluginId || tempPluginId
      }
      pluginId = String(pluginId)
      
      // UI要素作成
      this.log(`🎨 Creating UI element for: ${pluginId}`)
      const uiElement = this.createUIElement(nodeType, position, pluginId)
      
      // UI要素をMapに保存（確実に文字列キーで保存）
      this.uiElements.set(pluginId, uiElement)
      this.log(`📋 UI element stored in Map: ${pluginId} (type: ${typeof pluginId})`)
      this.log(`📋 Current uiElements Map size: ${this.uiElements.size}`)
      this.log(`📋 All stored IDs: ${Array.from(this.uiElements.keys())}`)
      this.log(`📋 All stored ID types: ${Array.from(this.uiElements.keys()).map(id => typeof id)}`)
      
      // Canvas要素に追加
      this.canvasElement.appendChild(uiElement)
      this.log(`📌 UI element appended to canvas: ${pluginId}`)
      
      // DOM要素の確認
      const domElement = document.getElementById(`ui-element-${pluginId}`)
      this.log(`📍 DOM element verification: ${!!domElement}`)
      if (domElement) {
        this.log(`📍 DOM element data-plugin-id: ${domElement.getAttribute('data-plugin-id')}`)
      }
      
      // UI要素の可視性チェック
      const rect = uiElement.getBoundingClientRect()
      this.log(`📐 UI element bounds: ${rect.width}x${rect.height} at (${rect.left}, ${rect.top})`)
      
      this.log(`🧩 UI Plugin created: ${nodeType} at (${position.x}, ${position.y}) with ID: ${pluginId}`)
      
      return pluginId
      
    } catch (error) {
      this.log(`❌ UI Plugin creation failed: ${error.message}`)
      this.log(`❌ Error stack: ${error.stack}`)
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
    
    // 視覚的コンテンツ追加
    this.addVisualContent(element, nodeType, pluginId)
    
    // ドラッグ可能にする
    this.makeElementDraggable(element, pluginId)
    
    // クリック選択
    element.addEventListener('click', (e) => {
      this.log(`🖱️ Click detected for: ${pluginId}`)
      
      // 接続ポートのクリックでない場合のみ選択処理
      const isConnectionPort = e.target.closest('.connection-port')
      if (!isConnectionPort) {
        this.selectUIElement(pluginId)
      }
      
      // 接続管理のため、stopPropagationを削除
      // e.stopPropagation() // 削除: 接続管理でイベントが必要
    })
    
    this.log(`🎨 UI element created: ${nodeType} (${pluginId})`)
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
  }

  /**
   * 📄 ノードタイプに応じた追加コンテンツ
   */
  getAdditionalContent(nodeType, pluginId) {
    switch (nodeType) {
      case 'button.send':
        return `
          <div style="margin: 8px 0;">
            <button class="send-button" data-plugin-id="${pluginId}" style="
              background: linear-gradient(145deg, #ff6b6b, #ee5a52);
              border: none;
              color: white;
              padding: 6px 12px;
              border-radius: 4px;
              font-size: 11px;
              cursor: pointer;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            ">🚀 送信</button>
          </div>
        `
      case 'input.text':
        return `
          <div style="margin: 8px 0;">
            <input type="text" class="text-input" data-plugin-id="${pluginId}" placeholder="テキストを入力" style="
              background: rgba(255,255,255,0.1);
              border: 1px solid #4a90e2;
              color: white;
              padding: 4px 8px;
              border-radius: 3px;
              font-size: 10px;
              width: 100%;
              box-sizing: border-box;
            ">
          </div>
        `
      case 'output.console':
        return `
          <div style="margin: 8px 0;">
            <div class="console-output" data-plugin-id="${pluginId}" style="
              background: rgba(0,0,0,0.3);
              border: 1px solid #555;
              color: #80c0ff;
              padding: 4px 6px;
              border-radius: 3px;
              font-size: 9px;
              font-family: monospace;
              min-height: 20px;
              max-height: 40px;
              overflow-y: auto;
            ">出力待機中...</div>
          </div>
        `
      default:
        return ''
    }
  }

  /**
   * 🔧 ノードタイプに応じた追加機能初期化
   */
  initializeNodeFeatures(element, nodeType, pluginId) {
    switch (nodeType) {
      case 'button.send':
        const sendButton = element.querySelector('.send-button')
        if (sendButton) {
          sendButton.addEventListener('click', (e) => {
            e.stopPropagation()
            this.handleSendButtonClick(pluginId)
          })
          
          // ホバーエフェクト
          // ホバーエフェクトを無効化（パフォーマンス最適化）
          // sendButton.addEventListener('mouseenter', () => {
          //   sendButton.style.transform = 'scale(1.05)'
          //   sendButton.style.boxShadow = '0 4px 8px rgba(255,107,107,0.3)'
          // })
          
          // sendButton.addEventListener('mouseleave', () => {
          //   sendButton.style.transform = 'scale(1)'
          //   sendButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)'
          // })
        }
        break
        
      case 'input.text':
        const textInput = element.querySelector('.text-input')
        if (textInput) {
          textInput.addEventListener('input', (e) => {
            this.handleTextInputChange(pluginId, e.target.value)
          })
          
          textInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
              this.handleTextInputSubmit(pluginId, e.target.value)
            }
          })
        }
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
      
      // 視覚的フィードバックを無効化（パフォーマンス最適化）
      // const element = this.uiElements.get(pluginId)
      // if (element) {
      //   element.classList.add('executing')
      //   setTimeout(() => {
      //     element.classList.remove('executing')
      //     element.classList.add('success')
      //     setTimeout(() => {
      //       element.classList.remove('success')
      //     }, 1000)
      //   }, 200)
      // }
      
    } catch (error) {
      this.log(`❌ Send button execution failed: ${error.message}`)
      
      // エラー視覚的フィードバックを無効化（パフォーマンス最適化）
      // const element = this.uiElements.get(pluginId)
      // if (element) {
      //   element.classList.add('error')
      //   setTimeout(() => {
      //     element.classList.remove('error')
      //   }, 1000)
      // }
    }
  }

  /**
   * 📝 テキスト入力変更処理
   */
  handleTextInputChange(pluginId, value) {
    this.log(`📝 Text input changed for ${pluginId}: ${value}`)
    
    // 入力値を保存
    const element = this.uiElements.get(pluginId)
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
    const element = this.uiElements.get(pluginId)
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
    
    const element = this.uiElements.get(pluginId)
    if (!element) {
      this.log(`❌ Element not found for plugin: ${pluginId}`)
      return
    }
    
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
      'flow.connector': { icon: '🌀', name: 'Flow: Connector', description: '自己編集＝創造の完成' }
    }
    
    return nodeMap[nodeType] || { 
      icon: '❓', 
      name: nodeType, 
      description: 'Unknown node type' 
    }
  }

  /**
   * 🖱️ 要素ドラッグ機能
   */
  makeElementDraggable(element, pluginId) {
    // ドラッグ初期化ログを無効化（パフォーマンス最適化）
    // this.log(`🖱️ Making element draggable: ${pluginId}`)
    let isDragging = false
    let startX, startY
    let animationFrameId = null
    
    // 要素に一意のドラッグIDを付与（デバッグ用）
    const dragId = `drag-${pluginId}-${Date.now()}`
    element.setAttribute('data-drag-id', dragId)
    
    element.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'INPUT') return // 入力フィールドは除外
      
      // ドラッグ開始ログを無効化（パフォーマンス最適化）
      // this.log(`🖱️ Mouse down detected for: ${pluginId} (${dragId})`)
      // this.log(`🖱️ Element ID: ${element.id}, Class: ${element.className}`)
      // this.log(`🖱️ data-plugin-id: ${element.getAttribute('data-plugin-id')}`)
      
      // 接続ポートのクリックでない場合のみstopPropagation
      const isConnectionPort = e.target.closest('.connection-port')
      if (!isConnectionPort) {
        e.stopPropagation() // VoidCoreConnectionManagerとの競合を防ぐ
      }
      
      isDragging = true
      
      // Canvas基準での相対座標計算
      const canvasRect = this.canvasElement.getBoundingClientRect()
      const elementRect = element.getBoundingClientRect()
      
      startX = e.clientX - elementRect.left
      startY = e.clientY - elementRect.top
      
      // 開始位置ログを無効化（パフォーマンス最適化）
      // this.log(`🖱️ Start position: mouse(${e.clientX}, ${e.clientY}), element(${elementRect.left}, ${elementRect.top}), offset(${startX}, ${startY})`)
      
      const onMouseMove = (e) => {
        if (!isDragging) return
        
        // フレーム制限でスムーズなドラッグ
        if (animationFrameId) return
        
        animationFrameId = requestAnimationFrame(() => {
          // Canvas基準での新しい座標計算
          const newX = e.clientX - canvasRect.left - startX
          const newY = e.clientY - canvasRect.top - startY
          
          // 境界チェック（Canvas内に制限）
          const constrainedX = Math.max(0, Math.min(newX, canvasRect.width - element.offsetWidth))
          const constrainedY = Math.max(0, Math.min(newY, canvasRect.height - element.offsetHeight))
          
          // 即座にDOM要素の位置を更新（この要素のみ）
          element.style.left = `${constrainedX}px`
          element.style.top = `${constrainedY}px`
          
          // ドラッグ中にリアルタイムで接続線を更新
          this.redrawConnectionsForElement(pluginId)
          
          animationFrameId = null
        })
      }
      
      const onMouseUp = () => {
        isDragging = false
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
        
        // アニメーションフレームをクリア
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId)
          animationFrameId = null
        }
        
        // ドラッグ終了時に接続線を再描画（矢印追従のため）
        // this.log(`🖱️ Mouse up detected for: ${pluginId} (${dragId})`)
        this.redrawConnectionsForElement(pluginId)
      }
      
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
      
      e.preventDefault()
    })
  }

  /**
   * 🎯 UI要素選択（ハイブリッド通信システム統合版）
   */
  selectUIElement(pluginId) {
    if (this.hybridComm) {
      // ハイブリッド通信システムを使用
      this.hybridComm.fastUIUpdate('selection', {
        selectedIds: [pluginId],
        deselectedIds: Array.from(this.selectedElements)
      })
    } else {
      // フォールバック: 従来の処理
      // 他の選択を解除
      this.selectedElements.forEach(id => {
        this.uiChannel.updateSelection.update({
          elementId: id,
          selected: false
        })
      })
      
      // 新しい選択
      this.uiChannel.updateSelection.update({
        elementId: pluginId,
        selected: true
      })
    }
    
    this.selectedElements.clear()
    this.selectedElements.add(pluginId)
  }

  /**
   * ❌ 接続モードキャンセル
   */
  cancelConnectionMode() {
    this.publish(Message.notice('ui.connection.cancelled', {
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
    // this.log(`🔄 Redrawing connections for: ${safePluginId} (type: ${typeof pluginId})`)
    
    // ConnectionManagerがある場合は使用
    if (window.connectionManager && window.connectionManager.redrawConnectionsFromNode) {
      // this.log(`🔄 Using window.connectionManager.redrawConnectionsFromNode`)
      window.connectionManager.redrawConnectionsFromNode(safePluginId)
    } else {
      // エラーログは残す
      this.log(`❌ window.connectionManager.redrawConnectionsFromNode not found`)
    }
    
    // VoidCoreConnectionManagerがある場合も使用
    if (this.hybridComm && this.hybridComm.updateConnection) {
      // this.log(`🔄 Using hybridComm.fastUIUpdate`)
      this.hybridComm.fastUIUpdate('connection', {
        elementId: safePluginId,
        action: 'redraw'
      })
    }
    
    // 完了ログを無効化
    // this.log(`🔄 Connections redrawn for element: ${safePluginId}`)
  }

  /**
   * 🔍 UIプラグイン取得
   */
  getUIPlugin(pluginId) {
    return this.uiPlugins.get(pluginId)
  }

  /**
   * 🗑️ UIプラグイン削除
   */
  async removeUIPlugin(pluginId) {
    // UI要素削除
    const element = this.uiElements.get(pluginId)
    if (element && element.parentNode) {
      element.parentNode.removeChild(element)
    }
    
    this.uiElements.delete(pluginId)
    this.uiPlugins.delete(pluginId)
    this.selectedElements.delete(pluginId)
    
    // VoidCoreプラグイン削除
    await this.sendIntent('system.removePlugin', {
      pluginId: pluginId
    })
    
    this.log(`🗑️ UI Plugin removed: ${pluginId}`)
  }

  /**
   * 📊 UI状態取得
   */
  getUIState() {
    return {
      elementCount: this.uiElements.size,
      selectedCount: this.selectedElements.size,
      pluginCount: this.uiPlugins.size,
      canvasAttached: !!this.canvasElement
    }
  }

  /**
   * 🔍 デバッグ情報取得
   */
  getDebugInfo() {
    return {
      canvasElement: !!this.canvasElement,
      canvasElementId: this.canvasElement?.id,
      canvasElementClassName: this.canvasElement?.className,
      elementCount: this.uiElements.size,
      elementIds: Array.from(this.uiElements.keys()),
      selectedCount: this.selectedElements.size,
      selectedIds: Array.from(this.selectedElements),
      pluginCount: this.uiPlugins.size,
      pluginIds: Array.from(this.uiPlugins.keys()),
      hybridCommAvailable: !!this.hybridComm
    }
  }
}

export default VoidCoreUI