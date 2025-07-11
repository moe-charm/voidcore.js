# 🌟 CharmFlow - nyacore統合版 Visual Plugin Programming System

> **nyacore v14.0完全統合対応** | 高機能プラグインパレット & ビジュアルプログラミング環境

## 📋 概要

CharmFlowは、nyacore v14.0と完全統合された革新的なビジュアルプログラミングシステムです。直感的なドラッグ&ドロップインターフェースで、プラグインベースの柔軟なアプリケーション開発を実現します。

**🎯 2025年完全リニューアル**: VoidFlow → CharmFlow、VoidCore → nyacore、VoidCoreUI → NyaCoreUIへの大規模移行完了

## ✨ 主要機能

### 🎨 プラグインパレットシステム
- **10種類のプラグインカテゴリ**: UI、Logic、Data、Network、AI、Media、Storage、Utility、Visualization、Workflow
- **高機能検索・フィルタリング**: テキスト検索、タグ検索、カテゴリフィルタ
- **使用履歴管理**: お気に入り、最近使用、使用回数記録
- **レスポンシブレイアウト**: 20%:60%:20%の最適な画面分割

### 🏗️ アーキテクチャ
- **nyacore v14.0完全統合**: IPluginインターフェース完全対応
- **NyaCoreUI統合**: 統一されたUI操作とメッセージングシステム
- **CharmFlowCore**: デバッグ特化型nyacoreインスタンス
- **メッセージベースシステム**: 純粋非同期アーキテクチャ
- **パフォーマンス最適化**: 1000+プラグイン対応の段階的読み込み
- **Monaco Editor統合**: インブラウザコード編集環境

### 🔗 接続・実行システム
- **智能接続管理**: プラグイン間の視覚的接続作成
- **データフロー実行**: PluginFlowExecutor による高性能実行
- **リアルタイムデバッグ**: ファイル出力デバッグログシステム
- **エラーハンドリング**: 堅牢な例外処理とログ追跡

### 🐛 統合デバッグシステム
- **6カテゴリログ**: system, connection, ui, intent, performance, error
- **ファイル出力**: セッション毎の詳細ログファイル生成
- **ログセンターGUI**: カテゴリ別表示・一括ダウンロード
- **リアルタイム切り替え**: UI上でログカテゴリの有効/無効化

## 🚀 クイックスタート

### 基本的な使用方法
1. ブラウザで `charmflow/index.html` を開く
2. 左側のプラグインパレットからプラグインを選択
3. ダブルクリックまたはドラッグ&ドロップでキャンバスに配置
4. プラグイン間を接続してデータフローを構築
5. 実行ボタンでフローを開始

### 開発環境セットアップ
```bash
# ローカルサーバー起動 (推奨ポート10000)
pkill -f "python3.*http.server" 2>/dev/null || true
python3 -m http.server 10000 --bind 0.0.0.0 > /dev/null 2>&1 &

# ブラウザでアクセス
http://192.168.0.150:10000/charmflow/
```

## 📚 ドキュメント構造

### [🏗️ Architecture](./architecture/)
システムアーキテクチャ、nyacore統合、CharmFlowCore、メッセージシステムの設計文書

### [✨ Features](./features/)
プラグインパレット、接続システム、デバッグ機能、検索・フィルタリング機能の詳細

### [🔌 Plugins](./plugins/)
プラグイン開発ガイド、NyaCoreUI統合、サンプルカタログ、属性システムの説明

### [📖 Guides](./guides/)
ユーザーガイド、開発者ガイド、統合ガイド、トラブルシューティング

### [🔧 API Reference](./api/)
各システムのAPI仕様、使用例、パラメータリファレンス

### [🧪 Testing](./testing/)
テスト戦略、テスト環境、品質保証ガイドライン

### [🚀 Deployment](./deployment/)
セットアップ、設定、本番環境デプロイメント手順

### [📝 Changelog](./changelog/)
変更履歴、マイグレーションガイド、開発ロードマップ

## 🎯 主要コンポーネント

| コンポーネント | 説明 | ファイル |
|--------------|------|----------|
| **PluginPalettePlugin** | メインのプラグインパレット | `charmflow/js/plugin-palette-plugin.js` |
| **NyaCoreUI** | UI専用nyacore拡張クラス | `charmflow/js/nyacore-ui.js` |
| **CharmFlowCore** | デバッグ特化型nyacoreインスタンス | `charmflow/js/charmflow-core.js` |
| **PluginFlowExecutor** | プラグイン実行制御システム | `charmflow/js/plugin-flow-executor.js` |
| **DebugFileLogger** | ファイル出力デバッグシステム | `charmflow/js/debug-file-logger.js` |
| **ConnectionManager** | プラグイン間接続管理 | `charmflow/js/nyacore-connection-manager.js` |
| **Monaco Editor** | コード編集環境 | `charmflow/js/monaco-plugin-editor.js` |

## 🎉 2025年大改革完了実績

### Phase 1: void → charm/nya 完全移行 ✅
- [x] VoidFlow → CharmFlow 完全リネーム
- [x] VoidCore → nyacore 完全移行
- [x] VoidCoreUI → NyaCoreUI クラス名変更 (16ファイル、330行)
- [x] ファイル名統一 (7ファイルリネーム)
- [x] プラグインシステム参照修正

### Phase 2: 統合デバッグシステム完成 ✅
- [x] 6カテゴリファイル出力ログシステム
- [x] ログセンターGUI実装
- [x] リアルタイムログカテゴリ選択
- [x] セッション管理とlog保存機能

### Phase 3: プラグイン実行システム復活 ✅
- [x] "Plugin not found"エラー完全解決
- [x] window.nyaCoreUI参照統一
- [x] プラグインクリック→追加→実行 正常動作
- [x] データフロー実行完全復活

### Phase 4: UI・タイトル完全統一 ✅
- [x] CharmFlow nyacore統合版 タイトル統一
- [x] debugCharmFlow 変数名統一
- [x] 起動メッセージ・フッター更新
- [x] VoidFlow参照完全撲滅

## 🔮 今後のロードマップ

### Phase S5: 次世代機能拡張 🔮
- [ ] プラグイン間高度接続システム
- [ ] プラグインストア実装
- [ ] リアルタイム協調編集
- [ ] AI支援プラグイン開発

### Phase S6: エコシステム拡張 🔮
- [ ] クラウド同期機能
- [ ] プラグイン配布システム
- [ ] コミュニティ機能
- [ ] C++版との統合連携

## 🤝 コントリビューション

CharmFlowは継続的に進化しています。バグ報告、機能提案、コードコントリビューションを歓迎します。

### 開発プロセス
1. **Issue作成**: バグ報告や機能提案
2. **ブランチ作成**: `feature/xxx` または `fix/xxx`
3. **実装・テスト**: 品質を確保した実装
4. **Pull Request**: レビューとマージ

### デバッグ支援
- **ログ出力**: debug/フォルダにセッション毎の詳細ログ
- **ログセンター**: 右上「ログセンター」からカテゴリ別確認
- **エラー追跡**: error.logで問題の根本原因分析

## 📞 サポート

- **ドキュメント**: 各機能の詳細は対応するドキュメントを参照
- **トラブルシューティング**: [guides/troubleshooting.md](./guides/troubleshooting.md)
- **API リファレンス**: [api/](./api/) フォルダ内の各APIドキュメント
- **デバッグログ**: セッション中に生成されるログファイルでの問題分析

---

> **🎨 CharmFlow nyacore統合版** - Where Visual Programming Meets Infinite Possibility  
> *nyacore v14.0 × NyaCoreUI × 統合デバッグシステム × 直感的UI*

**Last Updated**: 2025-01-07  
**Version**: nyacore統合版 v1.0.0  
**Core Engine**: nyacore v14.0+ + CharmFlowCore  
**Migration Status**: VoidFlow → CharmFlow 完全移行完了 🎉