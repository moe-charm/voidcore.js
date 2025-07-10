# 💡 VoidCore理念準拠実装パターン集

**目的**: Claude Codeが迷わず理念準拠コードを書けるパターン集  
**重要性**: 理念違反の典型的なミスを事前に防止

## 🎯 **メッセージパッシング原則のパターン**

### **✅ 正しいパターン**

#### **1. UI Event処理**
```javascript
// ✅ 理念準拠: Intent経由
element.addEventListener('click', async (e) => {
  await this.voidFlowCore.sendIntent('voidflow.ui.element.select', {
    elementId: e.target.id,
    position: { x: e.clientX, y: e.clientY },
    timestamp: Date.now()
  })
})

// Intent Handler側
async handleElementSelect(intent) {
  const { elementId, position } = intent.payload
  
  // 高速UI更新
  this.uiChannel.updateSelection.update({ elementId, selected: true })
  
  // 状態通知
  await this.voidCore.publish(Message.notice('ui.element.selected', { elementId }))
}
```

#### **2. プラグイン間データ送信**
```javascript
// ✅ 理念準拠: Message経由
class InputTextPlugin extends IPlugin {
  async sendData(outputData) {
    // VoidCoreメッセージシステム使用
    await this.voidCore.publish(Message.intentRequest(
      this.id,
      'data.flow.send',
      { 
        data: outputData,
        targetIds: this.getConnectedPlugins(),
        timestamp: Date.now()
      }
    ))
  }
}
```

#### **3. プラグイン作成**
```javascript
// ✅ 理念準拠: ファクトリーパターン + UnifiedPluginManager
class VoidFlowPluginFactory {
  async createPlugin(nodeType, config) {
    // 1. IPlugin準拠インスタンス作成
    const plugin = new VoidFlowNodePlugin({
      id: config.id,
      type: `voidflow.node.${nodeType}`,
      parent: this.voidCore.id,
      metadata: config
    })
    
    // 2. VoidCore統一管理システム登録
    await this.voidCore.unifiedPluginManager.registerPlugin(plugin)
    
    // 3. Intent通信セットアップ
    this.setupPluginIntentHandlers(plugin)
    
    return plugin
  }
}
```

### **❌ 理念違反パターン**

#### **1. DOM Event直接処理（NG）**
```javascript
// ❌ 理念違反: 直接処理
element.addEventListener('click', (e) => {
  this.selectUIElement(e.target.id)  // 直接呼び出し
  this.updateSelectionUI(e.target)   // DOM直接操作
})
```

#### **2. 直接関数呼び出し（NG）**
```javascript
// ❌ 理念違反: プラグイン間直接通信
class ButtonPlugin {
  onClick() {
    // 直接他プラグインを呼び出し
    targetPlugin.processData("Button Clicked")  // NG
  }
}
```

#### **3. 偽プラグインインスタンス（NG）**
```javascript
// ❌ 理念違反: Plain Object
const pluginInstance = {
  id: pluginId,
  element: domElement,
  board: board  // 直接参照も危険
}
```

---

## 🔧 **継承vs Composition判断パターン**

### **✅ VoidCore継承が適切なケース**

#### **1. GUI特化コア（VoidCoreUI）**
```javascript
// ✅ 適切: UI特化コアなので継承OK
export class VoidCoreUI {
  constructor(options = {}) {
    // コンポジション方式
    this.voidCore = new VoidCore(null, {
      debug: options.debug || true,
      uiMode: true
    })
    
    // UI専用機能追加
    this.canvasManager = new CanvasManager(this)
    this.dragDropManager = new DragDropManager(this)
  }
}
```

#### **2. 専門分野コア**
```javascript
// ✅ 適切: ゲーム世界管理など特化コア
export class VoidGameWorldCore extends VoidCore {
  constructor(worldConfig) {
    super(null, { gameMode: true })
    this.setupWorldSystems()
  }
}
```

### **✅ IPlugin継承が適切なケース**

#### **1. 一般的なプラグイン**
```javascript
// ✅ 適切: 一般プラグインはIPlugin継承
export class VoidFlowNodePlugin extends IPlugin {
  constructor(config) {
    super(config)
    this.setupNodeBehavior()
  }
  
  async handleMessage(message) {
    // VoidCoreメッセージング使用
    return await super.handleMessage(message)
  }
}
```

### **❌ 不適切な継承**

#### **1. コア機能不要なのにVoidCore継承**
```javascript
// ❌ 不適切: 単純なプラグインなのにVoidCore継承
export class SimpleCalculatorPlugin extends VoidCore {  // NG
  constructor() {
    super()  // コア機能不要なのに継承
  }
}

// ✅ 修正: IPlugin継承
export class SimpleCalculatorPlugin extends IPlugin {
  constructor(config) {
    super(config)
  }
}
```

---

## ⚡ **ハイブリッド通信パターン**

### **✅ 性能クリティカルな場合の正しいハイブリッド**

#### **1. 60FPS UI更新**
```javascript
// ✅ 適切: 高速更新 + 非同期VoidCore通知
async updateElementPosition(elementId, position) {
  // 1. 高速DirectUI更新（60FPS要件）
  this.uiChannel.updatePosition.update({
    elementId, 
    x: position.x, 
    y: position.y
  })
  
  // 2. VoidCore状態通知（非同期・バッチ化）
  setTimeout(async () => {
    await this.voidCore.publish(Message.notice('ui.element.moved', {
      elementId, position, timestamp: Date.now()
    }))
  }, 0)
}
```

#### **2. リアルタイム接続描画**
```javascript
// ✅ 適切: SVG直接更新 + Intent通知
async updateConnectionLine(sourcePos, targetPos) {
  // 1. SVG直接更新（描画性能）
  this.svgLine.setAttribute('d', this.createBezierPath(sourcePos, targetPos))
  
  // 2. VoidCore通知（状態管理）
  await this.voidFlowCore.sendIntent('voidflow.connection.updated', {
    sourcePos, targetPos, timestamp: Date.now()
  })
}
```

### **❌ 不適切なハイブリッド使用**

#### **1. 性能要件ないのに直接操作**
```javascript
// ❌ 不適切: 単純な操作なのに直接DOM操作
function showSimpleMessage(text) {
  document.getElementById('message').textContent = text  // NG
}

// ✅ 修正: Intent経由
async function showSimpleMessage(text) {
  await this.voidCore.sendIntent('ui.message.show', { text })
}
```

---

## 📋 **実装時チェックリスト**

### **設計フェーズ**
```
□ コンポーネント間通信をメッセージフローで設計したか？
□ 継承 vs composition の判断は適切か？
□ 性能要件がある場合、ハイブリッド通信を検討したか？
□ プラグインライフサイクルはVoidCore管理下か？
```

### **実装フェーズ**
```
□ addEventListener()の代わりにIntent使用したか？
□ 直接関数呼び出しの代わりにMessage使用したか？
□ new Function()など危険な処理を避けたか？
□ プラグインはIPlugin準拠で作成したか？
```

### **検証フェーズ**
```
□ すべてのUI操作がVoidCoreメッセージとして追跡可能か？
□ プラグイン間通信にIntent以外の方法を使っていないか？
□ 性能要件を満たしつつ理念準拠しているか？
□ デバッグログでメッセージフローを確認できるか？
```

---

## 🚨 **緊急時の理念確認**

### **迷った時の判断基準**
1. **メッセージで表現できるか？** → できるならMessage使用
2. **性能クリティカルか？** → はいならハイブリッド検討
3. **Core機能が必要か？** → はいなら継承、いいえならcomposition
4. **プラグインにできるか？** → できるならIPlugin継承

### **理念違反のサイン**
- コードに`addEventListener`が多数
- `new Function()`の使用
- `board`への直接参照
- カスタムイベント多用
- プラグイン間の直接オブジェクト参照

**🎯 このパターン集で理念準拠率95%を目指すにゃー！**