/**
 * 🔍 PropertyInspectorComponent - プロパティインスペクタ
 * 
 * 🎯 Gemini戦略実装: 基本パターン「受信→表示→送信」
 * 🌟 BaseUIComponent継承による統一アーキテクチャ
 * 
 * Created: 2025-07-11 (Phase 1 Day 2)
 * 
 * 🔥 革命的機能:
 * - PluginNode選択でリアルタイムプロパティ表示
 * - プロパティ変更の即座Intent通知
 * - 動的プロパティタイプ対応（文字列・数値・真偽値・色・配列等）
 * - Undo/Redo対応・バリデーション・エラーハンドリング
 * - 美しいUI・ドラッグ&リサイズ対応
 * - CharmFlow統合デバッグシステム完全対応
 */

import { BaseUIComponent } from './BaseUIComponent.js'
import { INTENT_TYPES } from '../intent-definitions.js'

/**
 * 🔍 PropertyInspectorComponent - プロパティインスペクタ
 */
export class PropertyInspectorComponent extends BaseUIComponent {
    constructor(pluginNode, options = {}) {
        super(pluginNode, {
            type: 'property-inspector',
            position: { x: 20, y: 100 },
            size: { width: 300, height: 450 },
            minSize: { width: 250, height: 300 },
            maxSize: { width: 500, height: 700 },
            zIndex: 2000, // 他のUIより前面
            ...options
        })
        
        // 🎯 PropertyInspector固有状態
        this.currentNodeData = null
        this.propertyFields = new Map()
        this.changeHistory = [] // Undo/Redo用
        this.maxHistorySize = 20
        this.unsavedChanges = false
        
        // 🎨 UI要素参照
        this.headerElement = null
        this.contentElement = null
        this.actionsElement = null
        
        // ⚙️ PropertyInspector設定
        this.options.autoSave = options.autoSave !== false
        this.options.showAdvanced = options.showAdvanced || false
        this.options.enableUndo = options.enableUndo !== false
        
        this.log('PropertyInspectorComponent initialized', { autoSave: this.options.autoSave })
    }
    
    /**
     * 📡 Intent リスナー設定
     */
    setupIntentListeners() {
        super.setupIntentListeners()
        
        // 🎯 Gemini戦略: 受信 - ノード選択をリッスン
        this.addIntentListener(INTENT_TYPES.UI.PROPERTY_INSPECTOR.NODE_SELECTED, (data) => {
            this.showNodeProperties(data)
        })
        
        this.addIntentListener(INTENT_TYPES.UI.PROPERTY_INSPECTOR.NODE_DESELECTED, (data) => {
            this.clearProperties(data?.reason)
        })
        
        this.addIntentListener(INTENT_TYPES.UI.PROPERTY_INSPECTOR.SHOW_INSPECTOR, (data) => {
            this.show()
            if (data?.position) {
                this.move(data.position)
            }
        })
        
        this.addIntentListener(INTENT_TYPES.UI.PROPERTY_INSPECTOR.HIDE_INSPECTOR, () => {
            this.hide()
        })
    }
    
    /**
     * 🎨 DOM要素作成・描画
     */
    render() {
        const element = this.createBaseElement()
        element.className += ' property-inspector'
        
        // 🎨 美しいスタイル適用
        element.style.cssText += `
            background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
            border: 1px solid #e1e8ed;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            backdrop-filter: blur(10px);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
        `
        
        element.innerHTML = this.getTemplate()
        this.setupEventHandlers(element)
        this.setupDragging(element.querySelector('.property-inspector-header'))
        this.setupResizing()
        
        return element
    }
    
    /**
     * 📋 テンプレート生成
     */
    getTemplate() {
        return `
            <div class="property-inspector-header" style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 12px 16px;
                border-radius: 11px 11px 0 0;
                font-weight: 600;
                font-size: 13px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: grab;
                user-select: none;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            ">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 16px;">🔍</span>
                    <span>プロパティインスペクタ</span>
                    <div class="unsaved-indicator" style="
                        width: 8px;
                        height: 8px;
                        border-radius: 50%;
                        background: #ffc107;
                        opacity: 0;
                        transition: opacity 0.3s;
                    "></div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button class="advanced-toggle" style="
                        background: rgba(255,255,255,0.2);
                        border: none;
                        color: white;
                        padding: 4px 8px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 11px;
                        transition: background 0.3s;
                    " title="高度な設定">⚙️</button>
                    <button class="close-btn" style="
                        background: rgba(255,255,255,0.2);
                        border: none;
                        color: white;
                        padding: 4px 8px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: bold;
                        transition: background 0.3s;
                    ">×</button>
                </div>
            </div>
            
            <div class="property-inspector-content" style="
                padding: 16px;
                height: calc(100% - 100px);
                overflow-y: auto;
                overflow-x: hidden;
            ">
                <div class="no-selection" style="
                    text-align: center;
                    color: #6c757d;
                    margin-top: 60px;
                    font-size: 14px;
                    line-height: 1.6;
                ">
                    <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;">🎯</div>
                    <div style="font-weight: 500;">ノードを選択してください</div>
                    <div style="font-size: 12px; margin-top: 8px; opacity: 0.7;">
                        キャンバス上のプラグインノードをクリックすると<br>
                        ここにプロパティが表示されます
                    </div>
                </div>
            </div>
            
            <div class="property-inspector-actions" style="
                padding: 12px 16px;
                border-top: 1px solid #e9ecef;
                background: #f8f9fa;
                border-radius: 0 0 11px 11px;
                display: none;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; gap: 8px;">
                        <button class="save-properties-btn" style="
                            background: linear-gradient(135deg, #28a745, #20c997);
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 12px;
                            font-weight: 500;
                            box-shadow: 0 2px 4px rgba(40,167,69,0.3);
                            transition: all 0.3s;
                        ">💾 保存</button>
                        <button class="reset-properties-btn" style="
                            background: linear-gradient(135deg, #6c757d, #495057);
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 12px;
                            font-weight: 500;
                            box-shadow: 0 2px 4px rgba(108,117,125,0.3);
                            transition: all 0.3s;
                        ">🔄 リセット</button>
                    </div>
                    <div style="display: flex; gap: 4px;">
                        <button class="undo-btn" style="
                            background: #f8f9fa;
                            border: 1px solid #dee2e6;
                            color: #6c757d;
                            padding: 6px 10px;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 12px;
                            transition: all 0.3s;
                        " disabled title="元に戻す">↶</button>
                        <button class="redo-btn" style="
                            background: #f8f9fa;
                            border: 1px solid #dee2e6;
                            color: #6c757d;
                            padding: 6px 10px;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 12px;
                            transition: all 0.3s;
                        " disabled title="やり直し">↷</button>
                    </div>
                </div>
            </div>
        `
    }
    
    /**
     * 🖱️ イベントハンドラー設定
     */
    setupEventHandlers(element) {
        // 閉じるボタン
        const closeBtn = element.querySelector('.close-btn')
        this.addEventListener(closeBtn, 'click', () => {
            this.hide()
        })
        
        // 高度な設定トグル
        const advancedToggle = element.querySelector('.advanced-toggle')
        this.addEventListener(advancedToggle, 'click', () => {
            this.toggleAdvancedMode()
        })
        
        // ホバー効果
        this.addEventListener(closeBtn, 'mouseenter', () => {
            closeBtn.style.background = 'rgba(255,255,255,0.3)'
        })
        this.addEventListener(closeBtn, 'mouseleave', () => {
            closeBtn.style.background = 'rgba(255,255,255,0.2)'
        })
        
        this.addEventListener(advancedToggle, 'mouseenter', () => {
            advancedToggle.style.background = 'rgba(255,255,255,0.3)'
        })
        this.addEventListener(advancedToggle, 'mouseleave', () => {
            advancedToggle.style.background = 'rgba(255,255,255,0.2)'
        })
        
        // 参照保存
        this.headerElement = element.querySelector('.property-inspector-header')
        this.contentElement = element.querySelector('.property-inspector-content')
        this.actionsElement = element.querySelector('.property-inspector-actions')
    }
    
    /**
     * 🎯 ノードプロパティ表示 (Gemini戦略: 表示)
     */
    showNodeProperties(nodeData) {
        this.log('Showing node properties', nodeData)
        
        // 未保存変更の確認
        if (this.unsavedChanges && this.currentNodeData) {
            if (!confirm('未保存の変更があります。破棄して続行しますか？')) {
                return
            }
        }
        
        // マウントされていない場合は先にマウント
        if (!this.state.isMounted) {
            this.log('Auto-mounting PropertyInspector for display')
            this.mount()
        }
        
        this.currentNodeData = nodeData
        this.unsavedChanges = false
        this.updateUnsavedIndicator()
        
        if (!this.contentElement) return
        
        const content = this.contentElement
        content.innerHTML = `
            <div class="property-groups">
                ${this.renderBasicInfo(nodeData)}
                ${this.renderDynamicProperties(nodeData.properties || {})}
                ${this.options.showAdvanced ? this.renderAdvancedProperties(nodeData) : ''}
            </div>
        `
        
        this.setupPropertyHandlers()
        this.actionsElement.style.display = 'block'
        this.show()
        
        // 変更履歴リセット
        this.changeHistory = []
        this.updateUndoRedoButtons()
    }
    
    /**
     * 📊 基本情報レンダリング
     */
    renderBasicInfo(nodeData) {
        return `
            <div class="property-group" style="margin-bottom: 20px;">
                <h3 style="
                    margin: 0 0 12px 0; 
                    font-size: 14px; 
                    color: #495057;
                    border-bottom: 2px solid #e9ecef;
                    padding-bottom: 6px;
                    font-weight: 600;
                ">📋 基本情報</h3>
                
                <div class="property-item" style="margin-bottom: 10px;">
                    <label style="
                        display: block; 
                        margin-bottom: 4px; 
                        font-weight: 500;
                        font-size: 12px;
                        color: #6c757d;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    ">NODE ID</label>
                    <input type="text" 
                           value="${this.escapeHtml(nodeData.nodeId || 'N/A')}" 
                           readonly 
                           style="
                               width: 100%;
                               padding: 8px 12px;
                               border: 1px solid #e9ecef;
                               border-radius: 6px;
                               background: #f8f9fa;
                               font-size: 12px;
                               color: #6c757d;
                               font-family: 'SF Mono', Monaco, monospace;
                           ">
                </div>
                
                <div class="property-item" style="margin-bottom: 10px;">
                    <label style="
                        display: block; 
                        margin-bottom: 4px; 
                        font-weight: 500;
                        font-size: 12px;
                        color: #6c757d;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    ">NODE TYPE</label>
                    <input type="text" 
                           value="${this.escapeHtml(nodeData.nodeType || 'N/A')}" 
                           readonly
                           style="
                               width: 100%;
                               padding: 8px 12px;
                               border: 1px solid #e9ecef;
                               border-radius: 6px;
                               background: #f8f9fa;
                               font-size: 12px;
                               color: #6c757d;
                               font-family: 'SF Mono', Monaco, monospace;
                           ">
                </div>
                
                ${nodeData.position ? `
                <div class="property-item" style="margin-bottom: 10px;">
                    <label style="
                        display: block; 
                        margin-bottom: 4px; 
                        font-weight: 500;
                        font-size: 12px;
                        color: #6c757d;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    ">POSITION</label>
                    <div style="display: flex; gap: 8px;">
                        <input type="number" 
                               value="${nodeData.position.x || 0}" 
                               readonly
                               placeholder="X"
                               style="
                                   flex: 1;
                                   padding: 8px 12px;
                                   border: 1px solid #e9ecef;
                                   border-radius: 6px;
                                   background: #f8f9fa;
                                   font-size: 12px;
                                   color: #6c757d;
                               ">
                        <input type="number" 
                               value="${nodeData.position.y || 0}" 
                               readonly
                               placeholder="Y"
                               style="
                                   flex: 1;
                                   padding: 8px 12px;
                                   border: 1px solid #e9ecef;
                                   border-radius: 6px;
                                   background: #f8f9fa;
                                   font-size: 12px;
                                   color: #6c757d;
                               ">
                    </div>
                </div>
                ` : ''}
            </div>
        `
    }
    
    /**
     * ⚙️ 動的プロパティレンダリング
     */
    renderDynamicProperties(properties) {
        if (!properties || Object.keys(properties).length === 0) {
            return `
                <div class="property-group">
                    <h3 style="
                        margin: 0 0 12px 0; 
                        font-size: 14px; 
                        color: #495057;
                        border-bottom: 2px solid #e9ecef;
                        padding-bottom: 6px;
                        font-weight: 600;
                    ">⚙️ プロパティ</h3>
                    <div style="
                        text-align: center;
                        color: #adb5bd;
                        padding: 20px;
                        font-style: italic;
                        font-size: 13px;
                    ">プロパティがありません</div>
                </div>
            `
        }
        
        const propertyItems = Object.entries(properties).map(([key, value]) => {
            return this.renderPropertyItem(key, value)
        }).join('')
        
        return `
            <div class="property-group">
                <h3 style="
                    margin: 0 0 12px 0; 
                    font-size: 14px; 
                    color: #495057;
                    border-bottom: 2px solid #e9ecef;
                    padding-bottom: 6px;
                    font-weight: 600;
                ">⚙️ プロパティ</h3>
                <div class="dynamic-properties">
                    ${propertyItems}
                </div>
            </div>
        `
    }
    
    /**
     * 🎛️ プロパティアイテムレンダリング
     */
    renderPropertyItem(key, value) {
        const propertyType = this.detectPropertyType(key, value)
        const inputField = this.createInputField(key, value, propertyType)
        
        return `
            <div class="property-item" style="margin-bottom: 12px;" data-property="${key}">
                <label style="
                    display: block; 
                    margin-bottom: 6px; 
                    font-weight: 500;
                    font-size: 12px;
                    color: #495057;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <span>${this.formatPropertyName(key)}</span>
                    <span style="
                        font-size: 10px;
                        color: #adb5bd;
                        font-weight: 400;
                        font-family: 'SF Mono', Monaco, monospace;
                    ">${propertyType}</span>
                </label>
                ${inputField}
            </div>
        `
    }
    
    /**
     * 🔍 プロパティタイプ検出
     */
    detectPropertyType(key, value) {
        const keyLower = key.toLowerCase()
        
        // 特殊キーパターン
        if (keyLower.includes('color') || keyLower.includes('colour')) return 'color'
        if (keyLower.includes('url') || keyLower.includes('link')) return 'url'
        if (keyLower.includes('email')) return 'email'
        if (keyLower.includes('password')) return 'password'
        if (keyLower.includes('date')) return 'date'
        if (keyLower.includes('time')) return 'time'
        if (keyLower.includes('range') || keyLower.includes('slider')) return 'range'
        
        // 値による判定
        if (typeof value === 'boolean') return 'boolean'
        if (typeof value === 'number') return 'number'
        if (Array.isArray(value)) return 'array'
        if (typeof value === 'object' && value !== null) return 'object'
        if (typeof value === 'string') {
            if (value.match(/^#[0-9a-fA-F]{6}$/)) return 'color'
            if (value.match(/^https?:\/\//)) return 'url'
            if (value.includes('\n')) return 'textarea'
            return 'text'
        }
        
        return 'text'
    }
    
    /**
     * 🎨 入力フィールド作成
     */
    createInputField(key, value, type) {
        const baseStyle = `
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            font-size: 12px;
            transition: all 0.3s;
            background: white;
        `
        
        const focusStyle = `
            onFocus="this.style.borderColor='#667eea'; this.style.boxShadow='0 0 0 3px rgba(102,126,234,0.1)'"
            onBlur="this.style.borderColor='#dee2e6'; this.style.boxShadow='none'"
        `
        
        switch (type) {
            case 'boolean':
                return `
                    <label style="
                        display: flex;
                        align-items: center;
                        cursor: pointer;
                        gap: 8px;
                        font-weight: 400;
                    ">
                        <input type="checkbox" 
                               class="property-input"
                               data-property="${key}"
                               data-type="boolean"
                               ${value ? 'checked' : ''}
                               style="
                                   width: 16px;
                                   height: 16px;
                                   accent-color: #667eea;
                               ">
                        <span style="font-size: 12px; color: #6c757d;">
                            ${value ? 'True' : 'False'}
                        </span>
                    </label>
                `
            
            case 'number':
                return `
                    <input type="number" 
                           class="property-input"
                           data-property="${key}"
                           data-type="number"
                           value="${value}"
                           ${focusStyle}
                           style="${baseStyle}"
                           step="any">
                `
            
            case 'color':
                return `
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <input type="color" 
                               class="property-input"
                               data-property="${key}"
                               data-type="color"
                               value="${value}"
                               style="
                                   width: 40px;
                                   height: 32px;
                                   border: 1px solid #dee2e6;
                                   border-radius: 6px;
                                   cursor: pointer;
                               ">
                        <input type="text" 
                               class="property-input"
                               data-property="${key}"
                               data-type="color"
                               value="${value}"
                               ${focusStyle}
                               style="${baseStyle} flex: 1;"
                               pattern="^#[0-9a-fA-F]{6}$">
                    </div>
                `
            
            case 'range':
                const min = 0, max = 100, step = 1
                return `
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <input type="range" 
                               class="property-input"
                               data-property="${key}"
                               data-type="range"
                               value="${value}"
                               min="${min}" max="${max}" step="${step}"
                               style="flex: 1; accent-color: #667eea;">
                        <span style="
                            font-size: 12px; 
                            color: #6c757d; 
                            font-weight: 500;
                            min-width: 30px;
                            text-align: center;
                        ">${value}</span>
                    </div>
                `
            
            case 'textarea':
                return `
                    <textarea class="property-input"
                              data-property="${key}"
                              data-type="textarea"
                              ${focusStyle}
                              style="${baseStyle} height: 80px; resize: vertical; font-family: inherit;"
                              placeholder="テキストを入力...">${this.escapeHtml(String(value))}</textarea>
                `
            
            case 'array':
                return `
                    <textarea class="property-input"
                              data-property="${key}"
                              data-type="array"
                              ${focusStyle}
                              style="${baseStyle} height: 60px; resize: vertical; font-family: 'SF Mono', Monaco, monospace;"
                              placeholder="配列をJSON形式で入力...">${this.escapeHtml(JSON.stringify(value, null, 2))}</textarea>
                `
            
            case 'object':
                return `
                    <textarea class="property-input"
                              data-property="${key}"
                              data-type="object"
                              ${focusStyle}
                              style="${baseStyle} height: 80px; resize: vertical; font-family: 'SF Mono', Monaco, monospace;"
                              placeholder="オブジェクトをJSON形式で入力...">${this.escapeHtml(JSON.stringify(value, null, 2))}</textarea>
                `
            
            default: // text, url, email, password, date, time
                return `
                    <input type="${type}" 
                           class="property-input"
                           data-property="${key}"
                           data-type="${type}"
                           value="${this.escapeHtml(String(value))}"
                           ${focusStyle}
                           style="${baseStyle}"
                           placeholder="値を入力...">
                `
        }
    }
    
    /**
     * 🏷️ プロパティ名フォーマット
     */
    formatPropertyName(key) {
        return key
            .replace(/([A-Z])/g, ' $1') // camelCase分割
            .replace(/^./, str => str.toUpperCase()) // 先頭大文字
            .replace(/_/g, ' ') // アンダースコア置換
    }
    
    /**
     * 🔧 高度なプロパティレンダリング
     */
    renderAdvancedProperties(nodeData) {
        return `
            <div class="property-group advanced-properties" style="margin-top: 20px;">
                <h3 style="
                    margin: 0 0 12px 0; 
                    font-size: 14px; 
                    color: #495057;
                    border-bottom: 2px solid #e9ecef;
                    padding-bottom: 6px;
                    font-weight: 600;
                ">⚡ 高度な設定</h3>
                
                <div class="property-item" style="margin-bottom: 12px;">
                    <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 12px; color: #495057;">
                        Metadata
                    </label>
                    <textarea readonly
                              style="
                                  width: 100%;
                                  padding: 8px 12px;
                                  border: 1px solid #e9ecef;
                                  border-radius: 6px;
                                  background: #f8f9fa;
                                  font-size: 11px;
                                  color: #6c757d;
                                  font-family: 'SF Mono', Monaco, monospace;
                                  height: 80px;
                                  resize: vertical;
                              "
                              placeholder="No metadata available">${this.escapeHtml(JSON.stringify(nodeData.metadata || {}, null, 2))}</textarea>
                </div>
            </div>
        `
    }
    
    /**
     * 🎛️ プロパティハンドラー設定
     */
    setupPropertyHandlers() {
        if (!this.contentElement) return
        
        // プロパティ変更ハンドラー
        const propertyInputs = this.contentElement.querySelectorAll('.property-input')
        propertyInputs.forEach(input => {
            this.addEventListener(input, 'input', (e) => {
                this.handlePropertyChange(e.target)
            })
            
            this.addEventListener(input, 'change', (e) => {
                this.handlePropertyChange(e.target)
            })
        })
        
        // アクションボタン
        this.setupActionButtons()
    }
    
    /**
     * 🎯 アクションボタン設定
     */
    setupActionButtons() {
        if (!this.actionsElement) return
        
        // 保存ボタン
        const saveBtn = this.actionsElement.querySelector('.save-properties-btn')
        if (saveBtn) {
            this.addEventListener(saveBtn, 'click', () => {
                this.saveAllProperties()
            })
        }
        
        // リセットボタン
        const resetBtn = this.actionsElement.querySelector('.reset-properties-btn')
        if (resetBtn) {
            this.addEventListener(resetBtn, 'click', () => {
                this.resetProperties()
            })
        }
        
        // Undo/Redoボタン
        const undoBtn = this.actionsElement.querySelector('.undo-btn')
        const redoBtn = this.actionsElement.querySelector('.redo-btn')
        
        if (undoBtn) {
            this.addEventListener(undoBtn, 'click', () => {
                this.undo()
            })
        }
        
        if (redoBtn) {
            this.addEventListener(redoBtn, 'click', () => {
                this.redo()
            })
        }
        
        // ホバー効果
        [saveBtn, resetBtn].filter(btn => btn).forEach(btn => {
            this.addEventListener(btn, 'mouseenter', () => {
                btn.style.transform = 'translateY(-2px)'
                btn.style.boxShadow = btn.style.boxShadow.replace('0 2px 4px', '0 4px 8px')
            })
            
            this.addEventListener(btn, 'mouseleave', () => {
                btn.style.transform = 'translateY(0)'
                btn.style.boxShadow = btn.style.boxShadow.replace('0 4px 8px', '0 2px 4px')
            })
        })
    }
    
    /**
     * ⚡ プロパティ変更処理 (Gemini戦略: 送信)
     */
    handlePropertyChange(inputElement) {
        if (!this.currentNodeData) return
        
        const propertyName = inputElement.dataset.property
        const propertyType = inputElement.dataset.type
        let newValue = this.parseInputValue(inputElement, propertyType)
        const oldValue = this.currentNodeData.properties?.[propertyName]
        
        // 値が変更されていない場合はスキップ
        if (this.valuesEqual(newValue, oldValue)) return
        
        // バリデーション
        const validationResult = this.validatePropertyValue(propertyName, newValue, propertyType)
        if (!validationResult.valid) {
            this.showValidationError(inputElement, validationResult.error)
            return
        }
        
        // 変更履歴に追加
        this.addToHistory(propertyName, oldValue, newValue)
        
        // 現在データ更新
        if (!this.currentNodeData.properties) {
            this.currentNodeData.properties = {}
        }
        this.currentNodeData.properties[propertyName] = newValue
        
        // 未保存状態マーク
        this.unsavedChanges = true
        this.updateUnsavedIndicator()
        
        // レンジ入力の場合、値表示を更新
        if (propertyType === 'range') {
            const valueDisplay = inputElement.parentElement.querySelector('span')
            if (valueDisplay) {
                valueDisplay.textContent = newValue
            }
        }
        
        // 自動保存
        if (this.options.autoSave) {
            this.debounce(() => {
                this.sendPropertyUpdate(propertyName, newValue, oldValue)
            }, 500)()
        }
        
        this.log('Property changed', { 
            propertyName, 
            newValue, 
            oldValue, 
            type: propertyType,
            autoSave: this.options.autoSave
        })
    }
    
    /**
     * 🔄 入力値パース
     */
    parseInputValue(inputElement, type) {
        const rawValue = inputElement.value
        
        switch (type) {
            case 'boolean':
                return inputElement.checked
            case 'number':
            case 'range':
                const num = parseFloat(rawValue)
                return isNaN(num) ? 0 : num
            case 'array':
                try {
                    const parsed = JSON.parse(rawValue)
                    return Array.isArray(parsed) ? parsed : [rawValue]
                } catch {
                    return rawValue.split(',').map(s => s.trim()).filter(s => s)
                }
            case 'object':
                try {
                    return JSON.parse(rawValue)
                } catch {
                    return { value: rawValue }
                }
            default:
                return rawValue
        }
    }
    
    /**
     * ✅ プロパティ値バリデーション
     */
    validatePropertyValue(propertyName, value, type) {
        switch (type) {
            case 'color':
                if (typeof value === 'string' && !value.match(/^#[0-9a-fA-F]{6}$/)) {
                    return { valid: false, error: '色は#rrggbb形式で入力してください' }
                }
                break
            case 'url':
                if (typeof value === 'string' && value && !value.match(/^https?:\/\/.+/)) {
                    return { valid: false, error: '有効なURLを入力してください' }
                }
                break
            case 'email':
                if (typeof value === 'string' && value && !value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                    return { valid: false, error: '有効なメールアドレスを入力してください' }
                }
                break
            case 'number':
            case 'range':
                if (typeof value !== 'number' || isNaN(value)) {
                    return { valid: false, error: '有効な数値を入力してください' }
                }
                break
        }
        
        return { valid: true }
    }
    
    /**
     * ⚠️ バリデーションエラー表示
     */
    showValidationError(inputElement, error) {
        // エラー状態のスタイル適用
        inputElement.style.borderColor = '#dc3545'
        inputElement.style.boxShadow = '0 0 0 3px rgba(220,53,69,0.1)'
        
        // エラーメッセージ表示
        let errorElement = inputElement.parentElement.querySelector('.validation-error')
        if (!errorElement) {
            errorElement = document.createElement('div')
            errorElement.className = 'validation-error'
            errorElement.style.cssText = `
                color: #dc3545;
                font-size: 11px;
                margin-top: 4px;
                animation: fadeIn 0.3s;
            `
            inputElement.parentElement.appendChild(errorElement)
        }
        
        errorElement.textContent = error
        
        // 3秒後にエラー状態解除
        setTimeout(() => {
            inputElement.style.borderColor = '#dee2e6'
            inputElement.style.boxShadow = 'none'
            if (errorElement) {
                errorElement.remove()
            }
        }, 3000)
    }
    
    /**
     * 📝 変更履歴追加
     */
    addToHistory(propertyName, oldValue, newValue) {
        if (!this.options.enableUndo) return
        
        this.changeHistory.push({
            propertyName,
            oldValue,
            newValue,
            timestamp: Date.now()
        })
        
        // 履歴サイズ制限
        if (this.changeHistory.length > this.maxHistorySize) {
            this.changeHistory.shift()
        }
        
        this.updateUndoRedoButtons()
    }
    
    /**
     * ↶ Undo実行
     */
    undo() {
        if (this.changeHistory.length === 0) return
        
        const lastChange = this.changeHistory.pop()
        if (!lastChange) return
        
        // 値を戻す
        if (this.currentNodeData.properties) {
            this.currentNodeData.properties[lastChange.propertyName] = lastChange.oldValue
        }
        
        // UI更新
        this.refreshPropertyDisplay(lastChange.propertyName, lastChange.oldValue)
        this.updateUndoRedoButtons()
        
        this.log('Undo executed', lastChange)
    }
    
    /**
     * ↷ Redo実行 (簡易実装)
     */
    redo() {
        // TODO: より高度なRedo機能実装
        this.log('Redo not yet implemented')
    }
    
    /**
     * 🔄 プロパティ表示リフレッシュ
     */
    refreshPropertyDisplay(propertyName, value) {
        const inputElement = this.contentElement?.querySelector(`[data-property="${propertyName}"]`)
        if (!inputElement) return
        
        const type = inputElement.dataset.type
        
        if (type === 'boolean') {
            inputElement.checked = !!value
        } else if (type === 'array' || type === 'object') {
            inputElement.value = JSON.stringify(value, null, 2)
        } else {
            inputElement.value = String(value)
        }
    }
    
    /**
     * 🔄 Undo/Redoボタン更新
     */
    updateUndoRedoButtons() {
        if (!this.actionsElement) return
        
        const undoBtn = this.actionsElement.querySelector('.undo-btn')
        const redoBtn = this.actionsElement.querySelector('.redo-btn')
        
        if (undoBtn) {
            undoBtn.disabled = this.changeHistory.length === 0
            undoBtn.style.opacity = undoBtn.disabled ? '0.5' : '1'
        }
        
        if (redoBtn) {
            redoBtn.disabled = true // 簡易実装では常に無効
            redoBtn.style.opacity = '0.5'
        }
    }
    
    /**
     * 💾 全プロパティ保存 (Gemini戦略: 送信)
     */
    saveAllProperties() {
        if (!this.currentNodeData) return
        
        const inputs = this.contentElement?.querySelectorAll('.property-input')
        if (!inputs) return
        
        const updates = []
        let hasErrors = false
        
        inputs.forEach(input => {
            const propertyName = input.dataset.property
            const propertyType = input.dataset.type
            const newValue = this.parseInputValue(input, propertyType)
            const oldValue = this.currentNodeData.properties?.[propertyName]
            
            // バリデーション
            const validationResult = this.validatePropertyValue(propertyName, newValue, propertyType)
            if (!validationResult.valid) {
                this.showValidationError(input, validationResult.error)
                hasErrors = true
                return
            }
            
            if (!this.valuesEqual(newValue, oldValue)) {
                updates.push({ propertyName, newValue, oldValue })
                
                // Intent送信
                this.sendPropertyUpdate(propertyName, newValue, oldValue)
            }
        })
        
        if (hasErrors) {
            this.log('Save failed due to validation errors')
            return
        }
        
        // 保存完了状態
        this.unsavedChanges = false
        this.updateUnsavedIndicator()
        
        // 成功フィードバック
        this.showSaveSuccess(updates.length)
        
        this.log('All properties saved', { updates, count: updates.length })
    }
    
    /**
     * 📤 プロパティ更新Intent送信
     */
    sendPropertyUpdate(propertyName, newValue, oldValue) {
        this.sendIntent(INTENT_TYPES.UI.PROPERTY_INSPECTOR.UPDATE_NODE_PROPERTY, {
            nodeId: this.currentNodeData.nodeId,
            propertyName,
            newValue,
            oldValue,
            propertyType: typeof newValue
        })
    }
    
    /**
     * 🔄 プロパティリセット
     */
    resetProperties() {
        if (!this.currentNodeData) return
        
        if (this.unsavedChanges) {
            if (!confirm('未保存の変更をリセットしますか？')) {
                return
            }
        }
        
        // 元の値に戻す（簡易実装）
        if (this.currentNodeData) {
            this.showNodeProperties(this.currentNodeData)
        }
        
        this.log('Properties reset')
    }
    
    /**
     * 🔄 プロパティクリア
     */
    clearProperties(reason = 'deselected') {
        if (this.unsavedChanges) {
            if (!confirm('未保存の変更があります。破棄しますか？')) {
                return
            }
        }
        
        if (this.contentElement) {
            this.contentElement.innerHTML = `
                <div class="no-selection" style="
                    text-align: center;
                    color: #6c757d;
                    margin-top: 60px;
                    font-size: 14px;
                    line-height: 1.6;
                ">
                    <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;">🎯</div>
                    <div style="font-weight: 500;">ノードが選択解除されました</div>
                    <div style="font-size: 12px; margin-top: 8px; opacity: 0.7;">
                        理由: ${reason}
                    </div>
                </div>
            `
        }
        
        if (this.actionsElement) {
            this.actionsElement.style.display = 'none'
        }
        
        this.currentNodeData = null
        this.unsavedChanges = false
        this.changeHistory = []
        this.updateUnsavedIndicator()
        this.updateUndoRedoButtons()
        
        this.log('Properties cleared', { reason })
    }
    
    /**
     * ⚙️ 高度モード切り替え
     */
    toggleAdvancedMode() {
        this.options.showAdvanced = !this.options.showAdvanced
        
        if (this.currentNodeData) {
            this.showNodeProperties(this.currentNodeData)
        }
        
        this.log('Advanced mode toggled', { showAdvanced: this.options.showAdvanced })
    }
    
    /**
     * 🔄 未保存インジケーター更新
     */
    updateUnsavedIndicator() {
        const indicator = this.element?.querySelector('.unsaved-indicator')
        if (indicator) {
            indicator.style.opacity = this.unsavedChanges ? '1' : '0'
        }
    }
    
    /**
     * ✅ 保存成功フィードバック
     */
    showSaveSuccess(updateCount) {
        const saveBtn = this.actionsElement?.querySelector('.save-properties-btn')
        if (!saveBtn) return
        
        const originalText = saveBtn.innerHTML
        const originalStyle = saveBtn.style.background
        
        saveBtn.innerHTML = '✅ 保存完了'
        saveBtn.style.background = 'linear-gradient(135deg, #28a745, #20c997)'
        
        setTimeout(() => {
            saveBtn.innerHTML = originalText
            saveBtn.style.background = originalStyle
        }, 2000)
    }
    
    /**
     * 🛠️ ユーティリティメソッド
     */
    
    valuesEqual(a, b) {
        if (a === b) return true
        if (typeof a !== typeof b) return false
        if (typeof a === 'object' && a !== null && b !== null) {
            return JSON.stringify(a) === JSON.stringify(b)
        }
        return false
    }
    
    escapeHtml(text) {
        const div = document.createElement('div')
        div.textContent = text
        return div.innerHTML
    }
    
    debounce(func, wait) {
        let timeout
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout)
                func(...args)
            }
            clearTimeout(timeout)
            timeout = setTimeout(later, wait)
        }
    }
    
    /**
     * 🌟 ライフサイクルフック
     */
    onShown() {
        super.onShown()
        this.focus()
    }
    
    onDestroyed() {
        super.onDestroyed()
        this.clearProperties('component-destroyed')
    }
}

// グローバル公開
window.PropertyInspectorComponent = PropertyInspectorComponent

export default PropertyInspectorComponent