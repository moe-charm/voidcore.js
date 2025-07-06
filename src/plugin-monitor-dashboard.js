// plugin-monitor-dashboard.js - プラグイン状態監視ダッシュボード
// VoidIDEでのプラグイン状態リアルタイム監視・管理

/**
 * 📊 PluginMonitorDashboard - プラグイン状態監視ダッシュボード
 * 
 * VoidCoreプラグインの状態を詳細にリアルタイム監視
 * - プラグインライフサイクル追跡
 * - パフォーマンス測定
 * - エラー監視・アラート
 * - 依存関係分析
 * - リソース使用量監視
 */

export class PluginMonitorDashboard {
  constructor(container, voidCore) {
    this.container = container;
    this.voidCore = voidCore;
    this.isRunning = false;
    
    // 監視データ
    this.plugins = new Map(); // pluginId -> PluginMetrics
    this.healthChecks = new Map(); // pluginId -> HealthData
    this.performanceData = new Map(); // pluginId -> PerformanceMetrics
    this.errorLog = [];
    this.systemMetrics = {
      totalPlugins: 0,
      activePlugins: 0,
      errorCount: 0,
      messageRate: 0,
      avgResponseTime: 0
    };
    
    // UI要素
    this.elements = {
      dashboard: null,
      pluginList: null,
      systemPanel: null,
      detailPanel: null,
      alertPanel: null
    };
    
    // 更新間隔
    this.updateInterval = null;
    this.updateFrequency = 1000; // 1秒間隔
    
    // アラート設定
    this.alertThresholds = {
      errorRate: 0.1, // 10%エラー率
      responseTime: 5000, // 5秒応答時間
      memoryUsage: 100 * 1024 * 1024, // 100MB
      inactiveTime: 30000 // 30秒非アクティブ
    };
  }

  // ==========================================
  // 🚀 初期化・UI構築
  // ==========================================
  
  async initialize() {
    try {
      // ダッシュボードUI作成
      this.createDashboardUI();
      
      // VoidCoreメッセージ監視開始
      this.startVoidCoreMonitoring();
      
      // ヘルスチェック開始
      this.startHealthChecking();
      
      // 定期更新開始
      this.startPeriodicUpdates();
      
      console.log('📊 PluginMonitorDashboard initialized');
      return true;
      
    } catch (error) {
      console.error('❌ PluginMonitorDashboard initialization failed:', error);
      return false;
    }
  }
  
  createDashboardUI() {
    // メインダッシュボードコンテナ
    this.elements.dashboard = document.createElement('div');
    this.elements.dashboard.className = 'plugin-monitor-dashboard';
    this.elements.dashboard.innerHTML = `
      <div class="dashboard-header">
        <h3>🔧 Plugin Monitor Dashboard</h3>
        <div class="dashboard-controls">
          <button class="refresh-btn" onclick="this.refreshAll()">🔄 Refresh</button>
          <button class="settings-btn" onclick="this.openSettings()">⚙️ Settings</button>
        </div>
      </div>
      
      <div class="dashboard-content">
        <!-- システム全体パネル -->
        <div class="system-metrics-panel">
          <h4>📈 System Metrics</h4>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-value" id="totalPlugins">0</div>
              <div class="metric-label">Total Plugins</div>
            </div>
            <div class="metric-card">
              <div class="metric-value" id="activePlugins">0</div>
              <div class="metric-label">Active Plugins</div>
            </div>
            <div class="metric-card">
              <div class="metric-value" id="errorCount">0</div>
              <div class="metric-label">Errors</div>
            </div>
            <div class="metric-card">
              <div class="metric-value" id="messageRate">0</div>
              <div class="metric-label">Messages/sec</div>
            </div>
          </div>
        </div>
        
        <!-- プラグインリストパネル -->
        <div class="plugin-list-panel">
          <h4>🔧 Plugin Status</h4>
          <div class="plugin-filters">
            <select id="statusFilter">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="error">Error</option>
            </select>
            <input type="text" id="searchFilter" placeholder="Search plugins...">
          </div>
          <div class="plugin-list" id="pluginList"></div>
        </div>
        
        <!-- 詳細パネル -->
        <div class="detail-panel">
          <h4>📊 Plugin Details</h4>
          <div class="detail-content" id="detailContent">
            <div class="no-selection">Select a plugin to view details</div>
          </div>
        </div>
        
        <!-- アラートパネル -->
        <div class="alert-panel">
          <h4>🚨 Alerts & Warnings</h4>
          <div class="alert-list" id="alertList"></div>
        </div>
      </div>
    `;
    
    // スタイル追加
    this.addDashboardStyles();
    
    // コンテナに追加
    this.container.appendChild(this.elements.dashboard);
    
    // 要素参照を取得
    this.elements.pluginList = document.getElementById('pluginList');
    this.elements.systemPanel = this.elements.dashboard.querySelector('.system-metrics-panel');
    this.elements.detailPanel = document.getElementById('detailContent');
    this.elements.alertPanel = document.getElementById('alertList');
    
    // イベントリスナー設定
    this.setupEventListeners();
  }
  
  addDashboardStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .plugin-monitor-dashboard {
        background: #252526;
        border-radius: 8px;
        padding: 15px;
        height: 100%;
        overflow-y: auto;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }
      
      .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 1px solid #3e3e42;
      }
      
      .dashboard-header h3 {
        color: #cccccc;
        margin: 0;
      }
      
      .dashboard-controls button {
        background: #0e639c;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        margin-left: 5px;
        font-size: 12px;
      }
      
      .dashboard-controls button:hover {
        background: #1177bb;
      }
      
      .dashboard-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: auto 1fr auto;
        gap: 15px;
        height: calc(100% - 60px);
      }
      
      .system-metrics-panel {
        grid-column: 1 / -1;
        background: #1e1e1e;
        border-radius: 6px;
        padding: 15px;
      }
      
      .system-metrics-panel h4 {
        color: #cccccc;
        margin: 0 0 15px 0;
        font-size: 14px;
      }
      
      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 10px;
      }
      
      .metric-card {
        background: #2d2d30;
        border-radius: 4px;
        padding: 12px;
        text-align: center;
      }
      
      .metric-value {
        font-size: 24px;
        font-weight: bold;
        color: #4fc1ff;
        margin-bottom: 5px;
      }
      
      .metric-label {
        font-size: 11px;
        color: #cccccc;
        text-transform: uppercase;
      }
      
      .plugin-list-panel {
        background: #1e1e1e;
        border-radius: 6px;
        padding: 15px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      
      .plugin-list-panel h4 {
        color: #cccccc;
        margin: 0 0 15px 0;
        font-size: 14px;
      }
      
      .plugin-filters {
        display: flex;
        gap: 10px;
        margin-bottom: 15px;
      }
      
      .plugin-filters select,
      .plugin-filters input {
        background: #2d2d30;
        border: 1px solid #3e3e42;
        color: #cccccc;
        padding: 6px 8px;
        border-radius: 4px;
        font-size: 12px;
      }
      
      .plugin-filters input {
        flex: 1;
      }
      
      .plugin-list {
        flex: 1;
        overflow-y: auto;
      }
      
      .plugin-item {
        background: #2d2d30;
        border-radius: 4px;
        padding: 10px;
        margin-bottom: 8px;
        cursor: pointer;
        transition: background 0.2s;
      }
      
      .plugin-item:hover {
        background: #3e3e42;
      }
      
      .plugin-item.selected {
        background: #094771;
      }
      
      .plugin-item.error {
        border-left: 3px solid #f48771;
      }
      
      .plugin-item.warning {
        border-left: 3px solid #dcdcaa;
      }
      
      .plugin-item.success {
        border-left: 3px solid #73c991;
      }
      
      .plugin-name {
        font-weight: bold;
        color: #4fc1ff;
        font-size: 13px;
      }
      
      .plugin-status {
        font-size: 11px;
        color: #cccccc;
        margin-top: 2px;
      }
      
      .plugin-metrics {
        display: flex;
        justify-content: space-between;
        margin-top: 5px;
        font-size: 10px;
        color: #888;
      }
      
      .detail-panel {
        background: #1e1e1e;
        border-radius: 6px;
        padding: 15px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      
      .detail-panel h4 {
        color: #cccccc;
        margin: 0 0 15px 0;
        font-size: 14px;
      }
      
      .detail-content {
        flex: 1;
        overflow-y: auto;
      }
      
      .no-selection {
        color: #888;
        text-align: center;
        padding: 40px 20px;
        font-style: italic;
      }
      
      .detail-section {
        margin-bottom: 20px;
      }
      
      .detail-section h5 {
        color: #cccccc;
        margin: 0 0 8px 0;
        font-size: 12px;
        text-transform: uppercase;
      }
      
      .detail-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        font-size: 12px;
      }
      
      .detail-item {
        display: flex;
        justify-content: space-between;
        color: #cccccc;
        padding: 4px 0;
      }
      
      .detail-value {
        color: #4fc1ff;
        font-family: monospace;
      }
      
      .alert-panel {
        grid-column: 1 / -1;
        background: #1e1e1e;
        border-radius: 6px;
        padding: 15px;
        max-height: 200px;
        overflow-y: auto;
      }
      
      .alert-panel h4 {
        color: #cccccc;
        margin: 0 0 15px 0;
        font-size: 14px;
      }
      
      .alert-item {
        background: #2d2d30;
        border-radius: 4px;
        padding: 8px 12px;
        margin-bottom: 8px;
        font-size: 12px;
      }
      
      .alert-item.error {
        border-left: 3px solid #f48771;
      }
      
      .alert-item.warning {
        border-left: 3px solid #dcdcaa;
      }
      
      .alert-item.info {
        border-left: 3px solid #4fc1ff;
      }
      
      .alert-time {
        color: #888;
        font-size: 10px;
        float: right;
      }
      
      .alert-message {
        color: #cccccc;
      }
    `;
    
    document.head.appendChild(style);
  }

  // ==========================================
  // 📡 VoidCore監視
  // ==========================================
  
  startVoidCoreMonitoring() {
    // プラグイン登録監視
    const originalRegisterPlugin = this.voidCore.registerPlugin.bind(this.voidCore);
    this.voidCore.registerPlugin = (plugin) => {
      const result = originalRegisterPlugin(plugin);
      if (result) {
        this.onPluginRegistered(plugin);
      }
      return result;
    };
    
    // プラグイン削除監視
    const originalUnregisterPlugin = this.voidCore.unregisterPlugin.bind(this.voidCore);
    this.voidCore.unregisterPlugin = (pluginId) => {
      const result = originalUnregisterPlugin(pluginId);
      if (result) {
        this.onPluginUnregistered(pluginId);
      }
      return result;
    };
    
    // メッセージ監視
    const originalPublish = this.voidCore.publish.bind(this.voidCore);
    this.voidCore.publish = async (message) => {
      const startTime = performance.now();
      
      try {
        const result = await originalPublish(message);
        const endTime = performance.now();
        
        this.recordMessageMetrics(message, endTime - startTime, true);
        return result;
        
      } catch (error) {
        const endTime = performance.now();
        this.recordMessageMetrics(message, endTime - startTime, false, error);
        throw error;
      }
    };
    
    console.log('📡 VoidCore monitoring started');
  }
  
  onPluginRegistered(plugin) {
    const pluginId = plugin.pluginId || plugin.id;
    
    const metrics = {
      pluginId: pluginId,
      name: plugin.name || pluginId,
      version: plugin.version || '1.0.0',
      capabilities: plugin.capabilities || [],
      
      // 状態情報
      status: 'registered',
      startTime: Date.now(),
      lastActivity: Date.now(),
      uptime: 0,
      
      // パフォーマンス指標
      messagesSent: 0,
      messagesReceived: 0,
      averageResponseTime: 0,
      errorCount: 0,
      errorRate: 0,
      
      // リソース使用量（推定）
      memoryUsage: 0,
      cpuUsage: 0,
      
      // ヘルスチェック
      healthStatus: 'unknown',
      lastHealthCheck: null,
      
      // 依存関係
      dependencies: new Set(),
      dependents: new Set()
    };
    
    this.plugins.set(pluginId, metrics);
    this.addAlert('info', `Plugin registered: ${pluginId}`);
    
    // プラグイン実行監視
    if (typeof plugin.run === 'function') {
      const originalRun = plugin.run.bind(plugin);
      plugin.run = async (...args) => {
        metrics.status = 'starting';
        try {
          const result = await originalRun(...args);
          metrics.status = 'active';
          metrics.lastActivity = Date.now();
          this.addAlert('info', `Plugin started: ${pluginId}`);
          return result;
        } catch (error) {
          metrics.status = 'error';
          metrics.errorCount++;
          this.addAlert('error', `Plugin start failed: ${pluginId} - ${error.message}`);
          throw error;
        }
      };
    }
    
    this.updateUI();
  }
  
  onPluginUnregistered(pluginId) {
    this.plugins.delete(pluginId);
    this.healthChecks.delete(pluginId);
    this.performanceData.delete(pluginId);
    this.addAlert('info', `Plugin unregistered: ${pluginId}`);
    this.updateUI();
  }
  
  recordMessageMetrics(message, responseTime, success, error = null) {
    // 送信者の記録
    if (message.payload && message.payload.from) {
      const senderMetrics = this.plugins.get(message.payload.from);
      if (senderMetrics) {
        senderMetrics.messagesSent++;
        senderMetrics.lastActivity = Date.now();
        
        if (success) {
          // 平均応答時間更新
          const oldAvg = senderMetrics.averageResponseTime;
          const count = senderMetrics.messagesSent;
          senderMetrics.averageResponseTime = ((oldAvg * (count - 1)) + responseTime) / count;
        } else {
          senderMetrics.errorCount++;
          senderMetrics.errorRate = senderMetrics.errorCount / senderMetrics.messagesSent;
        }
      }
    }
    
    // 全体の統計更新
    this.updateSystemMetrics();
  }

  // ==========================================
  // 💊 ヘルスチェック
  // ==========================================
  
  startHealthChecking() {
    // 定期ヘルスチェック
    setInterval(() => {
      this.performHealthChecks();
    }, 10000); // 10秒間隔
    
    // ヘルスチェック応答監視
    this.voidCore.subscribe('IntentResponse', (message) => {
      if (message.action === 'core.health.ping') {
        this.recordHealthResponse(message);
      }
    });
    
    console.log('💊 Health checking started');
  }
  
  async performHealthChecks() {
    const plugins = Array.from(this.plugins.keys());
    
    for (const pluginId of plugins) {
      try {
        // ヘルスチェック要求送信
        await this.voidCore.publish({
          type: 'IntentRequest',
          action: 'core.health.ping',
          payload: {
            targetPlugin: pluginId,
            timestamp: Date.now()
          }
        });
        
        // タイムアウト処理
        setTimeout(() => {
          const health = this.healthChecks.get(pluginId);
          if (!health || Date.now() - health.lastCheck > 5000) {
            this.recordHealthTimeout(pluginId);
          }
        }, 5000);
        
      } catch (error) {
        this.recordHealthError(pluginId, error);
      }
    }
  }
  
  recordHealthResponse(message) {
    const pluginId = message.payload.pluginId;
    const responseTime = Date.now() - message.payload.timestamp;
    
    const healthData = {
      status: message.payload.status || 'OK',
      responseTime: responseTime,
      lastCheck: Date.now(),
      uptime: message.payload.uptime || 0,
      customData: message.payload
    };
    
    this.healthChecks.set(pluginId, healthData);
    
    const metrics = this.plugins.get(pluginId);
    if (metrics) {
      metrics.healthStatus = healthData.status;
      metrics.lastHealthCheck = Date.now();
    }
    
    // アラート判定
    if (responseTime > this.alertThresholds.responseTime) {
      this.addAlert('warning', `Slow health response: ${pluginId} (${responseTime}ms)`);
    }
  }
  
  recordHealthTimeout(pluginId) {
    const metrics = this.plugins.get(pluginId);
    if (metrics) {
      metrics.healthStatus = 'timeout';
      metrics.lastHealthCheck = Date.now();
    }
    
    this.addAlert('warning', `Health check timeout: ${pluginId}`);
  }
  
  recordHealthError(pluginId, error) {
    const metrics = this.plugins.get(pluginId);
    if (metrics) {
      metrics.healthStatus = 'error';
      metrics.lastHealthCheck = Date.now();
      metrics.errorCount++;
    }
    
    this.addAlert('error', `Health check error: ${pluginId} - ${error.message}`);
  }

  // ==========================================
  // 📊 統計・UI更新
  // ==========================================
  
  updateSystemMetrics() {
    const allPlugins = Array.from(this.plugins.values());
    
    this.systemMetrics = {
      totalPlugins: allPlugins.length,
      activePlugins: allPlugins.filter(p => p.status === 'active').length,
      errorCount: allPlugins.reduce((sum, p) => sum + p.errorCount, 0),
      messageRate: this.calculateMessageRate(),
      avgResponseTime: this.calculateAverageResponseTime()
    };
  }
  
  calculateMessageRate() {
    // 直近1分間のメッセージレート計算
    const now = Date.now();
    const recentMessages = Array.from(this.plugins.values())
      .filter(p => now - p.lastActivity < 60000)
      .reduce((sum, p) => sum + p.messagesSent, 0);
    
    return Math.round(recentMessages / 60); // messages per second
  }
  
  calculateAverageResponseTime() {
    const allPlugins = Array.from(this.plugins.values());
    const activePLugins = allPlugins.filter(p => p.averageResponseTime > 0);
    
    if (activePLugins.length === 0) return 0;
    
    const totalResponseTime = activePLugins.reduce((sum, p) => sum + p.averageResponseTime, 0);
    return Math.round(totalResponseTime / activePLugins.length);
  }
  
  updateUI() {
    this.updateSystemMetricsUI();
    this.updatePluginListUI();
    this.updateAlertPanelUI();
  }
  
  updateSystemMetricsUI() {
    document.getElementById('totalPlugins').textContent = this.systemMetrics.totalPlugins;
    document.getElementById('activePlugins').textContent = this.systemMetrics.activePlugins;
    document.getElementById('errorCount').textContent = this.systemMetrics.errorCount;
    document.getElementById('messageRate').textContent = this.systemMetrics.messageRate;
  }
  
  updatePluginListUI() {
    if (!this.elements.pluginList) return;
    
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const searchFilter = document.getElementById('searchFilter')?.value.toLowerCase() || '';
    
    // フィルタリング
    const filteredPlugins = Array.from(this.plugins.values()).filter(plugin => {
      const statusMatch = statusFilter === 'all' || plugin.status === statusFilter;
      const searchMatch = searchFilter === '' || 
        plugin.name.toLowerCase().includes(searchFilter) ||
        plugin.pluginId.toLowerCase().includes(searchFilter);
      
      return statusMatch && searchMatch;
    });
    
    // プラグインリスト表示
    this.elements.pluginList.innerHTML = '';
    
    if (filteredPlugins.length === 0) {
      this.elements.pluginList.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">No plugins found</div>';
      return;
    }
    
    filteredPlugins.forEach(plugin => {
      const item = document.createElement('div');
      item.className = `plugin-item ${this.getPluginStatusClass(plugin)}`;
      item.onclick = () => this.selectPlugin(plugin.pluginId);
      
      const uptime = Math.round((Date.now() - plugin.startTime) / 1000);
      const healthIcon = this.getHealthIcon(plugin.healthStatus);
      
      item.innerHTML = `
        <div class="plugin-name">${healthIcon} ${plugin.name}</div>
        <div class="plugin-status">Status: ${plugin.status} | Uptime: ${uptime}s</div>
        <div class="plugin-metrics">
          <span>Messages: ${plugin.messagesSent}</span>
          <span>Errors: ${plugin.errorCount}</span>
          <span>Avg Response: ${Math.round(plugin.averageResponseTime)}ms</span>
        </div>
      `;
      
      this.elements.pluginList.appendChild(item);
    });
  }
  
  getPluginStatusClass(plugin) {
    if (plugin.errorCount > 0 || plugin.status === 'error') return 'error';
    if (plugin.healthStatus === 'timeout' || plugin.errorRate > 0.05) return 'warning';
    if (plugin.status === 'active') return 'success';
    return '';
  }
  
  getHealthIcon(healthStatus) {
    switch (healthStatus) {
      case 'OK': return '✅';
      case 'timeout': return '⏰';
      case 'error': return '❌';
      default: return '❓';
    }
  }
  
  selectPlugin(pluginId) {
    // 選択状態の更新
    document.querySelectorAll('.plugin-item').forEach(item => {
      item.classList.remove('selected');
    });
    
    event.currentTarget.classList.add('selected');
    
    // 詳細パネル更新
    this.showPluginDetails(pluginId);
  }
  
  showPluginDetails(pluginId) {
    const plugin = this.plugins.get(pluginId);
    const health = this.healthChecks.get(pluginId);
    
    if (!plugin) return;
    
    const uptime = Math.round((Date.now() - plugin.startTime) / 1000);
    const lastActivity = Math.round((Date.now() - plugin.lastActivity) / 1000);
    
    this.elements.detailPanel.innerHTML = `
      <div class="detail-section">
        <h5>Basic Information</h5>
        <div class="detail-grid">
          <div class="detail-item">
            <span>Plugin ID:</span>
            <span class="detail-value">${plugin.pluginId}</span>
          </div>
          <div class="detail-item">
            <span>Name:</span>
            <span class="detail-value">${plugin.name}</span>
          </div>
          <div class="detail-item">
            <span>Version:</span>
            <span class="detail-value">${plugin.version}</span>
          </div>
          <div class="detail-item">
            <span>Status:</span>
            <span class="detail-value">${plugin.status}</span>
          </div>
        </div>
      </div>
      
      <div class="detail-section">
        <h5>Performance Metrics</h5>
        <div class="detail-grid">
          <div class="detail-item">
            <span>Uptime:</span>
            <span class="detail-value">${uptime}s</span>
          </div>
          <div class="detail-item">
            <span>Last Activity:</span>
            <span class="detail-value">${lastActivity}s ago</span>
          </div>
          <div class="detail-item">
            <span>Messages Sent:</span>
            <span class="detail-value">${plugin.messagesSent}</span>
          </div>
          <div class="detail-item">
            <span>Messages Received:</span>
            <span class="detail-value">${plugin.messagesReceived}</span>
          </div>
          <div class="detail-item">
            <span>Error Count:</span>
            <span class="detail-value">${plugin.errorCount}</span>
          </div>
          <div class="detail-item">
            <span>Error Rate:</span>
            <span class="detail-value">${(plugin.errorRate * 100).toFixed(1)}%</span>
          </div>
          <div class="detail-item">
            <span>Avg Response Time:</span>
            <span class="detail-value">${Math.round(plugin.averageResponseTime)}ms</span>
          </div>
        </div>
      </div>
      
      <div class="detail-section">
        <h5>Health Status</h5>
        <div class="detail-grid">
          <div class="detail-item">
            <span>Health Status:</span>
            <span class="detail-value">${this.getHealthIcon(plugin.healthStatus)} ${plugin.healthStatus}</span>
          </div>
          <div class="detail-item">
            <span>Last Health Check:</span>
            <span class="detail-value">${plugin.lastHealthCheck ? Math.round((Date.now() - plugin.lastHealthCheck) / 1000) + 's ago' : 'Never'}</span>
          </div>
          ${health ? `
          <div class="detail-item">
            <span>Health Response Time:</span>
            <span class="detail-value">${health.responseTime}ms</span>
          </div>
          ` : ''}
        </div>
      </div>
      
      <div class="detail-section">
        <h5>Capabilities</h5>
        <div class="detail-content">
          ${plugin.capabilities.length > 0 
            ? plugin.capabilities.map(cap => `<span class="capability-tag">${cap}</span>`).join(' ')
            : '<span style="color: #888;">No capabilities defined</span>'}
        </div>
      </div>
    `;
  }

  // ==========================================
  // 🚨 アラート管理
  // ==========================================
  
  addAlert(type, message) {
    const alert = {
      id: Date.now(),
      type: type,
      message: message,
      timestamp: Date.now()
    };
    
    this.errorLog.unshift(alert);
    
    // アラート数制限
    if (this.errorLog.length > 50) {
      this.errorLog.pop();
    }
    
    this.updateAlertPanelUI();
  }
  
  updateAlertPanelUI() {
    if (!this.elements.alertPanel) return;
    
    this.elements.alertPanel.innerHTML = '';
    
    if (this.errorLog.length === 0) {
      this.elements.alertPanel.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">No alerts</div>';
      return;
    }
    
    this.errorLog.slice(0, 10).forEach(alert => { // 最新10件表示
      const item = document.createElement('div');
      item.className = `alert-item ${alert.type}`;
      
      const timeStr = new Date(alert.timestamp).toLocaleTimeString();
      
      item.innerHTML = `
        <div class="alert-time">${timeStr}</div>
        <div class="alert-message">${alert.message}</div>
      `;
      
      this.elements.alertPanel.appendChild(item);
    });
  }

  // ==========================================
  // 🔧 ユーティリティ・制御
  // ==========================================
  
  setupEventListeners() {
    // フィルタリング
    document.getElementById('statusFilter')?.addEventListener('change', () => {
      this.updatePluginListUI();
    });
    
    document.getElementById('searchFilter')?.addEventListener('input', () => {
      this.updatePluginListUI();
    });
  }
  
  startPeriodicUpdates() {
    this.updateInterval = setInterval(() => {
      this.updateSystemMetrics();
      this.updateUI();
      
      // プラグインのuptimeを更新
      this.plugins.forEach(plugin => {
        plugin.uptime = Date.now() - plugin.startTime;
      });
      
    }, this.updateFrequency);
    
    this.isRunning = true;
  }
  
  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    this.isRunning = false;
    console.log('📊 PluginMonitorDashboard stopped');
  }
  
  refreshAll() {
    this.updateSystemMetrics();
    this.updateUI();
    console.log('🔄 Dashboard refreshed');
  }
  
  getStats() {
    return {
      totalPlugins: this.plugins.size,
      systemMetrics: this.systemMetrics,
      alerts: this.errorLog.length,
      isRunning: this.isRunning
    };
  }
  
  dispose() {
    this.stop();
    
    if (this.elements.dashboard && this.container.contains(this.elements.dashboard)) {
      this.container.removeChild(this.elements.dashboard);
    }
    
    console.log('🧹 PluginMonitorDashboard disposed');
  }
}

export default PluginMonitorDashboard;