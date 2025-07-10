# 🐱 VoidCore開発ルール・設定ファイル

## 🔥 重要: サーバー設定（必読）
**テスト用サーバー: ポート10000番を使用**
- URL: `http://192.168.0.150:10000`

## 📡 ローカルサーバー管理ルール

### **環境情報（Ubuntu環境）**
- **IPアドレス**: 192.168.0.150
- **ポート**: 10000（8000番は既に使用中）
- **テストURL**: `http://192.168.0.150:10000`

### **サーバー起動手順**
```bash
# 1. 既存サーバー全停止（競合回避）
pkill -f "python3.*http.server" 2>/dev/null || true

# 2. バックグラウンドでサーバー起動（Ubuntu・全インターフェイス）
python3 -m http.server 10000 --bind 0.0.0.0 > /dev/null 2>&1 &

# 3. 起動確認（2秒待機）
sleep 2
ps aux | grep "python3.*http.server.*10000" | grep -v grep

# 4. 接続テスト
curl -s http://localhost:10000 > /dev/null && echo "✅ Server ready on port 10000" || echo "❌ Server failed"
```

### **📋 実際の実行例（2025-01-07確認済み）**
```bash
# Step 1: 既存サーバー停止
$ pkill -f "python3.*http.server" 2>/dev/null || true

# Step 2: サーバー起動
$ python3 -m http.server 8000 --bind localhost > /dev/null 2>&1 &

# Step 3: プロセス確認
$ sleep 2; ps aux | grep "python3.*http.server.*8000" | grep -v grep
tomoaki    74909  0.0  0.0  27404 19788 ?        S    17:40   0:00 python3 -m http.server 8000 --bind localhost

# Step 4: 接続確認
$ curl -s http://localhost:8000 > /dev/null && echo "✅ Server ready on port 8000" || echo "❌ Server failed"
✅ Server ready on port 8000
```

### **サーバー管理コマンド**
```bash
# サーバー状態確認
ps aux | grep "python3.*http.server.*8000"

# サーバー停止
pkill -f "python3.*http.server.*8000"

# サーバー再起動
pkill -f "python3.*http.server.*8000" 2>/dev/null; python3 -m http.server 8000 --bind localhost > /dev/null 2>&1 &
```

### **🐱 にゃー専用ワンライナー**
```bash
# 📡 サーバー立て直し（Ubuntu版・ポート10000）
pkill -f "python3.*http.server" 2>/dev/null || true; python3 -m http.server 10000 --bind 0.0.0.0 > /dev/null 2>&1 & sleep 2; echo "✅ Server ready: http://192.168.0.150:10000"

# 🧪 テストページ直接アクセス（IPアドレス: 192.168.0.150）
# Phase S3テスト: http://192.168.0.150:10000/test-voidflow-phase-s3-integration.html
# Phase Rテスト: http://192.168.0.150:10000/test-voidflow-phase-r-integration-fixed.html
# 簡易テスト: http://192.168.0.150:10000/test-voidflow-simple.html
```

### **📋 Ubuntu環境での実行手順（2025-01-07確認済み）**
```bash
# Step 1: ポート使用状況確認
$ ss -tuln | grep -E ':(8000|10000)'
tcp   LISTEN 0      4096                0.0.0.0:8000       0.0.0.0:*          

# Step 2: ポート10000でサーバー起動
$ python3 -m http.server 10000 --bind 0.0.0.0 > /dev/null 2>&1 &

# Step 3: プロセス確認
$ sleep 2; ps aux | grep "python3.*http.server.*10000" | grep -v grep
tomoaki  2799008  0.6  0.1  31220 17664 ?        S    21:02   0:00 python3 -m http.server 10000 --bind 0.0.0.0

# Step 4: 接続確認
$ curl -s http://localhost:10000 > /dev/null && echo "✅ Server ready on port 10000" || echo "❌ Server failed"
✅ Server ready on port 10000
```

### **⚠️ トラブル時の対処法**
```bash
# 🔥 完全リセット（全httpサーバー停止）
sudo pkill -f "python.*http.server" 2>/dev/null || true
sleep 1
python3 -m http.server 8000 --bind localhost > /dev/null 2>&1 &

# 🔍 ポート占有確認
lsof -i :8000

# 🏥 緊急時別ポート使用
python3 -m http.server 8001 --bind localhost > /dev/null 2>&1 &
# その場合: http://localhost:8001 でアクセス
```

### **トラブルシューティング**
- **ポート占有エラー**: 上記停止コマンドで既存サーバー終了
- **接続エラー**: 2-3秒待ってから再試行
- **権限エラー**: sudo不要、localhost bindで回避

---

## 🧪 テスト実行ルール

### **テストURL形式**
- 基本テスト: `http://localhost:8000/test-*.html`
- VoidFlowテスト: `http://localhost:8000/test-voidflow-*.html`
- Phase別テスト: `http://localhost:8000/test-*-phase-*.html`

### **テスト前チェックリスト**
1. ✅ サーバー8000番起動確認
2. ✅ 必要ファイル存在確認
3. ✅ ブラウザ開発者ツール準備
4. ✅ エラーログ監視準備

---

## 🐛 VoidFlowデバッグシステム完全ガイド

### **🎯 システム概要**
VoidFlowには高度なファイル出力デバッグシステムが実装されています。
Claude AIが効率的にデバッグできるよう設計された統合システムです。

### **📁 デバッグファイル構造**
```
debug/
├── voidflow-connection-YYYY-MM-DD-xxxxx-yyyyy.log  # 接続管理ログ
├── voidflow-system-YYYY-MM-DD-xxxxx-yyyyy.log      # システムログ
├── voidflow-ui-YYYY-MM-DD-xxxxx-yyyyy.log          # UIイベントログ
├── voidflow-intent-YYYY-MM-DD-xxxxx-yyyyy.log      # Intentログ
├── voidflow-performance-YYYY-MM-DD-xxxxx-yyyyy.log # パフォーマンスログ
└── voidflow-error-YYYY-MM-DD-xxxxx-yyyyy.log       # エラーログ
```

### **🔧 コアコンポーネント**

#### **1. DebugFileLogger (`debug-file-logger.js`)**
```javascript
// カテゴリ別ログファイル出力
const categories = ['system', 'connection', 'ui', 'intent', 'performance', 'error']

// 使用例
debugLogger.log('connection', 'debug', '🔗 接続作成', { sourceId, targetId })
```

#### **2. VoidCoreDebugPlugin (`voidcore-debug-plugin.js`)**
```javascript
// VoidCore統合デバッグプラグイン（パフォーマンス最適化済み）
// デバッグモード無効時は全メソッドno-op化
setupNoOpMethods() // パフォーマンス影響ゼロ
```

#### **3. ログセンターGUI**
- **場所**: メインページ右上「ログセンター」ボタン
- **機能**: カテゴリ別ログ表示・一括ダウンロード
- **ショートカット**: 全ログ自動保存ボタンあり

### **🚀 Claude開発ワークフロー**

#### **Phase 1: 問題発生時**
1. ユーザーが「ログ保存したにゃ」と報告
2. Claude: `LS /debug` で最新ログファイル確認
3. Claude: `Read` で関連ログファイル分析
4. 問題の根本原因特定

#### **Phase 2: ChatGPT連携**
1. 複雑な問題はChatGPTに相談可能
2. ログファイルを共有して詳細分析
3. ChatGPTの提案をVoidFlowに実装

#### **Phase 3: 修正→検証**
1. 問題修正後、再テスト実行
2. 新しいログで修正確認
3. 必要に応じて追加デバッグログ追加

### **📊 ログカテゴリ詳細**

| カテゴリ | 用途 | 重要度 | 例 |
|---------|------|--------|-----|
| `system` | 起動・初期化・プラグイン管理 | 🔥高 | VoidCore初期化、プラグイン登録 |
| `connection` | 接続作成・描画・削除 | 🔥高 | 接続線表示、扇形分散 |
| `ui` | UI操作・イベント・レスポンス | 🔶中 | クリック、ドラッグ、メニュー |
| `intent` | Intent処理・変換・配信 | 🔶中 | Intent解析、プラグイン通信 |
| `performance` | 処理時間・メモリ・最適化 | 🔸低 | 描画時間、メモリ使用量 |
| `error` | エラー・例外・警告 | 🚨最高 | 接続失敗、プラグインエラー |

### **🛠️ 開発者向け使用方法**

#### **ログ出力**
```javascript
// 基本形
this.log('🔗 接続作成開始')

// データ付きログ（推奨）
this.log('🔗 接続作成', { sourceId, targetId, type })

// カテゴリ指定
debugLogger.log('connection', 'debug', 'メッセージ', data)
```

#### **パフォーマンス測定**
```javascript
const startTime = performance.now()
// 処理実行
const duration = performance.now() - startTime
debugLogger.log('performance', 'info', `処理時間: ${duration}ms`)
```

### **🎯 よくある問題とログ解析**

#### **接続線が表示されない**
```bash
# チェック項目
grep "🌀 接続描画" debug/voidflow-connection-*.log
grep "扇形分散" debug/voidflow-connection-*.log
grep "SVG element" debug/voidflow-connection-*.log
```

#### **右クリックメニューが出る**
```bash
# チェック項目  
grep "右クリック" debug/voidflow-connection-*.log
grep "contextmenu" debug/voidflow-ui-*.log
grep "接続モード" debug/voidflow-connection-*.log
```

#### **プラグイン読み込み失敗**
```bash
# チェック項目
grep "プラグイン" debug/voidflow-system-*.log
grep "エラー" debug/voidflow-error-*.log
grep "404" debug/voidflow-system-*.log
```

### **⚠️ 重要な注意点**

1. **ログファイルはセッション毎に生成** - F5で新しいログファイル
2. **重いログ出力は自動でno-op化** - パフォーマンス影響なし
3. **Claudeは必ず最新ログを確認** - タイムスタンプ確認必須
4. **問題再現時は必ずログ保存** - エビデンス重要

### **🎉 成功事例**

最近解決した主要問題：
- ✅ 2本接続重複表示 → 扇形分散閾値修正
- ✅ 接続モード継続問題 → 空白クリック検出追加  
- ✅ 右クリックメニュー表示 → キャプチャフェーズ実装
- ✅ F5自動保存問題 → enableAutoExport無効化

---

## 📝 開発・コミットルール

### **🎯 重要ルール: 次にやることの管理**
- **すぐやる作業**: `docs/next/優先度高い/` に記載
- **将来予定**: `docs/next/予定計画/` に記載
- **禁止**: CLAUDE.mdに次回予定を詳細記載
- **目的**: 役割分離と情報整理

### **📁 作業管理フォルダ構造**
```
docs/next/
├── 優先度高い/          # 🔥 今すぐやること
└── 予定計画/            # 🔮 将来実装予定
```

## 📝 開発・コミットルール

### **ファイル命名規則**
- テストファイル: `test-[機能名]-[phase名].html`
- ドキュメント: `docs/[機能名]_[バージョン]_[言語].md`
- レポート: `docs/[分析対象]分析レポート.md`

### **コミットメッセージ形式**
```
[type]: 🚀 [Phase/機能名] - [概要]

✨ 主要変更:
• [変更点1]
• [変更点2]

🎯 [効果・達成]:
• [効果1]
• [効果2]

📊 [数値的成果]:
• [削減行数/改善率など]

🧪 [テスト]:
• [テストファイル名]

🎉 Generated with [Claude Code](https://claude.ai/code)
Co-Authored-By: Claude <noreply@anthropic.com>
```

### **ブランチ戦略**
- `master`: 安定版
- 大型リファクタリング時は一時ブランチ作成検討

---

## 🔧 開発環境設定

### **推奨エディタ設定**
- タブ幅: 2スペース
- 文字コード: UTF-8
- 改行コード: LF

### **必須チェックコマンド**
- 型チェック: `npm run typecheck` (利用可能時)
- リント: `npm run lint` (利用可能時)
- テスト: `npm test` (利用可能時)

---

## 📁 完了プロジェクト管理ルール

### **📦 アーカイブ場所**
- **場所**: `docs/completed-projects/`
- **目的**: 終わったプロジェクトの体系的整理・保存

### **🗂️ フォルダ命名規則**
```
docs/completed-projects/YYYY-MM-DD-project-name/
```

### **📋 必須ファイル**
- `README.md` - プロジェクト完了報告書
- 技術仕様・実装詳細ドキュメント
- 削除ファイル情報（該当時）

### **🎯 アーカイブ対象**
- ✅ 明確な成果物があり完了したプロジェクト
- ✅ 技術革新・新手法を確立したプロジェクト
- ✅ アーキテクチャに重要な影響を与えた変更
- ✅ 将来の開発に参考価値のあるプロジェクト

### **📚 現在のアーカイブ**
- `2025-07-09-voidflow-phase4-debug-integration/` - VoidFlow Phase 4統合デバッグシステム完成
- `2025-07-08-voidcore-purification/` - VoidCore純化（3,251行削減）
- `2025-07-06-voidflow-phase4/` - VoidFlow Phase 4完成
- `2025-01-26-phase5-initialization-fix/` - 初期化競合解決
- `2025-01-07-voidflow-analysis/` - VoidFlow分析・統合計画

---

## 📋 Phase管理

### **現在のPhase状況**
- ✅ Phase R: VoidCore統一Intentアーキテクチャ (完了)
- ✅ Phase S3: VoidFlowNodePlugin → IPlugin統合 (完了)
- ✅ VoidCore純化プロジェクト: 後方互換性削除・ローカルコピー戦略 (完了)
- ✅ Phase 4: VoidFlow統合デバッグシステム完成 (完了 2025-07-09)
- 🔄 Phase 5準備: 次期開発計画策定中

### **参考: 将来戦略ノート**
- 詳細な次回作業は `次にやる.txt` 参照
- 完了プロジェクトは `docs/completed-projects/` に整理済み

---

*Last Updated: 2025-07-09*  
*VoidFlow Phase 4統合デバッグシステム完成 + ドキュメント整理完了*