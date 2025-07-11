# 🔗 VoidCore v14.0 Integration Guide

> **VoidFlow × VoidCore統合アーキテクチャ** - 純粋メッセージベースシステムの実現

## 🎯 統合概要

VoidFlowは、VoidCore v14.0の純粋メッセージベースアーキテクチャと完全に統合されており、IPluginインターフェースに準拠したプラグインシステムを提供します。

## 🏗️ 統合アーキテクチャ

### システム構成図
```
┌─────────────────────────────────────────────────────────┐
│                VoidFlow Application                     │
├─────────────────┬─────────────────┬───────────────────┤
│ PluginPalette   │   Canvas Area   │ Properties Panel  │
│                 │                 │                   │
│ ┌─────────────┐ │ ┌─────────────┐ │ ┌───────────────┐ │
│ │   Search    │ │ │ VoidCore    │ │ │  Config       │ │
│ │   Filter    │ │ │ Elements    │ │ │  Debug        │ │
│ │   Grid      │ │ │ Connections │ │ │  Stats        │ │
│ └─────────────┘ │ └─────────────┘ │ └───────────────┘ │
└─────────────────┴─────────────────┴───────────────────┘
                          │
                ┌─────────┴─────────┐
                │   VoidCore v14.0   │
                │                   │
                │ ┌───────────────┐ │
                │ │ IPlugin       │ │
                │ │ Interface     │ │
                │ └───────────────┘ │
                │ ┌───────────────┐ │
                │ │ Message       │ │
                │ │ System        │ │
                │ └───────────────┘ │
                │ ┌───────────────┐ │
                │ │ Plugin        │ │
                │ │ Manager       │ │
                │ └───────────────┘ │
                └───────────────────┘
```

## 🔌 IPlugin Interface 実装

### 基本的なIPlugin準拠クラス
```javascript
import { IPlugin } from '../../src/interfaces/plugin-interface.js'

class VoidFlowPlugin extends IPlugin {
  constructor(pluginData) {
    super({
      id: `${pluginData.id}-${Date.now()}`,
      type: pluginData.type || 'generic',
      parent: window.voidCoreUI,
      displayName: pluginData.displayName || pluginData.name,
      metadata: {
        name: pluginData.name,
        version: pluginData.version,
        author: pluginData.author,
        description: pluginData.description,
        category: pluginData.category,
        tags: pluginData.tags,
        priority: pluginData.priority,
        performance: pluginData.performance,
        attributes: pluginData.attributes,
        config: pluginData.config,
        inputs: pluginData.inputs,
        outputs: pluginData.outputs,
        dependencies: pluginData.dependencies
      }
    })
    
    this.pluginData = pluginData
    this.position = { x: 100, y: 100 }
    this.properties = pluginData.config || {}
  }
  
  // ============================================
  // 必須メソッド - IPlugin Interface準拠
  // ============================================
  
  async handleMessage(message) {
    this.log(`📨 Message received: ${message.intent}`)
    
    switch (message.intent) {
      case 'plugin.execute':
        return await this.executePlugin(message.payload)
      case 'plugin.getInfo':
        return await this.handleGetInfo(message)
      case 'plugin.updateConfig':
        return await this.handleUpdateConfig(message)
      case 'plugin.destroy':
        return await this.handleDestroy(message)
      default:
        return await this.handleCustomIntent(message)
    }
  }
  
  async handleIntent(message) {
    // Intent-based routing
    return await this.handleMessage(message)
  }
  
  async processMessage(message) {
    // General message processing
    return await this.handleMessage(message)
  }
}
```

### プラグインタイプ別実装

#### 1. UI Button Plugin
```javascript
async executeButtonPlugin(input) {
  this.log(`🔘 Button plugin executing`)
  
  return {
    type: 'event',
    value: 'button_clicked',
    timestamp: Date.now(),
    pluginId: this.id,
    eventData: {
      clickCount: (this.properties.clickCount || 0) + 1,
      buttonText: this.properties.text || 'Click Me'
    }
  }
}
```

#### 2. Logic Calculator Plugin
```javascript
async executeCalculatorPlugin(input) {
  const expression = input?.expression || this.properties.expression || '2+2'
  
  try {
    // 安全な数式評価（実装では適切なパーサーを使用）
    const result = this.evaluateExpression(expression)
    
    return {
      type: 'number',
      value: result,
      expression: expression,
      pluginId: this.id,
      calculationTime: Date.now()
    }
  } catch (error) {
    return {
      type: 'error',
      error: error.message,
      expression: expression,
      pluginId: this.id
    }
  }
}
```

#### 3. Data JSON Plugin
```javascript
async executeJsonPlugin(input) {
  const jsonString = input?.jsonString || this.properties.jsonData || '{}'
  
  try {
    const parsed = JSON.parse(jsonString)
    
    return {
      type: 'object',
      value: parsed,
      originalString: jsonString,
      pluginId: this.id,
      parseTime: Date.now()
    }
  } catch (error) {
    return {
      type: 'error',
      error: `JSON Parse Error: ${error.message}`,
      originalString: jsonString,
      pluginId: this.id
    }
  }
}
```

#### 4. Network HTTP Plugin
```javascript
async executeHttpPlugin(input) {
  const url = input?.url || this.properties.url || 'https://httpbin.org/json'
  const method = input?.method || this.properties.method || 'GET'
  
  try {
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...this.properties.headers
      },
      body: method !== 'GET' ? JSON.stringify(input?.body) : undefined
    })
    
    const data = await response.json()
    
    return {
      type: 'object',
      value: data,
      url: url,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers),
      pluginId: this.id,
      requestTime: Date.now()
    }
  } catch (error) {
    return {
      type: 'error',
      error: `HTTP Request Error: ${error.message}`,
      url: url,
      pluginId: this.id
    }
  }
}
```

## 📨 メッセージシステム統合

### VoidCoreメッセージフォーマット
```javascript
// 標準的なVoidCoreメッセージ形式
const voidCoreMessage = {
  id: 'msg-' + Date.now(),
  intent: 'plugin.execute',
  sender: 'voidflow-palette',
  recipient: 'plugin-' + pluginId,
  payload: {
    input: inputData,
    options: {
      triggerType: 'manual',
      voidCoreMode: true,
      timestamp: Date.now()
    }
  },
  timestamp: Date.now(),
  correlationId: 'flow-execution-' + executionId
}
```

### メッセージ Intent 一覧
```javascript
// プラグイン制御用Intent
const PLUGIN_INTENTS = {
  // 基本操作
  EXECUTE: 'plugin.execute',
  GET_INFO: 'plugin.getInfo',
  UPDATE_CONFIG: 'plugin.updateConfig',
  DESTROY: 'plugin.destroy',
  
  // ライフサイクル
  INITIALIZE: 'plugin.initialize',
  ACTIVATE: 'plugin.activate',
  DEACTIVATE: 'plugin.deactivate',
  
  // VoidFlow専用
  ADD_TO_CANVAS: 'voidflow.addToCanvas',
  REMOVE_FROM_CANVAS: 'voidflow.removeFromCanvas',
  UPDATE_POSITION: 'voidflow.updatePosition',
  CONNECT_PLUGINS: 'voidflow.connectPlugins'
}
```

## 🔄 統合初期化プロセス

### メイン初期化フロー
```javascript
// main-voidcore.js での統合初期化
async function initializeVoidFlowVoidCore() {
  try {
    console.log('🌟 VoidFlow VoidCore統合版 初期化開始...')
    
    // Phase 1: VoidCoreUI初期化
    await initializeVoidCoreUI()
    
    // Phase 2: メッセージアダプター初期化  
    await initializeMessageAdapter()
    
    // Phase 3: VoidFlowBootManager初期化
    await initializeVoidFlowBootManager()
    
    // Phase 4: Stage 3コンポーネント初期化
    await initializeStage3Components()
    
    // Phase 5: UI初期化
    await initializeUI()
    
    // Phase 5.5: プラグインパレット初期化
    await initializePluginPalette()
    
    // Phase 6: 統合テスト
    await performIntegrationTest()
    
    // Phase 7: Monaco Editor初期化確認
    await initializeMonacoEditor()
    
    console.log('🎉 VoidFlow VoidCore v14.0 統合完了！')
    
  } catch (error) {
    console.error('❌ VoidFlow VoidCore統合失敗:', error)
  }
}
```

### プラグインパレット統合
```javascript
async function initializePluginPalette() {
  try {
    console.log('🎨 PluginPalette初期化開始...')
    
    // パレットマウント要素の確認
    const paletteMount = document.getElementById('pluginPaletteMount')
    if (!paletteMount) {
      throw new Error('pluginPaletteMount element not found')
    }
    
    // PluginPalettePlugin作成
    pluginPalette = new PluginPalettePlugin({
      width: '100%',
      height: '100%',
      showStats: true,
      enableVirtualScroll: true
    })
    
    // パレット作成
    await pluginPalette.createPalette(paletteMount)
    
    // グローバル参照設定
    window.pluginPalette = pluginPalette
    
    console.log('✅ PluginPalette初期化完了！')
    
  } catch (error) {
    console.error('❌ PluginPalette初期化失敗:', error)
    throw error
  }
}
```

## 🔧 VoidCoreUI統合

### プラグイン追加プロセス
```javascript
// プラグインパレットからキャンバスへの追加
async addPluginToCanvas(plugin) {
  try {
    // VoidCore v14.0 IPlugin互換のプラグインオブジェクトを作成
    const voidCorePlugin = await this.createVoidCorePlugin(plugin)
    
    // VoidCoreUIにプラグインを追加
    await window.voidCoreUI.createUIElement(voidCorePlugin)
    
    this.log(`✅ Plugin added to canvas: ${plugin.displayName}`)
    
  } catch (error) {
    this.log(`❌ Failed to add plugin to canvas: ${error.message}`)
    console.error('Plugin canvas addition error:', error)
  }
}
```

### VoidCoreUI要素作成
```javascript
// VoidCoreUIでのUI要素作成
async createUIElement(plugin) {
  // プラグインのUI要素を作成
  const element = document.createElement('div')
  element.className = 'voidcore-ui-element'
  element.dataset.pluginId = plugin.id
  element.dataset.nodeType = plugin.type
  
  // プラグイン情報を表示
  element.innerHTML = `
    <div class="node-title">${plugin.displayName}</div>
    <div class="node-content">
      ${this.createNodeContent(plugin)}
    </div>
    <div class="node-output" id="node-output-${plugin.id}">待機中...</div>
    <div class="connection-ports">
      <div class="connection-port input-port"></div>
      <div class="connection-port output-port"></div>
    </div>
  `
  
  // キャンバスに追加
  this.canvasElement.appendChild(element)
  
  // VoidCoreプラグインとして登録
  await this.registerVoidCorePlugin(element, plugin.type, plugin.id)
  
  return element
}
```

## 🛡️ エラーハンドリング & フォールバック

### 堅牢なプラグイン作成
```javascript
async createVoidCorePlugin(plugin) {
  try {
    // IPlugin base class を動的インポート
    const { IPlugin } = await import('../../src/interfaces/plugin-interface.js')
    
    // VoidCore v14.0 IPlugin互換のプラグインクラスを作成
    return new VoidFlowPlugin(plugin)
    
  } catch (error) {
    this.log(`❌ VoidCore plugin creation failed: ${error.message}`)
    console.error('VoidCore plugin creation error:', error)
    
    // フォールバック: 簡単なプラグインオブジェクトを返す
    return {
      id: `${plugin.id}-${Date.now()}`,
      type: plugin.type || 'generic',
      displayName: plugin.displayName || plugin.name,
      metadata: plugin,
      async handleMessage(message) {
        console.log(`📨 Simple plugin message: ${message.intent}`)
        return { type: 'generic', value: 'Simple plugin response' }
      }
    }
  }
}
```

### 統合エラー監視
```javascript
// 統合エラーの監視と報告
class VoidCoreIntegrationMonitor {
  constructor() {
    this.errors = []
    this.warnings = []
    this.performance = []
  }
  
  logError(error, context) {
    const errorEntry = {
      timestamp: Date.now(),
      error: error.message,
      stack: error.stack,
      context: context,
      severity: 'error'
    }
    
    this.errors.push(errorEntry)
    console.error('VoidCore Integration Error:', errorEntry)
  }
  
  logWarning(message, context) {
    const warningEntry = {
      timestamp: Date.now(),
      message: message,
      context: context,
      severity: 'warning'
    }
    
    this.warnings.push(warningEntry)
    console.warn('VoidCore Integration Warning:', warningEntry)
  }
  
  getHealthReport() {
    return {
      status: this.errors.length === 0 ? 'healthy' : 'degraded',
      errors: this.errors.length,
      warnings: this.warnings.length,
      uptime: Date.now() - this.startTime,
      lastCheck: Date.now()
    }
  }
}
```

## 📊 パフォーマンス最適化

### 非同期プラグイン読み込み
```javascript
// 大量プラグインの効率的読み込み
class OptimizedPluginLoader {
  constructor() {
    this.loadQueue = []
    this.loading = false
    this.batchSize = 10
  }
  
  async loadPluginBatch(plugins) {
    const batch = plugins.splice(0, this.batchSize)
    
    const loadPromises = batch.map(async (plugin) => {
      try {
        return await this.createVoidCorePlugin(plugin)
      } catch (error) {
        console.error(`Failed to load plugin ${plugin.id}:`, error)
        return null
      }
    })
    
    const results = await Promise.allSettled(loadPromises)
    return results.filter(result => result.status === 'fulfilled' && result.value)
  }
}
```

## 📋 設定・デバッグ

### VoidCore統合設定
```javascript
const VOIDCORE_INTEGRATION_CONFIG = {
  // パフォーマンス設定
  batchSize: 50,
  loadDelay: 100,
  maxConcurrentLoads: 5,
  
  // UI設定
  enableVirtualScroll: true,
  itemHeight: 80,
  containerPadding: 10,
  
  // デバッグ設定
  enableLogging: true,
  logLevel: 'info', // 'debug', 'info', 'warn', 'error'
  enablePerformanceTracking: true,
  
  // VoidCore設定
  voidCoreVersion: '14.0',
  messageTimeout: 30000,
  retryAttempts: 3
}
```

### デバッグユーティリティ
```javascript
// VoidCore統合状態の確認
window.debugVoidCoreIntegration = function() {
  return {
    voidCoreUI: !!window.voidCoreUI,
    pluginPalette: !!window.pluginPalette,
    loadedPlugins: window.pluginPalette?.plugins?.length || 0,
    activeElements: document.querySelectorAll('.voidcore-ui-element').length,
    integrationHealth: window.integrationMonitor?.getHealthReport(),
    performanceMetrics: {
      initializationTime: window.voidCoreInitTime,
      pluginLoadTime: window.pluginLoadTime,
      memoryUsage: performance.memory
    }
  }
}
```

---

## 📝 関連ドキュメント

- [Architecture Overview](./overview.md) - システム全体アーキテクチャ
- [Message System](./message-system.md) - メッセージシステム詳細
- [Plugin Interface](./plugin-interface.md) - IPluginインターフェース仕様
- [Performance](./performance.md) - パフォーマンス最適化ガイド

---

**Last Updated**: 2025-07-09  
**Author**: VoidFlow Development Team  
**VoidCore Version**: v14.0+