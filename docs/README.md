# 📚 VoidCore v14.0 ドキュメント

## 🌟 概要
VoidCore v14.0 は ChatGPT提案の統一Intentアーキテクチャを実装した、次世代メッセージベース JavaScript フレームワークです。

## 📋 ドキュメント一覧

### 📖 主要ドキュメント
- **[完全仕様書](./VoidCore_v14.0_完全仕様書.md)** - VoidCore v14.0の全体像・アーキテクチャ・使用例
- **[API リファレンス](./VoidCore_v14.0_API_リファレンス.md)** - 全API・メソッド・パラメータの詳細

### 📋 計画・進捗
- **[次にやる.txt](../次にやる.txt)** - Phase R後の段階的改善計画
- **[統合計画書](./VoidFlow-VoidCore_統合計画書.md)** - VoidFlow統合の戦略文書

### 🏛️ アーキテクチャ仕様書 (歴代)
- **[v13.0仕様書](./VoidCore_Architecture_Specification_v13.0.md)** - Transport/Multi-channel
- **[v12.0仕様書](./VoidCore_Architecture_Specification_v12.0.md)** - メッセージ分類システム  
- **[v11.0仕様書](./VoidCore_Architecture_Specification_v11.0.md)** - 基本メッセージシステム
- **[v10.0仕様書](./VoidCore_Architecture_Specification_v10.0.md)** - 初期アーキテクチャ

### 🧩 専門ドキュメント
- **[Message分類設計 Phase2.0](./Message_Classification_Design_Phase2.0.md)** - 4種類メッセージ分類
- **[Plugin Lifecycle Guide v2.0](./Plugin_Lifecycle_Guide_v2.0.md)** - プラグインライフサイクル
- **[JavaScript実装ガイド](./JavaScript_Implementation_Guide.md)** - 実装詳細

### 💬 開発会議録
- **[chatter/chatgpt/](./chatter/chatgpt/)** - ChatGPT提案・相談記録
- **[chatter/gemini/](./chatter/gemini/)** - Gemini設計相談記録  
- **[chatter/development/](./chatter/development/)** - 開発進捗・アクション計画

## 🎯 VoidCore v14.0 主要特徴

### ✨ Phase R: ChatGPT統一Intentアーキテクチャ
```javascript
// 統一Intent操作
const result = await voidCore.sendIntent('system.createPlugin', config)
const stats = await voidCore.sendIntent('system.getStats')
```

### 🧩 プラグインシステム
```javascript
// IPlugin/ICorePlugin統一インターフェース
class MyPlugin extends IPlugin {
  async handleMessage(message) {
    // 統一メッセージハンドラー
  }
}
```

### 📨 4種類メッセージ分類
- **IntentRequest** - 要求メッセージ
- **IntentResponse** - 応答メッセージ  
- **Notice** - 通知メッセージ (1対多)
- **Proposal** - 提案メッセージ (非強制)

### 🔄 完全下位互換性
- v11.0-v13.0 API完全サポート
- 既存システム無変更で動作
- 段階的移行可能

## 🚀 クイックスタート

### インストール
```bash
git clone <repository>
cd voidcore-js
```

### 基本使用例
```javascript
import { VoidCore } from './src/voidcore.js'
import { Message } from './src/message.js'

const voidCore = new VoidCore()

// Intent操作 (Phase R)
const result = await voidCore.sendIntent('system.getStats')

// メッセージ操作
const notice = Message.notice('user.login', { userId: 'user123' })
await voidCore.publish(notice)
```

### プラグイン開発
```javascript
import { IPlugin } from './src/plugin-interface.js'

class MyPlugin extends IPlugin {
  async handleIntent(message) {
    switch (message.intent) {
      case 'my.action':
        return await this.handleMyAction(message)
    }
  }
}
```

## 📊 システム構成

```
🎯 VoidCore v14.0 アーキテクチャ
├── 📱 VoidCore (コアシステム)
│   ├── 🎯 統一Intentシステム
│   ├── 📨 メッセージ分類システム (4種類)
│   ├── 📡 ChannelManager (マルチチャンネル)
│   └── 🔄 下位互換レイヤー
│
├── 🧩 プラグインシステム  
│   ├── 🔷 IPlugin (基本プラグイン)
│   ├── 🏢 ICorePlugin (コアプラグイン)
│   └── 🌊 VoidFlowNodePlugin (統合プラグイン)
│
└── 🔌 統合システム
    ├── 🌊 VoidFlow統合
    ├── ⚡ CoreFusion (コア融合)
    └── 📊 SimpleMessagePool (メッセージプール)
```

## 🎯 次のステップ

### Phase S1: コアテスト完了・安定化
- [ ] 既存システム移行テスト完了
- [ ] Phase R統合ストレステスト
- [ ] パフォーマンスベンチマーク

### Phase S2: VoidFlow移植
- [ ] VoidFlow環境動作確認
- [ ] 実用ワークフロー検証
- [ ] VoidFlow専用コード分析

### Phase S3: 汎用システム実現
- [ ] VoidFlowNodePlugin → IPlugin継承統一
- [ ] 重複コード削減 (1,600行削除目標)
- [ ] 他システム統合ガイド作成

## 🔗 関連リンク

### テスト環境
- **Phase R テストスイート:** `http://localhost:8081/test-phase-r-refactoring.html`
- **Intent修正テスト:** `http://localhost:8081/test-intent-fix.html`
- **VoidFlow統合テスト:** `http://localhost:8081/test-voidflow-integration-phase2.html`

### ソースコード構成
```
📁 src/ (12,484行・24ファイル)
├── 🎯 コアシステム (1,737行)
├── 🌊 VoidFlow統合 (3,145行) ← 削減対象
├── 🛠️ システム基盤 (528行)
└── 🔧 ユーティリティ・統合 (7,074行)
```

---

## 📝 貢献・フィードバック

### 問題報告
- GitHub Issues で報告
- テスト結果の共有
- パフォーマンス測定結果

### 開発参加
- プラグイン開発
- 統合システム実装
- ドキュメント改善

---

*VoidCore v14.0 Documentation*  
*Generated: 2025-01-07*  
*ChatGPT統一Intentアーキテクチャ*