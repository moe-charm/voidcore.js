# 📋 プラグイン遅延読み込み（Lazy Load）実装予定

## 🎯 対応戦略：Lazy Load構造（遅延読み込み）

VoidFlowに最適なのは **「パレットやノードが選ばれたときにロード」**する方式。

## 🧩 おすすめ構造と読み込み戦略

### 1. collections/ はインデックスとして使う

```json
// all-plugins.json
{
  "plugins": [
    {
      "name": "button-send",
      "category": "ui",
      "path": "categories/ui/button-send.vplugin.json"
    },
    {
      "name": "canvas-renderer",
      "category": "display",
      "path": "categories/display/canvas-renderer.vplugin.json"
    }
  ]
}
```

### 2. 初期読み込みは このファイルだけ 読む

```javascript
const pluginIndex = await fetch('/collections/all-plugins.json').then(res => res.json());
```

### 3. 実際のプラグイン本体は使うまで読まない

```javascript
async function loadPlugin(name: string) {
  const entry = pluginIndex.plugins.find(p => p.name === name);
  if (!entry) throw new Error("Not found");

  const data = await fetch(entry.path).then(res => res.json());
  return initializePlugin(data); // JSONからPluginに変換
}
```

## ✅ 実装上の利点

| 項目 | 効果 |
|------|------|
| 🌱 起動高速化 | 初期ロードはインデックス+UIのみ |
| 🧩 選択したときロード | 必要なプラグインだけフェッチ |
| 🧠 キャッシュにも対応しやすい | Mapに保持して二重ロード防止 |
| 🐾 将来的に分割ダウンロードも可能 | 1ファイル1URL形式ならCDNも使える |

## 🧠 理想実装モデル

```
voidflow/
├── plugins/
│   └── categories/
│       └── ui/
│           └── button-send.vplugin.json
├── collections/
│   └── all-plugins.json   👈 起動時これだけ読む
├── js/
│   └── plugin-loader.ts   👈 lazy fetch + cache
```

### 使用例
```javascript
// 使用例
await loadPlugin("canvas-renderer").then(plugin => {
  flowManager.addPlugin(plugin);
});
```

## ✨ 拡張アイデア

- **重要プラグイン事前ロード**: pluginIndex に `"preload": true` を入れて、コアプラグインだけ事前ロード
- **プラグインタイプ分類**: `.vplugin.json` を `type: "editor" | "display" | "logic"` に分類
- **CDN対応**: 将来的にプラグインをCDNから配信可能

## 🔄 実装スケジュール

1. **Phase 1**: プラグインインデックスシステム設計
2. **Phase 2**: 遅延読み込み機能実装
3. **Phase 3**: キャッシュシステム実装
4. **Phase 4**: パフォーマンス最適化

---
*計画日: 2025-07-09*
*ChatGPTとの相談結果を反映*