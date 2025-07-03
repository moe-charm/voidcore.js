// plugins/observer.js
import { AutonomousPlugin } from '../src/autonomous_plugin.js';

export class ObserverPlugin extends AutonomousPlugin {
  constructor() {
    super("ObserverService"); // Provide this plugin as 'ObserverService'
    this.board.log('✅ ObserverPlugin initialized.');

    // Subscribe to CogitoPlugin's question
    this.subscribe('Intent', 'cogito.question', this.handleCogitoQuestion.bind(this));
    this.board.log('➕ ObserverPlugin subscribed to "cogito.question".');
  }

  handleCogitoQuestion(message) {
    this.board.log(`🤔 ObserverPlugin received question from ${message.source}: ${message.payload.question}`);

    // Respond with a Notice message
    const responseMessage = {
      type: 'Notice',
      source: this.capabilityName,
      event_name: 'cogito.response',
      payload: { answer: '君はメッセージを出せた、ならば生きている！' },
      message_id: `notice-${Date.now()}`
    };
    this.publish(responseMessage);
    this.board.log('✉️ ObserverPlugin published "cogito.response".');

    // Propose CogitoPlugin to retire after a short delay
    setTimeout(() => {
      const cogitoService = this.observe('CogitoService');
      if (cogitoService) {
        const proposalMessage = {
          type: 'Proposal',
          source: this.capabilityName,
          target_plugin: 'CogitoService', // Target the specific plugin by its capabilityName
          suggestion: 'retire',
          payload: { reason: 'あなたの存在意義は証明されました。安らかに眠りなさい。' },
          message_id: `proposal-${Date.now()}`
        };
        this.publish(proposalMessage);
        this.board.log('✉️ ObserverPlugin proposed "retire" to CogitoPlugin.');
      } else {
        this.board.log('⚠️ CogitoService not found for retirement proposal.');
      }
    }, 2000); // Propose retirement after 2 seconds
  }
}

export function init() {
  new ObserverPlugin();
}
