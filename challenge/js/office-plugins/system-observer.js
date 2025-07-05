// SystemObserverPlugin - VoidCore Network の心臓部を可視化
import { AutonomousPlugin } from '../../../src/autonomous_plugin.js';
import { Message } from '../../../src/message.js';

export class SystemObserverPlugin extends AutonomousPlugin {
  constructor() {
    super("SystemObserver");
    this.role = "system_observer";
    this.observedMessages = [];
    this.pluginPositions = new Map();
    this.canvas = null;
    this.ctx = null;
    this.animationId = null;
    this.particles = [];
    this.messageLog = [];
  }

  // Phase 1: Preparation - Canvas setup
  async _prepare() {
    const container = document.getElementById('system-observer-container');
    if (!container) {
      this.log('⚠️ SystemObserver container not found');
      return;
    }

    // Create canvas for visualization
    this.canvas = document.createElement('canvas');
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';
    
    this.ctx = this.canvas.getContext('2d');
    container.appendChild(this.canvas);

    // Setup plugin positions (virtual network nodes)
    this.setupPluginNetwork();
    
    // Create message log overlay
    this.createMessageLogOverlay(container);

    this.log('🖥️ System visualization canvas ready');
  }

  // Phase 3: Observation - Monitor all message types
  async _observe() {
    console.log('[SystemObserver] _observe() called');
    try {
      // Subscribe to ALL message types to observe the entire system
      console.log('[SystemObserver] Subscribing to message types...');
      this.subscribeToType('project.query');
      this.subscribeToType('document.update');
      this.subscribeToType('chat.notification');
      this.subscribeToType('system.info');
      this.subscribeToType('plugin.debut');
      this.subscribeToType('plugin.retirement');
      console.log('[SystemObserver] All subscriptions complete');

      // Override the global message handler to catch EVERYTHING
      console.log('[SystemObserver] Setting up global message handler...');
      const originalHandler = this.globalMessageHandler;
      this.globalMessageHandler = (msg) => {
        this.visualizeMessage(msg);
        originalHandler(msg);
      };
      console.log('[SystemObserver] Global message handler setup complete');

      this.log('👁️ Monitoring entire VoidCore Network');
      console.log('[SystemObserver] _observe() completed successfully');
    } catch (error) {
      console.error('[SystemObserver] Error in _observe():', error);
      throw error;
    }
  }

  // Phase 4: Work - Continuous visualization
  async _work() {
    // 初回のみログ出力とアニメーション開始
    if (!this.workStarted) {
      console.log('[SystemObserver] _work() starting continuous rendering...');
      this.workStarted = true;
      this.startRenderLoop();
    }
  }
  
  // 分離されたレンダリングループ - メインスレッドをブロックしない
  startRenderLoop() {
    const renderFrame = () => {
      try {
        if (this.canvas && this.isActive) {
          this.renderVisualization();
        }
        // 次のフレームをスケジュール（条件付きで継続）
        if (this.isActive) {
          this.animationId = requestAnimationFrame(renderFrame);
        }
      } catch (error) {
        console.error('[SystemObserver] Error in render loop:', error);
        // エラー時は少し待ってから再開
        setTimeout(() => {
          if (this.isActive) {
            this.animationId = requestAnimationFrame(renderFrame);
          }
        }, 1000);
      }
    };
    
    // 初回実行
    this.animationId = requestAnimationFrame(renderFrame);
  }

  // Setup virtual plugin network positions
  setupPluginNetwork() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const radius = Math.min(centerX, centerY) * 0.6;

    // Define plugin positions in a circle
    const plugins = [
      { name: 'VoidCore', color: '#FFD700', x: centerX, y: centerY },
      { name: 'BulletinBoard', color: '#FF6B6B', x: centerX + radius * Math.cos(0), y: centerY + radius * Math.sin(0) },
      { name: 'IntentLauncher', color: '#4ECDC4', x: centerX + radius * Math.cos(Math.PI * 2 / 5), y: centerY + radius * Math.sin(Math.PI * 2 / 5) },
      { name: 'DocFeed', color: '#45B7D1', x: centerX + radius * Math.cos(Math.PI * 4 / 5), y: centerY + radius * Math.sin(Math.PI * 4 / 5) },
      { name: 'ChatNotifier', color: '#F9CA24', x: centerX + radius * Math.cos(Math.PI * 6 / 5), y: centerY + radius * Math.sin(Math.PI * 6 / 5) },
      { name: 'SystemObserver', color: '#6C5CE7', x: centerX + radius * Math.cos(Math.PI * 8 / 5), y: centerY + radius * Math.sin(Math.PI * 8 / 5) }
    ];

    plugins.forEach(plugin => {
      this.pluginPositions.set(plugin.name, plugin);
    });
  }

  // Create message log overlay
  createMessageLogOverlay(container) {
    const logOverlay = document.createElement('div');
    logOverlay.style.position = 'absolute';
    logOverlay.style.bottom = '10px';
    logOverlay.style.left = '10px';
    logOverlay.style.right = '10px';
    logOverlay.style.height = '80px';
    logOverlay.style.background = 'rgba(0, 0, 0, 0.8)';
    logOverlay.style.borderRadius = '8px';
    logOverlay.style.padding = '10px';
    logOverlay.style.color = '#00FF00';
    logOverlay.style.fontFamily = 'monospace';
    logOverlay.style.fontSize = '11px';
    logOverlay.style.overflowY = 'auto';
    logOverlay.style.zIndex = '10';
    logOverlay.id = 'message-log-overlay';
    
    container.style.position = 'relative';
    container.appendChild(logOverlay);
  }

  // Visualize message flow
  visualizeMessage(message) {
    // Add to message log
    this.addToMessageLog(message);
    
    // Create visual particle for message flow
    this.createMessageParticle(message);
    
    // Log the message
    this.log(`📡 Message: ${message.type} (${message.category})`);
  }

  // Add message to scrolling log
  addToMessageLog(message) {
    const logOverlay = document.getElementById('message-log-overlay');
    if (!logOverlay) return;

    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message.category}: ${message.type}`;
    
    this.messageLog.push(logEntry);
    if (this.messageLog.length > 10) {
      this.messageLog.shift();
    }
    
    logOverlay.innerHTML = this.messageLog.join('<br>');
    logOverlay.scrollTop = logOverlay.scrollHeight;
  }

  // Create animated particle for message
  createMessageParticle(message) {
    const fromPos = this.pluginPositions.get('VoidCore');
    const toPos = this.getTargetPosition(message);
    
    if (fromPos && toPos) {
      this.particles.push({
        x: fromPos.x,
        y: fromPos.y,
        targetX: toPos.x,
        targetY: toPos.y,
        color: this.getMessageColor(message.category),
        life: 100,
        maxLife: 100,
        message: message
      });
    }
  }

  // Get target position based on message
  getTargetPosition(message) {
    // Route to appropriate plugin based on message type
    if (message.type.includes('document') || message.type.includes('project')) {
      return this.pluginPositions.get('DocFeed');
    } else if (message.type.includes('chat')) {
      return this.pluginPositions.get('ChatNotifier');
    } else if (message.category === 'Intent') {
      return this.pluginPositions.get('IntentLauncher');
    } else {
      return this.pluginPositions.get('BulletinBoard');
    }
  }

  // Get color based on message category
  getMessageColor(category) {
    const colors = {
      'Intent': '#4ECDC4',    // Cyan for intentions
      'Notice': '#FF6B6B',    // Red for notices
      'Proposal': '#F9CA24'   // Yellow for proposals
    };
    return colors[category] || '#FFFFFF';
  }

  // Main visualization rendering
  renderVisualization() {
    if (!this.ctx) return;

    // Clear canvas
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw plugin nodes
    this.drawPluginNodes();
    
    // Draw connections
    this.drawConnections();
    
    // Update and draw particles
    this.updateParticles();
    
    // Draw network stats
    this.drawNetworkStats();
  }

  // Draw plugin nodes
  drawPluginNodes() {
    this.pluginPositions.forEach((plugin, name) => {
      this.ctx.beginPath();
      this.ctx.arc(plugin.x, plugin.y, 25, 0, Math.PI * 2);
      this.ctx.fillStyle = plugin.color;
      this.ctx.fill();
      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      // Plugin name
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(name, plugin.x, plugin.y + 40);
    });
  }

  // Draw connections between plugins
  drawConnections() {
    const voidCore = this.pluginPositions.get('VoidCore');
    
    this.pluginPositions.forEach((plugin, name) => {
      if (name !== 'VoidCore') {
        this.ctx.beginPath();
        this.ctx.moveTo(voidCore.x, voidCore.y);
        this.ctx.lineTo(plugin.x, plugin.y);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
      }
    });
  }

  // Update and draw message particles
  updateParticles() {
    this.particles = this.particles.filter(particle => {
      // Update position
      const progress = (particle.maxLife - particle.life) / particle.maxLife;
      particle.x = particle.x + (particle.targetX - particle.x) * 0.1;
      particle.y = particle.y + (particle.targetY - particle.y) * 0.1;
      particle.life--;

      // Draw particle
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, 8, 0, Math.PI * 2);
      this.ctx.fillStyle = particle.color;
      this.ctx.globalAlpha = particle.life / particle.maxLife;
      this.ctx.fill();
      this.ctx.globalAlpha = 1;

      // Draw trail
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, 15, 0, Math.PI * 2);
      this.ctx.strokeStyle = particle.color;
      this.ctx.globalAlpha = (particle.life / particle.maxLife) * 0.3;
      this.ctx.stroke();
      this.ctx.globalAlpha = 1;

      return particle.life > 0;
    });
  }

  // Draw network statistics
  drawNetworkStats() {
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'left';
    
    const stats = [
      `Active Plugins: ${this.pluginPositions.size}`,
      `Messages Processed: ${this.messageLog.length}`,
      `Active Particles: ${this.particles.length}`,
      `Network Status: ACTIVE`
    ];
    
    stats.forEach((stat, index) => {
      this.ctx.fillText(stat, 10, 20 + index * 15);
    });
  }

  // Clean up on retirement
  async _cleanup() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.canvas) {
      this.canvas.remove();
    }
    this.log('🧹 System visualization cleaned up');
  }
}