/**
 * 🖥️ DebugConsoleComponent - インタラクティブデバッグコンソール
 * 
 * 🎯 コマンド実行・REPL環境・デバッグ支援
 * 🌟 BaseUIComponent継承による統一UI
 * 
 * Created: 2025-07-11 (Phase 2)
 * 
 * 🔥 革命的機能:
 * - インタラクティブコマンド実行
 * - JavaScript REPL環境
 * - コマンド履歴（↑↓キーで参照）
 * - 自動補完機能
 * - nyacore/CharmFlow API直接操作
 * - 出力結果の美しいフォーマット
 * - エラーの詳細トレース表示
 */

import { BaseUIComponent } from './BaseUIComponent.js'
import { INTENT_TYPES } from '../intent-definitions.js'

/**
 * 🖥️ DebugConsoleComponent - デバッグコンソール
 */
export class DebugConsoleComponent extends BaseUIComponent {
    constructor(pluginNode, options = {}) {
        super(pluginNode, {
            type: 'debug-console',
            position: { x: 100, y: 300 },
            size: { width: 600, height: 400 },
            minSize: { width: 400, height: 250 },
            maxSize: { width: 1000, height: 700 },
            zIndex: 1900,
            ...options
        })
        
        // 🎯 コンソール固有状態
        this.commandHistory = []
        this.historyIndex = -1
        this.maxHistory = options.maxHistory || 100
        this.outputHistory = []
        this.maxOutput = options.maxOutput || 500
        
        // 🎨 UI要素参照
        this.inputElement = null
        this.outputElement = null
        this.promptElement = null
        
        // ⚙️ コンソール設定
        this.consoleConfig = {
            prompt: options.prompt || 'CharmFlow> ',
            welcomeMessage: options.welcomeMessage || '🖥️ CharmFlow Debug Console v1.0\nType "help" for commands',
            enableAutocomplete: options.enableAutocomplete !== false,
            enableMultiline: options.enableMultiline || false,
            syntaxHighlight: options.syntaxHighlight !== false
        }
        
        // 🔧 組み込みコマンド
        this.builtinCommands = new Map([
            ['help', { desc: 'Show available commands', fn: () => this.showHelp() }],
            ['clear', { desc: 'Clear console output', fn: () => this.clearOutput() }],
            ['history', { desc: 'Show command history', fn: () => this.showHistory() }],
            ['nodes', { desc: 'List all plugin nodes', fn: () => this.listNodes() }],
            ['intent', { desc: 'Send Intent (usage: intent <type> <data>)', fn: (args) => this.sendIntentCommand(args) }],
            ['eval', { desc: 'Evaluate JavaScript code', fn: (args) => this.evalCommand(args) }],
            ['export', { desc: 'Export console history', fn: () => this.exportHistory() }],
            ['theme', { desc: 'Toggle light/dark theme', fn: () => this.toggleTheme() }],
            ['api', { desc: 'Show CharmFlow API', fn: () => this.showAPI() }],
            ['perf', { desc: 'Show performance stats', fn: () => this.showPerformance() }]
        ])
        
        // 🎨 テーマ
        this.currentTheme = 'dark'
        this.themes = {
            dark: {
                background: '#1e1e1e',
                text: '#d4d4d4',
                border: '#333',
                input: '#252526',
                output: '#1e1e1e',
                prompt: '#569cd6',
                success: '#4ec9b0',
                error: '#f48771',
                warning: '#dcdcaa',
                info: '#9cdcfe'
            },
            light: {
                background: '#ffffff',
                text: '#000000',
                border: '#ddd',
                input: '#f5f5f5',
                output: '#ffffff',
                prompt: '#0000ff',
                success: '#008000',
                error: '#ff0000',
                warning: '#ff8c00',
                info: '#0066cc'
            }
        }
        
        // 🔍 オートコンプリート
        this.autocompleteCache = []
        this.currentSuggestions = []
        this.suggestionIndex = -1
        
        this.log('DebugConsoleComponent initialized', { 
            prompt: this.consoleConfig.prompt,
            commandCount: this.builtinCommands.size 
        })
    }
    
    /**
     * 📡 Intent リスナー設定
     */
    setupIntentListeners() {
        super.setupIntentListeners()
        
        // コンソールコマンド実行Intent
        this.addIntentListener('charmflow.console.execute', (data) => {
            if (data.command) {
                this.executeCommand(data.command)
            }
        })
        
        // コンソール出力Intent
        this.addIntentListener('charmflow.console.output', (data) => {
            this.addOutput(data.message, data.type || 'info')
        })
        
        // コンソールクリアIntent
        this.addIntentListener('charmflow.console.clear', () => {
            this.clearOutput()
        })
    }
    
    /**
     * 🎨 DOM要素作成・描画
     */
    render() {
        const element = this.createBaseElement()
        element.className += ' debug-console-component'
        
        // テーマ適用
        this.applyTheme(element)
        
        element.innerHTML = this.getTemplate()
        
        // 要素参照設定
        this.outputElement = element.querySelector('.console-output')
        this.inputElement = element.querySelector('.console-input')
        this.promptElement = element.querySelector('.console-prompt')
        
        // イベント設定
        this.setupEventHandlers(element)
        
        // ドラッグ・リサイズ設定
        const header = element.querySelector('.console-header')
        this.setupDragging(header)
        this.setupResizing()
        
        return element
    }
    
    /**
     * 📄 HTMLテンプレート
     */
    getTemplate() {
        const theme = this.themes[this.currentTheme]
        
        return `
            <div class="console-header" style="
                background: linear-gradient(90deg, ${theme.border} 0%, ${theme.background} 100%);
                padding: 8px 12px;
                border-bottom: 1px solid ${theme.border};
                cursor: grab;
                display: flex;
                align-items: center;
                justify-content: space-between;
            ">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-weight: bold;">🖥️ Debug Console</span>
                    <span style="font-size: 11px; color: ${theme.info};">Ready</span>
                </div>
                <div class="header-controls" style="display: flex; gap: 5px;">
                    <button class="clear-btn" title="Clear" style="
                        background: none;
                        border: 1px solid ${theme.border};
                        color: ${theme.text};
                        padding: 4px 8px;
                        border-radius: 3px;
                        cursor: pointer;
                        font-size: 11px;
                    ">Clear</button>
                    <button class="theme-btn" title="Toggle Theme" style="
                        background: none;
                        border: 1px solid ${theme.border};
                        color: ${theme.text};
                        padding: 4px 8px;
                        border-radius: 3px;
                        cursor: pointer;
                        font-size: 11px;
                    ">🎨</button>
                </div>
            </div>
            
            <div class="console-body" style="
                flex: 1;
                display: flex;
                flex-direction: column;
                background: ${theme.background};
                overflow: hidden;
            ">
                <div class="console-output" style="
                    flex: 1;
                    overflow-y: auto;
                    padding: 10px;
                    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                    font-size: 13px;
                    color: ${theme.text};
                    background: ${theme.output};
                ">
                    <!-- 出力がここに表示される -->
                </div>
                
                <div class="console-input-area" style="
                    border-top: 1px solid ${theme.border};
                    padding: 8px;
                    display: flex;
                    align-items: center;
                    background: ${theme.input};
                ">
                    <span class="console-prompt" style="
                        color: ${theme.prompt};
                        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                        font-size: 13px;
                        margin-right: 8px;
                        font-weight: bold;
                    ">${this.consoleConfig.prompt}</span>
                    <input type="text" class="console-input" style="
                        flex: 1;
                        background: transparent;
                        border: none;
                        outline: none;
                        color: ${theme.text};
                        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                        font-size: 13px;
                    " placeholder="Enter command...">
                </div>
                
                <div class="autocomplete-popup" style="
                    position: absolute;
                    bottom: 50px;
                    left: 10px;
                    right: 10px;
                    background: ${theme.background};
                    border: 1px solid ${theme.border};
                    border-radius: 4px;
                    max-height: 150px;
                    overflow-y: auto;
                    display: none;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                ">
                    <!-- オートコンプリート候補 -->
                </div>
            </div>
        `
    }
    
    /**
     * 🎯 イベントハンドラー設定
     */
    setupEventHandlers(element) {
        // 入力処理
        this.addEventListener(this.inputElement, 'keydown', (e) => {
            this.handleKeyDown(e)
        })
        
        this.addEventListener(this.inputElement, 'input', (e) => {
            if (this.consoleConfig.enableAutocomplete) {
                this.handleAutocomplete(e.target.value)
            }
        })
        
        // クリアボタン
        const clearBtn = element.querySelector('.clear-btn')
        this.addEventListener(clearBtn, 'click', () => {
            this.clearOutput()
        })
        
        // テーマ切り替え
        const themeBtn = element.querySelector('.theme-btn')
        this.addEventListener(themeBtn, 'click', () => {
            this.toggleTheme()
        })
        
        // 出力エリアクリックでフォーカス
        this.addEventListener(this.outputElement, 'click', () => {
            this.inputElement.focus()
        })
    }
    
    /**
     * ⌨️ キー入力処理
     */
    handleKeyDown(e) {
        switch (e.key) {
            case 'Enter':
                if (!e.shiftKey || !this.consoleConfig.enableMultiline) {
                    e.preventDefault()
                    this.submitCommand()
                }
                break
                
            case 'ArrowUp':
                e.preventDefault()
                this.navigateHistory(-1)
                break
                
            case 'ArrowDown':
                e.preventDefault()
                this.navigateHistory(1)
                break
                
            case 'Tab':
                e.preventDefault()
                this.handleTabCompletion()
                break
                
            case 'Escape':
                this.hideAutocomplete()
                break
                
            case 'l':
                if (e.ctrlKey) {
                    e.preventDefault()
                    this.clearOutput()
                }
                break
        }
    }
    
    /**
     * 📤 コマンド送信
     */
    submitCommand() {
        const command = this.inputElement.value.trim()
        if (!command) return
        
        // コマンド履歴に追加
        this.addToHistory(command)
        
        // 入力表示
        this.addOutput(`${this.consoleConfig.prompt}${command}`, 'prompt')
        
        // コマンド実行
        this.executeCommand(command)
        
        // 入力クリア
        this.inputElement.value = ''
        this.historyIndex = -1
        this.hideAutocomplete()
    }
    
    /**
     * 🔧 コマンド実行
     */
    executeCommand(command) {
        // Intent送信
        this.sendIntent('charmflow.console.command', {
            command: command,
            timestamp: Date.now()
        })
        
        // 組み込みコマンドチェック
        const [cmd, ...args] = command.split(' ')
        const builtinCmd = this.builtinCommands.get(cmd.toLowerCase())
        
        if (builtinCmd) {
            try {
                const result = builtinCmd.fn(args.join(' '))
                if (result !== undefined) {
                    this.addOutput(result, 'success')
                }
            } catch (error) {
                this.addOutput(`Error: ${error.message}`, 'error')
            }
        } else {
            // JavaScriptとして評価
            this.evaluateJavaScript(command)
        }
    }
    
    /**
     * 🧮 JavaScript評価
     */
    evaluateJavaScript(code) {
        try {
            // グローバルコンテキストで評価
            const result = (function() {
                // CharmFlow APIを使用可能に
                const console = this.createSafeConsole()
                const charmFlow = window.charmFlowCore || {}
                const nyaCore = window.VoidCore || {}
                
                // 評価
                return eval(code)
            }).call(this)
            
            // 結果表示
            if (result !== undefined) {
                this.addOutput(this.formatResult(result), 'success')
            }
        } catch (error) {
            this.addOutput(`${error.name}: ${error.message}`, 'error')
            if (error.stack) {
                this.addOutput(error.stack, 'error', { small: true })
            }
        }
    }
    
    /**
     * 🛡️ 安全なconsoleオブジェクト作成
     */
    createSafeConsole() {
        const self = this
        return {
            log: (...args) => self.addOutput(args.map(a => self.formatResult(a)).join(' '), 'info'),
            info: (...args) => self.addOutput(args.map(a => self.formatResult(a)).join(' '), 'info'),
            warn: (...args) => self.addOutput(args.map(a => self.formatResult(a)).join(' '), 'warning'),
            error: (...args) => self.addOutput(args.map(a => self.formatResult(a)).join(' '), 'error'),
            table: (data) => self.addOutput(self.formatTable(data), 'info'),
            clear: () => self.clearOutput()
        }
    }
    
    /**
     * 📊 結果フォーマット
     */
    formatResult(value) {
        if (value === null) return 'null'
        if (value === undefined) return 'undefined'
        
        const type = typeof value
        
        switch (type) {
            case 'string':
                return `"${value}"`
                
            case 'number':
            case 'boolean':
                return String(value)
                
            case 'function':
                return value.toString()
                
            case 'object':
                if (value instanceof Error) {
                    return `${value.name}: ${value.message}`
                }
                if (value instanceof Date) {
                    return value.toISOString()
                }
                if (Array.isArray(value)) {
                    return `[${value.map(v => this.formatResult(v)).join(', ')}]`
                }
                try {
                    return JSON.stringify(value, null, 2)
                } catch (e) {
                    return value.toString()
                }
                
            default:
                return String(value)
        }
    }
    
    /**
     * 📝 出力追加
     */
    addOutput(message, type = 'info', options = {}) {
        const theme = this.themes[this.currentTheme]
        const timestamp = new Date().toLocaleTimeString()
        
        const outputItem = {
            message,
            type,
            timestamp,
            id: `output-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }
        
        this.outputHistory.push(outputItem)
        
        // 最大数制限
        if (this.outputHistory.length > this.maxOutput) {
            this.outputHistory.shift()
            this.outputElement.removeChild(this.outputElement.firstChild)
        }
        
        // DOM追加
        const div = document.createElement('div')
        div.className = `output-item output-${type}`
        div.style.cssText = `
            margin-bottom: 4px;
            color: ${theme[type] || theme.text};
            white-space: pre-wrap;
            word-break: break-all;
            ${options.small ? 'font-size: 11px; opacity: 0.8;' : ''}
        `
        
        if (type === 'prompt') {
            div.innerHTML = `<strong>${this.escapeHtml(message)}</strong>`
        } else {
            div.textContent = message
        }
        
        this.outputElement.appendChild(div)
        
        // 自動スクロール
        this.outputElement.scrollTop = this.outputElement.scrollHeight
    }
    
    /**
     * 🗑️ 出力クリア
     */
    clearOutput() {
        this.outputHistory = []
        this.outputElement.innerHTML = ''
        this.addOutput(this.consoleConfig.welcomeMessage, 'info')
    }
    
    /**
     * 📜 コマンド履歴追加
     */
    addToHistory(command) {
        // 重複削除
        const index = this.commandHistory.indexOf(command)
        if (index > -1) {
            this.commandHistory.splice(index, 1)
        }
        
        this.commandHistory.push(command)
        
        // 最大数制限
        if (this.commandHistory.length > this.maxHistory) {
            this.commandHistory.shift()
        }
    }
    
    /**
     * 🔄 履歴ナビゲーション
     */
    navigateHistory(direction) {
        if (this.commandHistory.length === 0) return
        
        if (direction === -1) { // Up
            if (this.historyIndex === -1) {
                this.historyIndex = this.commandHistory.length - 1
            } else if (this.historyIndex > 0) {
                this.historyIndex--
            }
        } else { // Down
            if (this.historyIndex < this.commandHistory.length - 1) {
                this.historyIndex++
            } else {
                this.historyIndex = -1
                this.inputElement.value = ''
                return
            }
        }
        
        if (this.historyIndex >= 0 && this.historyIndex < this.commandHistory.length) {
            this.inputElement.value = this.commandHistory[this.historyIndex]
        }
    }
    
    /**
     * 🔍 オートコンプリート処理
     */
    handleAutocomplete(input) {
        if (!input) {
            this.hideAutocomplete()
            return
        }
        
        // 候補生成
        const suggestions = this.generateSuggestions(input)
        
        if (suggestions.length > 0) {
            this.showAutocomplete(suggestions)
        } else {
            this.hideAutocomplete()
        }
    }
    
    /**
     * 💡 候補生成
     */
    generateSuggestions(input) {
        const suggestions = []
        
        // 組み込みコマンド
        for (const [cmd, info] of this.builtinCommands) {
            if (cmd.startsWith(input.toLowerCase())) {
                suggestions.push({
                    text: cmd,
                    description: info.desc,
                    type: 'command'
                })
            }
        }
        
        // グローバル変数
        if (input.includes('.')) {
            // プロパティ補完
            const parts = input.split('.')
            const objPath = parts.slice(0, -1).join('.')
            const prefix = parts[parts.length - 1]
            
            try {
                const obj = eval(objPath)
                if (obj && typeof obj === 'object') {
                    for (const key in obj) {
                        if (key.startsWith(prefix)) {
                            suggestions.push({
                                text: `${objPath}.${key}`,
                                type: 'property'
                            })
                        }
                    }
                }
            } catch (e) {
                // 無視
            }
        } else {
            // グローバル変数
            for (const key in window) {
                if (key.startsWith(input)) {
                    suggestions.push({
                        text: key,
                        type: 'global'
                    })
                }
            }
        }
        
        return suggestions.slice(0, 10) // 最大10件
    }
    
    /**
     * 📋 オートコンプリート表示
     */
    showAutocomplete(suggestions) {
        const popup = this.element.querySelector('.autocomplete-popup')
        popup.innerHTML = suggestions.map((s, i) => `
            <div class="suggestion-item" data-index="${i}" style="
                padding: 5px 10px;
                cursor: pointer;
                ${i === this.suggestionIndex ? 'background: rgba(0,122,204,0.3);' : ''}
            ">
                <strong>${s.text}</strong>
                ${s.description ? `<span style="color: #999; margin-left: 10px; font-size: 11px;">${s.description}</span>` : ''}
            </div>
        `).join('')
        
        popup.style.display = 'block'
        this.currentSuggestions = suggestions
        
        // クリックイベント
        popup.querySelectorAll('.suggestion-item').forEach(item => {
            this.addEventListener(item, 'click', () => {
                const index = parseInt(item.dataset.index)
                this.inputElement.value = suggestions[index].text
                this.hideAutocomplete()
                this.inputElement.focus()
            })
        })
    }
    
    /**
     * 🙈 オートコンプリート非表示
     */
    hideAutocomplete() {
        const popup = this.element.querySelector('.autocomplete-popup')
        popup.style.display = 'none'
        this.currentSuggestions = []
        this.suggestionIndex = -1
    }
    
    /**
     * 📚 ヘルプ表示
     */
    showHelp() {
        this.addOutput('Available commands:', 'info')
        for (const [cmd, info] of this.builtinCommands) {
            this.addOutput(`  ${cmd.padEnd(12)} - ${info.desc}`, 'info')
        }
        this.addOutput('\nYou can also execute any JavaScript code directly.', 'info')
        this.addOutput('Use Tab for autocomplete, ↑↓ for history navigation.', 'info')
    }
    
    /**
     * 📜 履歴表示
     */
    showHistory() {
        if (this.commandHistory.length === 0) {
            this.addOutput('No command history', 'info')
            return
        }
        
        this.addOutput('Command history:', 'info')
        this.commandHistory.forEach((cmd, i) => {
            this.addOutput(`  ${i + 1}. ${cmd}`, 'info')
        })
    }
    
    /**
     * 🎨 テーマ切り替え
     */
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark'
        this.applyTheme(this.element)
        this.addOutput(`Theme switched to ${this.currentTheme}`, 'info')
        
        // 再レンダリング
        const parent = this.element.parentElement
        const newElement = this.render()
        parent.replaceChild(newElement, this.element)
        this.element = newElement
    }
    
    /**
     * 🎨 テーマ適用
     */
    applyTheme(element) {
        const theme = this.themes[this.currentTheme]
        element.style.cssText += `
            background: ${theme.background};
            border: 1px solid ${theme.border};
            color: ${theme.text};
        `
    }
    
    /**
     * 📡 Intentコマンド送信
     */
    sendIntentCommand(args) {
        const parts = args.split(' ')
        if (parts.length < 1) {
            this.addOutput('Usage: intent <type> [data]', 'warning')
            return
        }
        
        const type = parts[0]
        let data = {}
        
        if (parts.length > 1) {
            try {
                data = JSON.parse(parts.slice(1).join(' '))
            } catch (e) {
                data = { message: parts.slice(1).join(' ') }
            }
        }
        
        this.sendIntent(type, data)
        this.addOutput(`Intent sent: ${type}`, 'success')
    }
    
    /**
     * 📊 API表示
     */
    showAPI() {
        this.addOutput('CharmFlow API:', 'info')
        this.addOutput('  window.charmFlowCore - Core instance', 'info')
        this.addOutput('  window.VoidCore - nyacore instance', 'info')
        this.addOutput('  window.debugLogger - Debug logger', 'info')
        this.addOutput('  window.CharmFlowIntents - Intent definitions', 'info')
        this.addOutput('\nExample usage:', 'info')
        this.addOutput('  charmFlowCore.sendIntent("test.intent", {data: 123})', 'info')
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
        
        // ウェルカムメッセージ
        this.clearOutput()
    }
    
    onShown() {
        super.onShown()
        // 表示時に入力フォーカス
        if (this.inputElement) {
            this.inputElement.focus()
        }
    }
    
    onDestroyed() {
        // オートコンプリートクリーンアップ
        this.hideAutocomplete()
        super.onDestroyed()
    }
}

// グローバル公開
window.DebugConsoleComponent = DebugConsoleComponent

export default DebugConsoleComponent