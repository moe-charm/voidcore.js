// galaxy-layout.js - Galaxy レイアウトプラグイン
// 星系のような美しい円形配置

import { LayoutPluginBase } from './layout-plugin-base.js'

/**
 * 🌌 GalaxyLayout - 星系レイアウトプラグイン
 * 
 * 中心に重要なプラグインを配置し、周囲に軌道状に配置
 * - 中心から放射状に配置
 * - 優先度による軌道レベル
 * - 自然な回転アニメーション
 * - 星雲エフェクト
 */
export class GalaxyLayout extends LayoutPluginBase {
  constructor(options = {}) {
    super('Galaxy', {
      centerRadius: 80,        // 中心領域の半径
      orbitSpacing: 120,       // 軌道間の間隔
      maxOrbits: 6,            // 最大軌道数
      rotationSpeed: 0.5,      // 回転速度
      enableRotation: true,    // 回転アニメーション
      enableNebula: true,      // 星雲エフェクト
      nebulaOpacity: 0.1,      // 星雲の透明度
      planetSize: 1.0,         // 惑星（プラグイン）サイズ
      centerPlanetSize: 1.5,   // 中心惑星のサイズ
      orbitEccentricity: 0.2,  // 軌道の楕円率
      ...options
    })
    
    // Galaxy固有の状態
    this.galaxyState = {
      orbits: [],              // 軌道情報
      centerPlugins: [],       // 中心プラグイン
      rotationAngle: 0,        // 現在の回転角度
      animationId: null,       // アニメーションID
      nebulaParticles: []      // 星雲パーティクル
    }
    
    this.log('🌌 Galaxy layout plugin initialized')
  }
  
  /**
   * Galaxy レイアウトの計算
   */
  async calculateLayout(elements, container) {
    this.log(`🌌 Calculating galaxy layout for ${elements.length} elements`)
    
    // 要素を優先度別に分類
    const { centerPlugins, orbitPlugins } = this.categorizeElements(elements)
    
    // 軌道の計算
    const orbits = this.calculateOrbits(orbitPlugins)
    
    // 位置の計算
    const positions = []
    
    // 中心プラグインの配置
    positions.push(...this.calculateCenterPositions(centerPlugins))
    
    // 軌道プラグインの配置
    positions.push(...this.calculateOrbitPositions(orbits))
    
    // 軌道情報を保存
    this.galaxyState.orbits = orbits
    this.galaxyState.centerPlugins = centerPlugins
    
    // 回転アニメーション開始
    if (this.config.enableRotation) {
      this.startRotationAnimation()
    }
    
    return positions
  }
  
  /**
   * 要素の分類
   */
  categorizeElements(elements) {
    const centerPlugins = []
    const orbitPlugins = []
    
    elements.forEach(element => {
      // 属性から優先度を取得
      const priority = this.getElementPriority(element)
      
      if (priority === 'high' || this.shouldBeInCenter(element)) {
        centerPlugins.push(element)
      } else {
        orbitPlugins.push(element)
      }
    })
    
    return { centerPlugins, orbitPlugins }
  }
  
  /**
   * 要素の優先度を取得
   */
  getElementPriority(element) {
    // プラグイン属性から取得
    if (element.pluginAttributes && element.pluginAttributes.priority) {
      return element.pluginAttributes.priority
    }
    
    // データ属性から取得
    if (element.dataset && element.dataset.priority) {
      return element.dataset.priority
    }
    
    // デフォルト
    return 'medium'
  }
  
  /**
   * 中心に配置すべきかチェック
   */
  shouldBeInCenter(element) {
    // 特定のタイプや属性をチェック
    const centerTypes = ['core', 'main', 'central', 'hub']
    const elementType = element.dataset?.type || ''
    
    return centerTypes.includes(elementType.toLowerCase())
  }
  
  /**
   * 軌道の計算
   */
  calculateOrbits(orbitPlugins) {
    const orbits = []
    const elementsPerOrbit = Math.ceil(orbitPlugins.length / this.config.maxOrbits)
    
    for (let i = 0; i < this.config.maxOrbits && i * elementsPerOrbit < orbitPlugins.length; i++) {
      const orbitRadius = this.config.centerRadius + (i + 1) * this.config.orbitSpacing
      const orbitElements = orbitPlugins.slice(i * elementsPerOrbit, (i + 1) * elementsPerOrbit)
      
      orbits.push({
        index: i,
        radius: orbitRadius,
        elements: orbitElements,
        elementCount: orbitElements.length,
        angleStep: orbitElements.length > 0 ? (2 * Math.PI) / orbitElements.length : 0,
        phase: i * 0.3 // 軌道間のフェーズ差
      })
    }
    
    return orbits
  }
  
  /**
   * 中心プラグインの位置計算
   */
  calculateCenterPositions(centerPlugins) {
    const positions = []
    const centerX = this.config.centerX
    const centerY = this.config.centerY
    
    if (centerPlugins.length === 0) {
      return positions
    }
    
    if (centerPlugins.length === 1) {
      // 単一の中心プラグイン
      positions.push({
        id: centerPlugins[0].id,
        x: centerX,
        y: centerY,
        scale: this.config.centerPlanetSize,
        rotation: 0,
        z: 100
      })
    } else {
      // 複数の中心プラグイン - 小さな円形配置
      const angleStep = (2 * Math.PI) / centerPlugins.length
      const centerRadius = this.config.centerRadius * 0.6
      
      centerPlugins.forEach((element, index) => {
        const angle = index * angleStep
        const x = centerX + Math.cos(angle) * centerRadius
        const y = centerY + Math.sin(angle) * centerRadius
        
        positions.push({
          id: element.id,
          x: x,
          y: y,
          scale: this.config.centerPlanetSize * 0.8,
          rotation: 0,
          z: 90 + index
        })
      })
    }
    
    return positions
  }
  
  /**
   * 軌道プラグインの位置計算
   */
  calculateOrbitPositions(orbits) {
    const positions = []
    const centerX = this.config.centerX
    const centerY = this.config.centerY
    
    orbits.forEach(orbit => {
      orbit.elements.forEach((element, index) => {
        const angle = index * orbit.angleStep + orbit.phase + this.galaxyState.rotationAngle
        
        // 楕円軌道の計算
        const eccentricity = this.config.orbitEccentricity
        const radiusX = orbit.radius * (1 - eccentricity)
        const radiusY = orbit.radius * (1 + eccentricity)
        
        const x = centerX + Math.cos(angle) * radiusX
        const y = centerY + Math.sin(angle) * radiusY
        
        // 軌道による深度とサイズ調整
        const distanceFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
        const sizeScale = this.config.planetSize * (1 - orbit.index * 0.1)
        const zDepth = 50 - orbit.index * 5
        
        positions.push({
          id: element.id,
          x: x,
          y: y,
          scale: sizeScale,
          rotation: angle * 180 / Math.PI, // 角度を度に変換
          z: zDepth
        })
      })
    })
    
    return positions
  }
  
  /**
   * 回転アニメーション開始
   */
  startRotationAnimation() {
    if (this.galaxyState.animationId) {
      cancelAnimationFrame(this.galaxyState.animationId)
    }
    
    const animate = () => {
      this.galaxyState.rotationAngle += this.config.rotationSpeed * 0.01
      
      // 軌道プラグインの位置を更新
      this.updateOrbitPositions()
      
      this.galaxyState.animationId = requestAnimationFrame(animate)
    }
    
    animate()
  }
  
  /**
   * 軌道位置の更新
   */
  updateOrbitPositions() {
    const centerX = this.config.centerX
    const centerY = this.config.centerY
    
    this.galaxyState.orbits.forEach(orbit => {
      orbit.elements.forEach((element, index) => {
        const angle = index * orbit.angleStep + orbit.phase + this.galaxyState.rotationAngle
        
        const eccentricity = this.config.orbitEccentricity
        const radiusX = orbit.radius * (1 - eccentricity)
        const radiusY = orbit.radius * (1 + eccentricity)
        
        const x = centerX + Math.cos(angle) * radiusX
        const y = centerY + Math.sin(angle) * radiusY
        
        const domElement = document.getElementById(element.id)
        if (domElement) {
          const sizeScale = this.config.planetSize * (1 - orbit.index * 0.1)
          const rotation = angle * 180 / Math.PI
          
          this.setElementPosition(domElement, {
            x: x,
            y: y,
            scale: sizeScale,
            rotation: rotation
          })
        }
      })
    })
  }
  
  /**
   * 回転アニメーション停止
   */
  stopRotationAnimation() {
    if (this.galaxyState.animationId) {
      cancelAnimationFrame(this.galaxyState.animationId)
      this.galaxyState.animationId = null
    }
  }
  
  /**
   * 星雲エフェクトの作成
   */
  createNebulaEffect(container) {
    if (!this.config.enableNebula) return
    
    const nebula = document.createElement('div')
    nebula.className = 'galaxy-nebula'
    nebula.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(
        circle at ${this.config.centerX}px ${this.config.centerY}px,
        rgba(79, 193, 255, ${this.config.nebulaOpacity}) 0%,
        rgba(74, 144, 226, ${this.config.nebulaOpacity * 0.5}) 30%,
        rgba(147, 112, 219, ${this.config.nebulaOpacity * 0.3}) 60%,
        transparent 100%
      );
      pointer-events: none;
      z-index: 1;
    `
    
    container.appendChild(nebula)
  }
  
  /**
   * 軌道線の描画
   */
  drawOrbitLines(container) {
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
    
    this.galaxyState.orbits.forEach(orbit => {
      const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse')
      ellipse.setAttribute('cx', this.config.centerX)
      ellipse.setAttribute('cy', this.config.centerY)
      ellipse.setAttribute('rx', orbit.radius * (1 - this.config.orbitEccentricity))
      ellipse.setAttribute('ry', orbit.radius * (1 + this.config.orbitEccentricity))
      ellipse.setAttribute('fill', 'none')
      ellipse.setAttribute('stroke', 'rgba(79, 193, 255, 0.2)')
      ellipse.setAttribute('stroke-width', '1')
      ellipse.setAttribute('stroke-dasharray', '5,5')
      
      svg.appendChild(ellipse)
    })
    
    container.appendChild(svg)
  }
  
  /**
   * レイアウトの適用（オーバーライド）
   */
  async applyLayout(elements, container) {
    // 星雲エフェクトを作成
    this.createNebulaEffect(container)
    
    // 軌道線を描画
    this.drawOrbitLines(container)
    
    // 基本レイアウト適用
    await super.applyLayout(elements, container)
  }
  
  /**
   * 設定更新（オーバーライド）
   */
  updateConfig(newConfig) {
    super.updateConfig(newConfig)
    
    // 回転アニメーション再開
    if (this.config.enableRotation && this.galaxyState.orbits.length > 0) {
      this.startRotationAnimation()
    } else {
      this.stopRotationAnimation()
    }
  }
  
  /**
   * レイアウトリセット（オーバーライド）
   */
  resetLayout() {
    super.resetLayout()
    
    this.stopRotationAnimation()
    this.galaxyState.orbits = []
    this.galaxyState.centerPlugins = []
    this.galaxyState.rotationAngle = 0
  }
  
  /**
   * 要素の追加（オーバーライド）
   */
  addElement(element) {
    super.addElement(element)
    
    // 新しい要素を適切な軌道に配置
    const priority = this.getElementPriority(element)
    
    if (priority === 'high' || this.shouldBeInCenter(element)) {
      this.galaxyState.centerPlugins.push(element)
    } else {
      // 最も空いている軌道を見つけて追加
      const targetOrbit = this.findBestOrbit()
      if (targetOrbit) {
        targetOrbit.elements.push(element)
        targetOrbit.elementCount++
        targetOrbit.angleStep = (2 * Math.PI) / targetOrbit.elementCount
      }
    }
  }
  
  /**
   * 最適な軌道を見つける
   */
  findBestOrbit() {
    if (this.galaxyState.orbits.length === 0) return null
    
    // 最も要素数の少ない軌道を選択
    return this.galaxyState.orbits.reduce((best, orbit) => {
      return orbit.elementCount < best.elementCount ? orbit : best
    })
  }
  
  /**
   * Galaxy固有の統計情報
   */
  getStats() {
    const baseStats = super.getStats()
    
    return {
      ...baseStats,
      galaxyStats: {
        orbits: this.galaxyState.orbits.length,
        centerPlugins: this.galaxyState.centerPlugins.length,
        rotationAngle: this.galaxyState.rotationAngle,
        isRotating: !!this.galaxyState.animationId
      }
    }
  }
}

console.log('🌌 GalaxyLayout plugin loaded!')