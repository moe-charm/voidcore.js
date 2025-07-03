// examples/demos/markdown_editor_demo.js
import { board } from '../../src/core.js';
import { TextInputPlugin } from '../../plugins/textinput.js';
import { MarkdownRendererPlugin } from '../../plugins/markdownrenderer.js';

let textInputPluginInstance = null;
let markdownRendererPluginInstance = null;

export async function runDemo(container) {
  board.log('--- Loading Markdown Editor demo ---');

  // Clear the container for this demo
  if (container) {
    container.innerHTML = '';
  }

  // Create sub-containers for the editor and preview
  const editorDiv = document.createElement('div');
  editorDiv.id = 'editor-container'; // Re-use ID for consistency
  editorDiv.style.overflow = 'hidden';
  if (container) container.appendChild(editorDiv);

  // Initialize Markdown Editor plugins
  const { init: initTextInput } = await import('../../plugins/textinput.js');
  textInputPluginInstance = initTextInput(); // Store instance if needed for cleanup

  const { init: initMarkdownRenderer } = await import('../../plugins/markdownrenderer.js');
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
