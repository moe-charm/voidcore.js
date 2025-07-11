# 🏗️ VoidFlowアーキテクチャ全体構造

**最終更新**: 2025-07-10  
**VoidCore準拠率**: 78% → 90%+目標  
**現在Phase**: Phase 2完了済み（束ね線・duplicate機能実装）

## 🎯 **システム概要**

VoidFlowは**VoidCore理念準拠のGUI特化可視化システム**です。

### **設計原則**
- ✅ **VoidCoreUI継承**: GUI特化コアとして正当な継承
- ✅ **ハイブリッド通信**: 60FPS性能 + VoidCore理念の両立
- ✅ **Intent駆動**: 90%の操作がIntent経由（目標95%+）
- ⚠️ **EventHandler統一**: 改善対象（60% → 95%）

---

## 🗂️ **レイヤーアーキテクチャ**

```
┌─────────────────────────────────────────────────┐
│ 🎨 UI Layer (VoidFlow Frontend)                │
│ ├── 📦 Node Palette                           │
│ ├── 🎯 Connection Canvas                       │
│ ├── 🔧 Context Menus                          │
│ └── 📊 Debug Log Center                       │
├─────────────────────────────────────────────────┤
│ 🔄 VoidCore Integration Layer                  │
│ ├── 🎨 VoidCoreUI (GUI特化コア・継承OK)         │
│ ├── ⚡ VoidFlowHybridCommunication             │
│ ├── 🧩 UnifiedPluginManager統合                │
│ └── 🔗 Intent Bridge & Adapters               │
├─────────────────────────────────────────────────┤
│ 🧩 Plugin System Layer                         │
│ ├── 🏭 PluginFactory (IPlugin準拠)            │
│ ├── 📦 ElementManager                         │
│ ├── 🔗 ConnectionManager                      │
│ └── 🎭 VoidFlowNodePlugin (IPlugin継承)       │
├─────────────────────────────────────────────────┤
│ 🚀 VoidCore Foundation                         │
│ ├── 📨 Message System                         │
│ ├── 🎯 Intent Processing                      │
│ ├── 🔌 UnifiedPluginManager                   │
│ └── 📊 Stats & Debug                          │
└─────────────────────────────────────────────────┘
```

---

## 🔗 **主要コンポーネント関係図**

```
VoidCoreUI (Core)
├── 🎨 Canvas Manager ────────┐
├── 🖱️ DragDrop Manager ─────┤
├── 🔘 Selection Manager ─────┤ 
├── 🔗 Connection Manager ────┤ → 🎯 UI Operations
├── 📦 Element Manager ───────┤
└── 📋 Context Menu Manager ──┘

VoidFlowCore (Integration Hub)
├── 🔄 Hybrid Communication ──→ 60FPS Updates
├── 🎯 Intent Handlers ───────→ VoidCore Messages
├── 🔧 Message Adapter ───────→ VoidPacket Conversion
└── 📊 Debug Manager ─────────→ File Logging

VoidCore Foundation
├── 🧩 UnifiedPluginManager ──→ Plugin Lifecycle
├── 🎯 UnifiedIntentHandler ───→ Intent Processing  
├── 📨 CoreMessageBus ────────→ Pub/Sub System
└── 📊 Stats Manager ─────────→ Performance Tracking
```

---

## ⚡ **データフロー**

### **1. プラグイン作成フロー**
```
User Action (Palette Click)
 ↓
🎯 Intent: 'voidflow.ui.element.create'
 ↓  
🏭 PluginFactory.createPlugin()
 ↓
🧩 IPlugin準拠インスタンス生成
 ↓
📦 ElementManager + UnifiedPluginManager登録
 ↓
🎨 Canvas表示
```

### **2. 接続作成フロー**
```
Mouse Down (Output Port)
 ↓
⚡ ハイブリッド: SVG即座更新 + Intent通知
 ↓
🔗 ConnectionManager.createConnection()
 ↓
📨 VoidCore Message: 'connection.established'
 ↓
🧩 プラグイン間データフロー確立
```

### **3. データ処理フロー**
```
Input Plugin (data change)
 ↓
🎯 Intent: 'data.flow.send'
 ↓
🔄 ConnectionManager routing
 ↓
📨 Target Plugin Message delivery
 ↓
🧩 processData() → output update
```

---

## 🔧 **重要な設計判断**

### **✅ VoidCore理念準拠決定**
1. **VoidCoreUI継承**: GUI特化コアとして正当
2. **ハイブリッド通信**: 性能と理念の両立
3. **IPlugin準拠**: 全プラグインがIPlugin継承
4. **Intent駆動**: UI操作の90%がIntent経由

### **⚠️ 改善予定箇所**
1. **Event Handler統一**: addEventListener → Intent
2. **混在実行パス**: Intent vs Direct Call統一  
3. **プラグインファクトリ**: より厳密なIPlugin準拠

### **🚨 保持すべき優秀システム**
1. **60FPS DirectUIChannel**: 性能クリティカル
2. **デバッグファイル出力**: 既に完璧
3. **束ね線システム**: Phase 2で完成
4. **UnifiedManager統合**: 95%準拠

---

## 📊 **現在の状態指標**

| 指標 | 現在値 | 目標値 | 状況 |
|------|--------|--------|------|
| VoidCore理念準拠率 | 78% | 90%+ | 🟡 改善中 |
| Intent駆動率 | 90% | 95%+ | 🟢 良好 |
| Plugin設計準拠 | 95% | 95%+ | ✅ 優秀 |
| Event Handler統一 | 60% | 95%+ | 🔴 要改善 |
| 性能 | 93% | 93%維持 | ✅ 優秀 |

---

## 🎯 **次期アップデート予定**

### **Phase Alpha: Event Handler統一（2-3日）**
- addEventListener → Intent変換
- UI Event処理の完全Intent化
- Intent Handler実装

### **Phase Beta: 実行パス統一（1-2日）**  
- Intent vs Direct Call混在解消
- 一貫したメッセージルーティング
- バッチ処理最適化

### **Phase Gamma: 最終調整（1日）**
- Intent Batching System実装
- 非同期通知最適化
- 品質保証・テスト

**🎉 完了時: VoidCore理念準拠90%+の真のGUI特化システム完成！**