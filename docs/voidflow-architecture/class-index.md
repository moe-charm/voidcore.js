# 📚 VoidFlowクラス一覧・概要

**最終更新**: 2025-07-10  
**総クラス数**: 約25個  
**VoidCore準拠**: 78% → 90%+目標

## 🎯 **クイック検索**

| 関心事 | 参照クラス |
|--------|-----------|
| プラグイン作成 | VoidCoreUI, ElementManager, PluginFactory |
| 接続システム | ConnectionManager, ConnectionLineRenderer |
| UI操作 | DragDropManager, SelectionManager, CanvasManager |
| メッセージング | VoidFlowCore, HybridCommunication, MessageAdapter |
| デバッグ | DebugFileLogger, VoidCoreDebugPlugin |

---

## 🏗️ **Core Classes (継承・統合層)**

### **VoidCoreUI** `voidcore-ui.js`
```
📍 役割: GUI特化VoidCoreクラス（コンポジション方式）
🔗 継承: なし（VoidCore instance を内包）
🎯 責任: UI操作統合、Manager集約、VoidCore委譲
📊 重要度: ⭐⭐⭐⭐⭐ (中核クラス)
🚀 Phase Alpha: Intent統合によるVoidCore理念準拠強化

主要メソッド:
- createUIPlugin() : UI付きプラグイン作成
- createUIElement() : DOM要素生成  
- registerPlugin() : UnifiedPluginManager委譲
- handleClickFallback() : フォールバック処理（Phase Alpha追加）

Phase Alpha修正内容:
- Line 481: click addEventListener() → voidFlowCore.sendIntent('voidflow.ui.element.select')
- Line 512: bubble click → Intent送信 + フォールバック対応
- Line 723: handleClickFallback()メソッド追加
- async/await対応でエラーハンドリング強化
```

### **VoidFlowCore** `main-voidcore.js`
```
📍 役割: VoidFlow統合ハブ、VoidCoreUI管理
🔗 継承: なし（独立クラス）
🎯 責任: 初期化統制、Intent routing、システム統合
📊 重要度: ⭐⭐⭐⭐⭐ (エントリポイント)

主要メソッド:
- sendIntent() : Intent送信統合
- initializePhase() : 段階的初期化
- setupVoidFlowSystems() : システム構築
```

### **VoidFlowHybridCommunication** `voidflow-hybrid-communication.js`
```
📍 役割: 60FPS高速通信 + VoidCore理念両立
🔗 継承: なし（独立システム）
🎯 責任: DirectUIChannel、高速更新、非同期通知
📊 重要度: ⭐⭐⭐⭐ (性能の要)

主要メソッド:
- createFastUIChannel() : 高速チャンネル作成
- initializeHighSpeedUIChannels() : 60FPS初期化
- setupHybridChannels() : ハイブリッド構築
```

---

## 🔧 **Manager Classes (管理層)**

### **ElementManager** `ui-components/element-manager.js`
```
📍 役割: DOM要素とUIプラグインの管理
🔗 継承: なし（独立Manager）
🎯 責任: 要素登録、プラグイン管理、安全なアクセス
📊 重要度: ⭐⭐⭐⭐ (要素管理の要)

主要メソッド:
- registerElement() : DOM要素登録
- registerPlugin() : プラグインインスタンス登録
- getElement() / getPlugin() : 安全取得
```

### **ConnectionManager** `ui-components/connection-manager.js`
```
📍 役割: プラグイン間接続の管理・描画
🔗 継承: なし（独立Manager）
🎯 責任: 接続作成、線描画、データフロー管理
📊 重要度: ⭐⭐⭐⭐ (接続システムの中核)

主要メソッド:
- createConnection() : 接続作成
- renderConnectionLine() : 線描画
- executeDataFlow() : データフロー実行
```

### **CanvasManager** `ui-components/canvas-manager.js`
```
📍 役割: メインキャンバスの管理
🔗 継承: なし（独立Manager）
🎯 責任: キャンバス初期化、要素配置、座標管理
📊 重要度: ⭐⭐⭐ (描画基盤)

主要メソッド:
- setCanvas() : キャンバス設定
- appendChild() : 要素追加
- getCanvasSize() : サイズ取得
```

### **DragDropManager** `ui-components/drag-drop-manager.js`
```
📍 役割: ドラッグ&ドロップ操作管理
🔗 継承: なし（独立Manager）
🎯 責任: ドラッグ検出、移動処理、ドロップ処理
📊 重要度: ⭐⭐⭐ (UI操作性)

主要メソッド:
- startDrag() : ドラッグ開始
- updateDrag() : ドラッグ更新
- endDrag() : ドラッグ終了
```

### **SelectionManager** `ui-components/selection-manager.js`
```
📍 役割: 要素選択状態の管理
🔗 継承: なし（独立Manager）
🎯 責任: 選択状態、複数選択、選択表示
📊 重要度: ⭐⭐⭐ (UI状態管理)

主要メソッド:
- selectElement() : 要素選択
- deselectAll() : 全選択解除
- getSelectedElements() : 選択要素取得
```

### **ContextMenuManager** `ui-components/context-menu-manager.js`
```
📍 役割: 右クリックメニュー管理
🔗 継承: なし（独立Manager）
🎯 責任: メニュー表示、項目管理、アクション実行
📊 重要度: ⭐⭐ (UI拡張機能)

主要メソッド:
- showContextMenu() : メニュー表示
- hideContextMenu() : メニュー非表示
- addMenuItem() : 項目追加
```

---

## 🧩 **Plugin Classes (プラグイン層)**

### **VoidFlowNodePlugin** `voidflow-node-plugin.js`
```
📍 役割: VoidFlowノードの基本クラス
🔗 継承: IPlugin（VoidCore準拠）
🎯 責任: ノード基本機能、データ処理、UI統合
📊 重要度: ⭐⭐⭐⭐ (プラグイン基盤)

主要メソッド:
- processData() : データ処理
- handleIntent() : Intent処理
- updateUI() : UI更新
```

### **UI Plugins** `ui-nodes/*.js`
```
📍 ButtonSendUI, InputTextUI, OutputConsoleUI, StringUppercaseUI
🔗 継承: それぞれ独立（DOM UI提供）
🎯 責任: 各ノードタイプのUI表示
📊 重要度: ⭐⭐⭐ (ビジュアル要素)

主要メソッド:
- createUI() : UI要素作成
- updateDisplay() : 表示更新
- handleUserInput() : ユーザー入力処理
```

---

## 📡 **Communication Classes (通信層)**

### **VoidFlowMessageAdapter** `voidflow-message-adapter.js`
```
📍 役割: VoidPacket ↔ VoidCore Message変換
🔗 継承: なし（変換ユーティリティ）
🎯 責任: メッセージ形式変換、互換性確保
📊 重要度: ⭐⭐⭐ (通信橋渡し)

主要メソッド:
- adaptVoidPacket() : VoidPacket→Message変換
- createVoidCoreMessage() : Message作成
- extractPayload() : ペイロード抽出
```

### **VoidFlowIntentBridge** `intent-bridge.js`
```
📍 役割: Intent処理の橋渡し
🔗 継承: なし（Intent処理）
🎯 責任: Intent routing、レスポンス管理
📊 重要度: ⭐⭐⭐ (Intent統合)

主要メソッド:
- processIntent() : Intent処理
- routeToHandler() : ハンドラ振り分け
- sendResponse() : レスポンス送信
```

### **DebugFileLogger** `debug-file-logger.js`
```
📍 役割: カテゴリ別ファイル出力デバッグ
🔗 継承: なし（デバッグユーティリティ）
🎯 責任: 6カテゴリログ、ファイル出力、Claude統合
📊 重要度: ⭐⭐⭐⭐ (開発支援)

主要メソッド:
- log() : カテゴリ別ログ出力
- saveToFile() : ファイル保存
- createLogFile() : ログファイル作成
```

---

## 🔧 **Utility Classes (ユーティリティ)**

### **ConnectionLineRenderer** `connection-line-renderer.js`
```
📍 役割: 接続線の描画・計算（Phase Alpha: Intent統合完了）
🔗 継承: なし（描画ユーティリティ）
🎯 責任: ベジェ曲線、扇形分散、束ね線表示、Bundle操作
📊 重要度: ⭐⭐⭐ (ビジュアル品質)
🚀 Phase Alpha修正: Intent統合にBundle操作のaddEventListener()置き換え

主要メソッド:
- createBezierPath() : ベジェ曲線作成
- calculateFanOut() : 扇形分散計算
- renderBundleLines() : 束ね線描画
- handleBundleDetailsFallback() : Bundle詳細フォールバック
- handleBundleMenuFallback() : Bundleメニューフォールバック
- handleBundleUnbundleFallback() : Bundle解除フォールバック
```

### **PluginPalettePlugin** `plugin-palette-plugin.js`
```
📍 役割: プラグインパレットUI
🔗 継承: IPlugin（VoidCore準拠）
🎯 責任: パレット表示、プラグイン選択、作成UI
📊 重要度: ⭐⭐⭐ (ユーザーインターフェース)

主要メソッド:
- createPalette() : パレット作成
- addPluginType() : プラグインタイプ追加
- handleSelection() : 選択処理
```

---

## 🔄 **依存関係マップ**

```
VoidCoreUI (Hub)
├── ElementManager ──→ DOM要素管理
├── ConnectionManager ──→ 接続管理
├── CanvasManager ──→ キャンバス
├── DragDropManager ──→ ドラッグ操作
├── SelectionManager ──→ 選択状態
└── ContextMenuManager ──→ メニュー

VoidFlowCore
├── VoidCoreUI ──→ UI統合
├── HybridCommunication ──→ 高速通信
├── MessageAdapter ──→ 通信変換
└── DebugFileLogger ──→ ログ出力

Individual Plugins
├── VoidFlowNodePlugin ──→ ノード基盤
├── UI Plugins ──→ ビジュアル
└── PluginPalettePlugin ──→ パレット
```

---

## 🎯 **修正予定クラス**

### **🔴 Priority 1: Event Handler統一**
- VoidCoreUI: addEventListener → Intent変換
- All Managers: 直接DOM操作 → Intent経由

### **🟡 Priority 2: 混在実行パス統一**
- ConnectionManager: Intent vs Direct Call統一
- ElementManager: 一貫したメッセージルーティング

### **🟢 Priority 3: 最適化**
- HybridCommunication: Intent batching追加
- MessageAdapter: 非同期通知最適化

**🔍 詳細が必要な場合は `component-details/` フォルダ参照**