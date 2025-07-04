// src/voidcore.js - 静寂の器 (The Vessel of Silence)
// 純粋なメッセージルーティング - 中身は一切知らない

class VoidCore {
  constructor() {
    this.subscribers = new Map() // type -> Set<handler>
    this.logElement = null
  }

  setLogElement(element) {
    this.logElement = element
  }

  log(msg) {
    if (this.logElement) {
      this.logElement.innerHTML += msg + "<br>"
      setTimeout(() => {
        this.logElement.scrollTop = this.logElement.scrollHeight
      }, 0)
    } else {
      console.log(msg)
    }
  }

  // メッセージ購読（typeのみを知る）
  subscribe(type, handler) {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set())
    }
    this.subscribers.get(type).add(handler)
    this.log(`🔔 Subscribe: ${type}`)
  }

  // 購読解除
  unsubscribe(type, handler) {
    const handlers = this.subscribers.get(type)
    if (handlers) {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.subscribers.delete(type)
      }
      this.log(`🔕 Unsubscribe: ${type}`)
    }
  }

  // メッセージ発行（中身は見ない、typeだけでルーティング）
  async publish(message) {
    if (!message || !message.type) {
      this.log("⚠️ Invalid message: missing type")
      return
    }

    this.log(`📨 Publish: ${message.type} (${message.category || 'Unknown'})`)

    // typeだけを見てルーティング
    const handlers = this.subscribers.get(message.type)
    if (handlers && handlers.size > 0) {
      // 非同期で全ハンドラーに配送
      const promises = Array.from(handlers).map(handler => {
        try {
          return Promise.resolve(handler(message))
        } catch (error) {
          this.log(`❌ Handler error for ${message.type}: ${error.message}`)
          return Promise.resolve()
        }
      })
      await Promise.all(promises)
      this.log(`✅ Delivered to ${handlers.size} subscribers`)
    } else {
      this.log(`📭 No subscribers for ${message.type}`)
    }
  }

  // 購読者数取得
  getSubscriberCount(type) {
    return this.subscribers.get(type)?.size || 0
  }

  // 全購読解除
  clear() {
    this.subscribers.clear()
    this.log("🧹 All subscriptions cleared")
  }

  // 統計情報
  getStats() {
    const totalSubscribers = Array.from(this.subscribers.values())
      .reduce((sum, handlers) => sum + handlers.size, 0)
    
    return {
      messageTypes: this.subscribers.size,
      totalSubscribers,
      subscriptions: Array.from(this.subscribers.entries()).map(([type, handlers]) => ({
        type,
        subscriberCount: handlers.size
      }))
    }
  }
}

export const voidCore = new VoidCore()