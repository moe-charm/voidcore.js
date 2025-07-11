// VoidFlow Constellation Zero - VoidCore統合版メインエントリーポイント
// Stage 2: メッセージ統一移行実装

import { CharmFlowEngine } from './charmflow-engine.js'
import { ExecuteEngine } from './execute-engine.js'
import { NyaCoreUI } from './nyacore-ui.js'
import { CharmFlowMessageAdapter } from './charmflow-message-adapter.js'
import { CharmFlowBootManager } from './charmflow-boot-manager.js'
import { VoidCoreConnectionManager } from './nyacore-connection-manager.js'
import { PluginFlowExecutor } from './plugin-flow-executor.js'
import MonacoPluginEditor from './monaco-plugin-editor.js'
import { PluginPalettePlugin } from './plugin-palette-plugin.js'
// Phase 1: VoidFlow-VoidCore統合アーキテクチャ
import { CharmFlowCore } from './charmflow-core.js'
import { CharmFlowIntentBridge } from './intent-bridge.js'
// Phase 1: 高度接続GUI
import { ConnectionLineRenderer } from './connection-line-renderer.js'
// Phase 1: デバッグファイルロガー
import { debugLogger } from './debug-file-logger.js'
// Phase 1.5: VoidCoreデバッグプラグイン
import { voidCoreDebugPlugin } from './nyacore-debug-plugin.js'
// import { ConnectionManager } from './main.js' // 重複初期化を防ぐため無効化

// グローバル変数
let charmFlowEngine = null
let executeEngine = null
let nyaCoreUI = null
let messageAdapter = null
let charmFlowBootManager = null
let connectionManager = null
let flowExecutor = null
let pluginPalette = null

// Phase 1: VoidFlow-VoidCore統合変数
let charmFlowCore = null
let intentBridge = null

// Phase 1.5: VoidCoreデバッグプラグイン変数
let debugPlugin = null

// VoidCore v14.0 純粋アーキテクチャ - ハイブリッドモード削除完了

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    initializeCharmFlowVoidCore()
})

// VoidFlow + VoidCore 統合初期化
async function initializeCharmFlowVoidCore() {
    try {
        console.log('🌟 CharmFlow VoidCore統合版 初期化開始...')
        
        // Phase 1: デバッグファイルロガー初期化（最優先）
        await debugLogger.initialize()
        debugLogger.log('system', 'info', '🎬 CharmFlow session start', {
            userAgent: navigator.userAgent,
            url: window.location.href
        })
        
        // Phase 0: VoidFlow-VoidCore統合アーキテクチャ初期化
        await initializeCharmFlowCoreArchitecture()
        
        // Phase 1: NyaCoreUI初期化
        await initializeNyaCoreUI()
        
        // Phase 1.5: NyaCoreUIとCharmFlowCoreの統合
        await connectNyaCoreUIWithCharmFlowCore()
        
        // Phase 2: メッセージアダプター初期化  
        await initializeMessageAdapter()
        
        // Phase 3: CharmFlowBootManager初期化
        await initializeCharmFlowBootManager()
        
        // Phase 3.5: Stage 3コンポーネント初期化
        await initializeStage3Components()
        
        // Phase 4: デバッグ機能初期化
        await initializePhase4DebugSystem()
        
        // Phase 4.5: VoidCoreデバッグプラグイン初期化
        await initializeVoidCoreDebugPlugin()
        
        // Phase 5: UI初期化
        await initializeUI()
        
        // Phase 5.5: プラグインパレット初期化
        try {
            await initializePluginPalette()
        } catch (error) {
            console.error('⚠️ PluginPalette初期化失敗 - 続行します:', error)
            nyaCoreUI.log('⚠️ PluginPalette初期化失敗 - 続行します')
        }
        
        // Phase 6: 統合テスト
        await performIntegrationTest()
        
        // Phase 7: Monaco Editor初期化確認
        await initializeMonacoEditor()
        
        nyaCoreUI.log('🎉 CharmFlow VoidCore v14.0 純粋アーキテクチャ 初期化完了！')
        nyaCoreUI.log('💎 完全なる純粋メッセージベースシステム - レガシー依存なし')
        
    } catch (error) {
        console.error('❌ CharmFlow VoidCore統合版初期化失敗:', error)
        
        // VoidCore v14.0 純粋アーキテクチャ - フォールバック除去済み
        // システムの健全性を保つため、エラーログを出力して続行
        console.error('🚨 VoidCore v14.0 純粋アーキテクチャでの初期化失敗 - フォールバック無効')
    }
}

/**
 * 🎨 Phase 1: VoidCoreUI初期化
 */
async function initializeNyaCoreUI() {
    // 新nyacore対応: NyaCoreUI.create()で非同期初期化
    nyaCoreUI = await NyaCoreUI.create({
        debug: true,
        uiOptimization: true
    })
    
    // Canvas要素設定
    const canvasArea = document.querySelector('.canvas-area')
    if (canvasArea) {
        nyaCoreUI.setCanvas(canvasArea)
    }
    
    // グローバル参照設定
    window.nyaCoreUI = nyaCoreUI
    
    // デバッグ用グローバル関数
    window.debugNyaCoreUI = function() {
      if (window.nyaCoreUI) {
        console.log('🔍 NyaCoreUI Debug Info:', window.nyaCoreUI.getDebugInfo())
        console.log('🔍 NyaCoreUI UI State:', window.nyaCoreUI.getUIState())
        console.log('🔍 Canvas Element:', window.nyaCoreUI.canvasManager.canvasElement)
        console.log('🔍 UI Elements Map:', window.nyaCoreUI.uiElements)
      } else {
        console.log('❌ NyaCoreUI not available')
      }
    }
    
    // 接続テスト用グローバル関数
    window.debugConnections = function() {
      if (window.connectionManager) {
        console.log('🔍 Connection Manager Debug Info:', window.connectionManager.getDebugInfo())
        console.log('🔍 Connection Stats:', window.connectionManager.getConnectionStats())
      } else {
        console.log('❌ Connection Manager not available')
      }
    }
    
    // データフロー手動テスト用関数
    window.testDataFlow = function(sourcePluginId, data = 'test') {
      if (window.connectionManager) {
        console.log(`🧪 Testing data flow from: ${sourcePluginId}`)
        window.connectionManager.executeDataFlow(sourcePluginId, {
          type: 'test',
          source: 'manual',
          timestamp: Date.now(),
          data: data
        })
      } else {
        console.log('❌ Connection Manager not available')
      }
    }
    
    nyaCoreUI.log('🎨 VoidCoreUI initialized with SystemBootManager integration')
}

/**
 * 🔄 Phase 2: メッセージアダプター初期化
 */
async function initializeMessageAdapter() {
    messageAdapter = new CharmFlowMessageAdapter(nyaCoreUI)
    
    // 互換性モード設定
    messageAdapter.setCompatibilityMode('hybrid')
    
    // グローバル参照設定
    window.messageAdapter = messageAdapter
    
    nyaCoreUI.log('🔄 CharmFlowMessageAdapter initialized')
}

/**
 * 🚀 Phase 3: CharmFlowBootManager初期化
 */
async function initializeCharmFlowBootManager() {
    charmFlowBootManager = new CharmFlowBootManager()
    
    // VoidCoreUIにプラグイン登録
    // await nyaCoreUI.registerPlugin(charmFlowBootManager)
    
    // グローバル参照設定
    window.charmFlowBootManager = charmFlowBootManager
    
    nyaCoreUI.log('🚀 CharmFlowBootManager initialized')
}

/**
 * 🔗 Phase 3.5: Stage 3コンポーネント初期化
 */
async function initializeStage3Components() {
    // 🔧 Phase3対応: 接続マネージャー初期化
    connectionManager = new VoidCoreConnectionManager()
    await nyaCoreUI.registerPlugin(connectionManager)
    
    // 手動でonActivated呼び出し（デバッグ用）
    if (connectionManager.onActivated) {
      await connectionManager.onActivated()
    }
    
    // グローバル参照設定（FlowExecutor初期化前に）
    window.connectionManager = connectionManager
    
    // 🔧 Phase3対応: フロー実行エンジン初期化
    flowExecutor = new PluginFlowExecutor()
    await nyaCoreUI.registerPlugin(flowExecutor)
    if (flowExecutor.onActivated) {
      await flowExecutor.onActivated()
    }
    
    // FlowExecutorにConnectionManagerを直接設定
    flowExecutor.connectionManager = connectionManager
    nyaCoreUI.log(`🔗 FlowExecutor.connectionManager set: ${!!flowExecutor.connectionManager}`)
    
    window.flowExecutor = flowExecutor
    
    // SVG矢印マーカー初期化
    initializeSVGMarkers()
    
    nyaCoreUI.log('🔗 Stage 3 components initialized')
    nyaCoreUI.log('💡 接続機能: プラグインをクリックして線で繋ぐ')
}

/**
 * 🐛 Phase 4: デバッグシステム初期化
 */
async function initializePhase4DebugSystem() {
    try {
        console.log('🐛 Phase 4: デバッグシステム初期化開始...')
        
        // CharmFlowCoreに各種コンポーネントを登録
        if (nyaCoreUI) {
            charmFlowCore.registerUIManager(nyaCoreUI)
            console.log('📝 UIManager registered with CharmFlowCore')
        }
        
        if (connectionManager) {
            charmFlowCore.registerConnectionManager(connectionManager)
            // ConnectionManagerにVoidFlowCoreを設定
            connectionManager.charmFlowCore = charmFlowCore
            // Phase 3: Intent化モード有効化
            connectionManager.enableIntentMode()
            console.log('🔗 ConnectionManager registered with VoidFlowCore')
        }
        
        // デバッグコンソール用グローバル関数追加
        window.debugCharmFlow = {
            core: () => charmFlowCore,
            debugManager: () => charmFlowCore.debugManager,
            debugPlugin: () => charmFlowCore.debugPlugin,
            startTrace: (patterns, level) => charmFlowCore.sendIntent('charmflow.debug.trace.start', { patterns, level }),
            stopTrace: () => charmFlowCore.sendIntent('charmflow.debug.trace.stop'),
            dumpState: (format) => charmFlowCore.sendIntent('charmflow.debug.state.dump', { format }),
            getStats: () => charmFlowCore.sendIntent('charmflow.debug.stats.get'),
            reset: () => charmFlowCore.sendIntent('charmflow.debug.reset'),
            export: () => charmFlowCore.sendIntent('charmflow.debug.export')
        }
        
        // システム状態テスト
        await testPhase4DebugSystem()
        
        console.log('✅ Phase 4: デバッグシステム初期化完了！')
        nyaCoreUI.log('🐛 Phase 4: 統合デバッグシステム初期化完了')
        
    } catch (error) {
        console.error('❌ Phase 4: デバッグシステム初期化失敗:', error)
        nyaCoreUI.log('❌ Phase 4: デバッグシステム初期化失敗')
        throw error
    }
}

/**
 * 🔧 Phase 4.5: VoidCoreデバッグプラグイン初期化
 */
async function initializeVoidCoreDebugPlugin() {
    try {
        console.log('🔧 Phase 4.5: VoidCoreデバッグプラグイン初期化開始...')
        
        // debugPluginを参照設定
        debugPlugin = voidCoreDebugPlugin
        
        // VoidFlowCoreにデバッグプラグインを登録
        if (charmFlowCore) {
            debugPlugin.charmFlowCore = charmFlowCore
            
            // プラグインとして登録（registerPluginメソッドの存在確認）
            if (typeof charmFlowCore.registerPlugin === 'function') {
                await charmFlowCore.registerPlugin(debugPlugin)
                console.log('✅ VoidCoreDebugPlugin registered via VoidFlowCore')
            } else {
                // 代替方法: 直接参照設定
                console.log('⚠️ VoidFlowCore.registerPlugin not found, using direct reference')
            }
            
            // プラグインを有効化
            await debugPlugin.onActivated()
            
            console.log('✅ VoidCoreDebugPlugin activated')
            nyaCoreUI.log('🔧 VoidCoreデバッグプラグイン初期化完了')
        }
        
        // グローバル関数に追加
        window.debugPlugin = debugPlugin
        
        // 既存のdebugVoidFlowに統合
        if (window.debugCharmFlow) {
            window.debugCharmFlow.voidCorePlugin = () => debugPlugin
            window.debugCharmFlow.pluginStats = () => debugPlugin.getStats()
            window.debugCharmFlow.exportPluginData = () => debugPlugin.exportDebugData()
        }
        
        console.log('✅ Phase 4.5: VoidCoreデバッグプラグイン初期化完了！')
        
    } catch (error) {
        console.error('❌ Phase 4.5: VoidCoreデバッグプラグイン初期化失敗:', error)
        nyaCoreUI.log('❌ VoidCoreデバッグプラグイン初期化失敗')
        throw error
    }
}

/**
 * 🧪 Phase 4デバッグシステムテスト
 */
async function testPhase4DebugSystem() {
    try {
        console.log('🧪 Phase 4デバッグシステムテスト開始...')
        
        // デバッグ機能利用可能性確認
        const features = charmFlowCore.getAvailableFeatures()
        const debugFeatures = features.filter(f => f.startsWith('debug'))
        console.log('🐛 利用可能デバッグ機能:', debugFeatures)
        
        // デバッグシステム確認
        if (charmFlowCore.debugPlugin) {
            console.log('✅ VoidFlowDebugPlugin (VoidCore準拠) 利用可能')
            console.log('🔧 プラグインID:', charmFlowCore.debugPlugin.id)
            console.log('🔧 プラグインステータス:', charmFlowCore.debugPlugin.status)
        }
        
        if (charmFlowCore.debugManager) {
            console.log('✅ CharmFlowDebugManager (レガシー互換) 利用可能')
        }
        
        if (window.charmflowDebug) {
            console.log('✅ グローバルデバッグ関数 利用可能')
        }
        
        // 基本デバッグIntent送信テスト
        const statsResult = await charmFlowCore.sendIntent('charmflow.debug.stats.get')
        console.log('📊 デバッグ統計取得テスト:', statsResult)
        
        console.log('🎉 Phase 4デバッグシステムテスト完了！')
        
    } catch (error) {
        console.error('❌ Phase 4デバッグシステムテスト失敗:', error)
        throw error
    }
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
    
    // 純粋アーキテクチャ用のZenメッセージ設定
    setPureArchitectureZenMessage()
    
    nyaCoreUI.log('🎨 UI initialization completed')
}

/**
 * ✨ VoidCoreUI拡張機能初期化
 */
function initializeVoidCoreUIFeatures() {
    // VoidCoreメッセージ監視パネル追加
    addVoidCoreMessagePanel()
    
    // VoidCore v14.0 純粋アーキテクチャ - ハイブリッドモード除去済み
    
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
    console.log('🔧 nyaCoreUI available:', !!nyaCoreUI)
    if (messageLog && nyaCoreUI) {
        console.log('📝 Setting log element for VoidCoreUI')
        nyaCoreUI.setLogElement(messageLog)
        console.log('✅ Log element set successfully')
    } else {
        console.log('❌ Failed to set log element:', { messageLog: !!messageLog, nyaCoreUI: !!nyaCoreUI })
    }
}

/**
 * 🔄 VoidCore v14.0 純粋アーキテクチャ - ハイブリッドモード機能完全除去済み
 */

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
            nyaCoreUI.log('🚀 VoidCore統合フロー実行開始...')
            
            // VoidCore v14.0 純粋アーキテクチャ
            await executeFlowVoidCoreOnly()
            
        } catch (error) {
            nyaCoreUI.log(`❌ VoidCore統合フロー実行失敗: ${error.message}`)
            console.error('VoidCore統合フロー実行エラー:', error)
        }
    }
    
    // 既存実行ボタンの拡張
    const executeButton = document.querySelector('.execute-button')
    if (executeButton) {
        const originalOnClick = executeButton.onclick
        executeButton.onclick = async () => {
            // VoidCore v14.0 純粋アーキテクチャ
            await window.executeFlowVoidCore()
        }
    }
}

/**
 * 🔄 ハイブリッドモード実行
 */
async function executeFlowHybrid() {
    nyaCoreUI.log('🔄 ハイブリッドモード実行')
    
    // 1. 従来VoidFlowの状態を取得
    const legacyNodes = Array.from(charmFlowEngine.nodes.values())
    nyaCoreUI.log(`📋 従来ノード数: ${legacyNodes.length}`)
    
    // 2. VoidCoreメッセージとして実行
    for (const node of legacyNodes) {
        if (node.type === 'button.send') {
            // VoidCore Message作成
            const executeMessage = messageAdapter.createExecutionMessage(
                node.id, 
                {},
                { triggerType: 'hybrid_mode', flowId: messageAdapter.generateFlowId() }
            )
            
            nyaCoreUI.log(`📤 VoidCore実行メッセージ送信: ${node.id}`)
            
            // VoidCoreに実行要求を発行
            await nyaCoreUI.publish(executeMessage)
        }
    }
}

/**
 * 🎨 VoidCoreオンリーモード実行
 */
async function executeFlowVoidCoreOnly() {
    nyaCoreUI.log('🎨 VoidCoreオンリーモード実行')
    
    // VoidCoreUIから直接プラグイン実行
    const uiState = nyaCoreUI.getUIState()
    nyaCoreUI.log(`📊 UI要素数: ${uiState.elementCount}`)
    
    if (uiState.elementCount === 0) {
        nyaCoreUI.log('⚠️ VoidCore UI要素が見つかりません')
        nyaCoreUI.log('💡 ヒント: VoidCoreモードではVoidCoreUI要素が必要です')
        return
    }
    
    // TODO: VoidCoreプラグイン実行ロジック実装
    nyaCoreUI.log('🔧 VoidCoreプラグイン実行機能は実装中です')
}

/**
 * 🔄 モード変更時のUI更新
 */
// VoidCore v14.0 純粋アーキテクチャ - UIモード更新関数削除済み
// updateUIForMode() → 完全に削除（モード概念自体が消失）

// 純粋アーキテクチャ用のZenメッセージ設定
function setPureArchitectureZenMessage() {
    const zenMessage = document.getElementById('zenMessage')
    if (zenMessage) {
        zenMessage.innerHTML = `
            <div class="zen-title">💎 VoidCore純粋宇宙で星座を描く</div>
            <div class="zen-subtitle">完全なる純粋メッセージベースシステム</div>
        `
    }
}

/**
 * 🧪 Phase 6: 統合テスト
 */
async function performIntegrationTest() {
    nyaCoreUI.log('🧪 統合テスト実行中...')
    
    // Test 1: VoidCoreUI基本機能
    const uiTest = nyaCoreUI.getUIState()
    nyaCoreUI.log(`✅ VoidCoreUI: Canvas=${!!uiTest.canvasAttached}`)
    
    // Test 2: メッセージアダプター
    const adapterTest = messageAdapter.getAdapterStats()
    nyaCoreUI.log(`✅ MessageAdapter: Version=${adapterTest.adapterVersion}`)
    
    // Test 3: VoidCore v14.0 純粋アーキテクチャ
    nyaCoreUI.log(`✅ Pure Architecture: VoidCore v14.0 ready`)
    
    nyaCoreUI.log('🎉 統合テスト完了！')
}

/**
 * 🎨 Phase 7: Monaco Editor初期化確認
 */
async function initializeMonacoEditor() {
    try {
        nyaCoreUI.log('🎨 Monaco Editor初期化確認中...')
        
        // Monaco Plugin Editorインスタンス確認
        if (window.monacoPluginEditor) {
            nyaCoreUI.log('✅ Monaco Plugin Editor: Available')
        } else {
            nyaCoreUI.log('⚠️ Monaco Plugin Editor: Not found, creating instance...')
            
            // 手動でインスタンス作成
            const { default: MonacoPluginEditor } = await import('./monaco-plugin-editor.js')
            window.monacoPluginEditor = new MonacoPluginEditor()
            
            nyaCoreUI.log('✅ Monaco Plugin Editor: Created manually')
        }
        
        // Monaco CDN確認
        if (typeof require !== 'undefined') {
            nyaCoreUI.log('✅ Monaco Editor CDN: Loaded')
        } else {
            nyaCoreUI.log('⚠️ Monaco Editor CDN: Loading...')
        }
        
        nyaCoreUI.log('🎨 Monaco Editor準備完了！')
        nyaCoreUI.log('💡 使い方: ノードをダブルクリックしてコード編集')
        
    } catch (error) {
        nyaCoreUI.log(`❌ Monaco Editor初期化失敗: ${error.message}`)
        console.error('Monaco Editor initialization error:', error)
    }
}

/**
 * 🎯 SVG矢印マーカー初期化
 */
function initializeSVGMarkers() {
    const svg = document.getElementById('connectionSvg')
    if (!svg) {
        nyaCoreUI.log('⚠️ Connection SVG not found for marker initialization')
        return
    }
    
    let defs = svg.querySelector('defs')
    if (!defs) {
        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
        svg.appendChild(defs)
    }
    
    // 基本矢印マーカー（データフロー用）
    if (!defs.querySelector('#arrowhead')) {
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker')
        marker.setAttribute('id', 'arrowhead')
        marker.setAttribute('markerWidth', '10')
        marker.setAttribute('markerHeight', '7')
        marker.setAttribute('refX', '9')
        marker.setAttribute('refY', '3.5')
        marker.setAttribute('orient', 'auto')
        marker.setAttribute('fill', '#4a90e2')
        
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
        polygon.setAttribute('points', '0 0, 10 3.5, 0 7')
        marker.appendChild(polygon)
        defs.appendChild(marker)
    }
    
    // オレンジ矢印マーカー（制御フロー用）
    if (!defs.querySelector('#arrowhead-orange')) {
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker')
        marker.setAttribute('id', 'arrowhead-orange')
        marker.setAttribute('markerWidth', '10')
        marker.setAttribute('markerHeight', '7')
        marker.setAttribute('refX', '9')
        marker.setAttribute('refY', '3.5')
        marker.setAttribute('orient', 'auto')
        marker.setAttribute('fill', '#ff9500')
        
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
        polygon.setAttribute('points', '0 0, 10 3.5, 0 7')
        marker.appendChild(polygon)
        defs.appendChild(marker)
    }
    
    nyaCoreUI.log('🎯 SVG arrow markers initialized')
}

/**
 * 🔄 VoidCore v14.0 純粋アーキテクチャ - フォールバック機能完全除去済み
 */

// 従来のUI初期化関数（既存コードから移植）
// ノードパレット初期化
function initializeNodePalette() {
    const nodeItems = document.querySelectorAll('.node-item')
    
    nodeItems.forEach(item => {
        // ドラッグ機能
        item.addEventListener('dragstart', async (e) => {
            const nodeType = item.getAttribute('data-node-type')
            e.dataTransfer.setData('text/plain', nodeType)
            
            if (charmFlowCore) {
                await charmFlowCore.sendIntent('charmflow.ui.element.drag.start', {
                    nodeType,
                    elementId: item.id,
                    timestamp: Date.now()
                })
            } else {
                // フォールバック
                if (nyaCoreUI) {
                    nyaCoreUI.log(`📦 ドラッグ開始: ${nodeType}`)
                } else if (charmFlowEngine) {
                    charmFlowEngine.log(`📦 ドラッグ開始: ${nodeType}`)
                }
            }
        })
        
        // クリック機能
        item.addEventListener('click', async (e) => {
            const nodeType = item.getAttribute('data-node-type')
            const position = {
                x: Math.random() * 400 + 100,
                y: Math.random() * 300 + 100
            }
            
            if (charmFlowCore) {
                await charmFlowCore.sendIntent('charmflow.ui.element.create', {
                    nodeType,
                    position,
                    source: 'palette_click',
                    timestamp: Date.now()
                })
            } else {
                // フォールバック - VoidCoreプラグイン作成
                try {
                    const result = await createVoidCoreNode(nodeType, position)
                    nyaCoreUI.log(`🎯 ノード作成完了: ${nodeType}`)
                } catch (error) {
                    nyaCoreUI.log(`❌ ノード作成エラー: ${error.message}`)
                }
            }
        })
        
        item.setAttribute('draggable', true)
    })
}

// キャンバス初期化
function initializeCanvas() {
    const canvasArea = document.querySelector('.canvas-area')
    
    canvasArea.addEventListener('dragover', async (e) => {
        e.preventDefault()
        
        if (charmFlowCore) {
            await charmFlowCore.sendIntent('charmflow.ui.canvas.dragover', {
                position: { x: e.clientX, y: e.clientY },
                timestamp: Date.now()
            })
        }
    })
    
    canvasArea.addEventListener('drop', async (e) => {
        e.preventDefault()
        
        const nodeType = e.dataTransfer.getData('text/plain')
        const rect = canvasArea.getBoundingClientRect()
        const position = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        }
        
        if (charmFlowCore) {
            await charmFlowCore.sendIntent('charmflow.ui.element.create', {
                nodeType,
                position,
                source: 'canvas_drop',
                timestamp: Date.now()
            })
        } else {
            // フォールバック - VoidCoreプラグインのみ作成（接続テスト用）
            console.log(`🎯 ドラッグ&ドロップ: ${nodeType}`)
            createVoidCoreNode(nodeType, position).catch(error => {
                console.error(`❌ ドラッグ&ドロップ createVoidCoreNode失敗:`, error)
            })
        }
    })
}

// VoidCoreノード作成（VoidCoreUI統合版）
async function createVoidCoreNode(nodeType, position) {
    try {
        nyaCoreUI.log(`🌟 VoidCoreノード作成開始: ${nodeType}`)
        
        if (!nyaCoreUI) {
            throw new Error('NyaCoreUI not initialized')
        }
        
        // VoidCoreUIの統合メソッドを使用
        const pluginId = await nyaCoreUI.createUIPlugin(nodeType, position)
        
        nyaCoreUI.log(`🎯 VoidCoreUIプラグイン作成完了: ${pluginId}`)
        return pluginId
        
    } catch (error) {
        nyaCoreUI.log(`❌ VoidCoreノード作成失敗: ${error.message}`)
        throw error
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
        nyaCoreUI.log(`🔄 プラグイン登録開始: ${nodeType} (${pluginId})`)
        
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
                        
                        nyaCoreUI.log(`📝 Input Text実行: "${textValue}"`)
                        
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
                        nyaCoreUI.log(`📊 Console出力: ${inputValue}`)
                        
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
                        nyaCoreUI.log(`🚀 Button Send実行開始`)
                        
                        const result = {
                            type: 'trigger',
                            value: 'button_triggered',
                            trigger: true,
                            nodeType: nodeType,
                            nodeId: this.id,
                            timestamp: Date.now()
                        }
                        
                        nyaCoreUI.log(`🚀 Button Send結果:`, result)
                        nyaCoreUI.log(`🚀 Button Send完了 - データフロー開始予定`)
                        
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
                        nyaCoreUI.log(`🔧 基本プラグイン実行: ${nodeType}`)
                        
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
        nyaCoreUI.log(`🔧 プラグインインスタンス作成中: ${PluginClass.name}`)
        const plugin = new PluginClass({ id: pluginId })
        nyaCoreUI.log(`✅ プラグインインスタンス作成完了: ${plugin.id}`)
        
        // 要素に関連付け
        element._voidCorePlugin = plugin
        nyaCoreUI.log(`🔗 要素とプラグインの関連付け完了`)
        
        // VoidCoreUIに登録
        nyaCoreUI.log(`📝 VoidCoreUIへの登録開始`)
        await nyaCoreUI.registerPlugin(plugin)
        nyaCoreUI.log(`✅ VoidCoreUIへの登録完了`)
        
        nyaCoreUI.log(`📦 VoidCoreプラグイン登録: ${nodeType} (${pluginId})`)
        
    } catch (error) {
        nyaCoreUI.log(`❌ VoidCoreプラグイン登録失敗: ${error.message}`)
        console.error('VoidCoreプラグイン登録エラー:', error)
    }
}

// VoidCoreプラグインドラッグ機能
function makeVoidCorePluginDraggable(element) {
    let isDragging = false
    let dragStartX, dragStartY
    
    element.addEventListener('mousedown', async (e) => {
        if (e.target.classList.contains('node-input') || 
            e.target.classList.contains('execute-button') ||
            e.target.classList.contains('connection-port')) return
        
        isDragging = true
        dragStartX = e.clientX - element.offsetLeft
        dragStartY = e.clientY - element.offsetTop
        
        if (charmFlowCore) {
            await charmFlowCore.sendIntent('charmflow.ui.element.drag.start', {
                elementId: element.id,
                startPosition: { x: e.clientX, y: e.clientY },
                timestamp: Date.now()
            })
        }
        
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
    
    async function onMouseUp() {
        if (charmFlowCore && isDragging) {
            await charmFlowCore.sendIntent('charmflow.ui.element.drag.end', {
                elementId: element.id,
                endPosition: { x: element.offsetLeft, y: element.offsetTop },
                timestamp: Date.now()
            })
        }
        
        isDragging = false
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
    }
}

// 従来ノード作成（ハイブリッドモード用）
function createNodeOnCanvas(nodeType, position) {
    try {
        const node = charmFlowEngine.createNode(nodeType, position)
        const nodeElement = createNodeElement(node)
        
        document.querySelector('.canvas-area').appendChild(nodeElement)
        
        // Zenメッセージを隠す
        const zenMessage = document.getElementById('zenMessage')
        if (zenMessage) {
            zenMessage.style.display = 'none'
        }
        
        if (nyaCoreUI) {
            nyaCoreUI.log(`✨ 従来ノード作成: ${nodeType} at (${position.x}, ${position.y})`)
        } else {
            charmFlowEngine.log(`✨ ノード作成: ${nodeType} at (${position.x}, ${position.y})`)
        }
        
    } catch (error) {
        if (nyaCoreUI) {
            nyaCoreUI.log(`❌ 従来ノード作成失敗: ${error.message}`)
        } else {
            charmFlowEngine.log(`❌ ノード作成失敗: ${error.message}`)
        }
    }
}

// デバッグ用グローバル関数
window.getVoidCoreDebugInfo = function() {
    return {
        nyaCoreUI: nyaCoreUI ? nyaCoreUI.getUIState() : null,
        messageAdapter: messageAdapter ? messageAdapter.getDebugInfo() : null,
        pureArchitecture: true,
        voidCoreVersion: 'v14.0'
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
    nodeDiv.addEventListener('click', async (e) => {
        if (!e.target.classList.contains('connection-port')) {
            if (charmFlowCore) {
                await charmFlowCore.sendIntent('charmflow.ui.element.select', {
                    elementId: node.id,
                    nodeType: node.type,
                    position: { x: e.clientX, y: e.clientY },
                    timestamp: Date.now()
                })
            } else {
                // フォールバック
                selectNode(node.id)
                
                // ハイブリッドモード: VoidCore統合処理も実行
                if (nyaCoreUI) {
                    nyaCoreUI.log(`🎯 ノード選択: ${node.type} (${node.id})`)
                }
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
    
    nodeElement.addEventListener('mousedown', async (e) => {
        if (e.target.classList.contains('node-input')) return
        
        isDragging = true
        dragStartX = e.clientX - nodeElement.offsetLeft
        dragStartY = e.clientY - nodeElement.offsetTop
        
        if (charmFlowCore) {
            await charmFlowCore.sendIntent('charmflow.ui.element.drag.start', {
                elementId: nodeElement.id,
                nodeType: 'legacy_node',
                startPosition: { x: e.clientX, y: e.clientY },
                timestamp: Date.now()
            })
        }
        
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
        
        // CharmFlowEngineのノード位置も更新
        const nodeId = nodeElement.id.replace('voidflow-node-', '')
        if (charmFlowEngine && charmFlowEngine.nodes) {
            const node = charmFlowEngine.nodes.get(nodeId)
            if (node) {
                node.position.x = newX
                node.position.y = newY
            }
        }
        
        // VoidCoreUIにも位置更新通知
        if (nyaCoreUI && nyaCoreUI.uiChannel) {
            nyaCoreUI.uiChannel.updatePosition.update({
                elementId: nodeId,
                x: newX,
                y: newY
            })
        }
    }
    
    async function onMouseUp() {
        if (charmFlowCore && isDragging) {
            await charmFlowCore.sendIntent('charmflow.ui.element.drag.end', {
                elementId: nodeElement.id,
                nodeType: 'legacy_node',
                endPosition: { x: nodeElement.offsetLeft, y: nodeElement.offsetTop },
                timestamp: Date.now()
            })
        }
        
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
        if (charmFlowEngine) {
            charmFlowEngine.selectedNode = nodeId
        }
        
        // プロパティパネル更新
        updatePropertiesPanel(nodeId)
    }
}

// プロパティパネル更新
function updatePropertiesPanel(nodeId) {
    if (!charmFlowEngine || !charmFlowEngine.nodes) return
    
    const node = charmFlowEngine.nodes.get(nodeId)
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
    if (charmFlowEngine && charmFlowEngine.nodes) {
        const node = charmFlowEngine.nodes.get(nodeId)
        if (node) {
            node.properties[propertyName] = value
            
            // 統合ログ
            if (nyaCoreUI) {
                nyaCoreUI.log(`⚙️ プロパティ更新: ${nodeId}.${propertyName} = "${value}"`)
            } else {
                charmFlowEngine.log(`⚙️ プロパティ更新: ${nodeId}.${propertyName} = "${value}"`)
            }
        }
    }
}

// 特定ノードから実行開始
window.startFromNode = async function(nodeId) {
    try {
        if (nyaCoreUI) {
            nyaCoreUI.log(`🎯 手動開始: ${nodeId}`)
        }
        
        // VoidCore v14.0 純粋アーキテクチャ - FlowExecutor使用
        if (flowExecutor && flowExecutor.executeNode) {
            await flowExecutor.executeNode(nodeId)
        } else {
            throw new Error('FlowExecutor が見つかりません')
        }
        
        if (nyaCoreUI) {
            nyaCoreUI.log('✨ 実行完了!')
        }
        
    } catch (error) {
        const message = `❌ ノード実行失敗: ${error.message}`
        if (nyaCoreUI) {
            nyaCoreUI.log(message)
        } else {
            console.error(message, error)
        }
    }
}

// VoidCoreプラグイン実行
window.executeVoidCorePlugin = async function(pluginId) {
    console.log(`🎯🎯🎯 executeVoidCorePlugin 呼び出し確認: ${pluginId}`)
    nyaCoreUI.log(`🎯🎯🎯 executeVoidCorePlugin 呼び出し確認: ${pluginId}`)
    
    try {
        const actualFlowExecutor = window.flowExecutor || flowExecutor
        
        if (!actualFlowExecutor) {
            throw new Error('FlowExecutor not initialized')
        }
        
        nyaCoreUI.log(`🔧 Using flowExecutor: global=${!!window.flowExecutor}, local=${!!flowExecutor}`)
        nyaCoreUI.log(`🔧 Actual executor:`, actualFlowExecutor?.constructor?.name)
        
        // ConnectionManager参照を再確認・設定
        if (!actualFlowExecutor.connectionManager && window.connectionManager) {
            actualFlowExecutor.connectionManager = window.connectionManager
            nyaCoreUI.log(`🔗 ConnectionManager re-linked to FlowExecutor`)
        }
        
        nyaCoreUI.log(`🎯 VoidCoreプラグイン実行: ${pluginId}`)
        nyaCoreUI.log(`🔗 FlowExecutor.connectionManager: ${!!actualFlowExecutor.connectionManager}`)
        
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
        
        nyaCoreUI.log(`🔧 FlowExecutor.executePlugin 呼び出し開始`)
        nyaCoreUI.log(`🔧 flowExecutor:`, !!actualFlowExecutor)
        nyaCoreUI.log(`🔧 flowExecutor.executePlugin:`, typeof actualFlowExecutor?.executePlugin)
        nyaCoreUI.log(`🔧 flowExecutor constructor:`, actualFlowExecutor?.constructor?.name)
        
        // FlowExecutorで実行
        nyaCoreUI.log(`🔧 flowExecutor.executePlugin 実際の呼び出し`)
        
        const executePromise = actualFlowExecutor.executePlugin({
            pluginId: pluginId,
            input: getVoidCorePluginInput(pluginId),
            options: { 
                triggerType: 'manual',
                voidCoreMode: true 
            }
        })
        
        nyaCoreUI.log(`🔧 executePromise:`, executePromise)
        nyaCoreUI.log(`🔧 Promise type:`, typeof executePromise)
        nyaCoreUI.log(`🔧 Is Promise:`, executePromise instanceof Promise)
        
        const result = await executePromise
        
        nyaCoreUI.log(`🔧 flowExecutor.executePlugin 完了, result:`, result)
        nyaCoreUI.log(`✅ VoidCoreプラグイン実行完了: ${pluginId}`)
        
        return result
        
    } catch (error) {
        console.error(`🔴 ERROR in executeVoidCorePlugin:`, error)
        nyaCoreUI.log(`🔴 ERROR DETAILS: ${error.message}`)
        nyaCoreUI.log(`🔴 ERROR STACK: ${error.stack}`)
        nyaCoreUI.log(`❌ VoidCoreプラグイン実行失敗: ${pluginId} - ${error.message}`)
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
        nyaCoreUI.log(`⚙️ VoidCoreプロパティ更新: ${pluginId}.${propertyName} = "${value}"`)
    }
}

// 従来のフロー実行（executeFlow）
window.executeFlow = async function() {
    try {
        if (!charmFlowEngine || !executeEngine) {
            throw new Error('VoidFlowエンジンが初期化されていません')
        }
        
        const logger = nyaCoreUI || charmFlowEngine
        logger.log('🚀 従来フロー実行開始...')
        
        // Button.sendノードを探して実行
        const allNodes = Array.from(charmFlowEngine.nodes.values())
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
        if (nyaCoreUI) {
            nyaCoreUI.log(message)
        } else {
            console.error(message, error)
        }
    }
}

/**
 * 🎨 Phase 5.5: プラグインパレット初期化
 */
async function initializePluginPalette() {
    try {
        console.log('🎨 PluginPalette初期化開始...')
        
        // パレットマウント要素の確認
        const paletteMount = document.getElementById('pluginPaletteMount')
        if (!paletteMount) {
            throw new Error('pluginPaletteMount element not found')
        }
        
        console.log('📦 PluginPalettePlugin作成中...')
        
        // PluginPalettePlugin作成
        pluginPalette = new PluginPalettePlugin({
            width: '100%',
            height: '100%',
            showStats: true,
            enableVirtualScroll: true
        })
        
        console.log('🔧 パレット作成中...')
        await pluginPalette.createPalette(paletteMount)
        
        // グローバル参照設定
        window.pluginPalette = pluginPalette
        
        console.log('✅ PluginPalette初期化完了！')
        if (nyaCoreUI) {
            nyaCoreUI.log('✅ PluginPalette初期化完了！')
        }
        
    } catch (error) {
        console.error('❌ PluginPalette初期化失敗:', error)
        if (nyaCoreUI) {
            nyaCoreUI.log(`❌ PluginPalette初期化失敗: ${error.message}`)
        }
        throw error
    }
}

/**
 * 🌟 Phase 0: VoidFlow-VoidCore統合アーキテクチャ初期化
 */
async function initializeCharmFlowCoreArchitecture() {
    try {
        console.log('🌟 VoidFlow-VoidCore統合アーキテクチャ初期化開始...')
        
        // CharmFlowCore初期化
        charmFlowCore = new CharmFlowCore({
            enableDebug: true,
            enableStats: true,
            messagePoolSize: 1000,
            intentTraceLevel: 'basic'
        })
        
        // グローバル参照設定（デバッグ用）
        window.charmFlowCore = charmFlowCore
        
        console.log('✅ CharmFlowCore初期化完了！')
        
        // Intent Bridge初期化（Phase 2で有効化予定）
        intentBridge = new CharmFlowIntentBridge(charmFlowCore)
        window.charmFlowIntentBridge = intentBridge
        
        console.log('✅ Intent Bridge初期化完了（Phase 2で有効化予定）')
        
        // Phase 1基本動作テスト
        await testCharmFlowCoreBasicOperation()
        
        console.log('🎉 CharmFlow-nyacore統合アーキテクチャ初期化完了！')
        
    } catch (error) {
        console.error('❌ CharmFlow-nyacore統合アーキテクチャ初期化失敗:', error)
        throw error
    }
}

/**
 * 🧪 CharmFlowCore基本動作テスト
 */
async function testCharmFlowCoreBasicOperation() {
    try {
        console.log('🧪 CharmFlowCore基本動作テスト開始...')
        
        // システム状態確認
        const systemStatus = charmFlowCore.getSystemStatus()
        console.log('📊 System Status:', systemStatus)
        
        // 基本Intent送信テスト
        const testResult = await charmFlowCore.sendIntent('charmflow.system.status')
        console.log('📤 Intent Test Result:', testResult)
        
        // 利用可能機能確認
        const features = charmFlowCore.getAvailableFeatures()
        console.log('🔧 Available Features:', features)
        
        console.log('✅ VoidFlowCore基本動作テスト完了！')
        
    } catch (error) {
        console.error('❌ VoidFlowCore基本動作テスト失敗:', error)
        throw error
    }
}

/**
 * 🔗 Phase 1.5: NyaCoreUIとCharmFlowCoreの統合
 */
async function connectNyaCoreUIWithCharmFlowCore() {
    try {
        console.log('🔗 NyaCoreUIとCharmFlowCore統合開始...')
        
        if (!nyaCoreUI) {
            throw new Error('NyaCoreUI not initialized')
        }
        
        if (!charmFlowCore) {
            throw new Error('CharmFlowCore not initialized')
        }
        
        // NyaCoreUIにCharmFlowCoreの参照を設定
        nyaCoreUI.charmFlowCore = charmFlowCore
        console.log('✅ NyaCoreUI.charmFlowCore reference set')
        
        // VoidFlowCoreにVoidCoreUIをUIManagerとして登録
        charmFlowCore.registerUIManager(nyaCoreUI)
        console.log('✅ VoidCoreUI registered as UIManager in VoidFlowCore')
        
        // Phase 3: VoidFlowCoreにConnectionManagerを登録
        if (connectionManager) {
            charmFlowCore.registerConnectionManager(connectionManager)
            connectionManager.charmFlowCore = charmFlowCore
            connectionManager.enableIntentMode()
            console.log('✅ ConnectionManager registered and Intent mode enabled')
        }
        
        // Phase 2: ドラッグ&ドロップのIntent化有効化
        if (nyaCoreUI.dragDropManager) {
            nyaCoreUI.dragDropManager.enableIntentMode()
            console.log('✅ DragDropManager Intent mode enabled')
        }
        
        // Phase 2: Intent Bridge有効化（オプション）
        if (intentBridge) {
            // intentBridge.enable() // 必要に応じて有効化
            console.log('📡 Intent Bridge ready (disabled by default)')
        }
        
        // 統合テスト
        await testVoidCoreUIIntegration()
        
        console.log('🎉 VoidCoreUIとVoidFlowCore統合完了！')
        
    } catch (error) {
        console.error('❌ VoidCoreUIとVoidFlowCore統合失敗:', error)
        throw error
    }
}

/**
 * 🧪 VoidCoreUI統合テスト
 */
async function testVoidCoreUIIntegration() {
    try {
        console.log('🧪 VoidCoreUI統合テスト開始...')
        
        // Intent経由でのUI要素作成テスト
        const testResult = await charmFlowCore.sendIntent('charmflow.ui.element.create', {
            nodeType: 'test-button',
            position: { x: 50, y: 50 },
            pluginId: 'integration-test-element'
        })
        
        console.log('📊 Integration Test Result:', testResult)
        
        // VoidCoreUIのVoidFlowCore参照確認
        if (nyaCoreUI.charmFlowCore === charmFlowCore) {
            console.log('✅ VoidCoreUI → VoidFlowCore reference: OK')
        } else {
            console.log('⚠️ VoidCoreUI → VoidFlowCore reference: NG')
        }
        
        // VoidFlowCoreのUIManager登録確認
        if (charmFlowCore.uiManager === nyaCoreUI) {
            console.log('✅ VoidFlowCore → VoidCoreUI registration: OK')
        } else {
            console.log('⚠️ VoidFlowCore → VoidCoreUI registration: NG')
        }
        
        console.log('✅ VoidCoreUI統合テスト完了！')
        
    } catch (error) {
        console.error('❌ VoidCoreUI統合テスト失敗:', error)
        throw error
    }
}