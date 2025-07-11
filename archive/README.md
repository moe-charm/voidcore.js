# 📦 Archive - 整理されたファイル集

> **目的**: ルートフォルダの整理とプロジェクト構造の改善

## 📁 フォルダ構成

### **legacy-tests/** - 旧テストファイル
- **test-*.html**: 開発過程で作成された各種テストファイル (34個)
- **目的**: 機能テスト・統合テスト・デバッグ用HTML
- **状態**: 現在は使用されていないが、参考資料として保存

### **performance-tests/** - パフォーマンステスト
- **performance-benchmark*.html**: パフォーマンス測定用ファイル
- **phase-r-stress-test.html**: Phase R ストレステスト
- **目的**: システム性能の測定・ベンチマーク

### **misc-files/** - その他のファイル
- **日本語ファイル**: コアの連絡.txt、仕様書実装差分分析.md、次にやる.txt、設計大工事予定.txt
- **ログファイル**: server.log、benchmark JSON
- **セットアップファイル**: ubuntu-setup.sh
- **古い作業計画**: Phase5_作業計画_2025-01-26.md

## 🎯 整理の目的

### **ルートフォルダ簡素化**
- **現在のメインファイル**: charmflow/index.html (CharmFlow nyacore統合版)
- **重要ファイル**: src/, docs/, examples/, plugins/
- **設定ファイル**: package.json, CLAUDE.md, README.md

### **プロジェクト構造改善**
```
voidcore-js/
├── charmflow/          # メインアプリケーション
├── src/               # nyacoreコアシステム
├── docs/              # ドキュメント
├── examples/          # サンプル・デモ
├── plugins/           # プラグインライブラリ
├── debug/             # 実行時ログ
├── archive/           # 整理されたファイル (このフォルダ)
└── (設定ファイル等)
```

### **参照・復元方法**
```bash
# 旧テストファイルを参照したい場合
ls archive/legacy-tests/

# 特定のテストファイルを復元したい場合  
cp archive/legacy-tests/test-xxxx.html .

# パフォーマンステストを実行したい場合
cp archive/performance-tests/performance-benchmark.html .
```

---

## 📊 整理結果

### **移動されたファイル数**
- **テストファイル**: 33個
- **パフォーマンステスト**: 3個  
- **その他ファイル**: 9個
- **合計**: 45個のファイルを整理

### **ルートフォルダ改善効果**
- **ファイル数削減**: 45個減少
- **構造明確化**: メインコンポーネントが一目瞭然
- **保守性向上**: 必要なファイルへの迅速アクセス

---

> **🧹 クリーンアップ完了** - CharmFlow nyacore統合版の開発効率向上  
> *整理されたプロジェクト構造で、集中して開発を進められるにゃ！*

**Cleanup Date**: 2025-01-07  
**Archived Files**: 45個  
**Main Application**: charmflow/index.html