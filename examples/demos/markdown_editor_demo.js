// examples/demos/markdown_editor_demo.js
import { board } from '/voidcore.js/src/core.js';
import { TextInputPlugin } from '/voidcore.js/plugins/textinput.js';
import { MarkdownRendererPlugin } from '/voidcore.js/plugins/markdownrenderer.js';

let textInputPluginInstance = null;
let markdownRendererPluginInstance = null;

export async function runDemo(container) {
  board.log('--- Loading Markdown Editor demo ---');

  // Clear the container for this demo
  if (container) {
    container.innerHTML = '';
    container.style.position = 'relative';
    container.style.height = '500px';
    container.style.backgroundColor = '#1e1e1e';
    container.style.borderRadius = '10px';
    container.style.overflow = 'hidden';
  }

  // Create demo info panel (top-right)
  const infoPanel = document.createElement('div');
  infoPanel.style.position = 'absolute';
  infoPanel.style.top = '10px';
  infoPanel.style.right = '10px';
  infoPanel.style.backgroundColor = 'rgba(70, 130, 180, 0.9)';
  infoPanel.style.color = 'white';
  infoPanel.style.padding = '12px';
  infoPanel.style.borderRadius = '8px';
  infoPanel.style.fontSize = '12px';
  infoPanel.style.maxWidth = '250px';
  infoPanel.style.zIndex = '100';
  infoPanel.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 8px; color: #87ceeb;">
      📝 Markdown Editor Demo
    </div>
    <div style="line-height: 1.4;">
      <strong>✨ Message Flow Visualization:</strong><br>
      • Watch messages fly between plugins!<br>
      • Every keypress = new message<br>
      • TextInput → MarkdownRenderer<br><br>
      
      <strong>🎯 VoidCore Architecture:</strong><br>
      • Real-time message passing<br>
      • Plugin autonomy<br>
      • No direct coupling<br><br>
      
      <strong>💫 This screen also runs on VoidCore!</strong>
    </div>
  `;
  container.appendChild(infoPanel);

  // Create message flow visualization area (middle-top)
  const flowContainer = document.createElement('div');
  flowContainer.style.position = 'absolute';
  flowContainer.style.top = '100px';
  flowContainer.style.left = '50%';
  flowContainer.style.transform = 'translateX(-50%)';
  flowContainer.style.width = '120px';
  flowContainer.style.height = '120px';
  flowContainer.style.zIndex = '95';
  
  // Create central arrow button
  const arrowButton = document.createElement('div');
  arrowButton.id = 'message-arrow-button';
  arrowButton.style.width = '80px';
  arrowButton.style.height = '80px';
  arrowButton.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  arrowButton.style.border = '3px solid #333';
  arrowButton.style.borderRadius = '50%';
  arrowButton.style.display = 'flex';
  arrowButton.style.alignItems = 'center';
  arrowButton.style.justifyContent = 'center';
  arrowButton.style.fontSize = '30px';
  arrowButton.style.color = '#555';
  arrowButton.style.cursor = 'default';
  arrowButton.style.position = 'relative';
  arrowButton.style.margin = '0 auto';
  arrowButton.style.transition = 'all 0.3s ease';
  arrowButton.innerHTML = '→';
  
  // Create pulse ring
  const pulseRing = document.createElement('div');
  pulseRing.id = 'pulse-ring';
  pulseRing.style.position = 'absolute';
  pulseRing.style.top = '-3px';
  pulseRing.style.left = '-3px';
  pulseRing.style.right = '-3px';
  pulseRing.style.bottom = '-3px';
  pulseRing.style.border = '3px solid #4682b4';
  pulseRing.style.borderRadius = '50%';
  pulseRing.style.opacity = '0';
  pulseRing.style.pointerEvents = 'none';
  arrowButton.appendChild(pulseRing);
  
  // Add labels
  const flowLabel = document.createElement('div');
  flowLabel.style.textAlign = 'center';
  flowLabel.style.marginTop = '10px';
  flowLabel.style.color = '#888';
  flowLabel.style.fontSize = '11px';
  flowLabel.style.fontWeight = 'bold';
  flowLabel.innerHTML = 'Message Flow';
  
  flowContainer.appendChild(arrowButton);
  flowContainer.appendChild(flowLabel);
  container.appendChild(flowContainer);
  
  // Store references
  window.markdownArrowButton = arrowButton;
  window.markdownPulseRing = pulseRing;

  // Create message counter and log area
  const messageInfoDiv = document.createElement('div');
  messageInfoDiv.style.position = 'absolute';
  messageInfoDiv.style.top = '10px';
  messageInfoDiv.style.left = '10px';
  messageInfoDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  messageInfoDiv.style.border = '1px solid #4682b4';
  messageInfoDiv.style.borderRadius = '8px';
  messageInfoDiv.style.padding = '10px';
  messageInfoDiv.style.zIndex = '90';
  messageInfoDiv.style.maxWidth = '200px';
  
  const messageCounter = document.createElement('div');
  messageCounter.id = 'message-counter';
  messageCounter.style.color = '#00ff00';
  messageCounter.style.fontFamily = 'monospace';
  messageCounter.style.fontSize = '14px';
  messageCounter.style.marginBottom = '10px';
  messageCounter.innerHTML = '📨 Messages: 0';
  messageInfoDiv.appendChild(messageCounter);
  
  const messageLog = document.createElement('div');
  messageLog.id = 'message-log';
  messageLog.style.color = '#a0a0a0';
  messageLog.style.fontFamily = 'monospace';
  messageLog.style.fontSize = '10px';
  messageLog.style.maxHeight = '60px';
  messageLog.style.overflowY = 'auto';
  messageLog.innerHTML = '<div style="color: #666;">Recent messages...</div>';
  messageInfoDiv.appendChild(messageLog);
  
  container.appendChild(messageInfoDiv);

  // Create sub-containers for the editor and preview
  const editorWrapper = document.createElement('div');
  editorWrapper.style.position = 'absolute';
  editorWrapper.style.top = '240px';
  editorWrapper.style.left = '0';
  editorWrapper.style.right = '0';
  editorWrapper.style.bottom = '0';
  editorWrapper.style.display = 'flex';
  editorWrapper.style.padding = '20px';
  container.appendChild(editorWrapper);

  const editorDiv = document.createElement('div');
  editorDiv.id = 'editor-container';
  editorDiv.style.width = '100%';
  editorDiv.style.display = 'flex';
  editorDiv.style.gap = '20px';
  editorWrapper.appendChild(editorDiv);

  // Store references for message visualization
  window.markdownMessageCounter = messageCounter;
  window.markdownMessageCount = 0;
  
  // Add pulse animation CSS
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.8; }
      100% { transform: scale(1); opacity: 1; }
    }
    
    @keyframes arrowGlow {
      0% { 
        background-color: rgba(70, 130, 180, 0.2);
        border-color: #4682b4;
        color: #4682b4;
        box-shadow: 0 0 20px rgba(70, 130, 180, 0.8);
      }
      50% {
        background-color: rgba(70, 130, 180, 0.4);
        border-color: #5ba0f2;
        color: #5ba0f2;
        box-shadow: 0 0 30px rgba(70, 130, 180, 1);
      }
      100% {
        background-color: rgba(0, 0, 0, 0.8);
        border-color: #333;
        color: #555;
        box-shadow: none;
      }
    }
    
    @keyframes ringPulse {
      0% {
        transform: scale(1);
        opacity: 1;
      }
      100% {
        transform: scale(1.5);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);

  // Initialize Markdown Editor plugins
  const { init: initTextInput } = await import('/voidcore.js/plugins/textinput.js');
  textInputPluginInstance = initTextInput(); // Store instance if needed for cleanup

  const { init: initMarkdownRenderer } = await import('/voidcore.js/plugins/markdownrenderer.js');
  markdownRendererPluginInstance = initMarkdownRenderer(); // Store instance if needed for cleanup

  // Return an object with a cleanup method
  return {
    cleanup: () => {
      board.log('--- Cleaning up Markdown Editor demo ---');
      if (editorDiv) editorDiv.innerHTML = ''; // Clear UI
      // In a more complex scenario, you might call retire() on plugins here
      // if (textInputPluginInstance) textInputPluginInstance.retire();
      // if (markdownRendererPluginInstance) markdownRendererPluginInstance.retire();
    }
  };
}
