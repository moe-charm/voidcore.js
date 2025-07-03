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
      previewDiv.style.height = '100%';
      previewDiv.style.backgroundColor = '#ffffff';
      previewDiv.style.border = '2px solid #4682b4';
      previewDiv.style.borderRadius = '8px';
      previewDiv.style.padding = '20px';
      previewDiv.style.boxSizing = 'border-box';
      previewDiv.style.overflowY = 'auto';
      previewDiv.style.fontFamily = 'Arial, sans-serif';

      document.getElementById('editor-container').appendChild(previewDiv);

      this.subscribe('Notice', 'text.input.changed', (message) => { // Use this.subscribe from AutonomousPlugin
        if (message.payload && message.payload.text) {
          // Animate message reception
          this._animateMessageReceived();
          
          // Use marked.js to convert Markdown to HTML
          previewDiv.innerHTML = marked.parse(message.payload.text);
          
          // Flash border to show update
          previewDiv.style.borderColor = '#00ff00';
          setTimeout(() => {
            previewDiv.style.borderColor = '#4682b4';
          }, 200);
        }
      });
    };
    document.head.appendChild(script);
  }
  
  _animateMessageReceived() {
    // Arrow button already animated by sender, just add a small delay effect
    const arrowButton = window.markdownArrowButton;
    if (arrowButton) {
      // Quick green flash to show message arrived
      setTimeout(() => {
        const originalBg = arrowButton.style.backgroundColor;
        const originalColor = arrowButton.style.color;
        arrowButton.style.backgroundColor = 'rgba(50, 205, 50, 0.3)';
        arrowButton.style.color = '#32cd32';
        
        setTimeout(() => {
          arrowButton.style.backgroundColor = originalBg;
          arrowButton.style.color = originalColor;
        }, 200);
      }, 300);
    }
  }
}

export function init() {
  const instance = new MarkdownRendererPlugin();
  instance._prepare(); // Explicitly call _prepare
  return instance;
}
