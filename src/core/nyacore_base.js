// VoidCore Base v14.0 - 最小限のメッセージング基盤
// 純粋なPub/Sub + 基本プラグイン管理のみ

import { ChannelManager } from './channel-manager.js'
import { PluginStore } from '../plugins/plugin-store.js'

/**
 * VoidCoreBase - 最小限のメッセージング基盤
 * 
 * 責務:
 * - 基本的なPub/Subメッセージング
 * - 基本的なプラグイン登録・管理
 * - 初期化とライフサイクル
 * - デバッグとロギング
 * 
 * 含まない機能:
 * - Intent処理システム
 * - CoreFusion
 * - 高度な階層管理
 * - バッチ処理
 * - コア間通信
 */
class VoidCoreBase {
  constructor(transport = null, options = {}) {
    this.channelManager = new ChannelManager(transport)
    this.initialized = false
    this.coreId = `core-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    this.pluginStore = new PluginStore(10)
    
    // デバッグモード設定
    this.debugMode = options.debug !== undefined ? options.debug : false
    this.logElement = null
  }

  async _ensureInitialized() {
    if (this.initialized) return
    this.initPromise = this.initPromise || this._performInitialization()
    await this.initPromise
  }
  
  async _performInitialization() {
    try {
      await this.channelManager.initialize()
      this.initialized = true
      this.log('🎆 VoidCoreBase initialized')
    } catch (error) {
      this.log(`❌ VoidCoreBase initialization failed: ${error.message}`)
      throw error
    }
  }

  setLogElement(element) {
    this.logElement = element
  }

  enableDebug(enabled = true) {
    this.debugMode = enabled
    this.log(`🐱 Debug mode: ${enabled ? 'ON' : 'OFF'}`)
  }

  log(msg) {
    if (!this.debugMode) return
    this.logElement ? 
      (this.logElement.innerHTML += msg + "<br>", 
       setTimeout(() => this.logElement.scrollTop = this.logElement.scrollHeight, 0)) :
      console.log(msg)
  }

  debugLog(msg) {
    if (this.debugMode) this.log(`🔍 DEBUG: ${msg}`)
  }

  async subscribe(type, handler) {
    await this._ensureInitialized()
    const unsubscribe = await this.channelManager.subscribe(type, handler)
    this.log(`🔔 Subscribe: ${type}`)
    return unsubscribe
  }

  unsubscribe(type, handler) {
    const handlers = this.subscribers.get(type)
    handlers && (handlers.delete(handler), 
                 handlers.size === 0 && this.subscribers.delete(type),
                 this.log(`🔕 Unsubscribe: ${type}`))
  }

  async publish(message) {
    return !message || !message.type ? 
      (this.log("⚠️ Invalid message: missing type"), 0) : 
      await this._publishValidMessage(message)
  }
  
  async _publishValidMessage(message) {
    await this._ensureInitialized()
    return await this.channelManager.publish(message)
  }

  getSubscriberCount(type) {
    return this.channelManager.getSubscriberCount(type)
  }

  getStats() {
    const channelStats = this.channelManager.getStats()
    return {
      ...channelStats,
      coreId: this.coreId,
      pluginCount: this.pluginStore.getPluginCount()
    }
  }
  
  // 🔧 大工事Phase3: プラグイン管理統合済み（UnifiedPluginManagerに移行）
  registerPlugin(plugin) {
    this.log('⚠️ Deprecated: Use UnifiedPluginManager instead')
    return false
  }
  
  // 🔧 大工事Phase3: プラグイン管理統合済み（UnifiedPluginManagerに移行）
  unregisterPlugin(pluginId) {
    this.log('⚠️ Deprecated: Use UnifiedPluginManager instead')
    return false
  }
  
  getPlugin(pluginId) { return this.pluginStore.getPlugin(pluginId) }
  getAllPlugins() { return this.pluginStore.getAllPlugins() }
  getPluginCount() { return this.pluginStore.getPluginCount() }

  async clear() {
    this.pluginStore.clear()
    await this.channelManager.clear()
    this.log('🧹 VoidCoreBase cleared')
  }
}

export { VoidCoreBase }
export const voidCoreBase = new VoidCoreBase(null, { debug: false })