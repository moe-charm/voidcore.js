# 🎯 VoidCore統合設計書
**プロジェクト名**: VoidFlow-VoidCore統合アーキテクチャ設計  
**目標**: Intent駆動による統一デバッグシステム構築  
**作成日**: 2025-07-09  
**ベース分析**: VoidFlowアーキテクチャ分析結果

---

## 📋 Intent定義仕様

### **UI操作Intent（高優先度）**
```javascript
// UI要素作成
{
  type: 'voidflow.ui.element.create',
  payload: {
    nodeType: string,      // 'button', 'input', 'display', etc.
    position: { x, y },    // 配置座標
    pluginId: string,      // プラグインID
    config: object         // 設定オプション
  }
}

// UI要素移動
{
  type: 'voidflow.ui.element.move',
  payload: {
    elementId: string,     // 要素ID
    newPosition: { x, y }, // 新座標
    delta: { dx, dy },     // 移動量
    isDragging: boolean    // ドラッグ中フラグ
  }
}

// UI要素選択
{
  type: 'voidflow.ui.element.select',
  payload: {
    elementId: string,     // 選択要素ID
    multiSelect: boolean,  // 複数選択
    selectionType: string  // 'click', 'drag', 'keyboard'
  }
}

// UI要素削除
{
  type: 'voidflow.ui.element.delete',
  payload: {
    elementId: string,     // 削除要素ID
    cascade: boolean,      // 関連要素も削除
    confirm: boolean       // 確認済みフラグ
  }
}
```

### **接続管理Intent（高優先度）**
```javascript
// 接続開始
{
  type: 'voidflow.ui.connection.start',
  payload: {
    sourceId: string,      // 接続元ID
    sourceType: string,    // 'plugin', 'ui-element'
    cursor: { x, y },      // カーソル位置
    connectionMode: string // 'data', 'control', 'visual'
  }
}

// 接続完了
{
  type: 'voidflow.ui.connection.complete',
  payload: {
    sourceId: string,      // 接続元ID
    targetId: string,      // 接続先ID
    connectionType: string,// 接続タイプ
    metadata: object       // 追加情報
  }
}

// 接続キャンセル
{
  type: 'voidflow.ui.connection.cancel',
  payload: {
    reason: string,        // 'user', 'invalid-target', 'error'
    sourceId: string,      // キャンセル時の接続元
    timestamp: number      // キャンセル時刻
  }
}
```

### **プラグイン管理Intent（中優先度）**
```javascript
// プラグイン追加
{
  type: 'voidflow.ui.plugin.add',
  payload: {
    pluginId: string,      // プラグインID
    category: string,      // カテゴリ
    position: { x, y },    // 追加位置
    source: string         // 'palette', 'api', 'drag-drop'
  }
}

// プラグイン設定変更
{
  type: 'voidflow.ui.plugin.configure',
  payload: {
    pluginId: string,      // プラグインID
    newConfig: object,     // 新設定
    oldConfig: object      // 旧設定（undo用）
  }
}
```

### **デバッグIntent（専用）**
```javascript
// デバッグトレース開始
{
  type: 'voidflow.debug.trace.start',
  payload: {
    traceLevel: string,    // 'basic', 'detailed', 'verbose'
    targetIntent: string,  // 追跡対象Intent（ワイルドカード可）
    duration: number       // 追跡時間（ms）
  }
}

// 状態ダンプ
{
  type: 'voidflow.debug.state.dump',
  payload: {
    targetComponent: string, // 'ui', 'connection', 'all'
    includeHistory: boolean, // 履歴も含む
    format: string          // 'json', 'table', 'tree'
  }
}

// パフォーマンス計測
{
  type: 'voidflow.debug.performance.measure',
  payload: {
    operation: string,     // 計測対象操作
    startMarker: string,   // 開始マーカー
    endMarker: string      // 終了マーカー
  }
}
```

---

## 🏗️ 統合アーキテクチャ設計

### **アーキテクチャ全体図**
```
┌─────────────────────┐    ┌─────────────────────┐
│   VoidFlow UI       │───▶│   VoidCore Engine   │
│   (Presentation)    │    │   (Intent Handler)  │
├─────────────────────┤    ├─────────────────────┤
│ • UI Components     │    │ • Intent Router     │
│ • Event Listeners   │    │ • Message Pool      │
│ • DOM Rendering     │    │ • Stats Manager     │
└─────────────────────┘    └─────────────────────┘
           │                           │
           ▼                           ▼
┌─────────────────────┐    ┌─────────────────────┐
│   Intent Bridge     │    │   Debug Manager     │
│   (Translation)     │    │   (Monitoring)      │
├─────────────────────┤    ├─────────────────────┤
│ • Event→Intent      │    │ • Trace Logger      │
│ • Intent→Action     │    │ • Performance       │
│ • Error Mapping     │    │ • State Viewer      │
└─────────────────────┘    └─────────────────────┘
```

### **データフロー設計**
```javascript
// 1. イベント発生
[DOM Event] 
    ↓
// 2. Intent変換
[Intent Bridge] 
    ↓
// 3. VoidCore処理
[VoidCore.sendIntent()] 
    ↓
// 4. ハンドラー実行
[Intent Handler] 
    ↓
// 5. UI更新
[DOM Update] 
    ↓
// 6. デバッグログ
[Debug Logger]
```

---

## 🔧 VoidCore統合実装

### **VoidFlowCore クラス設計**
```javascript
/**
 * VoidFlowとVoidCoreの統合管理クラス
 */
class VoidFlowCore {
  constructor(options = {}) {
    // VoidCore初期化
    this.voidCore = new VoidCore({
      enableDebug: true,
      enableStats: true,
      messagePoolSize: 1000,
      ...options
    })
    
    // Intent Bridge初期化
    this.intentBridge = new VoidFlowIntentBridge(this.voidCore)
    
    // Debug Manager初期化
    this.debugManager = new VoidFlowDebugManager(this.voidCore)
    
    // UI Managers
    this.uiManager = null
    this.connectionManager = null
    this.paletteManager = null
    
    this.setupIntentHandlers()
  }
  
  /**
   * Intent ハンドラー設定
   */
  setupIntentHandlers() {
    // UI操作Intent
    this.voidCore.registerIntentHandler('voidflow.ui.element.*', 
      this.handleUIIntent.bind(this))
    
    // 接続管理Intent
    this.voidCore.registerIntentHandler('voidflow.ui.connection.*', 
      this.handleConnectionIntent.bind(this))
    
    // プラグイン管理Intent
    this.voidCore.registerIntentHandler('voidflow.ui.plugin.*', 
      this.handlePluginIntent.bind(this))
    
    // デバッグIntent
    this.voidCore.registerIntentHandler('voidflow.debug.*', 
      this.handleDebugIntent.bind(this))
  }
  
  /**
   * UI Intent処理
   */
  async handleUIIntent(intent) {
    try {
      const { type, payload } = intent
      
      switch (type) {
        case 'voidflow.ui.element.create':
          return await this.uiManager.createElement(payload)
        
        case 'voidflow.ui.element.move':
          return await this.uiManager.moveElement(payload)
        
        case 'voidflow.ui.element.select':
          return await this.uiManager.selectElement(payload)
        
        case 'voidflow.ui.element.delete':
          return await this.uiManager.deleteElement(payload)
        
        default:
          throw new Error(`Unknown UI Intent: ${type}`)
      }
    } catch (error) {
      this.debugManager.logError('UI Intent Error', error, intent)
      throw error
    }
  }
}
```

### **Intent Bridge実装**
```javascript
/**
 * 既存のイベントをIntentに変換するブリッジ
 */
class VoidFlowIntentBridge {
  constructor(voidCore) {
    this.voidCore = voidCore
    this.eventIntentMap = new Map()
    this.setupEventListeners()
  }
  
  /**
   * DOM イベント → Intent 変換
   */
  translateEvent(event, context) {
    const intentType = this.getIntentType(event, context)
    const payload = this.buildPayload(event, context)
    
    return {
      type: intentType,
      payload,
      timestamp: Date.now(),
      source: 'dom-event'
    }
  }
  
  /**
   * Intent タイプ決定
   */
  getIntentType(event, context) {
    if (event.type === 'click' && context.isPlugin) {
      return 'voidflow.ui.element.select'
    }
    if (event.type === 'mousedown' && context.isDraggable) {
      return 'voidflow.ui.element.move'
    }
    // ... その他の判定ロジック
  }
}
```

---

## 🐛 統一デバッグシステム

### **Debug Manager 設計**
```javascript
/**
 * VoidFlow専用デバッグマネージャー
 */
class VoidFlowDebugManager {
  constructor(voidCore) {
    this.voidCore = voidCore
    this.traceEnabled = false
    this.performanceMarkers = new Map()
    this.stateHistory = []
    
    this.setupDebugConsole()
  }
  
  /**
   * リアルタイムトレース
   */
  enableTrace(pattern = '*') {
    this.traceEnabled = true
    this.tracePattern = pattern
    
    this.voidCore.onIntent(pattern, (intent) => {
      console.group(`🎯 Intent: ${intent.type}`)
      console.log('📋 Payload:', intent.payload)
      console.log('⏰ Timestamp:', new Date(intent.timestamp))
      console.log('📊 Stats:', this.voidCore.getStats())
      console.groupEnd()
    })
  }
  
  /**
   * パフォーマンス計測
   */
  measurePerformance(operation, fn) {
    const startMarker = `${operation}-start`
    const endMarker = `${operation}-end`
    
    performance.mark(startMarker)
    const result = fn()
    performance.mark(endMarker)
    
    performance.measure(operation, startMarker, endMarker)
    
    const measure = performance.getEntriesByName(operation)[0]
    console.log(`⚡ ${operation}: ${measure.duration.toFixed(2)}ms`)
    
    return result
  }
  
  /**
   * 状態ダンプ
   */
  dumpState(format = 'table') {
    const state = {
      uiElements: this.getUIElementsState(),
      connections: this.getConnectionsState(),
      plugins: this.getPluginsState(),
      performance: this.getPerformanceState()
    }
    
    switch (format) {
      case 'table':
        console.table(state)
        break
      case 'json':
        console.log(JSON.stringify(state, null, 2))
        break
      case 'tree':
        console.dir(state, { depth: null })
        break
    }
    
    return state
  }
}
```

### **デバッグコンソール機能**
```javascript
// グローバルデバッグ関数
window.voidflowDebug = {
  trace: (pattern) => voidFlowCore.debugManager.enableTrace(pattern),
  dump: (format) => voidFlowCore.debugManager.dumpState(format),
  stats: () => voidFlowCore.voidCore.getStats(),
  measure: (name, fn) => voidFlowCore.debugManager.measurePerformance(name, fn),
  
  // ショートカット
  ui: () => voidflowDebug.dump('table'),
  perf: () => voidflowDebug.stats()
}
```

---

## 📊 パフォーマンス最適化

### **Intent バッチング**
```javascript
// 高頻度Intentのバッチ処理
class IntentBatcher {
  constructor(voidCore, batchSize = 10, batchTimeout = 16) {
    this.voidCore = voidCore
    this.batchSize = batchSize
    this.batchTimeout = batchTimeout
    this.intentQueue = []
    this.batchTimer = null
  }
  
  batchIntent(intent) {
    this.intentQueue.push(intent)
    
    if (this.intentQueue.length >= this.batchSize) {
      this.processBatch()
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this.processBatch(), this.batchTimeout)
    }
  }
  
  processBatch() {
    if (this.intentQueue.length === 0) return
    
    const batch = this.intentQueue.splice(0)
    this.batchTimer = null
    
    this.voidCore.sendIntent('voidflow.batch.process', { intents: batch })
  }
}
```

### **メモリ最適化**
```javascript
// Intent履歴のサイズ制限
class IntentHistoryManager {
  constructor(maxSize = 1000) {
    this.maxSize = maxSize
    this.history = []
    this.index = 0
  }
  
  addIntent(intent) {
    if (this.history.length >= this.maxSize) {
      // 古いIntentを削除（リングバッファ方式）
      this.history[this.index] = intent
      this.index = (this.index + 1) % this.maxSize
    } else {
      this.history.push(intent)
    }
  }
}
```

---

## 🎯 移行戦略

### **Phase 1: 基盤構築（1-2セッション）**
1. VoidFlowCore クラス作成
2. 基本Intent定義
3. Intent Bridge実装
4. 基本動作テスト

### **Phase 2: UI操作統合（2-3セッション）**
1. UI要素作成/削除のIntent化
2. 選択/移動のIntent化
3. イベントハンドリング移行
4. 既存機能の互換性確認

### **Phase 3: 接続管理統合（2-3セッション）**
1. 接続開始/完了のIntent化
2. 接続状態管理の統一化
3. 接続履歴とデバッグ機能
4. パフォーマンス最適化

### **Phase 4: デバッグ機能完成（1-2セッション）**
1. 統合デバッグコンソール
2. リアルタイム監視機能
3. パフォーマンス分析
4. 最終テストと調整

---

## ✅ 成功基準

### **技術指標**
- Intent処理レイテンシ: < 1ms
- メモリ使用量増加: < 10%
- デバッグ情報の精度: 99%+

### **UX指標**
- デバッグ時間短縮: 50%+
- エラー解決時間短縮: 70%+
- 開発効率向上: 30%+

---

*Last Updated: 2025-07-09*  
*Status: 設計完了・実装準備完了*