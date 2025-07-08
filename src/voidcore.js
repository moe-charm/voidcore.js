// VoidCore v14.0 - Phase S5: Complete Plugin-ization Revolution
import { ChannelManager } from './channel-manager.js'
import { CoreFusion } from './core-fusion.js'
import { SimpleMessagePool } from './simple-message-pool.js'
import { Message } from './message.js'
import { IPlugin, ICorePlugin, isCorePlugin } from './plugin-interface.js'
import { PluginStore } from './plugin-store.js'
import SystemBootManager from './plugins/system-boot-manager.js'
import { globalMessageBus, globalUIChannel } from './core-communication.js'

class VoidCore {
  constructor(transport = null, options = {}) {
    this.channelManager = new ChannelManager(transport)
    this.initialized = false
    this.coreId = `core-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    this.messagePool = new SimpleMessagePool()
    this.coreFusion = new CoreFusion()
    this.pluginStore = new PluginStore(10)
    
    // Phase S5: SystemBootManager 統合
    this.systemBootManager = new SystemBootManager()
    
    // Phase S5: ハイブリッド通信システム統合
    this.messageBus = globalMessageBus
    this.uiChannel = globalUIChannel
    
    // デバッグモード設定
    this.debugMode = options.debug !== undefined ? options.debug : false
    this.logElement = null
    
    this._initializeSystemMessageHandlers().catch(error => {
      console.error('System message handlers initialization failed:', error)
    })
  }

  async _ensureInitialized() {
    if (this.initialized) return
    this.initPromise = this.initPromise || this._performInitialization()
    await this.initPromise
  }
  
  async _performInitialization() {
    try {
      await this.channelManager.initialize()
      
      // Phase S5: ハイブリッド通信システムに自動登録
      this.messageBus.registerCore(this.coreId, this)
      
      this.initialized = true
      this.log('🎆 VoidCore fully initialized with hybrid communication')
    } catch (error) {
      this.log(`❌ VoidCore initialization failed: ${error.message}`)
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

  async sendIntent(intentName, data = {}, options = {}) {
    await this._ensureInitialized()
    const intentMessage = Message.intent(intentName, data, options)
    this.log(`🎯 Sending Intent: ${intentName}`)
    return await this._processIntent(intentMessage)
  }

  async _processIntent(intentMessage) {
    const intent = intentMessage.intent
    if (!intent) throw new Error('Intent name is required')
    
    try {
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

  static SYSTEM_INTENT_HANDLERS = {
    'system.createPlugin': async (payload, ctx) => await ctx._handleCreatePluginIntent(payload),
    'system.reparentPlugin': async (payload, ctx) => await ctx._handleReparentPluginIntent(payload),
    'system.destroyPlugin': async (payload, ctx) => await ctx._handleDestroyPluginIntent(payload),
    'system.getStats': async (payload, ctx) => ctx.getSystemStats(),
    'system.clear': async (payload, ctx) => await ctx.clear(),
    'system.getMessagePoolStats': async (payload, ctx) => ctx.getMessagePoolStats(),
    'system.clearFusionHistory': async (payload, ctx) => ctx.clearFusionHistory(),
    'system.getPluginCount': async (payload, ctx) => ctx.getPluginCount(),
    'system.initialize': async (payload, ctx) => await ctx._ensureInitialized()
  }

  async _handleSystemIntent(intentMessage) {
    const intent = intentMessage.intent
    const payload = intentMessage.payload
    this.log(`🔧 System intent: ${intent}, data: ${JSON.stringify(payload)}`)
    const handler = VoidCore.SYSTEM_INTENT_HANDLERS[intent]
    if (!handler) throw new Error(`Unknown system intent: ${intent}`)
    return await handler(payload, this)
  }

  async _handlePluginIntent(intentMessage) {
    const intent = intentMessage.intent
    const payload = intentMessage.payload
    this.log(`📨 Forwarding plugin intent: ${intent}, data: ${JSON.stringify(payload)}`)
    return await this._forwardToExistingSystem(intentMessage)
  }
  async _handleCustomIntent(intentMessage) {
    await this.publish(intentMessage)
    return { status: 'forwarded', intent: intentMessage.intent }
  }

  async _handleCreatePluginIntent(payload) {
    this.log(`🔧 Creating plugin via Intent: ${payload.type}`)
    return { status: 'created', pluginId: `plugin_${Date.now()}`, message: 'Plugin created via Intent system' }
  }

  async _handleReparentPluginIntent(payload) {
    const { childId, newParentId } = payload
    this.log(`🔧 Reparenting plugin via Intent: ${childId} -> ${newParentId}`)
    return { status: 'reparented', ...payload, message: 'Plugin reparented via Intent system' }
  }

  async _handleDestroyPluginIntent(payload) {
    const { pluginId } = payload
    this.log(`🔧 Destroying plugin via Intent: ${pluginId}`)
    return { status: 'destroyed', pluginId: payload.pluginId, message: 'Plugin destroyed via Intent system' }
  }

  async _forwardToExistingSystem(intentMessage) {
    return { status: 'forwarded', intent: intentMessage.intent, message: 'Forwarded to existing system' }
  }

  getSubscriberCount(type) {
    return this.channelManager.getSubscriberCount(type)
  }

  getStats() {
    const channelStats = this.channelManager.getStats()
    const poolStats = this.messagePool.getStats()
    return {
      ...channelStats,
      messagePool: poolStats,
      coreId: this.coreId,
      pluginCount: this.pluginStore.getPluginCount(),
      fusionHistory: this.coreFusion.getFusionHistory().length
    }
  }
  
  async fuseWith(targetCore, config = {}) {
    const result = await this.coreFusion.fuseWith(this, targetCore, config)
    result.success ? 
      this.log(`🧩 CoreFusion v1.2: Successfully fused with target core (${result.pluginsMoved} plugins moved in ${result.processingTime}ms)`) :
      this.log(`❌ CoreFusion v1.2: Fusion failed - ${result.error}`)
    return result
  }
  
  registerPlugin(plugin) {
    return !plugin?.pluginId ? 
      (this.log('⚠️ Invalid plugin: missing pluginId'), false) :
      this.pluginStore.getPlugin(plugin.pluginId) ?
      (this.log(`⚠️ Plugin ${plugin.pluginId} already registered`), false) :
      (plugin.core = this, this.pluginStore.addPlugin(plugin), 
       this.log(`🔌 Plugin registered: ${plugin.pluginId}`), true)
  }
  
  unregisterPlugin(pluginId) {
    const plugin = this.pluginStore.removePlugin(pluginId)
    if (plugin) {
      plugin.core = null
      this.log(`🗑️ Plugin unregistered: ${pluginId}`)
      return true
    }
    this.log(`⚠️ Plugin not found: ${pluginId}`)
    return false
  }
  
  getPlugin(pluginId) { return this.pluginStore.getPlugin(pluginId) }
  getAllPlugins() { return this.pluginStore.getAllPlugins() }
  getPluginCount() { return this.pluginStore.getPluginCount() }
  
  async publishBatch(messages) {
    if (!Array.isArray(messages)) {
      this.log('⚠️ publishBatch: messages must be an array')
      return { success: false, error: 'Invalid messages array' }
    }
    this.messagePool.setTransport({ send: async (message) => await this.publish(message) })
    const result = await this.messagePool.submitBatch(messages)
    result.success ? 
      this.log(`🚀 Batch published: ${result.processedCount} messages (${result.parallelCount} parallel, ${result.sequentialCount} sequential) in ${result.processingTime}ms`) :
      this.log(`❌ Batch publish failed: ${result.errors}`)
    return result
  }
  
  getMessagePoolStats() { return this.messagePool.getStats() }
  resetMessagePoolStats() { this.messagePool.resetStats(); this.log('📊 MessagePool stats reset') }
  getFusionHistory() { return this.coreFusion.getFusionHistory() }
  clearFusionHistory() { this.coreFusion.clearFusionHistory(); this.log('🧹 Fusion history cleared') }
  static INTENT_REQUEST_HANDLERS = {
    'system.createPlugin': async (message, ctx) => await ctx._handleCreatePlugin(message),
    'system.destroyPlugin': async (message, ctx) => await ctx._handleDestroyPlugin(message),
    'system.reparentPlugin': async (message, ctx) => await ctx._handleReparentPlugin(message),
    'system.connect': async (message, ctx) => await ctx._handleConnect(message),
    
    // Phase S5: SystemBootManager Intent統合
    'system.bootPlan.request': async (message, ctx) => await ctx._handleBootPlanRequest(message),
    'system.bootPlan.execute': async (message, ctx) => await ctx._handleBootPlanExecute(message),
    'system.bootPlan.status': async (message, ctx) => await ctx._handleBootPlanStatus(message),
    'system.bootError': async (message, ctx) => await ctx._handleBootError(message)
  }

  async _initializeSystemMessageHandlers() {
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
  _createStandardResponse(success, action, data = {}, correlationId = null, error = null) {
    return {
      success,
      ...data,
      ...(error && { error: error.message || error }),
      ...(correlationId && { correlationId }),
      timestamp: Date.now()
    }
  }

  _createIntentResponse(action, success, data = {}, correlationId = null, error = null) {
    return new Message('IntentResponse', {
      action,
      payload: this._createStandardResponse(success, action, data, correlationId, error),
      correlationId
    })
  }

  _createNoticeMessage(event, payload = {}, metadata = {}) {
    return new Message('Notice', {
      event,
      payload,
      timestamp: Date.now(),
      ...metadata
    })
  }

  // Phase S4 Week 3: 統一エラーハンドリング & レスポンス送信
  async _executeWithErrorHandling(action, correlationId, operation) {
    try {
      const result = await operation()
      if (result.success !== false) {
        await this._sendSystemSuccessResponse(action, result.data || result, correlationId, result.logMessage)
      }
      return result
    } catch (error) {
      await this._sendSystemErrorResponse(action, error, correlationId)
      return { success: false, error: error.message }
    }
  }

  async _sendSystemErrorResponse(action, error, correlationId) {
    const response = this._createStandardResponse(false, action, {}, correlationId, error)
    await this._sendSystemResponse(action, response, correlationId)
    this.log(`❌ System: ${action} failed - ${error.message}`)
  }

  async _sendSystemSuccessResponse(action, data, correlationId, logMessage) {
    const response = this._createStandardResponse(true, action, data, correlationId)
    await this._sendSystemResponse(action, response, correlationId)
    if (logMessage) this.log(logMessage)
  }
  
  // 🔧 system.createPlugin ハンドラー - Phase S4 Week 3: 統合エラーハンドリング
  async _handleCreatePlugin(message) {
    const { type, config, parent, correlationId, maxDepth, resourceCost, displayName } = message.payload
    
    return await this._executeWithErrorHandling('system.createPlugin', correlationId, async () => {
      // バリデーション
      if (maxDepth && this._getCurrentDepth(parent) >= maxDepth) {
        throw new Error(`Maximum depth exceeded: ${maxDepth}`)
      }
      if (resourceCost && !this._checkResourceAvailability(parent, resourceCost)) {
        throw new Error(`Insufficient resources for plugin creation`)
      }
      
      // プラグイン生成・登録
      const pluginId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
      const plugin = this._createPluginObject({ pluginId, type, config: config || {}, parent, createdAt: Date.now(), correlationId, displayName })
      
      if (!this.registerPlugin(plugin)) {
        throw new Error(`Failed to register plugin: ${pluginId}`)
      }
      
      // リソース消費
      if (resourceCost) this._consumeResource(parent, resourceCost)
      
      return {
        data: { pluginId, type, parent },
        logMessage: `🚀 System: Plugin created - ${pluginId} (type: ${type}, parent: ${parent})`
      }
    })
  }
  
  // 🗑️ system.destroyPlugin ハンドラー - Phase S4 Week 3: 統合エラーハンドリング
  async _handleDestroyPlugin(message) {
    const { pluginId, correlationId } = message.payload
    
    return await this._executeWithErrorHandling('system.destroyPlugin', correlationId, async () => {
      const success = this.unregisterPlugin(pluginId)
      return {
        data: { success, pluginId },
        logMessage: `🗑️ System: Plugin ${success ? 'destroyed' : 'not found'} - ${pluginId}`
      }
    })
  }
  
  // 🔗 system.connect ハンドラー - Phase S4 Week 3: 統合エラーハンドリング
  async _handleConnect(message) {
    const { source, target, sourcePort, targetPort, correlationId } = message.payload
    
    return await this._executeWithErrorHandling('system.connect', correlationId, async () => {
      // 動的接続の実装（将来拡張）
      return {
        data: { source, target, sourcePort, targetPort },
        logMessage: `🔗 System: Connection established - ${source}:${sourcePort} -> ${target}:${targetPort}`
      }
    })
  }
  
  // 🏘️ system.reparentPlugin ハンドラー（戸籍異動届）- Phase S4 Week 3: 統合エラーハンドリング  
  async _handleReparentPlugin(message) {
    const { pluginId, newParentId, oldParentId, correlationId } = message.payload
    
    return await this._executeWithErrorHandling('system.reparentPlugin', correlationId, async () => {
      // バリデーション
      const plugin = this.getPlugin(pluginId)
      if (!plugin) throw new Error(`Plugin not found: ${pluginId}`)
      if (oldParentId && plugin.parentId !== oldParentId) {
        throw new Error(`Parent mismatch: expected ${oldParentId}, got ${plugin.parentId}`)
      }
      if (newParentId && this._wouldCreateCircularReference(pluginId, newParentId)) {
        throw new Error(`Circular reference detected: ${pluginId} -> ${newParentId}`)
      }
      
      // 戸籍異動実行
      const oldParent = plugin.parentId
      plugin.parentId = newParentId
      
      // 戸籍異動通知（Notice発行）
      await this.publish(this._createNoticeMessage('plugin.reparented', { pluginId, oldParentId: oldParent, newParentId }))
      
      return {
        data: { pluginId, oldParentId: oldParent, newParentId },
        logMessage: `🏘️ Plugin reparented: ${pluginId} moved from ${oldParent || 'null'} to ${newParentId || 'null'}`
      }
    })
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
      
      // 基本的なプラグインAPI - Phase S4 Week 3: Factory統合
      sendIntent: async (action, payload) => {
        const intentMessage = new Message('IntentRequest', {
          action,
          payload: { ...payload, sourcePlugin: pluginId, causationId: correlationId },
          timestamp: Date.now()
        })
        return await this.publish(intentMessage)
      },
      
      notice: async (eventName, payload) => {
        const noticeMessage = this._createNoticeMessage(eventName, {
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
  
  // 📤 システムレスポンス送信 - Phase S4 Week 3: Factory統合
  async _sendSystemResponse(action, payload, correlationId) {
    const responseMessage = this._createIntentResponse(action, payload.success, payload, correlationId, payload.error)
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
  
  // Phase S4 Week 3: 統一バリデーションシステム - HandlerMap拡張版
  static VALIDATION_HANDLERS = {
    missing_parent: (plugin, ctx) => !ctx.pluginStore.hasValidParent(plugin) ? {
      type: 'missing_parent', pluginId: plugin.pluginId, parentId: plugin.parentId,
      message: `Plugin ${plugin.pluginId} has non-existent parent ${plugin.parentId}`
    } : null,
    
    circular_reference: (plugin, ctx) => plugin.parentId && ctx.pluginStore.wouldCreateCircularReference(plugin.pluginId, plugin.parentId) ? {
      type: 'circular_reference', pluginId: plugin.pluginId, parentId: plugin.parentId,
      message: `Circular reference detected for plugin ${plugin.pluginId}`
    } : null,
    
    max_depth_exceeded: (plugin, ctx) => {
      const level = ctx.getPluginLevel(plugin.pluginId);
      return level > ctx.pluginStore.maxDepth ? {
        type: 'max_depth_exceeded', pluginId: plugin.pluginId, currentLevel: level, maxDepth: ctx.pluginStore.maxDepth,
        message: `Plugin ${plugin.pluginId} exceeds maximum depth (${level} > ${ctx.pluginStore.maxDepth})`
      } : null;
    }
  }

  // Phase S4 Week 3: 統一バリデーション実行器
  _validateEntity(entity, validationRules = []) {
    const issues = []
    for (const rule of validationRules) {
      const issue = typeof rule === 'string' ? VoidCore.VALIDATION_HANDLERS[rule]?.(entity, this) : rule(entity, this)
      if (issue) issues.push(issue)
    }
    return { isValid: issues.length === 0, issues }
  }

  _validateRequired(obj, fields) {
    const missing = fields.filter(field => obj[field] == null)
    return missing.length > 0 ? { isValid: false, missing } : { isValid: true }
  }

  // 🔍 階層構造の整合性チェック - Phase S4 Week 3: 統一バリデーション適用
  validateHierarchyIntegrity() {
    const allIssues = []
    for (const plugin of this.pluginStore.getAllPlugins()) {
      const validation = this._validateEntity(plugin, ['missing_parent', 'circular_reference', 'max_depth_exceeded'])
      if (!validation.isValid) allIssues.push(...validation.issues)
    }
    return { isValid: allIssues.length === 0, issues: allIssues }
  }
  
  // 💰 リソース可用性チェック - Phase S4 Week 3: PluginStore委譲完了
  _checkResourceAvailability(coreId, requiredCost) {
    const currentCost = this.pluginStore.getResourceUsage(coreId)
    const maxCost = 100 // デフォルト最大リソース
    return (currentCost + requiredCost) <= maxCost
  }
  
  // 🏷️ ChatGPT案: UIヘルパー関数 - Phase S4: 三項演算子で簡潔化
  getPluginLabel(plugin) {
    return plugin.displayName || (() => {
      const parts = plugin.pluginId.split('-');
      const typeShort = plugin.type.split('.').pop();
      const randomShort = parts[parts.length - 1].substring(0, 4);
      return `${typeShort}#${randomShort}`;
    })()
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
        break
      }
    }
    
    return ancestors;
  }

  hasValidParent(plugin) { return this.pluginStore.hasValidParent(plugin) }
  _traverseParentChain(startId, maxDepth = 100, visitor = null) {
    const visited = new Set(); let current = startId; let depth = 0
    while (current && depth < maxDepth && !visited.has(current)) {
      if (visitor && visitor(current, depth, visited)) return { stopped: true, current, depth }
      visited.add(current); const plugin = this.getPlugin(current)
      if (!plugin) break; current = plugin.parentId; depth++
    }
    return { stopped: false, current, depth, visited }
  }
  getSiblings(pluginId) {
    const plugin = this.pluginStore.getPlugin(pluginId)
    return plugin ? this.pluginStore.getAllPlugins().filter(p => p.pluginId !== pluginId && p.parentId === plugin.parentId) : []
  }
  isRootPlugin(pluginId) { const plugin = this.getPlugin(pluginId); return plugin ? !plugin.parentId : false }
  getPluginLevel(pluginId) { return this.getAncestors(pluginId).length }
  getPluginTree() {
    const rootPlugins = this.pluginStore.getAllPlugins().filter(p => !p.parentId)
    const buildTree = (plugin) => ({ ...plugin, children: this.pluginStore.getChildren(plugin.pluginId).map(child => buildTree(child)) })
    return rootPlugins.map(root => buildTree(root))
  }
  
  _generateHierarchyStats(allPlugins, rootPlugins) {
    const maxLevel = Math.max(0, ...allPlugins.map(p => this.getPluginLevel(p.pluginId)))
    return {
      rootPlugins: rootPlugins.length, maxHierarchyLevel: maxLevel,
      averageChildren: rootPlugins.length > 0 ? rootPlugins.reduce((sum, p) => sum + this.pluginStore.getChildren(p.pluginId).length, 0) / rootPlugins.length : 0,
      totalHierarchyLevels: maxLevel + 1
    }
  }

  getSystemStats() {
    const pluginStoreStats = this.pluginStore.getStats(); const allPlugins = this.pluginStore.getAllPlugins(); const rootPlugins = allPlugins.filter(p => !p.parentId)
    return {
      ...this.getStats(), ...pluginStoreStats,
      systemPlugins: allPlugins.filter(p => p.type?.startsWith('system')).length,
      dynamicPlugins: allPlugins.filter(p => p.metadata?.correlationId).length,
      hierarchyStats: this._generateHierarchyStats(allPlugins, rootPlugins)
    }
  }

  async clear() {
    // Phase S5: ハイブリッド通信システムから登録解除
    this.messageBus.unregisterCore(this.coreId)
    
    this.pluginStore.clear(); await this.channelManager.clear(); this.messagePool.clear(); this.coreFusion.clear()
    this.log('🧹 VoidCore system cleared')
  }

  // ==========================================
  // Phase S5: SystemBootManager Intent統合
  // ==========================================

  /**
   * 🚀 system.bootPlan.request ハンドラー
   */
  async _handleBootPlanRequest(message) {
    const { correlationId } = message
    
    return await this._executeWithErrorHandling('system.bootPlan.request', correlationId, async () => {
      const result = await this.systemBootManager.handleCustomIntent(message)
      return {
        data: result,
        logMessage: result.success 
          ? `🎯 Boot plan created: ${result.bootPlan?.id} (${result.bootPlan?.sequence?.length} plugins)`
          : `❌ Boot plan creation failed: ${result.error}`
      }
    })
  }

  /**
   * 🚀 system.bootPlan.execute ハンドラー
   */
  async _handleBootPlanExecute(message) {
    const { correlationId } = message
    
    return await this._executeWithErrorHandling('system.bootPlan.execute', correlationId, async () => {
      const result = await this.systemBootManager.handleCustomIntent(message)
      return {
        data: result,
        logMessage: result.success 
          ? `🎉 Boot plan completed: ${result.totalTime}ms, ${result.pluginCount} plugins`
          : `❌ Boot plan execution failed: ${result.error}`
      }
    })
  }

  /**
   * 📊 system.bootPlan.status ハンドラー
   */
  async _handleBootPlanStatus(message) {
    const { correlationId } = message
    
    return await this._executeWithErrorHandling('system.bootPlan.status', correlationId, async () => {
      const result = await this.systemBootManager.handleCustomIntent(message)
      return {
        data: result,
        logMessage: `📊 Boot status retrieved`
      }
    })
  }

  /**
   * 🚨 system.bootError ハンドラー
   */
  async _handleBootError(message) {
    const { correlationId } = message
    
    return await this._executeWithErrorHandling('system.bootError', correlationId, async () => {
      const result = await this.systemBootManager.handleCustomIntent(message)
      return {
        data: result,
        logMessage: `🚨 Boot error handled: ${message.payload?.type}`
      }
    })
  }

  /**
   * 🎯 便利メソッド: 起動計画作成・実行のワンストップ
   */
  async createAndExecuteBootPlan(pluginDependencies) {
    try {
      // 1. 起動計画作成
      const planResult = await this.sendIntent('system.bootPlan.request', {
        pluginDependencies
      })
      
      if (!planResult.success) {
        throw new Error(planResult.error)
      }
      
      // 2. 起動計画実行
      const executeResult = await this.sendIntent('system.bootPlan.execute', 
        planResult.bootPlan
      )
      
      return executeResult
    } catch (error) {
      this.log(`❌ Boot plan creation and execution failed: ${error.message}`)
      throw error
    }
  }

  // ==========================================
  // Phase S5: ハイブリッド通信システム API
  // ==========================================

  /**
   * 🌐 MessageBus経由でのコア間通信
   */
  async broadcastToAllCores(message) {
    return await this.messageBus.broadcast(message, this.coreId)
  }

  async sendToCore(targetCoreId, message) {
    return await this.messageBus.sendToCore(targetCoreId, message, this.coreId)
  }

  /**
   * ⚡ DirectUIChannel経由での高速通信
   */
  async fastUIUpdate(targetCoreId, updateData) {
    return await this.uiChannel.fastUpdate(targetCoreId, updateData)
  }

  /**
   * 📊 ハイブリッド通信システム統計
   */
  getCommunicationStats() {
    return {
      messageBus: this.messageBus.getCommunicationStats(),
      uiChannel: this.uiChannel.getUIStats(),
      registeredCores: this.messageBus.getRegisteredCores(),
      thisCoreId: this.coreId
    }
  }

  /**
   * 🔧 UI高速チャンネル設定
   */
  configureUIChannel(enabled = true, batchInterval = 16) {
    this.uiChannel.configureBatching(enabled, batchInterval)
    this.log(`⚡ UI Channel configured: batching ${enabled ? 'enabled' : 'disabled'} (${batchInterval}ms)`)
  }
}

export { VoidCore }
export const voidCore = new VoidCore(null, { debug: false })