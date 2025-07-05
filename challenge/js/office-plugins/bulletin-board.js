// BulletinBoardPlugin - 会社のお知らせとシステム通知を管理
import { AutonomousPlugin } from '../../../src/autonomous_plugin.js';
import { Message } from '../../../src/message.js';

export class BulletinBoardPlugin extends AutonomousPlugin {
  constructor() {
    super("BulletinBoard");
    this.role = "bulletin_board";
    this.container = null;
    this.bulletins = [];
    this.systemNotifications = [];
    this.priorityQueue = [];
  }

  // Phase 1: Preparation - 掲示板UI作成
  async _prepare() {
    this.container = document.getElementById('bulletin-board-container');
    if (!this.container) {
      this.log('⚠️ BulletinBoard container not found');
      return;
    }

    // 初期のお知らせを設定
    this.initializeDefaultBulletins();
    
    // UI作成
    this.createBulletinUI();
    
    this.log('📢 Bulletin board ready');
  }

  // Phase 3: Observation - あらゆるNoticeとIntentを監視
  async _observe() {
    // Intent関連 - システムからの要求に反応
    this.subscribeToType('project.query');
    this.subscribeToType('team.status_check');
    this.subscribeToType('document.urgent_search');
    this.subscribeToType('meeting.preparation');
    this.subscribeToType('onboarding.assistance');
    
    // Notice関連 - システム全体の通知を受信
    this.subscribeToType('user.action_taken');
    this.subscribeToType('document.update');
    this.subscribeToType('chat.notification');
    this.subscribeToType('system.info');
    this.subscribeToType('plugin.debut');
    this.subscribeToType('plugin.retirement');

    this.log('👁️ Monitoring all system communications');
  }

  // Phase 4: Work - リアルタイム更新
  async _work() {
    // 定期的に掲示板を更新
    this.updateBulletinDisplay();
    this.processNotificationQueue();
  }

  // 初期お知らせを設定
  initializeDefaultBulletins() {
    this.bulletins = [
      {
        id: 'welcome',
        type: 'welcome',
        title: '🎉 Welcome to Nexus Corporation!',
        content: 'Welcome Alex Chen! Your VoidCore Network account is now active.',
        timestamp: new Date(Date.now() - 3600000).toLocaleString(), // 1 hour ago
        priority: 'high',
        author: 'HR System',
        tags: ['onboarding', 'welcome']
      },
      {
        id: 'project-phoenix',
        type: 'project',
        title: '🚀 Project Phoenix - Q3 Update',
        content: 'Project Phoenix is moving into Phase 2. All team members should review the updated specifications.',
        timestamp: new Date(Date.now() - 7200000).toLocaleString(), // 2 hours ago
        priority: 'high',
        author: 'Project Management',
        tags: ['phoenix', 'project', 'update']
      },
      {
        id: 'system-upgrade',
        type: 'technical',
        title: '⚙️ VoidCore Network v11.0 Deployment',
        content: 'Our new autonomous plugin system is now live! Experience seamless inter-component communication.',
        timestamp: new Date(Date.now() - 86400000).toLocaleString(), // 1 day ago
        priority: 'medium',
        author: 'IT Department',
        tags: ['voidcore', 'system', 'upgrade']
      }
    ];
  }

  // 掲示板UI作成
  createBulletinUI() {
    this.container.innerHTML = `
      <div class="bulletin-header">
        <div class="bulletin-controls">
          <button class="filter-btn active" data-filter="all">All Updates</button>
          <button class="filter-btn" data-filter="high">High Priority</button>
          <button class="filter-btn" data-filter="system">System</button>
        </div>
        <div class="bulletin-stats">
          <span class="stat-item">📊 <span id="total-bulletins">${this.bulletins.length}</span> Total</span>
          <span class="stat-item">🔥 <span id="high-priority">0</span> Priority</span>
        </div>
      </div>
      <div id="bulletin-list" class="bulletin-list"></div>
      <div id="system-notifications" class="system-notifications">
        <h4>🔔 Live System Notifications</h4>
        <div id="notification-stream" class="notification-stream"></div>
      </div>
    `;

    // フィルターボタンにイベントリスナー追加
    this.addFilterListeners();
    
    // 初期表示
    this.updateBulletinDisplay();
  }

  // フィルター機能
  addFilterListeners() {
    const filterButtons = this.container.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        // アクティブ状態の更新
        filterButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        // フィルター適用
        const filter = e.target.dataset.filter;
        this.applyFilter(filter);
      });
    });
  }

  // フィルター適用
  applyFilter(filter) {
    let filteredBulletins = this.bulletins;
    
    switch(filter) {
      case 'high':
        filteredBulletins = this.bulletins.filter(b => b.priority === 'high');
        break;
      case 'system':
        filteredBulletins = this.bulletins.filter(b => b.type === 'technical' || b.author.includes('System'));
        break;
      default:
        filteredBulletins = this.bulletins;
    }
    
    this.displayBulletins(filteredBulletins);
    this.log(`🔍 Filter applied: ${filter} (${filteredBulletins.length} items)`);
  }

  // 掲示板表示更新
  updateBulletinDisplay() {
    this.displayBulletins(this.bulletins);
    this.updateStats();
  }

  // 掲示板アイテム表示
  displayBulletins(bulletins) {
    const listContainer = document.getElementById('bulletin-list');
    if (!listContainer) return;

    listContainer.innerHTML = bulletins.map(bulletin => `
      <div class="bulletin-item ${bulletin.priority}" data-id="${bulletin.id}">
        <div class="bulletin-header-item">
          <h4 class="bulletin-title">${bulletin.title}</h4>
          <span class="bulletin-priority ${bulletin.priority}">${bulletin.priority.toUpperCase()}</span>
        </div>
        <div class="bulletin-content">${bulletin.content}</div>
        <div class="bulletin-meta">
          <span class="bulletin-author">👤 ${bulletin.author}</span>
          <span class="bulletin-time">🕒 ${bulletin.timestamp}</span>
          <div class="bulletin-tags">
            ${bulletin.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
          </div>
        </div>
      </div>
    `).join('');
  }

  // 統計情報更新
  updateStats() {
    const totalElement = document.getElementById('total-bulletins');
    const highPriorityElement = document.getElementById('high-priority');
    
    if (totalElement) totalElement.textContent = this.bulletins.length;
    if (highPriorityElement) {
      const highPriorityCount = this.bulletins.filter(b => b.priority === 'high').length;
      highPriorityElement.textContent = highPriorityCount;
    }
  }

  // Intent処理 - ユーザーの要求に自律的に反応
  _handleIntent(message) {
    super._handleIntent(message);
    
    switch(message.action) {
      case 'project.query':
        this.handleProjectQuery(message.payload);
        break;
      case 'team.status_check':
        this.handleTeamStatusCheck(message.payload);
        break;
      case 'onboarding.assistance':
        this.handleOnboardingAssistance(message.payload);
        break;
    }
  }

  // プロジェクト情報クエリ処理
  async handleProjectQuery(payload) {
    this.log(`🔍 Processing project query: ${payload.project}`);
    
    if (payload.project === 'Phoenix') {
      // Project Phoenix関連の重要情報を前面に出す
      const phoenixUpdate = {
        id: `phoenix-response-${Date.now()}`,
        type: 'urgent',
        title: '🔥 Project Phoenix - Latest Updates Available!',
        content: `📋 Status: Phase 2 initiated<br>👥 Team: 12 active members<br>📅 Next milestone: July 30th<br>🎯 Progress: 68% complete`,
        timestamp: new Date().toLocaleString(),
        priority: 'high',
        author: 'Project Phoenix AI Assistant',
        tags: ['phoenix', 'live-update', 'requested']
      };
      
      this.addBulletin(phoenixUpdate);
      
      // システムに完了通知
      await this.publish(Message.notice('project.info_provided', {
        project: payload.project,
        requester: payload.requester,
        info_type: 'comprehensive_update'
      }).withSource(this.capabilityName));
    }
  }

  // チームステータス確認処理
  async handleTeamStatusCheck(payload) {
    this.log(`👥 Processing team status check: ${payload.department}`);
    
    const teamUpdate = {
      id: `team-status-${Date.now()}`,
      type: 'team',
      title: '👥 Engineering Team - Real-time Status',
      content: `🟢 Online: 8 members<br>🟡 In Meetings: 3 members<br>🔴 Offline: 1 member<br>📊 Current Focus: Project Phoenix (67%), Bug Fixes (33%)`,
      timestamp: new Date().toLocaleString(),
      priority: 'medium',
      author: 'Team Management System',
      tags: ['team', 'status', 'engineering']
    };
    
    this.addBulletin(teamUpdate);
  }

  // オンボーディング支援処理
  async handleOnboardingAssistance(payload) {
    this.log(`🆘 Processing onboarding assistance for: ${payload.employee_type}`);
    
    const onboardingInfo = {
      id: `onboarding-${Date.now()}`,
      type: 'help',
      title: '🎯 New Employee Quick Start Guide',
      content: `📚 Essential Reading: VoidCore Network Guide<br>🔐 Access Setup: Complete by EOD<br>👥 Buddy System: Sarah Kim assigned<br>📅 First Week Schedule: Available in calendar`,
      timestamp: new Date().toLocaleString(),
      priority: 'high',
      author: 'HR Onboarding System',
      tags: ['onboarding', 'new-employee', 'priority']
    };
    
    this.addBulletin(onboardingInfo);
  }

  // Notice処理 - システム全体の動きに反応
  _handleNotice(message) {
    super._handleNotice(message);
    
    // ユーザーアクションの記録
    if (message.event_name === 'user.action_taken') {
      this.addSystemNotification(
        `👤 ${message.payload.user} performed: ${message.payload.action}`,
        'user-action'
      );
    }
    
    // プラグインの生死を監視
    if (message.event_name === 'plugin.debut') {
      this.addSystemNotification(
        `🎭 Plugin "${message.payload.capability}" joined the network`,
        'plugin-lifecycle'
      );
    }
  }

  // 新しい掲示板アイテム追加
  addBulletin(bulletin) {
    this.bulletins.unshift(bulletin); // 最新を先頭に
    
    // 最大20件まで保持
    if (this.bulletins.length > 20) {
      this.bulletins = this.bulletins.slice(0, 20);
    }
    
    this.updateBulletinDisplay();
    this.highlightNewBulletin(bulletin.id);
    
    this.log(`📢 New bulletin added: ${bulletin.title}`);
  }

  // 新しい掲示板アイテムをハイライト
  highlightNewBulletin(bulletinId) {
    setTimeout(() => {
      const element = document.querySelector(`[data-id="${bulletinId}"]`);
      if (element) {
        element.style.animation = 'newBulletinPulse 2s ease-out';
        element.style.border = '2px solid #4a90e2';
        
        setTimeout(() => {
          element.style.animation = '';
          element.style.border = '';
        }, 2000);
      }
    }, 100);
  }

  // システム通知追加
  addSystemNotification(message, type) {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    
    this.systemNotifications.unshift(notification);
    
    // 最大10件まで保持
    if (this.systemNotifications.length > 10) {
      this.systemNotifications = this.systemNotifications.slice(0, 10);
    }
    
    this.updateNotificationStream();
  }

  // 通知ストリーム更新
  updateNotificationStream() {
    const stream = document.getElementById('notification-stream');
    if (!stream) return;
    
    stream.innerHTML = this.systemNotifications.map(notif => `
      <div class="notification-item ${notif.type}">
        <span class="notification-time">${notif.timestamp}</span>
        <span class="notification-message">${notif.message}</span>
      </div>
    `).join('');
  }

  // 通知キュー処理
  processNotificationQueue() {
    // 優先度の高い通知を処理
    if (this.priorityQueue.length > 0) {
      const notification = this.priorityQueue.shift();
      this.addSystemNotification(notification.message, notification.type);
    }
  }

  // クリーンアップ
  async _cleanup() {
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.log('🧹 Bulletin board cleaned up');
  }
}