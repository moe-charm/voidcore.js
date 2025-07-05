// office-main.js - VoidCore Network Office の中央制御システム
console.log('🚀 office-main.js loading...');

import { board } from '../../src/core.js';
console.log('📋 board imported:', board);

import { voidCore } from '../../src/voidcore.js';
console.log('🌟 voidCore imported:', voidCore);

import { Message } from '../../src/message.js';
console.log('📨 Message imported:', Message);

// Office Plugins
import { SystemObserverPlugin } from './office-plugins/system-observer.js';
console.log('🔍 SystemObserverPlugin imported:', SystemObserverPlugin);

import { BulletinBoardPlugin } from './office-plugins/bulletin-board.js';
console.log('📢 BulletinBoardPlugin imported:', BulletinBoardPlugin);

import { IntentLauncherPlugin } from './office-plugins/intent-launcher.js';
console.log('🎯 IntentLauncherPlugin imported:', IntentLauncherPlugin);

import { ChatNotifierPlugin } from './office-plugins/chat-notifier.js';
console.log('💬 ChatNotifierPlugin imported:', ChatNotifierPlugin);

import { DocFeedPlugin } from './office-plugins/doc-feed.js';
console.log('📄 DocFeedPlugin imported:', DocFeedPlugin);

class VoidCoreOfficeOrchestrator {
  constructor() {
    this.plugins = new Map();
    this.isInitialized = false;
    this.demoMode = true; // Enable demo features
    this.startTime = Date.now();
  }

  async initialize() {
    console.log('🌟 VoidCore Network Office - Initializing Revolutionary Intranet');
    
    // Setup logging
    console.log('📝 Setting up logging...');
    this.setupLogging();
    console.log('📝 Logging setup complete');
    
    // Initialize all office plugins
    console.log('🔌 About to call initializePlugins...');
    await this.initializePlugins();
    console.log('🔌 initializePlugins completed');
    
    // Setup global event handlers
    this.setupGlobalHandlers();
    
    // Start demo sequence if enabled
    if (this.demoMode) {
      this.startDemoSequence();
    }
    
    this.isInitialized = true;
    this.log('🚀 VoidCore Network Office is fully operational!');
    
    // Welcome message and system status
    this.displayWelcomeMessage();
  }

  setupLogging() {
    // Create a global log area if needed
    if (!document.getElementById('global-system-log')) {
      const logArea = document.createElement('div');
      logArea.id = 'global-system-log';
      logArea.style.display = 'none'; // Hidden by default, can be shown for debugging
      document.body.appendChild(logArea);
    }
    
    // Set up VoidCore and board logging
    const logElement = document.getElementById('global-system-log');
    board.setLogElement(logElement);
    voidCore.setLogElement(logElement);
  }

  async initializePlugins() {
    console.log('🔌 initializePlugins() called');
    this.log('🔌 Initializing autonomous office plugins...');
    
    try {
      console.log('🔌 Starting plugin initialization sequence...');
      // Initialize plugins in specific order for optimal experience
      
      // 1. Intent Launcher FIRST (user interface priority)
      console.log('🎯 About to start IntentLauncher...');
      this.log('🎯 Starting IntentLauncher...');
      const intentLauncher = new IntentLauncherPlugin();
      console.log('🎯 IntentLauncher instance created:', intentLauncher);
      this.plugins.set('intentLauncher', intentLauncher);
      console.log('🎯 About to call intentLauncher.start()...');
      await intentLauncher.start();
      console.log('🎯 IntentLauncher.start() completed');
      
      // ONLY DocFeed for now - minimal test
      console.log('⏰ Proceeding with DocFeed only for testing...');
      
      // DocFeed ONLY (most important for Project Phoenix demo)
      try {
        console.log('📄 About to start DocFeed (ONLY test)...');
        this.log('📄 Starting DocFeed...');
        const docFeed = new DocFeedPlugin();
        console.log('📄 DocFeed instance created:', docFeed);
        this.plugins.set('docFeed', docFeed);
        console.log('📄 About to call docFeed.start()...');
        await docFeed.start();
        console.log('📄 DocFeed.start() completed successfully!');
      } catch (docFeedError) {
        console.error('❌ DocFeed initialization error:', docFeedError);
        console.error('❌ DocFeed error stack:', docFeedError.stack);
      }
      
      console.log('✅ Test phase complete - only IntentLauncher and DocFeed loaded');
      
      this.log('✅ All plugins initialized successfully');
      console.log('✅ Plugin initialization sequence completed');
      
      // Skip final wait to prevent auto-reload issues
      console.log('✅ Skipping final subscription wait to prevent reload');
      
    } catch (error) {
      console.error('❌ Plugin initialization error:', error);
      console.error('❌ Full error stack:', error.stack);
      this.log(`❌ Plugin initialization failed: ${error.message}`);
    }
  }

  setupGlobalHandlers() {
    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+D: Demo mode
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        this.triggerDemoSequence();
      }
      
      // Ctrl+Shift+S: System stats
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        this.showSystemStats();
      }
    });
    
    // Global click tracking for demo purposes
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('intent-button')) {
        this.trackUserInteraction('intent_button_click', e.target.textContent);
      }
    });
    
    // Window resize handler for responsive canvas
    window.addEventListener('resize', () => {
      const systemObserver = this.plugins.get('systemObserver');
      if (systemObserver && systemObserver.canvas) {
        systemObserver.canvas.width = systemObserver.canvas.parentElement.clientWidth;
        systemObserver.canvas.height = systemObserver.canvas.parentElement.clientHeight;
      }
    });
  }

  startDemoSequence() {
    this.log('🎭 Demo mode activated - preparing showcase sequence');
    
    // Demo sequence: Automatic actions to showcase the system
    setTimeout(() => {
      this.log('🎬 Demo: Welcome sequence starting...');
      this.publishWelcomeNotices();
    }, 2000);
    
    // Show system capabilities after welcome
    setTimeout(() => {
      this.log('🎬 Demo: Showcasing system capabilities...');
      this.demonstrateSystemCapabilities();
    }, 5000);
    
    // Optional: Auto-trigger main demo after delay
    setTimeout(() => {
      if (this.demoMode) {
        this.log('🎬 Demo: Auto-triggering Project Phoenix query...');
        this.triggerProjectPhoenixDemo();
      }
    }, 8000);
  }

  async publishWelcomeNotices() {
    // System startup notices
    await voidCore.publish(Message.notice('system.startup', {
      message: 'VoidCore Network Office v11.0 is now online',
      timestamp: Date.now(),
      plugins_loaded: this.plugins.size
    }).withSource('OfficeOrchestrator'));
    
    await voidCore.publish(Message.notice('user.session_started', {
      user: 'Alex Chen',
      role: 'New Employee',
      department: 'Engineering',
      timestamp: Date.now()
    }).withSource('OfficeOrchestrator'));
  }

  async demonstrateSystemCapabilities() {
    // Showcase autonomous plugin communication
    await voidCore.publish(Message.notice('system.demo', {
      message: 'Demonstrating autonomous plugin collaboration',
      feature: 'inter_plugin_communication',
      participants: Array.from(this.plugins.keys())
    }).withSource('OfficeOrchestrator'));
  }

  async triggerProjectPhoenixDemo() {
    // Simulate the main demo: Project Phoenix information request
    const intentLauncher = this.plugins.get('intentLauncher');
    if (intentLauncher) {
      await intentLauncher.launchIntent({
        title: 'Get Project Phoenix Info (Auto Demo)',
        intent: 'project.query',
        payload: { 
          project: 'Phoenix', 
          priority: 'high', 
          requester: 'Demo System',
          auto_demo: true 
        },
        icon: '🔍'
      });
    }
  }

  triggerDemoSequence() {
    this.log('🎪 Manual demo sequence triggered');
    this.triggerProjectPhoenixDemo();
  }

  showSystemStats() {
    const stats = voidCore.getStats();
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    
    console.group('📊 VoidCore Network Office Statistics');
    console.log(`⏱️ Uptime: ${uptime} seconds`);
    console.log(`🔌 Active Plugins: ${this.plugins.size}`);
    console.log(`📡 Message Types: ${stats.messageTypes}`);
    console.log(`👥 Total Subscribers: ${stats.totalSubscribers}`);
    console.log(`🔄 VoidCore Status: ${this.isInitialized ? 'ACTIVE' : 'INITIALIZING'}`);
    
    if (stats.subscriptions.length > 0) {
      console.log('📋 Subscription Details:');
      stats.subscriptions.forEach(sub => {
        console.log(`  📥 ${sub.type}: ${sub.subscriberCount} subscribers`);
      });
    }
    
    console.log('🔌 Plugin Status:');
    this.plugins.forEach((plugin, name) => {
      console.log(`  ${plugin.currentPhase === 'work' ? '🟢' : '🟡'} ${name}: ${plugin.currentPhase}`);
    });
    
    console.groupEnd();
    
    this.log(`📊 System stats logged to console (plugins: ${this.plugins.size}, subscribers: ${stats.totalSubscribers})`);
  }

  trackUserInteraction(type, details) {
    voidCore.publish(Message.notice('user.interaction', {
      interaction_type: type,
      details: details,
      timestamp: Date.now(),
      user: 'Alex Chen'
    }).withSource('OfficeOrchestrator'));
  }

  displayWelcomeMessage() {
    // Update page title to show it's running
    document.title = '✅ VoidCore Network Office - LIVE';
    
    // Add a subtle indicator that the system is running
    const header = document.querySelector('.office-header');
    if (header) {
      const indicator = document.createElement('div');
      indicator.className = 'system-status-indicator';
      indicator.innerHTML = '🟢 LIVE';
      indicator.style.cssText = `
        position: absolute;
        top: 10px;
        right: 20px;
        background: rgba(40, 167, 69, 0.9);
        color: white;
        padding: 5px 10px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: bold;
        animation: pulse 2s infinite;
      `;
      header.style.position = 'relative';
      header.appendChild(indicator);
    }
  }

  async shutdown() {
    this.log('🔄 Shutting down VoidCore Network Office...');
    
    // Gracefully retire all plugins
    for (const [name, plugin] of this.plugins) {
      try {
        this.log(`🔌 Retiring ${name}...`);
        await plugin.retire();
      } catch (error) {
        console.error(`Error retiring ${name}:`, error);
      }
    }
    
    this.plugins.clear();
    this.isInitialized = false;
    this.log('👋 VoidCore Network Office shutdown complete');
  }

  log(message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] 🏢 Office: ${message}`);
  }
}

// Initialize the VoidCore Network Office when page loads
const officeOrchestrator = new VoidCoreOfficeOrchestrator();

// 重複実行防止と安全な初期化
if (!window.voidCoreOfficeInitialized) {
  window.voidCoreOfficeInitialized = true;
  console.log('🚀 Starting SINGLE initialization...');

  // 即座に利用可能にする
  window.voidCoreOffice = officeOrchestrator;

  // 非同期で初期化（ブロッキングしない）
  setTimeout(async () => {
    try {
      await officeOrchestrator.initialize();
      console.log('🌟 VoidCore Network Office is ready for demo!');
      console.log('💡 Press Ctrl+Shift+D to trigger demo sequence');
      console.log('📊 Press Ctrl+Shift+S to show system statistics');
    } catch (error) {
      console.error('Failed to initialize VoidCore Network Office:', error);
    }
  }, 100); // 100ms遅延でリロード回避
} else {
  console.log('⚠️ VoidCore Office already initialized, skipping...');
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  officeOrchestrator.shutdown();
});

// Export for module use
export { officeOrchestrator };