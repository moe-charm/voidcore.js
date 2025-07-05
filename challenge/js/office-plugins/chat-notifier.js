// ChatNotifierPlugin - インテリジェント・チーム・コミュニケーション・ハブ
import { AutonomousPlugin } from '../../../src/autonomous_plugin.js';
import { Message } from '../../../src/message.js';

export class ChatNotifierPlugin extends AutonomousPlugin {
  constructor() {
    super("ChatNotifier");
    this.role = "chat_coordinator";
    this.container = null;
    this.channels = [];
    this.notifications = [];
    this.activeConversations = [];
    this.mentionQueue = [];
    this.smartSuggestions = [];
  }

  // Phase 1: Preparation - チャット通知システム構築
  async _prepare() {
    this.container = document.getElementById('chat-notifier-container');
    if (!this.container) {
      this.log('⚠️ ChatNotifier container not found');
      return;
    }

    // 初期チャンネルとメッセージ設定
    this.initializeChatData();
    
    // UI作成
    this.createChatNotifierUI();
    
    this.log('💬 Chat notification system ready');
  }

  // Phase 3: Observation - チーム・コミュニケーション関連の全監視
  async _observe() {
    // Intent監視 - ユーザーからのコミュニケーション要求
    this.subscribeToType('project.query');
    this.subscribeToType('team.status_check');
    this.subscribeToType('meeting.preparation');
    this.subscribeToType('onboarding.assistance');
    this.subscribeToType('document.urgent_search');
    
    // Notice監視 - システム全体の動きに反応
    this.subscribeToType('user.action_taken');
    this.subscribeToType('document.accessed');
    this.subscribeToType('document.featured');
    this.subscribeToType('project.info_provided');
    this.subscribeToType('plugin.debut');

    this.log('👁️ Monitoring all team communication signals');
  }

  // Phase 4: Work - リアルタイム通知管理とスマート提案
  async _work() {
    this.updateNotificationFeed();
    this.processSmartSuggestions();
    this.updateChannelActivity();
  }

  // 初期チャットデータ設定
  initializeChatData() {
    this.channels = [
      {
        id: 'general',
        name: '💬 #general',
        description: 'Company-wide discussions',
        memberCount: 45,
        unreadCount: 3,
        lastActivity: '2 minutes ago',
        priority: 'medium',
        active: true
      },
      {
        id: 'project-phoenix',
        name: '🚀 #project-phoenix',
        description: 'Project Phoenix coordination',
        memberCount: 12,
        unreadCount: 8,
        lastActivity: '5 minutes ago',
        priority: 'high',
        active: true
      },
      {
        id: 'engineering',
        name: '⚙️ #engineering',
        description: 'Technical discussions',
        memberCount: 23,
        unreadCount: 2,
        lastActivity: '15 minutes ago',
        priority: 'medium',
        active: true
      },
      {
        id: 'new-employees',
        name: '🎯 #new-employees',
        description: 'Onboarding and help',
        memberCount: 8,
        unreadCount: 1,
        lastActivity: '1 hour ago',
        priority: 'medium',
        active: false
      },
      {
        id: 'random',
        name: '🎲 #random',
        description: 'Off-topic conversations',
        memberCount: 38,
        unreadCount: 0,
        lastActivity: '3 hours ago',
        priority: 'low',
        active: false
      }
    ];

    this.notifications = [
      {
        id: 'welcome-msg',
        channel: 'general',
        type: 'mention',
        message: 'Welcome to the team, Alex! 👋',
        sender: 'Sarah Kim',
        timestamp: new Date(Date.now() - 1800000).toLocaleTimeString(), // 30 min ago
        priority: 'high',
        read: false
      },
      {
        id: 'phoenix-update',
        channel: 'project-phoenix',
        type: 'channel',
        message: 'Phase 2 kickoff meeting scheduled for tomorrow',
        sender: 'Project Bot',
        timestamp: new Date(Date.now() - 3600000).toLocaleTimeString(), // 1 hour ago
        priority: 'high',
        read: false
      }
    ];
  }

  // チャット通知UI作成
  createChatNotifierUI() {
    this.container.innerHTML = `
      <div class="chat-header">
        <div class="chat-controls">
          <button class="chat-filter-btn active" data-filter="all">All Channels</button>
          <button class="chat-filter-btn" data-filter="active">Active Only</button>
          <button class="chat-filter-btn" data-filter="unread">Unread</button>
        </div>
        <div class="chat-stats">
          <span class="chat-stat">💬 <span id="total-channels">${this.channels.length}</span> Channels</span>
          <span class="chat-stat">🔔 <span id="unread-count">0</span> Unread</span>
        </div>
      </div>
      
      <div id="channel-list" class="channel-list"></div>
      
      <div class="notifications-section">
        <h4>🔔 Recent Notifications</h4>
        <div id="notification-feed" class="notification-feed"></div>
      </div>
      
      <div class="smart-suggestions">
        <h4>💡 Smart Suggestions</h4>
        <div id="suggestion-list" class="suggestion-list"></div>
      </div>
      
      <div class="quick-actions">
        <h4>⚡ Quick Actions</h4>
        <div class="action-buttons">
          <button class="quick-action-btn" id="join-phoenix">🚀 Join Phoenix Channel</button>
          <button class="quick-action-btn" id="dm-mentor">👤 DM Mentor</button>
          <button class="quick-action-btn" id="ask-help">❓ Ask for Help</button>
        </div>
      </div>
    `;

    // フィルターとアクションのイベントリスナー追加
    this.addChatEventListeners();
    
    // 初期表示
    this.updateNotificationFeed();
  }

  // チャットイベントリスナー
  addChatEventListeners() {
    // チャンネルフィルター
    const filterButtons = document.querySelectorAll('.chat-filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        filterButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        const filter = e.target.dataset.filter;
        this.applyChatFilter(filter);
      });
    });

    // クイックアクション
    const joinPhoenixBtn = document.getElementById('join-phoenix');
    const dmMentorBtn = document.getElementById('dm-mentor');
    const askHelpBtn = document.getElementById('ask-help');

    if (joinPhoenixBtn) {
      joinPhoenixBtn.addEventListener('click', () => this.handleJoinPhoenixChannel());
    }
    if (dmMentorBtn) {
      dmMentorBtn.addEventListener('click', () => this.handleDMToMentor());
    }
    if (askHelpBtn) {
      askHelpBtn.addEventListener('click', () => this.handleAskForHelp());
    }
  }

  // チャットフィルター適用
  applyChatFilter(filter) {
    let filteredChannels = this.channels;
    
    switch(filter) {
      case 'active':
        filteredChannels = this.channels.filter(ch => ch.active);
        break;
      case 'unread':
        filteredChannels = this.channels.filter(ch => ch.unreadCount > 0);
        break;
      default:
        filteredChannels = this.channels;
    }
    
    this.displayChannels(filteredChannels);
    this.log(`🔍 Chat filter applied: ${filter} (${filteredChannels.length} channels)`);
  }

  // 通知フィード更新
  updateNotificationFeed() {
    this.displayChannels(this.channels);
    this.displayNotifications();
    this.updateChatStats();
  }

  // チャンネル表示
  displayChannels(channels) {
    const listContainer = document.getElementById('channel-list');
    if (!listContainer) return;

    listContainer.innerHTML = channels.map(channel => `
      <div class="channel-item ${channel.priority} ${channel.active ? 'active' : 'inactive'}" data-id="${channel.id}">
        <div class="channel-header">
          <div class="channel-name">${channel.name}</div>
          <div class="channel-indicators">
            ${channel.unreadCount > 0 ? `<span class="unread-badge">${channel.unreadCount}</span>` : ''}
            <span class="activity-indicator ${channel.active ? 'online' : 'offline'}"></span>
          </div>
        </div>
        <div class="channel-description">${channel.description}</div>
        <div class="channel-meta">
          <span class="member-count">👥 ${channel.memberCount} members</span>
          <span class="last-activity">🕒 ${channel.lastActivity}</span>
        </div>
      </div>
    `).join('');

    // チャンネルクリックイベント
    listContainer.querySelectorAll('.channel-item').forEach(item => {
      item.addEventListener('click', () => {
        const channelId = item.dataset.id;
        this.handleChannelClick(channelId);
      });
    });
  }

  // 通知表示
  displayNotifications() {
    const feedContainer = document.getElementById('notification-feed');
    if (!feedContainer) return;

    feedContainer.innerHTML = this.notifications.map(notif => `
      <div class="notification-item ${notif.type} ${notif.read ? 'read' : 'unread'}">
        <div class="notification-header">
          <span class="notification-channel">${this.getChannelName(notif.channel)}</span>
          <span class="notification-time">${notif.timestamp}</span>
        </div>
        <div class="notification-message">${notif.message}</div>
        <div class="notification-sender">from ${notif.sender}</div>
      </div>
    `).join('');
  }

  // チャンネル名取得
  getChannelName(channelId) {
    const channel = this.channels.find(ch => ch.id === channelId);
    return channel ? channel.name : `#${channelId}`;
  }

  // チャット統計更新
  updateChatStats() {
    const totalElement = document.getElementById('total-channels');
    const unreadElement = document.getElementById('unread-count');
    
    if (totalElement) totalElement.textContent = this.channels.length;
    if (unreadElement) {
      const totalUnread = this.channels.reduce((sum, ch) => sum + ch.unreadCount, 0);
      unreadElement.textContent = totalUnread;
    }
  }

  // Intent処理 - システム要求に基づく自律的チャット提案
  _handleIntent(message) {
    super._handleIntent(message);
    
    switch(message.action) {
      case 'project.query':
        this.handleProjectChatAssistance(message.payload);
        break;
      case 'team.status_check':
        this.handleTeamChatRecommendations(message.payload);
        break;
      case 'onboarding.assistance':
        this.handleOnboardingChatSupport(message.payload);
        break;
      case 'meeting.preparation':
        this.handleMeetingChatPrep(message.payload);
        break;
    }
  }

  // プロジェクト関連チャット支援
  async handleProjectChatAssistance(payload) {
    this.log(`🚀 Providing chat assistance for project: ${payload.project}`);
    
    if (payload.project === 'Phoenix') {
      // Phoenix チャンネルをハイライト
      const phoenixChannel = this.channels.find(ch => ch.id === 'project-phoenix');
      if (phoenixChannel) {
        phoenixChannel.priority = 'high';
        phoenixChannel.active = true;
        phoenixChannel.unreadCount += 3; // 新しい関連メッセージをシミュレート
        
        // 新しい通知追加
        this.addNotification({
          channel: 'project-phoenix',
          type: 'channel',
          message: '📋 Latest Project Phoenix discussions available - check Phase 2 updates!',
          sender: 'Phoenix Bot',
          priority: 'high'
        });

        // スマート提案追加
        this.addSmartSuggestion({
          type: 'channel-join',
          title: '🚀 Join Project Phoenix Discussion',
          description: 'Active conversation about Phase 2 specifications',
          action: 'join-phoenix-chat'
        });
        
        this.highlightChannel('project-phoenix');
        this.updateNotificationFeed();
        
        // システムに応答
        await this.publish(Message.notice('chat.channel_highlighted', {
          channel: 'project-phoenix',
          reason: 'project_query_response',
          project: payload.project
        }).withSource(this.capabilityName));
      }
    }
  }

  // チーム状況チャット推奨
  async handleTeamChatRecommendations(payload) {
    this.log(`👥 Providing team chat recommendations`);
    
    // Engineering チャンネルをアクティブ化
    const engChannel = this.channels.find(ch => ch.id === 'engineering');
    if (engChannel) {
      engChannel.active = true;
      engChannel.unreadCount += 2;
      
      this.addNotification({
        channel: 'engineering',
        type: 'channel',
        message: '👥 Team status updates available - see who\'s working on what!',
        sender: 'Team Coordinator',
        priority: 'medium'
      });
      
      this.addSmartSuggestion({
        type: 'team-check',
        title: '👥 Check Team Status',
        description: 'See current team activities and availability',
        action: 'check-team-status'
      });
    }
  }

  // オンボーディングチャット支援
  async handleOnboardingChatSupport(payload) {
    this.log(`🎯 Providing onboarding chat support`);
    
    // New employees チャンネルをアクティブ化
    const newEmpChannel = this.channels.find(ch => ch.id === 'new-employees');
    if (newEmpChannel) {
      newEmpChannel.active = true;
      newEmpChannel.priority = 'high';
      newEmpChannel.unreadCount += 1;
      
      this.addNotification({
        channel: 'new-employees',
        type: 'mention',
        message: '🎯 Hey Alex! Sarah Kim is available to help with any questions',
        sender: 'Onboarding Bot',
        priority: 'high'
      });
      
      this.addSmartSuggestion({
        type: 'mentor-contact',
        title: '👤 Connect with Mentor',
        description: 'Sarah Kim is online and ready to help',
        action: 'dm-mentor'
      });
    }
  }

  // ミーティングチャット準備
  async handleMeetingChatPrep(payload) {
    this.log(`📅 Preparing meeting-related chat assistance`);
    
    this.addSmartSuggestion({
      type: 'meeting-prep',
      title: '📅 Share Meeting Agenda',
      description: 'Post upcoming meeting details to relevant channels',
      action: 'share-meeting-info'
    });
  }

  // Notice処理 - システム全体の動きに反応
  _handleNotice(message) {
    super._handleNotice(message);
    
    // ユーザーアクションに基づく自動チャット提案
    if (message.event_name === 'user.action_taken') {
      this.suggestRelatedChatActions(message.payload);
    }
    
    // ドキュメントアクセスに基づくチャット提案
    if (message.event_name === 'document.accessed') {
      this.suggestDocumentDiscussion(message.payload);
    }
  }

  // 関連チャットアクション提案
  suggestRelatedChatActions(payload) {
    if (payload.action.includes('Project Phoenix')) {
      this.addSmartSuggestion({
        type: 'discussion',
        title: '💬 Discuss Project Phoenix',
        description: 'Share insights with the team in #project-phoenix',
        action: 'discuss-phoenix'
      });
    }
  }

  // ドキュメント議論提案
  suggestDocumentDiscussion(payload) {
    this.addSmartSuggestion({
      type: 'document-share',
      title: '📄 Share Document Insights',
      description: `Discuss "${payload.title}" with relevant team members`,
      action: 'share-document'
    });
  }

  // 通知追加
  addNotification(notificationData) {
    const notification = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      read: false,
      ...notificationData
    };
    
    this.notifications.unshift(notification);
    
    // 最大20件まで保持
    if (this.notifications.length > 20) {
      this.notifications = this.notifications.slice(0, 20);
    }
  }

  // スマート提案追加
  addSmartSuggestion(suggestion) {
    this.smartSuggestions.unshift({
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      ...suggestion
    });
    
    // 最大5件まで保持
    if (this.smartSuggestions.length > 5) {
      this.smartSuggestions = this.smartSuggestions.slice(0, 5);
    }
    
    this.updateSmartSuggestions();
  }

  // スマート提案表示更新
  updateSmartSuggestions() {
    const suggestionContainer = document.getElementById('suggestion-list');
    if (!suggestionContainer) return;
    
    suggestionContainer.innerHTML = this.smartSuggestions.map(suggestion => `
      <div class="suggestion-item ${suggestion.type}">
        <div class="suggestion-title">${suggestion.title}</div>
        <div class="suggestion-description">${suggestion.description}</div>
        <button class="suggestion-action" data-action="${suggestion.action}">Take Action</button>
      </div>
    `).join('');
    
    // 提案アクションのイベントリスナー
    suggestionContainer.querySelectorAll('.suggestion-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        this.handleSuggestionAction(action);
      });
    });
  }

  // チャンネルハイライト
  highlightChannel(channelId) {
    setTimeout(() => {
      const element = document.querySelector(`[data-id="${channelId}"]`);
      if (element) {
        element.style.animation = 'chatHighlight 2s ease-out';
        element.style.border = '2px solid #4a90e2';
        element.style.backgroundColor = 'rgba(74, 144, 226, 0.15)';
        
        setTimeout(() => {
          element.style.animation = '';
          element.style.border = '';
          element.style.backgroundColor = '';
        }, 2000);
      }
    }, 300);
  }

  // クイックアクション処理
  async handleJoinPhoenixChannel() {
    this.log('🚀 Joining Project Phoenix channel');
    this.addNotification({
      channel: 'project-phoenix',
      type: 'system',
      message: 'You joined #project-phoenix channel',
      sender: 'System',
      priority: 'medium'
    });
  }

  async handleDMToMentor() {
    this.log('👤 Opening DM with mentor');
    this.addNotification({
      channel: 'dm',
      type: 'dm',
      message: 'DM opened with Sarah Kim (Mentor)',
      sender: 'System',
      priority: 'medium'
    });
  }

  async handleAskForHelp() {
    this.log('❓ Requesting help');
    this.addNotification({
      channel: 'new-employees',
      type: 'mention',
      message: 'Help request posted to #new-employees',
      sender: 'System',
      priority: 'medium'
    });
  }

  // 提案アクション処理
  handleSuggestionAction(action) {
    this.log(`💡 Executing suggestion action: ${action}`);
    
    switch(action) {
      case 'join-phoenix-chat':
        this.handleJoinPhoenixChannel();
        break;
      case 'dm-mentor':
        this.handleDMToMentor();
        break;
      case 'check-team-status':
        this.log('👥 Checking team status via chat');
        break;
    }
  }

  // チャンネルクリック処理
  handleChannelClick(channelId) {
    const channel = this.channels.find(ch => ch.id === channelId);
    if (channel) {
      channel.unreadCount = 0; // Mark as read
      this.log(`💬 Opened channel: ${channel.name}`);
      this.updateNotificationFeed();
    }
  }

  // スマート提案処理
  processSmartSuggestions() {
    // 自律的な提案生成ロジック
    const activeChannels = this.channels.filter(ch => ch.active && ch.unreadCount > 0);
    
    if (activeChannels.length > 2 && this.smartSuggestions.length === 0) {
      this.addSmartSuggestion({
        type: 'productivity',
        title: '⚡ Catch Up on Channels',
        description: 'Multiple channels have unread messages',
        action: 'catch-up'
      });
    }
  }

  // チャンネル活動更新
  updateChannelActivity() {
    // 現実的なチャンネル活動をシミュレート
    if (Math.random() < 0.1) { // 10% chance per cycle
      const activeChannels = this.channels.filter(ch => ch.active);
      if (activeChannels.length > 0) {
        const randomChannel = activeChannels[Math.floor(Math.random() * activeChannels.length)];
        randomChannel.lastActivity = 'just now';
        randomChannel.unreadCount += 1;
      }
    }
  }

  // クリーンアップ
  async _cleanup() {
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.log('🧹 Chat notifier cleaned up');
  }
}