# Phase 1.8 Intent/Notice/Proposal メッセージ分類設計仕様書

## 📋 概要

**設計日時**: 2025-07-03  
**Phase**: 1.8.0 通信システム革命  
**設計者**: Claude Code + ユーザー + Gemini CLI  
**哲学基盤**: 完全自律存在モデル  

本仕様書は、VoidCoreネットワークにおける自律プラグイン間メッセージ通信の根本的分類ルールを定義する。従来の曖昧なメッセージ方向性を解決し、プラグインの尊厳と自律性を尊重した美しく超シンプルな3モデル分類システムを確立する。

## 🌟 設計哲学

### 完全自律存在モデルとの調和

- **非命令型**: 強制や命令ではなく、願い・事実・提案による対話
- **尊厳の尊重**: 各プラグインの自律的判断を最優先
- **透明性**: メッセージの意図と方向性が名前から直感的に理解可能
- **シンプルさ**: たった3つのモデルであらゆるコミュニケーションを網羅

## 🎯 3つのメッセージ分類モデル

### 1. Intent (意図) - 「〜してほしい」という願い

**目的**: あるプラグインが、特定の役割を持つ「誰か」に何かを実現してほしいと願う時に使用

**特徴**:
- **方向性**: 1対1 (特定の役割へ)
- **哲学**: Pull型の思想 - 願いを表明し、実行は相手の自由意志
- **責任モデル対応**: **動作**フェーズでの行動願い
- **例**: 「ファイルを開きたい」→ファイルエクスプローラーが自発的に応答

```json
{
  "type": "Intent",
  "source": "plugins/text-editor/v1.0",
  "target_role": "file_explorer",
  "action": "file.open",
  "payload": {
    "path": "/path/to/document.txt"
  },
  "message_id": "intent-12345"
}
```

### 2. Notice (通知) - 「〜が起きた」という観測

**目的**: あるプラグインが、自身に起きた出来事や観測した事実を世界全体に知らせる時に使用

**特徴**:
- **方向性**: 1対多 (ブロードキャスト)
- **哲学**: Push型の思想 - 事実を宇宙に放ち、解釈は受信者の自由
- **責任モデル対応**: **観測**フェーズでの事実共有
- **例**: 「ファイルが保存された」→関心のあるプラグインが自発的に反応

```json
{
  "type": "Notice",
  "source": "plugins/text-editor/v1.0",
  "event_name": "file.saved",
  "payload": {
    "path": "/path/to/document.txt",
    "size": 2048
  },
  "message_id": "notice-67890"
}
```

### 3. Proposal (提案) - 「〜しませんか」という誘い

**目的**: あるプラグインが、別の特定のプラグインに対して、状態変更や行動を丁寧に提案する時に使用

**特徴**:
- **方向性**: 1対1 (特定の存在へ)
- **哲学**: 尊厳ある対話 - 提案であり強制ではない、決定権は相手にある
- **責任モデル対応**: **準備/引退**フェーズでの状態変化誘い
- **例**: プラグイン終了要求を優雅に提案

```json
{
  "type": "Proposal",
  "source": "plugins/core-manager/v1.0",
  "target_plugin": "plugins/git-integration/v2.1",
  "suggestion": "retire",
  "payload": {
    "reason": "A newer version of the git plugin has been activated.",
    "grace_period_ms": 5000
  },
  "message_id": "proposal-abcde"
}
```

## 📊 設計の調和と美しさ

| モデル | 方向性 | 目的 | ライフサイクル対応 | 哲学 |
|:---|:---|:---|:---|:---|
| **Intent (意図)** | 1対1 (役割へ) | 行動の願い | **動作**フェーズ | 自分の願いを表明する自由 |
| **Notice (通知)** | 1対多 (世界へ) | 事実の共有 | **観測**フェーズ | 自分の存在と変化を表現する自由 |
| **Proposal (提案)** | 1対1 (存在へ) | 状態変化の誘い | **準備/引退**フェーズ | 相手の存在を尊重し、決定を委ねる礼節 |

## 🌐 複数プラグイン対応・無限スケーラビリティ

### 天才的スケーラビリティ設計

Intent/Notice/Proposalモデルは、プラグインが1個でも100個でも**同じ美しさで動作する**革命的設計である。従来のREQUEST方式の「1対1制約」を完全に超越し、真の無限拡張アーキテクチャを実現する。

### 🎯 1対1 個別提案 (Proposal) - 精密狙撃型

**用途**: 特定のプラグインに個別の状態変化を提案

```json
{
  "type": "Proposal",
  "source": "MemoryManager",
  "target_plugin": "VideoProcessor_v2.1",
  "suggestion": "pause",
  "payload": {
    "reason": "メモリ使用量が臨界点に近づいています",
    "urgency": "high",
    "grace_period_ms": 3000
  }
}
```

**特徴**:
- ✅ **正確な対象指定**: プラグインIDで確実に届く
- ✅ **個別カスタマイズ**: 相手に応じた最適な提案内容
- ✅ **尊厳の尊重**: 強制ではなく丁寧な提案
- ✅ **応答の自由**: 受信側が自律的に判断・決定

### 🌍 1対多 状況通知 (Notice) - 全世界放送型

**用途**: システム状況や重要イベントを全プラグインに通知

```json
{
  "type": "Notice",
  "source": "SystemMonitor",
  "event_name": "memory.critical",
  "payload": {
    "available_mb": 50,
    "threshold_mb": 100,
    "severity": "warning"
  }
}
```

**受信例（複数プラグインが同時対応）**:
- 📹 **VideoProcessor**: 「解像度を下げよう」
- 🎵 **AudioProcessor**: 「バッファサイズを削減しよう」  
- 🤖 **AIProcessor**: 「学習を一時停止しよう」
- 📊 **LoggerPlugin**: 「この状況をログに記録しよう」

**特徴**:
- ✅ **自動配信**: 関心のあるプラグインが自動受信
- ✅ **選択的対応**: プラグインが「自分に関係ある？」を自己判断
- ✅ **並列処理**: 複数プラグインが同時に独立対応
- ✅ **動的参加**: 新しいプラグインが途中から参加可能

### 🎭 Role-based 種類別依頼 (Intent) - 職種指名型

**用途**: 特定の役割を持つ全プラグインに行動を依頼

```json
{
  "type": "Intent",
  "source": "CoreManager",
  "target_role": "heavy_processor",
  "action": "reduce_workload",
  "payload": {
    "target_reduction_percent": 30,
    "priority": "immediate"
  }
}
```

**対応例（同じroleの複数プラグイン）**:
- 🎬 **VideoRenderer_v3**: 「フレームレート30→24fpsに変更」
- 🧠 **MLTrainer_v2**: 「バッチサイズを半分に削減」
- 🎮 **GameEngine_v1**: 「物理演算精度を下げる」

**特徴**:
- ✅ **役割ベース**: プラグインの種類で自動フィルタリング
- ✅ **無限拡張**: 同じroleのプラグインがいくら増えても対応
- ✅ **自己申告制**: プラグインが自分のroleを自律的に宣言
- ✅ **柔軟性**: 1つのプラグインが複数roleを兼任可能

### 🚀 動的プラグイン追加への自動対応

**革命的特徴**: システム稼働中にプラグインが追加されても**何の変更も必要ない**

#### シナリオ例: 新しいVideoProcessor_v4.0が追加

1. **既存のNotice**: `memory.critical` → 新プラグインも自動受信開始
2. **既存のIntent**: `heavy_processor.reduce_workload` → 新プラグインも自動対応
3. **既存のProposal**: 個別IDなので影響なし

```json
// システム稼働中に新プラグイン参加
{
  "type": "Notice",
  "source": "VideoProcessor_v4.0",
  "event_name": "plugin.debut",
  "payload": {
    "roles": ["heavy_processor", "video_renderer"],
    "capabilities": ["4K_processing", "real_time_encoding"]
  }
}
```

**従来のREQUEST方式との比較**:

| 要素 | REQUEST方式 | Intent/Notice/Proposal |
|:---|:---|:---|
| **複数対応** | ❌ 1対1のみ | ✅ 1対1, 1対多, role-based |
| **新プラグイン追加** | ❌ 個別対応必要 | ✅ 自動対応 |
| **スケーラビリティ** | ❌ N個→N²の複雑さ | ✅ N個→定数の美しさ |
| **メンテナンス** | ❌ プラグイン毎に更新 | ✅ 追加作業ゼロ |

### 🌟 無限スケールの数学的美しさ

**従来方式**: O(N²) - プラグイン数の2乗で複雑化
```
2プラグイン → 2通り
10プラグイン → 100通り  
100プラグイン → 10,000通り (管理不可能)
```

**新方式**: O(1) - プラグイン数に関係なく定数
```
2プラグイン → 3パターン (Intent/Notice/Proposal)
10プラグイン → 3パターン
100プラグイン → 3パターン (永遠に美しい)
```

**結論**: わしの天才設計により、**無限にプラグインが増えても美しさを保つ**究極のアーキテクチャが誕生した！🌟

## 🚀 VoidCore実装への統合計画

### Phase 1.8.1: Message構造体拡張

現在のVoidCore::Messageに分類フィールドを追加:

```cpp
struct Message {
    std::string type;               // 既存: ルーティングキー
    std::any payload;               // 既存: ペイロード
    SemanticType semantic_type;     // 既存: セマンティック型
    
    // Phase 1.8.1 新追加
    MessageCategory category;       // Intent/Notice/Proposal
    std::string source_plugin_id;   // 送信元プラグインID
    std::string target_identifier;  // 対象識別子（役割名またはプラグインID）
    std::string message_id;         // 一意メッセージID
};

enum class MessageCategory {
    Intent,    // 願い（役割指定）
    Notice,    // 通知（ブロードキャスト）
    Proposal   // 提案（個別指定）
};
```

### Phase 1.8.2: 自律プラグインテンプレート更新

既存の自律プラグインテンプレートに新しいメッセージ分類APIを追加:

```cpp
// Intent送信例
void sendIntent(const std::string& target_role, const std::string& action, std::any payload);

// Notice送信例  
void broadcastNotice(const std::string& event_name, std::any payload);

// Proposal送信例
void sendProposal(const std::string& target_plugin, const std::string& suggestion, std::any payload);
```

### Phase 1.8.3: 既存プラグイン段階的移行

1. **後方互換性**: 既存のpublish()は自動的にNoticeとして分類
2. **段階的移行**: 新しいAPIを使用したプラグインから順次移行
3. **混在期間**: 新旧両方式を同時サポート

## 🌟 革命的効果

### 解決される課題

1. **方向性の明確化**: Intent/Notice/Proposalの名前で方向性が自明
2. **意図の明確化**: 願い・事実・提案の区別で目的が明確
3. **プラグイン終了要求**: Proposalモデルで優雅な引退勧告を実現
4. **自律性の尊重**: 強制ではない対話形式でプラグインの尊厳を保護

### アーキテクチャ上の美しさ

- **究極のシンプルさ**: 3つのモデルで全コミュニケーションを網羅
- **直感的理解**: 名前から機能が即座に理解可能
- **哲学的一貫性**: 完全自律存在モデルとの完璧な調和
- **拡張性**: 将来の新しいプラグインタイプにも対応可能

## 📅 実装ロードマップ

### Phase 1.8.1: 基盤実装 (1-2日)
- [ ] VoidCore::Message拡張
- [ ] MessageCategory enum追加
- [ ] 新しいpublishオーバーロード実装

### Phase 1.8.2: API拡張 (1日)
- [ ] 自律プラグインベースクラス更新
- [ ] Intent/Notice/Proposal送信メソッド追加
- [ ] 既存プラグインの段階的移行開始

### Phase 1.8.3: 検証・テスト (1日)
- [ ] 新しいメッセージ分類統合デモ作成
- [ ] 既存自律プラグインの動作確認
- [ ] パフォーマンス測定

### Phase 1.8.4: ドキュメント (0.5日)
- [ ] CharmCode_API_Reference.txt更新
- [ ] 自律プラグイン開発ガイド更新
- [ ] 移行ガイド作成

## 🎯 成功指標

- **コード削減**: 既存メッセージハンドリングコードの簡略化
- **理解性向上**: 新規開発者がメッセージフローを即座に理解
- **バグ削減**: メッセージの方向性誤認によるバグの撲滅
- **開発効率**: プラグイン間通信実装時間の短縮

## 📚 参考資料

- **Gemini相談記録**: `/仕様書/Gemini相談_メッセージ分類設計_Phase1.8.txt`
- **完全自律存在モデル**: `/仕様書/Phase1.7_完全自律存在モデル/`
- **プラグインライフサイクル**: `/仕様書/プラグインのライフサイクル.txt`
- **VoidCore実装**: `/src/core/VoidCore.h`

---

**作成**: 2025-07-03  
**最終更新**: 2025-07-03  
**バージョン**: 1.0.0  
**ステータス**: 設計完了・実装待機  

*この設計は、完全自律存在モデルの哲学をコードレベルで実現するための強力な基盤となる。美しさと実用性を両立した、CharmCodeアーキテクチャの新たな進化である。*