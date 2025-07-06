// VoidCore v14.0 - 純粋メッセージベースシステム
// セリンの大改革完了版

export { voidCore } from './voidcore.js';
export { Message } from './message.js';
export { 
  createPlugin,
  createComfortablePlugin,
  registerHealthCheck,
  declareProcess
} from './pure_plugin_system.js';

// 後方互換性（legacy フォルダへの参照）
export { AutonomousPlugin } from './legacy/autonomous_plugin.js';
export { CachedAutonomousPlugin } from './legacy/cached_autonomous_plugin.js';

// v14.0: CoreFusion v1.2 & SimpleMessagePool
export { CoreFusion, coreFusion } from './core-fusion.js';
export { SimpleMessagePool, simpleMessagePool } from './simple-message-pool.js';

// v14.0: VoidIDE Genesis - Self-Creating IDE
export { VoidIDEGenesis } from './void-ide-genesis.js';
export { MonacoIntegration } from './monaco-integration.js';

// v14.0: VoidIDE Genesis Phase 2 - Advanced Analytics & Visualization
export { MessageFlowVisualizer } from './message-flow-visualizer.js';
export { PluginMonitorDashboard } from './plugin-monitor-dashboard.js';
export { PerformanceMetricsSystem } from './performance-metrics-system.js';

// v14.0: VoidIDE Genesis Phase 3 - Project Management
export { ProjectManager } from './project-manager.js';

console.log('🌟 VoidCore v14.0 - Pure Message-Based System Loaded!');