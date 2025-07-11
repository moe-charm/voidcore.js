/**
 * 🔘 SimpleButtonComponent - シンプルなボタンUIコンポーネント
 * 
 * 🎯 ButtonSendPlugin用のリッチUI拡張
 * 🌟 BaseUIComponent継承によるIntent通信対応
 * 
 * Created: 2025-07-11 (Phase 1 Day 3)
 * 
 * 🔥 革命的機能:
 * - PluginNodeのリッチUI展開
 * - ボタンクリックでIntent送信
 * - カスタマイズ可能な外観
 * - アニメーション効果
 */

import { BaseUIComponent } from './BaseUIComponent.js'
import { INTENT_TYPES } from '../intent-definitions.js'

/**
 * 🔘 SimpleButtonComponent - シンプルなボタンUI
 */
export class SimpleButtonComponent extends BaseUIComponent {
    constructor(pluginNode, options = {}) {
        super(pluginNode, {
            type: 'simple-button',
            position: { x: 200, y: 200 },
            size: { width: 250, height: 150 },
            minSize: { width: 200, height: 100 },
            maxSize: { width: 400, height: 250 },
            zIndex: 1500,
            ...options
        })
        
        // 🎯 ボタン固有状態
        this.clickCount = 0
        this.isPressed = false
        this.lastClickTime = null
        
        // 🎨 UI要素参照
        this.buttonElement = null
        this.statusElement = null
        
        // ⚙️ ボタン設定
        this.buttonConfig = {
            label: pluginNode?.properties?.label || 'Click Me',
            buttonColor: pluginNode?.properties?.buttonColor || '#007acc',
            textColor: pluginNode?.properties?.textColor || '#ffffff',
            clickAnimation: options.clickAnimation !== false,
            soundEnabled: options.soundEnabled || false
        }
        
        this.log('SimpleButtonComponent initialized', { buttonConfig: this.buttonConfig })
    }
    
    /**
     * 📡 Intent リスナー設定
     */
    setupIntentListeners() {
        super.setupIntentListeners()
        
        // ボタン設定更新リッスン
        this.addIntentListener('charmflow.button.config.update', (data) => {
            if (data.nodeId === this.pluginNode?.id) {
                this.updateButtonConfig(data.config)
            }
        })
        
        // クリックカウントリセット
        this.addIntentListener('charmflow.button.reset', (data) => {
            if (data.nodeId === this.pluginNode?.id) {
                this.resetClickCount()
            }
        })
    }
    
    /**
     * 🎨 DOM要素作成・描画
     */
    render() {
        const element = this.createBaseElement()
        element.className += ' simple-button-component'
        
        // 🎨 美しいスタイル適用
        element.style.cssText += `
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            border: 2px solid #e1e8ed;
            border-radius: 16px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.12);
            backdrop-filter: blur(10px);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            transition: all 0.3s ease;
        `
        
        element.innerHTML = this.getTemplate()
        
        // 要素参照設定
        this.buttonElement = element.querySelector('.main-button')
        this.statusElement = element.querySelector('.button-status')
        
        // イベント設定
        this.setupEventHandlers()
        
        // ドラッグ・リサイズ設定
        const header = element.querySelector('.component-header')
        this.setupDragging(header)
        this.setupResizing()
        
        return element
    }
    
    /**
     * 📄 HTMLテンプレート
     */
    getTemplate() {
        return `
            <div class="component-header" style="
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 30px;
                background: linear-gradient(90deg, #007acc 0%, #005a9e 100%);
                border-radius: 16px 16px 0 0;
                display: flex;
                align-items: center;
                padding: 0 15px;
                cursor: grab;
            ">
                <span style="color: white; font-size: 12px; font-weight: bold;">
                    🔘 ${this.pluginNode?.displayName || 'Button Component'}
                </span>
            </div>
            
            <div class="button-container" style="
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 15px;
                margin-top: 20px;
            ">
                <button class="main-button" style="
                    background: ${this.buttonConfig.buttonColor};
                    color: ${this.buttonConfig.textColor};
                    border: none;
                    border-radius: 8px;
                    padding: 15px 30px;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 15px rgba(0,122,204,0.3);
                    min-width: 120px;
                    transform: translateY(0);
                ">
                    ${this.buttonConfig.label}
                </button>
                
                <div class="button-status" style="
                    font-size: 12px;
                    color: #666;
                    text-align: center;
                ">
                    Click count: <strong>${this.clickCount}</strong>
                </div>
            </div>
            
            <div class="component-footer" style="
                position: absolute;
                bottom: 5px;
                left: 0;
                right: 0;
                text-align: center;
                font-size: 10px;
                color: #999;
            ">
                ID: ${this.pluginNode?.id?.slice(-8) || 'unknown'}
            </div>
        `
    }
    
    /**
     * 🎯 イベントハンドラー設定
     */
    setupEventHandlers() {
        if (!this.buttonElement) return
        
        // ボタンクリック
        this.addEventListener(this.buttonElement, 'click', (e) => {
            e.stopPropagation()
            this.handleButtonClick()
        })
        
        // マウスダウン・アップでアニメーション
        if (this.buttonConfig.clickAnimation) {
            this.addEventListener(this.buttonElement, 'mousedown', () => {
                this.isPressed = true
                this.buttonElement.style.transform = 'translateY(2px) scale(0.98)'
                this.buttonElement.style.boxShadow = '0 2px 8px rgba(0,122,204,0.2)'
            })
            
            this.addEventListener(this.buttonElement, 'mouseup', () => {
                this.isPressed = false
                this.buttonElement.style.transform = 'translateY(0) scale(1)'
                this.buttonElement.style.boxShadow = '0 4px 15px rgba(0,122,204,0.3)'
            })
            
            this.addEventListener(this.buttonElement, 'mouseleave', () => {
                if (this.isPressed) {
                    this.isPressed = false
                    this.buttonElement.style.transform = 'translateY(0) scale(1)'
                    this.buttonElement.style.boxShadow = '0 4px 15px rgba(0,122,204,0.3)'
                }
            })
        }
        
        // ホバー効果
        this.addEventListener(this.buttonElement, 'mouseenter', () => {
            if (!this.isPressed) {
                this.buttonElement.style.transform = 'translateY(-2px)'
                this.buttonElement.style.boxShadow = '0 6px 20px rgba(0,122,204,0.4)'
            }
        })
        
        this.addEventListener(this.buttonElement, 'mouseleave', () => {
            if (!this.isPressed) {
                this.buttonElement.style.transform = 'translateY(0)'
                this.buttonElement.style.boxShadow = '0 4px 15px rgba(0,122,204,0.3)'
            }
        })
    }
    
    /**
     * 🔘 ボタンクリック処理
     */
    handleButtonClick() {
        this.clickCount++
        this.lastClickTime = Date.now()
        
        // 状態更新
        this.updateClickStatus()
        
        // クリック効果
        if (this.buttonConfig.clickAnimation) {
            this.playClickAnimation()
        }
        
        // Intent送信
        this.sendButtonClickIntent()
        
        this.log('Button clicked', { 
            clickCount: this.clickCount,
            nodeId: this.pluginNode?.id 
        })
    }
    
    /**
     * 📤 ボタンクリックIntent送信
     */
    sendButtonClickIntent() {
        // PluginNodeにクリック通知
        if (this.pluginNode) {
            this.sendIntent('charmflow.button.click', {
                nodeId: this.pluginNode.id,
                clickCount: this.clickCount,
                timestamp: this.lastClickTime,
                label: this.buttonConfig.label
            })
        }
        
        // 汎用ボタンクリックIntent
        this.sendIntent('charmflow.ui.button.clicked', {
            componentId: this.id,
            nodeId: this.pluginNode?.id,
            clickCount: this.clickCount,
            buttonLabel: this.buttonConfig.label
        })
    }
    
    /**
     * 🎬 クリックアニメーション
     */
    playClickAnimation() {
        // リップル効果
        const ripple = document.createElement('div')
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.5);
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `
        
        // アニメーションスタイル追加
        if (!document.querySelector('#ripple-animation')) {
            const style = document.createElement('style')
            style.id = 'ripple-animation'
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
            `
            document.head.appendChild(style)
        }
        
        // リップル配置
        const rect = this.buttonElement.getBoundingClientRect()
        const size = Math.max(rect.width, rect.height)
        ripple.style.width = ripple.style.height = size + 'px'
        ripple.style.left = (rect.width - size) / 2 + 'px'
        ripple.style.top = (rect.height - size) / 2 + 'px'
        
        this.buttonElement.style.position = 'relative'
        this.buttonElement.appendChild(ripple)
        
        // アニメーション後削除
        setTimeout(() => ripple.remove(), 600)
    }
    
    /**
     * 📊 クリック状態更新
     */
    updateClickStatus() {
        if (this.statusElement) {
            this.statusElement.innerHTML = `
                Click count: <strong>${this.clickCount}</strong>
                ${this.lastClickTime ? 
                    `<br><span style="font-size: 10px;">Last: ${new Date(this.lastClickTime).toLocaleTimeString()}</span>` 
                    : ''}
            `
        }
    }
    
    /**
     * ⚙️ ボタン設定更新
     */
    updateButtonConfig(newConfig) {
        Object.assign(this.buttonConfig, newConfig)
        
        if (this.buttonElement) {
            this.buttonElement.textContent = this.buttonConfig.label
            this.buttonElement.style.background = this.buttonConfig.buttonColor
            this.buttonElement.style.color = this.buttonConfig.textColor
        }
        
        this.log('Button config updated', this.buttonConfig)
    }
    
    /**
     * 🔄 クリックカウントリセット
     */
    resetClickCount() {
        this.clickCount = 0
        this.lastClickTime = null
        this.updateClickStatus()
        
        this.log('Click count reset')
    }
    
    /**
     * 📊 コンポーネント状態取得
     */
    getComponentState() {
        return {
            ...super.getComponentState(),
            clickCount: this.clickCount,
            lastClickTime: this.lastClickTime,
            buttonConfig: this.buttonConfig,
            isPressed: this.isPressed
        }
    }
    
    // ライフサイクルフック
    onMounted() {
        super.onMounted()
        this.log('SimpleButtonComponent mounted')
    }
    
    onShown() {
        super.onShown()
        // フォーカス設定
        if (this.buttonElement) {
            this.buttonElement.focus()
        }
    }
    
    onStateChanged(newState, oldState) {
        super.onStateChanged(newState, oldState)
        // 必要に応じて状態変更を反映
    }
}

// グローバル公開
window.SimpleButtonComponent = SimpleButtonComponent

export default SimpleButtonComponent