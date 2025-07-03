# 📁 VoidCore.js Project Structure

This document outlines the organized structure of the VoidCore.js project after comprehensive cleanup and reorganization.

## 🏗️ Root Directory

```
voidcore-js/
├── 📄 README.md                    # Main documentation (English)
├── 📄 README.ja.md                 # Main documentation (Japanese)  
├── 📄 LICENSE                      # Apache License 2.0
├── 📄 PROJECT_STRUCTURE.md         # This file
├── 🐍 server.py                    # Python development server
├── 📁 src/                         # Core VoidCore system
├── 📁 plugins/                     # Plugin implementations
├── 📁 examples/                    # Demo applications
└── 📁 docs/                        # Documentation & archives
```

## 🧠 Core System (`src/`)

The heart of VoidCore's autonomous plugin architecture:

```
src/
├── core.js                         # CoreBulletinBoard implementation
├── autonomous_plugin.js            # Base class for plugins
└── cached_autonomous_plugin.js     # Cached variant (experimental)
```

## 🧩 Plugins (`plugins/`)

Production-ready plugins showcasing VoidCore capabilities:

```
plugins/
├── gui_voidcore_manager.js         # Main UI controller
├── system_metrics.js               # Real-time system monitoring
├── chart_display.js                # Chart visualization with Chart.js
├── logger.js                       # Logging service
├── markdownrenderer.js             # Markdown processing
├── textinput.js                    # Text input handling
├── observer.js                     # Generic observation patterns
├── cogito.js                       # AI dialogue system
├── galaxy_viewer.js                # 3D collision detection demo
├── collision_detector.js           # Physics collision system
├── traffic_light.js                # Traffic management
├── city_vehicle.js                 # Vehicle simulation
├── city_pedestrian.js              # Pedestrian simulation
└── emergency_vehicle.js            # Emergency response system
```

## 🎯 Examples & Demos (`examples/`)

Interactive demonstrations of VoidCore's power:

```
examples/
├── index.html                      # Main demo launcher
├── main.js                         # Demo initialization
└── demos/
    ├── voidcore_quickstart_demo.js # Landing page with all demos
    ├── message_city_demo.js        # Urban simulation
    ├── markdown_editor_demo.js     # Real-time collaboration
    ├── cogito_observer_demo.js     # AI philosophical dialogue  
    ├── galaxy_viewer_demo.js       # 3D space collision detection
    └── system_monitor_demo.js      # Real-time metrics dashboard
```

## 📚 Documentation (`docs/`)

### Core Documentation
```
docs/
├── SUMMARY.md                                    # Documentation overview
├── VoidCore_Architecture_Specification_v10.0.md # Technical specification
├── Message_Classification_Design_Phase1.8.md    # Message system design
├── Autonomous_Existence_Model_Theory.txt        # Philosophical foundation
├── Plugin_Lifecycle_Guide.txt                   # Plugin development guide
└── chatter/                                     # Casual development discussions
```

### Development Chatter & Casual Notes
```
docs/chatter/
├── chatgpt/                        # ChatGPT brainstorming sessions
│   ├── chatgpt.txt
│   ├── chatgptの怒り.txt
│   ├── chatgpt案.txt
│   └── chatgpt返信.txt
├── gemini/                         # Gemini design discussions  
│   ├── Gemini最終案_CoreBulletinBoard実装提案.txt
│   └── Gemini相談_メッセージ分類設計_Phase1.8.txt
└── development/                    # Random dev thoughts & experiments
    ├── demo.txt
    ├── text1.txt, text2.txt, text3.txt
    ├── テンプレートjs案.txt
    ├── 追加仕様2.txt
    └── 追加使用.txt
```

## 🎨 Demo Quality Standards

All demos in the `examples/demos/` directory meet high-quality standards:

- ✅ **Visual Appeal**: Beautiful, modern UI with animations
- ✅ **Educational Value**: Clearly demonstrates VoidCore concepts  
- ✅ **Message-Driven**: Uses Intent/Notice/Proposal architecture
- ✅ **Self-Contained**: Complete functionality within single file
- ✅ **Production Ready**: No prototype or incomplete code

## 🧹 Cleanup Actions Performed

### Removed Files
- Old demo files: `hello_world_demo.js`, `collaborative_whiteboard_demo.js`
- Test/debug files: `debug.html`, `test_split.*`
- Duplicate HTML files: `voidcore.html` (multiple copies)
- Unused plugins: `demo.js`, `hello.js`, `world.js`, `canvas_renderer.js`, `drawing_tool.js`
- Temporary directory: `tmp/`

### Reorganized Files  
- Development notes moved to `docs/chatter/`
- File names standardized to English
- Clear separation between active and casual content

## 🚀 Getting Started

1. **Clone the repository**
2. **Start local server**: `python3 -m http.server`
3. **Open**: `http://localhost:8000/examples/index.html`
4. **Explore**: Click through the 6 high-quality demos

## 📖 Documentation Reading Order

For newcomers to VoidCore:

1. `README.md` - Overview and philosophy
2. `examples/` - Interactive experience  
3. `docs/VoidCore_Architecture_Specification_v10.0.md` - Technical deep dive
4. `docs/Plugin_Lifecycle_Guide.txt` - Development guide
5. `src/` - Source code exploration

---

**Last Updated**: 2025-07-03  
**VoidCore Version**: 10.0  
**Total Files**: ~30 active, ~15 chatter  
**Lines of Code**: ~3000+ (estimated)
**Casual Notes**: ~15 chatter files