# 📦 Plugin.json Samples

This directory contains 10 sample plugin.json files for the VoidFlow palette system.

## 📁 Sample Files

| Plugin | Category | Priority | Description |
|--------|----------|----------|-------------|
| **🔘 Interactive Button** | UI | High | Multi-purpose interactive button with customizable actions |
| **🧮 Math Calculator** | Logic | Medium | Advanced mathematical calculator with functions |
| **📊 JSON Parser** | Data | High | Parse, transform, and validate JSON data |
| **🌐 HTTP Client** | Network | High | Full-featured HTTP client with REST API support |
| **📈 Interactive Chart** | Visualization | Medium | Beautiful interactive charts with real-time updates |
| **🖼️ Image Processor** | Media | Medium | Advanced image processing with filters and transformations |
| **🔤 String Helper** | Utility | Low | Comprehensive string manipulation utilities |
| **🤖 AI Text Generator** | AI | High | AI-powered text generation with multiple models |
| **💾 Database Storage** | Storage | Medium | Universal database adapter with query builder |
| **⚡ Workflow Automation** | Workflow | High | Complex automated workflows with conditions |

## 📋 Plugin Categories

- **UI** (1 plugin) - User interface components
- **Logic** (1 plugin) - Mathematical and logical operations
- **Data** (1 plugin) - Data processing and transformation
- **Network** (1 plugin) - Network communication
- **Visualization** (1 plugin) - Data visualization and charts
- **Media** (1 plugin) - Media processing and manipulation
- **Utility** (1 plugin) - General utility functions
- **AI** (1 plugin) - AI and machine learning
- **Storage** (1 plugin) - Data storage and persistence
- **Workflow** (1 plugin) - Process automation

## 🎯 Priority Distribution

- **High Priority**: 5 plugins (Button, JSON Parser, HTTP Client, AI Text Generator, Workflow Automation)
- **Medium Priority**: 4 plugins (Calculator, Chart, Image Processor, Database Storage)
- **Low Priority**: 1 plugin (String Helper)

## 🏷️ Common Tags

- `ui`, `interactive`, `button`, `click`
- `math`, `calculator`, `computation`
- `json`, `data`, `transform`, `validate`
- `http`, `api`, `rest`, `network`
- `chart`, `visualization`, `realtime`
- `image`, `processing`, `filter`
- `string`, `text`, `format`
- `ai`, `generation`, `nlp`
- `database`, `storage`, `sql`
- `workflow`, `automation`, `schedule`

## 🔧 Usage

These samples can be used to:
1. Test the plugin palette system
2. Demonstrate different plugin categories
3. Showcase plugin attribute system
4. Validate JSON serialization/deserialization
5. Test filtering and search functionality

## 🚀 Integration

To use these samples in the palette system:

```javascript
// Load all samples
const samples = await Promise.all([
  import('./ui-button-plugin.vplugin.json'),
  import('./logic-calculator-plugin.vplugin.json'),
  import('./data-json-parser-plugin.vplugin.json'),
  // ... more samples
]);

// Add to palette
samples.forEach(sample => {
  paletteManager.addPlugin(sample);
});
```

These samples provide a comprehensive foundation for testing and developing the VoidFlow palette system!