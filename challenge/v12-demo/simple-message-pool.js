// simple-message-pool.js - 超軽量並列メッセージング
// Gemini + にゃー 合作の革命的アイデア実装

/**
 * 🌟 SimpleMessagePool - 超軽量並列メッセージング
 * 
 * 問題: CoreFusion で1000個の通知を順次送信 → 200ms遅延
 * 解決: 安全な並列化 + プラグイン自己申告システム
 */

// 🛡️ 絶対安全な並列化リスト（Geminiの安全設計）
const SAFE_PARALLEL_TYPES = new Set([
  'core.lifecycle.migrated',   // プラグイン移動通知
  'core.lifecycle.fused',      // コア統合通知
  'stats.memory_usage',        // 統計情報
  'log.debug',                 // ログ情報
  'plugin.heartbeat',          // プラグイン生存確認
  'config.theme_changed',      // 設定変更通知
  'plugin.initialized',        // プラグイン初期化通知
  'plugin.shutdown',           // プラグイン終了通知
  'system.process.declared',   // プロセス宣言通知
  'system.process.terminating' // プロセス終了通知
]);

export class SimpleMessagePool {
  constructor(transport = null) {
    this.transport = transport;
    this.stats = {
      totalMessages: 0,
      parallelMessages: 0,
      sequentialMessages: 0,
      batchCount: 0,
      avgProcessingTime: 0
    };
  }

  /**
   * ✨ にゃーの天才的発見: プラグイン自己申告システム
   * @param {Object} message - メッセージオブジェクト
   * @returns {boolean} - 並列処理可能かどうか
   */
  isSafeForParallel(message) {
    // Phase 1: 絶対安全リスト
    if (SAFE_PARALLEL_TYPES.has(message.type)) {
      return true;
    }
    
    // Phase 2: プラグイン自己申告
    if (message.parallelSafe === true) {
      return true;
    }
    
    return false;
  }

  /**
   * 🚀 JavaScript版の真骨頂！並列バッチ処理
   * @param {Array} messages - メッセージ配列
   * @returns {Promise<Object>} - 処理結果
   */
  async submitBatch(messages) {
    const startTime = Date.now();
    
    if (!Array.isArray(messages) || messages.length === 0) {
      return { success: true, processedCount: 0, processingTime: 0 };
    }

    const parallelSafe = [];
    const sequential = [];
    
    // 安全性による分類
    for (const msg of messages) {
      if (this.isSafeForParallel(msg)) {
        parallelSafe.push(msg);
      } else {
        sequential.push(msg);
      }
    }
    
    try {
      // 🚀 並列実行（JavaScript版の真骨頂！）
      const parallelPromises = parallelSafe.map(msg => 
        this.publishAsync(msg)
      );
      
      // 順次実行（順序重要）
      const sequentialResults = [];
      for (const msg of sequential) {
        const result = await this.publishAsync(msg);
        sequentialResults.push(result);
      }
      
      // 並列完了待機
      const parallelResults = await Promise.all(parallelPromises);
      
      // 統計更新
      const processingTime = Date.now() - startTime;
      this.updateStats(messages.length, parallelSafe.length, sequential.length, processingTime);
      
      return {
        success: true,
        processedCount: messages.length,
        parallelCount: parallelSafe.length,
        sequentialCount: sequential.length,
        processingTime,
        parallelResults,
        sequentialResults
      };
      
    } catch (errors) {
      // エラーハンドリングの美しさ
      console.error('Batch processing errors:', errors);
      return {
        success: false,
        processedCount: 0,
        errors: Array.isArray(errors) ? errors : [errors],
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * 単一メッセージの非同期送信
   * @param {Object} message - メッセージオブジェクト
   * @returns {Promise} - 送信結果
   */
  async publishAsync(message) {
    if (this.transport && typeof this.transport.send === 'function') {
      return await this.transport.send(message);
    }
    
    // デフォルトでは console.log（開発用）
    console.log('📮 SimpleMessagePool:', message.type, message.payload);
    return { success: true, message: message.type };
  }

  /**
   * 統計情報更新
   */
  updateStats(total, parallel, sequential, processingTime) {
    this.stats.totalMessages += total;
    this.stats.parallelMessages += parallel;
    this.stats.sequentialMessages += sequential;
    this.stats.batchCount++;
    
    // 平均処理時間の計算
    const prevAvg = this.stats.avgProcessingTime;
    const count = this.stats.batchCount;
    this.stats.avgProcessingTime = ((prevAvg * (count - 1)) + processingTime) / count;
  }

  /**
   * 統計情報取得
   * @returns {Object} - 統計情報
   */
  getStats() {
    return {
      ...this.stats,
      parallelizationRate: this.stats.totalMessages > 0 
        ? (this.stats.parallelMessages / this.stats.totalMessages) * 100
        : 0
    };
  }

  /**
   * 統計情報リセット
   */
  resetStats() {
    this.stats = {
      totalMessages: 0,
      parallelMessages: 0,
      sequentialMessages: 0,
      batchCount: 0,
      avgProcessingTime: 0
    };
  }

  /**
   * Transport設定
   * @param {Object} transport - Transport実装
   */
  setTransport(transport) {
    this.transport = transport;
  }
}

// デフォルトインスタンス
export const simpleMessagePool = new SimpleMessagePool();