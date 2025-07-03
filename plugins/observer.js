// plugins/observer.js
import { AutonomousPlugin } from '../src/autonomous_plugin.js';

export class ObserverPlugin extends AutonomousPlugin {
  constructor(instanceId = null) {
    const serviceName = instanceId ? `ObserverService_${instanceId}` : "ObserverService";
    super(serviceName); // Provide this plugin with unique name
    this.instanceId = instanceId;
    this.board.log(`✅ ObserverPlugin initialized as ${serviceName}.`);

    // Subscribe to CogitoPlugin's question
    this.subscribe('Intent', 'cogito.question', this.handleCogitoQuestion.bind(this));
    this.board.log('➕ ObserverPlugin subscribed to "cogito.question".');
  }

  handleCogitoQuestion(message) {
    this.board.log(`🤔 ObserverPlugin received question from ${message.source}: ${message.payload.question}`);
    
    // Store the source Cogito ID for later retirement proposal
    const questioningCogitoId = message.source;

    // Animate observer analyzing
    this._animateCharacter('analyzing');
    this._addToLog('👁️ Observer', 'I see... you are worried about existence.', '#32cd32');

    setTimeout(() => {
      // Respond with a Notice message
      const responseMessage = {
        type: 'Notice',
        source: this.capabilityName,
        event_name: 'cogito.response',
        payload: { answer: 'You sent a message, therefore you exist!' },
        message_id: `notice-${Date.now()}`
      };
      this.publish(responseMessage);
      this.board.log('✉️ ObserverPlugin published "cogito.response".');
      
      this._animateCharacter('responding');
      this._addToLog('👁️ Observer', 'You were able to send a message. Therefore you exist!', '#32cd32');
    }, 1500);

    // Propose the specific CogitoPlugin to retire after a short delay
    setTimeout(() => {
      const cogitoService = this.observe(questioningCogitoId);
      if (cogitoService) {
        const proposalMessage = {
          type: 'Proposal',
          source: this.capabilityName,
          target_plugin: questioningCogitoId, // Target the specific Cogito that asked the question
          suggestion: 'retire',
          payload: { reason: 'Your existence has been proven. Rest in peace.' },
          message_id: `proposal-${Date.now()}`
        };
        this.publish(proposalMessage);
        this.board.log(`✉️ ObserverPlugin proposed "retire" to ${questioningCogitoId}.`);
      } else {
        this.board.log(`⚠️ ${questioningCogitoId} not found for retirement proposal.`);
      }
    }, 2000); // Propose retirement after 2 seconds
  }
  
  _animateCharacter(state) {
    const char = this.instanceId ? window[`observerChar_${this.instanceId}`] : window.observerChar;
    if (!char) return;
    
    switch(state) {
      case 'analyzing':
        char.style.transform = 'scale(1.1) rotate(5deg)';
        char.innerHTML = '🔍';
        char.style.backgroundColor = '#32cd32';
        break;
      case 'responding':
        char.style.transform = 'scale(1.2) rotate(0deg)';
        char.innerHTML = '👁️';
        char.style.backgroundColor = '#90ee90';
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
  const instance = new ObserverPlugin(instanceId);
  instance._prepare(); // Explicitly call _prepare
  return instance;
}
