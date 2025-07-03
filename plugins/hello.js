// plugins/hello.js
import { AutonomousPlugin } from '../src/autonomous_plugin.js';

export class HelloPlugin extends AutonomousPlugin {
  constructor(displayElement) {
    super("HelloService"); // Provide this plugin as 'HelloService'
    this.displayElement = displayElement; // Store the element
    this.board.log('✅ HelloPlugin initialized.');

    // Publish a "hello.message" Notice
    const message = {
      type: 'Notice',
      source: this.capabilityName,
      event_name: 'hello.message',
      payload: { greeting: 'hello' },
      message_id: `notice-${Date.now()}`
    };
    this.publish(message);
    this.board.log('✉️ HelloPlugin published "hello.message".');

    // Visual feedback: Display "Hello"
    if (this.displayElement) {
      this.displayElement.textContent = 'Hello';
      this.displayElement.style.color = 'blue';
      this.displayElement.style.fontWeight = 'bold';
    }
  }
}

export function init(displayElement) {
  new HelloPlugin(displayElement);
}
