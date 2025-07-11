// plugin-flow-executor.js - VoidCoreプラグインフロー実行制御

import { IPlugin } from '/src/interfaces/plugin-interface.js'
import { Message } from '/src/messaging/message.js'

/**
 * 🚀 PluginFlowExecutor - VoidCoreプラグイン実行順序・フロー制御
 * 
 * 機能:
 * - プラグインの実行順序管理
 * - 非同期フロー制御
 * - エラーハンドリング
 * - 実行統計・監視
 */
export class PluginFlowExecutor extends IPlugin {
  constructor() {
    super({
      id: 'VoidCore.FlowExecutor',
      type: 'system.executor',
      displayName: 'Plugin Flow Executor',
      isCore: true
    })
    
    // 実行管理
    this.activeFlows = new Map() // flowId → flow info
    this.executionQueue = []
    this.isExecuting = false
    this.maxConcurrentFlows = 5
    
    // 統計
    this.executionStats = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0
    }
    
    // プラグイン参照
    this.connectionManager = null
    this.voidCoreUI = null
    
    this.log('🚀 PluginFlowExecutor initialized')
  }

  /**
   * 🎯 初期化
   */
  async onActivated() {
    // 他のプラグインへの参照取得
    if (this.voidCore) {
      this.connectionManager = this.voidCore.getPlugin('VoidCore.ConnectionManager')
      this.voidCoreUI = this.voidCore
    }
    
    // グローバル参照もチェック
    if (!this.connectionManager && window.connectionManager) {
      this.connectionManager = window.connectionManager
      this.log('🔗 ConnectionManager found via global reference')
    }
    
    this.log('🚀 Flow executor activated')
    this.log(`🔗 ConnectionManager available: ${!!this.connectionManager}`)
  }

  /**
   * 💌 メッセージハンドラー
   */
  async handleMessage(message) {
    switch (message.event_name) {
      case 'voidcore.execute.plugin':
        await this.executePlugin(message.payload)
        break
        
      case 'voidcore.execute.flow':
        await this.executeFlow(message.payload)
        break
        
      case 'voidcore.dataflow':
        await this.handleDataFlow(message.payload)
        break
        
      default:
        this.log(`⚠️ Unknown message: ${message.event_name}`)
    }
  }

  /**
   * 🎯 単一プラグイン実行
   */
  async executePlugin(payload) {
    const { pluginId, input = {}, options = {} } = payload
    
    try {
      this.log(`🎯 executePlugin START: ${pluginId}`)
      const startTime = Date.now()
      this.log(`🎯 Executing plugin: ${pluginId}`)
      
      // プラグイン取得
      this.log(`🔍 Looking for plugin: ${pluginId}`)
      const plugin = this.getPluginById(pluginId)
      this.log(`🔍 Plugin found: ${!!plugin}`)
      if (!plugin) {
        throw new Error(`Plugin not found: ${pluginId}`)
      }
      
      // 実行前チェック
      this.log(`🔍 Checking shouldAutoExecute: ${!!plugin.shouldAutoExecute}`)
      this.log(`🔍 Payload for shouldAutoExecute:`, payload)
      if (plugin.shouldAutoExecute && !plugin.shouldAutoExecute(payload)) {
        this.log(`⏸️ Plugin execution skipped: ${pluginId}`)
        this.log(`⏸️ shouldAutoExecute returned false for payload:`, payload)
        return
      }
      this.log(`✅ Pre-execution checks passed: ${pluginId}`)
      
      // プラグイン実行
      this.log(`🔧 executePluginSafely 呼び出し開始: ${pluginId}`)
      const result = await this.executePluginSafely(plugin, input, options)
      this.log(`🔧 executePluginSafely 完了: ${pluginId}, result:`, result)
      
      // 実行時間計算
      const executionTime = Date.now() - startTime
      this.updateExecutionStats(true, executionTime)
      this.log(`🔧 実行統計更新完了: ${pluginId}`)
      
      // データフロー処理（他のプラグインに結果を送信）
      if (result && this.connectionManager) {
        this.log(`📊 Starting data flow from: ${pluginId}`)
        this.log(`📊 Result to send:`, result)
        this.log(`📊 ConnectionManager type: ${this.connectionManager.constructor.name}`)
        await this.connectionManager.executeDataFlow(pluginId, result)
        this.log(`📊 Data flow execution completed for: ${pluginId}`)
      } else {
        this.log(`⚠️ No data flow: result=${!!result}, connectionManager=${!!this.connectionManager}`)
        if (!result) this.log(`⚠️ No result from plugin execution`)
        if (!this.connectionManager) this.log(`⚠️ ConnectionManager not available`)
      }
      
      // UI更新通知
      await this.notifyUIUpdate(pluginId, result, 'success')
      
      this.log(`✅ Plugin execution completed: ${pluginId} (${executionTime}ms)`)
      
      return result
      
    } catch (error) {
      this.updateExecutionStats(false, 0)
      await this.notifyUIUpdate(pluginId, null, 'error', error.message)
      
      this.log(`❌ Plugin execution failed: ${pluginId} - ${error.message}`)
      this.log(`❌ ERROR STACK: ${error.stack}`)
      console.error(`🔴 FlowExecutor ERROR:`, error)
      
      // エラーを投げずに undefined を返す（デバッグ用）
      return undefined
    }
  }

  /**
   * 🌊 フロー実行（複数プラグイン）
   */
  async executeFlow(payload) {
    const { flowId, startPluginIds = [], data = {} } = payload
    
    if (startPluginIds.length === 0) {
      throw new Error('No start plugins specified')
    }
    
    try {
      this.log(`🌊 Starting flow execution: ${flowId}`)
      
      // フロー記録作成
      const flow = {
        id: flowId,
        startTime: Date.now(),
        status: 'running',
        executedPlugins: new Set(),
        results: new Map(),
        errors: []
      }
      
      this.activeFlows.set(flowId, flow)
      
      // 開始プラグインを並列実行
      const startPromises = startPluginIds.map(pluginId => 
        this.executePlugin({ pluginId, input: data, options: { flowId } })
      )
      
      const startResults = await Promise.allSettled(startPromises)
      
      // 結果処理
      startResults.forEach((result, index) => {
        const pluginId = startPluginIds[index]
        flow.executedPlugins.add(pluginId)
        
        if (result.status === 'fulfilled') {
          flow.results.set(pluginId, result.value)
        } else {
          flow.errors.push({
            pluginId: pluginId,
            error: result.reason.message
          })
        }
      })
      
      // フロー完了
      flow.endTime = Date.now()
      flow.status = flow.errors.length === 0 ? 'completed' : 'partial'
      flow.executionTime = flow.endTime - flow.startTime
      
      this.log(`🌊 Flow execution completed: ${flowId} (${flow.executionTime}ms)`)
      
      return {
        flowId: flowId,
        status: flow.status,
        executedPlugins: Array.from(flow.executedPlugins),
        results: Object.fromEntries(flow.results),
        errors: flow.errors,
        executionTime: flow.executionTime
      }
      
    } catch (error) {
      this.log(`❌ Flow execution failed: ${flowId} - ${error.message}`)
      throw error
    }
  }

  /**
   * 📊 データフロー処理
   */
  async handleDataFlow(payload) {
    const { targetPluginId, data, sourcePluginId } = payload
    
    try {
      // ターゲットプラグインに自動実行
      await this.executePlugin({
        pluginId: targetPluginId,
        input: data,
        autoExecution: true,  // shouldAutoExecute で参照できるように移動
        triggerType: 'dataflow',  // 追加の判定条件
        options: {
          sourcePluginId: sourcePluginId,
          autoExecution: true
        }
      })
      
    } catch (error) {
      this.log(`❌ Data flow execution failed: ${sourcePluginId} → ${targetPluginId}`)
    }
  }

  /**
   * 🛡️ 安全なプラグイン実行
   */
  async executePluginSafely(plugin, input, options) {
    try {
      this.log(`🛡️ Safe execution start: ${plugin.id}`)
      
      // タイムアウト付き実行
      const timeout = options.timeout || 30000 // 30秒
      
      const executionPromise = plugin.executeNode ? 
        plugin.executeNode(input, options) : 
        plugin.execute ? plugin.execute(input, options) : 
        null
        
      this.log(`🛡️ Execution method found: ${!!executionPromise} (executeNode: ${!!plugin.executeNode}, execute: ${!!plugin.execute})`)
        
      if (!executionPromise) {
        throw new Error('Plugin has no execute method')
      }
      
      // タイムアウト制御
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Plugin execution timeout')), timeout)
      })
      
      this.log(`🛡️ Starting Promise.race execution`)
      const result = await Promise.race([executionPromise, timeoutPromise])
      this.log(`🛡️ Promise.race completed, result:`, result)
      
      return result
      
    } catch (error) {
      this.log(`🛡️ Safe execution failed: ${plugin.id} - ${error.message}`)
      throw error
    }
  }

  /**
   * 🔍 プラグイン取得
   */
  getPluginById(pluginId) {
    if (this.voidCore && this.voidCore.getPlugin) {
      return this.voidCore.getPlugin(pluginId)
    }
    
    // フォールバック: DOM要素から探す
    const element = document.querySelector(`[data-plugin-id="${pluginId}"]`)
    if (element && element._voidCorePlugin) {
      return element._voidCorePlugin
    }
    
    return null
  }

  /**
   * 📊 実行統計更新
   */
  updateExecutionStats(success, executionTime) {
    this.executionStats.totalExecutions++
    
    if (success) {
      this.executionStats.successfulExecutions++
      
      // 平均実行時間更新
      const currentAvg = this.executionStats.averageExecutionTime
      const successCount = this.executionStats.successfulExecutions
      this.executionStats.averageExecutionTime = 
        (currentAvg * (successCount - 1) + executionTime) / successCount
        
    } else {
      this.executionStats.failedExecutions++
    }
  }

  /**
   * 🎨 UI更新通知
   */
  async notifyUIUpdate(pluginId, result, status, errorMessage = null) {
    const updateMessage = Message.notice('charmflow.ui.update', {
      pluginId: pluginId,
      status: status,
      result: result,
      error: errorMessage,
      timestamp: Date.now()
    })
    
    if (this.voidCoreUI) {
      await this.voidCoreUI.publish(updateMessage)
    }
    
    // DOM要素への直接更新
    this.updatePluginElementUI(pluginId, status, result, errorMessage)
  }

  /**
   * 🎨 プラグイン要素UI更新
   */
  updatePluginElementUI(pluginId, status, result, errorMessage) {
    const element = document.querySelector(`[data-plugin-id="${pluginId}"]`) ||
                   document.getElementById(`voidflow-node-${pluginId}`)
    
    if (!element) return
    
    // 状態クラス更新
    element.classList.remove('executing', 'success', 'error', 'waiting')
    element.classList.add(status === 'success' ? 'success' : status === 'error' ? 'error' : 'waiting')
    
    // 出力表示更新
    const outputElement = element.querySelector('.node-output') || 
                         element.querySelector(`#node-output-${pluginId}`)
    
    if (outputElement) {
      if (status === 'success' && result) {
        if (typeof result === 'object' && result.value) {
          outputElement.textContent = `✅ ${result.value}`
        } else if (typeof result === 'string') {
          outputElement.textContent = `✅ ${result}`
        } else {
          outputElement.textContent = '✅ 実行完了'
        }
      } else if (status === 'error') {
        outputElement.textContent = `❌ ${errorMessage || 'エラー'}`
      } else {
        outputElement.textContent = '⏳ 実行中...'
      }
    }
  }

  /**
   * 🔍 VoidFlow互換実行
   */
  async executeVoidFlowNode(nodeId, voidFlowEngine) {
    try {
      this.log(`🔄 VoidFlow node execution: ${nodeId}`)
      
      // VoidFlowEngineからノード取得
      const node = voidFlowEngine.nodes?.get(nodeId)
      if (!node) {
        throw new Error(`VoidFlow node not found: ${nodeId}`)
      }
      
      // ExecuteEngineで実行
      if (voidFlowEngine.executeEngine) {
        const result = await voidFlowEngine.executeEngine.executeNode(nodeId)
        this.log(`✅ VoidFlow node executed: ${nodeId}`)
        return result
      } else {
        throw new Error('VoidFlow ExecuteEngine not available')
      }
      
    } catch (error) {
      this.log(`❌ VoidFlow node execution failed: ${nodeId} - ${error.message}`)
      throw error
    }
  }

  /**
   * 📊 統計情報取得
   */
  getExecutionStats() {
    return {
      ...this.executionStats,
      activeFlows: this.activeFlows.size,
      successRate: this.executionStats.totalExecutions > 0 ? 
        (this.executionStats.successfulExecutions / this.executionStats.totalExecutions) * 100 : 0
    }
  }

  /**
   * 🧪 デバッグ情報
   */
  getDebugInfo() {
    return {
      stats: this.getExecutionStats(),
      activeFlows: Array.from(this.activeFlows.entries()),
      executionQueue: this.executionQueue
    }
  }
}

export default PluginFlowExecutor