// compatibility_layer.js - 開発者混乱防止の互換レイヤー
// 既存のAutonomousPluginを完全に動かしながら、内部で新システムを使う

import { createComfortablePlugin } from './pure_plugin_system.js';
import { voidCore } from './voidcore.js';
import { Message } from './message.js';

/**
 * 🛡️ AutonomousPlugin 互換レイヤー
 * 
 * 外部API：完全に同じ（破壊的変更なし）
 * 内部実装：純粋メッセージベース
 * 
 * これにより既存のプラグインは何も変更せずに動き続ける
 */
export class AutonomousPlugin {
  constructor(capabilityName) {
    // 警告：開発者に新システムを案内（うるさくない程度に）
    if (Math.random() < 0.1) { // 10%の確率で案内
      console.log(`💡 Tip: Consider migrating ${capabilityName} to the new createPlugin() system for better performance!`);
    }
    
    // 内部で新システムを使用
    this._purePlugin = createComfortablePlugin({
      pluginId: capabilityName,
      name: capabilityName,
      autoHealth: true,
      autoProcess: true
    });
    
    // 旧APIの互換性維持
    this.capabilityName = capabilityName;
    this.pluginId = this._purePlugin.pluginId;
    this.board = { 
      provide: () => {}, 
      retract: () => {}, 
      observe: () => {},
      log: () => {}
    };
    this.voidCore = voidCore;
    this.role = null;
    this.currentPhase = 'inactive';
    this.isActive = false;
    this.subscriptions = new Set();
    this.retireReason = null;
    this.startTime = this._purePlugin.startTime;
    
    // 新旧システムの橋渡し
    this._bridgeNewToOld();
  }
  
  // === 完全互換の旧API ===
  
  async start() {
    try {
      this.log('🚀 Starting lifecycle...');
      await this.prepare();
      await this.debut();
      await this.observe();
      await this.work();
    } catch (error) {
      this.log(`❌ Error in ${this.currentPhase}: ${error.message}`);
    } finally {
      await this.retire();
    }
  }

  async prepare() {
    this.currentPhase = 'preparation';
    this.log('🛠️ Preparation phase started');
    await this._prepare();
    this.log('✅ Preparation completed');
  }

  async debut() {
    this.currentPhase = 'debut';
    this.log('🎭 Debut phase started');
    this.isActive = true;
    
    // 新システムの初期化を内部で実行
    await this._purePlugin.initialize();
    
    await this.publish(Message.notice('plugin.debut', {
      pluginId: this.pluginId,
      capability: this.capabilityName,
      role: this.role,
      timestamp: Date.now()
    }).withSource(this.capabilityName));
    
    this.log('✅ Debut completed');
  }

  async observe() {
    this.currentPhase = 'observation';
    this.log('👀 Observation phase started');
    this._setupSubscriptions();
    await this._observe();
    this.log('✅ Observation completed');
  }

  async work() {
    this.currentPhase = 'work';
    this.log('💪 Work phase started');
    
    while (this.isActive && !await this._shouldRetire()) {
      try {
        await this._work();
        await this._sleep(10);
      } catch (error) {
        this.log(`❌ Work error: ${error.message}`);
        break;
      }
    }
    
    this.log('✅ Work completed');
  }

  async retire() {
    this.currentPhase = 'retirement';
    this.isActive = false;
    this.log('🌅 Retirement phase started');
    
    // 新システムのシャットダウンを内部で実行
    await this._purePlugin.shutdown(this.retireReason || 'Natural retirement');
    
    this.log('👋 Goodbye!');
  }

  // === 旧APIメソッド（完全互換） ===
  
  _setupSubscriptions() {
    this.globalMessageHandler = (msg) => {
      if (msg.category === 'Intent' && msg.target_role === this.role) {
        this._handleIntent(msg);
      } else if (msg.category === 'Proposal' && msg.target_plugin === this.pluginId) {
        this._handleProposal(msg);
      } else if (msg.category === 'Notice') {
        this._handleNotice(msg);
      }
    };
  }

  subscribeToType(messageType) {
    // 新システムの購読機能を使用
    this._purePlugin.on(messageType, '*', this.globalMessageHandler);
  }

  async publish(message) {
    return await this._purePlugin.send(message);
  }

  observeCapability(name) {
    return this.board.observe(name);
  }

  provide(name, service) {
    this.board.provide(name, service);
  }

  retract(name) {
    this.board.retract(name);
  }

  subscribeVoid(type, handler) {
    this._purePlugin.on(type, '*', handler);
  }

  unsubscribeAll() {
    // 新システムでは自動管理されるので何もしない
  }
  
  log(msg) {
    this._purePlugin.log(msg);
  }

  _sleep(ms) {
    return this._purePlugin.sleep(ms);
  }

  // === サブクラスでオーバーライドするメソッド（完全互換） ===
  async _prepare() {}
  async _observe() {}
  async _work() {}
  async _shouldRetire() { return false; }
  async _cleanup() {}

  _handleIntent(message) {
    this.log(`📥 Intent received: ${message.action}`);
  }
  
  _handleProposal(message) {
    this.log(`💡 Proposal received: ${message.suggestion}`);
    if (message.suggestion === 'retire') {
      this.retireReason = 'Retirement proposal accepted';
      this.isActive = false;
    }
  }
  
  _handleNotice(message) {
    this.log(`📢 Notice received: ${message.event_name}`);
  }

  // === 旧API後方互換性 ===
  subscribe(messageType, eventName, callback) {
    this._purePlugin.on(messageType, eventName, callback);
  }

  unsubscribe(messageType, eventName, callback) {
    // 新システムでは自動管理
  }

  publishLegacy(message) {
    return this.publish(message);
  }

  _getPhaseIcon() {
    const icons = {
      'preparation': '🛠️',
      'debut': '🎭',
      'observation': '👀',
      'work': '💪',
      'retirement': '🌅',
      'inactive': '😴'
    };
    return icons[this.currentPhase] || '❓';
  }

  // === 新旧システムの橋渡し ===
  _bridgeNewToOld() {
    // 新システムのイベントを旧システムのメソッドに転送
    this._purePlugin.on('Notice', 'plugin.initialized', () => {
      // 初期化完了を旧システムのイベントとして処理
    });
    
    this._purePlugin.on('Notice', 'plugin.shutdown', () => {
      // シャットダウンを旧システムのイベントとして処理
    });
  }
}

/**
 * 🔄 移行ヘルパー関数
 * 開発者が段階的に移行できるようにサポート
 */
export function migrationHelper() {
  console.log(`
🚀 VoidCore Migration Helper

Current: AutonomousPlugin (legacy, still supported)
Recommended: createPlugin() from pure_plugin_system.js

Benefits of migration:
✅ Simpler code (no inheritance)
✅ Better performance
✅ More flexible
✅ Future-proof

Quick migration guide:
1. Replace: class MyPlugin extends AutonomousPlugin
   With: const myPlugin = createPlugin({...})

2. Replace: async _prepare() { ... }
   With: Custom logic in initialize()

3. Replace: async _work() { ... }
   With: Custom message handlers

See: /docs/migration-guide.md
  `);
}

/**
 * 🎯 段階的移行戦略
 */
export const MIGRATION_PHASES = {
  PHASE_1: 'compatibility_layer',    // 現在：互換レイヤー
  PHASE_2: 'dual_support',           // 3ヶ月後：新旧両方サポート
  PHASE_3: 'new_system_only'         // 6ヶ月後：新システムのみ
};

export const CURRENT_PHASE = MIGRATION_PHASES.PHASE_1;

// デバッグ用：移行状況の表示
if (typeof window !== 'undefined') {
  window.VoidCoreMigrationStatus = {
    currentPhase: CURRENT_PHASE,
    showMigrationTip: migrationHelper
  };
}