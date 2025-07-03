// plugins/markdownrenderer.js
import { AutonomousPlugin } from '../src/autonomous_plugin.js';

export class MarkdownRendererPlugin extends AutonomousPlugin {
  constructor() {
    super("MarkdownRendererService"); // Provide this plugin as 'MarkdownRendererService'
    this.board.log('✅ MarkdownRendererPlugin initialized.');
  }

  // Override _prepare from AutonomousPlugin to set up UI and subscriptions
  _prepare() {
    super._prepare(); // Call parent's _prepare

    // Load marked.js from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
    script.onload = () => {
      const previewDiv = document.createElement('div');
      previewDiv.id = 'markdown-preview';
      previewDiv.style.width = '48%';
      previewDiv.style.height = '300px';
      previewDiv.style.float = 'left';
      previewDiv.style.border = '1px solid #ccc';
      previewDiv.style.padding = '10px';
      previewDiv.style.boxSizing = 'border-box';
      previewDiv.style.overflowY = 'auto';

      document.getElementById('editor-container').appendChild(previewDiv);

      this.subscribe('Notice', 'text.input.changed', (message) => { // Use this.subscribe from AutonomousPlugin
        if (message.payload && message.payload.text) {
          // Use marked.js to convert Markdown to HTML
          previewDiv.innerHTML = marked.parse(message.payload.text);
        }
      });
    };
    document.head.appendChild(script);
  }
}

export function init() {
  new MarkdownRendererPlugin();
}
