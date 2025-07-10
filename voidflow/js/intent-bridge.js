/**
 * 🌉 VoidFlow Intent Bridge
 * 
 * 既存のDOMイベントをIntentに変換するブリッジ
 * Phase 2以降でUI操作のIntent化を支援
 * 
 * 🎯 機能:
 * - DOM Event → Intent 変換
 * - イベント分析とIntentタイプ決定
 * - フォールバック処理
 * - デバッグ用イベント監視
 * 
 * Created: 2025-07-09
 * Phase 1: 基盤構築（Phase 2で本格実装）
 */

import { INTENT_TYPES, IntentHelper, IntentShortcuts } from './intent-definitions.js'

/**
 * Intent Bridge - DOMイベントをIntentに変換
 */
export class VoidFlowIntentBridge {
  constructor(voidFlowCore) {
    this.voidFlowCore = voidFlowCore
    this.isEnabled = false
    
    // イベント→Intent変換マップ
    this.eventIntentMap = new Map()
    
    // 監視対象イベント
    this.watchedEvents = [
      'click', 'mousedown', 'mouseup', 'mousemove',
      'dragstart', 'drag', 'dragend',
      'contextmenu', 'keydown', 'keyup'
    ]
    
    // イベントリスナー参照（削除用）
    this.eventListeners = new Map()
    
    // フィルタリング設定
    this.filters = {
      ignoreClasses: ['voidflow-ignore', 'no-intent'],
      ignoreElements: ['SCRIPT', 'STYLE'],
      intentOnlyClasses: ['voidflow-plugin', 'voidcore-ui-element']
    }
    
    this.log('🌉 VoidFlowIntentBridge initializing...')
    this.initialize()
  }
  
  /**
   * 初期化
   */
  initialize() {
    this.setupEventIntentMapping()
    this.log('✅ VoidFlowIntentBridge initialized (Phase 1 - basic setup)')
  }
  
  /**
   * イベント→Intent マッピング設定
   */
  setupEventIntentMapping() {
    // Phase 2で実装予定のマッピング定義
    this.eventIntentMap.set('click-plugin', {
      intentType: INTENT_TYPES.UI.ELEMENT.SELECT,
      analyzer: this.analyzePluginClick.bind(this)
    })
    
    this.eventIntentMap.set('click-ui-element', {
      intentType: INTENT_TYPES.UI.ELEMENT.SELECT,
      analyzer: this.analyzeUIElementClick.bind(this)
    })
    
    this.eventIntentMap.set('drag-start', {
      intentType: INTENT_TYPES.UI.ELEMENT.MOVE,
      analyzer: this.analyzeDragStart.bind(this)
    })
    
    this.eventIntentMap.set('drag-move', {
      intentType: INTENT_TYPES.UI.ELEMENT.MOVE,
      analyzer: this.analyzeDragMove.bind(this)
    })
    
    this.eventIntentMap.set('contextmenu-cancel', {
      intentType: INTENT_TYPES.UI.CONNECTION.CANCEL,
      analyzer: this.analyzeContextMenu.bind(this)
    })
    
    this.log('📋 Event-Intent mapping configured')
  }
  
  /**
   * ブリッジ有効化
   */
  enable() {
    if (this.isEnabled) {
      this.log('⚠️ Bridge already enabled')
      return
    }
    
    this.attachEventListeners()
    this.isEnabled = true
    this.log('🟢 Intent Bridge enabled')
  }
  
  /**
   * ブリッジ無効化
   */
  disable() {
    if (!this.isEnabled) {
      this.log('⚠️ Bridge already disabled')
      return
    }
    
    this.detachEventListeners()
    this.isEnabled = false
    this.log('🔴 Intent Bridge disabled')
  }
  
  /**
   * イベントリスナー追加
   */
  attachEventListeners() {
    for (const eventType of this.watchedEvents) {
      const listener = this.createEventListener(eventType)
      document.addEventListener(eventType, listener, { 
        capture: true,  // キャプチャフェーズで処理
        passive: false  // preventDefault可能
      })
      this.eventListeners.set(eventType, listener)
    }
    
    this.log(`📡 Attached ${this.watchedEvents.length} event listeners`)
  }
  
  /**
   * イベントリスナー削除
   */
  detachEventListeners() {
    for (const [eventType, listener] of this.eventListeners) {
      document.removeEventListener(eventType, listener, { capture: true })
    }
    this.eventListeners.clear()
    this.log('📡 Event listeners detached')
  }
  
  /**
   * イベントリスナー作成
   */
  createEventListener(eventType) {
    return (event) => {
      try {
        this.handleDOMEvent(event)
      } catch (error) {
        this.logError(`Event handling error: ${eventType}`, error)
      }
    }
  }
  
  /**
   * DOMイベント処理
   */
  handleDOMEvent(event) {
    // Phase 1では基本的な処理のみ
    if (!this.shouldProcessEvent(event)) {
      return
    }
    
    // Phase 2で本格実装予定
    this.log(`📨 DOM Event received: ${event.type} (Phase 2 processing pending)`)
    
    // イベント分析
    const context = this.analyzeEvent(event)
    if (!context) return
    
    // Intent変換（Phase 2で実装）
    // const intent = this.translateEventToIntent(event, context)
    // if (intent) {
    //   this.voidFlowCore.sendIntent(intent.type, intent.payload)
    // }
  }
  
  /**
   * イベント処理判定
   */
  shouldProcessEvent(event) {
    // 除外要素チェック
    if (this.filters.ignoreElements.includes(event.target.tagName)) {
      return false
    }
    
    // 除外クラスチェック
    if (event.target.classList) {
      for (const ignoreClass of this.filters.ignoreClasses) {
        if (event.target.classList.contains(ignoreClass)) {
          return false
        }
      }
    }
    
    return true
  }
  
  /**
   * イベント分析
   */
  analyzeEvent(event) {
    const target = event.target
    const context = {
      event: event.type,
      target: target.tagName,
      id: target.id,
      classes: Array.from(target.classList || []),
      position: { x: event.clientX || 0, y: event.clientY || 0 },
      timestamp: Date.now()
    }
    
    // VoidFlow関連要素の判定
    context.isPlugin = this.isPluginElement(target)
    context.isUIElement = this.isUIElement(target)
    context.isCanvas = this.isCanvasArea(target)
    context.isDraggable = this.isDraggableElement(target)
    
    return context
  }
  
  /**
   * プラグイン要素判定
   */
  isPluginElement(element) {
    return element.classList?.contains('voidflow-plugin') ||
           element.classList?.contains('palette-item') ||
           element.closest('.plugin-palette')
  }
  
  /**
   * UI要素判定
   */
  isUIElement(element) {
    return element.classList?.contains('voidcore-ui-element') ||
           element.id?.startsWith('ui-element-') ||
           element.closest('.voidcore-ui-element')
  }
  
  /**
   * キャンバス領域判定
   */
  isCanvasArea(element) {
    return element.id === 'canvas' ||
           element.classList?.contains('voidflow-canvas') ||
           element.closest('#canvas')
  }
  
  /**
   * ドラッグ可能要素判定
   */
  isDraggableElement(element) {
    return element.draggable ||
           element.classList?.contains('draggable') ||
           this.isUIElement(element)
  }
  
  /**
   * プラグインクリック分析（Phase 2で実装）
   */
  analyzePluginClick(event, context) {
    // Phase 2で実装予定
    this.log('🧩 Plugin click analysis (Phase 2 implementation pending)')
    return {
      type: INTENT_TYPES.UI.ELEMENT.SELECT,
      payload: {
        elementId: context.target,
        position: context.position,
        multiSelect: event.ctrlKey || event.metaKey
      }
    }
  }
  
  /**
   * UI要素クリック分析（Phase 2で実装）
   */
  analyzeUIElementClick(event, context) {
    // Phase 2で実装予定
    this.log('🎨 UI element click analysis (Phase 2 implementation pending)')
    return {
      type: INTENT_TYPES.UI.ELEMENT.SELECT,
      payload: {
        elementId: context.id,
        position: context.position,
        selectionType: 'click'
      }
    }
  }
  
  /**
   * ドラッグ開始分析（Phase 2で実装）
   */
  analyzeDragStart(event, context) {
    // Phase 2で実装予定
    this.log('🖱️ Drag start analysis (Phase 2 implementation pending)')
    return {
      type: INTENT_TYPES.UI.ELEMENT.MOVE,
      payload: {
        elementId: context.id,
        startPosition: context.position,
        isDragging: true
      }
    }
  }
  
  /**
   * ドラッグ移動分析（Phase 2で実装）
   */
  analyzeDragMove(event, context) {
    // Phase 2で実装予定
    this.log('🖱️ Drag move analysis (Phase 2 implementation pending)')
    return {
      type: INTENT_TYPES.UI.ELEMENT.MOVE,
      payload: {
        elementId: context.id,
        newPosition: context.position,
        isDragging: true
      }
    }
  }
  
  /**
   * 右クリックメニュー分析（Phase 3で実装）
   */
  analyzeContextMenu(event, context) {
    // Phase 3で実装予定
    this.log('🖱️ Context menu analysis (Phase 3 implementation pending)')
    return {
      type: INTENT_TYPES.UI.CONNECTION.CANCEL,
      payload: {
        reason: 'user',
        position: context.position,
        timestamp: context.timestamp
      }
    }
  }
  
  /**
   * Intent変換（Phase 2で本格実装）
   */
  translateEventToIntent(event, context) {
    // Phase 2で実装予定
    this.log('🔄 Event-to-Intent translation (Phase 2 implementation pending)')
    
    // 基本的な変換ロジック
    const eventKey = `${event.type}-${context.isPlugin ? 'plugin' : 'element'}`
    const mapping = this.eventIntentMap.get(eventKey)
    
    if (mapping && mapping.analyzer) {
      return mapping.analyzer(event, context)
    }
    
    return null
  }
  
  /**
   * フォールバック処理
   */
  fallbackToOriginalHandler(event, context) {
    this.log(`🔄 Falling back to original handler: ${event.type}`)
    
    // 元の処理に委譲
    // Phase 2で実装時に、元のイベントハンドラーを保存・復元する仕組みを実装
  }
  
  /**
   * デバッグ用イベント監視
   */
  enableEventMonitoring(patterns = ['*']) {
    this.log('🔍 Event monitoring enabled')
    this.monitoringPatterns = patterns
    this.isMonitoring = true
  }
  
  disableEventMonitoring() {
    this.log('🔍 Event monitoring disabled') 
    this.isMonitoring = false
  }
  
  /**
   * 統計情報取得
   */
  getStatistics() {
    return {
      enabled: this.isEnabled,
      watchedEvents: this.watchedEvents.length,
      eventListeners: this.eventListeners.size,
      intentMappings: this.eventIntentMap.size,
      filters: this.filters,
      isMonitoring: this.isMonitoring || false
    }
  }
  
  /**
   * 設定更新
   */
  updateFilters(newFilters) {
    this.filters = { ...this.filters, ...newFilters }
    this.log('⚙️ Filters updated')
  }
  
  addIgnoreClass(className) {
    if (!this.filters.ignoreClasses.includes(className)) {
      this.filters.ignoreClasses.push(className)
      this.log(`🚫 Added ignore class: ${className}`)
    }
  }
  
  removeIgnoreClass(className) {
    const index = this.filters.ignoreClasses.indexOf(className)
    if (index > -1) {
      this.filters.ignoreClasses.splice(index, 1)
      this.log(`✅ Removed ignore class: ${className}`)
    }
  }
  
  /**
   * ブリッジ終了処理
   */
  async shutdown() {
    this.log('🔄 Intent Bridge shutting down...')
    
    this.disable()
    this.eventIntentMap.clear()
    this.voidFlowCore = null
    
    this.log('✅ Intent Bridge shutdown complete')
  }
  
  /**
   * ログ出力
   */
  log(message) {
    console.log(`[IntentBridge] ${message}`)
  }
  
  /**
   * エラーログ出力
   */
  logError(message, error) {
    console.error(`[IntentBridge] ${message}`, error)
  }
}

/**
 * ブリッジユーティリティ関数
 */
export class BridgeUtils {
  /**
   * 要素からプラグインID取得
   */
  static getPluginIdFromElement(element) {
    // data-plugin-id属性から取得
    if (element.dataset?.pluginId) {
      return element.dataset.pluginId
    }
    
    // ID属性から推定
    if (element.id?.startsWith('ui-element-')) {
      return element.id.replace('ui-element-', '')
    }
    
    // 親要素を検索
    const pluginElement = element.closest('[data-plugin-id]')
    if (pluginElement) {
      return pluginElement.dataset.pluginId
    }
    
    return null
  }
  
  /**
   * マウス位置正規化
   */
  static normalizeMousePosition(event) {
    const canvas = document.getElementById('canvas')
    if (!canvas) {
      return { x: event.clientX, y: event.clientY }
    }
    
    const rect = canvas.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }
  }
  
  /**
   * キーボード修飾キー検出
   */
  static getModifierKeys(event) {
    return {
      ctrl: event.ctrlKey,
      shift: event.shiftKey,
      alt: event.altKey,
      meta: event.metaKey
    }
  }
  
  /**
   * 要素の状態情報取得
   */
  static getElementState(element) {
    return {
      visible: element.offsetParent !== null,
      position: element.getBoundingClientRect(),
      classes: Array.from(element.classList || []),
      attributes: Object.fromEntries(
        Array.from(element.attributes || []).map(attr => [attr.name, attr.value])
      )
    }
  }
}

// グローバル公開（デバッグ用）
window.VoidFlowIntentBridge = VoidFlowIntentBridge
window.BridgeUtils = BridgeUtils