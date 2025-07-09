# 🔌 Plugin Development Guide

> **VoidFlow プラグイン開発完全ガイド** - IPlugin準拠のプラグイン作成から配布まで

## 📋 概要

VoidFlowのプラグインは、VoidCore v14.0のIPluginインターフェースに準拠したモジュールです。このガイドでは、プラグインの作成から配布まで、開発プロセス全体を説明します。

## 🎯 プラグインの基本構造

### 1. プラグインデータ形式
```javascript
const pluginData = {
  // 基本情報
  id: "unique-plugin-id",
  name: "Plugin Name",
  displayName: "🎨 Display Name",
  version: "1.0.0",
  author: "Your Name",
  description: "Plugin description",
  
  // 分類・属性
  category: "UI", // UI, Logic, Data, Network, AI, Media, Storage, Utility, Visualization, Workflow
  tags: ["tag1", "tag2", "tag3"],
  type: "ui.button", // プラグインタイプ
  priority: "high", // high, medium, low
  
  // パフォーマンス情報
  performance: {
    memory: "low",    // none, low, medium, high
    cpu: "low",       // none, low, medium, high
    network: "none"   // none, low, medium, high
  },
  
  // 詳細属性
  attributes: {
    category: "UI",
    subcategory: "Input",
    tags: ["button", "interactive", "ui"],
    priority: "high",
    experimental: false,
    deprecated: false,
    hidden: false,
    performance: { /* 同上 */ },
    ui: {
      icon: "🎨",
      color: "#4fc1ff",
      size: "medium"
    },
    compatibility: {
      voidcore: "14.0+",
      browser: "modern",
      mobile: true
    }
  },
  
  // 設定
  config: {
    // デフォルト設定値
  },
  
  // 入出力定義
  inputs: [
    {
      name: "input1",
      type: "string",
      description: "Input description"
    }
  ],
  
  outputs: [
    {
      name: "output1",
      type: "string",
      description: "Output description"
    }
  ],
  
  // 依存関係
  dependencies: ["dependency1", "dependency2"]
}
```

### 2. IPlugin準拠クラス
```javascript
import { IPlugin } from '../../src/interfaces/plugin-interface.js'

class MyCustomPlugin extends IPlugin {
  constructor(pluginData) {
    super({
      id: pluginData.id,
      type: pluginData.type,
      parent: window.voidCoreUI,
      displayName: pluginData.displayName,
      metadata: pluginData
    })
    
    this.pluginData = pluginData
    this.position = { x: 100, y: 100 }
    this.properties = pluginData.config || {}
    this.state = 'inactive'
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
  
  // ============================================
  // カスタムロジック
  // ============================================
  
  async executePlugin(input) {
    this.log(`🚀 Executing plugin: ${this.displayName}`)
    
    try {
      // プラグインタイプに応じた処理
      const result = await this.performPluginLogic(input)
      
      this.state = 'completed'
      return result
      
    } catch (error) {
      this.state = 'error'
      this.log(`❌ Plugin execution failed: ${error.message}`)
      
      return {
        type: 'error',
        error: error.message,
        pluginId: this.id
      }
    }
  }
  
  async performPluginLogic(input) {
    // ここに具体的なプラグインロジックを実装
    return {
      type: 'success',
      value: 'Plugin executed successfully',
      pluginId: this.id,
      timestamp: Date.now()
    }
  }
  
  // 設定更新
  async handleUpdateConfig(message) {
    if (message.payload && message.payload.config) {
      this.properties = { ...this.properties, ...message.payload.config }
      this.log(`⚙️ Config updated: ${JSON.stringify(message.payload.config)}`)
    }
    return { success: true, config: this.properties }
  }
  
  // 情報取得
  async handleGetInfo(message) {
    return {
      id: this.id,
      type: this.type,
      displayName: this.displayName,
      metadata: this.metadata,
      position: this.position,
      properties: this.properties,
      state: this.state,
      status: this.status
    }
  }
  
  // 破棄処理
  async handleDestroy(message) {
    this.log(`🗑️ Plugin destroyed: ${this.id}`)
    this.state = 'destroyed'
    return { success: true }
  }
}
```

## 🛠️ プラグインタイプ別実装

### 1. UI Button Plugin
```javascript
class UIButtonPlugin extends IPlugin {
  constructor(pluginData) {
    super(pluginData)
    this.clickCount = 0
    this.element = null
  }
  
  async executePlugin(input) {
    this.clickCount++
    
    // UI要素の更新
    if (this.element) {
      this.element.textContent = `${this.properties.text} (${this.clickCount})`
    }
    
    return {
      type: 'event',
      value: 'button_clicked',
      clickCount: this.clickCount,
      timestamp: Date.now(),
      pluginId: this.id
    }
  }
  
  createUIElement() {
    this.element = document.createElement('button')
    this.element.textContent = this.properties.text || 'Click Me'
    this.element.className = 'voidflow-button'
    
    this.element.addEventListener('click', () => {
      this.executePlugin({})
    })
    
    return this.element
  }
}
```

### 2. Logic Calculator Plugin
```javascript
class LogicCalculatorPlugin extends IPlugin {
  constructor(pluginData) {
    super(pluginData)
    this.calculator = new SafeCalculator()
  }
  
  async executePlugin(input) {
    const expression = input?.expression || this.properties.expression || '2+2'
    
    try {
      const result = this.calculator.evaluate(expression)
      
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
        error: `Calculation error: ${error.message}`,
        expression: expression,
        pluginId: this.id
      }
    }
  }
}

// 安全な計算エンジン
class SafeCalculator {
  constructor() {
    this.allowedOperators = ['+', '-', '*', '/', '(', ')', '.']
    this.mathFunctions = ['sin', 'cos', 'tan', 'sqrt', 'log', 'exp']
  }
  
  evaluate(expression) {
    // 安全性チェック
    if (!this.isSafeExpression(expression)) {
      throw new Error('Unsafe expression')
    }
    
    // 数式評価（実装では適切なパーサーを使用）
    return Function('"use strict"; return (' + expression + ')')()
  }
  
  isSafeExpression(expr) {
    // 危険な文字列をチェック
    const dangerousPatterns = [
      /eval/, /function/, /Function/, /setTimeout/, /setInterval/,
      /document/, /window/, /global/, /process/, /require/
    ]
    
    return !dangerousPatterns.some(pattern => pattern.test(expr))
  }
}
```

### 3. Data JSON Plugin
```javascript
class DataJSONPlugin extends IPlugin {
  constructor(pluginData) {
    super(pluginData)
    this.parser = new JSONParser()
  }
  
  async executePlugin(input) {
    const jsonString = input?.jsonString || this.properties.jsonData || '{}'
    
    try {
      const parsed = this.parser.parse(jsonString)
      
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
  
  // JSON変換・検証
  async handleCustomIntent(message) {
    switch (message.intent) {
      case 'json.validate':
        return await this.validateJSON(message.payload)
      case 'json.format':
        return await this.formatJSON(message.payload)
      case 'json.minify':
        return await this.minifyJSON(message.payload)
      default:
        return await super.handleCustomIntent(message)
    }
  }
  
  async validateJSON(payload) {
    try {
      JSON.parse(payload.jsonString)
      return { valid: true, message: 'Valid JSON' }
    } catch (error) {
      return { valid: false, message: error.message }
    }
  }
  
  async formatJSON(payload) {
    try {
      const parsed = JSON.parse(payload.jsonString)
      const formatted = JSON.stringify(parsed, null, 2)
      return { formatted: formatted }
    } catch (error) {
      return { error: error.message }
    }
  }
}
```

### 4. Network HTTP Plugin
```javascript
class NetworkHTTPPlugin extends IPlugin {
  constructor(pluginData) {
    super(pluginData)
    this.httpClient = new HTTPClient()
  }
  
  async executePlugin(input) {
    const url = input?.url || this.properties.url || 'https://httpbin.org/json'
    const method = input?.method || this.properties.method || 'GET'
    const headers = input?.headers || this.properties.headers || {}
    const body = input?.body || this.properties.body
    
    try {
      const response = await this.httpClient.request({
        url: url,
        method: method,
        headers: headers,
        body: body,
        timeout: this.properties.timeout || 30000
      })
      
      return {
        type: 'http_response',
        value: response.data,
        url: url,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
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
}

// HTTP Client
class HTTPClient {
  constructor() {
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'VoidFlow-Plugin/1.0'
    }
  }
  
  async request(options) {
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        ...this.defaultHeaders,
        ...options.headers
      }
    }
    
    if (options.body && options.method !== 'GET') {
      requestOptions.body = typeof options.body === 'string' 
        ? options.body 
        : JSON.stringify(options.body)
    }
    
    const response = await fetch(options.url, requestOptions)
    
    let data
    const contentType = response.headers.get('content-type')
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }
    
    return {
      data: data,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers),
      ok: response.ok
    }
  }
}
```

## 🔧 プラグイン設定システム

### 設定スキーマ定義
```javascript
const pluginConfigSchema = {
  type: "object",
  properties: {
    text: {
      type: "string",
      default: "Default Text",
      description: "Button text to display"
    },
    color: {
      type: "string",
      default: "#4fc1ff",
      description: "Button color",
      format: "color"
    },
    size: {
      type: "string",
      enum: ["small", "medium", "large"],
      default: "medium",
      description: "Button size"
    },
    enabled: {
      type: "boolean",
      default: true,
      description: "Enable/disable button"
    },
    timeout: {
      type: "number",
      minimum: 1000,
      maximum: 60000,
      default: 30000,
      description: "Request timeout in milliseconds"
    }
  },
  required: ["text"]
}
```

### 動的設定UI生成
```javascript
class PluginConfigUI {
  constructor(plugin, schema) {
    this.plugin = plugin
    this.schema = schema
    this.configElement = null
  }
  
  createConfigUI() {
    this.configElement = document.createElement('div')
    this.configElement.className = 'plugin-config'
    
    Object.entries(this.schema.properties).forEach(([key, propSchema]) => {
      const fieldElement = this.createFieldElement(key, propSchema)
      this.configElement.appendChild(fieldElement)
    })
    
    return this.configElement
  }
  
  createFieldElement(key, schema) {
    const fieldDiv = document.createElement('div')
    fieldDiv.className = 'config-field'
    
    const label = document.createElement('label')
    label.textContent = schema.description || key
    label.htmlFor = `config-${key}`
    
    const input = this.createInputElement(key, schema)
    input.id = `config-${key}`
    
    fieldDiv.appendChild(label)
    fieldDiv.appendChild(input)
    
    return fieldDiv
  }
  
  createInputElement(key, schema) {
    const currentValue = this.plugin.properties[key] || schema.default
    
    switch (schema.type) {
      case 'string':
        if (schema.enum) {
          return this.createSelectElement(key, schema, currentValue)
        } else if (schema.format === 'color') {
          return this.createColorElement(key, schema, currentValue)
        } else {
          return this.createTextElement(key, schema, currentValue)
        }
      case 'number':
        return this.createNumberElement(key, schema, currentValue)
      case 'boolean':
        return this.createCheckboxElement(key, schema, currentValue)
      default:
        return this.createTextElement(key, schema, currentValue)
    }
  }
  
  createTextElement(key, schema, value) {
    const input = document.createElement('input')
    input.type = 'text'
    input.value = value
    input.addEventListener('change', (e) => {
      this.updatePluginConfig(key, e.target.value)
    })
    return input
  }
  
  createNumberElement(key, schema, value) {
    const input = document.createElement('input')
    input.type = 'number'
    input.value = value
    input.min = schema.minimum
    input.max = schema.maximum
    input.addEventListener('change', (e) => {
      this.updatePluginConfig(key, Number(e.target.value))
    })
    return input
  }
  
  createCheckboxElement(key, schema, value) {
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.checked = value
    input.addEventListener('change', (e) => {
      this.updatePluginConfig(key, e.target.checked)
    })
    return input
  }
  
  createSelectElement(key, schema, value) {
    const select = document.createElement('select')
    
    schema.enum.forEach(option => {
      const optionElement = document.createElement('option')
      optionElement.value = option
      optionElement.textContent = option
      optionElement.selected = option === value
      select.appendChild(optionElement)
    })
    
    select.addEventListener('change', (e) => {
      this.updatePluginConfig(key, e.target.value)
    })
    
    return select
  }
  
  createColorElement(key, schema, value) {
    const input = document.createElement('input')
    input.type = 'color'
    input.value = value
    input.addEventListener('change', (e) => {
      this.updatePluginConfig(key, e.target.value)
    })
    return input
  }
  
  async updatePluginConfig(key, value) {
    const updateMessage = {
      intent: 'plugin.updateConfig',
      payload: {
        config: { [key]: value }
      }
    }
    
    await this.plugin.handleMessage(updateMessage)
  }
}
```

## 🧪 プラグインテスト

### 単体テスト
```javascript
describe('CustomPlugin', () => {
  let plugin
  
  beforeEach(() => {
    const pluginData = {
      id: 'test-plugin',
      name: 'Test Plugin',
      type: 'test',
      config: { text: 'Test' }
    }
    
    plugin = new CustomPlugin(pluginData)
  })
  
  describe('executePlugin', () => {
    it('should execute successfully', async () => {
      const input = { value: 'test input' }
      const result = await plugin.executePlugin(input)
      
      expect(result.type).toBe('success')
      expect(result.pluginId).toBe('test-plugin')
      expect(result.value).toBeDefined()
    })
    
    it('should handle errors gracefully', async () => {
      const input = { value: null }
      const result = await plugin.executePlugin(input)
      
      expect(result.type).toBe('error')
      expect(result.error).toBeDefined()
    })
  })
  
  describe('handleUpdateConfig', () => {
    it('should update configuration', async () => {
      const message = {
        intent: 'plugin.updateConfig',
        payload: {
          config: { text: 'Updated Text' }
        }
      }
      
      const result = await plugin.handleMessage(message)
      
      expect(result.success).toBe(true)
      expect(plugin.properties.text).toBe('Updated Text')
    })
  })
})
```

### 統合テスト
```javascript
describe('Plugin Integration', () => {
  let pluginPalette
  let mockVoidCoreUI
  
  beforeEach(() => {
    mockVoidCoreUI = {
      createUIElement: jest.fn(),
      registerPlugin: jest.fn()
    }
    
    window.voidCoreUI = mockVoidCoreUI
    
    pluginPalette = new PluginPalettePlugin({
      width: 300,
      height: 400
    })
  })
  
  it('should create and add plugin to canvas', async () => {
    const plugin = {
      id: 'test-plugin',
      name: 'Test Plugin',
      type: 'test',
      displayName: 'Test Plugin'
    }
    
    await pluginPalette.addPluginToCanvas(plugin)
    
    expect(mockVoidCoreUI.createUIElement).toHaveBeenCalled()
    expect(pluginPalette.usageData['test-plugin']).toBe(1)
  })
})
```

## 📦 プラグイン配布

### 1. プラグインパッケージ作成
```javascript
// package.json
{
  "name": "voidflow-custom-plugin",
  "version": "1.0.0",
  "description": "Custom VoidFlow plugin",
  "main": "plugin.js",
  "keywords": ["voidflow", "plugin", "ui"],
  "author": "Your Name",
  "license": "MIT",
  "voidflow": {
    "version": "1.0.0",
    "category": "UI",
    "compatibility": {
      "voidcore": "14.0+",
      "voidflow": "1.0.0+"
    }
  }
}
```

### 2. プラグインマニフェスト
```javascript
// plugin.manifest.json
{
  "id": "custom-plugin",
  "name": "Custom Plugin",
  "version": "1.0.0",
  "description": "A custom VoidFlow plugin",
  "author": "Your Name",
  "homepage": "https://github.com/yourname/voidflow-custom-plugin",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourname/voidflow-custom-plugin.git"
  },
  "main": "plugin.js",
  "files": [
    "plugin.js",
    "plugin.css",
    "assets/"
  ],
  "permissions": [
    "network",
    "storage"
  ],
  "dependencies": {
    "voidcore": "^14.0.0"
  }
}
```

### 3. ビルド・配布スクリプト
```javascript
// build.js
const fs = require('fs')
const path = require('path')
const { rollup } = require('rollup')

async function buildPlugin() {
  const inputOptions = {
    input: 'src/plugin.js',
    external: ['voidcore']
  }
  
  const outputOptions = {
    file: 'dist/plugin.js',
    format: 'es',
    exports: 'named'
  }
  
  const bundle = await rollup(inputOptions)
  await bundle.write(outputOptions)
  
  console.log('✅ Plugin built successfully')
}

// パッケージ作成
function createPackage() {
  const packageData = {
    plugin: fs.readFileSync('dist/plugin.js', 'utf8'),
    manifest: JSON.parse(fs.readFileSync('plugin.manifest.json', 'utf8')),
    styles: fs.readFileSync('plugin.css', 'utf8'),
    assets: {}
  }
  
  fs.writeFileSync('dist/plugin.vpkg', JSON.stringify(packageData))
  console.log('📦 Package created: plugin.vpkg')
}

buildPlugin().then(createPackage)
```

## 🔍 デバッグ・トラブルシューティング

### デバッグヘルパー
```javascript
class PluginDebugger {
  constructor(plugin) {
    this.plugin = plugin
    this.logs = []
    this.performance = []
  }
  
  log(message, level = 'info') {
    const logEntry = {
      timestamp: Date.now(),
      level: level,
      message: message,
      pluginId: this.plugin.id
    }
    
    this.logs.push(logEntry)
    console.log(`[${level.toUpperCase()}] ${this.plugin.id}: ${message}`)
  }
  
  measurePerformance(name, fn) {
    const start = performance.now()
    const result = fn()
    const end = performance.now()
    
    this.performance.push({
      name: name,
      duration: end - start,
      timestamp: Date.now()
    })
    
    return result
  }
  
  getDebugInfo() {
    return {
      plugin: {
        id: this.plugin.id,
        type: this.plugin.type,
        state: this.plugin.state,
        properties: this.plugin.properties
      },
      logs: this.logs,
      performance: this.performance,
      memory: this.getMemoryUsage()
    }
  }
  
  getMemoryUsage() {
    if (performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      }
    }
    return null
  }
}
```

### よくある問題と解決方法

#### 1. IPlugin Interface エラー
```javascript
// 問題: IPlugin interface not implemented
// 解決: 必須メソッドを実装
class FixedPlugin extends IPlugin {
  async handleMessage(message) {
    // 必須実装
  }
  
  async handleIntent(message) {
    return await this.handleMessage(message)
  }
  
  async processMessage(message) {
    return await this.handleMessage(message)
  }
}
```

#### 2. 設定更新エラー
```javascript
// 問題: Config update fails
// 解決: 適切な検証を追加
async handleUpdateConfig(message) {
  if (!message.payload || !message.payload.config) {
    throw new Error('Invalid config payload')
  }
  
  // 設定検証
  const validatedConfig = this.validateConfig(message.payload.config)
  this.properties = { ...this.properties, ...validatedConfig }
  
  return { success: true, config: this.properties }
}
```

#### 3. メモリリーク
```javascript
// 問題: Memory leaks
// 解決: 適切なクリーンアップ
async handleDestroy(message) {
  // イベントリスナーの削除
  if (this.element) {
    this.element.removeEventListener('click', this.clickHandler)
  }
  
  // タイマーの削除
  if (this.timer) {
    clearInterval(this.timer)
  }
  
  // 参照の削除
  this.element = null
  this.properties = null
  
  return { success: true }
}
```

## 📚 ベストプラクティス

### 1. エラーハンドリング
```javascript
// 良い例
async executePlugin(input) {
  try {
    const result = await this.processInput(input)
    return {
      type: 'success',
      value: result,
      pluginId: this.id
    }
  } catch (error) {
    this.log(`Execution failed: ${error.message}`, 'error')
    return {
      type: 'error',
      error: error.message,
      pluginId: this.id
    }
  }
}
```

### 2. 非同期処理
```javascript
// 良い例
async executePlugin(input) {
  // 非同期処理のタイムアウト
  const timeout = this.properties.timeout || 30000
  
  const result = await Promise.race([
    this.performAsyncOperation(input),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), timeout)
    )
  ])
  
  return result
}
```

### 3. リソース管理
```javascript
// 良い例
class ResourceManagedPlugin extends IPlugin {
  constructor(pluginData) {
    super(pluginData)
    this.resources = new Map()
  }
  
  async acquireResource(type, config) {
    const resource = await this.createResource(type, config)
    this.resources.set(resource.id, resource)
    return resource
  }
  
  async releaseResource(resourceId) {
    const resource = this.resources.get(resourceId)
    if (resource) {
      await resource.cleanup()
      this.resources.delete(resourceId)
    }
  }
  
  async handleDestroy() {
    // すべてのリソースを解放
    for (const [id, resource] of this.resources) {
      await resource.cleanup()
    }
    this.resources.clear()
    
    return { success: true }
  }
}
```

---

## 📝 関連ドキュメント

- [Plugin Samples](./samples-catalog.md) - サンプルプラグインカタログ
- [Plugin Attributes](./attributes-system.md) - プラグイン属性システム
- [Plugin Lifecycle](./lifecycle.md) - プラグインライフサイクル
- [API Reference](../api/plugin-palette-api.md) - API仕様

---

**Last Updated**: 2025-07-09  
**Author**: VoidFlow Development Team  
**Version**: v1.0.0