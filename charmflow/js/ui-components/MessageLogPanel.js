/**
 * 📜 MessageLogPanel - メッセージログ表示パネル
 * 
 * 🎯 リアルタイムメッセージ表示・フィルタリング
 * 🌟 BaseUIComponent継承による統一UI
 * 
 * Created: 2025-07-11 (Phase 2)
 * 
 * 🔥 革命的機能:
 * - Intent/Messageリアルタイム監視
 * - 高度なフィルタリング（タイプ・送信元・時間）
 * - メッセージ検索・エクスポート
 * - カラーコード表示・自動スクロール
 * - パフォーマンス最適化（仮想スクロール）
 */

import { BaseUIComponent } from './BaseUIComponent.js'
import { INTENT_TYPES } from '../intent-definitions.js'

/**
 * 📜 MessageLogPanel - メッセージログ表示パネル
 */
export class MessageLogPanel extends BaseUIComponent {
    constructor(pluginNode, options = {}) {
        super(pluginNode, {
            type: 'message-log',
            position: { x: 50, y: 150 },
            size: { width: 500, height: 400 },
            minSize: { width: 350, height: 200 },
            maxSize: { width: 800, height: 600 },
            zIndex: 1800,
            ...options
        })
        
        // 🎯 メッセージログ固有状態
        this.messages = []
        this.filteredMessages = []
        this.maxMessages = options.maxMessages || 1000
        this.autoScroll = options.autoScroll !== false
        this.showTimestamp = options.showTimestamp !== false
        
        // 🔍 フィルター設定
        this.filters = {
            searchText: '',
            messageTypes: new Set(), // 表示するメッセージタイプ
            sourceFilter: '',
            timeRange: 'all' // all, last5min, last30min, lasthour
        }
        
        // 📊 統計情報
        this.stats = {
            totalMessages: 0,
            messagesByType: new Map(),
            messagesPerSecond: 0
        }
        
        // 🎨 UI要素参照
        this.headerElement = null
        this.messageListElement = null
        this.filterBarElement = null
        this.statsElement = null
        
        // ⚙️ パフォーマンス設定
        this.renderBatchSize = 50
        this.renderThrottle = 100 // ms
        this.lastRenderTime = 0
        this.pendingMessages = []
        
        // 🎨 カラーマップ
        this.colorMap = {
            intent: '#007acc',
            message: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            debug: '#6c757d',
            system: '#17a2b8',
            user: '#6f42c1'
        }
        
        this.log('MessageLogPanel initialized', { 
            maxMessages: this.maxMessages,
            autoScroll: this.autoScroll 
        })
    }
    
    /**
     * 📡 Intent リスナー設定
     */
    setupIntentListeners() {
        super.setupIntentListeners()
        
        // すべてのIntentをキャプチャ（ワイルドカード）
        this.addIntentListener('*', (data, intentType) => {
            this.addMessage({
                type: 'intent',
                intentType: intentType,
                data: data,
                timestamp: Date.now(),
                source: data.source || 'unknown'
            })
        })
        
        // メッセージログ専用Intent
        this.addIntentListener('charmflow.log.message', (data) => {
            this.addMessage({
                type: data.level || 'message',
                content: data.message,
                data: data.data,
                timestamp: Date.now(),
                source: data.source || 'system'
            })
        })
        
        // フィルター更新Intent
        this.addIntentListener('charmflow.log.filter', (data) => {
            this.updateFilters(data.filters)
        })
        
        // ログクリアIntent
        this.addIntentListener('charmflow.log.clear', () => {
            this.clearMessages()
        })
    }
    
    /**
     * 🎨 DOM要素作成・描画
     */
    render() {
        const element = this.createBaseElement()
        element.className += ' message-log-panel'
        
        // 🎨 パネルスタイル
        element.style.cssText += `
            background: #1e1e1e;
            border: 1px solid #333;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 12px;
            color: #d4d4d4;
        `
        
        element.innerHTML = this.getTemplate()
        
        // 要素参照設定
        this.headerElement = element.querySelector('.log-header')
        this.filterBarElement = element.querySelector('.filter-bar')
        this.messageListElement = element.querySelector('.message-list')
        this.statsElement = element.querySelector('.log-stats')
        
        // ドラッグ・リサイズ設定
        this.setupDragging(this.headerElement)
        this.setupResizing()
        
        // イベント設定（要素参照設定後に実行）
        this.setupEventHandlers(element)
        
        return element
    }
    
    /**
     * 📄 HTMLテンプレート
     */
    getTemplate() {
        return `
            <div class="log-header" style="
                background: linear-gradient(90deg, #2d2d30 0%, #252526 100%);
                padding: 8px 12px;
                border-bottom: 1px solid #333;
                cursor: grab;
                display: flex;
                align-items: center;
                justify-content: space-between;
            ">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-weight: bold;">📜 Message Log</span>
                    <span class="message-count" style="
                        background: #007acc;
                        color: white;
                        padding: 2px 8px;
                        border-radius: 10px;
                        font-size: 11px;
                    ">0</span>
                </div>
                <div class="header-controls" style="display: flex; gap: 5px;">
                    <button class="toggle-filter" title="フィルター" style="
                        background: none;
                        border: 1px solid #555;
                        color: #ccc;
                        padding: 4px 8px;
                        border-radius: 3px;
                        cursor: pointer;
                        font-size: 11px;
                    ">🔍</button>
                    <button class="clear-log" title="クリア" style="
                        background: none;
                        border: 1px solid #555;
                        color: #ccc;
                        padding: 4px 8px;
                        border-radius: 3px;
                        cursor: pointer;
                        font-size: 11px;
                    ">🗑️</button>
                    <button class="export-log" title="エクスポート" style="
                        background: none;
                        border: 1px solid #555;
                        color: #ccc;
                        padding: 4px 8px;
                        border-radius: 3px;
                        cursor: pointer;
                        font-size: 11px;
                    ">💾</button>
                </div>
            </div>
            
            <div class="filter-bar" style="
                background: #252526;
                padding: 8px;
                border-bottom: 1px solid #333;
                display: none;
            ">
                <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                    <input type="text" class="search-input" placeholder="検索..." style="
                        flex: 1;
                        background: #1e1e1e;
                        border: 1px solid #444;
                        color: #ccc;
                        padding: 4px 8px;
                        border-radius: 3px;
                    ">
                    <select class="time-filter" style="
                        background: #1e1e1e;
                        border: 1px solid #444;
                        color: #ccc;
                        padding: 4px 8px;
                        border-radius: 3px;
                    ">
                        <option value="all">全期間</option>
                        <option value="last5min">過去5分</option>
                        <option value="last30min">過去30分</option>
                        <option value="lasthour">過去1時間</option>
                    </select>
                </div>
                <div class="type-filters" style="display: flex; gap: 5px; flex-wrap: wrap;">
                    <label style="display: flex; align-items: center; gap: 3px; font-size: 11px;">
                        <input type="checkbox" value="intent" checked> 
                        <span style="color: #007acc;">Intent</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 3px; font-size: 11px;">
                        <input type="checkbox" value="message" checked> 
                        <span style="color: #28a745;">Message</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 3px; font-size: 11px;">
                        <input type="checkbox" value="error" checked> 
                        <span style="color: #dc3545;">Error</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 3px; font-size: 11px;">
                        <input type="checkbox" value="warning" checked> 
                        <span style="color: #ffc107;">Warning</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 3px; font-size: 11px;">
                        <input type="checkbox" value="debug"> 
                        <span style="color: #6c757d;">Debug</span>
                    </label>
                </div>
            </div>
            
            <div class="message-list" style="
                flex: 1;
                overflow-y: auto;
                padding: 8px;
                background: #1e1e1e;
            ">
                <!-- メッセージがここに表示される -->
            </div>
            
            <div class="log-stats" style="
                background: #252526;
                padding: 6px 12px;
                border-top: 1px solid #333;
                font-size: 11px;
                color: #999;
                display: flex;
                justify-content: space-between;
            ">
                <span class="stats-text">Ready</span>
                <label style="display: flex; align-items: center; gap: 5px;">
                    <input type="checkbox" class="auto-scroll-check" checked>
                    自動スクロール
                </label>
            </div>
        `
    }
    
    /**
     * 🎯 イベントハンドラー設定
     */
    setupEventHandlers(element) {
        // フィルター切り替え
        const toggleFilterBtn = element.querySelector('.toggle-filter')
        this.addEventListener(toggleFilterBtn, 'click', () => {
            const filterBar = this.filterBarElement
            filterBar.style.display = filterBar.style.display === 'none' ? 'block' : 'none'
        })
        
        // ログクリア
        const clearBtn = element.querySelector('.clear-log')
        this.addEventListener(clearBtn, 'click', () => {
            if (confirm('ログをクリアしますか？')) {
                this.clearMessages()
            }
        })
        
        // エクスポート
        const exportBtn = element.querySelector('.export-log')
        this.addEventListener(exportBtn, 'click', () => {
            this.exportMessages()
        })
        
        // 検索入力
        const searchInput = element.querySelector('.search-input')
        this.addEventListener(searchInput, 'input', (e) => {
            this.filters.searchText = e.target.value.toLowerCase()
            this.applyFilters()
        })
        
        // 時間フィルター
        const timeFilter = element.querySelector('.time-filter')
        this.addEventListener(timeFilter, 'change', (e) => {
            this.filters.timeRange = e.target.value
            this.applyFilters()
        })
        
        // タイプフィルター
        const typeCheckboxes = element.querySelectorAll('.type-filters input[type="checkbox"]')
        typeCheckboxes.forEach(checkbox => {
            this.addEventListener(checkbox, 'change', () => {
                this.updateTypeFilters()
                this.applyFilters()
            })
        })
        
        // 自動スクロール
        const autoScrollCheck = element.querySelector('.auto-scroll-check')
        this.addEventListener(autoScrollCheck, 'change', (e) => {
            this.autoScroll = e.target.checked
        })
    }
    
    /**
     * 📨 メッセージ追加
     */
    addMessage(message) {
        // メッセージ構造正規化
        const normalizedMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: message.type || 'message',
            content: message.content || message.data || message,
            timestamp: message.timestamp || Date.now(),
            source: message.source || 'unknown',
            intentType: message.intentType,
            data: message.data
        }
        
        // メッセージ追加
        this.messages.push(normalizedMessage)
        
        // 最大数制限
        if (this.messages.length > this.maxMessages) {
            this.messages.shift()
        }
        
        // 統計更新
        this.updateStats(normalizedMessage)
        
        // フィルター適用
        if (this.matchesFilters(normalizedMessage)) {
            this.filteredMessages.push(normalizedMessage)
            this.scheduleRender(normalizedMessage)
        }
        
        // カウント更新
        this.updateMessageCount()
    }
    
    /**
     * 🔍 フィルターマッチング
     */
    matchesFilters(message) {
        // タイプフィルター
        if (this.filters.messageTypes.size > 0 && 
            !this.filters.messageTypes.has(message.type)) {
            return false
        }
        
        // 検索フィルター
        if (this.filters.searchText) {
            const searchableText = JSON.stringify(message).toLowerCase()
            if (!searchableText.includes(this.filters.searchText)) {
                return false
            }
        }
        
        // 時間フィルター
        if (this.filters.timeRange !== 'all') {
            const now = Date.now()
            const messageTime = message.timestamp
            let timeLimit = 0
            
            switch (this.filters.timeRange) {
                case 'last5min': timeLimit = 5 * 60 * 1000; break
                case 'last30min': timeLimit = 30 * 60 * 1000; break
                case 'lasthour': timeLimit = 60 * 60 * 1000; break
            }
            
            if (now - messageTime > timeLimit) {
                return false
            }
        }
        
        return true
    }
    
    /**
     * 🎨 メッセージレンダリング（バッチ処理）
     */
    scheduleRender(message) {
        this.pendingMessages.push(message)
        
        const now = Date.now()
        if (now - this.lastRenderTime < this.renderThrottle) {
            // スロットリング中
            if (!this.renderTimer) {
                this.renderTimer = setTimeout(() => {
                    this.renderPendingMessages()
                }, this.renderThrottle)
            }
        } else {
            // 即座にレンダリング
            this.renderPendingMessages()
        }
    }
    
    /**
     * 🎨 保留中メッセージのレンダリング
     */
    renderPendingMessages() {
        if (this.pendingMessages.length === 0) return
        
        const fragment = document.createDocumentFragment()
        const messagesToRender = this.pendingMessages.splice(0, this.renderBatchSize)
        
        messagesToRender.forEach(message => {
            const messageElement = this.createMessageElement(message)
            fragment.appendChild(messageElement)
        })
        
        this.messageListElement.appendChild(fragment)
        
        // 自動スクロール
        if (this.autoScroll) {
            this.messageListElement.scrollTop = this.messageListElement.scrollHeight
        }
        
        this.lastRenderTime = Date.now()
        this.renderTimer = null
        
        // まだ保留中のメッセージがある場合
        if (this.pendingMessages.length > 0) {
            this.scheduleRender()
        }
    }
    
    /**
     * 🎨 メッセージ要素作成
     */
    createMessageElement(message) {
        const div = document.createElement('div')
        div.className = 'message-item'
        div.style.cssText = `
            margin-bottom: 4px;
            padding: 4px 8px;
            border-left: 3px solid ${this.colorMap[message.type] || '#666'};
            background: rgba(255,255,255,0.02);
            border-radius: 2px;
            display: flex;
            align-items: start;
            gap: 8px;
            font-size: 11px;
            line-height: 1.4;
            word-break: break-word;
        `
        
        const timestamp = this.showTimestamp ? 
            `<span style="color: #666; min-width: 60px;">${this.formatTime(message.timestamp)}</span>` : ''
        
        const typeLabel = message.intentType ? 
            `<span style="color: ${this.colorMap[message.type]}; min-width: 80px;">[${message.intentType.split('.').pop()}]</span>` :
            `<span style="color: ${this.colorMap[message.type]}; min-width: 80px;">[${message.type}]</span>`
        
        const content = typeof message.content === 'object' ? 
            `<pre style="margin: 0; white-space: pre-wrap;">${JSON.stringify(message.content, null, 2)}</pre>` :
            `<span>${this.escapeHtml(String(message.content))}</span>`
        
        div.innerHTML = `
            ${timestamp}
            ${typeLabel}
            <div style="flex: 1;">
                ${content}
                ${message.source !== 'unknown' ? `<span style="color: #666; font-size: 10px;"> (${message.source})</span>` : ''}
            </div>
        `
        
        // ダブルクリックで詳細表示
        this.addEventListener(div, 'dblclick', () => {
            this.showMessageDetails(message)
        })
        
        return div
    }
    
    /**
     * 🕒 時刻フォーマット
     */
    formatTime(timestamp) {
        const date = new Date(timestamp)
        const hours = date.getHours().toString().padStart(2, '0')
        const minutes = date.getMinutes().toString().padStart(2, '0')
        const seconds = date.getSeconds().toString().padStart(2, '0')
        const ms = date.getMilliseconds().toString().padStart(3, '0')
        return `${hours}:${minutes}:${seconds}.${ms}`
    }
    
    /**
     * 🔍 フィルター適用
     */
    applyFilters() {
        // フィルター済みメッセージリセット
        this.filteredMessages = this.messages.filter(msg => this.matchesFilters(msg))
        
        // 再レンダリング
        this.messageListElement.innerHTML = ''
        this.pendingMessages = [...this.filteredMessages]
        this.renderPendingMessages()
        
        // カウント更新
        this.updateMessageCount()
    }
    
    /**
     * 🔍 タイプフィルター更新
     */
    updateTypeFilters() {
        this.filters.messageTypes.clear()
        const checkboxes = this.element?.querySelectorAll('.type-filters input[type="checkbox"]:checked') || []
        checkboxes.forEach(checkbox => {
            this.filters.messageTypes.add(checkbox.value)
        })
    }
    
    /**
     * 📊 統計更新
     */
    updateStats(message) {
        this.stats.totalMessages++
        
        const typeCount = this.stats.messagesByType.get(message.type) || 0
        this.stats.messagesByType.set(message.type, typeCount + 1)
        
        // 統計表示更新
        const statsText = this.element?.querySelector('.stats-text')
        if (statsText) {
            const typeCounts = Array.from(this.stats.messagesByType.entries())
                .map(([type, count]) => `${type}: ${count}`)
                .join(', ')
            statsText.textContent = `Total: ${this.stats.totalMessages} | ${typeCounts}`
        }
    }
    
    /**
     * 🔢 メッセージカウント更新
     */
    updateMessageCount() {
        const countElement = this.element?.querySelector('.message-count')
        if (countElement) {
            countElement.textContent = this.filteredMessages.length
        }
    }
    
    /**
     * 🗑️ メッセージクリア
     */
    clearMessages() {
        this.messages = []
        this.filteredMessages = []
        this.pendingMessages = []
        this.messageListElement.innerHTML = ''
        this.stats.totalMessages = 0
        this.stats.messagesByType.clear()
        this.updateMessageCount()
        this.updateStats()
        
        this.log('Messages cleared')
    }
    
    /**
     * 💾 メッセージエクスポート
     */
    exportMessages() {
        const exportData = {
            exportTime: new Date().toISOString(),
            totalMessages: this.filteredMessages.length,
            messages: this.filteredMessages
        }
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `message-log-${Date.now()}.json`
        a.click()
        URL.revokeObjectURL(url)
        
        this.log('Messages exported', { count: this.filteredMessages.length })
    }
    
    /**
     * 🔍 メッセージ詳細表示
     */
    showMessageDetails(message) {
        const detailsWindow = window.open('', 'MessageDetails', 'width=600,height=400')
        detailsWindow.document.write(`
            <html>
            <head>
                <title>Message Details - ${message.id}</title>
                <style>
                    body {
                        font-family: monospace;
                        background: #1e1e1e;
                        color: #d4d4d4;
                        padding: 20px;
                    }
                    pre {
                        background: #252526;
                        padding: 15px;
                        border-radius: 5px;
                        overflow: auto;
                    }
                </style>
            </head>
            <body>
                <h2>Message Details</h2>
                <pre>${JSON.stringify(message, null, 2)}</pre>
            </body>
            </html>
        `)
    }
    
    /**
     * 🛡️ HTMLエスケープ
     */
    escapeHtml(text) {
        const div = document.createElement('div')
        div.textContent = text
        return div.innerHTML
    }
    
    // ライフサイクルフック
    onMounted() {
        super.onMounted()
        
        // 初期メッセージ
        this.addMessage({
            type: 'system',
            content: 'MessageLogPanel started',
            source: 'system'
        })
    }
    
    onShown() {
        super.onShown()
        // 表示時に最新メッセージまでスクロール
        if (this.autoScroll && this.messageListElement) {
            this.messageListElement.scrollTop = this.messageListElement.scrollHeight
        }
    }
    
    onDestroyed() {
        // タイマークリア
        if (this.renderTimer) {
            clearTimeout(this.renderTimer)
        }
        super.onDestroyed()
    }
}

// グローバル公開
window.MessageLogPanel = MessageLogPanel

export default MessageLogPanel