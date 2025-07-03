// examples/demos/system_monitor_demo.js
import { board } from '/voidcore.js/src/core.js';
import { SystemMetricsPlugin } from '/voidcore.js/plugins/system_metrics.js';
import { ChartDisplayPlugin } from '/voidcore.js/plugins/chart_display.js';

let systemMetricsPluginInstance = null;
let chartDisplayPluginInstance = null;

export async function runDemo(container) {
  board.log('--- Loading Real-time System Monitor demo ---');

  // Clear the container for this demo
  if (container) {
    container.innerHTML = '';
  }

  // Initialize plugins
  const { init: initSystemMetrics } = await import('/voidcore.js/plugins/system_metrics.js');
  systemMetricsPluginInstance = initSystemMetrics();

  const { init: initChartDisplay } = await import('/voidcore.js/plugins/chart_display.js');
  chartDisplayPluginInstance = initChartDisplay(container);

  // Return an object with a cleanup method
  return {
    cleanup: () => {
      board.log('--- Cleaning up Real-time System Monitor demo ---');
      if (systemMetricsPluginInstance) systemMetricsPluginInstance.retire();
      if (chartDisplayPluginInstance) chartDisplayPluginInstance.retire();
      if (container) container.innerHTML = ''; // Clear UI
    }
  };
}
