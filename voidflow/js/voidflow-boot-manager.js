// voidflow-boot-manager.js - VoidFlow専用起動管理プラグイン
// VoidFlowのコンポーネント起動を管理する自己完結型プラグイン

import { IPlugin } from '../../src/interfaces/plugin-interface.js'
import { Message } from '../../src/messaging/message.js'

/**
 * 🚀 VoidFlowBootManager - VoidFlow専用起動管理プラグイン
 * 
 * 設計原則（にゃー仕様準拠）:
 * - VoidFlow専用の起動管理に特化
 * - Intent経由でコンポーネント間を調整
 * - ステータス監視による非同期連携
 * - 将来の共通化に備えた設計
 */
export class VoidFlowBootManager extends IPlugin {
  constructor() {
    super({
      id: 'VoidFlow.BootManager',
      type: 'voidflow.boot',
      displayName: 'VoidFlow Boot Manager',
      isCore: true
    })
    
    this.componentStatuses = new Map() // componentId → status
    this.readyWaitPromises = new Map() // componentId → Promise
    this.bootHistory = []
  }

  /**
   * プラグイン初期化時の処理
   */
  async onLoad() {
    this.log('🚀 VoidFlowBootManager loaded')
    
    // VoidFlow起動フェーズ開始を通知
    await this.sendIntent('voidflow.boot.phaseStart', { 
      phase: 'init',
      timestamp: Date.now()
    })
    
    // ステータス監視を開始
    this.startStatusMonitoring()
    
    // VoidFlowコンポーネントの準備完了を確認
    this.checkVoidFlowComponentsReady().then(() => {
      this.sendIntent('voidflow.boot.ready', { 
        ok: true,
        timestamp: Date.now()
      })
    })
  }

  /**
   * メッセージハンドラー
   */
  async handleMessage(message) {
    const { type, payload } = message
    
    switch (type) {
      case 'voidflow.component.status':
        return await this.handleComponentStatusChange(payload)
      case 'voidflow.boot.checkReady':
        return await this.checkVoidFlowComponentsReady()
      default:
        return await super.handleMessage(message)
    }
  }

  /**
   * 🎯 VoidFlow専用カスタムIntent処理
   * 新VoidCore Intent処理システム対応
   */
  async handleCustomIntent(message) {
    const { intent, payload } = message
    
    switch (intent) {
      case 'voidflow.boot.start':
        return await this.handleVoidFlowBootStart(payload)
      case 'voidflow.boot.status':
        return await this.getVoidFlowBootStatus()
      case 'voidflow.component.initialize':
        return await this.initializeVoidFlowComponent(payload)
      case 'voidflow.visual.initialize':
        return await this.initializeVisualCore(payload)
      case 'voidflow.editor.initialize':
        return await this.initializeNodeEditor(payload)
      case 'voidflow.engine.initialize':
        return await this.initializeExecuteEngine(payload)
      default:
        return await super.handleCustomIntent(message)
    }
  }

  /**
   * 🚀 VoidFlow専用起動開始Intent処理
   */
  async handleVoidFlowBootStart(payload) {
    this.log('🚀 VoidFlow boot start Intent received')
    
    try {
      await this.initializeVoidFlow(payload.config || {})
      
      return {
        success: true,
        message: 'VoidFlow boot sequence completed',
        timestamp: Date.now(),
        components: this.requiredComponents
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: Date.now()
      }
    }
  }

  /**
   * 📊 VoidFlow起動状況取得
   */
  async getVoidFlowBootStatus() {
    return {
      success: true,
      status: this.bootStatus,
      components: this.componentStatus,
      bootDuration: this.bootTimestamp ? Date.now() - this.bootTimestamp : null
    }
  }

  /**
   * カスタムIntentハンドラー
   */
  async handleCustomIntent(message) {
    const { intent, payload } = message
    
    switch (intent) {
      case 'voidflow.component.waitReady':
        return await this.waitForComponentReady(payload.componentId, payload.timeout)
      case 'voidflow.boot.status':
        return await this.getBootStatus()
      case 'voidflow.boot.initialize':
        return await this.initializeVoidFlow(payload)
      default:
        return await super.handleCustomIntent(message)
    }
  }

  /**
   * 🎯 VoidFlowコンポーネント準備確認
   */
  async checkVoidFlowComponentsReady() {
    // VoidFlowの必須コンポーネント
    const requiredComponents = [
      'FlowVisualCore',      // 描画専用コア
      'FlowNodeEditor',      // ノードエディター
      'FlowExecuteEngine',   // 実行エンジン
      'PluginStatusWatcher'  // ステータス監視
    ]
    
    this.log('🔍 Checking VoidFlow components...')
    
    try {
      // 全コンポーネントのready待機
      const readyPromises = requiredComponents.map(id => 
        this.waitForComponentReady(id, 30000)
      )
      
      const results = await Promise.allSettled(readyPromises)
      
      // 失敗したコンポーネントを確認
      const failures = results
        .map((result, index) => ({ result, component: requiredComponents[index] }))
        .filter(({ result }) => result.status === 'rejected')
      
      if (failures.length > 0) {
        const failedComponents = failures.map(f => f.component).join(', ')
        this.log(`❌ VoidFlow components failed: ${failedComponents}`)
        
        await this.sendIntent('voidflow.boot.failed', {
          failedComponents: failures.map(f => ({
            component: f.component,
            error: f.result.reason?.message || 'Unknown error'
          }))
        })
        
        return false
      }
      
      this.log('✅ All VoidFlow components ready!')
      
      // 起動成功を記録
      this.bootHistory.push({
        timestamp: Date.now(),
        success: true,
        components: requiredComponents
      })
      
      return true
      
    } catch (error) {
      this.log(`❌ VoidFlow boot check failed: ${error.message}`)
      return false
    }
  }

  /**
   * 🚀 VoidFlow初期化
   */
  async initializeVoidFlow(config = {}) {
    this.log('🎯 Initializing VoidFlow...')
    
    try {
      // FlowVisualCore初期化
      await this.sendIntent('voidflow.visual.initialize', {
        canvasId: config.canvasId || 'voidflow-canvas',
        theme: config.theme || 'dark'
      })
      
      // FlowNodeEditor初期化
      await this.sendIntent('voidflow.editor.initialize', {
        editorId: config.editorId || 'node-editor',
        language: 'javascript'
      })
      
      // FlowExecuteEngine初期化
      await this.sendIntent('voidflow.engine.initialize', {
        mode: config.mode || 'development',
        debugEnabled: config.debug !== false
      })
      
      // 初期化完了を通知
      await this.sendIntent('voidflow.initialized', {
        timestamp: Date.now(),
        config
      })
      
      this.log('✅ VoidFlow initialization complete!')
      return { success: true }
      
    } catch (error) {
      this.log(`❌ VoidFlow initialization failed: ${error.message}`)
      
      await this.sendIntent('voidflow.initialization.failed', {
        error: error.message,
        timestamp: Date.now()
      })
      
      return { success: false, error: error.message }
    }
  }

  /**
   * ⏳ コンポーネントReady待機
   */
  async waitForComponentReady(componentId, timeout = 30000) {
    // 既にReady待機中ならそのPromiseを返す
    if (this.readyWaitPromises.has(componentId)) {
      return this.readyWaitPromises.get(componentId)
    }
    
    // 新規Promise作成
    const waitPromise = new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.readyWaitPromises.delete(componentId)
        reject(new Error(`Component ${componentId} timeout after ${timeout}ms`))
      }, timeout)
      
      // ステータス監視関数
      const checkStatus = () => {
        const status = this.componentStatuses.get(componentId)
        if (status === 'ready') {
          clearTimeout(timeoutId)
          this.readyWaitPromises.delete(componentId)
          resolve(true)
          return true
        }
        return false
      }
      
      // 即座にチェック
      if (checkStatus()) return
      
      // 定期的にチェック（100ms間隔）
      const intervalId = setInterval(() => {
        if (checkStatus()) {
          clearInterval(intervalId)
        }
      }, 100)
    })
    
    this.readyWaitPromises.set(componentId, waitPromise)
    return waitPromise
  }

  /**
   * 📊 コンポーネントステータス変更処理
   */
  async handleComponentStatusChange(payload) {
    const { componentId, status, timestamp } = payload
    
    this.componentStatuses.set(componentId, status)
    
    // ステータス変更を記録
    this.log(`📊 Component status: ${componentId} → ${status}`)
    
    // 重要なステータス変更を通知
    if (status === 'ready' || status === 'failed') {
      await this.sendIntent('voidflow.component.statusChanged', {
        componentId,
        status,
        timestamp
      })
    }
  }

  /**
   * 👀 ステータス監視開始
   */
  startStatusMonitoring() {
    // コンポーネントステータス変更を購読
    this.subscribe('voidflow.component.status', (message) => {
      this.handleComponentStatusChange(message.payload)
    })
    
    // FlowVisualCoreからの描画準備完了通知
    this.subscribe('voidflow.visual.ready', () => {
      this.componentStatuses.set('FlowVisualCore', 'ready')
    })
    
    // FlowNodeEditorからの準備完了通知
    this.subscribe('voidflow.editor.ready', () => {
      this.componentStatuses.set('FlowNodeEditor', 'ready')
    })
    
    // FlowExecuteEngineからの準備完了通知
    this.subscribe('voidflow.engine.ready', () => {
      this.componentStatuses.set('FlowExecuteEngine', 'ready')
    })
  }

  /**
   * 📋 起動状況取得
   */
  async getBootStatus() {
    const components = [
      'FlowVisualCore',
      'FlowNodeEditor', 
      'FlowExecuteEngine',
      'PluginStatusWatcher'
    ]
    
    const statuses = {}
    components.forEach(id => {
      statuses[id] = this.componentStatuses.get(id) || 'unknown'
    })
    
    return {
      componentStatuses: statuses,
      bootHistory: this.bootHistory.slice(-5),
      isReady: Object.values(statuses).every(s => s === 'ready')
    }
  }
}

export default VoidFlowBootManager