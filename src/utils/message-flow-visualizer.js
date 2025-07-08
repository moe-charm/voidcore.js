// message-flow-visualizer.js - リアルタイムメッセージフロー可視化システム
// VoidIDEで美しいメッセージの流れを可視化

/**
 * 🌊 MessageFlowVisualizer - リアルタイムメッセージフロー可視化
 * 
 * VoidCoreのメッセージの流れを美しくリアルタイムで可視化
 * - ノードベースのグラフ表示
 * - アニメーション付きメッセージフロー
 * - フィルタリング・検索機能
 * - インタラクティブな操作
 */

export class MessageFlowVisualizer {
  constructor(container, voidCore) {
    this.container = container;
    this.voidCore = voidCore;
    this.canvas = null;
    this.ctx = null;
    this.isRunning = false;
    
    // 可視化データ
    this.nodes = new Map(); // pluginId -> node
    this.messages = []; // 飛んでいるメッセージ
    this.messageHistory = [];
    this.filters = {
      messageTypes: ['Notice', 'IntentRequest', 'Proposal'],
      showHistory: true,
      maxMessages: 100
    };
    
    // レンダリング設定
    this.config = {
      node: {
        radius: 30,
        spacing: 150,
        colors: {
          voidcore: '#4fc1ff',
          plugin: '#73c991',
          voidide: '#dcdcaa',
          active: '#f48771'
        }
      },
      message: {
        speed: 2,
        trailLength: 20,
        colors: {
          Notice: '#73c991',
          IntentRequest: '#4fc1ff', 
          Proposal: '#dcdcaa'
        }
      },
      animation: {
        fps: 60,
        particleLife: 3000
      }
    };
    
    // アニメーション状態
    this.animationId = null;
    this.lastFrame = 0;
  }

  // ==========================================
  // 🚀 初期化
  // ==========================================
  
  async initialize() {
    try {
      // Canvas要素作成
      this.canvas = document.createElement('canvas');
      this.canvas.width = this.container.clientWidth || 800;
      this.canvas.height = this.container.clientHeight || 600;
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      this.canvas.style.background = '#1e1e1e';
      this.canvas.style.borderRadius = '8px';
      
      this.container.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');
      
      // VoidCoreの初期ノード作成
      this.createVoidCoreNode();
      
      // メッセージ監視開始
      this.startMessageMonitoring();
      
      // キャンバスイベントの設定
      this.setupCanvasEvents();
      
      // リサイズ対応
      this.setupResizeHandler();
      
      console.log('🌊 MessageFlowVisualizer initialized');
      return true;
      
    } catch (error) {
      console.error('❌ MessageFlowVisualizer initialization failed:', error);
      return false;
    }
  }

  // ==========================================
  // 🎨 ノード管理
  // ==========================================
  
  createVoidCoreNode() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    this.nodes.set('voidcore', {
      id: 'voidcore',
      type: 'voidcore',
      name: 'VoidCore',
      x: centerX,
      y: centerY,
      radius: this.config.node.radius * 1.5,
      connections: new Set(),
      messageCount: 0,
      lastActivity: Date.now(),
      color: this.config.node.colors.voidcore
    });
  }
  
  createPluginNode(pluginId, pluginInfo = {}) {
    if (this.nodes.has(pluginId)) return;
    
    // プラグインの配置位置を計算
    const angle = (this.nodes.size - 1) * (Math.PI * 2 / 8); // 8つまで円形配置
    const distance = 200;
    const voidcoreNode = this.nodes.get('voidcore');
    
    const x = voidcoreNode.x + Math.cos(angle) * distance;
    const y = voidcoreNode.y + Math.sin(angle) * distance;
    
    // プラグインタイプ判定
    const type = pluginId.includes('voidide') ? 'voidide' : 'plugin';
    
    this.nodes.set(pluginId, {
      id: pluginId,
      type: type,
      name: pluginInfo.name || pluginId,
      x: x,
      y: y,
      radius: this.config.node.radius,
      connections: new Set(['voidcore']),
      messageCount: 0,
      lastActivity: Date.now(),
      color: this.config.node.colors[type],
      info: pluginInfo
    });
    
    // VoidCoreとの接続を追加
    this.nodes.get('voidcore').connections.add(pluginId);
  }
  
  updatePluginNodes() {
    // 現在のプラグインリストを取得
    const currentPlugins = this.voidCore.getAllPlugins ? this.voidCore.getAllPlugins() : [];
    
    currentPlugins.forEach(plugin => {
      if (!this.nodes.has(plugin.pluginId)) {
        this.createPluginNode(plugin.pluginId, {
          name: plugin.name,
          version: plugin.version,
          capabilities: plugin.capabilities
        });
      }
    });
  }

  // ==========================================
  // 📡 メッセージ監視
  // ==========================================
  
  startMessageMonitoring() {
    // VoidCoreのメッセージを監視
    const originalPublish = this.voidCore.publish.bind(this.voidCore);
    
    this.voidCore.publish = async (message) => {
      // メッセージを記録
      this.recordMessage(message);
      
      // 元のpublishを実行
      return await originalPublish(message);
    };
    
    console.log('📡 Message monitoring started');
  }
  
  recordMessage(message) {
    if (!message || !message.type) return;
    
    // フィルタリング
    if (!this.filters.messageTypes.includes(message.type)) return;
    
    // メッセージデータ作成
    const messageData = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      type: message.type,
      event: message.event_name || message.action || 'unknown',
      payload: message.payload,
      timestamp: Date.now(),
      
      // 可視化用データ
      from: 'voidcore', // 基本的にVoidCoreから
      to: this.determineMessageTarget(message),
      progress: 0,
      particles: []
    };
    
    // アニメーション用メッセージを追加
    this.messages.push(messageData);
    
    // 履歴に追加
    this.messageHistory.unshift(messageData);
    if (this.messageHistory.length > this.filters.maxMessages) {
      this.messageHistory.pop();
    }
    
    // ノードの活動記録
    this.updateNodeActivity(messageData.from);
    this.updateNodeActivity(messageData.to);
  }
  
  determineMessageTarget(message) {
    // メッセージの宛先を推定
    if (message.payload && message.payload.pluginId) {
      return message.payload.pluginId;
    }
    
    if (message.target_role) {
      return message.target_role;
    }
    
    if (message.target_plugin) {
      return message.target_plugin;
    }
    
    // デフォルトは全プラグイン（ブロードキャスト）
    return '*';
  }
  
  updateNodeActivity(nodeId) {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.messageCount++;
      node.lastActivity = Date.now();
    }
  }

  // ==========================================
  // 🎬 アニメーション・レンダリング
  // ==========================================
  
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastFrame = performance.now();
    this.animate();
    
    console.log('🎬 MessageFlowVisualizer started');
  }
  
  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    console.log('⏹️ MessageFlowVisualizer stopped');
  }
  
  animate(currentTime = performance.now()) {
    if (!this.isRunning) return;
    
    // 初回実行時のlastFrame初期化
    if (this.lastFrame === 0) {
      this.lastFrame = currentTime;
    }
    
    const deltaTime = currentTime - this.lastFrame;
    this.lastFrame = currentTime;
    
    // プラグインノード更新
    this.updatePluginNodes();
    
    // メッセージアニメーション更新
    this.updateMessages(deltaTime);
    
    // FPS情報を保存
    this.currentDeltaTime = deltaTime;
    
    // レンダリング
    this.render();
    
    // 次のフレーム
    this.animationId = requestAnimationFrame((time) => this.animate(time));
  }
  
  updateMessages(deltaTime) {
    // メッセージの進行状況を更新
    this.messages = this.messages.filter(message => {
      message.progress += this.config.message.speed * (deltaTime / 16.67); // 60fps基準
      
      // パーティクル効果
      if (message.progress < 100) {
        this.addMessageParticles(message);
      }
      
      // メッセージが到達したら削除
      return message.progress < 100;
    });
    
    // 古いパーティクルを削除
    this.messages.forEach(message => {
      message.particles = message.particles.filter(particle => {
        particle.life -= deltaTime;
        return particle.life > 0;
      });
    });
  }
  
  addMessageParticles(message) {
    const fromNode = this.nodes.get(message.from);
    const toNodes = message.to === '*' 
      ? Array.from(this.nodes.values()).filter(n => n.id !== 'voidcore')
      : [this.nodes.get(message.to)].filter(Boolean);
    
    if (!fromNode || toNodes.length === 0) return;
    
    toNodes.forEach(toNode => {
      // 軌道上の現在位置を計算
      const t = message.progress / 100;
      const x = fromNode.x + (toNode.x - fromNode.x) * t;
      const y = fromNode.y + (toNode.y - fromNode.y) * t;
      
      // パーティクル追加
      message.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        life: this.config.animation.particleLife,
        maxLife: this.config.animation.particleLife,
        color: this.config.message.colors[message.type] || '#ffffff'
      });
    });
  }

  // ==========================================
  // 🎨 描画処理
  // ==========================================
  
  render() {
    // キャンバスクリア
    this.ctx.fillStyle = '#1e1e1e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 接続線を描画
    this.renderConnections();
    
    // メッセージパーティクルを描画
    this.renderMessageParticles();
    
    // ノードを描画
    this.renderNodes();
    
    // メッセージトレイルを描画
    this.renderMessageTrails();
    
    // 統計情報を描画
    this.renderStats();
  }
  
  renderConnections() {
    this.ctx.strokeStyle = '#3e3e42';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    
    this.nodes.forEach(node => {
      node.connections.forEach(connectionId => {
        const connectedNode = this.nodes.get(connectionId);
        if (connectedNode && node.id !== connectionId) {
          this.ctx.beginPath();
          this.ctx.moveTo(node.x, node.y);
          this.ctx.lineTo(connectedNode.x, connectedNode.y);
          this.ctx.stroke();
        }
      });
    });
    
    this.ctx.setLineDash([]);
  }
  
  renderNodes() {
    this.nodes.forEach(node => {
      // ノード背景
      this.ctx.fillStyle = node.color;
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      // アクティビティ効果
      const timeSinceActivity = Date.now() - node.lastActivity;
      if (timeSinceActivity < 1000) {
        const alpha = 1 - (timeSinceActivity / 1000);
        this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.3})`;
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, node.radius * 1.2, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      // ノードテキスト
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '12px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      
      const displayName = node.name.length > 10 
        ? node.name.substring(0, 8) + '...'
        : node.name;
      
      this.ctx.fillText(displayName, node.x, node.y - 5);
      
      // メッセージ数
      if (node.messageCount > 0) {
        this.ctx.font = '10px monospace';
        this.ctx.fillText(`(${node.messageCount})`, node.x, node.y + 8);
      }
    });
  }
  
  renderMessageParticles() {
    this.messages.forEach(message => {
      message.particles.forEach(particle => {
        const alpha = particle.life / particle.maxLife;
        this.ctx.fillStyle = particle.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
        
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
        this.ctx.fill();
      });
    });
  }
  
  renderMessageTrails() {
    this.messages.forEach(message => {
      const fromNode = this.nodes.get(message.from);
      const toNodes = message.to === '*' 
        ? Array.from(this.nodes.values()).filter(n => n.id !== 'voidcore')
        : [this.nodes.get(message.to)].filter(Boolean);
      
      if (!fromNode || toNodes.length === 0) return;
      
      toNodes.forEach(toNode => {
        // メッセージの軌道を描画
        const t = message.progress / 100;
        const x = fromNode.x + (toNode.x - fromNode.x) * t;
        const y = fromNode.y + (toNode.y - fromNode.y) * t;
        
        // メッセージアイコン
        this.ctx.fillStyle = this.config.message.colors[message.type];
        this.ctx.beginPath();
        this.ctx.arc(x, y, 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // メッセージタイプラベル
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '8px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(message.type.substring(0, 3), x, y - 10);
      });
    });
  }
  
  renderStats() {
    // 統計情報パネル
    this.ctx.fillStyle = 'rgba(45, 45, 48, 0.9)';
    this.ctx.fillRect(10, 10, 200, 100);
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    
    const stats = [
      `Nodes: ${this.nodes.size}`,
      `Active Messages: ${this.messages.length}`,
      `Message History: ${this.messageHistory.length}`,
      `FPS: ${Math.round(1000 / Math.max(this.currentDeltaTime || 16.67, 1))}`, // 異常値防止
      `Filters: ${this.filters.messageTypes.join(', ')}`
    ];
    
    stats.forEach((stat, index) => {
      this.ctx.fillText(stat, 15, 15 + index * 15);
    });
  }

  // ==========================================
  // 🖱️ インタラクション
  // ==========================================
  
  setupCanvasEvents() {
    this.canvas.addEventListener('click', (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // ノードクリック検出
      this.nodes.forEach(node => {
        const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
        if (distance <= node.radius) {
          this.onNodeClick(node);
        }
      });
    });
    
    this.canvas.addEventListener('mousemove', (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // ホバー効果
      this.canvas.style.cursor = 'default';
      this.nodes.forEach(node => {
        const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
        if (distance <= node.radius) {
          this.canvas.style.cursor = 'pointer';
        }
      });
    });
  }
  
  onNodeClick(node) {
    console.log('🖱️ Node clicked:', node);
    
    // ノード詳細情報を表示（将来の実装）
    if (this.onNodeClickCallback) {
      this.onNodeClickCallback(node);
    }
  }
  
  setupResizeHandler() {
    window.addEventListener('resize', () => {
      if (this.canvas) {
        this.canvas.width = this.container.clientWidth || 800;
        this.canvas.height = this.container.clientHeight || 600;
        
        // ノード位置の再計算
        this.repositionNodes();
      }
    });
  }
  
  repositionNodes() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    // VoidCoreノードを中央に
    const voidcoreNode = this.nodes.get('voidcore');
    if (voidcoreNode) {
      voidcoreNode.x = centerX;
      voidcoreNode.y = centerY;
    }
    
    // プラグインノードを円形に再配置
    const pluginNodes = Array.from(this.nodes.values()).filter(n => n.id !== 'voidcore');
    pluginNodes.forEach((node, index) => {
      const angle = index * (Math.PI * 2 / Math.max(pluginNodes.length, 6));
      const distance = 200;
      node.x = centerX + Math.cos(angle) * distance;
      node.y = centerY + Math.sin(angle) * distance;
    });
  }

  // ==========================================
  // 🔧 ユーティリティ
  // ==========================================
  
  setFilter(filterName, value) {
    if (this.filters.hasOwnProperty(filterName)) {
      this.filters[filterName] = value;
      console.log(`🔧 Filter updated: ${filterName} = ${value}`);
    }
  }
  
  clearHistory() {
    this.messageHistory = [];
    this.messages = [];
    console.log('🧹 Message history cleared');
  }
  
  getStats() {
    return {
      nodes: this.nodes.size,
      activeMessages: this.messages.length,
      messageHistory: this.messageHistory.length,
      isRunning: this.isRunning
    };
  }
  
  dispose() {
    this.stop();
    
    if (this.canvas && this.container.contains(this.canvas)) {
      this.container.removeChild(this.canvas);
    }
    
    // イベントリスナーの削除
    window.removeEventListener('resize', this.repositionNodes);
    
    console.log('🧹 MessageFlowVisualizer disposed');
  }
}

export default MessageFlowVisualizer;