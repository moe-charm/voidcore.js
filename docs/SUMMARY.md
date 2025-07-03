# 📚 VoidCore.js Documentation Summary

This document provides an overview and navigation guide to all VoidCore.js documentation after comprehensive reorganization (2025-07-03).

## 📖 Reading Order for Newcomers

**🎯 Start Here:**
1. [../README.md](../README.md) - Main overview and philosophy (English)
2. [../README.ja.md](../README.ja.md) - Main overview and philosophy (Japanese)
3. [../examples/index.html](../examples/index.html) - Interactive demo experience

**🔬 Deep Dive:**
4. [VoidCore_Architecture_Specification_v10.0.md](VoidCore_Architecture_Specification_v10.0.md) - Complete technical specification
5. [Message_Classification_Design_Phase1.8.md](Message_Classification_Design_Phase1.8.md) - Intent/Notice/Proposal system
6. [Plugin_Lifecycle_Guide.txt](Plugin_Lifecycle_Guide.txt) - Plugin development guide

**🧠 Philosophy:**
7. [Autonomous_Existence_Model_Theory.txt](Autonomous_Existence_Model_Theory.txt) - Core philosophical foundation

## 🏗️ Project Structure

**📁 Project Overview:**
- [../PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md) - Complete project organization guide

## 📂 Core Documentation

### 🎯 Essential Documents
- **[VoidCore_Architecture_Specification_v10.0.md](VoidCore_Architecture_Specification_v10.0.md)** - Master technical specification (v10.0)
- **[Message_Classification_Design_Phase1.8.md](Message_Classification_Design_Phase1.8.md)** - Message system design (Intent/Notice/Proposal)
- **[Autonomous_Existence_Model_Theory.txt](Autonomous_Existence_Model_Theory.txt)** - Philosophical foundation of autonomous plugins
- **[Plugin_Lifecycle_Guide.txt](Plugin_Lifecycle_Guide.txt)** - How to develop VoidCore plugins

## 🎮 Interactive Demos

### 🌟 6 High-Quality Demos
Located in `../examples/demos/`:

1. **VoidCore QuickStart** - Landing page showcasing all demos
2. **Message City** - Urban traffic simulation with emergency systems  
3. **Markdown Editor** - Real-time collaboration with message visualization
4. **Cogito Observer** - AI philosophical dialogue system
5. **Galaxy Viewer** - 3D space collision detection simulation
6. **System Monitor** - Real-time metrics dashboard with network monitoring

Access via: `http://localhost:8000/examples/index.html`

## 💬 Chatter & Casual Notes

### 📁 Development Chatter (`chatter/`)

**AI Collaboration Sessions:**
- `chatter/chatgpt/` - ChatGPT brainstorming sessions (4 files)
- `chatter/gemini/` - Gemini design discussions (2 files)

**Random Development Notes:**
- `chatter/development/` - Various dev thoughts and experiments (7 files)

*Note: These files are preserved for historical reference but are not part of the active documentation.*

## 🧩 Plugin Architecture

### 🎯 Active Plugins (15 total)
Located in `../plugins/`:

**Core System:**
- `gui_voidcore_manager.js` - Main UI controller
- `system_metrics.js` - Real-time monitoring
- `chart_display.js` - Visualization engine

**Demo-Specific:**
- Message City: `traffic_light.js`, `city_vehicle.js`, `city_pedestrian.js`, `emergency_vehicle.js`
- Cogito Observer: `cogito.js`, `observer.js`
- Galaxy Viewer: `galaxy_viewer.js`, `collision_detector.js`
- Markdown Editor: `markdownrenderer.js`, `textinput.js`
- Common: `logger.js`

## 🔧 Development Resources

### 🚀 Getting Started
1. Clone repository
2. Run: `python3 -m http.server`
3. Open: `http://localhost:8000/examples/index.html`

### 📝 Contributing
- Follow patterns in existing plugins
- Use `AutonomousPlugin` base class
- Implement Intent/Notice/Proposal messaging
- Maintain demo quality standards

## 📊 Project Statistics

- **Total Active Files**: ~30
- **Chatter Files**: ~15  
- **Lines of Code**: ~3000+ (estimated)
- **Demos**: 6 high-quality demonstrations
- **Plugins**: 15 production-ready components
- **Documentation Languages**: English + Japanese

---

**📅 Last Updated**: 2025-07-03  
**🏷️ VoidCore Version**: 10.0  
**🧹 Cleanup Status**: Complete  
**📁 Organization**: Fully restructured  

For questions about VoidCore.js architecture or development, refer to the core specification document or explore the interactive demos.