# 🐛 VoidFlow デバッグ機能 - AI開発者向けガイド

## 📋 概要

VoidFlowには包括的なデバッグシステムが組み込まれており、Phase 1の高度接続GUI開発における問題解決を支援します。このドキュメントはAI開発者が迅速に理解し、VoidFlow開発時に活用できるよう作成されています。

**最終更新**: 2025-07-10  
**対象バージョン**: VoidCore v14.0, VoidFlow Phase 1  
**重要度**: ⭐⭐⭐⭐⭐ (最重要)

---

## 🎯 デバッグシステム全体構成

### Phase 4統合デバッグシステム
```
VoidFlow Debug Ecosystem
├── DebugFileLogger (Phase 1) - ファイル出力ログシステム
├── VoidCore Debug Plugin - Intent監視・トレース
├── ConnectionLineRenderer Debug - 接続線描画デバッグ
└── Real-time Status Panel - リアルタイム統計表示
```

### 主要コンポーネント
1. **DebugFileLogger** (`/voidflow/js/debug-file-logger.js`)
2. **Debug UI Panel** (`/voidflow/index-voidcore.html`)
3. **Debug Console Commands** (ブラウザコンソール)
4. **Connection Debug Tools** (接続線デバッグ)

---

## 📁 DebugFileLogger - ファイル出力ログシステム

### 🚀 最重要機能
VoidFlow開発で最も重要なのは**DebugFileLogger**です。これは起動時に自動初期化され、全ての重要なイベントをカテゴリ別にファイル出力します。

### カテゴリ分類
```javascript
categories: [
  'system',      // システム起動・初期化
  'connection',  // 接続作成・削除・管理
  'ui',          // UI操作・イベント
  'intent',      // VoidCore Intent処理
  'performance', // パフォーマンス測定
  'error'        // エラー・例外
]
```

### 基本的な使用方法
```javascript
// デバッグログ記録
debugLogger.log('connection', 'info', '接続作成開始', {
  sourceId: 'plugin-1',
  targetId: 'plugin-2'
})

// エラーログ記録
debugLogger.log('error', 'error', '接続失敗', {
  error: error.message,
  stackTrace: error.stack
})
```

### ログエクスポート
```javascript
// 全カテゴリエクスポート
window.exportDebugLogs()

// 特定カテゴリのみ
window.exportDebugLogs('connection')

// 統計情報取得
const stats = window.getDebugStats()
console.log(stats)
```

---

## 🎮 デバッグUI操作

### メインページでの操作
VoidFlowメインページ (`/voidflow/index-voidcore.html`) には以下のデバッグボタンが配置されています：

1. **🐛 デバッグコンソール** - Phase 4統合デバッグ機能
2. **📤 ログエクスポート** - DebugFileLoggerのファイル出力
3. **📁 ファイルログパネル** - リアルタイム統計表示

### ファイルログパネル表示項目
```html
セッション: [8文字のセッションID]
接続ログ: [接続関連ログ数]
UIログ: [UI操作ログ数]  
合計サイズ: [ログファイル合計サイズ]
```

---

## 🔧 開発者向けデバッグコマンド

### ブラウザコンソールで使用可能
```javascript
// === DebugFileLogger関連 ===
debugLogger.log('connection', 'debug', 'テストメッセージ')
window.exportDebugLogs('connection')  // 接続ログのみエクスポート
window.getDebugStats()                // 統計情報表示

// === VoidFlow Phase 4統合デバッグ ===
debugVoidFlow.core()                  // VoidFlowCore取得
debugVoidFlow.debugPlugin()           // DebugPlugin取得
debugVoidFlow.getStats()              // システム統計
debugVoidFlow.startTrace(["*"])       // 全トレース開始
debugVoidFlow.stopTrace()             // トレース停止
debugVoidFlow.dumpState("json")       // 状態ダンプ

// === 簡易デバッグ関数 ===
voidflowDebug.trace("voidflow.*")     // トレース開始
voidflowDebug.stats()                 // 統計表示
voidflowDebug.benchmark("test")       // ベンチマーク
```

---

## 🔗 接続問題デバッグ

### 最重要: 接続線が表示されない問題
Phase 1開発でよく発生する問題とその解決方法：

#### 1. 接続線が1本しか表示されない
```javascript
// デバッグログで確認
debugLogger.log('connection', 'debug', 'Connection state check', {
  connectionsCount: connectionManager.connections.size,
  isConnecting: connectionManager.isConnecting,
  firstSelected: connectionManager.firstSelected,
  secondSelected: connectionManager.secondSelected
})

// 解決方法: continueMultipleConnections()が正しく動作しているか確認
if (connectionManager.continueMultipleConnections) {
  connectionManager.continueMultipleConnections()
}
```

#### 2. ConnectionLineRendererの状態確認
```javascript
// LineRenderer状態デバッグ
if (connectionManager.lineRenderer) {
  debugLogger.log('ui', 'debug', 'LineRenderer check', {
    pathsCount: connectionManager.lineRenderer.connectionPaths.size,
    svgElement: !!connectionManager.lineRenderer.svgElement,
    fanOutConfig: connectionManager.lineRenderer.fanOutConfig
  })
}
```

#### 3. Fan-out（扇形分散）デバッグ
```javascript
// Fan-out動作確認
const sourceConnections = connectionManager.getConnectionsFromSource('plugin-id')
debugLogger.log('connection', 'debug', 'Fan-out check', {
  sourceId: 'plugin-id',
  connectionCount: sourceConnections.length,
  shouldUseFanOut: sourceConnections.length >= 3
})
```

---

## 📊 パフォーマンス監視

### 自動監視項目
- 接続作成時間
- LineRenderer描画時間  
- LocalStorage使用量
- メモリ使用量（ログバッファ）

### パフォーマンスログ例
```javascript
debugLogger.log('performance', 'info', 'Connection render time', {
  operation: 'renderMultipleConnections',
  duration: `${endTime - startTime}ms`,
  connectionCount: connections.length
})
```

---

## 🚨 エラー対応フロー

### 1. エラー発生時の最初の確認
```javascript
// 1. DebugFileLoggerが動作しているか
console.log('DebugLogger status:', debugLogger.isInitialized)

// 2. エラーログを確認
window.exportDebugLogs('error')

// 3. システム統計確認
window.getDebugStats()
```

### 2. 接続関連エラー
```javascript
// 接続ログを詳細分析
window.exportDebugLogs('connection')

// ConnectionManager状態確認
debugVoidFlow.debugPlugin()
```

### 3. UI関連エラー
```javascript
// UI操作ログ確認
window.exportDebugLogs('ui')

// VoidCoreUI状態確認
debugVoidCore()
```

---

## 🔄 定期メンテナンス

### ログ管理
```javascript
// ログクリア（開発時）
window.clearDebugLogs()

// 特定カテゴリのみクリア
window.clearDebugLogs('connection')

// LocalStorage使用量確認
const stats = window.getDebugStats()
console.log('Total log size:', 
  Object.values(stats.categories)
    .reduce((sum, cat) => sum + parseFloat(cat.storageSize), 0)
)
```

### セッション管理
- 各起動で新しいセッションID生成
- ログは自動的にセッション別に分類
- LocalStorage容量制限（5MB）で自動回転

---

## 🎯 Phase 1開発での具体的な使用例

### 接続GUI問題のデバッグ手順
1. **ブラウザコンソールでデバッグコンソール起動**
   ```javascript
   openDebugConsole()
   ```

2. **接続ログの確認**
   ```javascript
   window.exportDebugLogs('connection')
   ```

3. **リアルタイム接続状態監視**
   ```javascript
   // 接続イベント時に自動ログ出力
   debugLogger.log('connection', 'debug', 'User click on plugin', {
     pluginId: selectedPlugin.id,
     isConnecting: connectionManager.isConnecting
   })
   ```

4. **問題解決後の検証**
   ```javascript
   // 修正後のテスト
   debugLogger.log('connection', 'info', 'Fix verification', {
     issue: 'single-line-display',
     solution: 'continueMultipleConnections',
     result: 'success'
   })
   ```

---

## 📝 開発時の注意事項

### 重要なファイル
- `/voidflow/js/debug-file-logger.js` - ログシステム本体
- `/voidflow/js/voidcore-connection-manager.js` - 接続管理（ログ出力統合済み）
- `/voidflow/index-voidcore.html` - デバッグUI（ファイルログパネル付き）

### 避けるべき操作
- `debugLogger.initialize()`の重複呼び出し
- 大量ログ出力によるLocalStorage圧迫
- `clearDebugLogs()`の本番環境での使用

### 推奨パターン
```javascript
// ✅ 良い例
debugLogger.log('connection', 'info', 'Connection created', {
  sourceId: source.id,
  targetId: target.id,
  timestamp: Date.now()
})

// ❌ 避ける例
console.log('接続作成:', source, target) // ファイルに残らない
```

---

## 🔮 今後の拡張予定

### Phase 2対応予定
- VoidIDEGenesis統合ログ
- リアルタイムログストリーミング
- グラフィカルデバッグビューア

### Phase 3対応予定  
- ハイブリッド通信バス統合ログ
- 分散システムデバッグ
- パフォーマンスプロファイラー

---

## 🆘 緊急時のクイックリファレンス

```javascript
// 緊急デバッグ - コピペで実行
window.exportDebugLogs()          // 全ログダウンロード
window.getDebugStats()            // 現在状態確認
openDebugConsole()                // 詳細デバッグ開始
debugVoidFlow.getStats()          // システム統計
window.clearDebugLogs()           // ログリセット（最終手段）
```

---

*このドキュメントはVoidFlow Phase 1開発で発見された問題と解決策を基に作成されています。AI開発者は必要に応じてデバッグ機能を追加し、このドキュメントを更新してください。*