// plugins/chart_display.js
import { AutonomousPlugin } from '../src/autonomous_plugin.js';

export class ChartDisplayPlugin extends AutonomousPlugin {
  constructor(containerElement) {
    super("ChartDisplayService");
    this.containerElement = containerElement; // Store the container element
    this.board.log('✅ ChartDisplayPlugin initialized.');
    this.chart = null;
    this.cpuData = [];
    this.networkSpeedData = [];
    this.rttData = [];
    this.labels = [];
    this.maxDataPoints = 30; // Display last 30 seconds of data
    this.metricsDisplay = null;

    this._prepare();
  }

  _prepare() {
    super._prepare();

    // Check if Chart.js is already loaded
    if (window.Chart) {
      this.board.log('📊 Chart.js already available.');
      this._createChartUI();
      this.subscribe('Notice', 'system.metrics.updated', this.handleMetricsUpdate.bind(this));
      this.board.log('➕ ChartDisplayPlugin subscribed to "system.metrics.updated".');
      return;
    }

    // Load Chart.js from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js';
    script.onload = () => {
      this.board.log('📊 Chart.js loaded successfully.');
      setTimeout(() => {
        if (window.Chart) {
          this._createChartUI();
          this.subscribe('Notice', 'system.metrics.updated', this.handleMetricsUpdate.bind(this));
          this.board.log('➕ ChartDisplayPlugin subscribed to "system.metrics.updated".');
        } else {
          this.board.log('❌ Chart.js failed to load properly.');
        }
      }, 100);
    };
    script.onerror = () => {
      this.board.log('❌ Failed to load Chart.js from CDN.');
      this._createFallbackUI();
    };
    document.head.appendChild(script);
  }

  _createFallbackUI() {
    const errorMsg = document.createElement('div');
    errorMsg.textContent = '❌ Chart.js failed to load. Showing text-only metrics.';
    errorMsg.style.color = 'red';
    errorMsg.style.textAlign = 'center';
    errorMsg.style.padding = '20px';
    this.containerElement.appendChild(errorMsg);

    // Create metrics display area for fallback
    this.metricsDisplay = document.createElement('div');
    this.metricsDisplay.style.display = 'grid';
    this.metricsDisplay.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
    this.metricsDisplay.style.gap = '15px';
    this.metricsDisplay.style.marginTop = '20px';
    this.containerElement.appendChild(this.metricsDisplay);

    this.subscribe('Notice', 'system.metrics.updated', this.handleMetricsUpdate.bind(this));
    this.board.log('➕ ChartDisplayPlugin subscribed to "system.metrics.updated" (fallback mode).');
  }

  _createChartUI() {
    // Create title
    const title = document.createElement('h2');
    title.textContent = '📊 Real-time System Monitor';
    title.style.textAlign = 'center';
    title.style.marginBottom = '20px';
    title.style.color = '#333';
    this.containerElement.appendChild(title);

    // Create metrics display area
    this.metricsDisplay = document.createElement('div');
    this.metricsDisplay.style.display = 'grid';
    this.metricsDisplay.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
    this.metricsDisplay.style.gap = '15px';
    this.metricsDisplay.style.marginBottom = '20px';
    this.containerElement.appendChild(this.metricsDisplay);

    // Create canvas for chart
    this.canvas = document.createElement('canvas'); // Store reference to canvas
    this.canvas.id = 'metrics-chart';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '300px';
    this.canvas.style.border = '1px solid #ccc';
    this.canvas.style.marginTop = '20px';

    if (this.containerElement) {
      this.containerElement.appendChild(this.canvas);
    } else {
      this.board.log('❌ Error: Container element not provided for chart.');
      return;
    }

    const ctx = this.canvas.getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.labels,
        datasets: [
          {
            label: 'CPU Usage (%)',
            data: this.cpuData,
            borderColor: '#ff6b6b',
            backgroundColor: 'rgba(255, 107, 107, 0.1)',
            tension: 0.1,
            fill: true
          },
          {
            label: 'Network Speed (Mbps)',
            data: this.networkSpeedData,
            borderColor: '#4ecdc4',
            backgroundColor: 'rgba(78, 205, 196, 0.1)',
            tension: 0.1,
            fill: true
          },
          {
            label: 'Network RTT (ms)',
            data: this.rttData,
            borderColor: '#45b7d1',
            backgroundColor: 'rgba(69, 183, 209, 0.1)',
            tension: 0.1,
            fill: true,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'CPU (%) / Network Speed (Mbps)'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'RTT (ms)'
            },
            grid: {
              drawOnChartArea: false,
            },
          }
        }
      }
    });
  }

  handleMetricsUpdate(message) {
    const metrics = message.payload;
    const now = new Date();
    const timeLabel = `${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    // Update metrics display cards
    this._updateMetricsDisplay(metrics);

    // Only update chart if it exists
    if (this.chart) {
      // Update chart data
      this.labels.push(timeLabel);
      this.cpuData.push(parseFloat(metrics.cpu) || 0);
      this.networkSpeedData.push(parseFloat(metrics.networkSpeed) || 0);
      this.rttData.push(parseFloat(metrics.rtt) || 0);

      // Trim old data
      if (this.labels.length > this.maxDataPoints) {
        this.labels.shift();
        this.cpuData.shift();
        this.networkSpeedData.shift();
        this.rttData.shift();
      }

      this.chart.update('none'); // Use 'none' for performance
    }
  }

  _updateMetricsDisplay(metrics) {
    this.metricsDisplay.innerHTML = '';

    const cards = [
      {
        title: '🌐 Network Type',
        value: metrics.networkType || 'Unknown',
        color: '#4ecdc4'
      },
      {
        title: '⬇️ Downlink Speed',
        value: `${metrics.downlink || 0} Mbps`,
        color: '#45b7d1'
      },
      {
        title: '⏱️ Round Trip Time',
        value: `${metrics.rtt || 0} ms`,
        color: '#96ceb4'
      },
      {
        title: '🧠 JS Heap Used',
        value: `${metrics.jsHeapSize || 'N/A'} MB`,
        color: '#ff6b6b'
      },
      {
        title: '🔧 CPU Cores',
        value: `${metrics.connectionCount || 'N/A'}`,
        color: '#f39c12'
      },
      {
        title: '⚡ Current Speed',
        value: `${metrics.networkSpeed || 0} Mbps`,
        color: '#9b59b6'
      }
    ];

    cards.forEach(card => {
      const cardEl = document.createElement('div');
      cardEl.style.padding = '15px';
      cardEl.style.backgroundColor = 'white';
      cardEl.style.border = `3px solid ${card.color}`;
      cardEl.style.borderRadius = '10px';
      cardEl.style.textAlign = 'center';
      cardEl.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';

      const title = document.createElement('div');
      title.textContent = card.title;
      title.style.fontSize = '14px';
      title.style.fontWeight = 'bold';
      title.style.color = card.color;
      title.style.marginBottom = '5px';

      const value = document.createElement('div');
      value.textContent = card.value;
      value.style.fontSize = '18px';
      value.style.fontWeight = 'bold';
      value.style.color = '#333';

      cardEl.appendChild(title);
      cardEl.appendChild(value);
      this.metricsDisplay.appendChild(cardEl);
    });
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
