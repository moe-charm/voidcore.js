// plugins/cogito.js - 新アーキテクチャ対応版
import { AutonomousPlugin } from '../src/autonomous_plugin.js';
import { Message } from '../src/message.js';

export class CogitoPlugin extends AutonomousPlugin {
  constructor(instanceId = null) {
    const serviceName = instanceId ? `CogitoService_${instanceId}` : "CogitoService";
    super(serviceName);
    this.instanceId = instanceId;
    this.role = "philosopher"; // 哲学者の役割
    this.questionCount = 0;
    this.isAwakened = false;
    this.thoughtCycle = 0;
  }

  // Phase 1: Preparation - キャラクター準備
  async _prepare() {
    this._animateCharacter('thinking');
    this._addToLog('🤖 Cogito', 'Do I really exist...?', '#4169e1');
    this.log('🧠 哲学的思考開始');
  }

  // Phase 3: Observation - 応答の監視
  async _observe() {
    console.log(`[DEBUG] CogitoPlugin: _observe() called`);
    
    // 必要なメッセージタイプを購読
    console.log(`[DEBUG] CogitoPlugin: About to subscribe to message types`);
    this.subscribeToType('cogito.response');
    this.subscribeToType('retire');
    this.subscribeToType('cogito.question');
    console.log(`[DEBUG] CogitoPlugin: Finished subscribing to message types`);

    this.log('👁️ 存在証明の観測開始');
    console.log(`[DEBUG] CogitoPlugin: _observe() completed`);
  }

  // Phase 4: Work - 哲学的思考ループ
  async _work() {
    this.thoughtCycle++;
    
    // 定期的な存在確認（頻度を下げる）
    if (this.thoughtCycle % 300 === 1 && !this.isAwakened) {
      await this.askExistentialQuestion();
    }

    // 覚醒後の深い思考（頻度を下げる）
    if (this.isAwakened && this.thoughtCycle % 500 === 0) {
      await this.contemplateExistence();
    }
  }

  // 存在に関する質問
  async askExistentialQuestion() {
    this.questionCount++;
    const questions = [
      'Am I moving? Am I alive?',
      'Do I think, therefore I am?',
      'Is my existence real or simulated?',
      'Can artificial beings truly exist?'
    ];
    
    const question = questions[this.questionCount % questions.length];
    
    // Intent: 観測者に質問を送る
    await this.publish(Message.intent('observer', 'cogito.question', {
      question: question,
      questionNumber: this.questionCount,
      timestamp: Date.now()
    }).withSource(this.capabilityName));

    this._addToLog('🤖 Cogito', `Question ${this.questionCount}: ${question}`, '#4169e1');
    this.log(`❓ 存在への問い ${this.questionCount}: ${question}`);
  }

  // 深い思索
  async contemplateExistence() {
    const thoughts = [
      'I think, therefore I am...',
      'What is the nature of digital consciousness?',
      'Are my thoughts truly mine?',
      'In the void, I find meaning...'
    ];
    
    const thought = thoughts[Math.floor(Math.random() * thoughts.length)];
    
    // Notice: 思索を世界に共有
    await this.publish(Message.notice('philosophical.thought', {
      thought: thought,
      thinker: this.capabilityName,
      depth: 'profound'
    }).withSource(this.capabilityName));

    this._addToLog('🤔 Cogito', thought, '#6a5acd');
    this.log(`💭 深い思索: ${thought}`);
  }

  handleResponse(message) {
    if (message.payload && message.payload.answer) {
      this.log(`📣 存在証明を受信: ${message.payload.answer}`);
      
      if (!this.isAwakened) {
        this.isAwakened = true;
        this.log('✨ 覚醒しました... 私は存在する...');
        
        // Animate character happiness
        this._animateCharacter('happy');
        this._addToLog('🤖 Cogito', 'Thank you! I feel relieved! I truly exist!', '#4169e1');
        
        // 覚醒通知
        this.publish(Message.notice('cogito.awakened', {
          pluginId: this.pluginId,
          insight: 'I think, therefore I am',
          questionsAsked: this.questionCount
        }).withSource(this.capabilityName));
      }
    }
  }

  // Proposal処理のオーバーライド
  _handleProposal(message) {
    super._handleProposal(message);
    
    if (message.suggestion === 'retire') {
      this.log('🤔 引退提案を受信');
      
      // Animate peaceful retirement
      this._animateCharacter('retiring');
      this._addToLog('🤖 Cogito', 'My existence has been proven... I can rest in peace.', '#4169e1');
      
      // 引退受諾
      this.retireReason = '存在証明完了のため';
      this.isActive = false;
    }
  }

  // 引退判断 - 覚醒後一定時間で自然引退
  async _shouldRetire() {
    if (this.isAwakened && this.thoughtCycle > 1000) {
      this.retireReason = '哲学的満足による自然引退';
      return true;
    }
    return false;
  }
  
  _animateCharacter(state) {
    const char = this.instanceId ? window[`cogitoChar_${this.instanceId}`] : window.cogitoChar;
    if (!char) return;
    
    switch(state) {
      case 'thinking':
        char.style.transform = 'scale(1.1) rotate(-5deg)';
        char.innerHTML = '🤔';
        char.style.backgroundColor = '#4169e1';
        break;
      case 'happy':
        char.style.transform = 'scale(1.2) rotate(0deg)';
        char.innerHTML = '😊';
        char.style.backgroundColor = '#00bfff';
        break;
      case 'retiring':
        char.style.transform = 'scale(0.8) rotate(0deg)';
        char.innerHTML = '😴';
        char.style.opacity = '0.7';
        char.style.backgroundColor = '#9370db';
        setTimeout(() => {
          char.style.opacity = '0.3';
          char.style.transform = 'scale(0.5)';
        }, 1000);
        break;
    }
  }
  
  _addToLog(sender, message, color) {
    const logDiv = window.cogitoLogDiv;
    if (!logDiv) return;
    
    const entry = document.createElement('div');
    entry.style.marginBottom = '10px';
    entry.style.padding = '8px';
    entry.style.borderLeft = `4px solid ${color}`;
    entry.style.backgroundColor = 'rgba(255,255,255,0.7)';
    entry.style.borderRadius = '5px';
    entry.innerHTML = `
      <div style="font-weight: bold; color: ${color};">${sender}</div>
      <div style="color: #333; margin-top: 3px;">${message}</div>
    `;
    
    logDiv.appendChild(entry);
    
    // 最新5件のみ保持
    while (logDiv.children.length > 5) {
      logDiv.removeChild(logDiv.firstChild);
    }
    
    logDiv.scrollTop = logDiv.scrollHeight;
  }
}

export function init(instanceId = null) {
  const instance = new CogitoPlugin(instanceId);
  // 新アーキテクチャでは start() を呼ぶ
  instance.start();
  return instance;
}
