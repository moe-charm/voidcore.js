// VoidCore v14.0 - 純粋メッセージベースシステム
// セリンの大改革完了版

export { VoidCore } from './core/nyacore.js';
export { Message } from './messaging/message.js';
// レガシーpure_plugin_system.js削除 - IPluginパターンに完全移行
// export { createPlugin, createComfortablePlugin, registerHealthCheck, declareProcess } from './legacy/pure_plugin_system.js';

// 後方互換性export削除完了 - ローカルVoidCoreコピー戦略により不要

// v14.0: CoreFusion v1.2 & SimpleMessagePool
export { CoreFusion, coreFusion } from './core/core-fusion.js';
export { SimpleMessagePool, simpleMessagePool } from './messaging/simple-message-pool.js';

// v14.0: VoidIDE Genesis - Self-Creating IDE
export { VoidIDEGenesis } from './experimental/void-ide-genesis.js';
export { MonacoIntegration } from './experimental/monaco-integration.js';

// v14.0: VoidIDE Genesis Phase 2 - Advanced Analytics & Visualization
export { MessageFlowVisualizer } from './utils/message-flow-visualizer.js';
export { PluginMonitorDashboard } from './experimental/plugin-monitor-dashboard.js';
export { PerformanceMetricsSystem } from './utils/performance-metrics-system.js';

// v14.0: VoidIDE Genesis Phase 3 - Project Management
export { ProjectManager } from './experimental/project-manager.js';

console.log('🌟 VoidCore v14.0 - Pure Message-Based System Loaded!');