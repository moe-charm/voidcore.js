# 🌌 Layout System

> **Galaxy・Grid・Radial配置システム** - 美しく効率的なプラグイン配置アルゴリズム

## 📋 概要

VoidFlowのLayout Systemは、プラグインを美しく効率的に配置するための3つのアルゴリズム（Galaxy、Grid、Radial）を提供します。各レイアウトは異なる用途と美学を持ち、ユーザーのニーズに合わせて選択できます。

## 🎨 レイアウト種類

### 1. 🌌 Galaxy Layout - 銀河系配置
中心点から放射状に広がる自然で有機的な配置パターン

### 2. 📊 Grid Layout - 格子状配置
整然とした格子状の配置で、大量のプラグインを効率的に表示

### 3. ⭕ Radial Layout - 円形配置
円形に均等配置された美しい配置パターン

## 🏗️ アーキテクチャ

### 基底クラス
```javascript
class LayoutPluginBase {
  constructor(options = {}) {
    this.options = {
      centerX: 400,
      centerY: 300,
      spacing: 100,
      animationDuration: 1000,
      animationEasing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      ...options
    }
    
    this.plugins = []
    this.positions = []
    this.animationId = null
  }
  
  // 抽象メソッド - 各レイアウトで実装
  generateLayout(plugins) {
    throw new Error('generateLayout must be implemented by subclass')
  }
  
  // 共通アニメーション処理
  async animateToPositions(positions) {
    return new Promise((resolve) => {
      this.animatePositions(positions, resolve)
    })
  }
  
  // 位置更新
  updatePositions(plugins) {
    this.plugins = plugins
    this.positions = this.generateLayout(plugins)
    return this.positions
  }
}
```

## 🌌 Galaxy Layout

### 概要
Galaxy Layoutは、中心点から放射状に広がる自然で有機的な配置を実現します。プラグインは螺旋状に配置され、まるで銀河系のような美しい配置になります。

### 実装
```javascript
class GalaxyLayoutPlugin extends LayoutPluginBase {
  constructor(options = {}) {
    super({
      spiralTightness: 0.5,
      radiusIncrement: 20,
      angleIncrement: 0.5,
      centerRadius: 50,
      maxRadius: 300,
      ...options
    })
  }
  
  generateLayout(plugins) {
    const positions = []
    const centerX = this.options.centerX
    const centerY = this.options.centerY
    
    plugins.forEach((plugin, index) => {
      // 螺旋の計算
      const angle = index * this.options.angleIncrement
      const radius = this.options.centerRadius + 
                    (index * this.options.radiusIncrement * this.options.spiralTightness)
      
      // 最大半径の制限
      const clampedRadius = Math.min(radius, this.options.maxRadius)
      
      // 位置計算
      const x = centerX + Math.cos(angle) * clampedRadius
      const y = centerY + Math.sin(angle) * clampedRadius
      
      positions.push({
        pluginId: plugin.id,
        x: x,
        y: y,
        angle: angle,
        radius: clampedRadius,
        index: index
      })
    })
    
    return positions
  }
  
  // 密度適応アルゴリズム
  adaptDensity(plugins) {
    const pluginCount = plugins.length
    
    // プラグイン数に応じて螺旋の密度を調整
    if (pluginCount < 10) {
      this.options.spiralTightness = 0.8
      this.options.radiusIncrement = 30
    } else if (pluginCount < 50) {
      this.options.spiralTightness = 0.6
      this.options.radiusIncrement = 25
    } else {
      this.options.spiralTightness = 0.4
      this.options.radiusIncrement = 20
    }
    
    return this.generateLayout(plugins)
  }
  
  // 重複回避アルゴリズム
  avoidOverlap(positions, minDistance = 80) {
    const adjustedPositions = [...positions]
    
    for (let i = 0; i < adjustedPositions.length; i++) {
      for (let j = i + 1; j < adjustedPositions.length; j++) {
        const pos1 = adjustedPositions[i]
        const pos2 = adjustedPositions[j]
        
        const distance = Math.sqrt(
          Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2)
        )
        
        if (distance < minDistance) {
          // 重複している場合、片方を少し移動
          const angle = Math.atan2(pos2.y - pos1.y, pos2.x - pos1.x)
          const offset = (minDistance - distance) / 2
          
          pos1.x -= Math.cos(angle) * offset
          pos1.y -= Math.sin(angle) * offset
          pos2.x += Math.cos(angle) * offset
          pos2.y += Math.sin(angle) * offset
        }
      }
    }
    
    return adjustedPositions
  }
}
```

### 使用例
```javascript
const galaxyLayout = new GalaxyLayoutPlugin({
  centerX: 500,
  centerY: 400,
  spiralTightness: 0.6,
  radiusIncrement: 25,
  maxRadius: 350
})

const positions = galaxyLayout.generateLayout(plugins)
await galaxyLayout.animateToPositions(positions)
```

## 📊 Grid Layout

### 概要
Grid Layoutは、プラグインを整然とした格子状に配置します。大量のプラグインを効率的に表示し、見つけやすくします。

### 実装
```javascript
class GridLayoutPlugin extends LayoutPluginBase {
  constructor(options = {}) {
    super({
      columns: 5,
      rows: 4,
      itemWidth: 150,
      itemHeight: 100,
      marginX: 20,
      marginY: 20,
      startX: 50,
      startY: 50,
      ...options
    })
  }
  
  generateLayout(plugins) {
    const positions = []
    const { columns, itemWidth, itemHeight, marginX, marginY, startX, startY } = this.options
    
    plugins.forEach((plugin, index) => {
      const row = Math.floor(index / columns)
      const col = index % columns
      
      const x = startX + col * (itemWidth + marginX)
      const y = startY + row * (itemHeight + marginY)
      
      positions.push({
        pluginId: plugin.id,
        x: x,
        y: y,
        row: row,
        col: col,
        index: index
      })
    })
    
    return positions
  }
  
  // 動的グリッド調整
  adaptToContainer(containerWidth, containerHeight, plugins) {
    const pluginCount = plugins.length
    
    // 最適な列数を計算
    const optimalColumns = Math.ceil(Math.sqrt(pluginCount))
    const availableWidth = containerWidth - (this.options.startX * 2)
    const maxColumns = Math.floor(availableWidth / (this.options.itemWidth + this.options.marginX))
    
    this.options.columns = Math.min(optimalColumns, maxColumns)
    
    return this.generateLayout(plugins)
  }
  
  // 重要度ベースソート
  sortByImportance(plugins) {
    return plugins.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }
  
  // カテゴリ別グループ化
  groupByCategory(plugins) {
    const grouped = {}
    
    plugins.forEach(plugin => {
      if (!grouped[plugin.category]) {
        grouped[plugin.category] = []
      }
      grouped[plugin.category].push(plugin)
    })
    
    return grouped
  }
}
```

### 使用例
```javascript
const gridLayout = new GridLayoutPlugin({
  columns: 6,
  itemWidth: 140,
  itemHeight: 90,
  marginX: 15,
  marginY: 15
})

// コンテナサイズに適応
const positions = gridLayout.adaptToContainer(1200, 800, plugins)
await gridLayout.animateToPositions(positions)
```

## ⭕ Radial Layout

### 概要
Radial Layoutは、プラグインを円形に均等配置します。美しい対称性を持ち、少数のプラグインに適しています。

### 実装
```javascript
class RadialLayoutPlugin extends LayoutPluginBase {
  constructor(options = {}) {
    super({
      radius: 200,
      startAngle: 0,
      innerRadius: 100,
      outerRadius: 300,
      layerCount: 3,
      ...options
    })
  }
  
  generateLayout(plugins) {
    const positions = []
    const centerX = this.options.centerX
    const centerY = this.options.centerY
    
    if (plugins.length === 0) return positions
    
    // 単一円形配置
    if (plugins.length <= 12) {
      return this.generateSingleCircle(plugins, centerX, centerY)
    }
    
    // 多層円形配置
    return this.generateMultipleCircles(plugins, centerX, centerY)
  }
  
  generateSingleCircle(plugins, centerX, centerY) {
    const positions = []
    const angleStep = (2 * Math.PI) / plugins.length
    
    plugins.forEach((plugin, index) => {
      const angle = this.options.startAngle + (index * angleStep)
      const x = centerX + Math.cos(angle) * this.options.radius
      const y = centerY + Math.sin(angle) * this.options.radius
      
      positions.push({
        pluginId: plugin.id,
        x: x,
        y: y,
        angle: angle,
        radius: this.options.radius,
        layer: 0,
        index: index
      })
    })
    
    return positions
  }
  
  generateMultipleCircles(plugins, centerX, centerY) {
    const positions = []
    const { innerRadius, outerRadius, layerCount } = this.options
    
    // 各層の半径を計算
    const radiusStep = (outerRadius - innerRadius) / (layerCount - 1)
    const pluginsPerLayer = Math.ceil(plugins.length / layerCount)
    
    plugins.forEach((plugin, index) => {
      const layer = Math.floor(index / pluginsPerLayer)
      const indexInLayer = index % pluginsPerLayer
      const pluginsInThisLayer = Math.min(pluginsPerLayer, plugins.length - layer * pluginsPerLayer)
      
      const radius = innerRadius + (layer * radiusStep)
      const angleStep = (2 * Math.PI) / pluginsInThisLayer
      const angle = this.options.startAngle + (indexInLayer * angleStep)
      
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius
      
      positions.push({
        pluginId: plugin.id,
        x: x,
        y: y,
        angle: angle,
        radius: radius,
        layer: layer,
        index: index
      })
    })
    
    return positions
  }
  
  // 動的半径調整
  adaptRadius(plugins) {
    const pluginCount = plugins.length
    
    if (pluginCount <= 6) {
      this.options.radius = 150
    } else if (pluginCount <= 12) {
      this.options.radius = 200
    } else {
      this.options.radius = 250
    }
    
    return this.generateLayout(plugins)
  }
  
  // 重要度ベース配置
  arrangeByImportance(plugins) {
    const sortedPlugins = plugins.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
    
    return this.generateLayout(sortedPlugins)
  }
}
```

### 使用例
```javascript
const radialLayout = new RadialLayoutPlugin({
  radius: 180,
  innerRadius: 120,
  outerRadius: 280,
  layerCount: 2
})

const positions = radialLayout.arrangeByImportance(plugins)
await radialLayout.animateToPositions(positions)
```

## 🎛️ Layout Manager

### 統合管理システム
```javascript
class LayoutManager {
  constructor() {
    this.layouts = new Map()
    this.currentLayout = null
    this.plugins = []
    this.container = null
    
    // デフォルトレイアウトを登録
    this.registerLayout('galaxy', GalaxyLayoutPlugin)
    this.registerLayout('grid', GridLayoutPlugin)
    this.registerLayout('radial', RadialLayoutPlugin)
  }
  
  registerLayout(name, LayoutClass) {
    this.layouts.set(name, LayoutClass)
  }
  
  async setLayout(layoutName, options = {}) {
    const LayoutClass = this.layouts.get(layoutName)
    if (!LayoutClass) {
      throw new Error(`Layout '${layoutName}' not found`)
    }
    
    this.currentLayout = new LayoutClass(options)
    return this.applyLayout()
  }
  
  async applyLayout() {
    if (!this.currentLayout || !this.plugins.length) return
    
    const positions = this.currentLayout.generateLayout(this.plugins)
    await this.currentLayout.animateToPositions(positions)
    
    return positions
  }
  
  async switchLayout(layoutName, options = {}) {
    console.log(`🔄 Switching to ${layoutName} layout`)
    
    // 現在のレイアウトをフェードアウト
    if (this.currentLayout) {
      await this.fadeOutCurrentLayout()
    }
    
    // 新しいレイアウトを適用
    await this.setLayout(layoutName, options)
    
    // 新しいレイアウトをフェードイン
    await this.fadeInNewLayout()
    
    console.log(`✅ Layout switched to ${layoutName}`)
  }
  
  async fadeOutCurrentLayout() {
    const elements = this.container.querySelectorAll('.plugin-item')
    const fadePromises = Array.from(elements).map(element => {
      return new Promise(resolve => {
        element.style.transition = 'opacity 0.3s ease'
        element.style.opacity = '0'
        setTimeout(resolve, 300)
      })
    })
    
    await Promise.all(fadePromises)
  }
  
  async fadeInNewLayout() {
    const elements = this.container.querySelectorAll('.plugin-item')
    const fadePromises = Array.from(elements).map((element, index) => {
      return new Promise(resolve => {
        setTimeout(() => {
          element.style.opacity = '1'
          resolve()
        }, index * 50) // 順次フェードイン
      })
    })
    
    await Promise.all(fadePromises)
  }
}
```

## 🎨 アニメーション

### 滑らかな位置移動
```javascript
class LayoutAnimator {
  constructor(options = {}) {
    this.options = {
      duration: 800,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      stagger: 50,
      ...options
    }
  }
  
  async animateToPositions(elements, positions) {
    const animationPromises = elements.map((element, index) => {
      return new Promise(resolve => {
        const position = positions[index]
        if (!position) return resolve()
        
        // アニメーション開始遅延
        setTimeout(() => {
          element.style.transition = `transform ${this.options.duration}ms ${this.options.easing}`
          element.style.transform = `translate(${position.x}px, ${position.y}px)`
          
          setTimeout(resolve, this.options.duration)
        }, index * this.options.stagger)
      })
    })
    
    await Promise.all(animationPromises)
  }
  
  // 弾性アニメーション
  animateWithBounce(element, targetPosition) {
    const bounce = 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    
    element.style.transition = `transform 600ms ${bounce}`
    element.style.transform = `translate(${targetPosition.x}px, ${targetPosition.y}px)`
  }
  
  // 波紋アニメーション
  animateWithRipple(elements, positions, centerX, centerY) {
    elements.forEach((element, index) => {
      const position = positions[index]
      const distance = Math.sqrt(
        Math.pow(position.x - centerX, 2) + Math.pow(position.y - centerY, 2)
      )
      
      const delay = distance * 2 // 距離に応じた遅延
      
      setTimeout(() => {
        element.style.transition = 'transform 400ms ease-out'
        element.style.transform = `translate(${position.x}px, ${position.y}px)`
      }, delay)
    })
  }
}
```

## 🔧 カスタマイズ

### カスタムレイアウト作成
```javascript
class CustomSpiralLayout extends LayoutPluginBase {
  constructor(options = {}) {
    super({
      spiralTightness: 0.3,
      rotation: 0,
      ...options
    })
  }
  
  generateLayout(plugins) {
    const positions = []
    const centerX = this.options.centerX
    const centerY = this.options.centerY
    
    plugins.forEach((plugin, index) => {
      const angle = (index * this.options.spiralTightness) + this.options.rotation
      const radius = Math.sqrt(index) * 20
      
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius
      
      positions.push({
        pluginId: plugin.id,
        x: x,
        y: y,
        angle: angle,
        radius: radius,
        index: index
      })
    })
    
    return positions
  }
}

// レイアウトマネージャーに登録
layoutManager.registerLayout('spiral', CustomSpiralLayout)
```

### 動的パラメータ調整
```javascript
class AdaptiveLayoutManager {
  constructor() {
    this.layoutManager = new LayoutManager()
    this.screenSize = { width: 1200, height: 800 }
    this.pluginCount = 0
  }
  
  selectOptimalLayout(plugins) {
    this.pluginCount = plugins.length
    
    if (this.pluginCount <= 8) {
      return this.layoutManager.setLayout('radial', {
        radius: 150,
        centerX: this.screenSize.width / 2,
        centerY: this.screenSize.height / 2
      })
    } else if (this.pluginCount <= 30) {
      return this.layoutManager.setLayout('galaxy', {
        spiralTightness: 0.5,
        maxRadius: Math.min(this.screenSize.width, this.screenSize.height) / 3
      })
    } else {
      const columns = Math.ceil(Math.sqrt(this.pluginCount))
      return this.layoutManager.setLayout('grid', {
        columns: columns,
        itemWidth: this.screenSize.width / (columns + 1),
        itemHeight: 100
      })
    }
  }
}
```

## 📊 パフォーマンス最適化

### 効率的な位置計算
```javascript
class OptimizedLayoutCalculator {
  constructor() {
    this.positionCache = new Map()
    this.worker = null
  }
  
  // Web Workerを使用した並列計算
  async calculatePositionsInWorker(plugins, layoutType, options) {
    if (!this.worker) {
      this.worker = new Worker('/js/layout-worker.js')
    }
    
    return new Promise((resolve, reject) => {
      const messageId = Date.now()
      
      this.worker.postMessage({
        id: messageId,
        plugins: plugins,
        layoutType: layoutType,
        options: options
      })
      
      this.worker.onmessage = (event) => {
        if (event.data.id === messageId) {
          resolve(event.data.positions)
        }
      }
      
      this.worker.onerror = reject
    })
  }
  
  // 位置キャッシュシステム
  getCachedPositions(plugins, layoutType, options) {
    const cacheKey = this.generateCacheKey(plugins, layoutType, options)
    return this.positionCache.get(cacheKey)
  }
  
  setCachedPositions(plugins, layoutType, options, positions) {
    const cacheKey = this.generateCacheKey(plugins, layoutType, options)
    this.positionCache.set(cacheKey, positions)
  }
  
  generateCacheKey(plugins, layoutType, options) {
    const pluginIds = plugins.map(p => p.id).join(',')
    const optionsStr = JSON.stringify(options)
    return `${layoutType}-${pluginIds}-${optionsStr}`
  }
}
```

## 🧪 テスト

### レイアウトアルゴリズムテスト
```javascript
describe('Layout System', () => {
  describe('GalaxyLayoutPlugin', () => {
    it('should generate spiral positions', () => {
      const layout = new GalaxyLayoutPlugin({
        centerX: 0,
        centerY: 0,
        spiralTightness: 0.5
      })
      
      const plugins = [
        { id: '1', name: 'Test1' },
        { id: '2', name: 'Test2' }
      ]
      
      const positions = layout.generateLayout(plugins)
      
      expect(positions).toHaveLength(2)
      expect(positions[0].x).toBe(50) // centerRadius
      expect(positions[0].y).toBe(0)
    })
  })
  
  describe('GridLayoutPlugin', () => {
    it('should arrange plugins in grid', () => {
      const layout = new GridLayoutPlugin({
        columns: 2,
        itemWidth: 100,
        itemHeight: 100,
        marginX: 10,
        marginY: 10,
        startX: 0,
        startY: 0
      })
      
      const plugins = [
        { id: '1' }, { id: '2' },
        { id: '3' }, { id: '4' }
      ]
      
      const positions = layout.generateLayout(plugins)
      
      expect(positions[0]).toEqual({ pluginId: '1', x: 0, y: 0, row: 0, col: 0, index: 0 })
      expect(positions[1]).toEqual({ pluginId: '2', x: 110, y: 0, row: 0, col: 1, index: 1 })
      expect(positions[2]).toEqual({ pluginId: '3', x: 0, y: 110, row: 1, col: 0, index: 2 })
    })
  })
})
```

---

## 📝 関連ドキュメント

- [Plugin Palette](./plugin-palette.md) - プラグインパレットシステム
- [Plugin Management](./plugin-management.md) - プラグイン管理機能
- [Architecture Overview](../architecture/overview.md) - システムアーキテクチャ
- [Performance](../architecture/performance.md) - パフォーマンス最適化

---

**Last Updated**: 2025-07-09  
**Author**: VoidFlow Development Team  
**Version**: v1.0.0