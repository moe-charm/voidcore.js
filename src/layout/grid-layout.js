// grid-layout.js - Grid レイアウトプラグイン
// 整理されたグリッド配置

import { LayoutPluginBase } from './layout-plugin-base.js'

/**
 * 🔲 GridLayout - グリッドレイアウトプラグイン
 * 
 * 整理されたグリッド形式でプラグインを配置
 * - 自動列数調整
 * - 優先度による配置順序
 * - 動的サイズ調整
 * - カテゴリ別グループ化
 */
export class GridLayout extends LayoutPluginBase {
  constructor(options = {}) {
    super('Grid', {
      columns: 'auto',         // 列数（'auto'で自動調整）
      rows: 'auto',            // 行数（'auto'で自動調整）
      cellWidth: 200,          // セルの幅
      cellHeight: 150,         // セルの高さ
      gap: 20,                 // グリッド間隔
      alignItems: 'center',    // アイテムの縦配置
      justifyItems: 'center',  // アイテムの横配置
      sortBy: 'priority',      // ソート基準
      groupByCategory: false,  // カテゴリ別グループ化
      enableCompact: true,     // コンパクト配置
      enableAutoResize: true,  // 自動サイズ調整
      maxItemsPerRow: 6,       // 1行の最大アイテム数
      ...options
    })
    
    // Grid固有の状態
    this.gridState = {
      actualColumns: 0,        // 実際の列数
      actualRows: 0,           // 実際の行数
      gridCells: [],           // グリッドセル情報
      groups: new Map(),       // カテゴリグループ
      sortedElements: [],      // ソート済み要素
      containerRect: null      // コンテナの矩形
    }
    
    this.log('🔲 Grid layout plugin initialized')
  }
  
  /**
   * Grid レイアウトの計算
   */
  async calculateLayout(elements, container) {
    this.log(`🔲 Calculating grid layout for ${elements.length} elements`)
    
    // コンテナ情報の更新
    this.updateContainerInfo(container)
    
    this.log(`📏 Container size: ${this.state.containerSize.width}x${this.state.containerSize.height}`)
    
    // 要素のソート
    const sortedElements = this.sortElements(elements)
    
    // グリッドサイズの計算
    const { columns, rows } = this.calculateGridSize(sortedElements.length)
    
    this.log(`🔲 Grid size: ${columns} columns x ${rows} rows`)
    
    // グリッドセルの作成
    const cells = this.createGridCells(columns, rows)
    
    this.log(`📦 Created ${cells.length} cells`)
    
    // 要素の配置
    const positions = this.assignElementsToCells(sortedElements, cells)
    
    this.log(`✅ Assigned ${positions.length} positions`)
    
    // 状態の更新
    this.gridState.actualColumns = columns
    this.gridState.actualRows = rows
    this.gridState.gridCells = cells
    this.gridState.sortedElements = sortedElements
    
    return positions
  }
  
  /**
   * コンテナ情報の更新
   */
  updateContainerInfo(container) {
    if (container) {
      this.gridState.containerRect = container.getBoundingClientRect()
      this.updateContainerSize(container)
    }
  }
  
  /**
   * 要素のソート
   */
  sortElements(elements) {
    const sortedElements = [...elements]
    
    switch (this.config.sortBy) {
      case 'priority':
        return this.sortByPriority(sortedElements)
      case 'category':
        return this.sortByCategory(sortedElements)
      case 'name':
        return this.sortByName(sortedElements)
      case 'size':
        return this.sortBySize(sortedElements)
      default:
        return sortedElements
    }
  }
  
  /**
   * 優先度でソート
   */
  sortByPriority(elements) {
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
   * カテゴリでソート
   */
  sortByCategory(elements) {
    return elements.sort((a, b) => {
      const categoryA = this.getElementCategory(a)
      const categoryB = this.getElementCategory(b)
      
      return categoryA.localeCompare(categoryB)
    })
  }
  
  /**
   * 名前でソート
   */
  sortByName(elements) {
    return elements.sort((a, b) => {
      const nameA = this.getElementName(a)
      const nameB = this.getElementName(b)
      
      return nameA.localeCompare(nameB)
    })
  }
  
  /**
   * サイズでソート
   */
  sortBySize(elements) {
    return elements.sort((a, b) => {
      const sizeA = this.getElementSize(a)
      const sizeB = this.getElementSize(b)
      
      const areaA = sizeA.width * sizeA.height
      const areaB = sizeB.width * sizeB.height
      
      return areaB - areaA // 大きい順
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
   * 要素のカテゴリを取得
   */
  getElementCategory(element) {
    if (element.pluginAttributes && element.pluginAttributes.category) {
      return element.pluginAttributes.category
    }
    
    if (element.dataset && element.dataset.category) {
      return element.dataset.category
    }
    
    return 'default'
  }
  
  /**
   * 要素の名前を取得
   */
  getElementName(element) {
    if (element.dataset && element.dataset.name) {
      return element.dataset.name
    }
    
    if (element.textContent) {
      return element.textContent.trim()
    }
    
    return element.id || 'unnamed'
  }
  
  /**
   * グリッドサイズの計算
   */
  calculateGridSize(elementCount) {
    let columns, rows
    
    if (this.config.columns === 'auto') {
      // 自動列数計算
      const containerWidth = this.state.containerSize.width
      const availableWidth = containerWidth - this.config.padding * 2
      const maxColumns = Math.floor(availableWidth / (this.config.cellWidth + this.config.gap))
      
      columns = Math.min(
        Math.max(1, maxColumns),
        Math.min(elementCount, this.config.maxItemsPerRow)
      )
    } else {
      columns = this.config.columns
    }
    
    if (this.config.rows === 'auto') {
      // 自動行数計算
      rows = Math.ceil(elementCount / columns)
    } else {
      rows = this.config.rows
    }
    
    return { columns, rows }
  }
  
  /**
   * グリッドセルの作成
   */
  createGridCells(columns, rows) {
    const cells = []
    const startX = this.config.padding
    const startY = this.config.padding
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const x = startX + col * (this.config.cellWidth + this.config.gap) + this.config.cellWidth / 2
        const y = startY + row * (this.config.cellHeight + this.config.gap) + this.config.cellHeight / 2
        
        cells.push({
          row: row,
          col: col,
          x: x,
          y: y,
          width: this.config.cellWidth,
          height: this.config.cellHeight,
          occupied: false,
          element: null
        })
      }
    }
    
    return cells
  }
  
  /**
   * 要素をセルに配置
   */
  assignElementsToCells(elements, cells) {
    const positions = []
    
    elements.forEach((element, index) => {
      if (index < cells.length) {
        const cell = cells[index]
        
        // セルの中心に配置
        const position = {
          id: element.id,
          x: cell.x,
          y: cell.y,
          scale: this.calculateElementScale(element),
          rotation: 0,
          z: 10
        }
        
        // 境界内に調整
        const elementSize = this.getElementSize(element)
        const adjustedPosition = this.ensureInBounds(position, elementSize)
        
        positions.push(adjustedPosition)
        
        // セルを占有済みにマーク
        cell.occupied = true
        cell.element = element
      }
    })
    
    return positions
  }
  
  /**
   * 要素のスケールを計算
   */
  calculateElementScale(element) {
    if (!this.config.enableAutoResize) {
      return 1
    }
    
    const elementSize = this.getElementSize(element)
    const maxWidth = this.config.cellWidth * 0.9
    const maxHeight = this.config.cellHeight * 0.9
    
    const scaleX = maxWidth / elementSize.width
    const scaleY = maxHeight / elementSize.height
    
    return Math.min(scaleX, scaleY, 1) // 最大1倍
  }
  
  /**
   * コンパクト配置
   */
  compactLayout(positions) {
    if (!this.config.enableCompact) {
      return positions
    }
    
    // 空いているセルに要素を詰める
    const compactedPositions = []
    const occupiedCells = new Set()
    
    positions.forEach(pos => {
      const cell = this.findOptimalCell(pos, occupiedCells)
      if (cell) {
        compactedPositions.push({
          ...pos,
          x: cell.x,
          y: cell.y
        })
        occupiedCells.add(`${cell.row}-${cell.col}`)
      } else {
        compactedPositions.push(pos)
      }
    })
    
    return compactedPositions
  }
  
  /**
   * 最適なセルを見つける
   */
  findOptimalCell(position, occupiedCells) {
    const cells = this.gridState.gridCells
    
    // 現在の位置に最も近いセルを見つける
    let bestCell = null
    let minDistance = Infinity
    
    cells.forEach(cell => {
      const cellKey = `${cell.row}-${cell.col}`
      if (!occupiedCells.has(cellKey)) {
        const distance = Math.sqrt(
          Math.pow(cell.x - position.x, 2) + 
          Math.pow(cell.y - position.y, 2)
        )
        
        if (distance < minDistance) {
          minDistance = distance
          bestCell = cell
        }
      }
    })
    
    return bestCell
  }
  
  /**
   * カテゴリ別グループ化
   */
  groupByCategory(elements) {
    const groups = new Map()
    
    elements.forEach(element => {
      const category = this.getElementCategory(element)
      
      if (!groups.has(category)) {
        groups.set(category, [])
      }
      
      groups.get(category).push(element)
    })
    
    return groups
  }
  
  /**
   * グループ化されたレイアウトの計算
   */
  calculateGroupedLayout(groups) {
    const positions = []
    let currentY = this.config.padding
    
    groups.forEach((elements, category) => {
      // グループヘッダーの配置
      const headerHeight = 30
      currentY += headerHeight
      
      // グループ内の要素配置
      const groupPositions = this.calculateGroupLayout(elements, currentY)
      positions.push(...groupPositions)
      
      // 次のグループのためのスペース
      const groupHeight = this.calculateGroupHeight(elements)
      currentY += groupHeight + this.config.gap
    })
    
    return positions
  }
  
  /**
   * グループ内のレイアウト計算
   */
  calculateGroupLayout(elements, startY) {
    const positions = []
    const columns = this.gridState.actualColumns
    
    elements.forEach((element, index) => {
      const row = Math.floor(index / columns)
      const col = index % columns
      
      const x = this.config.padding + col * (this.config.cellWidth + this.config.gap) + this.config.cellWidth / 2
      const y = startY + row * (this.config.cellHeight + this.config.gap) + this.config.cellHeight / 2
      
      positions.push({
        id: element.id,
        x: x,
        y: y,
        scale: this.calculateElementScale(element),
        rotation: 0,
        z: 10
      })
    })
    
    return positions
  }
  
  /**
   * グループの高さを計算
   */
  calculateGroupHeight(elements) {
    const columns = this.gridState.actualColumns
    const rows = Math.ceil(elements.length / columns)
    
    return rows * (this.config.cellHeight + this.config.gap)
  }
  
  /**
   * グリッド線の描画
   */
  drawGridLines(container) {
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
    
    // 垂直線
    for (let col = 0; col <= this.gridState.actualColumns; col++) {
      const x = this.config.padding + col * (this.config.cellWidth + this.config.gap) - this.config.gap / 2
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      line.setAttribute('x1', x)
      line.setAttribute('y1', this.config.padding)
      line.setAttribute('x2', x)
      line.setAttribute('y2', this.config.padding + this.gridState.actualRows * (this.config.cellHeight + this.config.gap))
      line.setAttribute('stroke', 'rgba(79, 193, 255, 0.1)')
      line.setAttribute('stroke-width', '1')
      svg.appendChild(line)
    }
    
    // 水平線
    for (let row = 0; row <= this.gridState.actualRows; row++) {
      const y = this.config.padding + row * (this.config.cellHeight + this.config.gap) - this.config.gap / 2
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      line.setAttribute('x1', this.config.padding)
      line.setAttribute('y1', y)
      line.setAttribute('x2', this.config.padding + this.gridState.actualColumns * (this.config.cellWidth + this.config.gap))
      line.setAttribute('y2', y)
      line.setAttribute('stroke', 'rgba(79, 193, 255, 0.1)')
      line.setAttribute('stroke-width', '1')
      svg.appendChild(line)
    }
    
    container.appendChild(svg)
  }
  
  /**
   * レイアウト適用（オーバーライド）
   */
  async applyLayout(elements, container) {
    try {
      // グリッド線を描画
      if (this.gridState.actualColumns > 0 && this.gridState.actualRows > 0) {
        this.drawGridLines(container)
      }
      
      // 基本レイアウト適用
      await super.applyLayout(elements, container)
    } catch (error) {
      this.log(`❌ Grid layout apply error: ${error.message}`)
      throw error
    }
  }
  
  /**
   * 要素の追加（オーバーライド）
   */
  addElement(element) {
    super.addElement(element)
    
    // 空いているセルを見つけて配置
    const emptyCell = this.findEmptyCell()
    if (emptyCell) {
      this.setElementPosition(element, {
        x: emptyCell.x,
        y: emptyCell.y,
        scale: this.calculateElementScale(element),
        rotation: 0
      })
      
      emptyCell.occupied = true
      emptyCell.element = element
    }
  }
  
  /**
   * 空いているセルを見つける
   */
  findEmptyCell() {
    return this.gridState.gridCells.find(cell => !cell.occupied)
  }
  
  /**
   * Grid固有の統計情報
   */
  getStats() {
    const baseStats = super.getStats()
    
    return {
      ...baseStats,
      gridStats: {
        actualColumns: this.gridState.actualColumns,
        actualRows: this.gridState.actualRows,
        totalCells: this.gridState.gridCells.length,
        occupiedCells: this.gridState.gridCells.filter(cell => cell.occupied).length,
        sortBy: this.config.sortBy,
        groupByCategory: this.config.groupByCategory
      }
    }
  }
}

console.log('🔲 GridLayout plugin loaded!')