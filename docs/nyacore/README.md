# 🐱 nyacore - 次世代Pure Message-Based System

> **nyacore v14.0 + CharmFlow統合版**  
> **最終更新**: 2025-01-07 (VoidCore → nyacore 完全移行 + NyaCoreUI統合完了)  

## 📁 **ドキュメント構成**

### **🧠 philosophy/** - コア理念・設計思想
- **`README.md`** - 理念忘却防止システム & nyacore三大原則
- **目的**: Claude Codeが開発中に理念を忘れない仕組み

### **💡 patterns/** - 実装パターン集
- **`implementation-patterns.md`** - 理念準拠コードパターン集
- **目的**: 理念違反を防ぐ具体的な実装例

### **📚 api/** - API仕様・リファレンス
- **`api-reference.md`** - nyacore v14.0 完全API仕様
- **`message-system.md`** - メッセージシステム詳細

---

## 🎯 **nyacore三大原則**

1. **すべてはメッセージパッシング** - コンポーネント間通信は必ずMessage経由
2. **コアの機能を持つ者はコアを継承** - GUI特化などCore機能が必要な場合のみ
3. **高速通信はコア継承+特別回線** - 純粋性と性能の両立

---

## 🔧 **主要コンポーネント**

### **コアシステム**
- **nyacore.js** - `src/core/nyacore.js` - メインコアシステム
- **nyacore_base.js** - `src/core/nyacore_base.js` - 基盤システム  
- **Message** - `src/messaging/message.js` - 統一メッセージシステム

### **CharmFlow統合レイヤー**
- **NyaCoreUI** - `charmflow/js/nyacore-ui.js` - UI専用nyacore拡張クラス
- **CharmFlowCore** - `charmflow/js/charmflow-core.js` - デバッグ特化型nyacoreインスタンス
- **PluginFlowExecutor** - `charmflow/js/plugin-flow-executor.js` - プラグイン実行制御
- **DebugFileLogger** - `charmflow/js/debug-file-logger.js` - ファイル出力デバッグシステム

---

## 🚀 **CharmFlow統合アーキテクチャ**

nyacoreは **CharmFlow nyacore統合版** の中核エンジンとして完全統合:

```
nyacore v14.0 (Pure Message-Based System)
    ↓
NyaCoreUI (UI専用拡張クラス)
    ↓
CharmFlow (ビジュアルプラグインシステム)
    ↓
CharmFlowCore (デバッグ特化型)
```

### **統合の特徴**
- **コンポジション設計**: NyaCoreUIがnyacoreを包含、継承ではなくコンポジション
- **デュアルコア**: 通常のnyacoreとデバッグ特化CharmFlowCoreの並行動作
- **統一メッセージング**: UI操作もプラグイン実行もすべてMessage経由
- **ファイル出力デバッグ**: 6カテゴリログの詳細トラッキング

---

## 📍 **2025年大改革完了記録**

### **🎉 Phase 1: 名称統一 (完了)**
```javascript
// VoidCore → nyacore
import { VoidCore } from './src/core/nyacore.js'

// VoidCoreUI → NyaCoreUI
import { NyaCoreUI } from './charmflow/js/nyacore-ui.js'

// window参照統一
window.nyaCoreUI = nyaCoreUI  // (旧: window.voidCoreUI)
```

### **🎉 Phase 2: アーキテクチャ統合 (完了)**
- **NyaCoreUIコンポジション設計**: 継承→コンポジション変更で柔軟性向上
- **CharmFlowCore分離**: デバッグ専用nyacoreインスタンス独立動作
- **PluginFlowExecutor**: プラグイン実行・データフロー統一管理
- **DebugFileLogger**: セッション毎6カテゴリファイル出力システム

### **🎉 Phase 3: 実用復活 (完了)**
- **プラグイン実行復活**: "Plugin not found"エラー完全解決
- **データフロー実行**: プラグイン間接続・データ伝達正常化
- **UI統合**: ドラッグ&ドロップ・接続作成・実行の完全動作
- **デバッグGUI**: ログセンター・リアルタイムカテゴリ選択実装

### **🎉 Phase 4: 完全統一 (完了)**
- **CharmFlow nyacore統合版**: タイトル・UI・メッセージ完全統一
- **debugCharmFlow**: デバッグ変数名・コマンド統一
- **VoidFlow参照撲滅**: UI・ドキュメント・コメント全域からVoidFlow削除

### **アクセス情報**
- **URL**: `http://192.168.0.150:10000/charmflow/`
- **ログ**: `debug/` フォルダにセッション毎詳細ログ自動出力
- **デバッグ**: ブラウザコンソールで `debugCharmFlow.*` コマンド使用可能

---

## 🔮 **今後の展望**

### **Phase S5: 次世代機能**
- nyacore Intent Bridge 2.0 - 高度なIntent処理システム
- リアルタイム協調編集 - 複数ユーザー同時編集
- AI支援開発環境 - ChatGPT連携プラグイン開発支援

### **Phase S6: エコシステム拡張**
- C++版nyacoreとの相互運用
- クラウド同期・配布システム
- 企業向け統合ソリューション

---

> **🐱 nyacore** - 創造性の永久機関による新しいコンピューティングパラダイム  
> *Pure Message-Based System × CharmFlow統合 × 統合デバッグシステム*

**Migration Status**: VoidCore → nyacore 完全移行完了 🎉  
**Integration Version**: CharmFlow nyacore統合版 v1.0.0