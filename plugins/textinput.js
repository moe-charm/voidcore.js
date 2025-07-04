// plugins/textinput.js - 新アーキテクチャ対応版
import { AutonomousPlugin } from '../src/autonomous_plugin.js';
import { Message } from '../src/message.js';

export class TextInputPlugin extends AutonomousPlugin {
  constructor() {
    super("TextInputService");
    this.role = "text_input"; // 役割を設定
    this.textarea = null;
    this.lastContent = '';
    this.lastActivity = Date.now();
    this.changeCount = 0;
  }

  // Phase 1: Preparation - UI要素の準備
  async _prepare() {
    const container = document.getElementById('editor-container');
    if (!container) {
      this.log('⚠️ editor-container not found');
      return;
    }

    this.textarea = document.createElement('textarea');
    this.textarea.id = 'markdown-input';
    this.textarea.placeholder = 'Type your Markdown here...';
    this.textarea.style.width = '48%';
    this.textarea.style.height = '100%';
    this.textarea.style.backgroundColor = '#2d2d2d';
    this.textarea.style.color = '#f0f0f0';
    this.textarea.style.border = '2px solid #4682b4';
    this.textarea.style.borderRadius = '8px';
    this.textarea.style.padding = '15px';
    this.textarea.style.boxSizing = 'border-box';
    this.textarea.style.fontFamily = 'monospace';
    this.textarea.style.fontSize = '14px';
    this.textarea.style.resize = 'none';
    this.textarea.style.outline = 'none';

    container.appendChild(this.textarea);
    this.log('🎨 UI準備完了');
  }

  // Phase 3: Observation - イベント監視設定
  async _observe() {
    console.log(`[DEBUG] TextInputPlugin: _observe() called, textarea exists:`, !!this.textarea);
    
    if (!this.textarea) {
      console.log(`[DEBUG] TextInputPlugin: No textarea, returning early`);
      return;
    }

    // 必要なメッセージタイプを購読
    console.log(`[DEBUG] TextInputPlugin: About to subscribe to message types`);
    this.subscribeToType('text.focus');
    this.subscribeToType('text.clear');
    this.subscribeToType('text.insert');
    this.subscribeToType('file.loaded');
    console.log(`[DEBUG] TextInputPlugin: Finished subscribing to message types`);

    // テキスト変更の監視
    this.textarea.addEventListener('input', () => {
      this.lastActivity = Date.now();
      this.changeCount++;
      this._onTextChange();
    });

    this.log('👁️ イベント監視開始');
    console.log(`[DEBUG] TextInputPlugin: _observe() completed`);
  }

  // Phase 4: Work - メインループ
  async _work() {
    // テキスト変更の確認
    if (this.textarea && this.textarea.value !== this.lastContent) {
      this.lastContent = this.textarea.value;
      
      // テキスト変更通知
      await this.publish(Message.notice('text.changed', {
        content: this.textarea.value,
        length: this.textarea.value.length,
        changeCount: this.changeCount
      }).withSource(this.capabilityName));

      this._animateMessage(this.textarea.value);
    }
  }

  // Intent処理 - 他のプラグインからの要求
  _handleIntent(message) {
    super._handleIntent(message);
    
    switch (message.action) {
      case 'text.focus':
        if (this.textarea) {
          this.textarea.focus();
          
          // 視覚的なフォーカス効果を追加
          this.textarea.style.borderColor = '#00ff00';
          this.textarea.style.boxShadow = '0 0 10px #00ff00';
          
          // 短時間点滅させる
          setTimeout(() => {
            this.textarea.style.borderColor = '#4682b4';
            this.textarea.style.boxShadow = 'none';
          }, 1000);
          
          this.log('🎯 フォーカス設定（視覚効果付き）');
        } else {
          this.log('⚠️ テキストエリアが見つかりません');
        }
        break;
      case 'text.clear':
        if (this.textarea) {
          this.textarea.value = '';
          this.lastContent = '';
          this.log('🧹 テキストクリア');
        }
        break;
      case 'text.insert':
        if (this.textarea && message.payload.text) {
          const pos = this.textarea.selectionStart;
          const newText = this.textarea.value.substring(0, pos) + 
                         message.payload.text + 
                         this.textarea.value.substring(pos);
          this.textarea.value = newText;
          this.log(`✏️ テキスト挿入: "${message.payload.text}"`);
        }
        break;
    }
  }

  // Proposal処理 - 提案への対応
  _handleProposal(message) {
    super._handleProposal(message);
    
    switch (message.suggestion) {
      case 'save_content':
        this.log('💾 保存提案を受信');
        // 保存を他のプラグインに依頼
        this.publish(Message.intent('file_manager', 'file.save', {
          content: this.textarea?.value || '',
          format: 'markdown'
        }).withSource(this.capabilityName));
        break;
      case 'clear_content':
        if (confirm('テキストをクリアしますか？')) {
          this.textarea.value = '';
          this.lastContent = '';
          this.log('🧹 提案によりテキストクリア');
        }
        break;
    }
  }

  // 引退判断
  async _shouldRetire() {
    // 30分間未使用の場合は引退
    const inactiveTime = Date.now() - this.lastActivity;
    if (inactiveTime > 30 * 60 * 1000) {
      this.retireReason = '長時間未使用のため';
      return true;
    }
    return false;
  }

  // クリーンアップ
  async _cleanup() {
    if (this.textarea) {
      this.textarea.remove();
      this.textarea = null;
    }
    this.log('🧹 UI要素を削除');
  }

  // テキスト変更時の処理
  _onTextChange() {
    if (!this.textarea) return;

    const message = Message.notice('text.input.changed', {
      text: this.textarea.value,
      length: this.textarea.value.length,
      lastChar: this.textarea.value.slice(-1) || '',
      changeCount: this.changeCount
    }).withSource(this.capabilityName);

    // 旧形式での発行（後方互換性）
    this.publishLegacy({
      type: 'Notice',
      source: 'TextInputService',
      event_name: 'text.input.changed',
      payload: message.payload,
      message_id: message.id
    });

    this.log(`📝 テキスト変更: ${this.textarea.value.length}文字`);
  }
  
  _animateMessage(text) {
    const counter = window.markdownMessageCounter;
    const arrowButton = window.markdownArrowButton;
    const pulseRing = window.markdownPulseRing;
    
    if (!counter || !arrowButton) return;
    
    // Update message counter
    window.markdownMessageCount = (window.markdownMessageCount || 0) + 1;
    counter.innerHTML = `📨 Messages: ${window.markdownMessageCount}`;
    
    // Get last typed character or action
    const lastChar = text.slice(-1) || '';
    const messagePreview = lastChar === '\n' ? '⏎' : 
                          lastChar === ' ' ? '␣' : 
                          lastChar === '' ? '⌫' : 
                          `"${lastChar}"`;
    
    // Animate arrow button - it glows when message passes through
    arrowButton.style.animation = 'arrowGlow 0.8s ease-out';
    
    // Animate pulse ring
    if (pulseRing) {
      pulseRing.style.animation = 'ringPulse 0.8s ease-out';
    }
    
    // Reset animations after completion
    setTimeout(() => {
      arrowButton.style.animation = '';
      if (pulseRing) pulseRing.style.animation = '';
    }, 800);
    
    // Flash the textarea border
    const textarea = document.getElementById('markdown-input');
    textarea.style.borderColor = '#00ff00';
    setTimeout(() => {
      textarea.style.borderColor = '#4682b4';
    }, 200);
    
    // Add to message log
    const messageLog = document.getElementById('message-log');
    if (messageLog) {
      const logEntry = document.createElement('div');
      logEntry.style.marginBottom = '2px';
      logEntry.style.color = '#4682b4';
      logEntry.innerHTML = `→ ${messagePreview} (${text.length})`;
      
      // Keep only last 5 messages
      if (messageLog.children.length > 5) {
        messageLog.removeChild(messageLog.firstChild);
      }
      messageLog.appendChild(logEntry);
      messageLog.scrollTop = messageLog.scrollHeight;
    }
  }
}

export function init() {
  const instance = new TextInputPlugin();
  // 新アーキテクチャでは start() を呼ぶ
  instance.start();
  return instance;
}
