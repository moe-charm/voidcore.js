// voidcore-ui.js - UI専用VoidCore拡張クラス
// VoidFlow VoidCore化のための汎用UI基盤

import { VoidCore } from '/src/voidcore.js'
import { Message } from '/src/message.js'

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
   * 🔄 UIチャンネルキュー処理
   */
  processUIChannelQueue(channel) {
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
    const element = this.uiElements.get(elementId)
    
    if (element) {
      element.style.left = `${x}px`
      element.style.top = `${y}px`
      
      // VoidCoreメッセージ発行（低頻度）
      this.publish(Message.notice('ui.element.moved', {
        elementId: elementId,
        position: { x, y },
        timestamp: Date.now()
      }))
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
      // VoidCoreのプラグイン作成Intent発行
      const pluginId = await this.sendIntent('system.createPlugin', {
        type: `voidflow.node.${nodeType}`,
        config: {
          nodeType: nodeType,
          position: position,
          uiMode: true
        }
      })
      
      // UI要素作成
      const uiElement = this.createUIElement(nodeType, position, pluginId)
      this.uiElements.set(pluginId, uiElement)
      this.canvasElement.appendChild(uiElement)
      
      this.log(`🧩 UI Plugin created: ${nodeType} at (${position.x}, ${position.y})`)
      
      return pluginId
      
    } catch (error) {
      this.log(`❌ UI Plugin creation failed: ${error.message}`)
      throw error
    }
  }

  /**
   * 🎨 UI要素作成
   */
  createUIElement(nodeType, position, pluginId) {
    const element = document.createElement('div')
    element.className = 'voidflow-ui-element'
    element.id = `ui-element-${pluginId}`
    element.style.left = `${position.x}px`
    element.style.top = `${position.y}px`
    element.style.position = 'absolute'
    element.setAttribute('data-plugin-id', pluginId)
    element.setAttribute('data-node-type', nodeType)
    
    // ドラッグ可能にする
    this.makeElementDraggable(element, pluginId)
    
    // クリック選択
    element.addEventListener('click', (e) => {
      e.stopPropagation()
      this.selectUIElement(pluginId)
    })
    
    return element
  }

  /**
   * 🖱️ 要素ドラッグ機能
   */
  makeElementDraggable(element, pluginId) {
    let isDragging = false
    let startX, startY
    
    element.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'INPUT') return // 入力フィールドは除外
      
      isDragging = true
      startX = e.clientX - element.offsetLeft
      startY = e.clientY - element.offsetTop
      
      const onMouseMove = (e) => {
        if (!isDragging) return
        
        const newX = e.clientX - startX
        const newY = e.clientY - startY
        
        // 高頻度UI更新
        this.uiChannel.updatePosition.update({
          elementId: pluginId,
          x: newX,
          y: newY
        })
      }
      
      const onMouseUp = () => {
        isDragging = false
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
      }
      
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
      
      e.preventDefault()
    })
  }

  /**
   * 🎯 UI要素選択
   */
  selectUIElement(pluginId) {
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

  /**
   * ❌ 接続モードキャンセル
   */
  cancelConnectionMode() {
    this.publish(Message.notice('ui.connection.cancelled', {
      timestamp: Date.now()
    }))
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
}

export default VoidCoreUI