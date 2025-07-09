# Gemini先生からのプラグインフォルダ構造アドバイス

## 元の提案構造
```
plugins/
├── collections/          # 統合JSONファイル
│   ├── all-plugins.json
│   ├── core-plugins.json
│   └── featured-plugins.json
├── categories/          # カテゴリー別
│   ├── ui/
│   ├── data/
│   ├── network/
│   ├── logic/
│   ├── ai/
│   ├── media/
│   ├── storage/
│   └── workflow/
├── custom/              # ユーザーカスタム
└── _archive/            # 旧ファイル
```

## Gemini先生の評価と改善案

### 提案構造の評価
**良い点:**
- 機能による分類は、開発者がプラグインを探す際に非常に直感的
- 関心事の分離が明確で、スケーラビリティも高い素晴らしい設計

### 改善案/考慮点

#### 1. `categories/` について
**改善案:**
- **命名規則:** `[plugin-name].vplugin.json` のように統一された命名規則
- **サブカテゴリ:** 将来的に `ui/input/` のようにサブカテゴリを許容する設計

#### 2. `collections/` について
**改善案:**
- **ビルドプロセス:** `npm run build-plugins` を導入し、`categories/` 内の全JSONをまとめて `all-plugins.json` を自動生成
- 管理の手間と実行時のパフォーマンスのバランスが取れている

#### 3. `custom/` と `_archive/`
- `_` を接頭辞にすると、通常のリストから意図的に除外されていることが分かりやすい

## 重要な考慮点

### 1. プラグインJSONのスキーマ定義
```json
{
  "schemaVersion": "1.0",
  "name": "ai-text-generator",
  "version": "0.9.0",
  "author": "VoidFlow Team",
  "description": {
    "en": "Generates text using an AI model.",
    "ja": "AIモデルを使用してテキストを生成します。"
  },
  "category": "ai",
  "entrypoint": "dist/ai-text-generator.js",
  "dependencies": ["core:logger@^1.2.0"],
  "permissions": ["fs:read", "network:fetch"],
  "ui": {
    "icon": "icon.svg",
    "title": {
        "en": "AI Text Generator",
        "ja": "AIテキスト生成"
    }
  }
}
```

### 2. プラグインの読み込み戦略
- **動的スキャン:** `categories/**/*.vplugin.json` を再帰的にスキャン
- **マニフェスト利用:** `collections/core-plugins.json` のような特定のマニフェストファイルのみを読み込み
- **ハイブリッド:** 開発中は動的スキャン、本番環境ではマニフェスト利用

### 3. ドキュメント
各プラグインの `README.md` を、JSONファイルと同じディレクトリに置く

## 最終的な改善された構造案
```
plugins/
├── collections/          # 自動生成統合ファイル
├── categories/          # 手動管理個別ファイル
│   ├── ui/
│   │   ├── button.vplugin.json
│   │   └── README.md
├── custom/
├── _archive/
└── schemas/             # 新追加：JSON Schema
    └── plugin.schema.json
```

## まとめ
- **JSONスキーマの標準化**が最重要
- **ビルドによるコレクションの自動生成**で管理を簡素化
- **読み込み戦略の決定**で柔軟性を確保

この再編成により、非常に堅牢でスケーラブルなプラグインシステムが完成する。

---
*保存日: 2025-07-09*
*元の会話: Gemini CLI での相談結果*