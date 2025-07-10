/**
 * 🌀 ConnectionLineRenderer - 高度な接続線レンダリング
 * 
 * Phase 1: VoidFlow高度接続GUI復活
 * 
 * 機能:
 * - 扇形分散線表示（ファンアウト）
 * - ベジェ曲線による美しい接続線
 * - アニメーション対応
 * - 交差最小化
 * 
 * Created: 2025-07-09
 */

export class ConnectionLineRenderer {
  constructor(svgElement) {
    this.svgElement = svgElement
    this.connectionPaths = new Map() // connectionId -> pathElement
    this.animationDuration = 300
    
    // 扇形分散設定
    this.fanOutConfig = {
      angleSpread: Math.PI / 4,  // 45度の扇形
      minAngle: Math.PI / 12,     // 最小角度15度
      curvature: 0.4,             // 曲線の曲率
      bundleThreshold: 2          // 束ね線になる本数（2本から扇形）
    }
    
    // Phase 2: 線束ね設定
    this.bundleConfig = {
      bundleThreshold: 3,         // 3本以上で束ね表示（テスト用）
      bundleRadius: 8,            // 束ね線の太さ
      bundleColor: '#ff6b35',     // 束ね線の色
      separationDistance: 30,     // 束ね→分離距離
      bundleOpacity: 0.7,         // 束ね線の透明度
      labelOffset: 15             // ラベル表示オフセット
    }
    
    // 表示モード管理
    this.displayMode = 'auto'     // 'auto', 'fanout', 'bundle', 'individual'
    this.bundledConnections = new Map() // bundleId → [connectionIds]
    
    this.log('🌀 ConnectionLineRenderer initialized')
  }
  
  log(message) {
    console.log(`[ConnectionLineRenderer] ${message}`)
  }
  
  /**
   * 🎨 接続線を描画
   */
  renderConnection(connectionId, sourcePos, targetPos, options = {}) {
    const {
      color = '#4a90e2',
      width = 2,
      animated = false,
      arrow = true,
      curveType = 'bezier'
    } = options
    
    // パスを計算
    const pathData = this.calculatePath(sourcePos, targetPos, curveType)
    
    // SVGパス要素を作成
    const path = this.createPathElement(connectionId, pathData, {
      color,
      width,
      arrow,
      animated
    })
    
    // 既存のパスがあれば更新、なければ追加
    const existingPath = this.connectionPaths.get(connectionId)
    if (existingPath) {
      this.updatePath(existingPath, pathData)
    } else {
      this.svgElement.appendChild(path)
      this.connectionPaths.set(connectionId, path)
    }
    
    return path
  }
  
  /**
   * 🌀 複数接続を扇形に分散して描画
   */
  renderFanOutConnections(sourceId, sourcePos, targetConnections) {
    const connectionCount = targetConnections.length
    
    if (connectionCount === 0) return []
    
    // 単一接続の場合は通常描画
    if (connectionCount === 1) {
      const conn = targetConnections[0]
      return [this.renderConnection(conn.id, sourcePos, conn.targetPos, conn.options)]
    }
    
    // 扇形分散計算
    const fanPaths = this.calculateFanOutPaths(sourcePos, targetConnections)
    
    // 各パスを描画
    return fanPaths.map((pathInfo, index) => {
      const conn = targetConnections[index]
      const options = {
        ...conn.options,
        curveType: 'custom'
      }
      
      // カスタムパスで描画
      const path = this.createPathElement(conn.id, pathInfo.path, {
        color: options.color || this.getConnectionColor(index),
        width: options.width || 2,
        arrow: options.arrow !== false,
        animated: options.animated
      })
      
      this.svgElement.appendChild(path)
      this.connectionPaths.set(conn.id, path)
      
      return path
    })
  }
  
  /**
   * 🌀 扇形分散パスを計算
   */
  calculateFanOutPaths(sourcePos, targetConnections) {
    const count = targetConnections.length
    const { angleSpread, minAngle, curvature } = this.fanOutConfig
    
    // 角度配分を計算
    const totalAngle = Math.min(angleSpread, minAngle * (count - 1))
    const angleStep = totalAngle / (count - 1)
    const startAngle = -totalAngle / 2
    
    return targetConnections.map((conn, index) => {
      const targetPos = conn.targetPos
      
      // 基本ベクトルを計算
      const dx = targetPos.x - sourcePos.x
      const dy = targetPos.y - sourcePos.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const baseAngle = Math.atan2(dy, dx)
      
      // 扇形角度を追加
      const fanAngle = startAngle + angleStep * index
      const adjustedAngle = baseAngle + fanAngle * 0.3 // 扇形の開き具合調整
      
      // 制御点を計算（より自然な曲線のため2つ使用）
      const ctrl1Distance = distance * 0.3
      const ctrl2Distance = distance * 0.7
      
      const ctrl1 = {
        x: sourcePos.x + Math.cos(adjustedAngle) * ctrl1Distance,
        y: sourcePos.y + Math.sin(adjustedAngle) * ctrl1Distance
      }
      
      const ctrl2 = {
        x: targetPos.x - Math.cos(baseAngle) * (distance * 0.2),
        y: targetPos.y - Math.sin(baseAngle) * (distance * 0.2)
      }
      
      // 3次ベジェ曲線パス
      const path = `M ${sourcePos.x},${sourcePos.y} C ${ctrl1.x},${ctrl1.y} ${ctrl2.x},${ctrl2.y} ${targetPos.x},${targetPos.y}`
      
      return {
        path,
        controlPoints: [ctrl1, ctrl2],
        angle: fanAngle
      }
    })
  }
  
  /**
   * 🎨 パスを計算
   */
  calculatePath(start, end, curveType = 'bezier') {
    switch (curveType) {
      case 'straight':
        return `M ${start.x},${start.y} L ${end.x},${end.y}`
        
      case 'bezier':
        return this.calculateBezierPath(start, end)
        
      case 'arc':
        return this.calculateArcPath(start, end)
        
      default:
        return this.calculateBezierPath(start, end)
    }
  }
  
  /**
   * 🎨 ベジェ曲線パスを計算
   */
  calculateBezierPath(start, end, curvature = 0.4) {
    const dx = end.x - start.x
    const dy = end.y - start.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    // 制御点を計算
    const ctrlOffset = distance * curvature
    const midX = (start.x + end.x) / 2
    const midY = (start.y + end.y) / 2
    
    // 垂直方向にオフセット（より自然な曲線）
    const angle = Math.atan2(dy, dx) + Math.PI / 2
    const ctrlX = midX + Math.cos(angle) * ctrlOffset
    const ctrlY = midY + Math.sin(angle) * ctrlOffset
    
    return `M ${start.x},${start.y} Q ${ctrlX},${ctrlY} ${end.x},${end.y}`
  }
  
  /**
   * 🎨 円弧パスを計算
   */
  calculateArcPath(start, end) {
    const dx = end.x - start.x
    const dy = end.y - start.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const radius = distance / 2
    
    // sweep-flag は曲線の方向を決定
    const sweepFlag = dx * dy > 0 ? 1 : 0
    
    return `M ${start.x},${start.y} A ${radius},${radius} 0 0,${sweepFlag} ${end.x},${end.y}`
  }
  
  /**
   * 🎨 SVGパス要素を作成
   */
  createPathElement(id, pathData, options) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('id', `connection-path-${id}`)
    path.setAttribute('d', pathData)
    path.setAttribute('fill', 'none')
    path.setAttribute('stroke', options.color)
    path.setAttribute('stroke-width', options.width)
    path.setAttribute('stroke-linecap', 'round')
    path.setAttribute('opacity', '0.8')
    
    // 矢印マーカー
    if (options.arrow) {
      this._ensureArrowMarker(options.color)
      path.setAttribute('marker-end', `url(#arrow-${this._colorToId(options.color)})`)
    }
    
    // アニメーション
    if (options.animated) {
      this.addPathAnimation(path)
    }
    
    // ホバー効果
    path.addEventListener('mouseenter', () => {
      path.setAttribute('stroke-width', String(options.width * 1.5))
      path.setAttribute('opacity', '1')
    })
    
    path.addEventListener('mouseleave', () => {
      path.setAttribute('stroke-width', String(options.width))
      path.setAttribute('opacity', '0.8')
    })
    
    return path
  }
  
  /**
   * 🎨 パスを更新（アニメーション付き）
   */
  updatePath(pathElement, newPathData) {
    // SMIL アニメーションを使用
    const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate')
    animate.setAttribute('attributeName', 'd')
    animate.setAttribute('from', pathElement.getAttribute('d'))
    animate.setAttribute('to', newPathData)
    animate.setAttribute('dur', `${this.animationDuration}ms`)
    animate.setAttribute('fill', 'freeze')
    
    pathElement.appendChild(animate)
    
    // アニメーション終了後にクリーンアップ
    setTimeout(() => {
      pathElement.setAttribute('d', newPathData)
      animate.remove()
    }, this.animationDuration)
  }
  
  /**
   * 🎯 矢印マーカーを確保
   */
  _ensureArrowMarker(color) {
    const markerId = `arrow-${this._colorToId(color)}`
    
    if (this.svgElement.querySelector(`#${markerId}`)) {
      return
    }
    
    let defs = this.svgElement.querySelector('defs')
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
      this.svgElement.appendChild(defs)
    }
    
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker')
    marker.setAttribute('id', markerId)
    marker.setAttribute('markerWidth', '10')
    marker.setAttribute('markerHeight', '10')
    marker.setAttribute('refX', '9')
    marker.setAttribute('refY', '3')
    marker.setAttribute('orient', 'auto')
    marker.setAttribute('markerUnits', 'strokeWidth')
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('d', 'M0,0 L0,6 L9,3 z')
    path.setAttribute('fill', color)
    path.setAttribute('opacity', '0.8')
    
    marker.appendChild(path)
    defs.appendChild(marker)
  }
  
  /**
   * 🎨 パスアニメーションを追加
   */
  addPathAnimation(pathElement) {
    const length = pathElement.getTotalLength()
    
    pathElement.style.strokeDasharray = length
    pathElement.style.strokeDashoffset = length
    pathElement.style.animation = `dash ${this.animationDuration}ms ease-in-out forwards`
    
    // CSSアニメーションが存在しない場合は追加
    if (!document.querySelector('#connection-animations')) {
      const style = document.createElement('style')
      style.id = 'connection-animations'
      style.textContent = `
        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
        }
      `
      document.head.appendChild(style)
    }
  }
  
  /**
   * 🎨 接続線の色を取得（インデックスベース）
   */
  getConnectionColor(index) {
    const colors = [
      '#4a90e2', // 青
      '#00ff88', // 緑
      '#ff6b35', // オレンジ
      '#e91e63', // ピンク
      '#9c27b0', // 紫
      '#00bcd4', // シアン
      '#ffc107'  // 黄
    ]
    return colors[index % colors.length]
  }
  
  /**
   * 🗑️ 接続線を削除
   */
  removeConnection(connectionId) {
    const path = this.connectionPaths.get(connectionId)
    if (path) {
      // 即座に削除（アニメーション無効化で重複回避）
      path.remove()
      this.connectionPaths.delete(connectionId)
      this.log(`🗑️ 接続線削除: ${connectionId}`)
    }
  }
  
  /**
   * 🧹 すべての接続線をクリア
   */
  clearAllConnections() {
    this.connectionPaths.forEach((path, id) => {
      path.remove()
    })
    this.connectionPaths.clear()
  }
  
  /**
   * 🎨 色をIDに変換（マーカー用）
   */
  _colorToId(color) {
    return color.replace('#', '').replace(/[^a-zA-Z0-9]/g, '')
  }
  
  // ===== Phase 2: 線束ね機能 =====
  
  /**
   * 🔗 複数接続の表示モードを自動決定
   */
  determineDisplayMode(connectionCount) {
    if (this.displayMode !== 'auto') return this.displayMode
    
    if (connectionCount < 2) return 'individual'
    if (connectionCount < this.bundleConfig.bundleThreshold) return 'fanout'
    return 'bundle'
  }
  
  /**
   * 🧹 指定ソースの全接続線を削除
   */
  clearSourceConnections(sourceId) {
    const pathsToRemove = []
    
    // 指定ソースの接続線をすべて検索
    this.connectionPaths.forEach((path, connectionId) => {
      if (connectionId.includes(sourceId)) {
        pathsToRemove.push(connectionId)
      }
    })
    
    // 削除実行
    pathsToRemove.forEach(connectionId => {
      this.removeConnection(connectionId)
    })
    
    this.log(`🧹 ${sourceId}の接続線を削除: ${pathsToRemove.length}本`)
  }
  
  /**
   * 🔗 束ね線描画（5本以上の接続を束ねて表示）
   */
  renderBundledConnections(sourceId, sourcePos, targetConnections) {
    const bundleId = `bundle-${sourceId}-${Date.now()}`
    this.bundledConnections.set(bundleId, targetConnections.map(conn => conn.id))
    
    this.log(`🔗 束ね線描画開始: ${targetConnections.length}本`)
    
    // 束ね線のパスを計算
    const bundlePath = this.calculateBundlePath(sourcePos, targetConnections)
    
    // 束ね線の描画
    const bundleElement = this.createBundleElement(bundleId, bundlePath, {
      radius: this.bundleConfig.bundleRadius,
      color: this.bundleConfig.bundleColor,
      opacity: this.bundleConfig.bundleOpacity,
      connectionCount: targetConnections.length
    })
    
    this.svgElement.appendChild(bundleElement)
    
    // 各接続線を束ねから分離して描画
    const separatedPaths = this.calculateSeparatedPaths(bundlePath, targetConnections)
    
    return separatedPaths.map((pathInfo, index) => {
      const conn = targetConnections[index]
      const path = this.createPathElement(conn.id, pathInfo.path, {
        color: pathInfo.color,
        width: 1.5, // 束ね後は細く
        arrow: true,
        animated: false
      })
      
      this.svgElement.appendChild(path)
      this.connectionPaths.set(conn.id, path)
      
      return path
    })
  }
  
  /**
   * 🧮 束ね線のパスを計算
   */
  calculateBundlePath(sourcePos, targetConnections) {
    // すべてのターゲット位置の重心を計算
    const centroid = this.calculateCentroid(targetConnections.map(conn => conn.targetPos))
    
    // 束ね線の中間ポイント（分離開始点）
    const separationPoint = {
      x: sourcePos.x + (centroid.x - sourcePos.x) * 0.6,
      y: sourcePos.y + (centroid.y - sourcePos.y) * 0.6
    }
    
    // 束ね線パス（ソース→分離点）
    return {
      sourcePath: this.calculateBezierPath(sourcePos, separationPoint),
      separationPoint: separationPoint,
      centroid: centroid
    }
  }
  
  /**
   * 📊 重心を計算
   */
  calculateCentroid(positions) {
    const sum = positions.reduce((acc, pos) => ({
      x: acc.x + pos.x,
      y: acc.y + pos.y
    }), { x: 0, y: 0 })
    
    return {
      x: sum.x / positions.length,
      y: sum.y / positions.length
    }
  }
  
  /**
   * 🌸 分離パスを計算（束ね→各ターゲット）
   */
  calculateSeparatedPaths(bundlePath, targetConnections) {
    return targetConnections.map((conn, index) => {
      // 分離点から各ターゲットへのパス
      const separatedPath = this.calculateBezierPath(
        bundlePath.separationPoint, 
        conn.targetPos
      )
      
      // 色を動的に生成（束ね線用カラーパレット）
      const color = this.getBundleColor(index, targetConnections.length)
      
      return {
        path: separatedPath,
        color: color,
        connectionId: conn.id
      }
    })
  }
  
  /**
   * 🎨 束ね線用カラーパレット
   */
  getBundleColor(index, total) {
    const colors = [
      '#4a90e2', '#7b68ee', '#ff6b35', '#2ecc71', 
      '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c'
    ]
    return colors[index % colors.length]
  }
  
  /**
   * 🎨 束ね線要素を作成
   */
  createBundleElement(bundleId, bundlePath, options) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    group.setAttribute('id', `bundle-${bundleId}`)
    group.setAttribute('class', 'connection-bundle')
    
    // 束ね線本体
    const bundleLine = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    bundleLine.setAttribute('d', bundlePath.sourcePath)
    bundleLine.setAttribute('stroke', options.color)
    bundleLine.setAttribute('stroke-width', options.radius)
    bundleLine.setAttribute('stroke-linecap', 'round')
    bundleLine.setAttribute('fill', 'none')
    bundleLine.setAttribute('opacity', options.opacity)
    bundleLine.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
    
    // 束ね線ラベル（接続数表示）
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    const labelPos = {
      x: bundlePath.separationPoint.x,
      y: bundlePath.separationPoint.y - this.bundleConfig.labelOffset
    }
    label.setAttribute('x', labelPos.x)
    label.setAttribute('y', labelPos.y)
    label.setAttribute('text-anchor', 'middle')
    label.setAttribute('font-size', '10')
    label.setAttribute('font-weight', 'bold')
    label.setAttribute('fill', options.color)
    label.textContent = `${options.connectionCount}`
    
    group.appendChild(bundleLine)
    group.appendChild(label)
    
    // クリックイベント（束ね解除）
    group.addEventListener('click', (e) => {
      e.stopPropagation()
      this.unbundleConnections(bundleId)
    })
    
    // ホバーエフェクト
    group.addEventListener('mouseenter', () => {
      bundleLine.setAttribute('opacity', '1.0')
      label.setAttribute('fill', '#ffffff')
    })
    
    group.addEventListener('mouseleave', () => {
      bundleLine.setAttribute('opacity', options.opacity)
      label.setAttribute('fill', options.color)
    })
    
    return group
  }
  
  /**
   * 🔓 束ね解除（束ね線→扇形分散に変更）
   */
  unbundleConnections(bundleId) {
    this.log(`🔓 束ね解除: ${bundleId}`)
    
    const bundleElement = document.getElementById(`bundle-${bundleId}`)
    if (bundleElement) {
      bundleElement.remove()
    }
    
    // 束ね解除後は扇形分散モードに変更
    this.displayMode = 'fanout'
    
    // 関連する接続線を再描画
    const connectionIds = this.bundledConnections.get(bundleId)
    if (connectionIds) {
      this.bundledConnections.delete(bundleId)
      // ここで関連するConnectionManagerに再描画要求
      // 実装は接続管理側で行う
    }
  }
  
  /**
   * 🔧 表示モードを切り替え
   */
  setDisplayMode(mode) {
    const validModes = ['auto', 'fanout', 'bundle', 'individual']
    if (validModes.includes(mode)) {
      this.displayMode = mode
      this.log(`🔧 表示モード変更: ${mode}`)
    }
  }
}