// plugins/chart_display.js
import { AutonomousPlugin } from '../src/autonomous_plugin.js';

export class ChartDisplayPlugin extends AutonomousPlugin {
  constructor(containerElement) {
    super("ChartDisplayService");
    this.containerElement = containerElement; // Store the container element
    this.board.log('✅ ChartDisplayPlugin initialized.');
    this.chart = null;
    this.cpuData = [];
    this.memoryData = [];
    this.labels = [];
    this.maxDataPoints = 20; // Display last 20 seconds of data

    this._prepare();
  }

  _prepare() {
    super._prepare();

    // Load Chart.js from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => {
      this.board.log('📊 Chart.js loaded.');
      // Add a small delay to ensure Chart.js is fully ready and DOM is updated
      setTimeout(() => {
        this._createChartUI();
        this.subscribe('Notice', 'system.metrics.updated', this.handleMetricsUpdate.bind(this));
        this.board.log('➕ ChartDisplayPlugin subscribed to "system.metrics.updated".');
      }, 50); // 50ms delay
    };
    document.head.appendChild(script);
  }

  _createChartUI() {
    this.canvas = document.createElement('canvas'); // Store reference to canvas
    this.canvas.id = 'metrics-chart';
    canvas.style.width = '100%';
    canvas.style.height = '300px';
    canvas.style.border = '1px solid #ccc';
    canvas.style.marginTop = '20px';

    if (this.containerElement) {
      this.containerElement.appendChild(canvas);
    } else {
      this.board.log('❌ Error: Container element not provided for chart.');
      return;
    }

    const ctx = canvas.getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.labels,
        datasets: [
          {
            label: 'CPU Usage (%)',
            data: this.cpuData,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
            fill: false
          },
          {
            label: 'Memory Usage (MB)',
            data: this.memoryData,
            borderColor: 'rgb(255, 99, 132)',
            tension: 0.1,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100 // Max for CPU, will adjust for memory if needed
          }
        }
      }
    });
  }

  handleMetricsUpdate(message) {
    const { cpu, memory } = message.payload;
    const now = new Date();
    const timeLabel = `${now.getMinutes()}:${now.getSeconds()}`;

    this.labels.push(timeLabel);
    this.cpuData.push(cpu);
    this.memoryData.push(memory);

    if (this.labels.length > this.maxDataPoints) {
      this.labels.shift();
      this.cpuData.shift();
      this.memoryData.shift();
    }

    // Adjust Y-axis max for memory if it exceeds 100
    const maxMemory = Math.max(...this.memoryData);
    if (maxMemory > 100 && this.chart.options.scales.y.max === 100) {
      this.chart.options.scales.y.max = maxMemory * 1.2; // Give some buffer
      this.chart.update();
    }

    this.chart.update();
  }

  retire() {
    super.retire();
    if (this.chart) {
      this.chart.destroy();
      this.board.log('📊 ChartDisplayPlugin: Chart destroyed.');
    }
    // Remove canvas element from DOM
    if (this.containerElement && this.containerElement.contains(this.canvas)) {
      this.containerElement.removeChild(this.canvas);
    }
  }
}

export function init(containerElement) {
  const instance = new ChartDisplayPlugin(containerElement);
  instance._prepare(); // Explicitly call _prepare
  return instance;
}
