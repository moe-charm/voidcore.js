// performance-metrics-system.js - パフォーマンス測定・表示システム
// VoidIDEでの高度なパフォーマンス分析・最適化支援

/**
 * ⚡ PerformanceMetricsSystem - パフォーマンス測定・表示システム
 * 
 * VoidCoreシステム全体のパフォーマンスを詳細に分析
 * - リアルタイムパフォーマンス監視
 * - メモリ使用量追跡
 * - CPU使用率測定
 * - メッセージスループット分析
 * - ボトルネック特定
 * - 最適化提案
 */

export class PerformanceMetricsSystem {
  constructor(voidCore) {
    this.voidCore = voidCore;
    this.isRunning = false;
    
    // パフォーマンスデータ
    this.metrics = {
      system: {
        startTime: Date.now(),
        uptime: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        
        // VoidCore specific
        totalMessages: 0,
        messagesPerSecond: 0,
        averageLatency: 0,
        peakLatency: 0,
        
        // システム負荷
        pluginCount: 0,
        activeConnections: 0,
        transportStats: {}
      },
      
      realtime: {
        timestamps: [],
        memoryUsages: [],
        cpuUsages: [],
        messageRates: [],
        latencies: [],
        maxDataPoints: 60 // 1分間のデータ
      },
      
      plugins: new Map(), // pluginId -> PluginPerformanceData
      
      bottlenecks: [],
      optimizations: []
    };
    
    // 測定設定
    this.config = {
      updateInterval: 1000, // 1秒間隔
      sampleInterval: 100,  // 100ms サンプリング
      alertThresholds: {
        memoryUsage: 100 * 1024 * 1024, // 100MB
        latency: 1000, // 1秒
        messageRate: 1000, // 1000 msg/s
        cpuUsage: 80 // 80%
      }
    };
    
    // UI要素
    this.container = null;
    this.charts = {};
    
    // 測定用タイマー
    this.measurementInterval = null;
    this.samplingInterval = null;
    
    // Observer pattern
    this.observers = new Set();
    
    // パフォーマンス履歴
    this.history = {
      daily: [],
      hourly: [],
      sessions: []
    };
  }

  // ==========================================
  // 🚀 初期化・開始
  // ==========================================
  
  async initialize(container) {
    this.container = container;
    
    try {
      // UI作成
      this.createPerformanceUI();
      
      // ブラウザAPIチェック
      this.checkBrowserSupport();
      
      // VoidCore統合
      this.integrateWithVoidCore();
      
      // 測定開始
      this.startMeasurement();
      
      console.log('⚡ PerformanceMetricsSystem initialized');
      return true;
      
    } catch (error) {
      console.error('❌ PerformanceMetricsSystem initialization failed:', error);
      return false;
    }
  }
  
  createPerformanceUI() {
    this.container.innerHTML = `
      <div class="performance-metrics-system">
        <div class="metrics-header">
          <h3>⚡ Performance Metrics</h3>
          <div class="metrics-controls">
            <button class="control-btn" onclick="this.togglePause()">⏸️ Pause</button>
            <button class="control-btn" onclick="this.reset()">🔄 Reset</button>
            <button class="control-btn" onclick="this.exportData()">📊 Export</button>
          </div>
        </div>
        
        <div class="metrics-overview">
          <div class="metric-card">
            <div class="metric-title">System Uptime</div>
            <div class="metric-value" id="systemUptime">0s</div>
          </div>
          <div class="metric-card">
            <div class="metric-title">Memory Usage</div>
            <div class="metric-value" id="memoryUsage">0 MB</div>
            <div class="metric-bar">
              <div class="metric-fill" id="memoryBar"></div>
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-title">Messages/sec</div>
            <div class="metric-value" id="messageRate">0</div>
          </div>
          <div class="metric-card">
            <div class="metric-title">Avg Latency</div>
            <div class="metric-value" id="avgLatency">0ms</div>
          </div>
        </div>
        
        <div class="charts-container">
          <div class="chart-panel">
            <h4>📈 Memory Usage (Last 60s)</h4>
            <canvas id="memoryChart" width="400" height="200"></canvas>
          </div>
          <div class="chart-panel">
            <h4>📊 Message Rate (Last 60s)</h4>
            <canvas id="messageChart" width="400" height="200"></canvas>
          </div>
          <div class="chart-panel">
            <h4>⏱️ Latency Distribution</h4>
            <canvas id="latencyChart" width="400" height="200"></canvas>
          </div>
          <div class="chart-panel">
            <h4>🔧 Plugin Performance</h4>
            <div id="pluginPerformance"></div>
          </div>
        </div>
        
        <div class="bottlenecks-panel">
          <h4>🚨 Performance Issues & Optimizations</h4>
          <div id="bottlenecksList"></div>
        </div>
      </div>
    `;
    
    // スタイル追加
    this.addPerformanceStyles();
    
    // チャートキャンバス取得
    this.charts.memory = document.getElementById('memoryChart').getContext('2d');
    this.charts.messages = document.getElementById('messageChart').getContext('2d');
    this.charts.latency = document.getElementById('latencyChart').getContext('2d');
  }
  
  addPerformanceStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .performance-metrics-system {
        background: #1e1e1e;
        color: #d4d4d4;
        padding: 20px;
        border-radius: 8px;
        height: 100%;
        overflow-y: auto;
      }
      
      .metrics-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 1px solid #3e3e42;
      }
      
      .metrics-header h3 {
        margin: 0;
        color: #cccccc;
      }
      
      .metrics-controls {
        display: flex;
        gap: 8px;
      }
      
      .control-btn {
        background: #0e639c;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      }
      
      .control-btn:hover {
        background: #1177bb;
      }
      
      .metrics-overview {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        margin-bottom: 25px;
      }
      
      .metric-card {
        background: #252526;
        border-radius: 6px;
        padding: 15px;
        border: 1px solid #3e3e42;
      }
      
      .metric-title {
        font-size: 12px;
        color: #cccccc;
        text-transform: uppercase;
        margin-bottom: 8px;
      }
      
      .metric-value {
        font-size: 24px;
        font-weight: bold;
        color: #4fc1ff;
        margin-bottom: 8px;
      }
      
      .metric-bar {
        width: 100%;
        height: 6px;
        background: #3e3e42;
        border-radius: 3px;
        overflow: hidden;
      }
      
      .metric-fill {
        height: 100%;
        background: linear-gradient(90deg, #73c991, #4fc1ff);
        transition: width 0.3s ease;
        width: 0%;
      }
      
      .charts-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 25px;
      }
      
      .chart-panel {
        background: #252526;
        border-radius: 6px;
        padding: 15px;
        border: 1px solid #3e3e42;
      }
      
      .chart-panel h4 {
        margin: 0 0 15px 0;
        font-size: 14px;
        color: #cccccc;
      }
      
      .chart-panel canvas {
        width: 100%;
        height: 200px;
        background: #1e1e1e;
        border-radius: 4px;
      }
      
      .bottlenecks-panel {
        background: #252526;
        border-radius: 6px;
        padding: 15px;
        border: 1px solid #3e3e42;
      }
      
      .bottlenecks-panel h4 {
        margin: 0 0 15px 0;
        font-size: 14px;
        color: #cccccc;
      }
      
      .bottleneck-item {
        background: #2d2d30;
        border-radius: 4px;
        padding: 10px;
        margin-bottom: 8px;
        border-left: 3px solid #f48771;
      }
      
      .bottleneck-item.warning {
        border-left-color: #dcdcaa;
      }
      
      .bottleneck-item.optimization {
        border-left-color: #73c991;
      }
      
      .bottleneck-title {
        font-size: 13px;
        font-weight: bold;
        color: #4fc1ff;
        margin-bottom: 4px;
      }
      
      .bottleneck-description {
        font-size: 12px;
        color: #cccccc;
        line-height: 1.4;
      }
      
      .plugin-performance-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #2d2d30;
        border-radius: 4px;
        padding: 8px 12px;
        margin-bottom: 6px;
      }
      
      .plugin-name {
        font-size: 13px;
        color: #4fc1ff;
      }
      
      .plugin-metrics {
        display: flex;
        gap: 15px;
        font-size: 11px;
        color: #cccccc;
      }
      
      .plugin-metric {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      
      .plugin-metric-value {
        color: #73c991;
        font-weight: bold;
      }
    `;
    
    document.head.appendChild(style);
  }

  // ==========================================
  // 🔧 VoidCore統合
  // ==========================================
  
  integrateWithVoidCore() {
    // メッセージパフォーマンス監視
    const originalPublish = this.voidCore.publish.bind(this.voidCore);
    this.voidCore.publish = async (message) => {
      const startTime = performance.now();
      
      try {
        const result = await originalPublish(message);
        const endTime = performance.now();
        const latency = endTime - startTime;
        
        this.recordMessageMetrics(message, latency, true);
        return result;
        
      } catch (error) {
        const endTime = performance.now();
        const latency = endTime - startTime;
        this.recordMessageMetrics(message, latency, false, error);
        throw error;
      }
    };
    
    // プラグインパフォーマンス監視
    this.monitorPluginPerformance();
    
    // Transport統計監視
    this.monitorTransportPerformance();
    
    console.log('🔧 VoidCore integration completed');
  }
  
  recordMessageMetrics(message, latency, success, error = null) {
    const now = Date.now();
    
    // システム全体の統計更新
    this.metrics.system.totalMessages++;
    
    // レイテンシ統計
    const currentAvg = this.metrics.system.averageLatency;
    const count = this.metrics.system.totalMessages;
    this.metrics.system.averageLatency = ((currentAvg * (count - 1)) + latency) / count;
    
    if (latency > this.metrics.system.peakLatency) {
      this.metrics.system.peakLatency = latency;
    }
    
    // リアルタイムデータに追加
    this.metrics.realtime.latencies.push({
      timestamp: now,
      value: latency,
      success: success
    });
    
    // プラグイン固有の統計
    const pluginId = this.extractPluginId(message);
    if (pluginId) {
      this.recordPluginMetrics(pluginId, latency, success, error);
    }
    
    // アラート判定
    if (latency > this.config.alertThresholds.latency) {
      this.addBottleneck('warning', 'High Latency Detected', 
        `Message processing took ${latency.toFixed(2)}ms (threshold: ${this.config.alertThresholds.latency}ms)`);
    }
  }
  
  extractPluginId(message) {
    if (message.payload && message.payload.from) {
      return message.payload.from;
    }
    if (message.payload && message.payload.pluginId) {
      return message.payload.pluginId;
    }
    return null;
  }
  
  recordPluginMetrics(pluginId, latency, success, error) {
    if (!this.metrics.plugins.has(pluginId)) {
      this.metrics.plugins.set(pluginId, {
        pluginId: pluginId,
        messageCount: 0,
        totalLatency: 0,
        averageLatency: 0,
        maxLatency: 0,
        errorCount: 0,
        errorRate: 0,
        memoryEstimate: 0,
        cpuUsage: 0,
        lastActivity: Date.now()
      });
    }
    
    const metrics = this.metrics.plugins.get(pluginId);
    metrics.messageCount++;
    metrics.totalLatency += latency;
    metrics.averageLatency = metrics.totalLatency / metrics.messageCount;
    metrics.lastActivity = Date.now();
    
    if (latency > metrics.maxLatency) {
      metrics.maxLatency = latency;
    }
    
    if (!success) {
      metrics.errorCount++;
      metrics.errorRate = metrics.errorCount / metrics.messageCount;
    }
  }
  
  monitorPluginPerformance() {
    // プラグイン登録時の監視開始
    const originalRegisterPlugin = this.voidCore.registerPlugin.bind(this.voidCore);
    this.voidCore.registerPlugin = (plugin) => {
      const result = originalRegisterPlugin(plugin);
      if (result) {
        this.startPluginMonitoring(plugin);
      }
      return result;
    };
  }
  
  startPluginMonitoring(plugin) {
    const pluginId = plugin.pluginId || plugin.id;
    
    // プラグインのrun関数を監視
    if (typeof plugin.run === 'function') {
      const originalRun = plugin.run.bind(plugin);
      plugin.run = async (...args) => {
        const startTime = performance.now();
        
        try {
          const result = await originalRun(...args);
          const endTime = performance.now();
          const executionTime = endTime - startTime;
          
          this.recordPluginExecution(pluginId, executionTime, true);
          return result;
          
        } catch (error) {
          const endTime = performance.now();
          const executionTime = endTime - startTime;
          this.recordPluginExecution(pluginId, executionTime, false, error);
          throw error;
        }
      };
    }
  }
  
  recordPluginExecution(pluginId, executionTime, success, error = null) {
    if (executionTime > 5000) { // 5秒以上
      this.addBottleneck('warning', 'Slow Plugin Execution', 
        `Plugin ${pluginId} took ${executionTime.toFixed(2)}ms to start`);
    }
    
    if (!success) {
      this.addBottleneck('error', 'Plugin Execution Failed', 
        `Plugin ${pluginId} failed to execute: ${error?.message || 'Unknown error'}`);
    }
  }
  
  monitorTransportPerformance() {
    // Transport統計の定期取得
    setInterval(() => {
      if (this.voidCore.getStats) {
        const stats = this.voidCore.getStats();
        this.metrics.system.transportStats = stats;
        
        // Transport関連のボトルネック検出
        this.analyzeTransportPerformance(stats);
      }
    }, 5000);
  }
  
  analyzeTransportPerformance(stats) {
    // メッセージキューの分析
    if (stats.messageQueue && stats.messageQueue.length > 100) {
      this.addBottleneck('warning', 'Message Queue Backlog', 
        `Message queue has ${stats.messageQueue.length} pending messages`);
    }
    
    // 購読者数の分析
    if (stats.subscriberCount && stats.subscriberCount > 1000) {
      this.addBottleneck('optimization', 'High Subscriber Count', 
        `Consider optimizing message routing with ${stats.subscriberCount} subscribers`);
    }
  }

  // ==========================================
  // 📊 測定・データ収集
  // ==========================================
  
  startMeasurement() {
    // メイン測定ループ
    this.measurementInterval = setInterval(() => {
      this.collectSystemMetrics();
      this.updateRealtimeData();
      this.analyzePerformance();
      this.updateUI();
    }, this.config.updateInterval);
    
    // 高頻度サンプリング
    this.samplingInterval = setInterval(() => {
      this.sampleRealtimeData();
    }, this.config.sampleInterval);
    
    this.isRunning = true;
    console.log('📊 Performance measurement started');
  }
  
  collectSystemMetrics() {
    const now = Date.now();
    
    // アップタイム更新
    this.metrics.system.uptime = now - this.metrics.system.startTime;
    
    // ブラウザメモリ情報
    if (performance.memory) {
      this.metrics.system.memoryUsage = performance.memory.usedJSHeapSize;
    }
    
    // プラグイン数
    this.metrics.system.pluginCount = this.voidCore.getAllPlugins ? 
      this.voidCore.getAllPlugins().length : 0;
    
    // メッセージレート計算
    this.calculateMessageRate();
    
    // CPU使用率推定（近似値）
    this.estimateCPUUsage();
  }
  
  calculateMessageRate() {
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    
    const recentMessages = this.metrics.realtime.latencies.filter(
      entry => entry.timestamp > oneSecondAgo
    ).length;
    
    this.metrics.system.messagesPerSecond = recentMessages;
    
    // データ制限
    this.metrics.realtime.latencies = this.metrics.realtime.latencies
      .filter(entry => entry.timestamp > now - 60000); // 1分間のデータ保持
  }
  
  estimateCPUUsage() {
    // 簡易CPU使用率推定（メッセージ処理頻度ベース）
    const msgRate = this.metrics.system.messagesPerSecond;
    const pluginCount = this.metrics.system.pluginCount;
    
    // 経験的な計算式
    const baseCPU = Math.min(msgRate * 0.1, 50); // メッセージレートベース
    const pluginCPU = pluginCount * 2; // プラグイン数ベース
    
    this.metrics.system.cpuUsage = Math.min(baseCPU + pluginCPU, 100);
  }
  
  sampleRealtimeData() {
    const now = Date.now();
    
    this.metrics.realtime.timestamps.push(now);
    this.metrics.realtime.memoryUsages.push(this.metrics.system.memoryUsage);
    this.metrics.realtime.messageRates.push(this.metrics.system.messagesPerSecond);
    
    // データポイント数制限
    const maxPoints = this.metrics.realtime.maxDataPoints;
    if (this.metrics.realtime.timestamps.length > maxPoints) {
      this.metrics.realtime.timestamps.shift();
      this.metrics.realtime.memoryUsages.shift();
      this.metrics.realtime.messageRates.shift();
    }
  }
  
  updateRealtimeData() {
    // リアルタイムデータの更新とクリーンアップ
    const now = Date.now();
    const cutoff = now - 60000; // 1分前
    
    // 古いデータを削除
    ['timestamps', 'memoryUsages', 'messageRates'].forEach(key => {
      while (this.metrics.realtime[key].length > 0 && 
             this.metrics.realtime[key][0] < cutoff) {
        this.metrics.realtime[key].shift();
      }
    });
  }

  // ==========================================
  // 🔍 パフォーマンス分析
  // ==========================================
  
  analyzePerformance() {
    this.detectMemoryLeaks();
    this.detectSlowPlugins();
    this.suggestOptimizations();
    this.updatePluginRankings();
  }
  
  detectMemoryLeaks() {
    if (this.metrics.realtime.memoryUsages.length < 30) return; // 30秒分のデータが必要
    
    const recent = this.metrics.realtime.memoryUsages.slice(-30);
    const growth = recent[recent.length - 1] - recent[0];
    const threshold = 10 * 1024 * 1024; // 10MB
    
    if (growth > threshold) {
      this.addBottleneck('warning', 'Potential Memory Leak', 
        `Memory usage increased by ${(growth / 1024 / 1024).toFixed(1)}MB in the last 30 seconds`);
    }
  }
  
  detectSlowPlugins() {
    this.metrics.plugins.forEach((metrics, pluginId) => {
      if (metrics.averageLatency > this.config.alertThresholds.latency) {
        this.addBottleneck('warning', 'Slow Plugin Performance', 
          `Plugin ${pluginId} has average latency of ${metrics.averageLatency.toFixed(2)}ms`);
      }
      
      if (metrics.errorRate > 0.1) { // 10%エラー率
        this.addBottleneck('error', 'High Plugin Error Rate', 
          `Plugin ${pluginId} has ${(metrics.errorRate * 100).toFixed(1)}% error rate`);
      }
    });
  }
  
  suggestOptimizations() {
    // メッセージレートベースの最適化提案
    if (this.metrics.system.messagesPerSecond > 500) {
      this.addBottleneck('optimization', 'High Message Volume', 
        'Consider implementing message batching with SimpleMessagePool for better performance');
    }
    
    // プラグイン数ベースの最適化
    if (this.metrics.system.pluginCount > 20) {
      this.addBottleneck('optimization', 'Many Plugins Loaded', 
        'Consider using CoreFusion to merge related plugins for better performance');
    }
    
    // メモリ使用量ベースの最適化
    if (this.metrics.system.memoryUsage > this.config.alertThresholds.memoryUsage) {
      this.addBottleneck('optimization', 'High Memory Usage', 
        'Consider implementing plugin lifecycle management to reduce memory footprint');
    }
  }
  
  updatePluginRankings() {
    // プラグインをパフォーマンスでランキング
    const plugins = Array.from(this.metrics.plugins.values());
    
    plugins.sort((a, b) => {
      // 総合スコア計算（低いほど良い）
      const scoreA = a.averageLatency + (a.errorRate * 1000);
      const scoreB = b.averageLatency + (b.errorRate * 1000);
      return scoreA - scoreB;
    });
    
    this.metrics.pluginRankings = plugins;
  }

  // ==========================================
  // 🎨 UI更新・チャート描画
  // ==========================================
  
  updateUI() {
    this.updateOverviewCards();
    this.updateCharts();
    this.updatePluginPerformanceList();
    this.updateBottlenecksList();
  }
  
  updateOverviewCards() {
    // システムアップタイム
    const uptimeSeconds = Math.floor(this.metrics.system.uptime / 1000);
    document.getElementById('systemUptime').textContent = this.formatUptime(uptimeSeconds);
    
    // メモリ使用量
    const memoryMB = (this.metrics.system.memoryUsage / 1024 / 1024).toFixed(1);
    document.getElementById('memoryUsage').textContent = `${memoryMB} MB`;
    
    // メモリバー更新
    const memoryPercent = Math.min((this.metrics.system.memoryUsage / this.config.alertThresholds.memoryUsage) * 100, 100);
    document.getElementById('memoryBar').style.width = `${memoryPercent}%`;
    
    // メッセージレート
    document.getElementById('messageRate').textContent = this.metrics.system.messagesPerSecond;
    
    // 平均レイテンシ
    document.getElementById('avgLatency').textContent = `${this.metrics.system.averageLatency.toFixed(1)}ms`;
  }
  
  updateCharts() {
    this.drawMemoryChart();
    this.drawMessageChart();
    this.drawLatencyChart();
  }
  
  drawMemoryChart() {
    const ctx = this.charts.memory;
    const data = this.metrics.realtime.memoryUsages;
    const timestamps = this.metrics.realtime.timestamps;
    
    if (data.length === 0) return;
    
    // キャンバスクリア
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // スケール計算
    const maxMemory = Math.max(...data);
    const minMemory = Math.min(...data);
    const range = maxMemory - minMemory || 1;
    
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const padding = 20;
    
    // グリッド描画
    ctx.strokeStyle = '#3e3e42';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i * (height - padding * 2)) / 5;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    
    // データライン描画
    ctx.strokeStyle = '#4fc1ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    data.forEach((value, index) => {
      const x = padding + (index * (width - padding * 2)) / (data.length - 1);
      const y = height - padding - ((value - minMemory) / range) * (height - padding * 2);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // 現在値ラベル
    ctx.fillStyle = '#cccccc';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${(maxMemory / 1024 / 1024).toFixed(1)}MB`, width - padding - 5, padding + 15);
    ctx.fillText(`${(minMemory / 1024 / 1024).toFixed(1)}MB`, width - padding - 5, height - padding - 5);
  }
  
  drawMessageChart() {
    const ctx = this.charts.messages;
    const data = this.metrics.realtime.messageRates;
    
    if (data.length === 0) return;
    
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    const maxRate = Math.max(...data, 10);
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const padding = 20;
    
    // バーチャート描画
    ctx.fillStyle = '#73c991';
    
    data.forEach((value, index) => {
      const barWidth = (width - padding * 2) / data.length;
      const barHeight = (value / maxRate) * (height - padding * 2);
      const x = padding + index * barWidth;
      const y = height - padding - barHeight;
      
      ctx.fillRect(x, y, barWidth - 1, barHeight);
    });
    
    // ラベル
    ctx.fillStyle = '#cccccc';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${maxRate} msg/s`, width - padding - 5, padding + 15);
  }
  
  drawLatencyChart() {
    const ctx = this.charts.latency;
    const latencies = this.metrics.realtime.latencies.map(entry => entry.value);
    
    if (latencies.length === 0) return;
    
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // ヒストグラム作成
    const buckets = this.createLatencyHistogram(latencies);
    const maxCount = Math.max(...buckets.map(b => b.count));
    
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const padding = 20;
    const barWidth = (width - padding * 2) / buckets.length;
    
    // ヒストグラム描画
    ctx.fillStyle = '#dcdcaa';
    
    buckets.forEach((bucket, index) => {
      const barHeight = (bucket.count / maxCount) * (height - padding * 2);
      const x = padding + index * barWidth;
      const y = height - padding - barHeight;
      
      ctx.fillRect(x, y, barWidth - 1, barHeight);
    });
    
    // ラベル
    ctx.fillStyle = '#cccccc';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    
    buckets.forEach((bucket, index) => {
      const x = padding + index * barWidth + barWidth / 2;
      ctx.fillText(`${bucket.min}`, x, height - 5);
    });
  }
  
  createLatencyHistogram(latencies, bucketCount = 10) {
    const min = Math.min(...latencies);
    const max = Math.max(...latencies);
    const range = max - min || 1;
    const bucketSize = range / bucketCount;
    
    const buckets = Array.from({ length: bucketCount }, (_, i) => ({
      min: Math.round(min + i * bucketSize),
      max: Math.round(min + (i + 1) * bucketSize),
      count: 0
    }));
    
    latencies.forEach(latency => {
      const bucketIndex = Math.min(Math.floor((latency - min) / bucketSize), bucketCount - 1);
      buckets[bucketIndex].count++;
    });
    
    return buckets;
  }
  
  updatePluginPerformanceList() {
    const container = document.getElementById('pluginPerformance');
    if (!container) return;
    
    const rankings = this.metrics.pluginRankings || [];
    
    container.innerHTML = '';
    
    if (rankings.length === 0) {
      container.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">No plugin performance data</div>';
      return;
    }
    
    rankings.slice(0, 10).forEach((plugin, index) => { // Top 10
      const item = document.createElement('div');
      item.className = 'plugin-performance-item';
      
      const rank = index + 1;
      const rankIcon = rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`;
      
      item.innerHTML = `
        <div class="plugin-name">${rankIcon} ${plugin.pluginId}</div>
        <div class="plugin-metrics">
          <div class="plugin-metric">
            <div class="plugin-metric-value">${plugin.averageLatency.toFixed(1)}ms</div>
            <div>Latency</div>
          </div>
          <div class="plugin-metric">
            <div class="plugin-metric-value">${plugin.messageCount}</div>
            <div>Messages</div>
          </div>
          <div class="plugin-metric">
            <div class="plugin-metric-value">${(plugin.errorRate * 100).toFixed(1)}%</div>
            <div>Errors</div>
          </div>
        </div>
      `;
      
      container.appendChild(item);
    });
  }

  // ==========================================
  // 🚨 ボトルネック・アラート管理
  // ==========================================
  
  addBottleneck(type, title, description) {
    // 重複チェック
    const exists = this.metrics.bottlenecks.some(b => 
      b.title === title && Date.now() - b.timestamp < 60000 // 1分以内の重複を除外
    );
    
    if (exists) return;
    
    const bottleneck = {
      id: Date.now(),
      type: type, // 'error', 'warning', 'optimization'
      title: title,
      description: description,
      timestamp: Date.now()
    };
    
    this.metrics.bottlenecks.unshift(bottleneck);
    
    // ボトルネック数制限
    if (this.metrics.bottlenecks.length > 20) {
      this.metrics.bottlenecks.pop();
    }
    
    // オブザーバーに通知
    this.notifyObservers('bottleneck', bottleneck);
  }
  
  updateBottlenecksList() {
    const container = document.getElementById('bottlenecksList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (this.metrics.bottlenecks.length === 0) {
      container.innerHTML = '<div style="color: #73c991; text-align: center; padding: 20px;">✅ No performance issues detected</div>';
      return;
    }
    
    this.metrics.bottlenecks.slice(0, 10).forEach(bottleneck => {
      const item = document.createElement('div');
      item.className = `bottleneck-item ${bottleneck.type}`;
      
      const timeStr = new Date(bottleneck.timestamp).toLocaleTimeString();
      const icon = bottleneck.type === 'error' ? '❌' : 
                   bottleneck.type === 'warning' ? '⚠️' : '💡';
      
      item.innerHTML = `
        <div class="bottleneck-title">${icon} ${bottleneck.title}</div>
        <div class="bottleneck-description">${bottleneck.description}</div>
        <div style="font-size: 10px; color: #888; margin-top: 4px;">${timeStr}</div>
      `;
      
      container.appendChild(item);
    });
  }

  // ==========================================
  // 🔧 ユーティリティ・制御
  // ==========================================
  
  formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }
  
  checkBrowserSupport() {
    const features = {
      performanceMemory: !!performance.memory,
      performanceNow: !!performance.now,
      requestAnimationFrame: !!window.requestAnimationFrame
    };
    
    console.log('🔧 Browser support:', features);
    return features;
  }
  
  togglePause() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.resume();
    }
  }
  
  pause() {
    if (this.measurementInterval) {
      clearInterval(this.measurementInterval);
      this.measurementInterval = null;
    }
    
    if (this.samplingInterval) {
      clearInterval(this.samplingInterval);
      this.samplingInterval = null;
    }
    
    this.isRunning = false;
    console.log('⏸️ Performance monitoring paused');
  }
  
  resume() {
    this.startMeasurement();
    console.log('▶️ Performance monitoring resumed');
  }
  
  reset() {
    // データリセット
    this.metrics.system.totalMessages = 0;
    this.metrics.system.averageLatency = 0;
    this.metrics.system.peakLatency = 0;
    
    this.metrics.realtime = {
      timestamps: [],
      memoryUsages: [],
      cpuUsages: [],
      messageRates: [],
      latencies: [],
      maxDataPoints: 60
    };
    
    this.metrics.plugins.clear();
    this.metrics.bottlenecks = [];
    
    console.log('🔄 Performance metrics reset');
  }
  
  exportData() {
    const exportData = {
      timestamp: Date.now(),
      system: this.metrics.system,
      plugins: Array.from(this.metrics.plugins.entries()),
      bottlenecks: this.metrics.bottlenecks,
      realtime: this.metrics.realtime
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voidcore-performance-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    console.log('📊 Performance data exported');
  }
  
  // オブザーバー パターン
  addObserver(observer) {
    this.observers.add(observer);
  }
  
  removeObserver(observer) {
    this.observers.delete(observer);
  }
  
  notifyObservers(event, data) {
    this.observers.forEach(observer => {
      if (typeof observer === 'function') {
        observer(event, data);
      } else if (observer.onPerformanceEvent) {
        observer.onPerformanceEvent(event, data);
      }
    });
  }
  
  getMetrics() {
    return {
      system: { ...this.metrics.system },
      pluginCount: this.metrics.plugins.size,
      bottleneckCount: this.metrics.bottlenecks.length,
      isRunning: this.isRunning
    };
  }
  
  dispose() {
    this.pause();
    
    // UI削除
    if (this.container) {
      this.container.innerHTML = '';
    }
    
    // データクリア
    this.metrics.plugins.clear();
    this.metrics.bottlenecks = [];
    this.observers.clear();
    
    console.log('🧹 PerformanceMetricsSystem disposed');
  }
}

export default PerformanceMetricsSystem;