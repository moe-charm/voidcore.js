// DocFeedPlugin - 動的ドキュメント管理とインテリジェント配信
import { AutonomousPlugin } from '../../../src/autonomous_plugin.js';
import { Message } from '../../../src/message.js';

export class DocFeedPlugin extends AutonomousPlugin {
  constructor() {
    super("DocFeed");
    this.role = "document_manager";
    this.container = null;
    this.documents = [];
    this.featuredDocs = [];
    this.recentActivity = [];
    this.searchFilters = {
      priority: 'all',
      type: 'all',
      timeframe: 'all'
    };
    
    console.log('[DocFeed] Constructor called, plugin created');
  }
  
  // グローバルメッセージハンドラーもデバッグ
  globalMessageHandler(message) {
    console.log('[DocFeed] 📬 Global message received:', message);
    super.globalMessageHandler(message);
  }

  // Phase 1: Preparation - ドキュメントフィード作成
  async _prepare() {
    console.log('[DocFeed] _prepare() called');
    this.container = document.getElementById('doc-feed-container');
    if (!this.container) {
      console.error('[DocFeed] ⚠️ Container not found!');
      this.log('⚠️ DocFeed container not found');
      return;
    }

    console.log('[DocFeed] Container found, initializing documents...');
    
    // 初期ドキュメントデータを設定
    this.initializeDocuments();
    
    console.log('[DocFeed] Creating UI...');
    // UI作成
    this.createDocFeedUI();
    
    console.log('[DocFeed] UI created, DocFeed preparation complete');
    this.log('📄 Document feed system ready');
  }

  // Phase 3: Observation - ドキュメント関連のIntent/Noticeを監視
  async _observe() {
    console.log('[DocFeed] _observe() called - setting up subscriptions...');
    
    // Intent監視 - ユーザーからの要求
    console.log('[DocFeed] Subscribing to project.query...');
    this.subscribeToType('project.query');
    
    console.log('[DocFeed] Subscribing to other intent types...');
    this.subscribeToType('document.urgent_search');
    this.subscribeToType('meeting.preparation');
    this.subscribeToType('onboarding.assistance');
    this.subscribeToType('team.status_check');
    
    // Notice監視 - システム全体のドキュメント関連通知
    console.log('[DocFeed] Subscribing to notice types...');
    this.subscribeToType('document.update');
    this.subscribeToType('document.created');
    this.subscribeToType('document.accessed');
    this.subscribeToType('user.action_taken');

    console.log('[DocFeed] All subscriptions completed');
    this.log('👁️ Monitoring document-related communications');
  }

  // Phase 4: Work - リアルタイム更新とインテリジェント推奨
  async _work() {
    this.updateDocumentFeed();
    this.processDocumentRecommendations();
    this.updateActivityFeed();
  }

  // 初期ドキュメントデータ設定
  initializeDocuments() {
    this.documents = [
      {
        id: 'phoenix-spec',
        title: '🚀 Project Phoenix - Technical Specifications v2.3',
        type: 'specification',
        priority: 'high',
        author: 'Tech Lead Sarah Kim',
        lastModified: new Date(Date.now() - 1800000).toLocaleString(), // 30 min ago
        size: '2.4 MB',
        version: 'v2.3',
        tags: ['phoenix', 'technical', 'specification'],
        description: 'Comprehensive technical specifications for Project Phoenix Phase 2',
        downloadUrl: '#',
        viewCount: 45,
        featured: false
      },
      {
        id: 'onboarding-guide',
        title: '📚 New Employee VoidCore Network Guide',
        type: 'guide',
        priority: 'high',
        author: 'HR Department',
        lastModified: new Date(Date.now() - 86400000).toLocaleString(), // 1 day ago
        size: '1.2 MB',
        version: 'v1.5',
        tags: ['onboarding', 'voidcore', 'guide'],
        description: 'Complete guide to understanding and using VoidCore Network systems',
        downloadUrl: '#',
        viewCount: 128,
        featured: true
      },
      {
        id: 'api-docs',
        title: '⚙️ VoidCore Network API Documentation',
        type: 'documentation',
        priority: 'medium',
        author: 'Development Team',
        lastModified: new Date(Date.now() - 3600000).toLocaleString(), // 1 hour ago
        size: '5.1 MB',
        version: 'v11.0',
        tags: ['api', 'documentation', 'voidcore'],
        description: 'Complete API reference for VoidCore Network v11.0',
        downloadUrl: '#',
        viewCount: 89,
        featured: false
      },
      {
        id: 'team-roster',
        title: '👥 Engineering Team Directory & Contact Info',
        type: 'directory',
        priority: 'medium',
        author: 'Team Management',
        lastModified: new Date(Date.now() - 7200000).toLocaleString(), // 2 hours ago
        size: '856 KB',
        version: 'v1.2',
        tags: ['team', 'directory', 'contacts'],
        description: 'Current team members, roles, and contact information',
        downloadUrl: '#',
        viewCount: 67,
        featured: false
      },
      {
        id: 'meeting-templates',
        title: '📅 Meeting Templates & Best Practices',
        type: 'template',
        priority: 'low',
        author: 'Project Management Office',
        lastModified: new Date(Date.now() - 172800000).toLocaleString(), // 2 days ago
        size: '432 KB',
        version: 'v1.0',
        tags: ['meeting', 'template', 'process'],
        description: 'Standardized meeting templates and facilitation guidelines',
        downloadUrl: '#',
        viewCount: 23,
        featured: false
      }
    ];
  }

  // ドキュメントフィードUI作成
  createDocFeedUI() {
    this.container.innerHTML = `
      <div class="doc-feed-header">
        <div class="doc-controls">
          <div class="filter-group">
            <select id="priority-filter" class="doc-filter">
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            <select id="type-filter" class="doc-filter">
              <option value="all">All Types</option>
              <option value="specification">Specifications</option>
              <option value="guide">Guides</option>
              <option value="documentation">Documentation</option>
              <option value="template">Templates</option>
            </select>
          </div>
          <div class="doc-stats">
            <span class="doc-stat">📊 <span id="total-docs">${this.documents.length}</span> Documents</span>
            <span class="doc-stat">⭐ <span id="featured-count">0</span> Featured</span>
          </div>
        </div>
      </div>
      
      <div id="featured-docs" class="featured-docs-section">
        <h4>⭐ Featured Documents</h4>
        <div id="featured-docs-list" class="featured-docs-list"></div>
      </div>
      
      <div id="doc-list" class="doc-list"></div>
      
      <div id="doc-activity" class="doc-activity">
        <h4>📈 Recent Activity</h4>
        <div id="activity-stream" class="activity-stream"></div>
      </div>
    `;

    // フィルターイベントリスナー追加
    this.addFilterListeners();
    
    // 初期表示
    this.updateDocumentFeed();
  }

  // フィルター機能
  addFilterListeners() {
    const priorityFilter = document.getElementById('priority-filter');
    const typeFilter = document.getElementById('type-filter');
    
    if (priorityFilter) {
      priorityFilter.addEventListener('change', (e) => {
        this.searchFilters.priority = e.target.value;
        this.applyFilters();
      });
    }
    
    if (typeFilter) {
      typeFilter.addEventListener('change', (e) => {
        this.searchFilters.type = e.target.value;
        this.applyFilters();
      });
    }
  }

  // フィルター適用
  applyFilters() {
    let filteredDocs = this.documents;
    
    // 優先度フィルター
    if (this.searchFilters.priority !== 'all') {
      filteredDocs = filteredDocs.filter(doc => doc.priority === this.searchFilters.priority);
    }
    
    // タイプフィルター
    if (this.searchFilters.type !== 'all') {
      filteredDocs = filteredDocs.filter(doc => doc.type === this.searchFilters.type);
    }
    
    this.displayDocuments(filteredDocs);
    this.log(`🔍 Filters applied: ${filteredDocs.length} documents shown`);
  }

  // ドキュメントフィード更新
  updateDocumentFeed() {
    this.displayDocuments(this.documents);
    this.updateFeaturedDocs();
    this.updateStats();
  }

  // ドキュメント表示
  displayDocuments(docs) {
    const listContainer = document.getElementById('doc-list');
    if (!listContainer) return;

    listContainer.innerHTML = docs.map(doc => `
      <div class="doc-item ${doc.priority}" data-id="${doc.id}">
        <div class="doc-header">
          <h4 class="doc-title">${doc.title}</h4>
          <div class="doc-badges">
            <span class="doc-priority ${doc.priority}">${doc.priority.toUpperCase()}</span>
            <span class="doc-type">${doc.type}</span>
            ${doc.featured ? '<span class="featured-badge">⭐ Featured</span>' : ''}
          </div>
        </div>
        <div class="doc-description">${doc.description}</div>
        <div class="doc-meta">
          <div class="doc-info">
            <span class="doc-author">👤 ${doc.author}</span>
            <span class="doc-modified">🕒 ${doc.lastModified}</span>
            <span class="doc-size">📦 ${doc.size}</span>
            <span class="doc-version">🏷️ ${doc.version}</span>
          </div>
          <div class="doc-actions">
            <button class="doc-action-btn view-btn" data-doc-id="${doc.id}">👁️ View</button>
            <button class="doc-action-btn download-btn" data-doc-id="${doc.id}">⬇️ Download</button>
            <span class="view-count">👀 ${doc.viewCount}</span>
          </div>
        </div>
        <div class="doc-tags">
          ${doc.tags.map(tag => `<span class="doc-tag">#${tag}</span>`).join('')}
        </div>
      </div>
    `).join('');

    // ドキュメントアクションボタンにイベント追加
    this.addDocumentActionListeners();
  }

  // フィーチャードドキュメント更新
  updateFeaturedDocs() {
    const featured = this.documents.filter(doc => doc.featured);
    const featuredContainer = document.getElementById('featured-docs-list');
    
    if (!featuredContainer) return;
    
    featuredContainer.innerHTML = featured.map(doc => `
      <div class="featured-doc-card" data-id="${doc.id}">
        <div class="featured-doc-title">${doc.title}</div>
        <div class="featured-doc-meta">
          <span>${doc.author}</span> • <span>${doc.lastModified}</span>
        </div>
      </div>
    `).join('');
  }

  // 統計更新
  updateStats() {
    const totalElement = document.getElementById('total-docs');
    const featuredElement = document.getElementById('featured-count');
    
    if (totalElement) totalElement.textContent = this.documents.length;
    if (featuredElement) {
      const featuredCount = this.documents.filter(doc => doc.featured).length;
      featuredElement.textContent = featuredCount;
    }
  }

  // ドキュメントアクションリスナー
  addDocumentActionListeners() {
    const viewButtons = document.querySelectorAll('.view-btn');
    const downloadButtons = document.querySelectorAll('.download-btn');
    
    viewButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const docId = e.target.dataset.docId;
        this.handleDocumentView(docId);
      });
    });
    
    downloadButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const docId = e.target.dataset.docId;
        this.handleDocumentDownload(docId);
      });
    });
  }

  // Intent処理 - ユーザー要求に基づく自律的ドキュメント推奨
  _handleIntent(message) {
    console.log(`[DocFeed] 📥 RECEIVED INTENT: ${message.action}`);
    console.log(`[DocFeed] Intent payload:`, message.payload);
    console.log(`[DocFeed] Message details:`, message);
    
    super._handleIntent(message);
    
    switch(message.action) {
      case 'project.query':
        console.log(`[DocFeed] 🎯 Processing project.query intent`);
        this.handleProjectDocumentQuery(message.payload);
        break;
      case 'document.urgent_search':
        console.log(`[DocFeed] 🚨 Processing urgent document search intent`);
        this.handleUrgentDocumentSearch(message.payload);
        break;
      case 'meeting.preparation':
        console.log(`[DocFeed] 📅 Processing meeting preparation intent`);
        this.handleMeetingPreparation(message.payload);
        break;
      case 'onboarding.assistance':
        console.log(`[DocFeed] 🎯 Processing onboarding assistance intent`);
        this.handleOnboardingDocuments(message.payload);
        break;
      default:
        console.log(`[DocFeed] ❓ Unknown intent action: ${message.action}`);
    }
  }

  // プロジェクト関連ドキュメント検索
  async handleProjectDocumentQuery(payload) {
    console.log(`[DocFeed] 🔍 handleProjectDocumentQuery called with:`, payload);
    this.log(`🔍 Processing project document query: ${payload.project}`);
    
    if (payload.project === 'Phoenix') {
      console.log(`[DocFeed] 🚀 Processing Phoenix project query!`);
      // Project Phoenix関連ドキュメントを前面に！
      const phoenixDoc = this.documents.find(doc => doc.id === 'phoenix-spec');
      console.log(`[DocFeed] Phoenix document found:`, !!phoenixDoc);
      
      if (phoenixDoc) {
        console.log(`[DocFeed] 📋 Promoting Phoenix document to featured!`);
        phoenixDoc.featured = true;
        phoenixDoc.priority = 'high';
        phoenixDoc.viewCount += 1;
        
        // 視覚的にハイライト
        this.highlightDocument('phoenix-spec');
        
        // アクティビティ記録
        this.addActivity(`📋 Project Phoenix specs promoted to featured`, 'document-promotion');
        
        console.log(`[DocFeed] 🔄 Updating document feed display...`);
        this.updateDocumentFeed();
        
        // システムに応答通知
        try {
          await this.publish(Message.notice('document.featured', {
            documentId: 'phoenix-spec',
            reason: 'project_query_response',
            project: payload.project
          }).withSource(this.capabilityName));
          console.log(`[DocFeed] ✅ Document featured notice sent`);
        } catch (error) {
          console.error(`[DocFeed] ❌ Failed to send document featured notice:`, error);
        }
      }
    } else {
      console.log(`[DocFeed] ❓ Unknown project: ${payload.project}`);
    }
  }

  // 緊急ドキュメント検索
  async handleUrgentDocumentSearch(payload) {
    this.log(`🚨 Processing urgent document search`);
    
    // 高優先度ドキュメントを全て featured に
    const urgentDocs = this.documents.filter(doc => doc.priority === 'high');
    urgentDocs.forEach(doc => {
      doc.featured = true;
    });
    
    this.addActivity(`🚨 ${urgentDocs.length} high-priority documents promoted`, 'urgent-search');
    this.updateDocumentFeed();
  }

  // ミーティング準備
  async handleMeetingPreparation(payload) {
    this.log(`📅 Processing meeting preparation`);
    
    const meetingDoc = this.documents.find(doc => doc.id === 'meeting-templates');
    if (meetingDoc) {
      meetingDoc.featured = true;
      meetingDoc.viewCount += 1;
      
      this.addActivity(`📅 Meeting templates prepared for use`, 'meeting-prep');
      this.updateDocumentFeed();
    }
  }

  // オンボーディング文書
  async handleOnboardingDocuments(payload) {
    this.log(`🎯 Processing onboarding document assistance`);
    
    const onboardingDoc = this.documents.find(doc => doc.id === 'onboarding-guide');
    if (onboardingDoc) {
      onboardingDoc.featured = true;
      onboardingDoc.priority = 'high';
      onboardingDoc.viewCount += 1;
      
      this.highlightDocument('onboarding-guide');
      this.addActivity(`🎯 Onboarding guide ready for new employee`, 'onboarding-assist');
      this.updateDocumentFeed();
    }
  }

  // ドキュメントハイライト
  highlightDocument(docId) {
    setTimeout(() => {
      const element = document.querySelector(`[data-id="${docId}"]`);
      if (element) {
        element.style.animation = 'docHighlight 3s ease-out';
        element.style.border = '3px solid #4a90e2';
        element.style.backgroundColor = 'rgba(74, 144, 226, 0.1)';
        
        setTimeout(() => {
          element.style.animation = '';
          element.style.border = '';
          element.style.backgroundColor = '';
        }, 3000);
      }
    }, 500);
  }

  // ドキュメント表示処理
  async handleDocumentView(docId) {
    const doc = this.documents.find(d => d.id === docId);
    if (doc) {
      doc.viewCount += 1;
      this.addActivity(`👁️ ${doc.title} viewed`, 'document-view');
      this.updateDocumentFeed();
      
      // システムに通知
      await this.publish(Message.notice('document.accessed', {
        documentId: docId,
        title: doc.title,
        user: 'Alex Chen'
      }).withSource(this.capabilityName));
      
      this.log(`👁️ Document viewed: ${doc.title}`);
    }
  }

  // ドキュメントダウンロード処理
  async handleDocumentDownload(docId) {
    const doc = this.documents.find(d => d.id === docId);
    if (doc) {
      this.addActivity(`⬇️ ${doc.title} downloaded`, 'document-download');
      
      // システムに通知
      await this.publish(Message.notice('document.downloaded', {
        documentId: docId,
        title: doc.title,
        user: 'Alex Chen'
      }).withSource(this.capabilityName));
      
      this.log(`⬇️ Document downloaded: ${doc.title}`);
    }
  }

  // アクティビティ追加
  addActivity(message, type) {
    this.recentActivity.unshift({
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    });
    
    // 最大15件まで保持
    if (this.recentActivity.length > 15) {
      this.recentActivity = this.recentActivity.slice(0, 15);
    }
  }

  // アクティビティフィード更新
  updateActivityFeed() {
    const stream = document.getElementById('activity-stream');
    if (!stream) return;
    
    stream.innerHTML = this.recentActivity.map(activity => `
      <div class="activity-item ${activity.type}">
        <span class="activity-time">${activity.timestamp}</span>
        <span class="activity-message">${activity.message}</span>
      </div>
    `).join('');
  }

  // ドキュメント推奨処理
  processDocumentRecommendations() {
    // AIによる自律的な推奨ロジック（将来的に機械学習を適用可能）
    const now = Date.now();
    
    // 1時間以内に更新されたドキュメントを自動推奨
    this.documents.forEach(doc => {
      const modifiedTime = new Date(doc.lastModified).getTime();
      if (now - modifiedTime < 3600000) { // 1 hour
        if (!doc.featured) {
          doc.featured = true;
          this.addActivity(`🔄 ${doc.title} auto-promoted (recently updated)`, 'auto-promotion');
        }
      }
    });
  }

  // クリーンアップ
  async _cleanup() {
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.log('🧹 Document feed cleaned up');
  }
}