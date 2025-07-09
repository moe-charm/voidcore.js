// Plugin Samples Index
// Central import point for all plugin.json samples

// 動的に読み込むプラグインファイル一覧
const pluginFiles = [
  'ui-button-plugin.vplugin.json',
  'logic-calculator-plugin.vplugin.json',
  'data-json-parser-plugin.vplugin.json',
  'network-http-client-plugin.vplugin.json',
  'visualization-chart-plugin.vplugin.json',
  'media-image-processor-plugin.vplugin.json',
  'utility-string-helper-plugin.vplugin.json',
  'ai-text-generator-plugin.vplugin.json',
  'storage-database-plugin.vplugin.json',
  'workflow-automation-plugin.vplugin.json'
];

// プラグインデータを動的に読み込む
async function loadPluginSamples() {
  const plugins = {};
  
  for (const file of pluginFiles) {
    try {
      const response = await fetch(`/plugins/samples/${file}`);
      if (!response.ok) {
        console.warn(`Failed to load plugin: ${file}`);
        continue;
      }
      
      const pluginData = await response.json();
      const key = file.replace('.vplugin.json', '').replace(/-/g, '');
      plugins[key] = pluginData;
      
    } catch (error) {
      console.error(`Error loading plugin ${file}:`, error);
    }
  }
  
  return plugins;
}

// プラグインサンプルを読み込み
let pluginSamples = {};
let allPlugins = [];
let pluginsByCategory = {};
let pluginsByPriority = { high: [], medium: [], low: [] };

// 初期化関数
async function initializePluginSamples() {
  try {
    pluginSamples = await loadPluginSamples();
    allPlugins = Object.values(pluginSamples);
    
    // カテゴリ別に整理
    pluginsByCategory = {};
    allPlugins.forEach(plugin => {
      if (!pluginsByCategory[plugin.category]) {
        pluginsByCategory[plugin.category] = [];
      }
      pluginsByCategory[plugin.category].push(plugin);
    });
    
    // 優先度別に整理
    pluginsByPriority = { high: [], medium: [], low: [] };
    allPlugins.forEach(plugin => {
      if (pluginsByPriority[plugin.priority]) {
        pluginsByPriority[plugin.priority].push(plugin);
      }
    });
    
    console.log('📦 Plugin samples loaded:', Object.keys(pluginSamples).length);
    return true;
    
  } catch (error) {
    console.error('Failed to initialize plugin samples:', error);
    return false;
  }
}

// 初期化完了を待つPromise
const initializationPromise = initializePluginSamples();

/**
 * 📦 Plugin Samples Collection
 * 
 * All 10 sample plugins organized by category
 */
export { pluginSamples };

/**
 * 📋 Plugins organized by category
 */
export { pluginsByCategory };

/**
 * 🎯 Plugins organized by priority
 */
export { pluginsByPriority };

/**
 * 🏷️ All plugins as a flat array
 */
export { allPlugins };

/**
 * 📊 Plugin statistics
 */
export function getPluginStats() {
  return {
    total: allPlugins.length,
    byCategory: Object.keys(pluginsByCategory).reduce((acc, category) => {
      acc[category] = pluginsByCategory[category].length;
      return acc;
    }, {}),
    byPriority: Object.keys(pluginsByPriority).reduce((acc, priority) => {
      acc[priority] = pluginsByPriority[priority].length;
      return acc;
    }, {})
  };
}

/**
 * 🔍 Search plugins by tag
 */
export function searchPluginsByTag(tag) {
  return allPlugins.filter(plugin => 
    plugin.tags.includes(tag) || 
    plugin.attributes.tags.includes(tag)
  );
}

/**
 * 🎨 Get plugins by category
 */
export function getPluginsByCategory(category) {
  return pluginsByCategory[category] || [];
}

/**
 * 🎯 Get plugins by priority
 */
export function getPluginsByPriority(priority) {
  return pluginsByPriority[priority] || [];
}

/**
 * 📝 Get plugin by ID
 */
export function getPluginById(id) {
  return allPlugins.find(plugin => plugin.id === id);
}

/**
 * 🔍 Advanced search with multiple filters
 */
export function searchPlugins(filters = {}) {
  let results = allPlugins;
  
  if (filters.category) {
    results = results.filter(plugin => plugin.category === filters.category);
  }
  
  if (filters.priority) {
    results = results.filter(plugin => plugin.priority === filters.priority);
  }
  
  if (filters.tags && filters.tags.length > 0) {
    results = results.filter(plugin => 
      filters.tags.some(tag => 
        plugin.tags.includes(tag) || 
        plugin.attributes.tags.includes(tag)
      )
    );
  }
  
  if (filters.experimental !== undefined) {
    results = results.filter(plugin => plugin.attributes.experimental === filters.experimental);
  }
  
  if (filters.performance) {
    results = results.filter(plugin => {
      const perf = plugin.performance;
      return (
        (!filters.performance.memory || perf.memory === filters.performance.memory) &&
        (!filters.performance.cpu || perf.cpu === filters.performance.cpu) &&
        (!filters.performance.network || perf.network === filters.performance.network)
      );
    });
  }
  
  return results;
}

// Default export
export default pluginSamples;

// 初期化完了を待つPromise
export { initializationPromise };

console.log('📦 Plugin Samples module loaded!');