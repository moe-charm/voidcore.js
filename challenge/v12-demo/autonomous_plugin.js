// src/autonomous_plugin.js - 完全自律プラグイン 5段階ライフサイクル
import { board } from './core.js';
import { voidCore } from './voidcore.js';
import { Message } from './message.js';

export class AutonomousPlugin {
  constructor(capabilityName) {
    this.board = board;
    this.voidCore = voidCore;
    this.capabilityName = capabilityName;
    this.pluginId = `${capabilityName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.role = null; // プラグインの役割
    this.currentPhase = 'inactive';
    this.isActive = false;
    this.subscriptions = new Set(); // 購読管理
    this.retireReason = null;
    this.startTime = Date.now();
  }

  // 完全な5段階ライフサイクル実行
  async start() {
    try {
      console.log(`[LIFECYCLE] ${this.capabilityName}: Starting lifecycle...`);
      this.log('🚀 Starting lifecycle...');
      await this.prepare();
      console.log(`[LIFECYCLE] ${this.capabilityName}: Prepare done, starting debut...`);
      this.log('✅ Prepare done, starting debut...');
      await this.debut();
      console.log(`[LIFECYCLE] ${this.capabilityName}: Debut done, starting observation...`);
      this.log('✅ Debut done, starting observation...');
      console.log(`[LIFECYCLE] ${this.capabilityName}: About to call observe() method...`);
      await this.observe();
      console.log(`[LIFECYCLE] ${this.capabilityName}: observe() method returned`);
      console.log(`[LIFECYCLE] ${this.capabilityName}: Observation done, starting work...`);
      this.log('✅ Observation done, starting work...');
      await this.work();
    } catch (error) {
      console.error(`[LIFECYCLE] ${this.capabilityName}: Error in ${this.currentPhase}:`, error);
      this.log(`❌ Error in ${this.currentPhase}: ${error.message}`);
      console.error('Full error:', error);
    } finally {
      await this.retire();
    }
  }

  // Phase 1: Preparation (準備)
  async prepare() {
    this.currentPhase = 'preparation';
    this.log('🛠️ Preparation phase started');
    
    // サブクラスでオーバーライド可能
    await this._prepare();
    
    this.log('✅ Preparation completed');
  }

  // Phase 2: Debut (登場) 
  async debut() {
    this.currentPhase = 'debut';
    this.log('🎭 Debut phase started');
    
    // 能力を世界に宣言
    this.board.provide(this.capabilityName, this);
    this.isActive = true;
    
    // デビュー通知
    await this.publish(Message.notice('plugin.debut', {
      pluginId: this.pluginId,
      capability: this.capabilityName,
      role: this.role,
      timestamp: Date.now()
    }).withSource(this.capabilityName));
    
    this.log('✅ Debut completed');
  }

  // Phase 3: Observation (観測)
  async observe() {
    console.log(`[OBSERVE-START] ${this.capabilityName}: observe() method entry point`);
    this.currentPhase = 'observation';
    this.log('👀 Observation phase started');
    
    // メッセージ購読設定
    this._setupSubscriptions();
    
    // サブクラスでの観測設定
    await this._observe();
    
    this.log('✅ Observation completed');
    console.log(`[OBSERVE-END] ${this.capabilityName}: observe() method finished`);
  }

  // Phase 4: Work (活動)
  async work() {
    this.currentPhase = 'work';
    this.log('💪 Work phase started');
    
    // メインワークループ
    while (this.isActive && !await this._shouldRetire()) {
      try {
        await this._work();
        await this._sleep(10); // CPU譲渡
      } catch (error) {
        this.log(`❌ Work error: ${error.message}`);
        break;
      }
    }
    
    this.log('✅ Work completed');
  }

  // Phase 5: Retirement (引退)
  async retire() {
    this.currentPhase = 'retirement';
    this.isActive = false;
    this.log('🌅 Retirement phase started');
    
    // 引退通知
    await this.publish(Message.notice('plugin.retirement', {
      pluginId: this.pluginId,
      capability: this.capabilityName,
      reason: this.retireReason || 'Natural retirement',
      uptime: Date.now() - this.startTime
    }).withSource(this.capabilityName));
    
    // リソース解放
    await this._cleanup();
    this.board.retract(this.capabilityName);
    
    this.log('👋 Goodbye!');
  }

  // メッセージ購読設定
  _setupSubscriptions() {
    console.log(`[SETUP] ${this.capabilityName}: _setupSubscriptions() called`);
    // グローバルメッセージハンドラーを作成
    this.globalMessageHandler = (msg) => {
      // Intent: 自分の役割宛のメッセージ
      if (msg.category === 'Intent' && msg.target_role === this.role) {
        this._handleIntent(msg);
      }
      // Proposal: 自分宛の提案
      else if (msg.category === 'Proposal' && msg.target_plugin === this.pluginId) {
        this._handleProposal(msg);
      }
      // Notice: 全般的な通知
      else if (msg.category === 'Notice') {
        this._handleNotice(msg);
      }
    };
    console.log(`[SETUP] ${this.capabilityName}: globalMessageHandler created`);
  }

  // 特定のメッセージタイプを購読
  subscribeToType(messageType) {
    console.log(`[DEBUG] ${this.capabilityName}: subscribeToType(${messageType}) called`);
    console.log(`[DEBUG] ${this.capabilityName}: globalMessageHandler exists:`, !!this.globalMessageHandler);
    
    try {
      if (!this.subscribedTypes) {
        this.subscribedTypes = new Set();
      }
      
      if (!this.subscribedTypes.has(messageType)) {
        console.log(`[DEBUG] ${this.capabilityName}: Calling voidCore.subscribe for ${messageType}`);
        this.voidCore.subscribe(messageType, this.globalMessageHandler);
        this.subscriptions.add([messageType, this.globalMessageHandler]);
        this.subscribedTypes.add(messageType);
        this.log(`📥 Subscribed to: ${messageType}`);
        console.log(`[DEBUG] ${this.capabilityName}: Successfully subscribed to ${messageType}`);
      } else {
        this.log(`⚠️ Already subscribed to: ${messageType}`);
      }
    } catch (error) {
      this.log(`❌ Error subscribing to ${messageType}: ${error.message}`);
      console.error('Subscription error:', error);
    }
  }

  // サブクラスでオーバーライドするメソッド
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
    // 引退提案の自動処理
    if (message.suggestion === 'retire') {
      this.retireReason = 'Retirement proposal accepted';
      this.isActive = false;
    }
  }
  
  _handleNotice(message) {
    this.log(`📢 Notice received: ${message.event_name}`);
  }

  // ヘルパーメソッド
  async publish(message) {
    await this.voidCore.publish(message);
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

  // VoidCore経由の購読
  subscribeVoid(type, handler) {
    this.voidCore.subscribe(type, handler);
    this.subscriptions.add([type, handler]);
  }

  // 全購読解除
  unsubscribeAll() {
    this.subscriptions.forEach(([type, handler]) => {
      this.voidCore.unsubscribe(type, handler);
    });
    this.subscriptions.clear();
  }
  
  log(msg) {
    const timestamp = new Date().toLocaleTimeString();
    const phaseIcon = this._getPhaseIcon();
    const logMsg = `[${timestamp}] ${phaseIcon} ${this.capabilityName}: ${msg}`;
    
    if (this.voidCore.logElement || this.board.logElement) {
      (this.voidCore.logElement || this.board.logElement).innerHTML += logMsg + "<br>";
      setTimeout(() => {
        const logEl = this.voidCore.logElement || this.board.logElement;
        logEl.scrollTop = logEl.scrollHeight;
      }, 0);
    } else {
      console.log(logMsg);
    }
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

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 後方互換性のためのメソッド
  subscribe(messageType, eventName, callback) {
    this.board.subscribe(messageType, eventName, callback);
  }

  unsubscribe(messageType, eventName, callback) {
    this.board.unsubscribe(messageType, eventName, callback);
  }

  // 旧形式のpublish（後方互換性）
  publishLegacy(message) {
    this.board.publish(message);
  }
}
