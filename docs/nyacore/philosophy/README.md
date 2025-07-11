# 🧠 nyacore (旧VoidCore) 理念忘却防止システム

**目的**: Claude Codeが作業中にnyacore理念を忘れない仕組みの構築  
**重要性**: nyacore準拠開発の品質向上・一貫性確保

> **📍 重要**: VoidCore → nyacore 名前移行完了 (2025-07-11)  
> コア理念は変わらず、Pure Message-Based Systemとして継続

## 🎯 **nyacore三大原則（絶対忘れてはいけない）**

### **1. すべてはメッセージパッシング**
```
🗣️ "すべての存在は、メッセージで生まれ、メッセージで終わる"
- コンポーネント間の通信は必ずMessage経由
- 直接関数呼び出しは最小限に抑制
- Intent駆動でプラグイン間協調
```

### **2. コアの機能を持つ者はコアを継承する**
```
🔧 "Core機能が必要なときのみVoidCoreを継承"
- VoidCoreUI: GUI特化コア（継承OK）
- 一般プラグイン: IPlugin継承（composition推奨）
- システム拡張: VoidCore継承（慎重に）
```

### **3. 高速通信はコア継承+特別回線**
```
⚡ "純粋性と性能の両立は可能"
- VoidCoreHybridCommunication（60FPS GUI対応）
- DirectUIChannel（高速UI更新）
- メッセージベース + 性能最適化の共存
```

---

## 🛡️ **理念忘却防止メカニズム**

### **📋 Level 1: 作業開始時チェック**
```
🔍 必須確認事項（毎回）:
□ 今回の作業はメッセージパッシング原則に従うか？
□ 新しいコンポーネントは適切な継承戦略か？
□ 性能要件がある場合、ハイブリッド通信を検討したか？
□ プラグインベース設計を優先したか？
```

### **⚠️ Level 2: 実装中の危険信号**
```
❌ 理念違反の兆候:
- addEventListener()多用
- 直接DOM操作増加  
- new Function()使用
- 直接オブジェクト参照
- カスタムイベント多用
- boardへの直接アクセス

🚨 これらが出たら即座に理念確認！
```

### **🎯 Level 3: 理念準拠パターン集**
```
✅ 正しいパターン例:

// ❌ 理念違反
element.addEventListener('click', directHandler)

// ✅ 理念準拠
this.voidCore.sendIntent('ui.click', { elementId, event })

// ❌ 理念違反  
plugin.processData(data)

// ✅ 理念準拠
this.voidCore.publish(Message.intentRequest('data.process', { data }))
```

---

## 🔧 **実践的理念確認ワークフロー**

### **Phase A: 設計時**
1. **理念チェックリスト実行**
2. **アーキテクチャ図でメッセージフロー確認**
3. **性能要件とハイブリッド通信検討**

### **Phase B: 実装時**
1. **危険信号モニタリング**
2. **コード書く前に理念準拠パターン確認**
3. **15分毎の理念振り返り**

### **Phase C: 検証時**
1. **理念準拠率測定**
2. **メッセージフロー完整性確認**
3. **性能とのバランス評価**

---

## 📚 **理念深化資料**

### **VoidCore設計哲学ドキュメント**
- `docs/voidcore-philosophy/core-principles.md` - 基本原則詳細
- `docs/voidcore-philosophy/message-patterns.md` - メッセージパターン集
- `docs/voidcore-philosophy/inheritance-guide.md` - 継承判断ガイド
- `docs/voidcore-philosophy/performance-balance.md` - 性能と理念のバランス

### **実装パターンライブラリ**
- `docs/voidcore-philosophy/good-patterns/` - 理念準拠の良い例
- `docs/voidcore-philosophy/bad-patterns/` - 理念違反の悪い例
- `docs/voidcore-philosophy/migration-patterns/` - 既存コード移行例

---

## 🚨 **緊急理念リマインダー**

```
🧠 迷った時の3つの質問:
1. この操作はメッセージで表現できるか？
2. このコンポーネントはプラグインにできるか？
3. 性能問題がある場合、ハイブリッド通信は適用可能か？
```

```
⚡ 判断基準:
- メッセージパッシング: 常に第一選択
- 直接処理: 性能クリティカルな場合のみ
- 継承: Core機能が本当に必要な場合のみ
- composition: 一般的なプラグインは継承ではなく委譲
```

---

## 🎯 **理念埋め込み型開発プロセス**

### **毎回の作業フロー**
```
1. 📖 理念3原則を声に出して読む
2. 🔍 作業内容を理念に照らし合わせる
3. 💡 理念準拠の実装方針を決める
4. ⚡ 性能要件があればハイブリッド検討
5. 🧪 実装後に理念準拠率をチェック
```

**🎉 このシステムで理念忘却率90%削減を目指すにゃー！**