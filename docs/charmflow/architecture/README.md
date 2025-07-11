# 🏗️ CharmFlow (旧VoidFlow) アーキテクチャドキュメンテーションシステム

**目的**: Claude Codeの効率的CharmFlow理解・修正支援  
**原則**: 概要→詳細→実装の3段階情報提供  
**更新**: 修正時の説明同期更新必須

> **📍 重要**: VoidFlow → CharmFlow 名前移行完了 (2025-07-11)  
> アーキテクチャ構造は変わらず、nyacore統合システムとして継続

## 🎯 **Claude Code調査プロトコル**

### **📋 Phase 1: 概要把握（必須）**
```
1. 📖 `architecture-overview.md` - 全体構造理解
2. 🗂️ `class-index.md` - 主要クラス一覧確認
3. 🔗 `component-interfaces.md` - 接続関係把握
4. 📊 `current-status.md` - 最新状態確認
```

### **📋 Phase 2: 詳細調査（必要時）**
```
1. 📁 `component-details/` - 特定コンポーネント詳細
2. 🔧 `modification-log.md` - 最近の変更履歴
3. 🚨 `known-issues.md` - 既知の問題・制約
4. 💡 `design-decisions.md` - 設計判断の記録
```

### **📋 Phase 3: 実装確認（最終手段）**
```
1. 🔍 ソースコード直接読取り
2. 📝 新発見事項の説明更新
3. 🔄 ドキュメント整合性確認
```

---

## 📁 **ドキュメント構造**

```
docs/voidflow-architecture/
├── README.md                    # このファイル（調査プロトコル）
├── architecture-overview.md     # 🏗️ 全体アーキテクチャ図
├── class-index.md              # 📚 主要クラス一覧・概要
├── component-interfaces.md     # 🔗 コンポーネント間接続仕様
├── current-status.md           # 📊 現在の実装状態
├── modification-log.md         # 📝 変更履歴（説明更新ログ）
├── known-issues.md             # 🚨 既知の問題・制約事項
├── design-decisions.md         # 💡 重要な設計判断記録
└── component-details/          # 📁 詳細説明フォルダ
    ├── voidcore-ui.md         # VoidCoreUI詳細
    ├── connection-manager.md   # ConnectionManager詳細
    ├── element-manager.md     # ElementManager詳細
    ├── hybrid-communication.md # HybridCommunication詳細
    └── debug-system.md        # デバッグシステム詳細
```

---

## 🔄 **更新管理システム**

### **修正時の必須手順**
1. **コード修正実行**
2. **影響箇所の説明更新**
3. **modification-log.md記録**
4. **整合性チェック実行**

### **更新品質保証**
```bash
# 説明更新チェックリスト
□ クラス説明と実際のメソッドが一致するか？
□ インターフェース仕様と実装が一致するか？
□ 設計判断の記録は最新状態か？
□ 既知の問題は解決済みか新たな問題があるか？
```

### **更新忘れ防止**
- 🔔 修正時のリマインダー
- 📋 TodoListに説明更新タスク自動追加
- 🔍 定期的な整合性監査

---

## 🎯 **期待効果**

### **Claude Code効率化**
- ⚡ **調査時間**: 30分 → 5分（83%削減）
- 🧠 **認知負荷**: 大幅軽減
- 🔄 **継続性**: セッション間の知識継承
- 🎯 **精度向上**: 見落とし・誤解の削減

### **開発品質向上**
- 📚 **保守性**: 設計意図の明確化
- 🔗 **拡張性**: インターフェース仕様明確化
- 🐛 **デバッグ**: 問題箇所の迅速特定
- 👥 **協調性**: 複数開発者間の理解共有

---

## 🚀 **実装計画**

### **Phase A: 基盤構築（今日）**
1. ✅ ドキュメント構造作成
2. 📖 `architecture-overview.md` 作成
3. 📚 `class-index.md` 作成
4. 📊 `current-status.md` 作成

### **Phase B: 詳細化（1-2日）**
1. 🔗 `component-interfaces.md` 作成
2. 📁 主要コンポーネントの詳細説明作成
3. 💡 `design-decisions.md` 作成

### **Phase C: 運用化（継続）**
1. 🔄 修正時の説明更新プロセス確立
2. 📝 `modification-log.md` 運用開始
3. 🔍 定期的整合性チェック

---

**🎉 これでClaude Codeの調査効率が劇的向上するにゃー！**