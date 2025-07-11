/**
 * 🏗️ BaseUIComponent - 全UIコンポーネントの統一基底クラス
 * 
 * 🎯 Gemini統合戦略: ハイブリッド・コンポーネントモデル実装
 * 🌟 設計思想: Intent完全疎結合・統一ライフサイクル・高性能DOM管理
 * 
 * Created: 2025-07-11 (Phase 1 Day 1)
 * 
 * 🔥 革命的機能:
 * - Intent通信統合: nyacore UnifiedIntentHandler完全対応
 * - ライフサイクル管理: mount/unmount/show/hide/expand/collapse
 * - イベント管理: DOM・Intent両方の自動クリーンアップ
 * - 状態同期: リアルタイム状態管理・変更通知
 * - ドラッグ&リサイズ: 標準UI操作対応
 * - デバッグ統合: CharmFlow統合デバッグシステム対応
 */

/**
 * 🏗️ BaseUIComponent - 全UIコンポーネントの統一基底クラス
 */
export class BaseUIComponent {
    constructor(pluginNode, options = {}) {
        // 🎯 基本設定
        this.pluginNode = pluginNode
        this.id = (pluginNode?.id || 'standalone') + '-ui-component-' + Date.now()
        this.type = options.type || 'base'
        
        // 🔗 Intent通信設定
        this.intentHandler = this.setupIntentHandler(pluginNode, options)
        
        // 🎨 DOM要素管理
        this.element = null
        this.containerElement = null
        this.isDestroyed = false
        
        // 📊 状態管理
        this.state = {
            isVisible: false,
            isExpanded: false,
            isMounted: false,
            isDragging: false,
            isResizing: false,
            ...options.initialState
        }
        
        // ⚙️ 設定管理
        this.options = {
            position: { x: 100, y: 100 },
            size: { width: 300, height: 200 },
            minSize: { width: 200, height: 150 },
            maxSize: { width: 1200, height: 800 },
            resizable: true,
            draggable: true,
            zIndex: 1000,
            cssPrefix: 'charm-ui',
            ...options
        }
        
        // 🔧 イベントリスナー管理
        this.eventListeners = []
        this.intentListeners = []
        
        // 🕒 パフォーマンス管理
        this.lastStateUpdate = 0
        this.updateThrottle = options.updateThrottle || 16 // 60fps
        
        // 🚀 初期化
        this.initialize()
    }
    
    /**
     * 🔗 Intent通信ハンドラー設定
     */
    setupIntentHandler(pluginNode, options) {
        // 1. pluginNodeからのIntentHandler
        if (pluginNode?.intentHandler) {
            return pluginNode.intentHandler
        }
        
        // 2. options指定のIntentHandler
        if (options.intentHandler) {
            return options.intentHandler
        }
        
        // 3. グローバルCharmFlowCore
        if (window.charmFlowCore) {
            return window.charmFlowCore
        }
        
        // 4. フォールバック（モック）
        return this.createMockIntentHandler()
    }
    
    /**
     * 🔧 モックIntentHandler作成（テスト・スタンドアロン用）
     */
    createMockIntentHandler() {
        return {
            sendIntent: (type, data) => {
                this.log(`Mock Intent sent: ${type}`, data)
            },
            addIntentListener: (type, handler) => {
                this.log(`Mock Intent listener added: ${type}`)
                return `mock-listener-${Date.now()}`
            },
            removeIntentListener: (listenerId) => {
                this.log(`Mock Intent listener removed: ${listenerId}`)
            }
        }
    }
    
    /**
     * 🚀 初期化処理
     */
    initialize() {
        this.setupIntentListeners()
        this.log('BaseUIComponent initialized', { 
            id: this.id, 
            type: this.type,
            hasPluginNode: !!this.pluginNode,
            intentHandler: this.intentHandler.constructor.name || 'unknown'
        })
    }
    
    /**
     * 📡 Intent リスナー設定 (サブクラスでオーバーライド)
     */
    setupIntentListeners() {
        // 基本的なUIコンポーネント制御Intent
        this.addIntentListener('charmflow.ui.component.expand', (data) => {
            if (data.componentId === this.id) this.expand()
        })
        
        this.addIntentListener('charmflow.ui.component.collapse', (data) => {
            if (data.componentId === this.id) this.collapse()
        })
        
        this.addIntentListener('charmflow.ui.component.state.sync', (data) => {
            if (data.componentId === this.id) this.updateState(data.newState)
        })
        
        this.addIntentListener('charmflow.ui.component.destroy', (data) => {
            if (data.componentId === this.id) this.destroy()
        })
    }
    
    /**
     * 🎨 DOM要素作成・描画 (サブクラスで必須実装)
     */
    render() {
        throw new Error(`render() method must be implemented by subclasses (${this.type})`)
    }
    
    /**
     * 🔧 基本的なDOM構造作成ヘルパー
     */
    createBaseElement() {
        const element = document.createElement('div')
        element.className = `${this.options.cssPrefix}-component ${this.options.cssPrefix}-${this.type}`
        element.id = this.id
        element.style.cssText = `
            position: fixed;
            left: ${this.options.position.x}px;
            top: ${this.options.position.y}px;
            width: ${this.options.size.width}px;
            height: ${this.options.size.height}px;
            z-index: ${this.options.zIndex};
            display: none;
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            font-size: 12px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            overflow: hidden;
        `
        return element
    }
    
    /**
     * 📎 DOM要素をページに追加
     */
    mount(parentElement = document.body) {
        if (this.isDestroyed) {
            this.log('Cannot mount destroyed component')
            return null
        }
        
        if (!this.element) {
            this.element = this.render()
        }
        
        if (this.element && !this.element.parentElement) {
            parentElement.appendChild(this.element)
            this.state.isMounted = true
            this.onMounted()
        }
        
        return this.element
    }
    
    /**
     * 📌 DOM要素をページから削除
     */
    unmount() {
        if (this.element && this.element.parentElement) {
            this.element.parentElement.removeChild(this.element)
            this.state.isMounted = false
            this.onUnmounted()
        }
    }
    
    /**
     * 👁️ 表示
     */
    show() {
        if (this.element && !this.isDestroyed) {
            this.element.style.display = 'block'
            this.state.isVisible = true
            this.onShown()
            
            // 表示時にフォーカス
            if (this.options.focusOnShow !== false) {
                this.focus()
            }
        }
    }
    
    /**
     * 🙈 非表示
     */
    hide() {
        if (this.element) {
            this.element.style.display = 'none'
            this.state.isVisible = false
            this.onHidden()
        }
    }
    
    /**
     * 📈 展開
     */
    expand() {
        this.state.isExpanded = true
        this.show()
        this.onExpanded()
        
        // 展開Intent送信
        this.sendIntent('charmflow.ui.component.expanded', {
            componentId: this.id,
            type: this.type
        })
    }
    
    /**
     * 📉 縮小
     */
    collapse() {
        this.state.isExpanded = false
        this.hide()
        this.onCollapsed()
        
        // 縮小Intent送信
        this.sendIntent('charmflow.ui.component.collapsed', {
            componentId: this.id,
            type: this.type
        })
    }
    
    /**
     * 🔄 状態更新（パフォーマンス最適化）
     */
    updateState(newState) {
        const now = Date.now()
        if (now - this.lastStateUpdate < this.updateThrottle) {
            // スロットリング: 高頻度更新を制限
            setTimeout(() => this.updateState(newState), this.updateThrottle)
            return
        }
        
        const oldState = { ...this.state }
        this.state = { ...this.state, ...newState }
        this.lastStateUpdate = now
        
        this.onStateChanged(this.state, oldState)
    }
    
    /**
     * 🎯 フォーカス設定
     */
    focus() {
        if (this.element && this.state.isVisible) {
            // タブインデックス設定してフォーカス
            this.element.tabIndex = -1
            this.element.focus()
            
            // 最前面に移動
            this.bringToFront()
        }
    }
    
    /**
     * 📤 最前面に移動
     */
    bringToFront() {
        if (this.element) {
            // 他のUIコンポーネントより前面に
            const maxZ = Array.from(document.querySelectorAll(`.${this.options.cssPrefix}-component`))
                .map(el => parseInt(el.style.zIndex) || 0)
                .reduce((max, z) => Math.max(max, z), this.options.zIndex)
            
            this.element.style.zIndex = maxZ + 1
            this.options.zIndex = maxZ + 1
        }
    }
    
    /**
     * 📐 サイズ変更
     */
    resize(newSize) {
        if (!this.element || !this.options.resizable) return
        
        // 最小・最大サイズ制限
        const width = Math.max(this.options.minSize.width, 
                      Math.min(newSize.width, this.options.maxSize.width))
        const height = Math.max(this.options.minSize.height, 
                       Math.min(newSize.height, this.options.maxSize.height))
        
        this.element.style.width = width + 'px'
        this.element.style.height = height + 'px'
        this.options.size = { width, height }
        
        this.onResized({ width, height })
    }
    
    /**
     * 📍 位置変更
     */
    move(newPosition) {
        if (!this.element || !this.options.draggable) return
        
        // 画面境界チェック
        const maxX = window.innerWidth - this.options.size.width
        const maxY = window.innerHeight - this.options.size.height
        
        const x = Math.max(0, Math.min(newPosition.x, maxX))
        const y = Math.max(0, Math.min(newPosition.y, maxY))
        
        this.element.style.left = x + 'px'
        this.element.style.top = y + 'px'
        this.options.position = { x, y }
        
        this.onMoved({ x, y })
    }
    
    /**
     * 📡 Intent送信ヘルパー
     */
    sendIntent(type, payload = {}) {
        const intentData = {
            ...payload,
            componentId: this.id,
            componentType: this.type,
            pluginNodeId: this.pluginNode?.id,
            timestamp: Date.now(),
            source: 'ui-component'
        }
        
        try {
            if (this.intentHandler && typeof this.intentHandler.sendIntent === 'function') {
                this.intentHandler.sendIntent(type, intentData)
            } else if (this.intentHandler && typeof this.intentHandler.processIntent === 'function') {
                // UnifiedIntentHandler対応
                this.intentHandler.processIntent(type, intentData)
            } else {
                this.log('Warning: intentHandler not available', { type, payload: intentData })
            }
        } catch (error) {
            this.log('Error sending intent', { type, error: error.message, payload: intentData })
        }
    }
    
    /**
     * 👂 Intent リスナー追加
     */
    addIntentListener(intentType, handler) {
        try {
            let listenerId = null
            
            if (this.intentHandler && typeof this.intentHandler.addIntentListener === 'function') {
                listenerId = this.intentHandler.addIntentListener(intentType, handler)
            } else if (this.intentHandler && this.intentHandler.intentHandlers) {
                // UnifiedIntentHandler対応
                this.intentHandler.intentHandlers.set(intentType, handler)
                listenerId = `unified-${intentType}-${Date.now()}`
            }
            
            if (listenerId) {
                this.intentListeners.push({ type: 'intent', intentType, handler, listenerId })
            }
            
            return listenerId
        } catch (error) {
            this.log('Error adding intent listener', { intentType, error: error.message })
            return null
        }
    }
    
    /**
     * 🎧 DOM イベントリスナー追加
     */
    addEventListener(element, eventType, handler, options = {}) {
        if (!element) return
        
        element.addEventListener(eventType, handler, options)
        this.eventListeners.push({ type: 'dom', element, eventType, handler, options })
    }
    
    /**
     * 🖱️ ドラッグ機能設定
     */
    setupDragging(dragHandle = null) {
        if (!this.options.draggable || !this.element) return
        
        const handle = dragHandle || this.element
        let isDragging = false
        let dragOffset = { x: 0, y: 0 }
        
        this.addEventListener(handle, 'mousedown', (e) => {
            if (e.button !== 0) return // 左クリックのみ
            
            isDragging = true
            this.state.isDragging = true
            
            const rect = this.element.getBoundingClientRect()
            dragOffset.x = e.clientX - rect.left
            dragOffset.y = e.clientY - rect.top
            
            handle.style.cursor = 'grabbing'
            this.bringToFront()
            
            e.preventDefault()
        })
        
        this.addEventListener(document, 'mousemove', (e) => {
            if (!isDragging) return
            
            const newX = e.clientX - dragOffset.x
            const newY = e.clientY - dragOffset.y
            
            this.move({ x: newX, y: newY })
        })
        
        this.addEventListener(document, 'mouseup', () => {
            if (isDragging) {
                isDragging = false
                this.state.isDragging = false
                handle.style.cursor = this.options.draggable ? 'grab' : 'default'
            }
        })
        
        // ドラッグ可能な見た目
        if (this.options.draggable) {
            handle.style.cursor = 'grab'
        }
    }
    
    /**
     * 📏 リサイズ機能設定
     */
    setupResizing() {
        if (!this.options.resizable || !this.element) return
        
        // リサイズハンドル作成
        const resizeHandle = document.createElement('div')
        resizeHandle.className = `${this.options.cssPrefix}-resize-handle`
        resizeHandle.style.cssText = `
            position: absolute;
            bottom: 0;
            right: 0;
            width: 16px;
            height: 16px;
            cursor: nw-resize;
            background: linear-gradient(-45deg, transparent 0%, transparent 40%, #999 45%, #999 55%, transparent 60%);
        `
        
        let isResizing = false
        let resizeStart = { x: 0, y: 0, width: 0, height: 0 }
        
        this.addEventListener(resizeHandle, 'mousedown', (e) => {
            isResizing = true
            this.state.isResizing = true
            
            resizeStart.x = e.clientX
            resizeStart.y = e.clientY
            resizeStart.width = this.options.size.width
            resizeStart.height = this.options.size.height
            
            e.preventDefault()
            e.stopPropagation()
        })
        
        this.addEventListener(document, 'mousemove', (e) => {
            if (!isResizing) return
            
            const deltaX = e.clientX - resizeStart.x
            const deltaY = e.clientY - resizeStart.y
            
            const newSize = {
                width: resizeStart.width + deltaX,
                height: resizeStart.height + deltaY
            }
            
            this.resize(newSize)
        })
        
        this.addEventListener(document, 'mouseup', () => {
            if (isResizing) {
                isResizing = false
                this.state.isResizing = false
            }
        })
        
        this.element.appendChild(resizeHandle)
    }
    
    /**
     * 📝 ログ出力
     */
    log(message, data = {}) {
        const logData = {
            componentId: this.id,
            componentType: this.type,
            pluginNodeId: this.pluginNode?.id,
            timestamp: Date.now(),
            ...data
        }
        
        // CharmFlow統合デバッグシステム対応
        if (window.debugLogger) {
            window.debugLogger.log('ui', 'info', `[${this.type}] ${message}`, logData)
        } else {
            console.log(`[UIComponent:${this.type}] ${message}`, logData)
        }
    }
    
    /**
     * 💥 破棄処理
     */
    destroy() {
        if (this.isDestroyed) return
        
        this.log('Destroying component')
        
        // 状態更新
        this.isDestroyed = true
        
        // Intent リスナー削除
        this.intentListeners.forEach(listener => {
            try {
                if (listener.listenerId && this.intentHandler?.removeIntentListener) {
                    this.intentHandler.removeIntentListener(listener.listenerId)
                }
            } catch (error) {
                this.log('Error removing intent listener', { error: error.message })
            }
        })
        
        // DOM イベントリスナー削除
        this.eventListeners.forEach(listener => {
            if (listener.type === 'dom' && listener.element) {
                listener.element.removeEventListener(listener.eventType, listener.handler, listener.options)
            }
        })
        
        // DOM要素削除
        this.unmount()
        
        // 参照クリア
        this.element = null
        this.pluginNode = null
        this.intentHandler = null
        this.eventListeners = []
        this.intentListeners = []
        
        this.onDestroyed()
    }
    
    // ==========================================
    // ライフサイクルフック (サブクラスでオーバーライド可能)
    // ==========================================
    
    onMounted() { 
        this.log('Component mounted') 
    }
    
    onUnmounted() { 
        this.log('Component unmounted') 
    }
    
    onShown() { 
        this.log('Component shown') 
    }
    
    onHidden() { 
        this.log('Component hidden') 
    }
    
    onExpanded() { 
        this.log('Component expanded') 
    }
    
    onCollapsed() { 
        this.log('Component collapsed') 
    }
    
    onStateChanged(newState, oldState) { 
        this.log('State changed', { newState, oldState }) 
    }
    
    onMoved(newPosition) { 
        this.log('Component moved', newPosition) 
    }
    
    onResized(newSize) { 
        this.log('Component resized', newSize) 
    }
    
    onDestroyed() { 
        this.log('Component destroyed') 
    }
}

// グローバル公開
window.BaseUIComponent = BaseUIComponent

export default BaseUIComponent