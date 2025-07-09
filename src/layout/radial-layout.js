// radial-layout.js - Radial レイアウトプラグイン
// 放射状配置でプラグインを美しく整列

import { LayoutPluginBase } from './layout-plugin-base.js'

/**
 * 🌟 RadialLayout - 放射状レイアウトプラグイン
 * 
 * 中心から放射状にプラグインを配置
 * - 角度による配置
 * - 距離による層分け
 * - 動的角度調整
 * - 美しい曲線配置
 */
export class RadialLayout extends LayoutPluginBase {
  constructor(options = {}) {
    super('Radial', {
      startRadius: 100,        // 開始半径
      radiusStep: 80,          // 半径増分
      startAngle: 0,           // 開始角度（度）
      angleStep: 45,           // 角度増分（度）
      maxElementsPerRing: 8,   // 1つのリングの最大要素数
      ringGap: 20,             // リング間の間隔
      enableSpiral: false,     // スパイラル配置
      spiralTightness: 0.5,    // スパイラルの密度
      clockwise: true,         // 時計回り
      enablePulse: false,      // パルスエフェクト
      pulseSpeed: 2,           // パルス速度
      adaptiveSpacing: true,   // 適応的間隔
      ...options
    })
    
    // Radial固有の状態
    this.radialState = {
      rings: [],               // リング情報
      totalElements: 0,        // 総要素数
      currentAngle: 0,         // 現在の角度
      pulsePhase: 0,           // パルスフェーズ
      animationId: null,       // アニメーションID
      elementAngles: new Map() // 要素角度マッピング
    }
    
    this.log('🌟 Radial layout plugin initialized')
  }
  
  /**
   * Radial レイアウトの計算
   */
  async calculateLayout(elements, container) {
    this.log(`🌟 Calculating radial layout for ${elements.length} elements`)
    
    // 要素を優先度でソート
    const sortedElements = this.sortElementsByPriority(elements)
    
    // リングの計算
    const rings = this.calculateRings(sortedElements)
    
    // 位置の計算
    const positions = this.config.enableSpiral ? 
      this.calculateSpiralPositions(sortedElements) :
      this.calculateRingPositions(rings)
    
    // 状態の更新
    this.radialState.rings = rings
    this.radialState.totalElements = elements.length
    
    // パルスエフェクト開始
    if (this.config.enablePulse) {
      this.startPulseAnimation()
    }
    
    return positions
  }
  
  /**
   * 要素を優先度でソート
   */
  sortElementsByPriority(elements) {
    const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 }
    
    return elements.sort((a, b) => {
      const priorityA = this.getElementPriority(a)
      const priorityB = this.getElementPriority(b)
      
      const orderA = priorityOrder[priorityA] || 1
      const orderB = priorityOrder[priorityB] || 1
      
      return orderA - orderB
    })
  }
  
  /**
   * 要素の優先度を取得
   */
  getElementPriority(element) {
    if (element.pluginAttributes && element.pluginAttributes.priority) {
      return element.pluginAttributes.priority
    }
    
    if (element.dataset && element.dataset.priority) {
      return element.dataset.priority
    }
    
    return 'medium'
  }
  
  /**
   * リングの計算
   */
  calculateRings(elements) {
    const rings = []
    let currentRingIndex = 0
    let elementsInCurrentRing = 0
    let maxElementsInRing = this.config.maxElementsPerRing
    
    elements.forEach((element, index) => {
      // 新しいリングが必要かチェック
      if (elementsInCurrentRing >= maxElementsInRing) {
        currentRingIndex++
        elementsInCurrentRing = 0
        
        // 外側のリングは要素数を増やす
        if (this.config.adaptiveSpacing) {
          maxElementsInRing = Math.floor(this.config.maxElementsPerRing * (1 + currentRingIndex * 0.5))
        }
      }
      
      // リングが存在しない場合は作成
      if (!rings[currentRingIndex]) {
        rings[currentRingIndex] = {
          index: currentRingIndex,
          radius: this.config.startRadius + currentRingIndex * this.config.radiusStep,
          elements: [],
          maxElements: maxElementsInRing,
          angleStep: 0 // 後で計算
        }
      }
      
      rings[currentRingIndex].elements.push(element)
      elementsInCurrentRing++
    })
    
    // 各リングの角度ステップを計算
    rings.forEach(ring => {
      ring.angleStep = ring.elements.length > 0 ? 360 / ring.elements.length : 0
    })
    
    return rings
  }
  
  /**
   * リング配置の位置計算
   */
  calculateRingPositions(rings) {
    const positions = []
    const centerX = this.config.centerX
    const centerY = this.config.centerY
    
    rings.forEach(ring => {
      ring.elements.forEach((element, index) => {
        const angle = this.config.startAngle + index * ring.angleStep
        const radians = (angle * Math.PI) / 180
        
        // 時計回りまたは反時計回り
        const actualRadians = this.config.clockwise ? radians : -radians
        
        const x = centerX + Math.cos(actualRadians) * ring.radius
        const y = centerY + Math.sin(actualRadians) * ring.radius
        
        // 要素のスケール（距離に応じて調整）
        const scale = Math.max(0.5, 1 - ring.index * 0.1)
        
        positions.push({
          id: element.id,
          x: x,
          y: y,
          scale: scale,
          rotation: angle, // 中心を向く
          z: 50 - ring.index * 5
        })
        
        // 角度をキャッシュ
        this.radialState.elementAngles.set(element.id, angle)
      })
    })
    
    return positions
  }
  
  /**
   * スパイラル配置の位置計算
   */
  calculateSpiralPositions(elements) {
    const positions = []
    const centerX = this.config.centerX
    const centerY = this.config.centerY
    
    elements.forEach((element, index) => {
      // スパイラル計算
      const t = index * this.config.spiralTightness
      const angle = this.config.startAngle + t * this.config.angleStep
      const radius = this.config.startRadius + t * this.config.radiusStep
      
      const radians = (angle * Math.PI) / 180
      const actualRadians = this.config.clockwise ? radians : -radians
      
      const x = centerX + Math.cos(actualRadians) * radius
      const y = centerY + Math.sin(actualRadians) * radius
      
      // 距離に応じたスケール
      const scale = Math.max(0.3, 1 - (radius - this.config.startRadius) / 500)
      
      positions.push({
        id: element.id,
        x: x,
        y: y,
        scale: scale,
        rotation: angle,
        z: 50 - Math.floor(index / 10)
      })
      
      // 角度をキャッシュ
      this.radialState.elementAngles.set(element.id, angle)
    })
    
    return positions
  }
  
  /**
   * パルスアニメーション開始
   */
  startPulseAnimation() {
    if (this.radialState.animationId) {
      cancelAnimationFrame(this.radialState.animationId)
    }
    
    const animate = () => {
      this.radialState.pulsePhase += this.config.pulseSpeed * 0.01
      
      // パルスエフェクトを適用
      this.applyPulseEffect()
      
      this.radialState.animationId = requestAnimationFrame(animate)
    }
    
    animate()
  }
  
  /**
   * パルスエフェクトの適用
   */
  applyPulseEffect() {
    this.radialState.rings.forEach((ring, ringIndex) => {
      ring.elements.forEach((element, elementIndex) => {
        const domElement = document.getElementById(element.id)
        if (domElement) {
          // リングごとに異なるフェーズでパルス
          const phase = this.radialState.pulsePhase + ringIndex * 0.5 + elementIndex * 0.1
          const pulseScale = 1 + Math.sin(phase) * 0.1
          
          const baseScale = Math.max(0.5, 1 - ring.index * 0.1)
          const finalScale = baseScale * pulseScale
          
          // 現在の位置を取得
          const currentPos = this.getElementPosition(domElement)
          
          this.setElementPosition(domElement, {
            ...currentPos,
            scale: finalScale
          })
        }
      })
    })
  }
  
  /**
   * パルスアニメーション停止
   */
  stopPulseAnimation() {
    if (this.radialState.animationId) {
      cancelAnimationFrame(this.radialState.animationId)
      this.radialState.animationId = null
    }
  }
  
  /**
   * 動的角度調整
   */
  adjustAngles(targetAngle) {
    const angleDiff = targetAngle - this.radialState.currentAngle
    
    this.radialState.elementAngles.forEach((angle, elementId) => {
      const newAngle = angle + angleDiff
      this.radialState.elementAngles.set(elementId, newAngle)
      
      // DOM要素の更新
      const domElement = document.getElementById(elementId)
      if (domElement) {
        const currentPos = this.getElementPosition(domElement)
        const radians = (newAngle * Math.PI) / 180
        
        // 新しい位置を計算
        const ring = this.findElementRing(elementId)
        if (ring) {
          const x = this.config.centerX + Math.cos(radians) * ring.radius
          const y = this.config.centerY + Math.sin(radians) * ring.radius
          
          this.setElementPosition(domElement, {
            ...currentPos,
            x: x,
            y: y,
            rotation: newAngle
          })
        }
      }
    })
    
    this.radialState.currentAngle = targetAngle
  }
  
  /**
   * 要素のリングを見つける
   */
  findElementRing(elementId) {
    return this.radialState.rings.find(ring => 
      ring.elements.some(element => element.id === elementId)
    )
  }
  
  /**
   * レイアウト線の描画
   */
  drawRadialLines(container) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    `
    
    // 同心円の描画
    this.radialState.rings.forEach(ring => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      circle.setAttribute('cx', this.config.centerX)
      circle.setAttribute('cy', this.config.centerY)
      circle.setAttribute('r', ring.radius)
      circle.setAttribute('fill', 'none')
      circle.setAttribute('stroke', 'rgba(79, 193, 255, 0.1)')
      circle.setAttribute('stroke-width', '1')
      circle.setAttribute('stroke-dasharray', '3,3')
      
      svg.appendChild(circle)
    })
    
    // 放射線の描画
    if (this.radialState.rings.length > 0) {
      const maxRadius = Math.max(...this.radialState.rings.map(r => r.radius))
      const angleStep = 360 / this.config.maxElementsPerRing
      
      for (let i = 0; i < this.config.maxElementsPerRing; i++) {
        const angle = i * angleStep
        const radians = (angle * Math.PI) / 180
        
        const x1 = this.config.centerX
        const y1 = this.config.centerY
        const x2 = this.config.centerX + Math.cos(radians) * maxRadius
        const y2 = this.config.centerY + Math.sin(radians) * maxRadius
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
        line.setAttribute('x1', x1)
        line.setAttribute('y1', y1)
        line.setAttribute('x2', x2)
        line.setAttribute('y2', y2)
        line.setAttribute('stroke', 'rgba(79, 193, 255, 0.05)')
        line.setAttribute('stroke-width', '1')
        
        svg.appendChild(line)
      }
    }
    
    container.appendChild(svg)
  }
  
  /**
   * 中心点の描画
   */
  drawCenterPoint(container) {
    const centerPoint = document.createElement('div')
    centerPoint.style.cssText = `
      position: absolute;
      left: ${this.config.centerX - 5}px;
      top: ${this.config.centerY - 5}px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: rgba(79, 193, 255, 0.5);
      z-index: 2;
      pointer-events: none;
    `
    
    container.appendChild(centerPoint)
  }
  
  /**
   * レイアウト適用（オーバーライド）
   */
  async applyLayout(elements, container) {
    // 放射線を描画
    this.drawRadialLines(container)
    
    // 中心点を描画
    this.drawCenterPoint(container)
    
    // 基本レイアウト適用
    await super.applyLayout(elements, container)
  }
  
  /**
   * 設定更新（オーバーライド）
   */
  updateConfig(newConfig) {
    super.updateConfig(newConfig)
    
    // パルスアニメーション再開
    if (this.config.enablePulse && this.radialState.rings.length > 0) {
      this.startPulseAnimation()
    } else {
      this.stopPulseAnimation()
    }
  }
  
  /**
   * レイアウトリセット（オーバーライド）
   */
  resetLayout() {
    super.resetLayout()
    
    this.stopPulseAnimation()
    this.radialState.rings = []
    this.radialState.totalElements = 0
    this.radialState.currentAngle = 0
    this.radialState.pulsePhase = 0
    this.radialState.elementAngles.clear()
  }
  
  /**
   * 要素の追加（オーバーライド）
   */
  addElement(element) {
    super.addElement(element)
    
    // 最も空いているリングを見つけて追加
    const targetRing = this.findBestRing()
    if (targetRing) {
      targetRing.elements.push(element)
      
      // 角度ステップを再計算
      targetRing.angleStep = 360 / targetRing.elements.length
      
      // 新しい位置を計算
      const index = targetRing.elements.length - 1
      const angle = this.config.startAngle + index * targetRing.angleStep
      const radians = (angle * Math.PI) / 180
      
      const x = this.config.centerX + Math.cos(radians) * targetRing.radius
      const y = this.config.centerY + Math.sin(radians) * targetRing.radius
      
      this.setElementPosition(element, {
        x: x,
        y: y,
        scale: Math.max(0.5, 1 - targetRing.index * 0.1),
        rotation: angle
      })
      
      this.radialState.elementAngles.set(element.id, angle)
    }
  }
  
  /**
   * 最適なリングを見つける
   */
  findBestRing() {
    if (this.radialState.rings.length === 0) return null
    
    // 最も要素数の少ないリングを選択
    return this.radialState.rings.reduce((best, ring) => {
      return ring.elements.length < best.elements.length ? ring : best
    })
  }
  
  /**
   * 特定の角度に要素を配置
   */
  placeElementAtAngle(element, angle, radius) {
    const radians = (angle * Math.PI) / 180
    const actualRadians = this.config.clockwise ? radians : -radians
    
    const x = this.config.centerX + Math.cos(actualRadians) * radius
    const y = this.config.centerY + Math.sin(actualRadians) * radius
    
    this.setElementPosition(element, {
      x: x,
      y: y,
      scale: Math.max(0.5, 1 - (radius - this.config.startRadius) / 500),
      rotation: angle
    })
    
    this.radialState.elementAngles.set(element.id, angle)
  }
  
  /**
   * Radial固有の統計情報
   */
  getStats() {
    const baseStats = super.getStats()
    
    return {
      ...baseStats,
      radialStats: {
        rings: this.radialState.rings.length,
        totalElements: this.radialState.totalElements,
        currentAngle: this.radialState.currentAngle,
        enableSpiral: this.config.enableSpiral,
        enablePulse: this.config.enablePulse,
        isPulsing: !!this.radialState.animationId
      }
    }
  }
}

console.log('🌟 RadialLayout plugin loaded!')