# 🐱 nyacore (旧VoidCore) コア開発ドキュメント

> **Pure Message-Based System Architecture v14.0**  
> **最終更新**: 2025-07-11 (VoidCore → nyacore 名前移行完了)  

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

- **nyacore.js** - `src/core/nyacore.js` - メインコアシステム
- **nyacore_base.js** - `src/core/nyacore_base.js` - 基盤システム  
- **Message** - `src/messaging/message.js` - 統一メッセージシステム

---

## 🚀 **CharmFlowとの関係**

nyacoreは **CharmFlow アプリケーション** のコアエンジンとして動作:

- **nyacore** - Pure Message-Based System コア
- **CharmFlow** - nyacore上で動作するビジュアルプラグインシステム

---

## 📍 **重要な移行情報**

### **ファイルパス変更**
```javascript
// 旧
import { VoidCore } from './src/voidcore.js'

// 新
import { VoidCore } from './src/core/nyacore.js'
```

### **アプリケーション名変更**
- **VoidFlow** → **CharmFlow**
- **VoidCore** → **nyacore**
- **URL**: `http://192.168.0.150:10000/charmflow/`

---

*nyacore - 創造性の永久機関による新しいコンピューティングパラダイム*