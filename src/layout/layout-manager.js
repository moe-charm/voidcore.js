// layout-manager.js - レイアウト管理システム
// 複数のレイアウトプラグインを統合管理

import { GalaxyLayout } from './galaxy-layout.js'
import { GridLayout } from './grid-layout.js'
import { RadialLayout } from './radial-layout.js'

/**
 * 🎛️ LayoutManager - レイアウト管理システム
 * 
 * 複数のレイアウトプラグインを統合管理
 * - レイアウト切り替え
 * - 設定管理
 * - アニメーション制御
 * - 統計情報の統合
 */
export class LayoutManager {
  constructor(voidCoreUI) {
    this.voidCoreUI = voidCoreUI
    this.version = '1.0.0'
    
    // レイアウトプラグインの登録
    this.layouts = new Map()
    this.registerDefaultLayouts()
    
    // 管理状態
    this.state = {
      currentLayout: null,
      previousLayout: null,
      isTransitioning: false,
      transitionProgress: 0,
      container: null,
      elements: []
    }
    
    // 設定
    this.config = {
      transitionDuration: 500,
      transitionEasing: 'ease-in-out',
      enableTransitions: true,
      enablePreview: true,
      autoSaveLayout: true,
      defaultLayout: 'galaxy'
    }
    
    // イベントリスナー
    this.eventListeners = {
      'layout.changed': [],
      'layout.transition.start': [],
      'layout.transition.complete': [],
      'layout.error': []
    }
    
    this.log('🎛️ LayoutManager initialized')
  }
  
  log(message) {
    console.log(`[LayoutManager] ${message}`)
  }
  
  /**
   * デフォルトレイアウトの登録
   */
  registerDefaultLayouts() {
    this.registerLayout('galaxy', GalaxyLayout)
    this.registerLayout('grid', GridLayout)
    this.registerLayout('radial', RadialLayout)
    
    this.log('🎨 Default layouts registered: galaxy, grid, radial')
  }
  
  /**
   * レイアウトプラグインの登録
   */
  registerLayout(name, LayoutClass) {
    if (this.layouts.has(name)) {
      this.log(`⚠️ Layout ${name} already registered, replacing...`)
    }
    
    this.layouts.set(name, LayoutClass)
    this.log(`📦 Layout registered: ${name}`)
  }
  
  /**
   * レイアウトプラグインの削除
   */
  unregisterLayout(name) {
    if (this.layouts.has(name)) {
      this.layouts.delete(name)
      this.log(`🗑️ Layout unregistered: ${name}`)
    }
  }
  
  /**
   * 利用可能なレイアウト一覧を取得
   */
  getAvailableLayouts() {
    return Array.from(this.layouts.keys())
  }
  
  /**
   * レイアウトの切り替え
   */
  async switchLayout(layoutName, options = {}) {
    if (!this.layouts.has(layoutName)) {
      throw new Error(`Layout '${layoutName}' not found`)
    }
    
    this.log(`🔄 Switching to ${layoutName} layout...`)
    
    // 現在のレイアウトを保存
    this.state.previousLayout = this.state.currentLayout
    
    // 新しいレイアウトを作成
    const LayoutClass = this.layouts.get(layoutName)
    const newLayout = new LayoutClass(options)
    
    // トランジション開始
    if (this.config.enableTransitions && this.state.currentLayout) {
      await this.performTransition(this.state.currentLayout, newLayout)
    } else {
      await this.applyLayoutDirect(newLayout)
    }
    
    // 状態更新
    this.state.currentLayout = newLayout
    this.state.currentLayout.setActive(true)
    
    // 前のレイアウトを非アクティブ化
    if (this.state.previousLayout) {
      this.state.previousLayout.setActive(false)
    }
    
    // 自動保存
    if (this.config.autoSaveLayout) {
      this.saveLayoutPreference(layoutName)
    }
    
    this.emit('layout.changed', {
      from: this.state.previousLayout?.name,
      to: layoutName,
      layout: newLayout
    })
    
    this.log(`✅ Layout switched to ${layoutName}`)
  }
  
  /**
   * レイアウトの直接適用
   */
  async applyLayoutDirect(layout) {
    if (!this.state.container || !this.state.elements.length) {
      this.log('⚠️ No container or elements to apply layout to')
      return
    }
    
    await layout.applyLayout(this.state.elements, this.state.container)
  }
  
  /**
   * レイアウト間のトランジション
   */
  async performTransition(fromLayout, toLayout) {
    this.state.isTransitioning = true
    this.state.transitionProgress = 0
    
    this.emit('layout.transition.start', {
      from: fromLayout.name,
      to: toLayout.name
    })
    
    try {
      // トランジション効果を適用
      await this.animateTransition(fromLayout, toLayout)
      
      this.emit('layout.transition.complete', {
        from: fromLayout.name,
        to: toLayout.name
      })
      
    } catch (error) {
      this.log(`❌ Transition failed: ${error.message}`)
      this.emit('layout.error', { error, type: 'transition' })
      throw error
    } finally {
      this.state.isTransitioning = false
      this.state.transitionProgress = 0
    }
  }
  
  /**
   * トランジションアニメーション
   */
  async animateTransition(fromLayout, toLayout) {
    const startTime = Date.now()
    
    // 新しいレイアウトの位置を計算
    const newPositions = await toLayout.calculateLayout(this.state.elements, this.state.container)
    
    return new Promise((resolve) => {
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / this.config.transitionDuration, 1)
        const eased = this.easeInOut(progress)
        
        this.state.transitionProgress = progress
        
        // 各要素の位置を補間
        this.state.elements.forEach(element => {
          const newPos = newPositions.find(pos => pos.id === element.id)
          if (newPos) {
            const currentPos = this.getElementPosition(element)
            const interpolatedPos = this.interpolatePosition(currentPos, newPos, eased)
            
            fromLayout.setElementPosition(element, interpolatedPos)
          }
        })
        
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
   * 位置の補間
   */
  interpolatePosition(from, to, t) {
    return {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
      scale: from.scale + (to.scale - from.scale) * t,
      rotation: from.rotation + (to.rotation - from.rotation) * t,
      z: to.z
    }
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
   * イージング関数
   */
  easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  }
  
  /**
   * コンテナと要素の設定
   */
  setContainer(container) {
    this.state.container = container
    this.log(`📦 Container set: ${container.id || 'unnamed'}`)
  }
  
  /**
   * 要素の設定
   */
  setElements(elements) {
    this.state.elements = elements
    this.log(`📋 Elements set: ${elements.length} elements`)
  }
  
  /**
   * 要素の追加
   */
  addElement(element) {
    this.state.elements.push(element)
    
    // 現在のレイアウトに要素を追加
    if (this.state.currentLayout) {
      this.state.currentLayout.addElement(element)
    }
    
    this.log(`➕ Element added: ${element.id}`)
  }
  
  /**
   * 要素の削除
   */
  removeElement(elementId) {
    this.state.elements = this.state.elements.filter(el => el.id !== elementId)
    
    // 現在のレイアウトから要素を削除
    if (this.state.currentLayout) {
      this.state.currentLayout.removeElement(elementId)
    }
    
    this.log(`➖ Element removed: ${elementId}`)
  }
  
  /**
   * 現在のレイアウトを取得
   */
  getCurrentLayout() {
    return this.state.currentLayout
  }
  
  /**
   * レイアウト設定の更新
   */
  updateLayoutConfig(config) {
    if (this.state.currentLayout) {
      this.state.currentLayout.updateConfig(config)
      this.log(`⚙️ Layout config updated`)
    }
  }
  
  /**
   * レイアウトの再適用
   */
  async refreshLayout() {
    if (this.state.currentLayout) {
      await this.applyLayoutDirect(this.state.currentLayout)
      this.log('🔄 Layout refreshed')
    }
  }
  
  /**
   * レイアウトプレビュー
   */
  async previewLayout(layoutName, options = {}) {
    if (!this.config.enablePreview) {
      this.log('⚠️ Preview disabled')
      return
    }
    
    if (!this.layouts.has(layoutName)) {
      throw new Error(`Layout '${layoutName}' not found`)
    }
    
    const LayoutClass = this.layouts.get(layoutName)
    const previewLayout = new LayoutClass(options)
    
    // プレビュー用の位置を計算
    const positions = await previewLayout.calculateLayout(this.state.elements, this.state.container)
    
    return {
      name: layoutName,
      positions: positions,
      stats: previewLayout.getStats()
    }
  }
  
  /**
   * レイアウト設定の保存
   */
  saveLayoutPreference(layoutName) {
    try {
      const preferences = {
        layoutName: layoutName,
        config: this.state.currentLayout?.config || {},
        timestamp: Date.now()
      }
      
      localStorage.setItem('voidcore-layout-preferences', JSON.stringify(preferences))
      this.log(`💾 Layout preferences saved: ${layoutName}`)
      
    } catch (error) {
      this.log(`❌ Failed to save layout preferences: ${error.message}`)
    }
  }
  
  /**
   * レイアウト設定の読み込み
   */
  loadLayoutPreference() {
    try {
      const saved = localStorage.getItem('voidcore-layout-preferences')
      if (saved) {
        const preferences = JSON.parse(saved)
        this.log(`📂 Layout preferences loaded: ${preferences.layoutName}`)
        return preferences
      }
    } catch (error) {
      this.log(`❌ Failed to load layout preferences: ${error.message}`)
    }
    
    return null
  }
  
  /**
   * デフォルトレイアウトの適用
   */
  async applyDefaultLayout() {
    // 保存された設定を試す
    const saved = this.loadLayoutPreference()
    const layoutName = saved?.layoutName || this.config.defaultLayout
    const options = saved?.config || {}
    
    if (this.layouts.has(layoutName)) {
      await this.switchLayout(layoutName, options)
    } else {
      // フォールバック
      await this.switchLayout(this.config.defaultLayout)
    }
  }
  
  /**
   * 全体統計情報の取得
   */
  getStats() {
    const layoutStats = this.state.currentLayout?.getStats() || {}
    
    return {
      manager: {
        version: this.version,
        availableLayouts: this.getAvailableLayouts(),
        currentLayout: this.state.currentLayout?.name || null,
        previousLayout: this.state.previousLayout?.name || null,
        isTransitioning: this.state.isTransitioning,
        transitionProgress: this.state.transitionProgress,
        elementCount: this.state.elements.length
      },
      currentLayout: layoutStats,
      config: this.config
    }
  }
  
  /**
   * 設定の更新
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
    this.log('⚙️ Manager configuration updated')
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
   * リセット
   */
  reset() {
    // 現在のレイアウトを停止
    if (this.state.currentLayout) {
      this.state.currentLayout.resetLayout()
    }
    
    // 状態をリセット
    this.state = {
      currentLayout: null,
      previousLayout: null,
      isTransitioning: false,
      transitionProgress: 0,
      container: null,
      elements: []
    }
    
    this.log('🔄 Layout manager reset')
  }
  
  /**
   * 破棄
   */
  destroy() {
    this.reset()
    this.layouts.clear()
    this.eventListeners = {}
    
    this.log('🗑️ Layout manager destroyed')
  }
}

export default LayoutManager

console.log('🎛️ LayoutManager system loaded!')