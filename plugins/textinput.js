// plugins/textinput.js
import { AutonomousPlugin } from '../src/autonomous_plugin.js';

export class TextInputPlugin extends AutonomousPlugin {
  constructor() {
    super("TextInputService"); // Provide this plugin as 'TextInputService'
    this.board.log('✅ TextInputPlugin initialized.');
  }

  // Override _prepare from AutonomousPlugin to set up UI
  _prepare() {
    super._prepare(); // Call parent's _prepare
    const textarea = document.createElement('textarea');
    textarea.id = 'markdown-input';
    textarea.placeholder = 'Type your Markdown here...';
    textarea.style.width = '48%';
    textarea.style.height = '100%';
    textarea.style.backgroundColor = '#2d2d2d';
    textarea.style.color = '#f0f0f0';
    textarea.style.border = '2px solid #4682b4';
    textarea.style.borderRadius = '8px';
    textarea.style.padding = '15px';
    textarea.style.boxSizing = 'border-box';
    textarea.style.fontFamily = 'monospace';
    textarea.style.fontSize = '14px';
    textarea.style.resize = 'none';
    textarea.style.outline = 'none';

    document.getElementById('editor-container').appendChild(textarea);

    textarea.addEventListener('input', () => {
      const message = {
        type: 'Notice',
        source: 'TextInputService',
        event_name: 'text.input.changed',
        payload: {
          text: textarea.value,
          length: textarea.value.length
        },
        message_id: `notice-${Date.now()}`
      };
      this.publish(message); // Use this.publish from AutonomousPlugin
      
      // Log message details
      this.board.log(`📝 Publishing: text.input.changed | Length: ${textarea.value.length} | Last char: "${textarea.value.slice(-1) || ''}" | Preview: "${textarea.value.slice(-20).replace(/\n/g, '\\n')}..."`);
      
      // Animate message flow
      this._animateMessage(textarea.value);
    });
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
  instance._prepare(); // Explicitly call _prepare
  return instance;
}
