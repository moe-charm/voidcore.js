// universal-message-adapter.js - 汎用メッセージアダプター
// Phase S3後続: VoidFlowMessageAdapter汎用化による275行削減

import { Message } from './message.js';

/**
 * 🌍 UniversalMessageAdapter - 汎用メッセージ変換システム
 * 
 * 設定ベースで任意のメッセージフォーマット間の双方向変換を実現
 * VoidFlow, ReactFlow, NodeRed, Scratch等、あらゆるフローシステムに対応
 * 
 * 哲学: 「一つのアダプターで全ての世界を繋ぐ」
 */
export class UniversalMessageAdapter {
  constructor(config) {
    this.config = this.validateConfig(config);
    this.adapterId = `universal-adapter-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    // 統計情報
    this.stats = {
      adaptedMessages: 0,
      errorCount: 0,
      startTime: Date.now()
    };
    
    this.log(`🌍 UniversalMessageAdapter initialized: ${this.config.sourceFormat} ↔ ${this.config.targetFormat}`);
  }

  /**
   * 設定バリデーション
   * @param {Object} config - アダプター設定
   * @returns {Object} 検証済み設定
   */
  validateConfig(config) {
    if (!config) {
      throw new Error('Adapter config is required');
    }

    const requiredFields = ['sourceFormat', 'targetFormat', 'transformRules'];
    for (const field of requiredFields) {
      if (!config[field]) {
        throw new Error(`Config field '${field}' is required`);
      }
    }

    return {
      sourceFormat: config.sourceFormat,
      targetFormat: config.targetFormat,
      transformRules: config.transformRules,
      reverseRules: config.reverseRules || null,
      metadata: config.metadata || {},
      idGenerator: config.idGenerator || this.defaultIdGenerator.bind(this)
    };
  }

  /**
   * メッセージ変換（設定ベース）
   * @param {Object} sourceMessage - 変換元メッセージ
   * @param {Object} metadata - 追加メタデータ
   * @returns {Object} 変換後メッセージ
   */
  adapt(sourceMessage, metadata = {}) {
    try {
      if (!sourceMessage) {
        throw new Error('Source message is required');
      }

      // 変換ルール適用
      const transformedMessage = this.applyTransformRules(
        sourceMessage, 
        this.config.transformRules, 
        metadata
      );

      this.stats.adaptedMessages++;
      
      this.log(`🔄 Message adapted: ${this.config.sourceFormat} → ${this.config.targetFormat}`);
      
      return transformedMessage;
      
    } catch (error) {
      this.stats.errorCount++;
      this.log(`❌ Message adaptation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * 逆変換（設定ベース）
   * @param {Object} targetMessage - 変換元メッセージ
   * @param {Object} metadata - 追加メタデータ
   * @returns {Object} 逆変換後メッセージ
   */
  adaptReverse(targetMessage, metadata = {}) {
    if (!this.config.reverseRules) {
      throw new Error('Reverse transformation rules not configured');
    }

    try {
      const transformedMessage = this.applyTransformRules(
        targetMessage, 
        this.config.reverseRules, 
        metadata
      );

      this.stats.adaptedMessages++;
      
      this.log(`🔄 Message reverse adapted: ${this.config.targetFormat} → ${this.config.sourceFormat}`);
      
      return transformedMessage;
      
    } catch (error) {
      this.stats.errorCount++;
      this.log(`❌ Reverse adaptation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * 変換ルール適用
   * @param {Object} sourceMessage - 変換元メッセージ
   * @param {Object} rules - 変換ルール
   * @param {Object} metadata - メタデータ
   * @returns {Object} 変換後メッセージ
   */
  applyTransformRules(sourceMessage, rules, metadata) {
    const result = {};

    // フィールドマッピング
    if (rules.fieldMapping) {
      for (const [targetField, sourceField] of Object.entries(rules.fieldMapping)) {
        const value = this.getNestedValue(sourceMessage, sourceField);
        if (value !== undefined) {
          this.setNestedValue(result, targetField, value);
        }
      }
    }

    // 計算フィールド
    if (rules.computedFields) {
      for (const [fieldName, computation] of Object.entries(rules.computedFields)) {
        try {
          const value = this.computeField(computation, sourceMessage, metadata);
          this.setNestedValue(result, fieldName, value);
        } catch (error) {
          this.log(`⚠️ Computed field '${fieldName}' failed: ${error.message}`);
        }
      }
    }

    // デフォルト値
    if (rules.defaultValues) {
      for (const [fieldName, defaultValue] of Object.entries(rules.defaultValues)) {
        if (this.getNestedValue(result, fieldName) === undefined) {
          this.setNestedValue(result, fieldName, defaultValue);
        }
      }
    }

    // 後処理
    if (rules.postProcess && typeof rules.postProcess === 'function') {
      return rules.postProcess(result, sourceMessage, metadata);
    }

    return result;
  }

  /**
   * ネストした値の取得
   * @param {Object} obj - オブジェクト
   * @param {string|Function} path - パス (例: "payload.data.value") または関数
   * @returns {*} 値
   */
  getNestedValue(obj, path) {
    // 関数の場合は実行
    if (typeof path === 'function') {
      return path(obj);
    }
    
    // 文字列でない場合は直接返す
    if (typeof path !== 'string') {
      return path;
    }
    
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * ネストした値の設定
   * @param {Object} obj - オブジェクト
   * @param {string} path - パス
   * @param {*} value - 値
   */
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  /**
   * 計算フィールド処理
   * @param {Object|Function} computation - 計算設定
   * @param {Object} sourceMessage - 元メッセージ
   * @param {Object} metadata - メタデータ
   * @returns {*} 計算結果
   */
  computeField(computation, sourceMessage, metadata) {
    if (typeof computation === 'function') {
      return computation(sourceMessage, metadata, this);
    }

    if (computation.type === 'timestamp') {
      return Date.now();
    }

    if (computation.type === 'id') {
      return this.config.idGenerator(computation.prefix || 'id');
    }

    if (computation.type === 'concat') {
      return computation.values.map(v => 
        typeof v === 'string' ? v : this.getNestedValue(sourceMessage, v)
      ).join(computation.separator || '');
    }

    if (computation.type === 'template') {
      return computation.template.replace(/\{([^}]+)\}/g, (match, path) => {
        return this.getNestedValue(sourceMessage, path) || '';
      });
    }

    throw new Error(`Unknown computation type: ${computation.type}`);
  }

  /**
   * デフォルトID生成器
   * @param {string} prefix - プレフィックス
   * @returns {string} ID
   */
  defaultIdGenerator(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
  }

  /**
   * 統計情報取得
   * @returns {Object} 統計情報
   */
  getStats() {
    const runtime = Date.now() - this.stats.startTime;
    
    return {
      ...this.stats,
      runtime: runtime,
      messagesPerSecond: this.stats.adaptedMessages / (runtime / 1000),
      errorRate: this.stats.errorCount / Math.max(this.stats.adaptedMessages, 1),
      adapterId: this.adapterId,
      sourceFormat: this.config.sourceFormat,
      targetFormat: this.config.targetFormat
    };
  }

  /**
   * ログ出力
   * @param {string} message - ログメッセージ
   */
  log(message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] 🌍 UniversalAdapter: ${message}`);
  }
}

// ==========================================
// 📦 VoidFlow専用設定ファクトリー
// ==========================================

/**
 * VoidFlow→VoidCore変換設定作成
 * @returns {Object} VoidFlow用設定
 */
export function createVoidFlowAdapterConfig() {
  return {
    sourceFormat: 'VoidPacket',
    targetFormat: 'VoidCoreMessage',
    
    transformRules: {
      // フィールドマッピング
      fieldMapping: {
        'payload.payload': 'payload',
        'payload.sourceNodeId': 'sourceNodeId',
        'payload.timestamp': 'timestamp',
        'payload.error': 'error'
      },
      
      // 計算フィールド
      computedFields: {
        'id': { type: 'id', prefix: 'voidflow-msg' },
        'category': () => 'Notice',
        'event_name': () => 'voidflow.data',
        'payload.adapterId': (source, metadata, adapter) => adapter.adapterId,
        'payload.originalFormat': () => 'VoidPacket',
        'payload.convertedAt': { type: 'timestamp' },
        'payload.correlationId': { type: 'id', prefix: 'voidflow' },
        'payload.flowId': (source, metadata) => metadata.flowId || 'default-flow',
        'payload.nodeType': (source, metadata) => metadata.nodeType || 'unknown'
      },
      
      // デフォルト値
      defaultValues: {
        'payload.timestamp': Date.now(),
        'payload.error': null
      }
    },

    reverseRules: {
      fieldMapping: {
        'payload': 'payload.payload',
        'sourceNodeId': 'payload.sourceNodeId',
        'timestamp': 'payload.timestamp',
        'error': 'payload.error',
        '__voidflow_metadata.flowId': 'payload.flowId',
        '__voidflow_metadata.adapterId': 'payload.adapterId',
        '__voidflow_metadata.originalFormat': 'VoidCoreMessage'
      }
    },

    metadata: {
      version: '14.0-universal',
      description: 'VoidFlow ↔ VoidCore message adapter'
    }
  };
}

/**
 * ReactFlow用設定作成例
 * @returns {Object} ReactFlow用設定
 */
export function createReactFlowAdapterConfig() {
  return {
    sourceFormat: 'ReactFlowEvent',
    targetFormat: 'VoidCoreMessage',
    
    transformRules: {
      fieldMapping: {
        'category': () => 'Notice',
        'event_name': (source) => `reactflow.${source.type}`,
        'payload.nodeId': 'nodeId',
        'payload.data': 'data'
      },
      
      computedFields: {
        'id': { type: 'id', prefix: 'reactflow-msg' },
        'payload.timestamp': { type: 'timestamp' },
        'payload.adapterId': (source, metadata, adapter) => adapter.adapterId
      }
    },

    metadata: {
      version: '14.0-universal',
      description: 'ReactFlow → VoidCore message adapter'
    }
  };
}

// VoidFlow互換のデフォルトアダプター作成
export const voidFlowAdapter = new UniversalMessageAdapter(createVoidFlowAdapterConfig());

// レガシー互換用エイリアス
export const createFlowMessage = (eventType, payload, metadata = {}) => {
  const voidPacket = {
    payload: payload,
    sourceNodeId: metadata.sourceNodeId,
    timestamp: metadata.timestamp || Date.now()
  };
  
  return voidFlowAdapter.adapt(voidPacket, {
    ...metadata,
    eventType: eventType
  });
};

export const adaptVoidPacket = (voidPacket, metadata = {}) => {
  return voidFlowAdapter.adapt(voidPacket, metadata);
};