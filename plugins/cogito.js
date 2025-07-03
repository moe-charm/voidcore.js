// plugins/cogito.js
import { AutonomousPlugin } from '../src/autonomous_plugin.js';

export class CogitoPlugin extends AutonomousPlugin {
  constructor(instanceId = null) {
    const serviceName = instanceId ? `CogitoService_${instanceId}` : "CogitoService";
    super(serviceName); // Provide this plugin with unique name
    this.instanceId = instanceId;
    this.board.log(`✅ CogitoPlugin initialized as ${serviceName}.`);

    // Add character animation
    this._animateCharacter('thinking');
    this._addToLog('🤖 Cogito', 'Do I really exist...?', '#4169e1');

    // Publish an Intent message: "Am I alive?" with delay for dramatic effect
    setTimeout(() => {
      const questionMessage = {
        type: 'Intent',
        source: this.capabilityName,
        event_name: 'cogito.question',
        payload: { question: 'Am I moving? Am I alive?' },
        message_id: `intent-${Date.now()}`
      };
      this.publish(questionMessage);
      this.board.log('✉️ CogitoPlugin published "cogito.question".');
    }, 1000);

    // Subscribe to ObserverPlugin's response
    this.subscribe('Notice', 'cogito.response', this.handleResponse.bind(this));
    this.board.log('➕ CogitoPlugin subscribed to "cogito.response".');

    // Subscribe to Proposal to retire
    this.subscribe('Proposal', 'retire', this.handleRetireProposal.bind(this));
    this.board.log('➕ CogitoPlugin subscribed to "retire" proposal.');
  }

  handleResponse(message) {
    if (message.payload && message.payload.answer) {
      this.board.log(`📣 CogitoPlugin received response: ${message.payload.answer}`);
      this.board.log('✨ Good... I am alive...');
      
      // Animate character happiness
      this._animateCharacter('happy');
      this._addToLog('🤖 Cogito', 'Thank you! I feel relieved!', '#4169e1');
    }
  }

  handleRetireProposal(message) {
    this.board.log(`🤔 CogitoPlugin received retire proposal: ${JSON.stringify(message.payload)}`);
    
    // Animate peaceful retirement
    this._animateCharacter('retiring');
    this._addToLog('🤖 Cogito', 'My existence has been proven... I can rest in peace.', '#4169e1');
    
    // Retire after animation
    setTimeout(() => {
      this.retire();
    }, 2000);
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
    logDiv.scrollTop = logDiv.scrollHeight;
  }
}

export function init(instanceId = null) {
  const instance = new CogitoPlugin(instanceId);
  instance._prepare(); // Explicitly call _prepare
  return instance;
}
