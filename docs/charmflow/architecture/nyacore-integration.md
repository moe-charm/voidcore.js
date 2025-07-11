# 🔗 nyacore v14.0 統合ガイド

> **CharmFlow × nyacore統合アーキテクチャ** - 純粋メッセージベースシステムの実現

## 🎯 統合概要

CharmFlowは、nyacore v14.0の純粋メッセージベースアーキテクチャと完全に統合されており、IPluginインターフェースに準拠したプラグインシステムを提供します。

**🎉 2025年大改革完了**: VoidCore → nyacore、VoidCoreUI → NyaCoreUIへの完全移行により、統一されたアーキテクチャを実現。

## 🏗️ 統合アーキテクチャ

### システム構成図
```
┌─────────────────────────────────────────────────────────┐
│              CharmFlow nyacore統合版                      │
├─────────────────┬─────────────────┬───────────────────┤
│ PluginPalette   │   Canvas Area   │ Properties Panel  │
│                 │                 │                   │
│ ┌─────────────┐ │ ┌─────────────┐ │ ┌───────────────┐ │
│ │   Search    │ │ │ NyaCoreUI   │ │ │  ログセンター  │ │
│ │   Filter    │ │ │ Elements    │ │ │  カテゴリ選択  │ │
│ │   Grid      │ │ │ Connections │ │ │  Debug Stats  │ │
│ └─────────────┘ │ └─────────────┘ │ └───────────────┘ │
└─────────────────┴─────────────────┴───────────────────┘
                          │
                ┌─────────┴─────────┐
                │   nyacore v14.0    │
                │                   │
                │ ┌───────────────┐ │
                │ │ IPlugin       │ │
                │ │ Interface     │ │
                │ └───────────────┘ │
                │ ┌───────────────┐ │
                │ │ Message       │ │
                │ │ System        │ │
                │ └───────────────┘ │
                │ ┌───────────────┐ │
                │ │ Plugin        │ │
                │ │ Manager       │ │
                │ └───────────────┘ │
                └───────────────────┘
                          │
                ┌─────────┴─────────┐
                │  CharmFlowCore     │
                │ (デバッグ特化型)    │
                │                   │
                │ ┌───────────────┐ │
                │ │ DebugFile     │ │
                │ │ Logger        │ │
                │ └───────────────┘ │
                └───────────────────┘
```

## 🌟 主要統合コンポーネント

### 1. NyaCoreUI クラス
```javascript
// nyacore-ui.js - UI専用nyacore拡張クラス
export class NyaCoreUI {
  constructor(options = {}) {
    // nyacoreをコンポジションで統合
    this.voidCore = new VoidCore(null, {
      debug: options.debug || true,
      uiMode: true
    })
    
    // UI専用機能を追加
    this.canvasManager = new CanvasManager(this)
    this.dragDropManager = new DragDropManager(this)
    this.connectionManager = new ConnectionManager(this)
  }
}
```

**役割**:
- nyacoreの全機能を継承
- UI専用機能の追加レイヤー
- DOM操作とnyacoreメッセージングの橋渡し

### 2. CharmFlowCore (デバッグ特化型)
```javascript
// charmflow-core.js - デバッグ専用nyacoreインスタンス
export class CharmFlowCore {
  constructor() {
    // デバッグ特化設定
    this.debugMode = true
    this.enableFileLogging = true
    this.logCategories = ['system', 'connection', 'ui', 'intent', 'performance', 'error']
  }
}
```

**役割**:
- デバッグログ出力専用のnyacoreインスタンス
- ファイル出力デバッグログシステム統合
- パフォーマンス監視・分析

### 3. PluginFlowExecutor
```javascript
// plugin-flow-executor.js - プラグイン実行制御
export class PluginFlowExecutor extends IPlugin {
  async executePlugin(payload) {
    const { pluginId, input, options } = payload
    
    // プラグイン取得・実行
    const plugin = this.getPluginById(pluginId)
    const result = await this.executePluginSafely(plugin, input, options)
    
    // データフロー処理
    if (result && this.connectionManager) {
      await this.connectionManager.executeDataFlow(pluginId, result)
    }
  }
}
```

**役割**:
- プラグイン間実行順序管理
- エラーハンドリング・タイムアウト制御
- データフロー処理の統合

## 🔄 メッセージフロー

### 1. UI操作 → nyacore メッセージング
```javascript
// UI操作をnyacoreメッセージに変換
async handlePluginClick(pluginId) {
  const message = Message.command('charmflow.plugin.execute', {
    pluginId: pluginId,
    timestamp: Date.now()
  })
  
  await this.nyaCoreUI.publish(message)
}
```

### 2. nyacore → CharmFlowCore データ連携
```javascript
// nyacoreからCharmFlowCoreへのデバッグデータ送信
async sendDebugData(category, data) {
  if (this.charmFlowCore) {
    await this.charmFlowCore.logToFile(category, data)
  }
}
```

### 3. プラグイン間通信
```javascript
// PluginFlowExecutor経由のプラグイン間データフロー
async executeDataFlow(sourcePluginId, data) {
  const connections = this.getConnectionsFrom(sourcePluginId)
  
  for (const connection of connections) {
    await this.flowExecutor.executePlugin({
      pluginId: connection.targetPluginId,
      input: data,
      autoExecution: true
    })
  }
}
```

## 📊 統合実績 (2025年1月完了)

### Phase 1: 名称統一 ✅
- **VoidCore → nyacore**: 全参照を更新
- **VoidCoreUI → NyaCoreUI**: クラス名・16ファイル・330行変更
- **VoidFlow → CharmFlow**: UI・タイトル・ドキュメント統一
- **window.voidCoreUI → window.nyaCoreUI**: グローバル参照統一

### Phase 2: アーキテクチャ統合 ✅
- **NyaCoreUIコンポジション設計**: 継承 → コンポジション変更
- **CharmFlowCore分離**: デバッグ特化型nyacoreインスタンス
- **PluginFlowExecutor**: 統一プラグイン実行システム
- **デバッグログ統合**: 6カテゴリファイル出力システム

### Phase 3: 動作統合 ✅
- **プラグイン実行復活**: "Plugin not found"エラー解決
- **データフロー実行**: プラグイン間接続・実行完全復活
- **UI統合**: ドラッグ&ドロップ・接続作成正常動作
- **デバッグGUI**: ログセンター・カテゴリ選択実装

## 🛠️ 開発ガイド

### NyaCoreUIプラグイン作成
```javascript
// UI専用プラグインの基本形
export class CustomUIPlugin {
  static createUIElement(nyaCoreUI, config) {
    const element = document.createElement('div')
    element.className = 'voidcore-ui-element'
    
    // NyaCoreUIとの統合
    nyaCoreUI.elementManager.registerElement(config.id, element)
    
    return element
  }
}
```

### デバッグログ出力
```javascript
// DebugFileLoggerでのログ出力
debugLogger.log('connection', 'info', '接続作成', {
  sourceId: sourcePluginId,
  targetId: targetPluginId,
  timestamp: Date.now()
})
```

### プラグイン実行
```javascript
// PluginFlowExecutor経由での実行
await window.flowExecutor.executePlugin({
  pluginId: 'nyacore-plugin-12345',
  input: { message: 'Hello CharmFlow!' },
  options: { timeout: 5000 }
})
```

## 🎯 今後の拡張計画

### Phase S5: 高度統合機能
- [ ] nyacore Intent Bridge 2.0
- [ ] リアルタイム協調編集
- [ ] プラグインストア統合
- [ ] AI支援開発環境

### Phase S6: エコシステム統合
- [ ] C++版nyacoreとの相互運用
- [ ] クラウド同期・配布システム
- [ ] コミュニティプラグイン管理
- [ ] 企業向け統合ソリューション

---

> **🎨 CharmFlow nyacore統合版** - 純粋メッセージベースアーキテクチャの完全実現  
> *nyacore v14.0 × NyaCoreUI × CharmFlowCore × 統合デバッグシステム*

**Last Updated**: 2025-01-07  
**Integration Status**: VoidCore → nyacore 完全移行完了 🎉  
**Architecture Version**: nyacore統合版 v1.0.0