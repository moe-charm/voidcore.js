# VoidCore Architecture Specification v11.0
## 静寂の器 - The Vessel of Silence

**Version**: 11.0  
**Date**: 2025-01-07  
**Status**: JavaScript Implementation Focus  

---

## 🌟 核心哲学: VoidCore = 静寂の器

**VoidCore**は、メッセージをtypeだけ見てルーティングする純粋な配達員です。中身は一切知りません。

### 三つの根幹原則

1. **静寂 (Silence)** - コア自身は一切の意味を知らない純粋な媒体
2. **非命令型 (Non-Imperative)** - 強制しない、提案のみ
3. **尊厳尊重 (Dignity)** - プラグインが自律判断

---

## 🎯 3つのメッセージ分類

すべてのコミュニケーションは、たった3つのパターンに集約されます。

### 1. Intent (意図) - 「〜してほしい」

**特徴**: 特定の役割に願いを送る (1対1通信)

```javascript
{
  type: "Intent",
  target_role: "file_explorer",  // 特定の役割を指定
  action: "file.open",
  payload: { path: "/doc.txt" }
}
```

**使用場面**:
- 特定のサービスに作業を依頼したいとき
- 明確な宛先がある要求を送るとき

### 2. Notice (通知) - 「〜が起きた」

**特徴**: 事実を世界に放送 (1対多通信)

```javascript
{
  type: "Notice",
  event_name: "file.saved",
  payload: { path: "/doc.txt", size: 2048 }
}
```

**使用場面**:
- 状態変化を全体に知らせたいとき
- 誰が聞いているか気にせず情報を発信するとき

### 3. Proposal (提案) - 「〜しませんか」

**特徴**: 特定プラグインに提案 (1対1通信、非強制)

```javascript
{
  type: "Proposal",
  target_plugin: "VideoProcessor",
  suggestion: "pause",
  payload: { reason: "メモリ不足" }
}
```

**使用場面**:
- 他のプラグインに行動を促したいが、強制はしたくないとき
- 協調的な動作を提案するとき

---

## 🚀 完全自律プラグイン 5段階ライフサイクル

すべてのプラグインは、この5つの段階を経て、自律的に生き、そして引退します。

### Phase 1: Preparation (準備)
- 内部リソースの初期化
- 設定の読み込み
- UIコンポーネントの準備

### Phase 2: Debut (登場)
- 自己紹介: `provide(capability)` で能力を世界に宣言
- 他のプラグインから発見可能になる

### Phase 3: Observation (観測)
- 依存する能力を監視: `observe(capability)`
- 必要なメッセージを購読: `subscribe(type, event)`
- 世界の状態を把握

### Phase 4: Work (活動)
- 自律的な動作ループ
- メッセージの送受信
- 本来の機能を実行

### Phase 5: Retirement (引退)
- 自己判断による引退決定
- `retract(capability)` で能力を撤回
- リソースのクリーンアップ

---

## 📦 最小実装API

### VoidCore クラス

```javascript
class VoidCore {
  // メッセージ購読
  subscribe(type, handler) {}
  
  // 購読解除
  unsubscribe(type, handler) {}
  
  // メッセージ発行
  publish(message) {}
  
  // 購読者数取得
  getSubscriberCount(type) {}
  
  // 全購読解除
  clear() {}
}
```

### Message クラス

```javascript
class Message {
  constructor(type, payload, category = 'Notice') {
    this.type = type           // メッセージタイプ
    this.payload = payload     // ペイロード
    this.category = category   // Intent/Notice/Proposal
  }
}
```

### AutonomousPlugin 基底クラス

```javascript
class AutonomousPlugin {
  constructor(core, capabilityName) {
    this.core = core
    this.capabilityName = capabilityName
    this.isActive = false
  }
  
  // ライフサイクルメソッド
  async prepare() {}    // Phase 1
  async debut() {}      // Phase 2
  async observe() {}    // Phase 3
  async work() {}       // Phase 4
  async retire() {}     // Phase 5
}
```

---

## 🌐 JavaScript特有の実装ポイント

### 非同期対応

```javascript
// Promiseベースの非同期メッセージング
async publish(type, payload) {
  // 非同期処理対応
}

// 非同期ハンドラーサポート
subscribe(type, async (msg) => {
  await processMessage(msg)
})
```

### 動的プラグインロード

```javascript
// ES6 dynamic import
const plugin = await import('./plugin.js')
core.registerPlugin(plugin)
```

### Web/Node.js両対応

```javascript
// 環境検出
const isNode = typeof window === 'undefined'
const isBrowser = !isNode

// 条件付きインポート
if (isBrowser) {
  // ブラウザ専用コード
} else {
  // Node.js専用コード
}
```

---

## 🎨 設計原則

### 1. 無限スケーラビリティ
- N個のプラグイン → 3つのメッセージパターンのみ
- 複雑性は増加しない

### 2. 美しさ優先
- シンプルで直感的なAPI
- 最小限のコードで最大の表現力

### 3. 完全な自律性
- プラグインは自己判断で行動
- 強制や命令は存在しない

---

## 🔧 実装ガイドライン

### メッセージルーティング

```javascript
// VoidCoreは型だけを見る
publish(message) {
  const handlers = this.subscribers.get(message.type)
  handlers?.forEach(handler => handler(message))
}
```

### プラグイン間通信

```javascript
// Intent: 特定の役割へ
if (message.category === 'Intent' && message.target_role === myRole) {
  handleIntent(message)
}

// Notice: 全員が受信可能
if (message.category === 'Notice') {
  handleNotice(message)
}

// Proposal: 特定プラグインへの提案
if (message.category === 'Proposal' && message.target_plugin === myId) {
  considerProposal(message)
}
```

---

## 📚 関連ドキュメント

- [Message Classification Design](./Message_Classification_Design_Phase1.8.md)
- [Plugin Lifecycle Guide](./Plugin_Lifecycle_Guide.txt)
- [VoidCore JavaScript実装用 超コンパクト要約](../../../CharmCode_Editor/仕様書/JavaScript版用エッセンス抽出/VoidCore_JavaScript実装用_超コンパクト要約.md)

---

**これだけ！** シンプルで美しく、無限に拡張可能な世界へようこそ！ 🌟