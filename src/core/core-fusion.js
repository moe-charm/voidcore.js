// core-fusion.js - 複数コア統合システム v1.2
// CoreFusion v1.2 - 複数のVoidCoreインスタンスを1つに統合する革命的システム

import { Message } from '../messaging/message.js';
import { SimpleMessagePool } from '../messaging/simple-message-pool.js';

/**
 * 🧩 CoreFusion v1.2 - 複数コア統合システム
 * 
 * コンセプト: 複数のVoidCoreインスタンスを1つに統合する革命的システム
 * 
 * 統合処理内容:
 * 1. ChannelManager統合 - 掲示板（購読者・メッセージキュー）合成
 * 2. プラグイン移動 - インスタンス・状態・購読情報移転
 * 3. 通知送信 - core.lifecycle.fused/migrated 通知
 * 4. ソース破棄 - 元コアのクリーンアップ
 */

export class CoreFusion {
  constructor() {
    this.fusionHistory = [];
    this.messagePool = new SimpleMessagePool();
  }

  /**
   * 🔄 コア統合の実行
   * @param {VoidCore} sourceCore - 統合元コア
   * @param {VoidCore} targetCore - 統合先コア
   * @param {Object} config - 統合設定
   * @returns {Promise<Object>} - 統合結果
   */
  async fuseWith(sourceCore, targetCore, config = {}) {
    const startTime = Date.now();
    
    try {
      // 1. 互換性チェック
      if (!this.canFuseWith(sourceCore, targetCore)) {
        throw new Error('Incompatible cores: Cannot fuse cores with different versions or incompatible transports');
      }

      // 2. 統合前情報の保存
      const sourceInfo = this.captureSourceInfo(sourceCore);
      
      // 3. ChannelManager統合
      await this.mergeChannelManagers(sourceCore, targetCore);
      
      // 4. プラグイン移動
      const movedPlugins = await this.movePluginsTo(sourceCore, targetCore);
      
      // 5. 通知送信（並列化最適化）
      await this.sendFusionNotifications(sourceCore, targetCore, movedPlugins);
      
      // 6. ソース破棄
      await this.destroySourceCore(sourceCore);
      
      // 7. 統合履歴記録
      const fusionRecord = {
        timestamp: Date.now(),
        sourceId: sourceInfo.coreId,
        targetId: targetCore.coreId || 'default',
        pluginsMoved: movedPlugins.length,
        processingTime: Date.now() - startTime
      };
      
      this.fusionHistory.push(fusionRecord);
      
      return {
        success: true,
        pluginsMoved: movedPlugins.length,
        processingTime: fusionRecord.processingTime,
        fusionId: fusionRecord.timestamp
      };
      
    } catch (error) {
      console.error('❌ CoreFusion error:', error);
      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * 🔍 互換性チェック
   * @param {VoidCore} sourceCore - 統合元コア
   * @param {VoidCore} targetCore - 統合先コア
   * @returns {boolean} - 互換性があるかどうか
   */
  canFuseWith(sourceCore, targetCore) {
    // 基本的な存在チェック
    if (!sourceCore || !targetCore) {
      return false;
    }
    
    // 同じインスタンスでないことを確認
    if (sourceCore === targetCore) {
      return false;
    }
    
    // ChannelManagerの存在チェック
    if (!sourceCore.channelManager || !targetCore.channelManager) {
      return false;
    }
    
    // Transport互換性チェック（基本的な型チェック）
    const sourceTransport = sourceCore.channelManager.transport;
    const targetTransport = targetCore.channelManager.transport;
    
    if (sourceTransport && targetTransport) {
      // 両方にTransportがある場合、同じ型であることを確認
      return sourceTransport.constructor.name === targetTransport.constructor.name;
    }
    
    return true;
  }

  /**
   * 📸 統合元情報の取得
   * @param {VoidCore} sourceCore - 統合元コア
   * @returns {Object} - 統合元情報
   */
  captureSourceInfo(sourceCore) {
    return {
      coreId: sourceCore.coreId || `core-${Date.now()}`,
      pluginCount: sourceCore.plugins ? sourceCore.plugins.length : 0,
      subscriberCount: sourceCore.subscribers ? sourceCore.subscribers.size : 0,
      stats: sourceCore.getStats ? sourceCore.getStats() : {}
    };
  }

  /**
   * 🔄 ChannelManager統合
   * @param {VoidCore} sourceCore - 統合元コア
   * @param {VoidCore} targetCore - 統合先コア
   */
  async mergeChannelManagers(sourceCore, targetCore) {
    if (!sourceCore.channelManager.merge) {
      // 基本的なマージ処理
      await this.basicChannelManagerMerge(sourceCore, targetCore);
    } else {
      // 高度なマージ処理
      await targetCore.channelManager.merge(sourceCore.channelManager);
    }
  }

  /**
   * 🔄 基本的なChannelManagerマージ
   * @param {VoidCore} sourceCore - 統合元コア
   * @param {VoidCore} targetCore - 統合先コア
   */
  async basicChannelManagerMerge(sourceCore, targetCore) {
    // 購読者情報の移転
    if (sourceCore.subscribers) {
      for (const [type, handlers] of sourceCore.subscribers) {
        if (!targetCore.subscribers.has(type)) {
          targetCore.subscribers.set(type, new Set());
        }
        for (const handler of handlers) {
          targetCore.subscribers.get(type).add(handler);
          // ChannelManagerにも登録
          targetCore.channelManager.subscribe(type, handler);
        }
      }
    }
  }

  /**
   * 🚚 プラグイン移動
   * @param {VoidCore} sourceCore - 統合元コア
   * @param {VoidCore} targetCore - 統合先コア
   * @returns {Array} - 移動したプラグイン情報
   */
  async movePluginsTo(sourceCore, targetCore) {
    const movedPlugins = [];
    
    if (!sourceCore.plugins || !Array.isArray(sourceCore.plugins)) {
      return movedPlugins;
    }
    
    for (const plugin of sourceCore.plugins) {
      try {
        // 状態保存
        const state = await this.getPluginState(plugin);
        
        // ターゲットに移動
        if (!targetCore.plugins) {
          targetCore.plugins = [];
        }
        targetCore.plugins.push(plugin);
        
        // 状態復元
        await this.setPluginState(plugin, state);
        
        // 購読情報移転
        if (plugin.core) {
          plugin.core = targetCore;
        }
        
        movedPlugins.push({
          pluginId: plugin.pluginId || plugin.id || 'unknown',
          name: plugin.name || 'Unknown Plugin',
          state: state
        });
        
      } catch (error) {
        console.error(`❌ Plugin move error for ${plugin.pluginId}:`, error);
      }
    }
    
    // 元コアのプラグインリストをクリア
    sourceCore.plugins = [];
    
    return movedPlugins;
  }

  /**
   * 💾 プラグイン状態取得
   * @param {Object} plugin - プラグインオブジェクト
   * @returns {Promise<Object>} - プラグイン状態
   */
  async getPluginState(plugin) {
    if (typeof plugin.getState === 'function') {
      return await plugin.getState();
    }
    
    // デフォルト状態
    return {
      pluginId: plugin.pluginId || plugin.id,
      startTime: plugin.startTime || Date.now(),
      state: plugin.state || {}
    };
  }

  /**
   * 📝 プラグイン状態設定
   * @param {Object} plugin - プラグインオブジェクト
   * @param {Object} state - 設定する状態
   */
  async setPluginState(plugin, state) {
    if (typeof plugin.setState === 'function') {
      await plugin.setState(state);
    } else {
      // デフォルト状態設定
      if (state.state) {
        plugin.state = { ...plugin.state, ...state.state };
      }
    }
  }

  /**
   * 📢 統合通知送信（並列化最適化）
   * @param {VoidCore} sourceCore - 統合元コア
   * @param {VoidCore} targetCore - 統合先コア
   * @param {Array} movedPlugins - 移動したプラグイン情報
   */
  async sendFusionNotifications(sourceCore, targetCore, movedPlugins) {
    const notifications = [];
    
    // プラグイン移動通知（並列安全）
    for (const pluginInfo of movedPlugins) {
      const migratedMsg = Message.notice('core.lifecycle.migrated', {
        pluginId: pluginInfo.pluginId,
        oldCore: sourceCore.coreId || 'source',
        newCore: targetCore.coreId || 'target',
        timestamp: Date.now()
      });
      
      // 並列処理安全フラグ設定
      migratedMsg.parallelSafe = true;
      migratedMsg.safetyReason = 'Plugin migration notification';
      
      notifications.push(migratedMsg);
    }
    
    // 統合完了通知
    const fusedMsg = Message.notice('core.lifecycle.fused', {
      from: sourceCore.coreId || 'source',
      to: targetCore.coreId || 'target',
      pluginCount: movedPlugins.length,
      timestamp: Date.now()
    });
    
    fusedMsg.parallelSafe = true;
    fusedMsg.safetyReason = 'Core fusion completion notification';
    notifications.push(fusedMsg);
    
    // 🚀 並列送信（JavaScript版の真骨頂！）
    this.messagePool.setTransport({
      send: async (message) => {
        return await targetCore.publish(message);
      }
    });
    
    const result = await this.messagePool.submitBatch(notifications);
    
    console.log(`📢 Fusion notifications sent: ${result.processedCount} messages in ${result.processingTime}ms`);
    console.log(`🚀 Parallelization: ${result.parallelCount} parallel, ${result.sequentialCount} sequential`);
  }

  /**
   * 🗑️ ソースコア破棄
   * @param {VoidCore} sourceCore - 統合元コア
   */
  async destroySourceCore(sourceCore) {
    try {
      // クリーンアップ処理
      if (typeof sourceCore.clear === 'function') {
        await sourceCore.clear();
      }
      
      // 明示的にnullを設定
      sourceCore.channelManager = null;
      sourceCore.subscribers = null;
      sourceCore.plugins = null;
      sourceCore.initialized = false;
      
      console.log('🗑️ Source core destroyed successfully');
      
    } catch (error) {
      console.error('❌ Source core destruction error:', error);
    }
  }

  /**
   * 📊 統合履歴取得
   * @returns {Array} - 統合履歴
   */
  getFusionHistory() {
    return [...this.fusionHistory];
  }

  /**
   * 🧹 統合履歴クリア
   */
  clearFusionHistory() {
    this.fusionHistory = [];
  }
}

// デフォルトインスタンス
export const coreFusion = new CoreFusion();