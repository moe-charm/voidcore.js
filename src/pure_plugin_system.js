// pure_plugin_system.js - 純粋メッセージベースプラグインシステム
// セリンの大改革: 基底クラス継承を完全排除！

import { voidCore } from './voidcore.js';
import { Message } from './message.js';

/**
 * 🌟 VoidCore 純粋メッセージベース プラグインシステム
 * 
 * 「すべての存在は、メッセージで生まれ、メッセージで終わる」
 * 
 * ✅ 基底クラス継承 → 完全排除
 * ✅ 強制ライフサイクル → 自由意志
 * ✅ 型による束縛 → メッセージによる協調
 * ✅ 最小コード → 最初から嬉しいコード
 */

// =========================================
// 🤝 紳士協定: ヘルスチェック
// =========================================

/**
 * 紳士協定としてのヘルスチェック応答
 * プラグインは任意でこれに応答できる（強制ではない）
 */
export async function registerHealthCheck(pluginId, customStatus = {}) {
  await voidCore.subscribe('IntentRequest', async (message) => {
    // v14.0 FIX: Filter for health check messages manually
    if (message.action === 'core.health.ping') {
      // 自分宛のヘルスチェックかどうか確認
      if (message.payload.targetPlugin === pluginId || !message.payload.targetPlugin) {
        await voidCore.publish(Message.intentResponse('core.health.ping', {
          pluginId: pluginId,
          status: 'OK',
          timestamp: Date.now(),
          uptime: Date.now() - (customStatus.startTime || Date.now()),
          ...customStatus
        }));
      }
    }
  });
}

// =========================================
// 🧠 プロセス・ライフサイクル宣言システム
// =========================================

/**
 * プロセス情報の自己申告
 * プラグインが任意で自分のPIDを登録できる
 */
export async function declareProcess(pluginId, processInfo = {}) {
  const declaration = {
    pluginId: pluginId,
    pid: (typeof process !== 'undefined' && process.pid) || processInfo.pid || 'browser-tab',
    startTime: Date.now(),
    platform: typeof window !== 'undefined' ? 'browser' : 'node',
    ...processInfo
  };

  // プロセス宣言メッセージを送信
  voidCore.publish(Message.notice('system.process.declared', declaration));

  // 終了要求の監視（紳士協定）
  await voidCore.subscribe('IntentRequest', 'system.process.terminate', async (message) => {
    if (message.payload.targetPluginId === pluginId) {
      const { force = false, reason = 'System request' } = message.payload;
      
      if (force) {
        // 強制終了
        console.log(`🚨 Force termination requested for ${pluginId}: ${reason}`);
        if (typeof process !== 'undefined' && process.exit) {
          process.exit(0);
        } else {
          // ブラウザ環境では警告のみ
          console.warn('🌐 Browser environment: Cannot force exit, plugin should handle shutdown gracefully');
        }
      } else {
        // 優雅な終了要求
        console.log(`📮 Graceful termination requested for ${pluginId}: ${reason}`);
        await voidCore.publish(Message.notice('system.process.terminating', {
          pluginId: pluginId,
          reason: reason,
          timestamp: Date.now()
        }));
        
        // プラグインに終了の機会を与える
        setTimeout(() => {
          if (typeof process !== 'undefined' && process.exit) {
            process.exit(0);
          } else {
            console.log(`👋 ${pluginId} graceful shutdown completed (browser environment)`);
          }
        }, 5000);
      }
    }
  });

  return declaration;
}

// =========================================
// 🎨 「最初から嬉しいコード」デフォルトスケルトン
// =========================================

/**
 * 心地よく動く完全装備のプラグインスケルトン
 * 継承ではなく、コンポジション！
 */
export function createComfortablePlugin(config) {
  const {
    pluginId,
    name = pluginId,
    version = '1.0.0',
    capabilities = [],
    processInfo = {},
    autoHealth = true,
    autoProcess = true
  } = config;

  const plugin = {
    // 基本情報
    pluginId,
    name,
    version,
    startTime: Date.now(),
    
    // 機能リスト
    capabilities: new Set(capabilities),
    
    // メッセージハンドラー
    handlers: new Map(),
    
    // 状態（型強制なし、自由な構造）
    state: {},
    
    // === 🤝 紳士協定 自動セットアップ ===
    
    // ヘルスチェック応答（必要なら残す、いらなければ削除可能）
    setupHealthCheck() {
      if (autoHealth) {
        registerHealthCheck(pluginId, {
          name: name,
          version: version,
          capabilities: Array.from(this.capabilities),
          startTime: this.startTime
        });
        console.log(`💊 Health check enabled for ${pluginId}`);
      }
    },
    
    // プロセス宣言（必要なら残す、いらなければ削除可能）
    setupProcessDeclaration() {
      if (autoProcess) {
        declareProcess(pluginId, {
          name: name,
          version: version,
          ...processInfo
        });
        console.log(`🧠 Process declaration enabled for ${pluginId}`);
      }
    },
    
    // === 📮 メッセージング ===
    
    // メッセージ送信
    async send(message) {
      return await voidCore.publish(message);
    },
    
    // 便利なメッセージ送信メソッド
    async notice(eventName, payload = {}) {
      return await this.send(Message.notice(eventName, { ...payload, from: pluginId }));
    },
    
    async request(eventName, payload = {}) {
      return await this.send(Message.intentRequest(eventName, { ...payload, from: pluginId }));
    },
    
    async propose(eventName, payload = {}) {
      return await this.send(Message.proposal(eventName, { ...payload, from: pluginId }));
    },
    
    // メッセージハンドラー登録
    async on(messageType, eventName, handler) {
      const key = `${messageType}:${eventName}`;
      this.handlers.set(key, handler);
      
      console.log(`🔧 Setting up subscription: pluginId=${this.pluginId}, messageType=${messageType}, eventName=${eventName}`);
      
      // VoidCoreは (type, handler) の2引数
      await voidCore.subscribe(messageType, async (message) => {
        console.log(`🔍 ${this.pluginId} received message:`, messageType, message);
        try {
          // メッセージタイプに応じたフィルタリング
          let shouldHandle = false;
          let eventIdentifier = 'no-event';
          
          if (eventName === '*') {
            shouldHandle = true;
            eventIdentifier = message.event_name || message.action || 'unknown';
          } else {
            // IntentRequest: action でフィルタ
            if (messageType === 'IntentRequest' && message.action === eventName) {
              shouldHandle = true;
              eventIdentifier = message.action;
            }
            // Notice: event_name でフィルタ
            else if (messageType === 'Notice' && message.event_name === eventName) {
              shouldHandle = true;
              eventIdentifier = message.event_name;
            }
          }
          
          console.log(`🔍 ${this.pluginId} filter check: shouldHandle=${shouldHandle}, eventName=${eventName}, message.action=${message.action}, message.event_name=${message.event_name}`);
          
          if (shouldHandle) {
            console.log(`🎯 ${this.pluginId} handling ${messageType}:${eventIdentifier}`);
            await handler(message, this);
          }
        } catch (error) {
          console.error(`❌ Handler error in ${this.pluginId}:`, error);
        }
      });
      
      console.log(`📥 ${this.pluginId} subscribed to ${messageType}:${eventName}`);
    },
    
    // === 🚀 ライフサイクル（任意、メッセージベース） ===
    
    // 初期化（任意）
    async initialize() {
      console.log(`🚀 Initializing ${pluginId}...`);
      
      // 自動セットアップ
      this.setupHealthCheck();
      this.setupProcessDeclaration();
      
      // 初期化完了通知
      await this.notice('plugin.initialized', {
        capabilities: Array.from(this.capabilities),
        timestamp: Date.now()
      });
      
      console.log(`✅ ${pluginId} initialized successfully!`);
    },
    
    // 終了（任意）
    async shutdown(reason = 'Natural shutdown') {
      console.log(`🌅 Shutting down ${pluginId}: ${reason}`);
      
      await this.notice('plugin.shutdown', {
        reason: reason,
        uptime: Date.now() - this.startTime,
        timestamp: Date.now()
      });
      
      console.log(`👋 ${pluginId} shutdown complete!`);
    },
    
    // === 🎯 ユーティリティ ===
    
    // ログ（シンプル）
    log(message, level = 'info') {
      const timestamp = new Date().toLocaleTimeString();
      const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '📝';
      console.log(`[${timestamp}] ${prefix} ${pluginId}: ${message}`);
    },
    
    // スリープ
    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  };

  return plugin;
}

// =========================================
// 🎪 プラグインファクトリー
// =========================================

/**
 * 即座に使える快適プラグインを作成
 */
export function createPlugin(config, customLogic = {}) {
  const plugin = createComfortablePlugin(config);
  
  // カスタムロジックをマージ
  Object.assign(plugin, customLogic);
  
  return plugin;
}

/**
 * 従来のAutonomousPluginスタイルのラッパー（移行用）
 */
export function createLegacyCompatiblePlugin(config) {
  const plugin = createComfortablePlugin(config);
  
  // 従来のメソッド名をエイリアス
  plugin.publish = plugin.send;
  plugin.subscribe = plugin.on;
  
  return plugin;
}

// =========================================
// 🚀 Phase 5.2: Dynamic Plugin Management
// =========================================

/**
 * 動的プラグイン生成ヘルパー
 * system.createPluginを簡単に使用できるAPI
 */
export async function spawnPlugin(parentPlugin, type, config = {}, options = {}) {
  const correlationId = `spawn-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
  
  const payload = {
    type,
    config,
    parent: parentPlugin.pluginId,
    correlationId,
    maxDepth: options.maxDepth || 10,
    resourceCost: options.resourceCost || 1
  }
  
  // IntentRequest送信
  await parentPlugin.sendIntent('system.createPlugin', payload)
  
  // レスポンス待機（非同期）
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error('Spawn timeout'))
    }, options.timeout || 5000)
    
    const responseHandler = (message) => {
      if (message.correlationId === correlationId && message.action === 'system.createPlugin') {
        cleanup()
        if (message.payload.success) {
          resolve({
            success: true,
            pluginId: message.payload.pluginId,
            type: message.payload.type,
            correlationId
          })
        } else {
          reject(new Error(message.payload.error))
        }
      }
    }
    
    const cleanup = () => {
      clearTimeout(timeout)
      voidCore.unsubscribe('IntentResponse', responseHandler)
    }
    
    await voidCore.subscribe('IntentResponse', responseHandler)
  })
}

/**
 * 動的プラグイン削除ヘルパー
 */
export async function destroyPlugin(parentPlugin, targetPluginId, options = {}) {
  const correlationId = `destroy-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
  
  const payload = {
    pluginId: targetPluginId,
    correlationId
  }
  
  await parentPlugin.sendIntent('system.destroyPlugin', payload)
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error('Destroy timeout'))
    }, options.timeout || 5000)
    
    const responseHandler = (message) => {
      if (message.correlationId === correlationId && message.action === 'system.destroyPlugin') {
        cleanup()
        if (message.payload.success) {
          resolve({
            success: true,
            pluginId: targetPluginId,
            correlationId
          })
        } else {
          reject(new Error(message.payload.error))
        }
      }
    }
    
    const cleanup = () => {
      clearTimeout(timeout)
      voidCore.unsubscribe('IntentResponse', responseHandler)
    }
    
    await voidCore.subscribe('IntentResponse', responseHandler)
  })
}

/**
 * 動的接続ヘルパー
 */
export async function connectPlugins(parentPlugin, source, target, options = {}) {
  const correlationId = `connect-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
  
  const payload = {
    source,
    target,
    sourcePort: options.sourcePort || 'output',
    targetPort: options.targetPort || 'input',
    correlationId
  }
  
  await parentPlugin.sendIntent('system.connect', payload)
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error('Connect timeout'))
    }, options.timeout || 5000)
    
    const responseHandler = (message) => {
      if (message.correlationId === correlationId && message.action === 'system.connect') {
        cleanup()
        if (message.payload.success) {
          resolve({
            success: true,
            source,
            target,
            correlationId
          })
        } else {
          reject(new Error(message.payload.error))
        }
      }
    }
    
    const cleanup = () => {
      clearTimeout(timeout)
      voidCore.unsubscribe('IntentResponse', responseHandler)
    }
    
    await voidCore.subscribe('IntentResponse', responseHandler)
  })
}

/**
 * Correlation ID生成ヘルパー
 */
export function generateCorrelationId(prefix = 'corr') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`
}

/**
 * システム統計情報取得ヘルパー
 */
export function getSystemStats() {
  return voidCore.getSystemStats()
}

// =========================================
// 🌟 エクスポート
// =========================================

export {
  voidCore,
  Message
};