// canvas-manager.js - Canvas管理機能
// VoidCoreUI から分離された Canvas 専用管理クラス

/**
 * 🖥️ CanvasManager - Canvas要素の管理と操作
 * 
 * 責任:
 * - Canvas要素の設定と管理
 * - Canvas イベントの初期化
 * - Canvas座標系での位置計算
 * - Canvas境界チェック
 */
export class CanvasManager {
  constructor(voidCoreUI) {
    this.voidCoreUI = voidCoreUI
    this.canvasElement = null
  }

  /**
   * 🖥️ Canvas要素設定
   */
  setCanvas(canvasElement) {
    this.canvasElement = canvasElement
    this.setupCanvasEvents()
    this.voidCoreUI.log('🖥️ Canvas element registered')
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
      
      this.voidCoreUI.createUIPlugin(nodeType, position)
    })
    
    // 右クリックでの接続キャンセル
    this.canvasElement.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      this.voidCoreUI.cancelConnectionMode()
    })
  }

  /**
   * 🎨 Canvas要素に UI要素を追加
   */
  appendChild(element) {
    if (!this.canvasElement) {
      this.voidCoreUI.log('❌ Canvas element is null or undefined. Cannot append UI element.')
      return false
    }
    
    this.voidCoreUI.log(`🎨 Attempting to append element to canvas: ${this.canvasElement.id}`)
    this.canvasElement.appendChild(element)
    this.voidCoreUI.log(`🎨 Element appended to canvas. Current child count: ${this.canvasElement.children.length}`)
    return true
  }

  /**
   * 🧮 Canvas基準での相対座標計算
   */
  getRelativePosition(clientX, clientY) {
    if (!this.canvasElement) return { x: 0, y: 0 }
    
    const canvasRect = this.canvasElement.getBoundingClientRect()
    return {
      x: clientX - canvasRect.left,
      y: clientY - canvasRect.top
    }
  }

  /**
   * 🔒 Canvas境界内に位置を制限
   */
  constrainPosition(x, y, elementWidth, elementHeight) {
    if (!this.canvasElement) return { x, y }
    
    const canvasRect = this.canvasElement.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(x, canvasRect.width - elementWidth)),
      y: Math.max(0, Math.min(y, canvasRect.height - elementHeight))
    }
  }

  /**
   * 📊 Canvas情報取得
   */
  getCanvasInfo() {
    return {
      attached: !!this.canvasElement,
      id: this.canvasElement?.id,
      className: this.canvasElement?.className,
      childCount: this.canvasElement?.children.length || 0
    }
  }

  /**
   * ✅ Canvas要素の存在確認
   */
  hasCanvas() {
    return !!this.canvasElement
  }

  /**
   * 📐 Canvas のサイズ取得
   */
  getCanvasSize() {
    if (!this.canvasElement) return { width: 0, height: 0 }
    
    const rect = this.canvasElement.getBoundingClientRect()
    return {
      width: rect.width,
      height: rect.height
    }
  }
}