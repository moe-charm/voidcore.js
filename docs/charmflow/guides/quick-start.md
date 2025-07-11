# 🚀 VoidFlow Quick Start Guide

> **5分で始めるVoidFlow** - セットアップから初回プラグイン実行まで

## 📋 前提条件

- **Python 3.6+** (ローカルサーバー用)
- **モダンブラウザ** (Chrome 90+, Firefox 88+, Safari 14+)
- **基本的なJavaScript知識** (プラグイン開発時)

## ⚡ 5分セットアップ

### Step 1: プロジェクトの取得
```bash
# GitHubからクローン
git clone https://github.com/your-repo/voidcore-js.git
cd voidcore-js

# または、ZIPファイルをダウンロード・展開
```

### Step 2: ローカルサーバー起動
```bash
# ポート10000でサーバー起動
python3 -m http.server 10000 --bind 0.0.0.0

# サーバー起動確認
curl -s http://localhost:10000 > /dev/null && echo "✅ Server ready" || echo "❌ Server failed"
```

### Step 3: VoidFlowを開く
ブラウザで以下のURLにアクセス：
```
http://localhost:10000/voidflow/index-voidcore.html
```

## 🎨 初回使用ガイド

### 画面構成の理解
```
┌─────────────────────────────────────────────────────────────┐
│                    VoidFlow Interface                       │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Plugin        │   Canvas Area   │   Properties Panel      │
│   Palette       │                 │                         │
│   (20%)         │   (60%)         │   (20%)                 │
│                 │                 │                         │
│ 🔍 Search       │ 🎨 Visual       │ ⚙️ Settings             │
│ 🏷️ Categories   │ 🔗 Connections  │ 📊 Statistics           │
│ ❤️ Favorites    │ ⚡ Execution    │ 🐛 Debug Info           │
│ 📊 Statistics   │ 🖱️ Drag & Drop  │ 📝 Logs                │
└─────────────────┴─────────────────┴─────────────────────────┘
```

### 🎯 Step 1: プラグインの探索

#### 1.1 検索機能を使用
```
🔍 検索バーに "button" と入力
→ UIボタンプラグインが表示される
```

#### 1.2 カテゴリフィルタを使用
```
🏷️ "UI" タブをクリック
→ UI関連のプラグインのみ表示
```

#### 1.3 優先度フィルタを使用
```
⚡ "高優先度" ボタンをクリック
→ 重要なプラグインのみ表示
```

### 🎯 Step 2: 初回プラグイン実行

#### 2.1 Interactive Buttonプラグインを追加
```
1. 左側のパレットで "🔘 Interactive Button" を見つける
2. プラグインをダブルクリック
3. 中央のキャンバスエリアにプラグインが表示される
```

#### 2.2 プラグインの実行
```
1. キャンバス上のプラグインをクリック
2. 右側のプロパティパネルで設定を確認
3. "🚀 VoidCore実行" ボタンをクリック
4. 実行ログで結果を確認
```

#### 2.3 お気に入りに追加
```
1. パレット内のプラグインの ❤️ ボタンをクリック
2. プラグインがお気に入りに追加される
3. "❤️ お気に入り" フィルタで確認
```

### 🎯 Step 3: 複数プラグインの連携

#### 3.1 Input Textプラグインを追加
```
1. 検索バーに "input" と入力
2. "📝 Input Text" プラグインをダブルクリック
3. キャンバスに2つのプラグインが表示される
```

#### 3.2 String UpperCaseプラグインを追加
```
1. 検索バーに "uppercase" と入力
2. "🔤 String UpperCase" プラグインをダブルクリック
3. キャンバスに3つのプラグインが表示される
```

#### 3.3 Output Consoleプラグインを追加
```
1. 検索バーに "console" と入力
2. "📊 Output Console" プラグインをダブルクリック
3. キャンバスに4つのプラグインが表示される
```

#### 3.4 データフローの実行
```
1. Input Textプラグインでテキストを入力
2. 各プラグインを順番に実行
3. Console出力でデータ変換を確認
```

## 🛠️ 基本操作ガイド

### 検索・フィルタリング

#### テキスト検索
```
🔍 検索バーの使用方法:
• プラグイン名で検索: "button"
• 説明で検索: "interactive"
• タグで検索: "ui"
• 複数キーワード: "button ui"
```

#### カテゴリフィルタ
```
🏷️ 利用可能なカテゴリ:
• UI - ユーザーインターフェース
• Logic - ロジック・演算
• Data - データ処理
• Network - ネットワーク・通信
• AI - AI・機械学習
• Media - メディア・画像
• Storage - ストレージ・データベース
• Utility - ユーティリティ・ツール
• Visualization - 可視化・グラフ
• Workflow - ワークフロー・自動化
```

#### 優先度フィルタ
```
⚡ 優先度レベル:
• 高優先度 (High) - 重要・頻繁に使用
• 中優先度 (Medium) - 一般的な使用
• 低優先度 (Low) - 特殊・まれに使用
```

### プラグイン管理

#### お気に入り管理
```
❤️ お気に入り機能:
• 追加: プラグインの ❤️ ボタンをクリック
• 表示: "❤️ お気に入り" フィルタを使用
• 削除: 再度 ❤️ ボタンをクリック
```

#### 使用履歴
```
🕐 最近使用機能:
• 自動記録: プラグイン実行時に自動更新
• 表示: "🕐 最近使用" フィルタを使用
• 最大10個まで保持
```

#### 使用統計
```
📊 統計情報:
• 使用回数: 各プラグインの使用頻度
• 表示数: 現在表示中のプラグイン数
• 総数: 全プラグイン数
```

### キャンバス操作

#### プラグイン追加
```
➕ プラグイン追加方法:
1. ダブルクリック: パレット内のプラグインをダブルクリック
2. ドラッグ&ドロップ: パレットからキャンバスにドラッグ
3. 右クリック: 将来的なコンテキストメニュー
```

#### プラグイン移動
```
🖱️ プラグイン移動:
1. プラグインをクリック&ドラッグ
2. 任意の位置に移動
3. 位置情報は自動保存
```

#### プラグイン設定
```
⚙️ 設定変更:
1. プラグインをクリックして選択
2. 右側のプロパティパネルで設定編集
3. 設定は即座に反映
```

## 🎮 実践例: 簡単なワークフロー

### 例1: テキスト変換フロー
```
📝 Input Text → 🔤 String UpperCase → 📊 Output Console

1. Input Textプラグインでテキスト入力
2. String UpperCaseプラグインで大文字変換
3. Output Consoleプラグインで結果表示
```

### 例2: データ取得・処理フロー
```
🌐 HTTP Client → 📊 JSON Parser → 📈 Chart Visualization

1. HTTP Clientプラグインでデータ取得
2. JSON Parserプラグインでデータ解析
3. Chart Visualizationプラグインで可視化
```

### 例3: AIテキスト処理フロー
```
📝 Input Text → 🤖 AI Text Generator → 💾 Database Storage

1. Input Textプラグインでプロンプト入力
2. AI Text Generatorプラグインでテキスト生成
3. Database Storageプラグインで結果保存
```

## 🐛 よくある問題と解決方法

### 問題1: プラグインが表示されない
```
❌ 症状: プラグインパレットが空
✅ 解決方法:
1. ブラウザのコンソールでエラーを確認
2. サーバーが正常に起動していることを確認
3. ページを再読み込み (F5 または Ctrl+R)
```

### 問題2: プラグインの実行に失敗する
```
❌ 症状: "❌ Plugin execution failed" エラー
✅ 解決方法:
1. プラグインの設定を確認
2. 必要な入力データが提供されているか確認
3. 実行ログでエラー詳細を確認
```

### 問題3: VoidCore統合版初期化タイムアウト
```
❌ 症状: "⚠️ VoidCore統合版初期化タイムアウト"
✅ 解決方法:
1. ページを再読み込み
2. ブラウザのキャッシュをクリア
3. 開発者ツールでJavaScriptエラーを確認
```

### 問題4: 検索結果が表示されない
```
❌ 症状: 検索しても結果が出ない
✅ 解決方法:
1. 検索語句を短くしてみる
2. フィルタをクリアしてみる
3. "全て" カテゴリタブをクリック
```

## 🔧 開発者向けクイックスタート

### プラグイン開発環境の準備
```bash
# 開発用ツールのインストール
npm install -g live-server

# 開発サーバー起動
live-server --port=10000 --host=0.0.0.0
```

### 簡単なプラグイン作成
```javascript
// カスタムプラグインの作成
import { IPlugin } from '../../src/interfaces/plugin-interface.js'

class MyCustomPlugin extends IPlugin {
  constructor(pluginData) {
    super(pluginData)
  }
  
  async handleMessage(message) {
    if (message.intent === 'plugin.execute') {
      return {
        type: 'success',
        value: 'Hello from custom plugin!',
        pluginId: this.id
      }
    }
  }
}

// プラグインデータ
const customPluginData = {
  id: 'my-custom-plugin',
  name: 'My Custom Plugin',
  displayName: '⭐ My Custom Plugin',
  category: 'Utility',
  type: 'utility.custom',
  description: 'A simple custom plugin example'
}
```

### プラグインの追加
```javascript
// simple-plugins.js に追加
export const simplePlugins = [
  // 既存のプラグイン...
  customPluginData
]
```

## 📚 次のステップ

### 学習リソース
1. **[Plugin Development Guide](../plugins/development-guide.md)** - 詳細なプラグイン開発
2. **[Architecture Overview](../architecture/overview.md)** - システムアーキテクチャ
3. **[API Reference](../api/)** - API仕様と使用例

### 実践プロジェクト
1. **カスタムプラグイン作成** - 独自のプラグインを開発
2. **プラグイン連携** - 複数プラグインの連携ワークフロー
3. **レイアウトカスタマイズ** - 独自のレイアウトアルゴリズム

### コミュニティ
1. **GitHub Issues** - バグ報告・機能要求
2. **Discussions** - 質問・アイデア共有
3. **Pull Requests** - コードコントリビューション

## 🎯 達成目標チェックリスト

### 基本操作 ✅
- [ ] VoidFlowの起動
- [ ] プラグインの検索・フィルタリング
- [ ] プラグインのキャンバス追加
- [ ] プラグインの実行
- [ ] お気に入り管理

### 応用操作 🚀
- [ ] 複数プラグインの連携
- [ ] プラグイン設定の変更
- [ ] 使用統計の確認
- [ ] レイアウトの変更
- [ ] カスタムワークフローの作成

### 開発者向け 🛠️
- [ ] カスタムプラグインの作成
- [ ] プラグインのテスト
- [ ] デバッグ手法の習得
- [ ] コードコントリビューション

---

## 🔗 リンク集

- **メインドキュメント**: [VoidFlow README](../README.md)
- **アーキテクチャ**: [Architecture Overview](../architecture/overview.md)
- **プラグイン開発**: [Plugin Development Guide](../plugins/development-guide.md)
- **API仕様**: [API Reference](../api/)
- **トラブルシューティング**: [Troubleshooting](./troubleshooting.md)

---

**🎉 VoidFlowの世界へようこそ！**

このクイックスタートガイドで基本的な使い方を学んだら、ぜひ他のドキュメントも参照して、VoidFlowの可能性を最大限に活用してください。

**Last Updated**: 2025-07-09  
**Author**: VoidFlow Development Team  
**Version**: v1.0.0