// plugins/canvas_renderer.js
import { AutonomousPlugin } from '../src/autonomous_plugin.js';

export class CanvasRendererPlugin extends AutonomousPlugin {
  constructor(containerElement) {
    super("CanvasRendererService");
    this.containerElement = containerElement;
    this.board.log('✅ CanvasRendererPlugin initialized.');

    this._prepare();
  }

  _prepare() {
    super._prepare();

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'renderer-canvas';
    this.canvas.width = 600;
    this.canvas.height = 400;
    this.canvas.style.border = '1px solid #000';
    this.canvas.style.marginLeft = '20px';

    if (this.containerElement) {
      this.containerElement.appendChild(this.canvas);
      this.board.log('🎨 CanvasRendererPlugin: Canvas appended to container.');
    } else {
      this.board.log('❌ Error: Container element not provided for renderer canvas.');
      return;
    }

    this.ctx = this.canvas.getContext('2d');
    if (this.ctx) {
      this.board.log('🎨 CanvasRendererPlugin: 2D context obtained.');
    } else {
      this.board.log('❌ Error: Could not get 2D context for renderer canvas.');
      return;
    }

    this.subscribe('Notice', 'drawing.stroke', this.handleDrawingStroke.bind(this));
    this.board.log('➕ CanvasRendererPlugin subscribed to "drawing.stroke".');
  }

  handleDrawingStroke(message) {
    const { fromX, fromY, toX, toY, color, lineWidth } = message.payload;

    this.ctx.beginPath();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.moveTo(fromX, fromY);
    this.ctx.lineTo(toX, toY);
    this.ctx.stroke();
  }

  retire() {
    super.retire();
    // Remove canvas element from DOM
    if (this.containerElement && this.containerElement.contains(this.canvas)) {
      this.containerElement.removeChild(this.canvas);
    }
  }
}

export function init(containerElement) {
  const instance = new CanvasRendererPlugin(containerElement);
  instance._prepare(); // Explicitly call _prepare
  return instance;
}
