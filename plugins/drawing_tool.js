// plugins/drawing_tool.js
import { AutonomousPlugin } from '../src/autonomous_plugin.js';

export class DrawingToolPlugin extends AutonomousPlugin {
  constructor(containerElement) {
    super("DrawingToolService");
    this.containerElement = containerElement;
    this.board.log('✅ DrawingToolPlugin initialized.');

    this.isDrawing = false;
    this.lastX = 0;
    this.lastY = 0;

    this._prepare();
  }

  _prepare() {
    super._prepare();

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'drawing-canvas';
    this.canvas.width = 600;
    this.canvas.height = 400;
    this.canvas.style.border = '1px solid #000';
    this.canvas.style.cursor = 'crosshair';

    if (this.containerElement) {
      this.containerElement.appendChild(this.canvas);
      this.board.log('🎨 DrawingToolPlugin: Canvas appended to container.');
    } else {
      this.board.log('❌ Error: Container element not provided for drawing canvas.');
      return;
    }

    this.ctx = this.canvas.getContext('2d');
    if (this.ctx) {
      this.board.log('🎨 DrawingToolPlugin: 2D context obtained.');
    } else {
      this.board.log('❌ Error: Could not get 2D context for drawing canvas.');
      return;
    }
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = 'black';

    this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
    this.canvas.addEventListener('mousemove', this.draw.bind(this));
    this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
    this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
  }

  startDrawing(e) {
    this.isDrawing = true;
    [this.lastX, this.lastY] = [e.offsetX, e.offsetY];
  }

  draw(e) {
    if (!this.isDrawing) return;

    const currentX = e.offsetX;
    const currentY = e.offsetY;

    // Draw on this plugin's own canvas
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(currentX, currentY);
    this.ctx.stroke();

    // Publish the drawing stroke as a Notice message
    const message = {
      type: 'Notice',
      source: this.capabilityName,
      event_name: 'drawing.stroke',
      payload: {
        fromX: this.lastX,
        fromY: this.lastY,
        toX: currentX,
        toY: currentY,
        color: this.ctx.strokeStyle,
        lineWidth: this.ctx.lineWidth
      },
      message_id: `notice-${Date.now()}`
    };
    this.publish(message);

    [this.lastX, this.lastY] = [currentX, currentY];
  }

  stopDrawing() {
    this.isDrawing = false;
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
  const instance = new DrawingToolPlugin(containerElement);
  instance._prepare(); // Explicitly call _prepare
  return instance;
}
