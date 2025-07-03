// plugins/world.js
import { AutonomousPlugin } from '../src/autonomous_plugin.js';

export class WorldPlugin extends AutonomousPlugin {
  constructor(displayElement) {
    super("WorldService"); // Provide this plugin as 'WorldService'
    this.displayElement = displayElement; // Store the element
    this.board.log('✅ WorldPlugin initialized.');

    // Subscribe to "hello.message" Notice
    this.subscribe('Notice', 'hello.message', this.handleHelloMessage.bind(this));
    this.board.log('➕ WorldPlugin subscribed to "hello.message".');
  }

  handleHelloMessage(message) {
    if (message.payload && message.payload.greeting === 'hello') {
      this.board.log('📣 WorldPlugin received "hello.message": world!');
      // Visual feedback: Display "World!"
      if (this.displayElement) {
        this.displayElement.textContent = 'World!';
        this.displayElement.style.color = 'green';
        this.displayElement.style.fontWeight = 'bold';
      }
    }
  }
}

export function init(displayElement) {
  const instance = new WorldPlugin(displayElement);
  instance._prepare(); // Explicitly call _prepare
  return instance;
}
