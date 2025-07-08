# JavaScript Implementation Guide
## VoidCore仕様書から実装への完全移行ガイド

**Version**: 1.0  
**Date**: 2025-01-07  
**Target**: 仕様書準拠の実装実現  

---

## 🎯 このガイドの目的

CharmCode_Editor仕様書の「静寂の器」哲学を、JavaScript実装で完全に実現するための具体的な手順を提供します。

---

## 📋 移行チェックリスト

### Phase 1: VoidCoreコア実装 (1週間)

- [ ] **VoidCoreクラス新規実装**
  - [ ] 純粋なメッセージルーティング（内容を知らない）
  - [ ] typeベースのsubscriber管理
  - [ ] async/await対応

- [ ] **Messageクラス標準化**
  - [ ] Intent/Notice/Proposal分類
  - [ ] 標準ペイロード構造

- [ ] **CoreBulletinBoard改修**
  - [ ] VoidCoreとの統合
  - [ ] 後方互換性の維持

### Phase 2: プラグインシステム強化 (1週間)

- [ ] **5段階ライフサイクル実装**
  - [ ] Preparation/Debut/Observation/Work/Retirement
  - [ ] 各フェーズの明確な役割定義

- [ ] **メッセージルーティング改善**
  - [ ] Intent: target_role による1対1配送
  - [ ] Proposal: target_plugin による1対1配送
  - [ ] Notice: ブロードキャスト配送

- [ ] **既存プラグイン更新**
  - [ ] 新しいライフサイクルへの移行
  - [ ] メッセージ形式の標準化

### Phase 3: PluginNodeEditor実装 (2週間)

- [ ] **Canvas基盤構築**
  - [ ] ノード描画システム
  - [ ] ドラッグ&ドロップ
  - [ ] ズーム&パン

- [ ] **プラグイン統合**
  - [ ] リアルタイムノード表示
  - [ ] 接続の可視化
  - [ ] 動的更新

---

## 🔧 具体的実装手順

### Step 1: VoidCoreクラス実装

```javascript
// src/voidcore.js
class VoidCore {
  constructor() {
    this.subscribers = new Map() // type -> Set<handler>
    this.messageQueue = []
    this.isProcessing = false
  }

  // メッセージ購読（typeのみを知る）
  subscribe(type, handler) {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set())
    }
    this.subscribers.get(type).add(handler)
  }

  // 購読解除
  unsubscribe(type, handler) {
    const handlers = this.subscribers.get(type)
    if (handlers) {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.subscribers.delete(type)
      }
    }
  }

  // メッセージ発行（中身は見ない）
  async publish(message) {
    if (!message || !message.type) {
      throw new Error('Message must have a type')
    }

    // typeだけを見てルーティング
    const handlers = this.subscribers.get(message.type)
    if (handlers) {
      // 非同期で全ハンドラーに配送
      const promises = Array.from(handlers).map(handler => {
        try {
          return Promise.resolve(handler(message))
        } catch (error) {
          console.error('Handler error:', error)
          return Promise.resolve()
        }
      })
      await Promise.all(promises)
    }
  }

  // 購読者数取得
  getSubscriberCount(type) {
    return this.subscribers.get(type)?.size || 0
  }

  // 全購読解除
  clear() {
    this.subscribers.clear()
  }
}

export const voidCore = new VoidCore()
```

### Step 2: Messageクラス標準化

```javascript
// src/message.js
export class Message {
  constructor(type, payload, category = 'Notice') {
    this.type = type
    this.payload = payload
    this.category = category
    this.timestamp = Date.now()
    this.id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Intent専用ファクトリ
  static intent(target_role, action, payload) {
    return new Message(action, payload, 'Intent').withTarget('role', target_role)
  }

  // Notice専用ファクトリ
  static notice(event_name, payload) {
    return new Message(event_name, payload, 'Notice')
  }

  // Proposal専用ファクトリ
  static proposal(target_plugin, suggestion, payload) {
    return new Message(suggestion, payload, 'Proposal').withTarget('plugin', target_plugin)
  }

  withTarget(targetType, target) {
    if (targetType === 'role') {
      this.target_role = target
    } else if (targetType === 'plugin') {
      this.target_plugin = target
    }
    return this
  }
}
```

### Step 3: AutonomousPlugin改修

```javascript
// src/autonomous_plugin_v2.js
export class AutonomousPlugin {
  constructor(core, capabilityName) {
    this.core = core
    this.capabilityName = capabilityName
    this.pluginId = `${capabilityName}_${Date.now()}`
    this.role = null // プラグインの役割
    this.currentPhase = 'inactive'
    this.isActive = false
  }

  // 完全な5段階ライフサイクル実行
  async start() {
    try {
      await this.prepare()
      await this.debut()
      await this.observe()
      await this.work()
    } catch (error) {
      console.error(`Plugin ${this.capabilityName} error:`, error)
    } finally {
      await this.retire()
    }
  }

  // Phase 1: Preparation
  async prepare() {
    this.currentPhase = 'preparation'
    this.log('🛠️ Preparation phase started')
    
    // サブクラスでオーバーライド
    await this._prepare()
    
    this.log('✅ Preparation completed')
  }

  // Phase 2: Debut
  async debut() {
    this.currentPhase = 'debut'
    this.log('🎭 Debut phase started')
    
    // 能力を世界に宣言
    this.provide(this.capabilityName, this)
    
    // デビュー通知
    this.publish(Message.notice('plugin.debut', {
      pluginId: this.pluginId,
      capability: this.capabilityName,
      role: this.role
    }))
    
    this.log('✅ Debut completed')
  }

  // Phase 3: Observation
  async observe() {
    this.currentPhase = 'observation'
    this.log('👀 Observation phase started')
    
    // メッセージ購読設定
    this._setupSubscriptions()
    
    // サブクラスでの観測設定
    await this._observe()
    
    this.log('✅ Observation completed')
  }

  // Phase 4: Work
  async work() {
    this.currentPhase = 'work'
    this.isActive = true
    this.log('💪 Work phase started')
    
    // メインワークループ
    while (this.isActive) {
      try {
        await this._work()
        
        // 引退判断
        if (await this._shouldRetire()) {
          break
        }
        
        // CPU譲渡
        await this._sleep(10)
      } catch (error) {
        console.error('Work error:', error)
      }
    }
    
    this.log('✅ Work completed')
  }

  // Phase 5: Retirement
  async retire() {
    this.currentPhase = 'retirement'
    this.isActive = false
    this.log('🌅 Retirement phase started')
    
    // 引退通知
    this.publish(Message.notice('plugin.retirement', {
      pluginId: this.pluginId,
      capability: this.capabilityName,
      reason: this.retireReason || 'Natural retirement'
    }))
    
    // リソース解放
    this._cleanup()
    this.retract(this.capabilityName)
    
    this.log('👋 Goodbye!')
  }

  // メッセージ購読設定
  _setupSubscriptions() {
    // Intent: 自分の役割宛のメッセージ
    if (this.role) {
      this.core.subscribe('Intent', (msg) => {
        if (msg.category === 'Intent' && msg.target_role === this.role) {
          this._handleIntent(msg)
        }
      })
    }

    // Proposal: 自分宛の提案
    this.core.subscribe('Proposal', (msg) => {
      if (msg.category === 'Proposal' && msg.target_plugin === this.pluginId) {
        this._handleProposal(msg)
      }
    })

    // Notice: 全般的な通知
    this.core.subscribe('Notice', (msg) => {
      if (msg.category === 'Notice') {
        this._handleNotice(msg)
      }
    })
  }

  // サブクラスでオーバーライドするメソッド
  async _prepare() {}
  async _observe() {}
  async _work() {}
  async _shouldRetire() { return false }
  _cleanup() {}

  _handleIntent(message) {}
  _handleProposal(message) {}
  _handleNotice(message) {}

  // ヘルパーメソッド
  publish(message) { this.core.publish(message) }
  provide(name, service) { /* CoreBulletinBoard経由 */ }
  retract(name) { /* CoreBulletinBoard経由 */ }
  observe(name) { /* CoreBulletinBoard経由 */ }
  
  log(msg) { console.log(`[${this.capabilityName}] ${msg}`) }
  _sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }
}
```

### Step 4: 既存プラグインの移行例

```javascript
// plugins/textinput_v2.js
import { AutonomousPlugin } from '../src/autonomous_plugin_v2.js'
import { Message } from '../src/message.js'

export class TextInputPlugin extends AutonomousPlugin {
  constructor(core) {
    super(core, "TextInputService")
    this.role = "text_input"
    this.textArea = null
  }

  async _prepare() {
    // UI要素の準備
    this.textArea = document.createElement('textarea')
    this.textArea.id = 'markdown-input'
    // ... UI設定
  }

  async _observe() {
    // ファイルサービスの監視
    this.fileService = this.observe("FileService")
    
    // ファイル読み込み完了の監視
    this.core.subscribe('Notice', (msg) => {
      if (msg.type === 'file.loaded') {
        this.textArea.value = msg.payload.content
      }
    })
  }

  async _work() {
    // テキスト変更の監視
    if (this.textArea && this.textArea.value !== this.lastContent) {
      this.lastContent = this.textArea.value
      
      // テキスト変更を通知
      this.publish(Message.notice('text.changed', {
        content: this.textArea.value,
        length: this.textArea.value.length
      }))
    }
  }

  _handleIntent(message) {
    if (message.type === 'text.focus') {
      this.textArea?.focus()
    }
  }

  _handleProposal(message) {
    if (message.type === 'clear') {
      if (confirm('テキストをクリアしますか？')) {
        this.textArea.value = ''
      }
    }
  }

  async _shouldRetire() {
    // 長時間未使用の場合は引退
    const inactiveTime = Date.now() - this.lastActivity
    return inactiveTime > 30 * 60 * 1000 // 30分
  }
}
```

---

## 🚀 実装のポイント

### 1. 純粋性の維持
```javascript
// ❌ VoidCoreがメッセージ内容を知る
if (message.payload.urgent) {
  prioritize(message)
}

// ✅ VoidCoreはtypeのみを知る
const handlers = this.subscribers.get(message.type)
handlers.forEach(handler => handler(message))
```

### 2. 非同期対応
```javascript
// 全てのライフサイクルメソッドをasyncに
async publish(message) {
  const promises = handlers.map(h => Promise.resolve(h(message)))
  await Promise.all(promises)
}
```

### 3. エラーハンドリング
```javascript
// プラグインのエラーがシステム全体を止めないように
try {
  await handler(message)
} catch (error) {
  console.error('Plugin error:', error)
  // 継続実行
}
```

---

## 📚 推奨リソース

### ドキュメント
- [VoidCore Architecture Specification v11.0](./VoidCore_Architecture_Specification_v11.0.md)
- [Message Classification Design Phase 2.0](./Message_Classification_Design_Phase2.0.md)  
- [Plugin Lifecycle Guide v2.0](./Plugin_Lifecycle_Guide_v2.0.md)

### 実装例
- [examples/demos/](../examples/demos/) - 各種デモプラグイン
- [plugins/](../plugins/) - 標準プラグイン集

---

## 🎯 移行完了の確認

以下がすべて満たされれば、仕様書準拠の実装完了です：

1. **VoidCoreの純粋性**: メッセージの内容ではなく、typeのみでルーティング
2. **3パターン分類**: Intent/Notice/Proposalが明確に区別されている
3. **5段階ライフサイクル**: すべてのプラグインが完全な自律性を持つ
4. **非強制原則**: 命令や強制は存在せず、すべて提案ベース
5. **美しいシンプルさ**: 複雑さを隠し、直感的なAPIを提供

---

**次のステップ**: 実装が完了したら、PluginNodeEditorの開発に進み、ビジュアルな接続編集機能を追加しましょう！ 🌟