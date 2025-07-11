# 📚 nyacore (旧VoidCore) v14.0 API リファレンス

## ⚠️ **重要: VoidCore → nyacore 移行完了 (2025-07-11)**

**ファイルパスが変更されました！**

```javascript
// 旧
import { VoidCore } from './src/voidcore.js'

// 新
import { VoidCore } from './src/core/nyacore.js'
```

## 🎯 Phase R 統一Intentシステム

### `sendIntent(intentName, data, options)` ⭐ **ChatGPT提案API**

**説明:** 統一Intent操作インターフェース

**シグネチャ:**
```typescript
async sendIntent(
  intentName: string, 
  data: Object = {}, 
  options: Object = {}
): Promise<Object>
```

**パラメータ:**
- `intentName` (string) - Intent名
  - システムIntent: `"system.createPlugin"`, `"system.getStats"` 等
  - プラグインIntent: `"plugin.getInfo"`, `"plugin.updateConfig"` 等  
  - カスタムIntent: 任意の名前空間
- `data` (Object) - Intentデータ
- `options` (Object) - オプション設定
  - `correlationId` (string) - 因果関係追跡ID
  - `causationId` (string) - 前メッセージとの関連

**戻り値:** `Promise<Object>` - Intent処理結果

**使用例:**
```javascript
// プラグイン作成
const result = await voidCore.sendIntent('system.createPlugin', {
  type: 'calculator',
  displayName: 'Calculator Plugin'
})

// システム統計取得
const stats = await voidCore.sendIntent('system.getStats')

// 相関ID付きIntent
await voidCore.sendIntent('custom.process', { data: 'test' }, {
  correlationId: 'req-123',
  causationId: 'msg-456'
})
```

---

## 📨 メッセージシステム API

### VoidCore メッセージ操作

#### `publish(message)`
```typescript
async publish(message: Message): Promise<number>
```
メッセージ発行

```javascript
import { Message } from './src/message.js'

const notice = Message.notice('user.login', { userId: 'user123' })
const deliveredCount = await voidCore.publish(notice)
```

#### `subscribe(type, handler)`
```typescript
async subscribe(type: string, handler: Function): Promise<string>
```
メッセージ購読

```javascript
const subscriptionId = await voidCore.subscribe('Notice', (message) => {
  console.log('Notice:', message.event_name, message.payload)
})
```

#### `unsubscribe(subscriptionId)`
```typescript
async unsubscribe(subscriptionId: string): Promise<boolean>
```
購読解除

```javascript
await voidCore.unsubscribe(subscriptionId)
```

#### `publishBatch(messages)` ⭐ **新API**
```typescript
async publishBatch(messages: Message[]): Promise<Object>
```
バッチメッセージ処理

```javascript
const messages = [message1, message2, message3]
const result = await voidCore.publishBatch(messages)
// { success: true, processedCount: 3, processingTime: 45 }
```

---

## 🧩 Message クラス API

### コンストラクタ
```typescript
constructor(type: string, payload: Object, category: string = 'Notice')
```

### ファクトリメソッド

#### `Message.intent(intentName, data, options)` ⭐ **Phase R統一**
```typescript
static intent(
  intentName: string, 
  data: Object, 
  options: Object = {}
): Message
```

ChatGPT提案の統一Intentファクトリ

```javascript
const intent = Message.intent('system.createPlugin', {
  type: 'timer',
  displayName: 'Timer Plugin'
}, {
  correlationId: 'req-789'
})
```

#### `Message.intentRequest(target, action, payload)`
```typescript
static intentRequest(target: string, action: string, payload: Object): Message
```

v12.0互換IntentRequest

```javascript
const request = Message.intentRequest('plugin-manager', 'createPlugin', {
  type: 'calculator'
})
```

#### `Message.intentResponse(action, payload)`
```typescript
static intentResponse(action: string, payload: Object): Message
```

Intent応答メッセージ

```javascript
const response = Message.intentResponse('createPlugin', {
  status: 'success',
  pluginId: 'calc-123'
})
```

#### `Message.notice(event_name, payload)`
```typescript
static notice(event_name: string, payload: Object): Message
```

通知メッセージ (1対多)

```javascript
const notice = Message.notice('plugin.created', {
  pluginId: 'calc-123',
  type: 'calculator'
})
```

#### `Message.proposal(target_plugin, suggestion, payload)`
```typescript
static proposal(
  target_plugin: string, 
  suggestion: string, 
  payload: Object
): Message
```

提案メッセージ (非強制)

```javascript
const proposal = Message.proposal('ui-manager', 'updateTheme', {
  theme: 'dark'
})
```

### インスタンスメソッド

#### `withSource(source)`
```typescript
withSource(source: string): Message
```
ソース情報追加

```javascript
message.withSource('user-interface')
```

#### `withTimestamp(timestamp)`
```typescript
withTimestamp(timestamp: number = Date.now()): Message
```
タイムスタンプ設定

```javascript
message.withTimestamp(Date.now())
```

#### `isValid()`
```typescript
isValid(): boolean
```
メッセージ妥当性確認

```javascript
if (message.isValid()) {
  await voidCore.publish(message)
}
```

#### `getDescription()`
```typescript
getDescription(): string
```
説明文生成

```javascript
console.log(message.getDescription())
// "Intent: system.createPlugin"
```

#### `toJSON()`
```typescript
toJSON(): Object
```
JSON表現取得

```javascript
const json = message.toJSON()
```

#### `toLogString()`
```typescript
toLogString(): string
```
ログ用短縮表現

```javascript
console.log(message.toLogString())
// "IntentRequest[system.createPlugin]: Intent: system.createPlugin | {...}"
```

---

## 🧩 プラグインシステム API

### IPlugin 基底クラス

#### コンストラクタ
```typescript
constructor(config: {
  id?: string,
  type?: string,
  parent?: string,
  isCore?: boolean,
  displayName?: string,
  metadata?: Object
})
```

#### プロパティ
```typescript
id: string              // プラグインID
type: string            // プラグイン種別
parent: string          // 親プラグインID
isCore: boolean         // コアプラグインフラグ
displayName: string     // 表示名
metadata: Object        // メタデータ
createdAt: number       // 作成時刻
status: string          // ステータス ('active'|'inactive'|'destroyed')
```

#### メソッド

##### `handleMessage(message)` ⭐ **統一入口**
```typescript
async handleMessage(message: Message): Promise<void>
```
統一メッセージハンドラー

```javascript
async handleMessage(message) {
  if (message.category === 'IntentRequest') {
    return await this.handleIntent(message)
  }
  return await this.processMessage(message)
}
```

##### `handleIntent(message)`
```typescript
async handleIntent(message: Message): Promise<void>
```
Intent処理エントリ

```javascript
async handleIntent(message) {
  switch (message.intent) {
    case 'plugin.getInfo':
      return await this.handleGetInfo(message)
    default:
      return await this.handleCustomIntent(message)
  }
}
```

##### `handleCustomIntent(message)`
```typescript
async handleCustomIntent(message: Message): Promise<void>
```
カスタムIntent処理 (サブクラスでオーバーライド)

##### `processMessage(message)`
```typescript
async processMessage(message: Message): Promise<void>
```
通常メッセージ処理 (サブクラスでオーバーライド)

##### `isCorePlugin()`
```typescript
isCorePlugin(): boolean
```
コアプラグイン判定

##### `getSummary()`
```typescript
getSummary(): Object
```
プラグイン情報要約

##### `log(message)`
```typescript
log(message: string): void
```
ログ出力ヘルパー

### ICorePlugin 拡張クラス

#### 追加プロパティ
```typescript
children: Set<string>           // 管理する子プラグインID
routingTable: Map<string, string> // ルーティング情報
```

#### 追加メソッド

##### `handleCreatePlugin(message)`
```typescript
async handleCreatePlugin(message: Message): Promise<void>
```
プラグイン生成処理

##### `handleReparentPlugin(message)`
```typescript
async handleReparentPlugin(message: Message): Promise<void>
```
親子関係変更処理 (戸籍異動届)

##### `handleDestroyPlugin(message)`
```typescript
async handleDestroyPlugin(message: Message): Promise<void>
```
プラグイン削除処理

##### `getChildren()`
```typescript
getChildren(): string[]
```
子プラグインID一覧取得

##### `getChildCount()`
```typescript
getChildCount(): number
```
管理プラグイン数取得

##### `addRoute(pattern, targetId)`
```typescript
addRoute(pattern: string, targetId: string): void
```
ルーティングテーブル追加

---

## 🔧 システム管理 API

### 初期化・設定

#### `setLogElement(element)`
```typescript
setLogElement(element: HTMLElement): void
```
ログ出力先設定

```javascript
voidCore.setLogElement(document.getElementById('log'))
```

#### `setTransport(transport)`
```typescript
async setTransport(transport: Object): Promise<void>
```
トランスポート層変更

```javascript
await voidCore.setTransport(newTransport)
```

### プラグイン管理

#### `registerPlugin(plugin)`
```typescript
registerPlugin(plugin: IPlugin): boolean
```
プラグイン登録

```javascript
const plugin = new MyPlugin({ type: 'utility' })
voidCore.registerPlugin(plugin)
```

#### `unregisterPlugin(pluginId)`
```typescript
unregisterPlugin(pluginId: string): boolean
```
プラグイン削除

```javascript
voidCore.unregisterPlugin('plugin-123')
```

#### `getPlugin(pluginId)`
```typescript
getPlugin(pluginId: string): IPlugin | undefined
```
プラグイン取得

```javascript
const plugin = voidCore.getPlugin('calc-123')
```

#### `getAllPlugins()`
```typescript
getAllPlugins(): IPlugin[]
```
全プラグイン取得

```javascript
const plugins = voidCore.getAllPlugins()
```

### マルチチャンネル

#### `enableMultiChannel(config)`
```typescript
enableMultiChannel(config: Object = {}): void
```
マルチチャンネルモード有効化

```javascript
voidCore.enableMultiChannel({
  channels: 4,
  loadBalancing: 'round-robin'
})
```

#### `disableMultiChannel()`
```typescript
disableMultiChannel(): void
```
マルチチャンネルモード無効化

```javascript
voidCore.disableMultiChannel()
```

---

## 📊 統計・情報取得 API

### `getStats()`
```typescript
getStats(): Object
```
基本統計取得

```javascript
const stats = voidCore.getStats()
/* {
  subscriberCount: 5,
  publishedMessages: 150,
  errors: 0,
  uptime: 3600000
} */
```

### `getSystemStats()` ⭐ **新API**
```typescript
getSystemStats(): Object
```
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
    averageChildren: 2.5,
    totalHierarchyLevels: 4
  }
} */
```

### `getSubscriberCount(type)`
```typescript
getSubscriberCount(type: string): number
```
購読者数取得

```javascript
const count = voidCore.getSubscriberCount('Notice')
```

### `getMessagePoolStats()`
```typescript
getMessagePoolStats(): Object
```
メッセージプール統計取得

```javascript
const poolStats = voidCore.getMessagePoolStats()
/* {
  batchCount: 10,
  processedMessages: 250,
  averageProcessingTime: 45,
  parallelProcessing: true
} */
```

### `resetMessagePoolStats()`
```typescript
resetMessagePoolStats(): void
```
メッセージプール統計リセット

```javascript
voidCore.resetMessagePoolStats()
```

---

## 🔌 統合システム API

### CoreFusion

#### `getFusionHistory()`
```typescript
getFusionHistory(): Object[]
```
Fusion履歴取得

```javascript
const history = voidCore.getFusionHistory()
```

#### `clearFusionHistory()`
```typescript
clearFusionHistory(): void
```
Fusion履歴クリア

```javascript
voidCore.clearFusionHistory()
```

---

## 🌊 VoidFlow統合 API

### VoidFlowNodePlugin

#### コンストラクタ
```typescript
constructor(config: {
  nodeType: string,
  pluginId?: string,
  displayName?: string,
  inputs?: string[],
  outputs?: string[],
  category?: string,
  icon?: string,
  color?: string
})
```

#### `setExecutionFunction(codeString)`
```typescript
setExecutionFunction(codeString: string): void
```
ノード実行関数設定

```javascript
nodePlugin.setExecutionFunction(`
  function execute(inputs, context) {
    return { result: inputs.a + inputs.b }
  }
`)
```

#### `execute(inputs, context)`
```typescript
async execute(inputs: Object, context: Object): Promise<Object>
```
ノード実行

```javascript
const result = await nodePlugin.execute({
  a: 10, b: 20
}, { nodeId: 'node-123' })
```

### VoidFlowMessageAdapter

#### `adaptVoidPacketToMessage(voidPacket, metadata)`
```typescript
adaptVoidPacketToMessage(
  voidPacket: Object, 
  metadata: Object = {}
): Message
```
VoidPacket → VoidCore Message変換

#### `adaptMessageToVoidPacket(message, metadata)`
```typescript
adaptMessageToVoidPacket(
  message: Message, 
  metadata: Object = {}
): Object
```
VoidCore Message → VoidPacket変換

---

## 🛠️ ユーティリティ API

### プラグイン判定・作成

#### `isCorePlugin(plugin)`
```typescript
function isCorePlugin(plugin: Object): boolean
```
プラグイン型判定

```javascript
import { isCorePlugin } from './src/plugin-interface.js'

if (isCorePlugin(plugin)) {
  console.log('This is a core plugin')
}
```

#### `createPlugin(config)`
```typescript
function createPlugin(config: Object): IPlugin | ICorePlugin
```
プラグインファクトリ

```javascript
import { createPlugin } from './src/plugin-interface.js'

const plugin = createPlugin({
  type: 'calculator',
  isCore: false
})

const corePlugin = createPlugin({
  type: 'system-manager',
  isCore: true
})
```

---

## 🔄 下位互換性 API

### v11.0 互換 (非推奨)
```typescript
addSubscriber(type: string, handler: Function): void     // ⚠️ 非推奨
removeSubscriber(type: string, handler: Function): void  // ⚠️ 非推奨  
publishMessage(message: Object): Promise<void>           // ⚠️ 非推奨
```

### v12.0 互換
```typescript
// Message分類システム - 引き続きサポート
Message.intentRequest(target, action, payload)
Message.notice(event_name, payload)
Message.proposal(target_plugin, suggestion, payload)
```

### v13.0 互換
```typescript
// Transport/Multi-channel - 引き続きサポート
setTransport(transport)
enableMultiChannel(config)
disableMultiChannel()
```

---

## 📋 エラーハンドリング

### 共通エラー
```javascript
try {
  await voidCore.sendIntent('invalid.intent', {})
} catch (error) {
  if (error.message === 'Intent name is required') {
    // Intent名が不正
  } else if (error.message.startsWith('Unknown system intent')) {
    // 未知のシステムIntent
  }
}
```

### メッセージ検証エラー
```javascript
const message = new Message('test', {}, 'InvalidCategory')
if (!message.isValid()) {
  console.error('Invalid message:', message.getDescription())
}
```

---

## 🎯 推奨使用パターン

### Phase R統一パターン ⭐ **推奨**
```javascript
// 新規開発では sendIntent() を使用
const result = await voidCore.sendIntent('system.createPlugin', config)
const stats = await voidCore.sendIntent('system.getStats')
```

### プラグイン開発パターン
```javascript
// IPlugin継承でプラグイン作成
class MyPlugin extends IPlugin {
  async handleIntent(message) {
    // Intent処理
  }
}
```

### メッセージ設計パターン
```javascript
// Notice通知で状態変更を伝達
const notice = Message.notice('state.changed', { newState: 'active' })
await voidCore.publish(notice)
```

---

*VoidCore v14.0 API リファレンス*  
*Generated: 2025-01-07*