/**
 * 🎯 VoidFlow Intent定義
 * 
 * 全てのVoidFlow操作をIntent化するための
 * 統一定義ファイル
 * 
 * Created: 2025-07-09
 * Phase 1: 基盤構築
 */

/**
 * Intent タイプ定義
 */
export const INTENT_TYPES = {
  // システム管理Intent
  SYSTEM: {
    INITIALIZED: 'voidflow.system.initialized',
    SHUTDOWN: 'voidflow.system.shutdown',
    STATUS: 'voidflow.system.status',
    ERROR: 'voidflow.system.error'
  },
  
  // UI操作Intent（Phase 2で実装）
  UI: {
    ELEMENT: {
      CREATE: 'voidflow.ui.element.create',
      MOVE: 'voidflow.ui.element.move', 
      SELECT: 'voidflow.ui.element.select',
      DELETE: 'voidflow.ui.element.delete',
      UPDATE: 'voidflow.ui.element.update',
      FOCUS: 'voidflow.ui.element.focus',
      BLUR: 'voidflow.ui.element.blur'
    },
    
    CONNECTION: {
      START: 'voidflow.ui.connection.start',
      COMPLETE: 'voidflow.ui.connection.complete',
      CANCEL: 'voidflow.ui.connection.cancel',
      DELETE: 'voidflow.ui.connection.delete',
      UPDATE: 'voidflow.ui.connection.update'
    },
    
    PLUGIN: {
      ADD: 'voidflow.ui.plugin.add',
      REMOVE: 'voidflow.ui.plugin.remove',
      CONFIGURE: 'voidflow.ui.plugin.configure',
      ENABLE: 'voidflow.ui.plugin.enable',
      DISABLE: 'voidflow.ui.plugin.disable'
    }
  },
  
  // デバッグIntent（Phase 4で実装）
  DEBUG: {
    TRACE: {
      START: 'voidflow.debug.trace.start',
      STOP: 'voidflow.debug.trace.stop',
      FILTER: 'voidflow.debug.trace.filter'
    },
    
    STATE: {
      DUMP: 'voidflow.debug.state.dump',
      HISTORY: 'voidflow.debug.state.history',
      RESET: 'voidflow.debug.state.reset'
    },
    
    PERFORMANCE: {
      MEASURE: 'voidflow.debug.performance.measure',
      REPORT: 'voidflow.debug.performance.report',
      BENCHMARK: 'voidflow.debug.performance.benchmark'
    }
  }
}

/**
 * Intent ペイロード構造定義
 */
export const INTENT_SCHEMAS = {
  // システムIntent
  [INTENT_TYPES.SYSTEM.INITIALIZED]: {
    timestamp: 'number',
    version: 'string',
    features: 'array'
  },
  
  [INTENT_TYPES.SYSTEM.STATUS]: {
    component: 'string?' // オプショナル: 特定コンポーネントの状態
  },
  
  [INTENT_TYPES.SYSTEM.ERROR]: {
    error: 'object',
    context: 'string',
    timestamp: 'number',
    severity: 'string' // 'low', 'medium', 'high', 'critical'
  },
  
  // UI操作Intent（Phase 2で詳細実装）
  [INTENT_TYPES.UI.ELEMENT.CREATE]: {
    nodeType: 'string',      // 'button', 'input', 'display', etc.
    position: 'object',      // { x: number, y: number }
    pluginId: 'string',      // プラグインID
    config: 'object?'        // 設定オプション（オプショナル）
  },
  
  [INTENT_TYPES.UI.ELEMENT.MOVE]: {
    elementId: 'string',     // 要素ID
    newPosition: 'object',   // { x: number, y: number }
    delta: 'object?',        // { dx: number, dy: number }（オプショナル）
    isDragging: 'boolean?'   // ドラッグ中フラグ（オプショナル）
  },
  
  [INTENT_TYPES.UI.ELEMENT.SELECT]: {
    elementId: 'string',     // 選択要素ID
    multiSelect: 'boolean?', // 複数選択（オプショナル）
    selectionType: 'string?' // 'click', 'drag', 'keyboard'（オプショナル）
  },
  
  [INTENT_TYPES.UI.ELEMENT.DELETE]: {
    elementId: 'string',     // 削除要素ID
    cascade: 'boolean?',     // 関連要素も削除（オプショナル）
    confirm: 'boolean?'      // 確認済みフラグ（オプショナル）
  },
  
  // 接続Intent（Phase 3で詳細実装）
  [INTENT_TYPES.UI.CONNECTION.START]: {
    sourceId: 'string',      // 接続元ID
    sourceType: 'string?',   // 'plugin', 'ui-element'（オプショナル）
    cursor: 'object',        // { x: number, y: number }
    connectionMode: 'string?' // 'data', 'control', 'visual'（オプショナル）
  },
  
  [INTENT_TYPES.UI.CONNECTION.COMPLETE]: {
    sourceId: 'string',      // 接続元ID
    targetId: 'string',      // 接続先ID
    connectionType: 'string?', // 接続タイプ（オプショナル）
    metadata: 'object?'      // 追加情報（オプショナル）
  },
  
  [INTENT_TYPES.UI.CONNECTION.CANCEL]: {
    reason: 'string',        // 'user', 'invalid-target', 'error'
    sourceId: 'string?',     // キャンセル時の接続元（オプショナル）
    timestamp: 'number'      // キャンセル時刻
  },
  
  // プラグインIntent
  [INTENT_TYPES.UI.PLUGIN.ADD]: {
    pluginId: 'string',      // プラグインID
    category: 'string?',     // カテゴリ（オプショナル）
    position: 'object',      // { x: number, y: number }
    source: 'string?'        // 'palette', 'api', 'drag-drop'（オプショナル）
  },
  
  [INTENT_TYPES.UI.PLUGIN.CONFIGURE]: {
    pluginId: 'string',      // プラグインID
    newConfig: 'object',     // 新設定
    oldConfig: 'object?'     // 旧設定（undo用、オプショナル）
  },
  
  // デバッグIntent（Phase 4で詳細実装）
  [INTENT_TYPES.DEBUG.TRACE.START]: {
    traceLevel: 'string',    // 'basic', 'detailed', 'verbose'
    targetIntent: 'string?', // 追跡対象Intent（ワイルドカード可、オプショナル）
    duration: 'number?'      // 追跡時間（ms、オプショナル）
  },
  
  [INTENT_TYPES.DEBUG.STATE.DUMP]: {
    targetComponent: 'string?', // 'ui', 'connection', 'all'（オプショナル）
    includeHistory: 'boolean?', // 履歴も含む（オプショナル）
    format: 'string?'          // 'json', 'table', 'tree'（オプショナル）
  },
  
  [INTENT_TYPES.DEBUG.PERFORMANCE.MEASURE]: {
    operation: 'string',     // 計測対象操作
    startMarker: 'string?',  // 開始マーカー（オプショナル）
    endMarker: 'string?'     // 終了マーカー（オプショナル）
  }
}

/**
 * Intent 優先度定義
 */
export const INTENT_PRIORITIES = {
  CRITICAL: 'critical',    // システムエラー、緊急停止
  HIGH: 'high',           // UI操作、ユーザーアクション
  MEDIUM: 'medium',       // バックグラウンド処理
  LOW: 'low'              // ログ、統計情報
}

/**
 * Intent応答タイプ定義
 */
export const INTENT_RESPONSE_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  PENDING: 'pending',
  TIMEOUT: 'timeout',
  CANCELLED: 'cancelled'
}

/**
 * Intent バリデーションルール
 */
export const INTENT_VALIDATION_RULES = {
  // 必須フィールドチェック
  REQUIRED_FIELDS: {
    ALL: ['type', 'payload', 'timestamp'],
    SYSTEM: ['timestamp'],
    UI: ['elementId', 'position'],
    DEBUG: ['operation']
  },
  
  // データ型チェック
  TYPE_RULES: {
    timestamp: (value) => typeof value === 'number' && value > 0,
    position: (value) => value && typeof value.x === 'number' && typeof value.y === 'number',
    elementId: (value) => typeof value === 'string' && value.length > 0,
    pluginId: (value) => typeof value === 'string' && value.length > 0
  },
  
  // 値の範囲チェック
  VALUE_RULES: {
    priority: (value) => Object.values(INTENT_PRIORITIES).includes(value),
    traceLevel: (value) => ['basic', 'detailed', 'verbose'].includes(value),
    format: (value) => ['json', 'table', 'tree'].includes(value)
  }
}

/**
 * Intent ヘルパー関数
 */
export class IntentHelper {
  /**
   * Intent作成
   */
  static createIntent(type, payload = {}, options = {}) {
    const intent = {
      type,
      payload: {
        ...payload,
        timestamp: Date.now(),
        source: options.source || 'voidflow'
      },
      priority: options.priority || INTENT_PRIORITIES.MEDIUM,
      id: options.id || `intent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    
    // バリデーション
    if (options.validate !== false) {
      IntentHelper.validateIntent(intent)
    }
    
    return intent
  }
  
  /**
   * Intent バリデーション
   */
  static validateIntent(intent) {
    if (!intent.type || typeof intent.type !== 'string') {
      throw new Error('Intent type is required and must be a string')
    }
    
    if (!intent.payload || typeof intent.payload !== 'object') {
      throw new Error('Intent payload is required and must be an object')
    }
    
    if (!intent.payload.timestamp || typeof intent.payload.timestamp !== 'number') {
      throw new Error('Intent timestamp is required and must be a number')
    }
    
    // スキーマバリデーション
    const schema = INTENT_SCHEMAS[intent.type]
    if (schema) {
      IntentHelper.validateSchema(intent.payload, schema)
    }
    
    return true
  }
  
  /**
   * スキーマバリデーション
   */
  static validateSchema(payload, schema) {
    for (const [field, type] of Object.entries(schema)) {
      const isOptional = type.endsWith('?')
      const fieldType = isOptional ? type.slice(0, -1) : type
      const value = payload[field]
      
      // 必須フィールドチェック
      if (!isOptional && (value === undefined || value === null)) {
        throw new Error(`Required field '${field}' is missing`)
      }
      
      // 型チェック（値が存在する場合のみ）
      if (value !== undefined && value !== null) {
        if (!IntentHelper.checkType(value, fieldType)) {
          throw new Error(`Field '${field}' must be of type '${fieldType}', got '${typeof value}'`)
        }
      }
    }
  }
  
  /**
   * 型チェック
   */
  static checkType(value, expectedType) {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string'
      case 'number':
        return typeof value === 'number'
      case 'boolean':
        return typeof value === 'boolean'
      case 'object':
        return typeof value === 'object' && value !== null
      case 'array':
        return Array.isArray(value)
      default:
        return true
    }
  }
  
  /**
   * Intent応答作成
   */
  static createResponse(intent, result, status = INTENT_RESPONSE_TYPES.SUCCESS) {
    return {
      intentId: intent.id,
      intentType: intent.type,
      status,
      result,
      timestamp: Date.now(),
      processingTime: Date.now() - intent.payload.timestamp
    }
  }
  
  /**
   * Intent パターンマッチング
   */
  static matchesPattern(intentType, pattern) {
    if (pattern === '*') return true
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1)
      return intentType.startsWith(prefix)
    }
    return intentType === pattern
  }
}

/**
 * よく使用されるIntent作成のショートカット
 */
export const IntentShortcuts = {
  // システム
  systemStatus: () => IntentHelper.createIntent(INTENT_TYPES.SYSTEM.STATUS),
  systemError: (error, context) => IntentHelper.createIntent(INTENT_TYPES.SYSTEM.ERROR, { error, context }),
  
  // UI要素
  createElement: (nodeType, position, pluginId, config) => 
    IntentHelper.createIntent(INTENT_TYPES.UI.ELEMENT.CREATE, { nodeType, position, pluginId, config }),
  
  moveElement: (elementId, newPosition, delta) =>
    IntentHelper.createIntent(INTENT_TYPES.UI.ELEMENT.MOVE, { elementId, newPosition, delta }),
  
  selectElement: (elementId, multiSelect = false) =>
    IntentHelper.createIntent(INTENT_TYPES.UI.ELEMENT.SELECT, { elementId, multiSelect }),
  
  deleteElement: (elementId, cascade = false) =>
    IntentHelper.createIntent(INTENT_TYPES.UI.ELEMENT.DELETE, { elementId, cascade }),
  
  // 接続
  startConnection: (sourceId, cursor, connectionMode) =>
    IntentHelper.createIntent(INTENT_TYPES.UI.CONNECTION.START, { sourceId, cursor, connectionMode }),
  
  completeConnection: (sourceId, targetId, connectionType, metadata) =>
    IntentHelper.createIntent(INTENT_TYPES.UI.CONNECTION.COMPLETE, { sourceId, targetId, connectionType, metadata }),
  
  cancelConnection: (reason, sourceId) =>
    IntentHelper.createIntent(INTENT_TYPES.UI.CONNECTION.CANCEL, { reason, sourceId, timestamp: Date.now() }),
  
  // デバッグ
  startTrace: (traceLevel = 'basic', targetIntent = '*') =>
    IntentHelper.createIntent(INTENT_TYPES.DEBUG.TRACE.START, { traceLevel, targetIntent }),
  
  dumpState: (targetComponent = 'all', format = 'table') =>
    IntentHelper.createIntent(INTENT_TYPES.DEBUG.STATE.DUMP, { targetComponent, format })
}

// グローバル公開（デバッグ用）
window.VoidFlowIntents = {
  TYPES: INTENT_TYPES,
  SCHEMAS: INTENT_SCHEMAS,
  PRIORITIES: INTENT_PRIORITIES,
  Helper: IntentHelper,
  Shortcuts: IntentShortcuts
}