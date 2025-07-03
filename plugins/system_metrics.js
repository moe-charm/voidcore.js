// plugins/system_metrics.js
import { AutonomousPlugin } from '../src/autonomous_plugin.js';

export class SystemMetricsPlugin extends AutonomousPlugin {
  constructor() {
    super("SystemMetricsService");
    this.board.log('✅ SystemMetricsPlugin initialized.');
    this.intervalId = null;
    this._startMonitoring();
  }

  _startMonitoring() {
    this.board.log('📊 SystemMetricsPlugin: Starting monitoring...');
    this.intervalId = setInterval(() => {
      const cpuUsage = (Math.random() * 100).toFixed(2); // Simulate CPU usage 0-100%
      const memoryUsage = (Math.random() * 1024).toFixed(2); // Simulate Memory usage in MB

      const message = {
        type: 'Notice',
        source: this.capabilityName,
        event_name: 'system.metrics.updated',
        payload: {
          cpu: parseFloat(cpuUsage),
          memory: parseFloat(memoryUsage)
        },
        message_id: `notice-${Date.now()}`
      };
      this.publish(message);
      // this.board.log(`✉️ SystemMetricsPlugin published metrics: CPU ${cpuUsage}%, Mem ${memoryUsage}MB`);
    }, 1000); // Publish every 1 second
  }

  // Override retire to clear the interval
  retire() {
    super.retire();
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.board.log('📊 SystemMetricsPlugin: Stopped monitoring.');
    }
  }
}

export function init() {
  const instance = new SystemMetricsPlugin();
  instance._prepare(); // Explicitly call _prepare
  return instance;
}
