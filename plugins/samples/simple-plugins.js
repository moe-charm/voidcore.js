// simple-plugins.js - シンプルなプラグインサンプル
// エスケープシーケンス問題を回避するためJavaScriptファイルで提供

/**
 * 📦 シンプルなプラグインサンプル
 * JSONエラーを回避するためJavaScriptで定義
 */
export const simplePlugins = [
  {
    id: "ui-button-plugin",
    name: "Interactive Button",
    displayName: "🔘 Interactive Button",
    version: "1.2.0",
    author: "VoidFlow Team",
    description: "Multi-purpose interactive button with customizable actions and styling",
    category: "UI",
    tags: ["button", "interactive", "ui", "click", "action"],
    type: "ui.button",
    priority: "high",
    performance: {
      memory: "low",
      cpu: "low",
      network: "none"
    },
    attributes: {
      category: "UI",
      subcategory: "Input",
      tags: ["button", "interactive", "ui", "click", "action"],
      priority: "high",
      experimental: false,
      deprecated: false,
      hidden: false,
      performance: {
        memory: "low",
        cpu: "low",
        network: "none"
      },
      ui: {
        icon: "🔘",
        color: "#4fc1ff",
        size: "medium"
      },
      compatibility: {
        voidcore: "14.0+",
        browser: "modern",
        mobile: true
      }
    },
    config: {
      text: "Click Me",
      style: "primary",
      size: "medium"
    },
    inputs: [],
    outputs: [
      {
        name: "click",
        type: "event",
        description: "Emitted when button is clicked"
      }
    ],
    dependencies: []
  },
  
  {
    id: "logic-calculator-plugin",
    name: "Mathematical Calculator",
    displayName: "🧮 Math Calculator",
    version: "2.1.0",
    author: "VoidFlow Community",
    description: "Advanced mathematical calculator with support for complex expressions and functions",
    category: "Logic",
    tags: ["math", "calculator", "expression", "function", "computation"],
    type: "logic.calculator",
    priority: "medium",
    performance: {
      memory: "medium",
      cpu: "medium",
      network: "none"
    },
    attributes: {
      category: "Logic",
      subcategory: "Math",
      tags: ["math", "calculator", "expression", "function", "computation"],
      priority: "medium",
      experimental: false,
      deprecated: false,
      hidden: false,
      performance: {
        memory: "medium",
        cpu: "medium",
        network: "none"
      },
      ui: {
        icon: "🧮",
        color: "#f39c12",
        size: "medium"
      },
      compatibility: {
        voidcore: "14.0+",
        browser: "modern",
        mobile: true
      }
    },
    config: {
      precision: 10,
      angleMode: "radians"
    },
    inputs: [
      {
        name: "expression",
        type: "string",
        description: "Mathematical expression to evaluate"
      }
    ],
    outputs: [
      {
        name: "result",
        type: "number",
        description: "Calculation result"
      }
    ],
    dependencies: []
  },
  
  {
    id: "data-json-parser-plugin",
    name: "JSON Data Parser",
    displayName: "📊 JSON Parser",
    version: "1.5.2",
    author: "DataFlow Labs",
    description: "Parse, transform, and validate JSON data with advanced filtering and mapping capabilities",
    category: "Data",
    tags: ["json", "parser", "data", "transform", "validate", "filter"],
    type: "data.json",
    priority: "high",
    performance: {
      memory: "medium",
      cpu: "low",
      network: "none"
    },
    attributes: {
      category: "Data",
      subcategory: "Processing",
      tags: ["json", "parser", "data", "transform", "validate", "filter"],
      priority: "high",
      experimental: false,
      deprecated: false,
      hidden: false,
      performance: {
        memory: "medium",
        cpu: "low",
        network: "none"
      },
      ui: {
        icon: "📊",
        color: "#27ae60",
        size: "medium"
      },
      compatibility: {
        voidcore: "14.0+",
        browser: "modern",
        mobile: true
      }
    },
    config: {
      strictMode: false,
      allowComments: true
    },
    inputs: [
      {
        name: "jsonString",
        type: "string",
        description: "JSON string to parse"
      }
    ],
    outputs: [
      {
        name: "parsed",
        type: "object",
        description: "Parsed JSON object"
      }
    ],
    dependencies: []
  },
  
  {
    id: "network-http-client-plugin",
    name: "HTTP Client",
    displayName: "🌐 HTTP Client",
    version: "3.0.1",
    author: "NetFlow Systems",
    description: "Full-featured HTTP client with support for REST APIs, authentication, and request/response transformation",
    category: "Network",
    tags: ["http", "api", "rest", "client", "request", "response", "fetch"],
    type: "network.http",
    priority: "high",
    performance: {
      memory: "medium",
      cpu: "low",
      network: "high"
    },
    attributes: {
      category: "Network",
      subcategory: "HTTP",
      tags: ["http", "api", "rest", "client", "request", "response", "fetch"],
      priority: "high",
      experimental: false,
      deprecated: false,
      hidden: false,
      performance: {
        memory: "medium",
        cpu: "low",
        network: "high"
      },
      ui: {
        icon: "🌐",
        color: "#3498db",
        size: "medium"
      },
      compatibility: {
        voidcore: "14.0+",
        browser: "modern",
        mobile: true
      }
    },
    config: {
      timeout: 30000,
      retries: 3
    },
    inputs: [
      {
        name: "url",
        type: "string",
        description: "Request URL"
      }
    ],
    outputs: [
      {
        name: "response",
        type: "object",
        description: "HTTP response object"
      }
    ],
    dependencies: []
  },
  
  {
    id: "visualization-chart-plugin",
    name: "Interactive Chart",
    displayName: "📈 Interactive Chart",
    version: "2.3.0",
    author: "VizFlow Studios",
    description: "Create beautiful interactive charts with support for multiple chart types and real-time data updates",
    category: "Visualization",
    tags: ["chart", "graph", "visualization", "data", "interactive", "realtime"],
    type: "visualization.chart",
    priority: "medium",
    performance: {
      memory: "high",
      cpu: "medium",
      network: "none"
    },
    attributes: {
      category: "Visualization",
      subcategory: "Charts",
      tags: ["chart", "graph", "visualization", "data", "interactive", "realtime"],
      priority: "medium",
      experimental: false,
      deprecated: false,
      hidden: false,
      performance: {
        memory: "high",
        cpu: "medium",
        network: "none"
      },
      ui: {
        icon: "📈",
        color: "#9b59b6",
        size: "large"
      },
      compatibility: {
        voidcore: "14.0+",
        browser: "modern",
        mobile: false
      }
    },
    config: {
      type: "line",
      responsive: true
    },
    inputs: [
      {
        name: "data",
        type: "array",
        description: "Chart data array"
      }
    ],
    outputs: [
      {
        name: "rendered",
        type: "boolean",
        description: "Chart render completion"
      }
    ],
    dependencies: []
  },
  
  {
    id: "media-image-processor-plugin",
    name: "Image Processor",
    displayName: "🖼️ Image Processor",
    version: "1.8.0",
    author: "MediaFlow Team",
    description: "Advanced image processing with filters, transformations, and format conversion capabilities",
    category: "Media",
    tags: ["image", "processing", "filter", "resize", "crop", "transform", "canvas"],
    type: "media.image",
    priority: "medium",
    performance: {
      memory: "high",
      cpu: "high",
      network: "none"
    },
    attributes: {
      category: "Media",
      subcategory: "Image",
      tags: ["image", "processing", "filter", "resize", "crop", "transform", "canvas"],
      priority: "medium",
      experimental: false,
      deprecated: false,
      hidden: false,
      performance: {
        memory: "high",
        cpu: "high",
        network: "none"
      },
      ui: {
        icon: "🖼️",
        color: "#e74c3c",
        size: "large"
      },
      compatibility: {
        voidcore: "14.0+",
        browser: "modern",
        mobile: true
      }
    },
    config: {
      quality: 0.8,
      format: "jpeg"
    },
    inputs: [
      {
        name: "image",
        type: "file",
        description: "Input image file or data URL"
      }
    ],
    outputs: [
      {
        name: "processed",
        type: "string",
        description: "Processed image data URL"
      }
    ],
    dependencies: []
  },
  
  {
    id: "utility-string-helper-plugin",
    name: "String Helper",
    displayName: "🔤 String Helper",
    version: "1.4.1",
    author: "UtilFlow Labs",
    description: "Comprehensive string manipulation utilities including formatting, validation, and transformation",
    category: "Utility",
    tags: ["string", "text", "format", "validate", "transform", "regex"],
    type: "utility.string",
    priority: "low",
    performance: {
      memory: "low",
      cpu: "low",
      network: "none"
    },
    attributes: {
      category: "Utility",
      subcategory: "Text",
      tags: ["string", "text", "format", "validate", "transform", "regex"],
      priority: "low",
      experimental: false,
      deprecated: false,
      hidden: false,
      performance: {
        memory: "low",
        cpu: "low",
        network: "none"
      },
      ui: {
        icon: "🔤",
        color: "#95a5a6",
        size: "small"
      },
      compatibility: {
        voidcore: "14.0+",
        browser: "modern",
        mobile: true
      }
    },
    config: {
      locale: "en-US"
    },
    inputs: [
      {
        name: "text",
        type: "string",
        description: "Input text to process"
      }
    ],
    outputs: [
      {
        name: "result",
        type: "string",
        description: "Processed string result"
      }
    ],
    dependencies: []
  },
  
  {
    id: "ai-text-generator-plugin",
    name: "AI Text Generator",
    displayName: "🤖 AI Text Generator",
    version: "2.0.0",
    author: "AI Flow Labs",
    description: "Advanced AI-powered text generation with multiple models and customizable parameters",
    category: "AI",
    tags: ["ai", "text", "generation", "nlp", "gpt", "language", "model"],
    type: "ai.text",
    priority: "high",
    performance: {
      memory: "high",
      cpu: "medium",
      network: "high"
    },
    attributes: {
      category: "AI",
      subcategory: "Text",
      tags: ["ai", "text", "generation", "nlp", "gpt", "language", "model"],
      priority: "high",
      experimental: true,
      deprecated: false,
      hidden: false,
      performance: {
        memory: "high",
        cpu: "medium",
        network: "high"
      },
      ui: {
        icon: "🤖",
        color: "#ff6b6b",
        size: "large"
      },
      compatibility: {
        voidcore: "14.0+",
        browser: "modern",
        mobile: false
      }
    },
    config: {
      model: "gpt-3.5-turbo",
      maxTokens: 1000
    },
    inputs: [
      {
        name: "prompt",
        type: "string",
        description: "Text prompt for generation"
      }
    ],
    outputs: [
      {
        name: "generated",
        type: "string",
        description: "Generated text"
      }
    ],
    dependencies: []
  },
  
  {
    id: "storage-database-plugin",
    name: "Database Storage",
    displayName: "💾 Database Storage",
    version: "1.6.0",
    author: "DataFlow Systems",
    description: "Universal database adapter with support for multiple database types and query builders",
    category: "Storage",
    tags: ["database", "storage", "sql", "nosql", "query", "orm"],
    type: "storage.database",
    priority: "medium",
    performance: {
      memory: "medium",
      cpu: "low",
      network: "medium"
    },
    attributes: {
      category: "Storage",
      subcategory: "Database",
      tags: ["database", "storage", "sql", "nosql", "query", "orm"],
      priority: "medium",
      experimental: false,
      deprecated: false,
      hidden: false,
      performance: {
        memory: "medium",
        cpu: "low",
        network: "medium"
      },
      ui: {
        icon: "💾",
        color: "#34495e",
        size: "medium"
      },
      compatibility: {
        voidcore: "14.0+",
        browser: "modern",
        mobile: true
      }
    },
    config: {
      type: "sqlite",
      timeout: 30000
    },
    inputs: [
      {
        name: "query",
        type: "string",
        description: "Database query"
      }
    ],
    outputs: [
      {
        name: "result",
        type: "any",
        description: "Query result"
      }
    ],
    dependencies: []
  },
  
  {
    id: "workflow-automation-plugin",
    name: "Workflow Automation",
    displayName: "⚡ Workflow Automation",
    version: "1.9.0",
    author: "AutoFlow Systems",
    description: "Create and execute complex automated workflows with conditional logic and parallel execution",
    category: "Workflow",
    tags: ["workflow", "automation", "schedule", "trigger", "condition", "parallel"],
    type: "workflow.automation",
    priority: "high",
    performance: {
      memory: "medium",
      cpu: "medium",
      network: "low"
    },
    attributes: {
      category: "Workflow",
      subcategory: "Automation",
      tags: ["workflow", "automation", "schedule", "trigger", "condition", "parallel"],
      priority: "high",
      experimental: false,
      deprecated: false,
      hidden: false,
      performance: {
        memory: "medium",
        cpu: "medium",
        network: "low"
      },
      ui: {
        icon: "⚡",
        color: "#f1c40f",
        size: "medium"
      },
      compatibility: {
        voidcore: "14.0+",
        browser: "modern",
        mobile: true
      }
    },
    config: {
      maxConcurrentTasks: 5
    },
    inputs: [
      {
        name: "workflow",
        type: "object",
        description: "Workflow definition"
      }
    ],
    outputs: [
      {
        name: "completed",
        type: "object",
        description: "Workflow completed event"
      }
    ],
    dependencies: []
  }
];

// プラグインサンプルをマップ形式で提供
export const pluginSamples = {};
simplePlugins.forEach(plugin => {
  const key = plugin.id.replace(/-/g, '');
  pluginSamples[key] = plugin;
});

// カテゴリ別整理
export const pluginsByCategory = {};
simplePlugins.forEach(plugin => {
  if (!pluginsByCategory[plugin.category]) {
    pluginsByCategory[plugin.category] = [];
  }
  pluginsByCategory[plugin.category].push(plugin);
});

// 優先度別整理
export const pluginsByPriority = {
  high: [],
  medium: [],
  low: []
};

simplePlugins.forEach(plugin => {
  if (pluginsByPriority[plugin.priority]) {
    pluginsByPriority[plugin.priority].push(plugin);
  }
});

// 全プラグイン
export const allPlugins = simplePlugins;

// 統計情報
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

// 検索機能
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
  
  return results;
}

// その他の関数
export function searchPluginsByTag(tag) {
  return allPlugins.filter(plugin => 
    plugin.tags.includes(tag) || 
    plugin.attributes.tags.includes(tag)
  );
}

export function getPluginsByCategory(category) {
  return pluginsByCategory[category] || [];
}

export function getPluginsByPriority(priority) {
  return pluginsByPriority[priority] || [];
}

export function getPluginById(id) {
  return allPlugins.find(plugin => plugin.id === id);
}

console.log('📦 Simple Plugin Samples loaded:', allPlugins.length);