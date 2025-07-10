// drag-drop-manager.js - ドラッグ&ドロップ管理機能
// VoidCoreUI から分離されたドラッグ&ドロップ専用管理クラス

/**
 * 🖱️ DragDropManager - 要素のドラッグ&ドロップ機能管理
 * 
 * 責任:
 * - 要素のドラッグ機能追加
 * - ドラッグ中の座標計算と更新
 * - フレーム制限による滑らかなアニメーション
 * - 境界チェックとCanvas制限
 * - 接続線のリアルタイム更新
 */
export class DragDropManager {
  constructor(voidCoreUI) {
    this.voidCoreUI = voidCoreUI
    this.dragState = null
    this.activeDrags = new Map() // pluginId → drag state
    
    // Phase 2: Intent化フラグ
    this.intentMode = false  // Phase 2で有効化
  }
  
  /**
   * Phase 2: Intent化モード有効化
   */
  enableIntentMode() {
    this.intentMode = true
    this.voidCoreUI.log('🎯 DragDropManager: Intent mode enabled')
  }
  
  disableIntentMode() {
    this.intentMode = false
    this.voidCoreUI.log('🎯 DragDropManager: Intent mode disabled')
  }

  /**
   * 🖱️ 要素をドラッグ可能にする
   */
  makeElementDraggable(element, pluginId) {
    // ドラッグ初期化ログを無効化（パフォーマンス最適化）
    // this.voidCoreUI.log(`🖱️ Making element draggable: ${pluginId}`)
    let isDragging = false
    let startX, startY
    let animationFrameId = null
    
    // 要素に一意のドラッグIDを付与（デバッグ用）
    const dragId = `drag-${pluginId}-${Date.now()}`
    element.setAttribute('data-drag-id', dragId)
    
    element.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'INPUT') return // 入力フィールドは除外
      
      // ドラッグ開始ログを無効化（パフォーマンス最適化）
      // this.voidCoreUI.log(`🖱️ Mouse down detected for: ${pluginId} (${dragId})`)
      // this.voidCoreUI.log(`🖱️ Element ID: ${element.id}, Class: ${element.className}`)
      
      // 接続ポートはドラッグ対象外
      const isConnectionPort = e.target.closest('.connection-port')
      if (!isConnectionPort) {
        e.stopPropagation() // VoidCoreConnectionManagerとの競合を防ぐ
      }
      
      // Phase 2: ドラッグ開始Intent送信
      if (this.intentMode && this.voidCoreUI.voidFlowCore) {
        this._sendDragStartIntent(pluginId, e)
      }
      
      isDragging = true
      
      // Canvas基準での相対座標計算
      const elementRect = element.getBoundingClientRect()
      
      startX = e.clientX - elementRect.left
      startY = e.clientY - elementRect.top
      
      // 開始位置ログを無効化（パフォーマンス最適化）
      // this.voidCoreUI.log(`🖱️ Start position: mouse(${e.clientX}, ${e.clientY}), element(${elementRect.left}, ${elementRect.top}), offset(${startX}, ${startY})`)
      
      const onMouseMove = (e) => {
        if (!isDragging) return
        
        // フレーム制限でスムーズなドラッグ
        if (animationFrameId) return
        
        animationFrameId = requestAnimationFrame(() => {
          this._updateElementPosition(element, pluginId, e.clientX, e.clientY, startX, startY)
          
          // Phase 2: ドラッグ移動Intent送信
          if (this.intentMode && this.voidCoreUI.voidFlowCore) {
            this._sendDragMoveIntent(pluginId, e.clientX, e.clientY)
          }
          
          animationFrameId = null
        })
      }
      
      const onMouseUp = (e) => {
        // Phase 2: ドラッグ終了Intent送信
        if (this.intentMode && this.voidCoreUI.voidFlowCore) {
          this._sendDragEndIntent(pluginId, e)
        }
        
        this._endDrag(pluginId, dragId, onMouseMove, onMouseUp, animationFrameId)
        isDragging = false
        animationFrameId = null
      }
      
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
      
      e.preventDefault()
    })
  }

  /**
   * 🎯 要素位置の更新（ドラッグ中）
   */
  _updateElementPosition(element, pluginId, clientX, clientY, startX, startY) {
    // Canvas基準での新しい座標計算
    const relativePos = this.voidCoreUI.canvasManager.getRelativePosition(clientX, clientY)
    const newX = relativePos.x - startX
    const newY = relativePos.y - startY
    
    // 境界チェック（Canvas内に制限）
    const constrained = this.voidCoreUI.canvasManager.constrainPosition(
      newX, newY, element.offsetWidth, element.offsetHeight
    )
    
    // 即座にDOM要素の位置を更新（この要素のみ）
    element.style.left = `${constrained.x}px`
    element.style.top = `${constrained.y}px`
    
    // ドラッグ中にリアルタイムで接続線を更新
    this.voidCoreUI.redrawConnectionsForElement(pluginId)
  }

  /**
   * 🛑 ドラッグ終了処理
   */
  _endDrag(pluginId, dragId, onMouseMove, onMouseUp, animationFrameId) {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    
    // アニメーションフレームをクリア
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }
    
    // ドラッグ終了時に接続線を再描画（矢印追従のため）
    // this.voidCoreUI.log(`🖱️ Mouse up detected for: ${pluginId} (${dragId})`)
    this.voidCoreUI.redrawConnectionsForElement(pluginId)
    
    // アクティブなドラッグ状態から削除
    this.activeDrags.delete(pluginId)
  }

  /**
   * 📊 ドラッグ状態の取得
   */
  getDragState() {
    return {
      dragState: this.dragState,
      activeDrags: this.activeDrags.size,
      activeDragIds: Array.from(this.activeDrags.keys())
    }
  }

  /**
   * 🧹 全ドラッグ操作のクリア
   */
  clearAllDrags() {
    this.activeDrags.clear()
    this.dragState = null
  }

  /**
   * 🔍 特定要素のドラッグ状態確認
   */
  isElementDragging(pluginId) {
    return this.activeDrags.has(pluginId)
  }
  
  /**
   * Phase 2: ドラッグ開始Intent送信
   */
  async _sendDragStartIntent(pluginId, event) {
    try {
      const elementRect = document.getElementById(`ui-element-${pluginId}`)?.getBoundingClientRect()
      const relativePos = this.voidCoreUI.canvasManager.getRelativePosition(event.clientX, event.clientY)
      
      await this.voidCoreUI.voidFlowCore.sendIntent('voidflow.ui.element.move', {
        elementId: pluginId,
        action: 'drag-start',
        startPosition: relativePos,
        mousePosition: { x: event.clientX, y: event.clientY },
        isDragging: true,
        timestamp: Date.now()
      })
      
    } catch (error) {
      this.voidCoreUI.log(`⚠️ Drag start intent failed: ${error.message}`)
    }
  }
  
  /**
   * Phase 2: ドラッグ移動Intent送信
   */
  async _sendDragMoveIntent(pluginId, clientX, clientY) {
    try {
      const relativePos = this.voidCoreUI.canvasManager.getRelativePosition(clientX, clientY)
      
      await this.voidCoreUI.voidFlowCore.sendIntent('voidflow.ui.element.move', {
        elementId: pluginId,
        action: 'drag-move',
        newPosition: relativePos,
        mousePosition: { x: clientX, y: clientY },
        isDragging: true,
        timestamp: Date.now()
      })
      
    } catch (error) {
      // ドラッグ中のエラーは無視（パフォーマンス優先）
      // this.voidCoreUI.log(`⚠️ Drag move intent failed: ${error.message}`)
    }
  }
  
  /**
   * Phase 2: ドラッグ終了Intent送信
   */
  async _sendDragEndIntent(pluginId, event) {
    try {
      const element = document.getElementById(`ui-element-${pluginId}`)
      const finalPosition = element ? {
        x: parseInt(element.style.left) || 0,
        y: parseInt(element.style.top) || 0
      } : { x: 0, y: 0 }
      
      await this.voidCoreUI.voidFlowCore.sendIntent('voidflow.ui.element.move', {
        elementId: pluginId,
        action: 'drag-end',
        finalPosition: finalPosition,
        mousePosition: { x: event.clientX, y: event.clientY },
        isDragging: false,
        timestamp: Date.now()
      })
      
    } catch (error) {
      this.voidCoreUI.log(`⚠️ Drag end intent failed: ${error.message}`)
    }
  }
}