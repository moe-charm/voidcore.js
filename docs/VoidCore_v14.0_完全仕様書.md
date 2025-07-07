# 🌟 VoidCore v14.0 完全仕様書

## 📋 目次
- [概要](#概要)
- [アーキテクチャ](#アーキテクチャ)
- [Core API リファレンス](#core-api-リファレンス)
- [メッセージシステム](#メッセージシステム)
- [プラグインシステム](#プラグインシステム)
- [統合システム](#統合システム)
- [互換性](#互換性)
- [使用例](#使用例)

---

## 🎯 概要

### VoidCore v14.0 とは
**VoidCore v14.0** は ChatGPT提案の統一Intentアーキテクチャを実装した、純粋メッセージベースの JavaScript フレームワークです。

### ✨ 主要特徴
- 🎯 **統一Intentシステム** - ChatGPT提案の `sendIntent()` API
- 🧩 **プラグインアーキテクチャ** - IPlugin/ICorePlugin統一インターフェース
- 📨 **4種類メッセージ分類** - IntentRequest/IntentResponse/Notice/Proposal
- 🔄 **完全下位互換性** - v11.0-v13.0 API全対応
- 🌊 **VoidFlow統合** - ノードベースフロー統合
- 📡 **マルチチャンネル** - 高性能並列処理
- ⚡ **動的プラグイン管理** - 実行時作成・削除・親子関係変更

### 📊 技術仕様
```
バージョン: v14.0
言語: ES6+ JavaScript (モジュール)
依存関係: なし (Pure JavaScript)
ブラウザ対応: ES6 Module対応ブラウザ
Node.js対応: ES Module対応版
ライセンス: MIT
```

---

## 🏗️ アーキテクチャ

### 📐 システム構成図
```
🎯 VoidCore v14.0 アーキテクチャ
├── 📱 VoidCore (コアシステム)
│   ├── 🎯 統一Intentシステム
│   ├── 📨 メッセージ分類システム (4種類)
│   ├── 📡 ChannelManager (マルチチャンネル)
│   ├── ⚡ 動的プラグイン管理
│   └── 🔄 下位互換レイヤー
│
├── 🧩 プラグインシステム
│   ├── 🔷 IPlugin (基本プラグイン)
│   ├── 🏢 ICorePlugin (コアプラグイン)
│   └── 🌊 VoidFlowNodePlugin (統合プラグイン)
│
├── 📨 メッセージシステム
│   ├── IntentRequest (要求)
│   ├── IntentResponse (応答)
│   ├── Notice (通知)
│   └── Proposal (提案)
│
└── 🔌 統合システム
    ├── 🌊 VoidFlow統合
    ├── ⚡ CoreFusion (コア融合)
    └── 📊 SimpleMessagePool (メッセージプール)
```

### 🏛️ 設計哲学
1. **メッセージ純粋主義** - 全ての通信はメッセージ経由
2. **プラグイン第一** - 機能はプラグインとして実装
3. **Intent統一** - ChatGPT提案の統一操作モデル
4. **互換性保証** - 既存システムを壊さない
5. **漸進的革新** - 段階的改善と進化

---

## 📚 Core API リファレンス

### 🎯 VoidCore クラス

#### コンストラクタ
```javascript
import { VoidCore } from './src/voidcore.js'

const voidCore = new VoidCore(transport = null)
```

### 🎯 Phase R 統一Intentシステム

#### `sendIntent(intentName, data, options)` ⭐ **新API**
ChatGPT提案の統一操作インターフェース

```javascript
// システムIntent
const result = await voidCore.sendIntent('system.createPlugin', {
  type: 'calculator',
  displayName: 'Calculator Plugin'
})

const stats = await voidCore.sendIntent('system.getStats')

// プラグインIntent  
await voidCore.sendIntent('plugin.getInfo', { pluginId: 'calc-123' })

// カスタムIntent
await voidCore.sendIntent('workflow.execute', { workflowId: 'wf-456' })
```

**パラメータ:**
- `intentName` (string) - Intent名 ("system.*", "plugin.*", カスタム)
- `data` (Object) - Intentデータ
- `options` (Object) - オプション設定
  - `correlationId` (string) - 因果関係追跡ID
  - `causationId` (string) - 前メッセージとの関連

**戻り値:** Promise<Object> - Intent処理結果

#### 📋 システムIntent一覧
| Intent名 | 説明 | データ |
|---------|------|--------|
| `system.createPlugin` | プラグイン作成 | `{type, displayName, config}` |
| `system.reparentPlugin` | 親子関係変更 | `{childId, newParentId}` |
| `system.destroyPlugin` | プラグイン削除 | `{pluginId}` |
| `system.getStats` | システム統計取得 | `{}` |

### 📨 メッセージシステム

#### `publish(message)` 
メッセージ発行

```javascript
import { Message } from './src/message.js'

// Notice発行
const notice = Message.notice('user.login', { userId: 'user123' })
await voidCore.publish(notice)

// Intent発行 (Phase R統一)
const intent = Message.intent('system.createPlugin', { type: 'timer' })
await voidCore.publish(intent)
```

#### `subscribe(type, handler)`
メッセージ購読

```javascript
// Notice購読
await voidCore.subscribe('Notice', (message) => {
  if (message.event_name === 'user.login') {
    console.log('User logged in:', message.payload)
  }
})

// IntentRequest購読  
await voidCore.subscribe('IntentRequest', (message) => {
  console.log('Intent received:', message.intent)
})
```

### 🔧 システム管理

#### `setTransport(transport)`
トランスポート層変更

```javascript
await voidCore.setTransport(newTransport)
```

#### `enableMultiChannel(config)`
マルチチャンネルモード有効化

```javascript
voidCore.enableMultiChannel({
  channels: 4,
  loadBalancing: 'round-robin'
})
```

#### `registerPlugin(plugin)`
プラグイン登録

```javascript
import { IPlugin } from './src/plugin-interface.js'

class MyPlugin extends IPlugin {
  async handleMessage(message) {
    // メッセージ処理
  }
}

const plugin = new MyPlugin({ type: 'custom', displayName: 'My Plugin' })
voidCore.registerPlugin(plugin)
```

### 📊 統計・情報取得

#### `getStats()`
基本統計取得

```javascript
const stats = voidCore.getStats()
// { subscriberCount, publishedMessages, errors, ... }
```

#### `getSystemStats()` ⭐ **新API**
システム統計取得

```javascript
const systemStats = voidCore.getSystemStats()
/* {
  pendingRequests: 0,
  maxDepth: 10,
  resourceUsage: {},
  systemPlugins: 2,
  dynamicPlugins: 3,
  hierarchyStats: {
    rootPlugins: 1,
    maxHierarchyLevel: 3,
    averageChildren: 2.5
  }
} */
```

---

## 📨 メッセージシステム

### 🏷️ メッセージ分類 (4種類)

#### 1. **IntentRequest** - 要求メッセージ
```javascript
// 統一Intent (Phase R)
const intent = Message.intent('system.createPlugin', { type: 'timer' })

// 従来型Intent (v12.0互換)
const request = Message.intentRequest('plugin-manager', 'createPlugin', data)
```

#### 2. **IntentResponse** - 応答メッセージ
```javascript
const response = Message.intentResponse('createPlugin', { 
  status: 'success', 
  pluginId: 'timer-123' 
})
```

#### 3. **Notice** - 通知メッセージ (1対多)
```javascript
const notice = Message.notice('plugin.created', {
  pluginId: 'timer-123',
  type: 'timer',
  timestamp: Date.now()
})
```

#### 4. **Proposal** - 提案メッセージ (非強制)
```javascript
const proposal = Message.proposal('ui-manager', 'updateTheme', {
  theme: 'dark',
  reason: 'user_preference'
})
```

### 📋 Message クラス API

#### コンストラクタ
```javascript
const message = new Message(type, payload, category = 'Notice')
```

#### ファクトリメソッド
```javascript
// Phase R統一Intent ⭐
Message.intent(intentName, data, options)

// v12.0メッセージ種別
Message.intentRequest(target, action, payload)
Message.intentResponse(action, payload)  
Message.notice(event_name, payload)
Message.proposal(target_plugin, suggestion, payload)
```

#### ユーティリティメソッド
```javascript
message.withSource(source)        // ソース情報追加
message.withTimestamp(timestamp)  // タイムスタンプ設定
message.isValid()                 // 妥当性確認
message.getDescription()          // 説明文生成
message.toJSON()                  // JSON変換
message.toLogString()             // ログ用短縮表現
```

---

## 🧩 プラグインシステム

### 🔷 IPlugin 基本プラグイン

#### インターフェース定義
```javascript
import { IPlugin } from './src/plugin-interface.js'

class MyPlugin extends IPlugin {
  constructor(config) {
    super(config) // id, type, parent, isCore, displayName
  }

  async handleMessage(message) {
    // 統一メッセージハンドラー
    if (message.category === 'IntentRequest') {
      return await this.handleIntent(message)
    }
    return await this.processMessage(message)
  }

  async handleIntent(message) {
    // Intent処理
    switch (message.intent) {
      case 'plugin.getInfo':
        return await this.handleGetInfo(message)
      default:
        return await this.handleCustomIntent(message)
    }
  }
}
```

#### プラグイン作成
```javascript
const plugin = new MyPlugin({
  id: 'my-plugin-001',
  type: 'utility',
  displayName: 'My Utility Plugin',
  metadata: { version: '1.0.0' }
})
```

### 🏢 ICorePlugin コアプラグイン

#### 特権機能
```javascript
import { ICorePlugin } from './src/plugin-interface.js'

class MyCorePlugin extends ICorePlugin {
  constructor(config) {
    super(config) // isCore: true 自動設定
  }

  async handleCustomIntent(message) {
    switch (message.intent) {
      case 'system.createPlugin':
        return await this.handleCreatePlugin(message)
      case 'system.reparentPlugin':  
        return await this.handleReparentPlugin(message)
      default:
        return await super.handleCustomIntent(message)
    }
  }
}
```

#### コア専用メソッド
```javascript
corePlugin.getChildren()           // 子プラグインID一覧
corePlugin.getChildCount()         // 管理プラグイン数
corePlugin.addRoute(pattern, target) // ルーティング追加
```

### 🛠️ プラグインユーティリティ

#### 型判定
```javascript
import { isCorePlugin, createPlugin } from './src/plugin-interface.js'

if (isCorePlugin(plugin)) {
  console.log('This is a core plugin')
}
```

#### プラグインファクトリ
```javascript
// 通常プラグイン作成
const plugin = createPlugin({
  type: 'calculator',
  displayName: 'Calculator'
})

// コアプラグイン作成
const corePlugin = createPlugin({
  type: 'system-manager',
  isCore: true
})
```

---

## 🔌 統合システム

### 🌊 VoidFlow統合

#### VoidFlowNodePlugin
```javascript
import { VoidFlowNodePlugin } from './src/voidflow-node-plugin.js'

const nodePlugin = new VoidFlowNodePlugin({
  nodeType: 'input.text',
  displayName: 'Text Input Node',
  inputs: ['trigger'],
  outputs: ['text', 'length']
})
```

#### メッセージアダプター
```javascript
import { voidFlowAdapter } from './src/voidflow-message-adapter.js'

// VoidPacket → VoidCore Message
const message = voidFlowAdapter.adaptVoidPacketToMessage(voidPacket)

// VoidCore Message → VoidPacket  
const voidPacket = voidFlowAdapter.adaptMessageToVoidPacket(message)
```

### ⚡ CoreFusion コア融合

#### 複数コア統合
```javascript
import { CoreFusion } from './src/core-fusion.js'

const fusion = new CoreFusion()
await fusion.addCore('primary', primaryCore)
await fusion.addCore('secondary', secondaryCore)

// 統合メッセージ配信
await fusion.broadcastToAllCores(message)
```

### 📊 SimpleMessagePool

#### バッチメッセージ処理
```javascript
const messages = [message1, message2, message3]
const result = await voidCore.publishBatch(messages)

console.log(`Processed: ${result.processedCount} messages`)
console.log(`Time: ${result.processingTime}ms`)
```

---

## 🔄 互換性

### v11.0 互換性
```javascript
// v11.0 API (非推奨だが動作)
voidCore.addSubscriber('type', handler)
voidCore.publishMessage(message)
```

### v12.0 互換性  
```javascript
// v12.0 メッセージ分類システム
const intent = Message.intentRequest('target', 'action', payload)
const notice = Message.notice('event', payload)
```

### v13.0 互換性
```javascript
// v13.0 Transport/Multi-channel
await voidCore.setTransport(transport)
voidCore.enableMultiChannel()
```

---

## 📖 使用例

### 🚀 基本的な使用例

#### 1. セットアップ
```javascript
import { VoidCore } from './src/voidcore.js'
import { Message } from './src/message.js'

const voidCore = new VoidCore()

// ログ要素設定
voidCore.setLogElement(document.getElementById('log'))
```

#### 2. Intent操作 (Phase R)
```javascript
// プラグイン作成
const result = await voidCore.sendIntent('system.createPlugin', {
  type: 'calculator',
  displayName: 'Calculator Plugin',
  config: { precision: 10 }
})

console.log('Plugin created:', result.pluginId)

// システム統計取得
const stats = await voidCore.sendIntent('system.getStats')
console.log('System stats:', stats)
```

#### 3. メッセージ購読・発行
```javascript
// Notice購読
await voidCore.subscribe('Notice', (message) => {
  console.log('Notice received:', message.event_name, message.payload)
})

// Notice発行
const notice = Message.notice('calculation.completed', {
  result: 42,
  operation: 'multiply',
  operands: [6, 7]
})
await voidCore.publish(notice)
```

### 🧩 プラグイン開発例

#### カスタムプラグイン作成
```javascript
import { IPlugin } from './src/plugin-interface.js'

class CalculatorPlugin extends IPlugin {
  constructor(config) {
    super({
      ...config,
      type: 'calculator',
      displayName: 'Calculator Plugin'
    })
    
    this.precision = config.precision || 10
  }

  async handleIntent(message) {
    switch (message.intent) {
      case 'calculator.add':
        return await this.add(message.payload)
      case 'calculator.multiply':
        return await this.multiply(message.payload)
      default:
        return await super.handleIntent(message)
    }
  }

  async add({ a, b }) {
    const result = Number((a + b).toFixed(this.precision))
    
    // 結果をNoticeで通知
    const notice = Message.notice('calculation.completed', {
      operation: 'add',
      operands: [a, b],
      result: result
    })
    await this.core.publish(notice)
    
    return { result }
  }
  
  async multiply({ a, b }) {
    const result = Number((a * b).toFixed(this.precision))
    
    const notice = Message.notice('calculation.completed', {
      operation: 'multiply', 
      operands: [a, b],
      result: result
    })
    await this.core.publish(notice)
    
    return { result }
  }
}

// プラグイン登録
const calculator = new CalculatorPlugin({ precision: 5 })
voidCore.registerPlugin(calculator)

// プラグイン使用
const addResult = await voidCore.sendIntent('calculator.add', { a: 10, b: 20 })
console.log('Add result:', addResult.result) // 30
```

### 🌊 VoidFlow統合例

#### VoidFlowノードプラグイン
```javascript
import { VoidFlowNodePlugin } from './src/voidflow-node-plugin.js'

const textInputNode = new VoidFlowNodePlugin({
  nodeType: 'input.text',
  displayName: 'Text Input',
  inputs: ['trigger'],
  outputs: ['text', 'length'],
  category: 'input',
  icon: '📝'
})

// ノード実行関数定義
textInputNode.setExecutionFunction(`
  function execute(inputs, context) {
    const text = context.config.defaultText || 'Hello World'
    
    return {
      text: text,
      length: text.length
    }
  }
`)

// VoidCoreに登録
voidCore.registerPlugin(textInputNode)
```

---

## 📊 パフォーマンス

### ベンチマーク結果
```
メッセージ処理: ~10,000 msg/sec
Intent処理: ~5,000 intent/sec  
プラグイン登録: ~1,000 plugin/sec
メモリ使用量: ~2MB (基本構成)
```

### 最適化設定
```javascript
// マルチチャンネル有効化
voidCore.enableMultiChannel({
  channels: 4,
  loadBalancing: 'least-connections'
})

// メッセージプール設定
voidCore.resetMessagePoolStats()
```

---

## 🚀 まとめ

**VoidCore v14.0** は ChatGPT提案の統一Intentアーキテクチャを実装した、次世代のメッセージベースフレームワークです。

### ✨ 主要な進歩
- 🎯 **統一Intent操作** - `sendIntent()` による簡潔なAPI
- 🧩 **プラグインアーキテクチャ** - IPlugin/ICorePlugin標準化
- 🔄 **完全下位互換性** - 既存システム保護
- 🌊 **VoidFlow統合** - ノードベース統合

### 🎯 次のステップ
1. **Phase S1**: コアテスト完了・安定化
2. **Phase S2**: VoidFlow環境移植  
3. **Phase S3**: 汎用システム実現

---

*Generated: 2025-01-07*  
*VoidCore v14.0 - ChatGPT統一Intentアーキテクチャ*