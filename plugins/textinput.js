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
    textarea.placeholder = 'ここにMarkdownを入力してください...';
    textarea.style.width = '48%';
    textarea.style.height = '300px';
    textarea.style.float = 'left';
    textarea.style.marginRight = '2%';
    textarea.style.padding = '10px';
    textarea.style.boxSizing = 'border-box';

    document.getElementById('editor-container').appendChild(textarea);

    textarea.addEventListener('input', () => {
      const message = {
        type: 'Notice',
        source: 'plugins/textinput/v1.0',
        event_name: 'text.input.changed',
        payload: {
          text: textarea.value
        },
        message_id: `notice-${Date.now()}`
      };
      this.publish(message); // Use this.publish from AutonomousPlugin
    });
  }
}

export function init() {
  const instance = new TextInputPlugin();
  instance._prepare(); // Explicitly call _prepare
  return instance;
}
