// layout-plugin-base.js - レイアウトプラグインベースクラス
// 全レイアウトプラグインの共通基盤

/**
 * 🎨 LayoutPluginBase - レイアウトプラグインベースクラス
 * 
 * 全レイアウトプラグインの共通機能を提供
 * - 配置計算
 * - アニメーション
 * - インタラクション
 * - 設定管理
 */
export class LayoutPluginBase {
  constructor(name, options = {}) {
    this.name = name
    this.version = '1.0.0'
    this.type = 'layout'
    
    // 基本設定
    this.config = {
      animationDuration: 300,
      animationEasing: 'ease-in-out',
      spacing: 20,
      padding: 50,
      centerX: 0,
      centerY: 0,
      enableAnimation: true,
      enableInteraction: true,
      maintainAspectRatio: true,
      ...options
    }
    
    // 状態管理
    this.state = {
      isActive: false,
      isAnimating: false,
      lastUpdate: 0,
      cachedPositions: new Map(),
      containerSize: { width: 0, height: 0 },
      elementCount: 0
    }
    
    // イベントリスナー
    this.eventListeners = {
      'layout.update': [],
      'layout.complete': [],
      'layout.error': [],
      'element.position': [],
      'element.select': []
    }
    
    this.log(`🎨 ${this.name} layout plugin initialized`)
  }
  
  log(message) {
    console.log(`[${this.name}Layout] ${message}`)
  }
  
  /**
   * レイアウトの計算（オーバーライド必須）
   */
  calculateLayout(elements, container) {
    throw new Error('calculateLayout must be implemented by subclass')
  }
  
  /**
   * 要素の配置
   */
  async applyLayout(elements, container) {
    try {
      this.log(`🎯 Applying ${this.name} layout to ${elements.length} elements`)
      
      this.state.isAnimating = true
      this.state.lastUpdate = Date.now()
      this.state.elementCount = elements.length
      
      // コンテナサイズを更新
      this.updateContainerSize(container)
      
      // レイアウト計算
      const positions = await this.calculateLayout(elements, container)
      
      // 位置をキャッシュ
      this.cachePositions(positions)
      
      // アニメーション適用
      if (this.config.enableAnimation) {
        await this.animateToPositions(elements, positions)
      } else {
        this.setPositionsImmediate(elements, positions)
      }
      
      this.state.isAnimating = false
      this.emit('layout.complete', { name: this.name, positions })
      
      this.log(`✅ ${this.name} layout applied successfully`)
      
    } catch (error) {
      this.state.isAnimating = false
      this.log(`❌ Layout application failed: ${error.message}`)
      this.emit('layout.error', { name: this.name, error })
      throw error
    }
  }
  
  /**
   * コンテナサイズの更新
   */
  updateContainerSize(container) {
    if (container) {
      const rect = container.getBoundingClientRect()
      this.state.containerSize = {
        width: rect.width,
        height: rect.height
      }
      
      // 中心座標を更新
      this.config.centerX = rect.width / 2
      this.config.centerY = rect.height / 2
    }
  }
  
  /**
   * 位置のキャッシュ
   */
  cachePositions(positions) {
    this.state.cachedPositions.clear()
    
    positions.forEach(pos => {
      this.state.cachedPositions.set(pos.id, {
        x: pos.x,
        y: pos.y,
        z: pos.z || 0,
        scale: pos.scale || 1,
        rotation: pos.rotation || 0
      })
    })
  }
  
  /**
   * アニメーション付き位置設定
   */
  async animateToPositions(elements, positions) {
    const animations = positions.map(pos => {
      const element = elements.find(el => el.id === pos.id)
      if (!element) return Promise.resolve()
      
      return this.animateElement(element, pos)
    })
    
    await Promise.all(animations)
  }
  
  /**
   * 単一要素のアニメーション
   */
  animateElement(element, position) {
    return new Promise((resolve) => {
      const startTime = Date.now()
      const startPos = this.getElementPosition(element)
      
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / this.config.animationDuration, 1)
        const eased = this.easeInOut(progress)
        
        // 位置の補間
        const x = startPos.x + (position.x - startPos.x) * eased
        const y = startPos.y + (position.y - startPos.y) * eased
        const scale = startPos.scale + (position.scale - startPos.scale) * eased
        const rotation = startPos.rotation + (position.rotation - startPos.rotation) * eased
        
        // 要素に適用
        this.setElementPosition(element, { x, y, scale, rotation })
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          resolve()
        }
      }
      
      requestAnimationFrame(animate)
    })
  }
  
  /**
   * 即座の位置設定
   */
  setPositionsImmediate(elements, positions) {
    positions.forEach(pos => {
      const element = elements.find(el => el.id === pos.id)
      if (element) {
        this.setElementPosition(element, pos)
      }
    })
  }
  
  /**
   * 要素の現在位置を取得
   */
  getElementPosition(element) {
    const transform = element.style.transform || ''
    const translateMatch = transform.match(/translate\(([^,]+),\s*([^)]+)\)/)
    const scaleMatch = transform.match(/scale\(([^)]+)\)/)
    const rotateMatch = transform.match(/rotate\(([^)]+)deg\)/)
    
    return {
      x: translateMatch ? parseFloat(translateMatch[1]) : 0,
      y: translateMatch ? parseFloat(translateMatch[2]) : 0,
      scale: scaleMatch ? parseFloat(scaleMatch[1]) : 1,
      rotation: rotateMatch ? parseFloat(rotateMatch[1]) : 0
    }
  }
  
  /**
   * 要素の位置を設定
   */
  setElementPosition(element, position) {
    // 要素のサイズを取得して中心位置を計算
    const size = this.getElementSize(element)
    const offsetX = position.x - size.width / 2
    const offsetY = position.y - size.height / 2
    
    // transformで位置、スケール、回転を一括設定
    const transform = `translate(${offsetX}px, ${offsetY}px) scale(${position.scale || 1}) rotate(${position.rotation || 0}deg)`
    
    element.style.transform = transform
    element.style.transformOrigin = `${size.width / 2}px ${size.height / 2}px`
    
    // left/topはリセット
    element.style.left = '0'
    element.style.top = '0'
    
    // Z-indexの設定
    if (position.z !== undefined) {
      element.style.zIndex = position.z
    }
    
    this.emit('element.position', {
      id: element.id,
      position: position
    })
  }
  
  /**
   * イージング関数
   */
  easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  }
  
  /**
   * 設定の更新
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
    this.log(`⚙️ Configuration updated: ${Object.keys(newConfig).join(', ')}`)
  }
  
  /**
   * レイアウトのリセット
   */
  resetLayout() {
    this.state.cachedPositions.clear()
    this.state.isAnimating = false
    this.state.lastUpdate = 0
    
    this.log('🔄 Layout reset')
  }
  
  /**
   * 要素の追加
   */
  addElement(element) {
    if (this.state.cachedPositions.has(element.id)) {
      this.log(`⚠️ Element ${element.id} already exists in layout`)
      return
    }
    
    // デフォルト位置に配置
    const defaultPosition = this.getDefaultPosition()
    this.setElementPosition(element, defaultPosition)
    this.state.cachedPositions.set(element.id, defaultPosition)
    
    this.log(`➕ Element added to layout: ${element.id}`)
  }
  
  /**
   * 要素の削除
   */
  removeElement(elementId) {
    if (this.state.cachedPositions.has(elementId)) {
      this.state.cachedPositions.delete(elementId)
      this.log(`➖ Element removed from layout: ${elementId}`)
    }
  }
  
  /**
   * デフォルト位置の取得
   */
  getDefaultPosition() {
    return {
      x: this.config.centerX,
      y: this.config.centerY,
      scale: 1,
      rotation: 0,
      z: 0
    }
  }
  
  /**
   * 要素サイズの取得
   */
  getElementSize(element) {
    const rect = element.getBoundingClientRect()
    
    // 要素にサイズがない場合はデフォルト値を返す
    const width = rect.width || 80
    const height = rect.height || 80
    
    return {
      width: width,
      height: height
    }
  }
  
  /**
   * 衝突検出
   */
  checkCollision(pos1, size1, pos2, size2, margin = 0) {
    const left1 = pos1.x - size1.width / 2
    const right1 = pos1.x + size1.width / 2
    const top1 = pos1.y - size1.height / 2
    const bottom1 = pos1.y + size1.height / 2
    
    const left2 = pos2.x - size2.width / 2 - margin
    const right2 = pos2.x + size2.width / 2 + margin
    const top2 = pos2.y - size2.height / 2 - margin
    const bottom2 = pos2.y + size2.height / 2 + margin
    
    return !(right1 < left2 || left1 > right2 || bottom1 < top2 || top1 > bottom2)
  }
  
  /**
   * 境界チェック
   */
  ensureInBounds(position, elementSize) {
    const container = this.state.containerSize
    const padding = this.config.padding
    
    const minX = elementSize.width / 2 + padding
    const maxX = container.width - elementSize.width / 2 - padding
    const minY = elementSize.height / 2 + padding
    const maxY = container.height - elementSize.height / 2 - padding
    
    return {
      x: Math.max(minX, Math.min(maxX, position.x)),
      y: Math.max(minY, Math.min(maxY, position.y)),
      scale: position.scale || 1,
      rotation: position.rotation || 0
    }
  }
  
  /**
   * イベントエミッター
   */
  emit(eventName, data) {
    const listeners = this.eventListeners[eventName] || []
    listeners.forEach(listener => {
      try {
        listener(data)
      } catch (error) {
        this.log(`❌ Event listener error: ${eventName}`)
      }
    })
  }
  
  /**
   * イベントリスナー追加
   */
  on(eventName, listener) {
    if (!this.eventListeners[eventName]) {
      this.eventListeners[eventName] = []
    }
    this.eventListeners[eventName].push(listener)
  }
  
  /**
   * 統計情報の取得
   */
  getStats() {
    return {
      name: this.name,
      version: this.version,
      isActive: this.state.isActive,
      isAnimating: this.state.isAnimating,
      elementCount: this.state.elementCount,
      lastUpdate: this.state.lastUpdate,
      cachedPositions: this.state.cachedPositions.size,
      containerSize: this.state.containerSize,
      config: this.config
    }
  }
  
  /**
   * アクティブ状態の切り替え
   */
  setActive(active) {
    this.state.isActive = active
    this.log(`${active ? '🟢' : '🔴'} Layout ${active ? 'activated' : 'deactivated'}`)
  }
}

console.log('🎨 LayoutPluginBase system loaded!')