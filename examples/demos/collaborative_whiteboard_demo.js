// examples/demos/collaborative_whiteboard_demo.js
import { board } from '../../src/core.js';
import { DrawingToolPlugin } from '../../plugins/drawing_tool.js';
import { CanvasRendererPlugin } from '../../plugins/canvas_renderer.js';

let drawingToolPluginInstance = null;
let canvasRendererPluginInstance = null;

export async function runDemo(container) {
  board.log('--- Loading Collaborative Whiteboard demo ---');

  // Clear the container for this demo
  if (container) {
    container.innerHTML = '';
  }

  // Create sub-containers for the drawing tool and renderer
  const drawingToolDiv = document.createElement('div');
  drawingToolDiv.style.display = 'inline-block';
  drawingToolDiv.style.verticalAlign = 'top';
  if (container) container.appendChild(drawingToolDiv);

  const canvasRendererDiv = document.createElement('div');
  canvasRendererDiv.style.display = 'inline-block';
  canvasRendererDiv.style.verticalAlign = 'top';
  if (container) container.appendChild(canvasRendererDiv);

  // Initialize plugins
  const { init: initDrawingTool } = await import('../../plugins/drawing_tool.js');
  drawingToolPluginInstance = initDrawingTool(drawingToolDiv);

  const { init: initCanvasRenderer } = await import('../../plugins/canvas_renderer.js');
  canvasRendererPluginInstance = initCanvasRenderer(canvasRendererDiv);

  // Return an object with a cleanup method
  return {
    cleanup: () => {
      board.log('--- Cleaning up Collaborative Whiteboard demo ---');
      if (drawingToolPluginInstance) drawingToolPluginInstance.retire();
      if (canvasRendererPluginInstance) canvasRendererPluginInstance.retire();
      if (container) container.innerHTML = ''; // Clear UI
    }
  };
}
