// src/voidcore.js - 静寂の器 (The Vessel of Silence) v14.0
// セリンの大改革版: 純粋メッセージベースシステム
// 基底クラス継承完全排除、紳士協定システム実装

import { ChannelManager } from './channel-manager.js'
import { CoreFusion } from './core-fusion.js'
import { SimpleMessagePool } from './simple-message-pool.js'
import { Message } from './message.js'
import { IPlugin, ICorePlugin, isCorePlugin } from './plugin-interface.js'

class VoidCore {
  constructor(transport = null) {
    // v13.0: ChannelManager with optional Transport injection
    this.channelManager = new ChannelManager(transport)
    this.initialized = false
    
    // v11.0 backward compatibility
    this.subscribers = new Map() // type -> Set<handler> (legacy access)
    this.logElement = null
    
    // v13.0: Auto-initialize for backward compatibility (lazy)
    this.initPromise = null
    
    // v14.0: CoreFusion v1.2 & SimpleMessagePool
    this.coreId = `core-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    this.plugins = []
    this.messagePool = new SimpleMessagePool()
    this.coreFusion = new CoreFusion()
    
    // Phase 5.2: Dynamic Plugin Management System
    this.pendingRequests = new Map() // correlationId -> Promise resolver
    this.maxDepth = 10 // Default maximum hierarchy depth
    this.resourceCost = new Map() // coreId -> resource consumption
    
    // システムメッセージハンドラーの初期化（非同期）
    this._initializeSystemMessageHandlers().catch(error => {
      console.error('System message handlers initialization failed:', error)
    })
  }

  setLogElement(element) {
    this.logElement = element
    this.channelManager.setLogElement(element)
  }

  // === v13.0 TRANSPORT METHODS ===

  // Heart transplant! Swap the transport layer at runtime
  async setTransport(newTransport) {
    await this.channelManager.setTransport(newTransport)
    this.log(`💓 VoidCore v13.0: Transport swapped to ${newTransport.constructor.name}`)
  }

  // Ensure ChannelManager is initialized with proper Promise pattern
  async _ensureInitialized() {
    // Phase S4: 早期return + 三項演算子でif文削減
    if (this.initialized) return
    this.initPromise = this.initPromise || this._performInitialization()
    await this.initPromise
  }
  
  // 実際の初期化処理
  async _performInitialization() {
    try {
      await this.channelManager.initialize();
      this.initialized = true;
      this.log('🎆 VoidCore fully initialized');
    } catch (error) {
      this.log(`❌ VoidCore initialization failed: ${error.message}`);
      throw error;
    }
  }

  // === v12.0 CHANNEL METHODS ===

  // Enable multi-channel mode for high performance
  enableMultiChannel(config = {}) {
    this.channelManager.enableMultiChannel(config)
    this.log(`🌟 VoidCore v12.0: Multi-channel mode activated`)
  }

  // Disable multi-channel mode (back to v11.0 compatibility)
  disableMultiChannel() {
    this.channelManager.disableMultiChannel()
    this.log(`📡 VoidCore v12.0: Single-channel compatibility mode`)
  }

  log(msg) {
    // Phase S4: 三項演算子でif文削減
    this.logElement ? 
      (this.logElement.innerHTML += msg + "<br>", 
       setTimeout(() => this.logElement.scrollTop = this.logElement.scrollHeight, 0)) :
      console.log(msg)
  }

  // メッセージ購読（typeのみを知る） with proper async
  async subscribe(type, handler) {
    // v13.0: 必ず初期化を待つ
    await this._ensureInitialized();
    
    // v12.0: Delegate to ChannelManager
    const unsubscribe = await this.channelManager.subscribe(type, handler);
    
    // v11.0 backward compatibility: maintain legacy subscribers map
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set())
    }
    this.subscribers.get(type).add(handler)
    
    this.log(`🔔 Subscribe: ${type}`)
    return unsubscribe // v12.0: return unsubscribe function
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
      return 0
    }

    // v13.0: Ensure initialization
    await this._ensureInitialized()

    // v12.0: Delegate to ChannelManager for smart routing
    const deliveredCount = await this.channelManager.publish(message)
    
    return deliveredCount
  }

  // ==========================================
  // 🎯 Phase R: ChatGPT統一Intentシステム
  // ==========================================

  /**
   * Intent送信API - ChatGPT提案の統一操作インターフェース
   * 
   * Before: system.createPlugin(config)
   * After:  await voidCore.sendIntent('system.createPlugin', config)
   * 
   * @param {string} intentName - Intent名 ("system.createPlugin" etc.)
   * @param {Object} data - Intentデータ
   * @param {Object} options - オプション（correlationId等）
   * @returns {Promise<Object>} Intent処理結果
   */
  async sendIntent(intentName, data = {}, options = {}) {
    await this._ensureInitialized()
    
    // Intent統一メッセージ作成
    const intentMessage = Message.intent(intentName, data, options)
    
    this.log(`🎯 Sending Intent: ${intentName}`)
    this.log(`🔍 Intent message structure: ${JSON.stringify(intentMessage, null, 2)}`)
    
    // Intent処理ハンドラーを探す
    const result = await this._processIntent(intentMessage)
    
    return result
  }

  /**
   * Intent処理の内部実装
   * @param {Object} intentMessage - Intent付きメッセージ
   * @returns {Promise<Object>} 処理結果
   */
  async _processIntent(intentMessage) {
    // デバッグ: メッセージ全体を出力
    this.log(`🔍 Full intentMessage: ${JSON.stringify(intentMessage, null, 2)}`)
    
    // 正しくintentフィールドを取得
    const intent = intentMessage.intent
    const payload = intentMessage.payload
    
    // デバッグログ
    this.log(`🔍 Processing intent: ${intent}, payload keys: ${Object.keys(payload || {}).join(', ')}`)
    this.log(`🔍 typeof intent: ${typeof intent}, intent value: "${intent}"`)
    
    if (!intent) {
      this.log(`❌ Intent is falsy: ${intent}`)
      throw new Error('Intent name is required')
    }
    
    try {
      // Phase S4: Intent prefix HandlerMapパターン
      const intentPrefixHandlers = [
        { prefix: 'system.', handler: (msg) => this._handleSystemIntent(msg) },
        { prefix: 'plugin.', handler: (msg) => this._handlePluginIntent(msg) }
      ]
      
      const prefixHandler = intentPrefixHandlers.find(h => intent.startsWith(h.prefix))
      return prefixHandler ? 
        await prefixHandler.handler(intentMessage) : 
        await this._handleCustomIntent(intentMessage)
      
    } catch (error) {
      this.log(`❌ Intent processing failed: ${intent} - ${error.message}`)
      throw error
    }
  }

  /**
   * システムIntent処理
   * @param {Object} intentMessage - システムIntent
   * @returns {Promise<Object>} 処理結果
   */
  // Phase S4: HandlerMapパターンでif文撲滅運動
  static SYSTEM_INTENT_HANDLERS = {
    'system.createPlugin': async (payload, ctx) => await ctx._handleCreatePluginIntent(payload),
    'system.reparentPlugin': async (payload, ctx) => await ctx._handleReparentPluginIntent(payload),
    'system.destroyPlugin': async (payload, ctx) => await ctx._handleDestroyPluginIntent(payload),
    'system.getStats': async (payload, ctx) => ctx.getSystemStats()
  }

  async _handleSystemIntent(intentMessage) {
    const intent = intentMessage.intent
    const payload = intentMessage.payload
    
    this.log(`🔧 System intent: ${intent}, data: ${JSON.stringify(payload)}`)
    
    const handler = VoidCore.SYSTEM_INTENT_HANDLERS[intent]
    if (!handler) throw new Error(`Unknown system intent: ${intent}`)
    return await handler(payload, this)
  }

  /**
   * プラグインIntent処理
   * @param {Object} intentMessage - プラグインIntent
   * @returns {Promise<Object>} 処理結果
   */
  async _handlePluginIntent(intentMessage) {
    const intent = intentMessage.intent
    const payload = intentMessage.payload
    
    // 既存プラグインシステムへの転送（後で実装）
    this.log(`📨 Forwarding plugin intent: ${intent}, data: ${JSON.stringify(payload)}`)
    
    // 暫定実装：既存システムを呼び出し
    return await this._forwardToExistingSystem(intentMessage)
  }

  /**
   * カスタムIntent処理
   * @param {Object} intentMessage - カスタムIntent
   * @returns {Promise<Object>} 処理結果
   */
  async _handleCustomIntent(intentMessage) {
    // 暫定実装：通常のメッセージとして発行
    await this.publish(intentMessage)
    return { status: 'forwarded', intent: intentMessage.intent }
  }

  // ==========================================
  // 🔧 Intent実装詳細
  // ==========================================

  async _handleCreatePluginIntent(payload) {
    // 暫定実装：既存のcreateDynamicPluginを呼び出し
    this.log(`🔧 Creating plugin via Intent: ${payload.type}`)
    
    // 既存システムへの移行コード（後で詳細実装）
    return await this._createPluginViaIntent(payload)
  }

  async _handleReparentPluginIntent(payload) {
    const { childId, newParentId } = payload
    this.log(`🔧 Reparenting plugin via Intent: ${childId} -> ${newParentId}`)
    
    // 戸籍異動届の統一処理
    return await this._reparentPluginViaIntent(payload)
  }

  async _handleDestroyPluginIntent(payload) {
    const { pluginId } = payload
    this.log(`🔧 Destroying plugin via Intent: ${pluginId}`)
    
    return await this._destroyPluginViaIntent(payload)
  }

  // ==========================================
  // 🚀 移行用ヘルパーメソッド
  // ==========================================

  async _createPluginViaIntent(payload) {
    // 既存のプラグイン作成システムとの統合
    // 実装詳細は次のステップで
    return { 
      status: 'created', 
      pluginId: `plugin_${Date.now()}`,
      message: 'Plugin created via Intent system'
    }
  }

  async _reparentPluginViaIntent(payload) {
    // 既存の戸籍異動届システムとの統合
    return { 
      status: 'reparented', 
      ...payload,
      message: 'Plugin reparented via Intent system'
    }
  }

  async _destroyPluginViaIntent(payload) {
    // 既存のプラグイン削除システムとの統合
    return { 
      status: 'destroyed', 
      pluginId: payload.pluginId,
      message: 'Plugin destroyed via Intent system'
    }
  }

  async _forwardToExistingSystem(intentMessage) {
    // 既存システムへの転送処理
    return { 
      status: 'forwarded', 
      intent: intentMessage.intent,
      message: 'Forwarded to existing system'
    }
  }

  // 購読者数取得
  getSubscriberCount(type) {
    // v12.0: Use ChannelManager for accurate count across all channels
    return this.channelManager.getSubscriberCount(type)
  }

  // 全購読解除
  async clear() {
    // v13.0: Clear ChannelManager
    await this.channelManager.clear()
    this.initialized = false
    
    // v11.0 backward compatibility
    this.subscribers.clear()
    this.log("🧹 All subscriptions cleared")
  }

  // 統計情報
  getStats() {
    // v12.0: Get comprehensive stats from ChannelManager
    const channelStats = this.channelManager.getStats()
    const poolStats = this.messagePool.getStats()
    
    return {
      ...channelStats,
      messagePool: poolStats,
      coreId: this.coreId,
      pluginCount: this.plugins.length,
      fusionHistory: this.coreFusion.getFusionHistory().length
    }
  }
  
  // === v14.0 CORE FUSION & MESSAGE POOL METHODS ===
  
  // 🧩 CoreFusion v1.2 - 複数コア統合
  async fuseWith(targetCore, config = {}) {
    const result = await this.coreFusion.fuseWith(this, targetCore, config)
    
    if (result.success) {
      this.log(`🧩 CoreFusion v1.2: Successfully fused with target core (${result.pluginsMoved} plugins moved in ${result.processingTime}ms)`)
    } else {
      this.log(`❌ CoreFusion v1.2: Fusion failed - ${result.error}`)
    }
    
    return result
  }
  
  // 📦 プラグイン登録
  registerPlugin(plugin) {
    if (!plugin || !plugin.pluginId) {
      this.log('⚠️ Invalid plugin: missing pluginId')
      return false
    }
    
    // 既存プラグインの重複チェック
    const existingPlugin = this.plugins.find(p => p.pluginId === plugin.pluginId)
    if (existingPlugin) {
      this.log(`⚠️ Plugin ${plugin.pluginId} already registered`)
      return false
    }
    
    // プラグインにコア参照を設定
    plugin.core = this
    
    // プラグインリストに追加
    this.plugins.push(plugin)
    
    this.log(`🔌 Plugin registered: ${plugin.pluginId}`)
    return true
  }
  
  // 🗑️ プラグイン削除
  unregisterPlugin(pluginId) {
    const index = this.plugins.findIndex(p => p.pluginId === pluginId)
    if (index !== -1) {
      const plugin = this.plugins.splice(index, 1)[0]
      plugin.core = null
      this.log(`🗑️ Plugin unregistered: ${pluginId}`)
      return true
    }
    
    this.log(`⚠️ Plugin not found: ${pluginId}`)
    return false
  }
  
  // 🔍 プラグイン取得
  getPlugin(pluginId) {
    return this.plugins.find(p => p.pluginId === pluginId)
  }
  
  // 📦 すべてのプラグインを取得
  getAllPlugins() {
    return [...this.plugins]
  }
  
  // 🚀 SimpleMessagePool - バッチ送信
  async publishBatch(messages) {
    if (!Array.isArray(messages)) {
      this.log('⚠️ publishBatch: messages must be an array')
      return { success: false, error: 'Invalid messages array' }
    }
    
    // MessagePoolにTransportを設定
    this.messagePool.setTransport({
      send: async (message) => {
        return await this.publish(message)
      }
    })
    
    const result = await this.messagePool.submitBatch(messages)
    
    if (result.success) {
      this.log(`🚀 Batch published: ${result.processedCount} messages (${result.parallelCount} parallel, ${result.sequentialCount} sequential) in ${result.processingTime}ms`)
    } else {
      this.log(`❌ Batch publish failed: ${result.errors}`)
    }
    
    return result
  }
  
  // 📊 MessagePool統計情報
  getMessagePoolStats() {
    return this.messagePool.getStats()
  }
  
  // 🧹 MessagePool統計リセット
  resetMessagePoolStats() {
    this.messagePool.resetStats()
    this.log('📊 MessagePool stats reset')
  }
  
  // 📈 Fusion履歴取得
  getFusionHistory() {
    return this.coreFusion.getFusionHistory()
  }
  
  // 🧹 Fusion履歴クリア
  clearFusionHistory() {
    this.coreFusion.clearFusionHistory()
    this.log('🧹 Fusion history cleared')
  }
  
  // === Phase 5.2: DYNAMIC PLUGIN MANAGEMENT SYSTEM ===
  
  // Phase S4: IntentRequest HandlerMapパターン
  static INTENT_REQUEST_HANDLERS = {
    'system.createPlugin': async (message, ctx) => await ctx._handleCreatePlugin(message),
    'system.destroyPlugin': async (message, ctx) => await ctx._handleDestroyPlugin(message),
    'system.reparentPlugin': async (message, ctx) => await ctx._handleReparentPlugin(message),
    'system.connect': async (message, ctx) => await ctx._handleConnect(message)
  }

  // 🚀 システムメッセージハンドラー初期化
  async _initializeSystemMessageHandlers() {
    // 統一システムメッセージハンドラー (HandlerMapパターン)
    await this.subscribe('IntentRequest', async (message) => {
      try {
        const handler = VoidCore.INTENT_REQUEST_HANDLERS[message.action]
        if (handler) await handler(message, this)
      } catch (error) {
        this.log(`❌ System message handler error: ${error.message}`)
        console.error('System handler error:', error)
      }
    })
  }

  // Phase S4: 共通レスポンス関数 (重複削減)
  async _sendSystemErrorResponse(action, error, correlationId) {
    await this._sendSystemResponse(action, {
      success: false,
      error: error.message,
      correlationId,
      timestamp: Date.now()
    }, correlationId)
    this.log(`❌ System: ${action} failed - ${error.message}`)
  }

  async _sendSystemSuccessResponse(action, data, correlationId, logMessage) {
    await this._sendSystemResponse(action, {
      success: true,
      ...data,
      correlationId,
      timestamp: Date.now()
    }, correlationId)
    if (logMessage) this.log(logMessage)
  }
  
  // 🔧 system.createPlugin ハンドラー
  async _handleCreatePlugin(message) {
    const { type, config, parent, correlationId, maxDepth, resourceCost, displayName } = message.payload
    
    try {
      // 階層深度チェック
      if (maxDepth && this._getCurrentDepth(parent) >= maxDepth) {
        throw new Error(`Maximum depth exceeded: ${maxDepth}`)
      }
      
      // リソースコストチェック
      if (resourceCost && !this._checkResourceAvailability(parent, resourceCost)) {
        throw new Error(`Insufficient resources for plugin creation`)
      }
      
      // 動的プラグイン生成
      const pluginId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
      
      // プラグインオブジェクト作成
      const plugin = this._createPluginObject({
        pluginId,
        type,
        config: config || {},
        parent,
        createdAt: Date.now(),
        correlationId,
        displayName  // ChatGPT案: displayName追加
      })
      
      // プラグイン登録
      const success = this.registerPlugin(plugin)
      
      if (success) {
        // リソース消費を記録
        if (resourceCost) {
          this._consumeResource(parent, resourceCost)
        }
        
        // 成功レスポンス
        await this._sendSystemSuccessResponse('system.createPlugin', 
          { pluginId, type, parent }, 
          correlationId, 
          `🚀 System: Plugin created - ${pluginId} (type: ${type}, parent: ${parent})`)
      } else {
        throw new Error(`Failed to register plugin: ${pluginId}`)
      }
      
    } catch (error) {
      await this._sendSystemErrorResponse('system.createPlugin', error, correlationId)
    }
  }
  
  // 🗑️ system.destroyPlugin ハンドラー
  async _handleDestroyPlugin(message) {
    const { pluginId, correlationId } = message.payload
    
    try {
      const success = this.unregisterPlugin(pluginId)
      
      await this._sendSystemSuccessResponse('system.destroyPlugin', 
        { success, pluginId }, 
        correlationId, 
        `🗑️ System: Plugin ${success ? 'destroyed' : 'not found'} - ${pluginId}`)
      
    } catch (error) {
      await this._sendSystemErrorResponse('system.destroyPlugin', error, correlationId)
    }
  }
  
  // 🔗 system.connect ハンドラー
  async _handleConnect(message) {
    const { source, target, sourcePort, targetPort, correlationId } = message.payload
    
    try {
      // 動的接続の実装（将来拡張）
      // 現在はログ出力のみ
      
      await this._sendSystemResponse('system.connect', {
        success: true,
        source,
        target,
        sourcePort,
        targetPort,
        correlationId,
        timestamp: Date.now()
      }, correlationId)
      
      this.log(`🔗 System: Connection established - ${source}:${sourcePort} -> ${target}:${targetPort}`)
      
    } catch (error) {
      await this._sendSystemResponse('system.connect', {
        success: false,
        error: error.message,
        correlationId,
        timestamp: Date.now()
      }, correlationId)
      
      this.log(`❌ System: Connection failed - ${error.message}`)
    }
  }
  
  // 🏘️ system.reparentPlugin ハンドラー（戸籍異動届）
  async _handleReparentPlugin(message) {
    const { pluginId, newParentId, oldParentId, correlationId } = message.payload
    
    try {
      // プラグインの存在確認
      const plugin = this.getPlugin(pluginId)
      if (!plugin) {
        throw new Error(`Plugin not found: ${pluginId}`)
      }
      
      // 旧親の確認（オプション）
      if (oldParentId && plugin.parentId !== oldParentId) {
        throw new Error(`Parent mismatch: expected ${oldParentId}, got ${plugin.parentId}`)
      }
      
      // 循環参照チェック
      if (newParentId && this._wouldCreateCircularReference(pluginId, newParentId)) {
        throw new Error(`Circular reference detected: ${pluginId} -> ${newParentId}`)
      }
      
      // 戸籍異動実行
      const oldParent = plugin.parentId
      plugin.parentId = newParentId
      
      // 成功レスポンス
      await this._sendSystemResponse('system.reparentPlugin', {
        success: true,
        pluginId,
        oldParentId: oldParent,
        newParentId,
        correlationId,
        timestamp: Date.now()
      }, correlationId)
      
      // 戸籍異動通知（Notice発行）
      await this.publish(Message.notice('plugin.reparented', {
        pluginId,
        oldParentId: oldParent,
        newParentId,
        timestamp: Date.now()
      }))
      
      this.log(`🏘️ Plugin reparented: ${pluginId} moved from ${oldParent || 'null'} to ${newParentId || 'null'}`)
      
    } catch (error) {
      // エラーレスポンス
      await this._sendSystemResponse('system.reparentPlugin', {
        success: false,
        error: error.message,
        correlationId,
        timestamp: Date.now()
      }, correlationId)
      
      this.log(`❌ System: Reparenting failed - ${error.message}`)
    }
  }
  
  // 🏭 プラグインオブジェクト作成
  _createPluginObject({ pluginId, type, config, parent, createdAt, correlationId, displayName }) {
    return {
      pluginId,
      displayName: displayName || null,  // ChatGPT案: 人間用の短い名前
      type,
      parentId: parent,                  // ChatGPT案: parent → parentId統一
      metadata: {                        // ChatGPT案: メタデータ分離
        createdAt,
        correlationId,
        config: config || {}
      },
      core: this,
      
      // 基本的なプラグインAPI
      sendIntent: async (action, payload) => {
        const intentMessage = {
          type: 'IntentRequest',
          action,
          payload: {
            ...payload,
            sourcePlugin: pluginId,
            causationId: correlationId // 因果関係追跡
          },
          timestamp: Date.now()
        }
        return await this.publish(intentMessage)
      },
      
      notice: async (eventName, payload) => {
        const noticeMessage = Message.notice(eventName, {
          ...payload,
          sourcePlugin: pluginId,
          causationId: correlationId
        })
        return await this.publish(noticeMessage)
      },
      
      observe: async (eventName, handler) => {
        return await this.subscribe('Notice', (message) => {
          if (message.event_name === eventName) {  // FIX: event → event_name
            handler(message)
          }
        })
      }
    }
  }
  
  // 📤 システムレスポンス送信
  async _sendSystemResponse(action, payload, correlationId) {
    const responseMessage = {
      type: 'IntentResponse',
      action,
      payload,
      correlationId,
      timestamp: Date.now()
    }
    
    return await this.publish(responseMessage)
  }
  
  // 📏 現在の階層深度取得
  _getCurrentDepth(parentId) {
    // Phase S4: 共通関数使用で重複削減
    return this._traverseParentChain(parentId).depth
  }
  
  // 🔄 循環参照チェック（戸籍異動届で使用）- 強化版
  _wouldCreateCircularReference(pluginId, newParentId) {
    if (!newParentId) return false  // parentId が null なら問題なし
    if (pluginId === newParentId) return true  // 自分自身を親にはできない
    
    // 新しい親が、移動対象プラグインの子孫かどうかをチェック
    const descendants = this.getDescendants(pluginId);
    const isDescendant = descendants.some(plugin => plugin.pluginId === newParentId);
    
    if (isDescendant) {
      this.log(`🔄 Circular reference detected: ${newParentId} is a descendant of ${pluginId}`);
      return true;
    }
    
    // 従来の親を辿る方式も併用（二重チェック）
    const visited = new Set();
    let current = newParentId;
    let depth = 0;
    
    while (current && depth < 100) {  // 無限ループ防止
      if (visited.has(current)) {
        this.log(`🔄 Circular reference detected: loop found at ${current}`);
        return true;  // 循環参照発見！
      }
      
      if (current === pluginId) {
        this.log(`🔄 Circular reference detected: ${current} === ${pluginId}`);
        return true;  // 循環参照発見！
      }
      
      visited.add(current);
      const parent = this.getPlugin(current);
      if (!parent) break;
      
      current = parent.parentId;
      depth++;
    }
    
    return false;  // 循環参照なし
  }
  
  // 🔍 階層構造の整合性チェック
  validateHierarchyIntegrity() {
    const issues = [];
    
    for (const plugin of this.plugins) {
      // 親プラグインの存在チェック（共通化）
      if (!this.hasValidParent(plugin)) {
        issues.push({
          type: 'missing_parent',
          pluginId: plugin.pluginId,
          parentId: plugin.parentId,
          message: `Plugin ${plugin.pluginId} has non-existent parent ${plugin.parentId}`
        });
      }
      
      // 循環参照チェック
      if (plugin.parentId && this._wouldCreateCircularReference(plugin.pluginId, plugin.parentId)) {
        issues.push({
          type: 'circular_reference',
          pluginId: plugin.pluginId,
          parentId: plugin.parentId,
          message: `Circular reference detected for plugin ${plugin.pluginId}`
        });
      }
      
      // 階層深度チェック
      const level = this.getPluginLevel(plugin.pluginId);
      if (level > this.maxDepth) {
        issues.push({
          type: 'max_depth_exceeded',
          pluginId: plugin.pluginId,
          currentLevel: level,
          maxDepth: this.maxDepth,
          message: `Plugin ${plugin.pluginId} exceeds maximum depth (${level} > ${this.maxDepth})`
        });
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues: issues
    };
  }
  
  // 💰 リソース可用性チェック
  _checkResourceAvailability(coreId, requiredCost) {
    const currentCost = this.resourceCost.get(coreId) || 0
    const maxCost = 100 // デフォルト最大リソース
    
    return (currentCost + requiredCost) <= maxCost
  }
  
  // 💸 リソース消費
  _consumeResource(coreId, cost) {
    const currentCost = this.resourceCost.get(coreId) || 0
    this.resourceCost.set(coreId, currentCost + cost)
  }
  
  // 🔄 リソース解放
  _releaseResource(coreId, cost) {
    const currentCost = this.resourceCost.get(coreId) || 0
    this.resourceCost.set(coreId, Math.max(0, currentCost - cost))
  }
  
  // 🏷️ ChatGPT案: UIヘルパー関数
  getPluginLabel(plugin) {
    if (plugin.displayName) {
      return plugin.displayName;
    }
    
    // pluginIdを短縮表示 (例: "util.logger-1751849234289-p676za" → "logger#p676")
    const parts = plugin.pluginId.split('-');
    const typeShort = plugin.type.split('.').pop();
    const randomShort = parts[parts.length - 1].substring(0, 4);
    return `${typeShort}#${randomShort}`;
  }
  
  // 🏗️ 親子関係API - 階層構造探索機能
  
  // 指定プラグインの直接の子プラグインを取得
  getChildren(pluginId) {
    return this.plugins.filter(plugin => plugin.parentId === pluginId);
  }
  
  // 指定プラグインの全ての子孫プラグインを取得（階層すべて）
  getDescendants(pluginId) {
    const descendants = [];
    const visited = new Set(); // 循環参照防止
    
    const collectDescendants = (currentPluginId) => {
      if (visited.has(currentPluginId)) return; // 循環参照防止
      visited.add(currentPluginId);
      
      const children = this.getChildren(currentPluginId);
      for (const child of children) {
        descendants.push(child);
        collectDescendants(child.pluginId); // 再帰的に子孫を探索
      }
    };
    
    collectDescendants(pluginId);
    return descendants;
  }
  
  // 指定プラグインの全ての祖先プラグインを取得（ルートまで）
  getAncestors(pluginId) {
    const ancestors = [];
    const visited = new Set(); // 循環参照防止
    let currentPlugin = this.getPlugin(pluginId);
    
    while (currentPlugin && currentPlugin.parentId && !visited.has(currentPlugin.parentId)) {
      visited.add(currentPlugin.parentId);
      const parent = this.getPlugin(currentPlugin.parentId);
      if (parent) {
        ancestors.push(parent);
        currentPlugin = parent;
      } else {
        break; // 親が見つからない場合は終了
      }
    }
    
    return ancestors;
  }

  // Phase S4: 親プラグイン存在チェック共通化
  hasValidParent(plugin) {
    return !plugin.parentId || !!this.getPlugin(plugin.parentId)
  }

  // Phase S4: 階層探索共通関数
  _traverseParentChain(startId, maxDepth = 100, visitor = null) {
    const visited = new Set()
    let current = startId
    let depth = 0
    
    while (current && depth < maxDepth && !visited.has(current)) {
      if (visitor && visitor(current, depth, visited)) return { stopped: true, current, depth }
      visited.add(current)
      const plugin = this.getPlugin(current)
      if (!plugin) break
      current = plugin.parentId
      depth++
    }
    
    return { stopped: false, current, depth, visited }
  }
  
  // 指定プラグインの兄弟プラグインを取得（同じ親を持つ）
  getSiblings(pluginId) {
    const plugin = this.getPlugin(pluginId);
    if (!plugin) return [];
    
    return this.plugins.filter(p => 
      p.pluginId !== pluginId && // 自分自身は除外
      p.parentId === plugin.parentId // 同じ親を持つ
    );
  }
  
  // 指定プラグインがルートプラグインかどうか
  isRootPlugin(pluginId) {
    const plugin = this.getPlugin(pluginId);
    return plugin ? !plugin.parentId : false;
  }
  
  // 指定プラグインの階層レベルを取得（ルートが0）
  getPluginLevel(pluginId) {
    const ancestors = this.getAncestors(pluginId);
    return ancestors.length;
  }
  
  // 階層構造をツリー形式で取得
  getPluginTree() {
    const rootPlugins = this.plugins.filter(p => !p.parentId);
    
    const buildTree = (plugin) => {
      const children = this.getChildren(plugin.pluginId);
      return {
        ...plugin,
        children: children.map(child => buildTree(child))
      };
    };
    
    return rootPlugins.map(root => buildTree(root));
  }
  
  // 📊 システム統計情報
  getSystemStats() {
    const rootPlugins = this.plugins.filter(p => !p.parentId);
    const maxLevel = Math.max(0, ...this.plugins.map(p => this.getPluginLevel(p.pluginId)));
    
    return {
      ...this.getStats(),
      pendingRequests: this.pendingRequests.size,
      maxDepth: this.maxDepth,
      resourceUsage: Object.fromEntries(this.resourceCost),
      systemPlugins: this.plugins.filter(p => p.type && p.type.startsWith('system')).length,
      dynamicPlugins: this.plugins.filter(p => p.metadata?.correlationId).length,
      // 新しい親子関係統計
      hierarchyStats: {
        rootPlugins: rootPlugins.length,
        maxHierarchyLevel: maxLevel,
        averageChildren: rootPlugins.length > 0 ? 
          rootPlugins.reduce((sum, p) => sum + this.getChildren(p.pluginId).length, 0) / rootPlugins.length : 0,
        totalHierarchyLevels: maxLevel + 1
      }
    }
  }
}

export { VoidCore }
export const voidCore = new VoidCore()