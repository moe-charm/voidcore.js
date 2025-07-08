# 📚 VoidCore Documentation

> **VoidCore v14.0** - Pure Message-Based System Documentation  
> **最終更新**: 2025-07-08  
> **ステータス**: Phase S4最適化完了、VoidFlow開発環境整備完了  

---

## 📁 **ドキュメント構造**

### **📋 00-current/ - 現在有効な文書**
- **VoidCore_統合開発計画書_2025.md** - メイン開発計画書
  - 短期・中期・長期の開発ロードマップ
  - Phase S4完了状況、VoidFlow分割版開発環境
  - Web便利ツール製造エンジン構想

### **📊 01-specifications/ - 最新仕様書**
- **VoidCore_v14.0_完全仕様書.md** - v14.0の完全仕様
- **VoidCore_v14.0_API_リファレンス.md** - API詳細リファレンス

### **🛠️ 02-implementation-guides/ - 実装ガイド**
- **JavaScript_Implementation_Guide.md** - JavaScript版実装ガイド
- **Plugin_Lifecycle_Guide_v2.0.md** - プラグインライフサイクルガイド

### **📚 03-archive/ - アーカイブ**
- **legacy-versions/** - 過去バージョンの仕様書 (v10.0-v13.0)
- **old-chatter/** - 開発会議記録・ChatGPT/Gemini相談
- **completed-projects/** - 完了プロジェクトの記録
- **recent-archive/** - 最近のアーカイブ (Phase S4記録等)

---

## 🎯 **クイックスタート**

### **開発者向け**
1. **最新計画確認**: `00-current/VoidCore_統合開発計画書_2025.md`
2. **API詳細**: `01-specifications/VoidCore_v14.0_API_リファレンス.md`
3. **実装ガイド**: `02-implementation-guides/JavaScript_Implementation_Guide.md`

### **新規参加者向け**
1. **プロジェクト概要**: `01-specifications/VoidCore_v14.0_完全仕様書.md`
2. **哲学・コンセプト理解**: アーカイブ内の理論文書
3. **実装例確認**: 実装ガイド + 実際のソースコード

---

## 🌟 **VoidCore の特徴**

### **核心哲学**
> 「すべての存在は、メッセージで生まれ、メッセージで終わる」

### **主要特徴**
- **Pure Message-Based System**: 全通信がメッセージベース
- **自律プラグインシステム**: プラグインが独立動作
- **創造性の永久機関**: システムが自己拡張可能
- **ゼロ依存**: 外部ライブラリ不要

### **Phase S4最適化成果**
- **645行に削減**: 元963行から35%削減
- **HandlerMapパターン**: if文撲滅による高速化
- **状態管理分離**: PluginStoreによる責任分割
- **総削減効果**: 1,187行削減達成

---

## 🚀 **現在の開発状況**

### **✅ 完了済み**
- Phase S4: ChatGPT提案コアスリム化
- VoidFlow開発環境分割 (3,155行→8ファイル)
- VoidCore純化プロジェクト

### **🔄 進行中**
- VoidFlow分割版動作確認
- Web便利ツール第一弾作成
- プラグイン編集機能追加

### **📋 次期計画**
- Phase 5.3: VoidFlow-VoidCore統合
- VoidIDE Genesis実装
- JavaScript→C++橋渡しシステム

---

## 🎯 **使用例**

### **基本使用例**
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

### **プラグイン開発**
```javascript
import { IPlugin } from './src/plugin-interface.js'

class MyPlugin extends IPlugin {
  async handleMessage(message) {
    // 統一メッセージハンドラー
    return await this.processMessage(message)
  }
}
```

---

## 📞 **サポート・問い合わせ**

### **開発チーム**
- **メイン開発**: にゃーさん + Claude Code
- **アーキテクト**: Gemini AI (設計相談)
- **実装支援**: ChatGPT (実装アドバイス)

### **重要リソース**
- **最新開発計画**: `00-current/VoidCore_統合開発計画書_2025.md`
- **技術仕様**: `01-specifications/` フォルダ
- **過去の知見**: `03-archive/` フォルダ

---

**🌟 VoidCore - 創造性の永久機関による新しいコンピューティングパラダイム**

---
*最終更新: 2025-07-08*  
*次回更新: VoidFlow分割版テスト完了時*