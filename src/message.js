// src/message.js - メッセージ分類システム v12.0
// IntentRequest/IntentResponse/Notice/Proposal の4パターン

export class Message {
  constructor(type, payload, category = 'Notice') {
    this.type = type
    this.payload = payload || {}
    this.category = category // Intent/Notice/Proposal
    this.timestamp = Date.now()
    this.id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // === v12.0 NEW MESSAGE TYPES ===
  
  // IntentRequest専用ファクトリ - 「〜してください」(1対1、要求)
  static intentRequest(target, action, payload) {
    const message = new Message(action, payload, 'IntentRequest')
    message.target = target
    message.action = action
    return message
  }

  // IntentResponse専用ファクトリ - 「〜しました」(1対1、応答)
  static intentResponse(action, payload) {
    const message = new Message(action, payload, 'IntentResponse')
    message.action = action
    return message
  }

  // === BACKWARD COMPATIBILITY ===
  
  // Intent専用ファクトリ - 「〜してほしい」(1対1) - v11.0 互換性
  // 自動的にIntentRequestとして処理される
  static intent(target_role, action, payload) {
    console.log('⚠️ Message.intent() is deprecated. Use Message.intentRequest() for v12.0')
    const message = new Message(action, payload, 'IntentRequest')
    message.target_role = target_role // v11.0互換性
    message.target = target_role      // v12.0形式にも対応
    message.action = action
    return message
  }

  // Notice専用ファクトリ - 「〜が起きた」(1対多)
  static notice(event_name, payload) {
    const message = new Message(event_name, payload, 'Notice')
    message.event_name = event_name
    return message
  }

  // Proposal専用ファクトリ - 「〜しませんか」(1対1、非強制)
  static proposal(target_plugin, suggestion, payload) {
    const message = new Message(suggestion, payload, 'Proposal')
    message.target_plugin = target_plugin
    message.suggestion = suggestion
    return message
  }

  // ソース情報追加
  withSource(source) {
    this.source = source
    return this
  }

  // タイムスタンプ追加
  withTimestamp(timestamp = Date.now()) {
    this.timestamp = timestamp
    return this
  }

  // メッセージの妥当性確認
  isValid() {
    if (!this.type || !this.category) return false

    switch (this.category) {
      case 'IntentRequest':
        return !!(this.target && this.action)
      case 'IntentResponse':
        return !!this.action
      case 'Intent': // v11.0 backward compatibility
        return !!(this.target_role && this.action)
      case 'Notice':
        return !!this.event_name
      case 'Proposal':
        return !!(this.target_plugin && this.suggestion)
      default:
        return false
    }
  }

  // メッセージの説明文生成
  getDescription() {
    switch (this.category) {
      case 'IntentRequest':
        return `Request: "${this.target}, please ${this.action}"`
      case 'IntentResponse':
        return `Response: "${this.action} completed"`
      case 'Intent': // v11.0 backward compatibility
        return `Legacy Intent: "${this.target_role}, please ${this.action}"`
      case 'Notice':
        return `Notice: "${this.event_name} happened"`
      case 'Proposal':
        return `Proposal: "${this.target_plugin}, shall we ${this.suggestion}?"`
      default:
        return `Unknown message type: ${this.type}`
    }
  }

  // JSON表現
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      category: this.category,
      payload: this.payload,
      timestamp: this.timestamp,
      source: this.source,
      // カテゴリ別の特殊フィールド
      ...(this.target && { target: this.target }),
      ...(this.target_role && { target_role: this.target_role }), // v11.0 compatibility
      ...(this.action && { action: this.action }),
      ...(this.event_name && { event_name: this.event_name }),
      ...(this.target_plugin && { target_plugin: this.target_plugin }),
      ...(this.suggestion && { suggestion: this.suggestion })
    }
  }

  // ログ用の短縮表現
  toLogString() {
    const desc = this.getDescription()
    const payload = JSON.stringify(this.payload).substring(0, 50)
    return `${this.category}[${this.type}]: ${desc} | ${payload}...`
  }
}

// 後方互換性のための旧形式サポート
export function createLegacyMessage(type, source, event_name, payload, message_id) {
  return new Message(event_name || type, payload, 'Notice')
    .withSource(source)
}