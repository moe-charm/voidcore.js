// VoidFlow Constellation Zero - VoidCore統合版メインエントリーポイント
// Stage 2: メッセージ統一移行実装

import { VoidFlowEngine } from './voidflow-engine.js'
import { ExecuteEngine } from './execute-engine.js'
import { VoidCoreUI } from './voidcore-ui.js'
import { VoidFlowMessageAdapter } from './voidflow-message-adapter.js'
import { VoidFlowBootManager } from './voidflow-boot-manager.js'
import { VoidCoreConnectionManager } from './voidcore-connection-manager.js'
import { PluginFlowExecutor } from './plugin-flow-executor.js'

// グローバル変数
let voidFlowEngine = null
let executeEngine = null
let voidCoreUI = null
let messageAdapter = null
let voidFlowBootManager = null
let connectionManager = null
let flowExecutor = null

// ハイブリッドモード（従来システム + VoidCore併用）
let hybridMode = false // デバッグ用：VoidCoreオンリーモード

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    initializeVoidFlowVoidCore()
})

// VoidFlow + VoidCore 統合初期化
async function initializeVoidFlowVoidCore() {
    try {
        console.log('🌟 VoidFlow VoidCore統合版 初期化開始...')
        
        // Phase 1: VoidCoreUI初期化
        await initializeVoidCoreUI()
        
        // Phase 2: メッセージアダプター初期化  
        await initializeMessageAdapter()
        
        // Phase 3: VoidFlowBootManager初期化
        await initializeVoidFlowBootManager()
        
        // Phase 3.5: Stage 3コンポーネント初期化
        await initializeStage3Components()
        
        // Phase 4: 従来VoidFlowエンジン初期化（ハイブリッドモード）
        if (hybridMode) {
            await initializeLegacyVoidFlow()
        }
        
        // Phase 5: UI初期化
        await initializeUI()
        
        // Phase 6: 統合テスト
        await performIntegrationTest()
        
        voidCoreUI.log('🎉 VoidFlow VoidCore統合版 初期化完了！')
        voidCoreUI.log('💡 ハイブリッドモード: 従来機能 + VoidCore機能併用')
        
    } catch (error) {
        console.error('❌ VoidFlow VoidCore統合版初期化失敗:', error)
        
        // フォールバック: 従来版で初期化
        console.log('🔄 フォールバック: 従来版VoidFlowで初期化中...')
        await initializeLegacyVoidFlowFallback()
    }
}

/**
 * 🎨 Phase 1: VoidCoreUI初期化
 */
async function initializeVoidCoreUI() {
    voidCoreUI = new VoidCoreUI({
        debug: true,
        uiOptimization: true
    })
    
    // Canvas要素設定
    const canvasArea = document.querySelector('.canvas-area')
    if (canvasArea) {
        voidCoreUI.setCanvas(canvasArea)
    }
    
    // グローバル参照設定
    window.voidCoreUI = voidCoreUI
    
    voidCoreUI.log('🎨 VoidCoreUI initialized')
}

/**
 * 🔄 Phase 2: メッセージアダプター初期化
 */
async function initializeMessageAdapter() {
    messageAdapter = new VoidFlowMessageAdapter(voidCoreUI)
    
    // 互換性モード設定
    messageAdapter.setCompatibilityMode('hybrid')
    
    // グローバル参照設定
    window.messageAdapter = messageAdapter
    
    voidCoreUI.log('🔄 VoidFlowMessageAdapter initialized')
}

/**
 * 🚀 Phase 3: VoidFlowBootManager初期化
 */
async function initializeVoidFlowBootManager() {
    voidFlowBootManager = new VoidFlowBootManager()
    
    // VoidCoreUIにプラグイン登録
    // await voidCoreUI.registerPlugin(voidFlowBootManager)
    
    // グローバル参照設定
    window.voidFlowBootManager = voidFlowBootManager
    
    voidCoreUI.log('🚀 VoidFlowBootManager initialized')
}

/**
 * 🔗 Phase 3.5: Stage 3コンポーネント初期化
 */
async function initializeStage3Components() {
    // 接続マネージャー初期化
    connectionManager = new VoidCoreConnectionManager()
    await voidCoreUI.registerPlugin(connectionManager)
    
    // 手動でonActivated呼び出し（デバッグ用）
    await connectionManager.onActivated()
    
    // グローバル参照設定（FlowExecutor初期化前に）
    window.connectionManager = connectionManager
    
    // フロー実行エンジン初期化
    flowExecutor = new PluginFlowExecutor()
    await voidCoreUI.registerPlugin(flowExecutor)
    await flowExecutor.onActivated()
    
    // FlowExecutorにConnectionManagerを直接設定
    flowExecutor.connectionManager = connectionManager
    voidCoreUI.log(`🔗 FlowExecutor.connectionManager set: ${!!flowExecutor.connectionManager}`)
    
    window.flowExecutor = flowExecutor
    
    voidCoreUI.log('🔗 Stage 3 components initialized')
    voidCoreUI.log('💡 接続機能: プラグインをクリックして線で繋ぐ')
}

/**
 * 🔄 Phase 4: 従来VoidFlowエンジン初期化（ハイブリッドモード）
 */
async function initializeLegacyVoidFlow() {
    // 従来のVoidFlowエンジン
    voidFlowEngine = new VoidFlowEngine()
    executeEngine = new ExecuteEngine(voidFlowEngine)
    
    // 相互参照設定
    voidFlowEngine.executeEngine = executeEngine
    
    // VoidCoreUIとの連携設定
    voidFlowEngine.voidCoreUI = voidCoreUI
    voidFlowEngine.messageAdapter = messageAdapter
    
    // グローバル参照設定（既存互換性）
    window.voidFlowEngine = voidFlowEngine
    window.executeEngine = executeEngine
    
    voidCoreUI.log('🔄 Legacy VoidFlow engines initialized (hybrid mode)')
}

/**
 * 🎨 Phase 5: UI初期化
 */
async function initializeUI() {
    // 従来のUI初期化
    initializeNodePalette()
    initializeCanvas()
    
    // VoidCoreUI拡張機能
    initializeVoidCoreUIFeatures()
    
    // 実行ボタンの拡張
    enhanceExecuteButton()
    
    voidCoreUI.log('🎨 UI initialization completed')
}

/**
 * ✨ VoidCoreUI拡張機能初期化
 */
function initializeVoidCoreUIFeatures() {
    // VoidCoreメッセージ監視パネル追加
    addVoidCoreMessagePanel()
    
    // ハイブリッドモード切り替えボタン
    addHybridModeToggle()
    
    // アダプター統計表示
    addAdapterStatsPanel()
}

/**
 * 📊 VoidCoreメッセージ監視パネル追加
 */
function addVoidCoreMessagePanel() {
    const propertiesPanel = document.querySelector('.properties-panel')
    if (!propertiesPanel) return
    
    const messagePanel = document.createElement('div')
    messagePanel.innerHTML = `
        <div class="panel-title">📊 VoidCore Messages</div>
        <div id="voidCoreMessages" style="background: rgba(0,0,0,0.5); border-radius: 6px; padding: 10px; font-size: 10px; color: #80c0ff; max-height: 150px; overflow-y: auto; font-family: 'Monaco', monospace;">
            VoidCore統合版 - メッセージ監視開始<br>
        </div>
    `
    
    propertiesPanel.appendChild(messagePanel)
    
    // VoidCoreUIのログ要素として設定
    const messageLog = document.getElementById('voidCoreMessages')
    console.log('🔧 messageLog element:', messageLog)
    console.log('🔧 voidCoreUI available:', !!voidCoreUI)
    if (messageLog && voidCoreUI) {
        console.log('📝 Setting log element for VoidCoreUI')
        voidCoreUI.setLogElement(messageLog)
        console.log('✅ Log element set successfully')
    } else {
        console.log('❌ Failed to set log element:', { messageLog: !!messageLog, voidCoreUI: !!voidCoreUI })
    }
}

/**
 * 🔄 ハイブリッドモード切り替えボタン追加
 */
function addHybridModeToggle() {
    const header = document.querySelector('.header')
    if (!header) return
    
    const toggleButton = document.createElement('button')
    toggleButton.textContent = hybridMode ? '🔄 ハイブリッド' : '🎨 VoidCore'
    toggleButton.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: linear-gradient(145deg, #4a90e2, #357abd);
        color: white;
        border: none;
        border-radius: 6px;
        padding: 8px 12px;
        cursor: pointer;
        font-size: 12px;
        font-weight: bold;
    `
    
    toggleButton.onclick = () => {
        hybridMode = !hybridMode
        toggleButton.textContent = hybridMode ? '🔄 ハイブリッド' : '🎨 VoidCore'
        voidCoreUI.log(`🔄 Mode switched: ${hybridMode ? 'Hybrid' : 'VoidCore-only'}`)
        
        // UI更新
        updateUIForMode()
    }
    
    header.appendChild(toggleButton)
}

/**
 * 📊 アダプター統計表示パネル追加
 */
function addAdapterStatsPanel() {
    const footer = document.querySelector('.footer')
    if (!footer) return
    
    const statsSpan = document.createElement('span')
    statsSpan.id = 'adapterStats'
    statsSpan.style.marginLeft = '20px'
    statsSpan.style.fontSize = '11px'
    statsSpan.style.color = '#888'
    
    footer.appendChild(statsSpan)
    
    // 1秒ごとに統計更新
    setInterval(() => {
        if (messageAdapter) {
            const stats = messageAdapter.getAdapterStats()
            statsSpan.textContent = `📊 Flows: ${stats.activeFlows} | Messages: ${stats.totalMessages}`
        }
    }, 1000)
}

/**
 * 🚀 実行ボタン拡張
 */
function enhanceExecuteButton() {
    // VoidCore統合実行関数
    window.executeFlowVoidCore = async function() {
        try {
            voidCoreUI.log('🚀 VoidCore統合フロー実行開始...')
            
            if (hybridMode && voidFlowEngine) {
                // ハイブリッドモード: 従来 + VoidCore
                await executeFlowHybrid()
            } else {
                // VoidCoreオンリーモード
                await executeFlowVoidCoreOnly()
            }
            
        } catch (error) {
            voidCoreUI.log(`❌ VoidCore統合フロー実行失敗: ${error.message}`)
            console.error('VoidCore統合フロー実行エラー:', error)
        }
    }
    
    // 既存実行ボタンの拡張
    const executeButton = document.querySelector('.execute-button')
    if (executeButton) {
        const originalOnClick = executeButton.onclick
        executeButton.onclick = async () => {
            if (hybridMode) {
                // ハイブリッドモード: 両方実行
                await originalOnClick()
                await window.executeFlowVoidCore()
            } else {
                // VoidCoreオンリー
                await window.executeFlowVoidCore()
            }
        }
    }
}

/**
 * 🔄 ハイブリッドモード実行
 */
async function executeFlowHybrid() {
    voidCoreUI.log('🔄 ハイブリッドモード実行')
    
    // 1. 従来VoidFlowの状態を取得
    const legacyNodes = Array.from(voidFlowEngine.nodes.values())
    voidCoreUI.log(`📋 従来ノード数: ${legacyNodes.length}`)
    
    // 2. VoidCoreメッセージとして実行
    for (const node of legacyNodes) {
        if (node.type === 'button.send') {
            // VoidCore Message作成
            const executeMessage = messageAdapter.createExecutionMessage(
                node.id, 
                {},
                { triggerType: 'hybrid_mode', flowId: messageAdapter.generateFlowId() }
            )
            
            voidCoreUI.log(`📤 VoidCore実行メッセージ送信: ${node.id}`)
            
            // VoidCoreに実行要求を発行
            await voidCoreUI.publish(executeMessage)
        }
    }
}

/**
 * 🎨 VoidCoreオンリーモード実行
 */
async function executeFlowVoidCoreOnly() {
    voidCoreUI.log('🎨 VoidCoreオンリーモード実行')
    
    // VoidCoreUIから直接プラグイン実行
    const uiState = voidCoreUI.getUIState()
    voidCoreUI.log(`📊 UI要素数: ${uiState.elementCount}`)
    
    if (uiState.elementCount === 0) {
        voidCoreUI.log('⚠️ VoidCore UI要素が見つかりません')
        voidCoreUI.log('💡 ヒント: VoidCoreモードではVoidCoreUI要素が必要です')
        return
    }
    
    // TODO: VoidCoreプラグイン実行ロジック実装
    voidCoreUI.log('🔧 VoidCoreプラグイン実行機能は実装中です')
}

/**
 * 🔄 モード変更時のUI更新
 */
function updateUIForMode() {
    const zenMessage = document.getElementById('zenMessage')
    if (zenMessage) {
        if (hybridMode) {
            zenMessage.innerHTML = `
                <div class="zen-title">🔄 ハイブリッド宇宙で星座を描く</div>
                <div class="zen-subtitle">従来VoidFlow + VoidCore統合モード</div>
            `
        } else {
            zenMessage.innerHTML = `
                <div class="zen-title">🎨 VoidCore純粋宇宙で星座を描く</div>
                <div class="zen-subtitle">完全VoidCoreメッセージシステム</div>
            `
        }
    }
}

/**
 * 🧪 Phase 6: 統合テスト
 */
async function performIntegrationTest() {
    voidCoreUI.log('🧪 統合テスト実行中...')
    
    // Test 1: VoidCoreUI基本機能
    const uiTest = voidCoreUI.getUIState()
    voidCoreUI.log(`✅ VoidCoreUI: Canvas=${!!uiTest.canvasAttached}`)
    
    // Test 2: メッセージアダプター
    const adapterTest = messageAdapter.getAdapterStats()
    voidCoreUI.log(`✅ MessageAdapter: Version=${adapterTest.adapterVersion}`)
    
    // Test 3: ハイブリッドモード
    if (hybridMode && voidFlowEngine) {
        voidCoreUI.log(`✅ Hybrid: Legacy engine available`)
    }
    
    voidCoreUI.log('🎉 統合テスト完了！')
}

/**
 * 🔄 フォールバック: 従来版初期化
 */
async function initializeLegacyVoidFlowFallback() {
    try {
        // 従来のmain.jsと同じ初期化
        voidFlowEngine = new VoidFlowEngine()
        executeEngine = new ExecuteEngine(voidFlowEngine)
        voidFlowEngine.executeEngine = executeEngine
        
        window.voidFlowEngine = voidFlowEngine
        window.executeEngine = executeEngine
        
        initializeNodePalette()
        initializeCanvas()
        
        voidFlowEngine.log('🔄 フォールバック初期化完了（従来版）')
        
    } catch (error) {
        console.error('❌ フォールバック初期化も失敗:', error)
    }
}

// 従来のUI初期化関数（既存コードから移植）
// ノードパレット初期化
function initializeNodePalette() {
    const nodeItems = document.querySelectorAll('.node-item')
    
    nodeItems.forEach(item => {
        // ドラッグ機能
        item.addEventListener('dragstart', (e) => {
            const nodeType = item.getAttribute('data-node-type')
            e.dataTransfer.setData('text/plain', nodeType)
            
            if (voidCoreUI) {
                voidCoreUI.log(`📦 ドラッグ開始: ${nodeType}`)
            } else if (voidFlowEngine) {
                voidFlowEngine.log(`📦 ドラッグ開始: ${nodeType}`)
            }
        })
        
        // クリック機能
        item.addEventListener('click', async (e) => {
            const nodeType = item.getAttribute('data-node-type')
            const position = {
                x: Math.random() * 400 + 100,
                y: Math.random() * 300 + 100
            }
            
            console.log(`🎯 ノードパレットクリック: ${nodeType}`)
            console.log(`📍 Position:`, position)
            
            // VoidCoreプラグインのみ作成（接続テスト用）
            console.log(`🚀 createVoidCoreNode呼び出し開始`)
            console.log(`🔍 createVoidCoreNode function:`, typeof createVoidCoreNode)
            
            try {
                const result = await createVoidCoreNode(nodeType, position)
                console.log(`✅ createVoidCoreNode完了:`, result)
            } catch (error) {
                console.error(`❌ createVoidCoreNodeエラー:`, error)
            }
        })
        
        item.setAttribute('draggable', true)
    })
}

// キャンバス初期化
function initializeCanvas() {
    const canvasArea = document.querySelector('.canvas-area')
    
    canvasArea.addEventListener('dragover', (e) => {
        e.preventDefault()
    })
    
    canvasArea.addEventListener('drop', (e) => {
        e.preventDefault()
        
        const nodeType = e.dataTransfer.getData('text/plain')
        const rect = canvasArea.getBoundingClientRect()
        const position = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        }
        
        // VoidCoreプラグインのみ作成（接続テスト用）
        console.log(`🎯 ドラッグ&ドロップ: ${nodeType}`)
        createVoidCoreNode(nodeType, position).catch(error => {
            console.error(`❌ ドラッグ&ドロップ createVoidCoreNode失敗:`, error)
        })
    })
}

// VoidCoreノード作成
async function createVoidCoreNode(nodeType, position) {
    try {
        console.log(`🌟 VoidCoreノード作成開始: ${nodeType}`)
        console.log(`🔍 VoidCoreUI debug info:`, {
            debugMode: voidCoreUI.debugMode,
            logElement: !!voidCoreUI.logElement
        })
        
        // 手動テスト: voidCoreUI.log() が動作するかテスト
        console.log('🧪 Manual voidCoreUI.log test...')
        voidCoreUI.log(`🧪 Manual test message: ${Date.now()}`)
        console.log('🧪 Manual test completed')
        
        voidCoreUI.log(`🌟 VoidCoreノード作成開始: ${nodeType}`)
        
        if (!voidCoreUI) {
            throw new Error('VoidCoreUI not initialized')
        }
        
        // プラグインID生成
        const pluginId = `${nodeType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        voidCoreUI.log(`🆔 プラグインID生成: ${pluginId}`)
        
        // プラグイン要素作成
        voidCoreUI.log(`🎨 プラグイン要素作成中...`)
        const pluginElement = createVoidCorePluginElement(nodeType, pluginId, position)
        document.querySelector('.canvas-area').appendChild(pluginElement)
        voidCoreUI.log(`✅ プラグイン要素作成・配置完了`)
        
        // VoidCoreプラグインとして登録
        voidCoreUI.log(`📝 プラグイン登録開始...`)
        await registerVoidCorePlugin(nodeType, pluginId, pluginElement)
        voidCoreUI.log(`✅ プラグイン登録処理完了`)
        
        // 登録確認テスト
        const registeredPlugin = voidCoreUI.getPlugin(pluginId)
        voidCoreUI.log(`🔍 Plugin registration check: ${pluginId} → ${!!registeredPlugin}`)
        
        voidCoreUI.log(`✨ VoidCoreノード作成: ${nodeType} (${pluginId})`)
        
        // Zenメッセージを隠す
        const zenMessage = document.getElementById('zenMessage')
        if (zenMessage) {
            zenMessage.style.display = 'none'
        }
        
        return pluginId
        
    } catch (error) {
        if (voidCoreUI) {
            voidCoreUI.log(`❌ VoidCoreノード作成失敗: ${error.message}`)
        }
        console.error('VoidCoreノード作成エラー:', error)
    }
}

// ノードタイプ定義（旧VoidFlow互換）
function getNodeDefinition(nodeType) {
    const definitions = {
        'button.send': {
            inputs: [],
            outputs: [{ name: 'trigger', type: 'event' }]
        },
        'input.text': {
            inputs: [],
            outputs: [{ name: 'text', type: 'string' }]
        },
        'string.uppercase': {
            inputs: [{ name: 'text', type: 'string' }],
            outputs: [{ name: 'result', type: 'string' }]
        },
        'output.console': {
            inputs: [{ name: 'data', type: 'any' }],
            outputs: []
        },
        'web.fetch': {
            inputs: [{ name: 'url', type: 'string' }],
            outputs: [{ name: 'response', type: 'object' }]
        },
        'json.parser': {
            inputs: [{ name: 'json', type: 'string' }],
            outputs: [{ name: 'data', type: 'object' }]
        },
        'ui.card': {
            inputs: [{ name: 'data', type: 'object' }],
            outputs: []
        }
    }
    
    return definitions[nodeType] || { inputs: [], outputs: [] }
}

// VoidCoreプラグイン要素作成
function createVoidCorePluginElement(nodeType, pluginId, position) {
    const element = document.createElement('div')
    element.className = 'voidcore-ui-element waiting'
    element.id = `voidcore-plugin-${pluginId}`
    element.dataset.pluginId = pluginId
    element.dataset.nodeType = nodeType
    element.style.left = `${position.x}px`
    element.style.top = `${position.y}px`
    element.style.position = 'absolute'
    
    // デバッグ: 要素作成確認
    console.log(`🔧 VoidCore element created: ${pluginId}`, element)
    console.log(`🔧 data-plugin-id: ${element.dataset.pluginId}`)
    
    // ノードタイプに応じた表示
    const titles = {
        'button.send': '🚀 Button: Send',
        'input.text': '📝 Input: Text',
        'string.uppercase': '🔤 String: UpperCase',
        'output.console': '📊 Output: Console',
        'web.fetch': '🌐 Web: Fetch API',
        'json.parser': '🔧 JSON: Parser',
        'ui.card': '🎨 UI: Simple Card'
    }
    
    const title = titles[nodeType] || nodeType
    
    // ノードタイプに応じたinput/output定義（旧VoidFlow互換）
    const nodeDefinitions = getNodeDefinition(nodeType)
    
    element.innerHTML = `
        <div class="node-title">${title}</div>
        <div class="node-content">
            ${createVoidCoreNodeContent(nodeType, pluginId)}
        </div>
        <div class="node-output" id="voidcore-output-${pluginId}">VoidCore待機中...</div>
        ${nodeDefinitions.inputs.length > 0 ? '<div class="connection-port input-port" title="入力ポート"></div>' : ''}
        ${nodeDefinitions.outputs.length > 0 ? '<div class="connection-port output-port" title="出力ポート"></div>' : ''}
    `
    
    // ドラッグ機能追加
    makeVoidCorePluginDraggable(element)
    
    return element
}

// VoidCoreノード固有コンテンツ作成
function createVoidCoreNodeContent(nodeType, pluginId) {
    switch (nodeType) {
        case 'button.send':
            return `
                <button class="execute-button" onclick="event.stopPropagation(); console.log('🔴 Button clicked:', '${pluginId}'); executeVoidCorePlugin('${pluginId}')" 
                        style="margin: 10px 0; padding: 10px; font-size: 14px; width: 100%;">
                    🚀 VoidCore実行
                </button>
            `
        case 'input.text':
            return `<input type="text" class="node-input" value="VoidCore Hello!" 
                    onchange="updateVoidCoreProperty('${pluginId}', 'text', this.value)" 
                    onclick="event.stopPropagation()"
                    placeholder="VoidCoreテキスト">`
        case 'string.uppercase':
            return `<div style="color: #4a90e2; font-size: 11px;">VoidCore文字列変換</div>`
        case 'output.console':
            return `<div style="color: #00ff88; font-size: 11px;">VoidCore出力</div>`
        default:
            return '<div style="color: #888; font-size: 10px;">VoidCoreプラグイン</div>'
    }
}

// VoidCoreプラグイン登録
async function registerVoidCorePlugin(nodeType, pluginId, element) {
    try {
        voidCoreUI.log(`🔄 プラグイン登録開始: ${nodeType} (${pluginId})`)
        
        // プラグインタイプに応じたVoidCoreプラグインクラス選択
        let PluginClass = null
        
        switch (nodeType) {
            case 'input.text':
                // Input Text専用プラグイン
                const { VoidFlowNodePlugin: InputBasePlugin } = await import('./voidflow-node-plugin.js')
                PluginClass = class extends InputBasePlugin {
                    constructor() {
                        super(nodeType, { id: pluginId })
                    }
                    
                    async executeNode(input) {
                        // プラグイン要素からテキスト値を取得
                        const element = document.querySelector(`[data-plugin-id="${this.id}"]`)
                        const textInput = element?.querySelector('.node-input')
                        const textValue = textInput?.value || 'VoidCore Hello!'
                        
                        voidCoreUI.log(`📝 Input Text実行: "${textValue}"`)
                        
                        return {
                            type: 'text',
                            value: textValue,
                            nodeType: nodeType,
                            nodeId: this.id
                        }
                    }
                }
                break
                
            case 'string.uppercase':
                // StringUppercasePluginを動的インポート
                const { StringUppercasePlugin } = await import('./nodes/string-uppercase-plugin.js')
                PluginClass = StringUppercasePlugin
                break
                
            case 'output.console':
                // Output Console専用プラグイン
                const { VoidFlowNodePlugin: OutputBasePlugin } = await import('./voidflow-node-plugin.js')
                PluginClass = class extends OutputBasePlugin {
                    constructor() {
                        super(nodeType, { id: pluginId })
                    }
                    
                    async executeNode(input) {
                        const inputValue = input?.value || input || '(空のデータ)'
                        console.log(`📊 Console Output:`, inputValue)
                        voidCoreUI.log(`📊 Console出力: ${inputValue}`)
                        
                        return {
                            type: 'output',
                            value: `出力完了: ${inputValue}`,
                            nodeType: nodeType,
                            nodeId: this.id
                        }
                    }
                }
                break
                
            case 'button.send':
                // Button Send専用プラグイン
                const { VoidFlowNodePlugin: ButtonBasePlugin } = await import('./voidflow-node-plugin.js')
                PluginClass = class extends ButtonBasePlugin {
                    constructor() {
                        super(nodeType, { id: pluginId })
                    }
                    
                    async executeNode(input) {
                        voidCoreUI.log(`🚀 Button Send実行開始`)
                        
                        const result = {
                            type: 'trigger',
                            value: 'button_triggered',
                            trigger: true,
                            nodeType: nodeType,
                            nodeId: this.id,
                            timestamp: Date.now()
                        }
                        
                        voidCoreUI.log(`🚀 Button Send結果:`, result)
                        voidCoreUI.log(`🚀 Button Send完了 - データフロー開始予定`)
                        
                        return result
                    }
                }
                break
                
            default:
                // 基本VoidFlowNodePlugin
                const { VoidFlowNodePlugin } = await import('./voidflow-node-plugin.js')
                PluginClass = class extends VoidFlowNodePlugin {
                    constructor() {
                        super(nodeType, { id: pluginId })
                    }
                    
                    async executeNode(input) {
                        voidCoreUI.log(`🔧 基本プラグイン実行: ${nodeType}`)
                        
                        return {
                            type: 'basic',
                            value: `VoidCore: ${nodeType} executed`,
                            input: input,
                            nodeType: nodeType,
                            nodeId: this.id
                        }
                    }
                }
        }
        
        // プラグインインスタンス作成
        voidCoreUI.log(`🔧 プラグインインスタンス作成中: ${PluginClass.name}`)
        const plugin = new PluginClass({ id: pluginId })
        voidCoreUI.log(`✅ プラグインインスタンス作成完了: ${plugin.id}`)
        
        // 要素に関連付け
        element._voidCorePlugin = plugin
        voidCoreUI.log(`🔗 要素とプラグインの関連付け完了`)
        
        // VoidCoreUIに登録
        voidCoreUI.log(`📝 VoidCoreUIへの登録開始`)
        await voidCoreUI.registerPlugin(plugin)
        voidCoreUI.log(`✅ VoidCoreUIへの登録完了`)
        
        voidCoreUI.log(`📦 VoidCoreプラグイン登録: ${nodeType} (${pluginId})`)
        
    } catch (error) {
        voidCoreUI.log(`❌ VoidCoreプラグイン登録失敗: ${error.message}`)
        console.error('VoidCoreプラグイン登録エラー:', error)
    }
}

// VoidCoreプラグインドラッグ機能
function makeVoidCorePluginDraggable(element) {
    let isDragging = false
    let dragStartX, dragStartY
    
    element.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('node-input') || 
            e.target.classList.contains('execute-button') ||
            e.target.classList.contains('connection-port')) return
        
        isDragging = true
        dragStartX = e.clientX - element.offsetLeft
        dragStartY = e.clientY - element.offsetTop
        
        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
        
        e.preventDefault()
    })
    
    function onMouseMove(e) {
        if (!isDragging) return
        
        const newX = e.clientX - dragStartX
        const newY = e.clientY - dragStartY
        
        element.style.left = `${newX}px`
        element.style.top = `${newY}px`
        
        // 接続線の更新（今後実装予定）
        // TODO: 接続線の動的更新機能
        // if (connectionManager) {
        //     connectionManager.updateConnectionLines(element.dataset.pluginId)
        // }
    }
    
    function onMouseUp() {
        isDragging = false
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
    }
}

// 従来ノード作成（ハイブリッドモード用）
function createNodeOnCanvas(nodeType, position) {
    try {
        const node = voidFlowEngine.createNode(nodeType, position)
        const nodeElement = createNodeElement(node)
        
        document.querySelector('.canvas-area').appendChild(nodeElement)
        
        // Zenメッセージを隠す
        const zenMessage = document.getElementById('zenMessage')
        if (zenMessage) {
            zenMessage.style.display = 'none'
        }
        
        if (voidCoreUI) {
            voidCoreUI.log(`✨ 従来ノード作成: ${nodeType} at (${position.x}, ${position.y})`)
        } else {
            voidFlowEngine.log(`✨ ノード作成: ${nodeType} at (${position.x}, ${position.y})`)
        }
        
    } catch (error) {
        if (voidCoreUI) {
            voidCoreUI.log(`❌ 従来ノード作成失敗: ${error.message}`)
        } else {
            voidFlowEngine.log(`❌ ノード作成失敗: ${error.message}`)
        }
    }
}

// デバッグ用グローバル関数
window.getVoidCoreDebugInfo = function() {
    return {
        voidCoreUI: voidCoreUI ? voidCoreUI.getUIState() : null,
        messageAdapter: messageAdapter ? messageAdapter.getDebugInfo() : null,
        hybridMode: hybridMode,
        hasLegacyEngine: !!voidFlowEngine
    }
}

// 従来機能の移植: createNodeElement関数とその他の必要な関数

// ノード要素作成
function createNodeElement(node) {
    const nodeDiv = document.createElement('div')
    nodeDiv.className = 'voidflow-node waiting'
    nodeDiv.id = `voidflow-node-${node.id}`
    nodeDiv.style.left = `${node.position.x}px`
    nodeDiv.style.top = `${node.position.y}px`
    
    // ノードタイプに応じたタイトル
    const titles = {
        'button.send': 'Button: Send',
        'input.text': 'Input: Text',
        'string.uppercase': 'String: UpperCase',
        'output.console': 'Output: Console',
        'web.fetch': 'Web: Fetch API',
        'json.parser': 'JSON: Parser',
        'ui.card': 'UI: Simple Card',
        'core.plugin-lister': 'Core: Plugin Lister',
        'core.connection-manager': 'Core: Connection Manager',
        'flow.connector': 'Flow: Connector'
    }
    
    const title = titles[node.type] || node.type
    
    nodeDiv.innerHTML = `
        <div class="node-title">${title}</div>
        <div class="node-content">
            ${createNodeContent(node)}
        </div>
        <div class="node-output" id="node-output-${node.id}">待機中...</div>
        ${node.inputs.length > 0 ? '<div class="connection-port input-port"></div>' : ''}
        ${node.outputs.length > 0 ? '<div class="connection-port output-port"></div>' : ''}
    `
    
    // ドラッグ機能追加
    makeNodeDraggable(nodeDiv)
    
    // クリック選択機能
    nodeDiv.addEventListener('click', (e) => {
        if (!e.target.classList.contains('connection-port')) {
            selectNode(node.id)
            
            // ハイブリッドモード: VoidCore統合処理も実行
            if (voidCoreUI) {
                voidCoreUI.log(`🎯 ノード選択: ${node.type} (${node.id})`)
            }
        }
    })
    
    return nodeDiv
}

// ノード固有のコンテンツ作成
function createNodeContent(node) {
    switch (node.type) {
        case 'button.send':
            return `
                <button class="execute-button" onclick="startFromNode('${node.id}')" 
                        style="margin: 10px 0; padding: 15px; font-size: 16px; width: 100%;">
                    🚀 Send Signal
                </button>
            `
        case 'input.text':
            return `<input type="text" class="node-input" value="Hello VoidFlow!" 
                    onchange="updateNodeProperty('${node.id}', 'text', this.value)">`
        case 'web.fetch':
            return `<input type="text" class="node-input" value="https://httpbin.org/json" 
                    onchange="updateNodeProperty('${node.id}', 'url', this.value)" 
                    placeholder="URL">`
        case 'json.parser':
            return `<input type="text" class="node-input" value="" 
                    onchange="updateNodeProperty('${node.id}', 'path', this.value)" 
                    placeholder="JSONパス (例: data.title)">`
        case 'ui.card':
            return `<input type="text" class="node-input" value="VoidFlow Card" 
                    onchange="updateNodeProperty('${node.id}', 'title', this.value)" 
                    placeholder="カードタイトル">`
        default:
            return '<div style="color: #888; font-size: 10px;">設定不要</div>'
    }
}

// ノードドラッグ機能
function makeNodeDraggable(nodeElement) {
    let isDragging = false
    let dragStartX, dragStartY
    
    nodeElement.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('node-input')) return
        
        isDragging = true
        dragStartX = e.clientX - nodeElement.offsetLeft
        dragStartY = e.clientY - nodeElement.offsetTop
        
        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
        
        e.preventDefault()
    })
    
    function onMouseMove(e) {
        if (!isDragging) return
        
        const newX = e.clientX - dragStartX
        const newY = e.clientY - dragStartY
        
        nodeElement.style.left = `${newX}px`
        nodeElement.style.top = `${newY}px`
        
        // VoidFlowEngineのノード位置も更新
        const nodeId = nodeElement.id.replace('voidflow-node-', '')
        if (voidFlowEngine && voidFlowEngine.nodes) {
            const node = voidFlowEngine.nodes.get(nodeId)
            if (node) {
                node.position.x = newX
                node.position.y = newY
            }
        }
        
        // VoidCoreUIにも位置更新通知
        if (voidCoreUI && voidCoreUI.uiChannel) {
            voidCoreUI.uiChannel.updatePosition.update({
                elementId: nodeId,
                x: newX,
                y: newY
            })
        }
    }
    
    function onMouseUp() {
        isDragging = false
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
    }
}

// ノード選択
function selectNode(nodeId) {
    // 既存の選択を解除
    document.querySelectorAll('.voidflow-node').forEach(node => {
        node.classList.remove('selected')
    })
    
    // 新しいノードを選択
    const nodeElement = document.getElementById(`voidflow-node-${nodeId}`)
    if (nodeElement) {
        nodeElement.classList.add('selected')
        if (voidFlowEngine) {
            voidFlowEngine.selectedNode = nodeId
        }
        
        // プロパティパネル更新
        updatePropertiesPanel(nodeId)
    }
}

// プロパティパネル更新
function updatePropertiesPanel(nodeId) {
    if (!voidFlowEngine || !voidFlowEngine.nodes) return
    
    const node = voidFlowEngine.nodes.get(nodeId)
    if (!node) return
    
    const propertiesContent = document.getElementById('propertiesContent')
    propertiesContent.innerHTML = `
        <div style="margin-bottom: 10px;">
            <strong>ノードID:</strong> ${node.id}<br>
            <strong>タイプ:</strong> ${node.type}<br>
            <strong>位置:</strong> (${Math.round(node.position.x)}, ${Math.round(node.position.y)})
        </div>
        ${createNodePropertyEditor(node)}
    `
}

// ノードプロパティエディター作成
function createNodePropertyEditor(node) {
    switch (node.type) {
        case 'input.text':
            return `
                <label>テキスト:</label>
                <input type="text" class="node-input" value="${node.properties.text || 'Hello VoidFlow!'}" 
                       onchange="updateNodeProperty('${node.id}', 'text', this.value)">
            `
        case 'web.fetch':
            return `
                <label>URL:</label>
                <input type="text" class="node-input" value="${node.properties.url || 'https://httpbin.org/json'}" 
                       onchange="updateNodeProperty('${node.id}', 'url', this.value)">
            `
        case 'json.parser':
            return `
                <label>JSONパス:</label>
                <input type="text" class="node-input" value="${node.properties.path || ''}" 
                       onchange="updateNodeProperty('${node.id}', 'path', this.value)" 
                       placeholder="例: data.title">
            `
        case 'ui.card':
            return `
                <label>カードタイトル:</label>
                <input type="text" class="node-input" value="${node.properties.title || 'VoidFlow Card'}" 
                       onchange="updateNodeProperty('${node.id}', 'title', this.value)">
            `
        default:
            return '<p style="color: #888;">このノードには設定可能なプロパティがありません。</p>'
    }
}

// ノードプロパティ更新
window.updateNodeProperty = function(nodeId, propertyName, value) {
    if (voidFlowEngine && voidFlowEngine.nodes) {
        const node = voidFlowEngine.nodes.get(nodeId)
        if (node) {
            node.properties[propertyName] = value
            
            // 統合ログ
            if (voidCoreUI) {
                voidCoreUI.log(`⚙️ プロパティ更新: ${nodeId}.${propertyName} = "${value}"`)
            } else {
                voidFlowEngine.log(`⚙️ プロパティ更新: ${nodeId}.${propertyName} = "${value}"`)
            }
        }
    }
}

// 特定ノードから実行開始
window.startFromNode = async function(nodeId) {
    try {
        if (voidCoreUI) {
            voidCoreUI.log(`🎯 手動開始: ${nodeId}`)
        }
        
        if (hybridMode && executeEngine && executeEngine.executeNode) {
            await executeEngine.executeNode(nodeId)
        } else if (voidFlowEngine && voidFlowEngine.executeEngine) {
            await voidFlowEngine.executeEngine.executeNode(nodeId)
        } else {
            throw new Error('ExecuteEngine が見つかりません')
        }
        
        if (voidCoreUI) {
            voidCoreUI.log('✨ 実行完了!')
        }
        
    } catch (error) {
        const message = `❌ ノード実行失敗: ${error.message}`
        if (voidCoreUI) {
            voidCoreUI.log(message)
        } else {
            console.error(message, error)
        }
    }
}

// VoidCoreプラグイン実行
window.executeVoidCorePlugin = async function(pluginId) {
    console.log(`🎯🎯🎯 executeVoidCorePlugin 呼び出し確認: ${pluginId}`)
    voidCoreUI.log(`🎯🎯🎯 executeVoidCorePlugin 呼び出し確認: ${pluginId}`)
    
    try {
        const actualFlowExecutor = window.flowExecutor || flowExecutor
        
        if (!actualFlowExecutor) {
            throw new Error('FlowExecutor not initialized')
        }
        
        voidCoreUI.log(`🔧 Using flowExecutor: global=${!!window.flowExecutor}, local=${!!flowExecutor}`)
        voidCoreUI.log(`🔧 Actual executor:`, actualFlowExecutor?.constructor?.name)
        
        // ConnectionManager参照を再確認・設定
        if (!actualFlowExecutor.connectionManager && window.connectionManager) {
            actualFlowExecutor.connectionManager = window.connectionManager
            voidCoreUI.log(`🔗 ConnectionManager re-linked to FlowExecutor`)
        }
        
        voidCoreUI.log(`🎯 VoidCoreプラグイン実行: ${pluginId}`)
        voidCoreUI.log(`🔗 FlowExecutor.connectionManager: ${!!actualFlowExecutor.connectionManager}`)
        
        // プラグイン要素のUI更新
        const element = document.querySelector(`[data-plugin-id="${pluginId}"]`)
        if (element) {
            element.classList.remove('waiting', 'success', 'error')
            element.classList.add('executing')
            
            const output = element.querySelector('.node-output')
            if (output) {
                output.textContent = '⏳ VoidCore実行中...'
            }
        }
        
        voidCoreUI.log(`🔧 FlowExecutor.executePlugin 呼び出し開始`)
        voidCoreUI.log(`🔧 flowExecutor:`, !!actualFlowExecutor)
        voidCoreUI.log(`🔧 flowExecutor.executePlugin:`, typeof actualFlowExecutor?.executePlugin)
        voidCoreUI.log(`🔧 flowExecutor constructor:`, actualFlowExecutor?.constructor?.name)
        
        // FlowExecutorで実行
        voidCoreUI.log(`🔧 flowExecutor.executePlugin 実際の呼び出し`)
        
        const executePromise = actualFlowExecutor.executePlugin({
            pluginId: pluginId,
            input: getVoidCorePluginInput(pluginId),
            options: { 
                triggerType: 'manual',
                voidCoreMode: true 
            }
        })
        
        voidCoreUI.log(`🔧 executePromise:`, executePromise)
        voidCoreUI.log(`🔧 Promise type:`, typeof executePromise)
        voidCoreUI.log(`🔧 Is Promise:`, executePromise instanceof Promise)
        
        const result = await executePromise
        
        voidCoreUI.log(`🔧 flowExecutor.executePlugin 完了, result:`, result)
        voidCoreUI.log(`✅ VoidCoreプラグイン実行完了: ${pluginId}`)
        
        return result
        
    } catch (error) {
        console.error(`🔴 ERROR in executeVoidCorePlugin:`, error)
        voidCoreUI.log(`🔴 ERROR DETAILS: ${error.message}`)
        voidCoreUI.log(`🔴 ERROR STACK: ${error.stack}`)
        voidCoreUI.log(`❌ VoidCoreプラグイン実行失敗: ${pluginId} - ${error.message}`)
        console.error('VoidCoreプラグイン実行エラー:', error)
    }
}

// VoidCoreプラグイン入力データ取得
function getVoidCorePluginInput(pluginId) {
    const element = document.querySelector(`[data-plugin-id="${pluginId}"]`)
    if (!element) return {}
    
    const nodeType = element.dataset.nodeType
    const inputElement = element.querySelector('.node-input')
    
    switch (nodeType) {
        case 'input.text':
            return { text: inputElement ? inputElement.value : 'VoidCore Hello!' }
        case 'string.uppercase':
            return { text: 'voidcore test' } // デフォルト値
        default:
            return { value: `VoidCore ${nodeType} input` }
    }
}

// VoidCoreプラグインプロパティ更新
window.updateVoidCoreProperty = function(pluginId, propertyName, value) {
    const element = document.querySelector(`[data-plugin-id="${pluginId}"]`)
    if (!element || !element._voidCorePlugin) return
    
    const plugin = element._voidCorePlugin
    if (plugin.properties) {
        plugin.properties[propertyName] = value
        voidCoreUI.log(`⚙️ VoidCoreプロパティ更新: ${pluginId}.${propertyName} = "${value}"`)
    }
}

// 従来のフロー実行（executeFlow）
window.executeFlow = async function() {
    try {
        if (!voidFlowEngine || !executeEngine) {
            throw new Error('VoidFlowエンジンが初期化されていません')
        }
        
        const logger = voidCoreUI || voidFlowEngine
        logger.log('🚀 従来フロー実行開始...')
        
        // Button.sendノードを探して実行
        const allNodes = Array.from(voidFlowEngine.nodes.values())
        const buttonNodes = allNodes.filter(node => node.type === 'button.send')
        
        if (buttonNodes.length === 0) {
            logger.log('⚠️ Button.sendノードが見つかりません')
            return
        }
        
        // 最初のButtonノードから実行開始
        const startNode = buttonNodes[0]
        logger.log(`🎯 実行開始ノード: ${startNode.id}`)
        
        await executeEngine.executeNode(startNode.id)
        logger.log('✅ 従来フロー実行完了')
        
    } catch (error) {
        const message = `❌ 従来フロー実行失敗: ${error.message}`
        if (voidCoreUI) {
            voidCoreUI.log(message)
        } else {
            console.error(message, error)
        }
    }
}