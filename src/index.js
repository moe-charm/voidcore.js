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

console.log('🌟 VoidCore v14.0 - Pure Message-Based System Loaded!');