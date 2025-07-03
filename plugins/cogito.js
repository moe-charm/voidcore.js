// plugins/cogito.js
import { AutonomousPlugin } from '../src/autonomous_plugin.js';

export class CogitoPlugin extends AutonomousPlugin {
  constructor() {
    super("CogitoService"); // Provide this plugin as 'CogitoService'
    this.board.log('✅ CogitoPlugin initialized.');

    // Publish an Intent message: "Am I alive?"
    const questionMessage = {
      type: 'Intent',
      source: this.capabilityName,
      event_name: 'cogito.question',
      payload: { question: 'わたしは動いているのだろうか？' },
      message_id: `intent-${Date.now()}`
    };
    this.publish(questionMessage);
    this.board.log('✉️ CogitoPlugin published "cogito.question".');

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
      this.board.log('✨ よかった…わたしは、生きている…');
    }
  }

  handleRetireProposal(message) {
    this.board.log(`🤔 CogitoPlugin received retire proposal: ${JSON.stringify(message.payload)}`);
    // In a real scenario, the plugin would decide whether to retire based on the payload.
    // For this demo, we'll just retire.
    this.retire();
  }
}

export function init() {
  new CogitoPlugin();
}
