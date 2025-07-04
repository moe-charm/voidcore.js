// src/message.js - メッセージ分類システム
// Intent/Notice/Proposal の3パターン

export class Message {
  constructor(type, payload, category = 'Notice') {
    this.type = type
    this.payload = payload || {}
    this.category = category // Intent/Notice/Proposal
    this.timestamp = Date.now()
    this.id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Intent専用ファクトリ - 「〜してほしい」(1対1)
  static intent(target_role, action, payload) {
    const message = new Message(action, payload, 'Intent')
    message.target_role = target_role
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
      case 'Intent':
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
      case 'Intent':
        return `「${this.target_role}に${this.action}してほしい」`
      case 'Notice':
        return `「${this.event_name}が起きた」`
      case 'Proposal':
        return `「${this.target_plugin}に${this.suggestion}しませんか？」`
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
      ...(this.target_role && { target_role: this.target_role }),
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