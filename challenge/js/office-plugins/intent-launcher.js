// IntentLauncherPlugin - ユーザーの意図を VoidCore Network に発信
import { AutonomousPlugin } from '../../../src/autonomous_plugin.js';
import { Message } from '../../../src/message.js';

export class IntentLauncherPlugin extends AutonomousPlugin {
  constructor() {
    super("IntentLauncher");
    this.role = "intent_launcher";
    this.container = null;
    this.actionHistory = [];
    this.uiCreated = false; // フラグ追加
  }

  // Phase 1: Preparation - UI作成
  async _prepare() {
    console.log('[IntentLauncher] _prepare() called');
    this.container = document.getElementById('intent-launcher-container');
    console.log('[IntentLauncher] Container found:', !!this.container);
    
    if (!this.container) {
      console.error('[IntentLauncher] ⚠️ Container not found!');
      this.log('⚠️ IntentLauncher container not found');
      return;
    }

    // MutationObserver を一時的に無効化（無限ループ防止）
    console.log('[IntentLauncher] MutationObserver disabled to prevent infinite loops');

    // コンテナの初期状態をログ
    console.log('[IntentLauncher] Container initial state:');
    console.log('[IntentLauncher] - innerHTML:', this.container.innerHTML);
    console.log('[IntentLauncher] - children:', this.container.children.length);
    console.log('[IntentLauncher] - style:', this.container.style.cssText);

    this.createLauncherUI();
    this.log('🎯 Intent launcher ready');
    console.log('[IntentLauncher] _prepare() completed');
  }

  // Phase 3: Observation - システム応答の監視
  async _observe() {
    // システムからの応答を監視
    this.subscribeToType('system.info');
    this.subscribeToType('action.completed');
    this.subscribeToType('plugin.response');

    this.log('👁️ Monitoring system responses');
  }

  // Phase 4: Work - UIの状態管理
  async _work() {
    // Update action history display
    this.updateHistoryDisplay();
  }

  // UIを作成
  createLauncherUI() {
    if (this.uiCreated) {
      console.log('[IntentLauncher] UI already created, skipping to prevent loops');
      return;
    }
    
    console.log('[IntentLauncher] Creating UI...');
    console.log('[IntentLauncher] Container:', this.container);
    this.uiCreated = true; // フラグを設定
    
    // Action buttons container
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'intent-actions';
    console.log('[IntentLauncher] Actions container created');

    // Define available actions (この辺が「夢のイントラネット」の魔法！)
    const actions = [
      {
        id: 'project-phoenix',
        icon: '🔍',
        title: 'Get Project Phoenix Info',
        description: 'Gather all information about our flagship project',
        intent: 'project.query',
        payload: { project: 'Phoenix', priority: 'high', requester: 'Alex Chen' }
      },
      {
        id: 'team-status',
        icon: '👥',
        title: 'Check Team Status',
        description: 'See what everyone is working on',
        intent: 'team.status_check',
        payload: { department: 'Engineering', scope: 'all' }
      },
      {
        id: 'urgent-docs',
        icon: '📋',
        title: 'Find Urgent Documents',
        description: 'Locate high-priority documents needing attention',
        intent: 'document.urgent_search',
        payload: { priority: 'urgent', days: 7 }
      },
      {
        id: 'meeting-prep',
        icon: '📅',
        title: 'Prepare for Next Meeting',
        description: 'Gather materials for upcoming meetings',
        intent: 'meeting.preparation',
        payload: { timeframe: 'next_24h', auto_collect: true }
      },
      {
        id: 'new-employee-help',
        icon: '🆘',
        title: 'New Employee Help',
        description: 'Get resources for onboarding process',
        intent: 'onboarding.assistance',
        payload: { employee_type: 'new', department: 'Engineering' }
      }
    ];

    // Create buttons for each action
    console.log('[IntentLauncher] Creating', actions.length, 'action buttons');
    actions.forEach((action, index) => {
      console.log(`[IntentLauncher] Creating button ${index}: ${action.title}`);
      const button = this.createActionButton(action);
      actionsContainer.appendChild(button);
    });

    console.log('[IntentLauncher] Appending to container...');
    
    // コンテナをクリアして確実に作成
    this.container.innerHTML = '';
    
    // テスト用の単純な要素も追加
    const testElement = document.createElement('div');
    testElement.innerHTML = 'TEST: Intent Launcher is working!';
    testElement.style.cssText = 'background: yellow; padding: 10px; margin: 10px; border: 2px solid black;';
    testElement.id = 'intent-test-element';
    this.container.appendChild(testElement);
    
    // Actions コンテナを追加
    actionsContainer.id = 'intent-actions-container';
    this.container.appendChild(actionsContainer);
    
    console.log('[IntentLauncher] UI creation complete');
    console.log('[IntentLauncher] Container children count:', this.container.children.length);
    console.log('[IntentLauncher] Container HTML:', this.container.innerHTML.substring(0, 200));
    
    // 要素が実際にDOMに存在するかチェック
    setTimeout(() => {
      const testEl = document.getElementById('intent-test-element');
      const actionsEl = document.getElementById('intent-actions-container');
      console.log('[IntentLauncher] Post-creation check:');
      console.log('[IntentLauncher] - Test element exists:', !!testEl);
      console.log('[IntentLauncher] - Actions container exists:', !!actionsEl);
      console.log('[IntentLauncher] - Container children count:', this.container.children.length);
    }, 100);
    
    // UIが作成された後は健全性チェックを無効化（無限ループ防止）
    console.log('[IntentLauncher] UI created successfully, health checks disabled to prevent loops');

    // Add action history section
    this.createHistorySection();
  }

  // アクションボタンを作成
  createActionButton(action) {
    const button = document.createElement('button');
    button.className = 'intent-button';
    button.innerHTML = `
      <span class="intent-icon">${action.icon}</span>
      <div class="intent-content">
        <div class="intent-title">${action.title}</div>
        <div class="intent-description">${action.description}</div>
      </div>
    `;

    // Click handler - ここが魔法の発動！
    button.addEventListener('click', () => {
      this.launchIntent(action);
    });

    return button;
  }

  // Intent発動！（システム全体に波及）
  async launchIntent(action) {
    console.log(`[IntentLauncher] 🚀 LAUNCHING INTENT: ${action.intent}`);
    console.log(`[IntentLauncher] Intent payload:`, action.payload);
    this.log(`🚀 Launching Intent: ${action.intent}`);
    
    // Record action in history
    this.actionHistory.unshift({
      timestamp: new Date().toLocaleTimeString(),
      action: action.title,
      intent: action.intent,
      status: 'launched'
    });

    // Create and publish Intent message - 適切なロールをターゲット
    let targetRole = 'system'; // デフォルト
    if (action.intent === 'project.query' || action.intent === 'document.urgent_search') {
      targetRole = 'document_manager'; // DocFeed のロール
    } else if (action.intent === 'meeting.preparation') {
      targetRole = 'document_manager'; // DocFeed が処理
    } else if (action.intent === 'onboarding.assistance') {
      targetRole = 'document_manager'; // DocFeed が処理
    }
    
    console.log(`[IntentLauncher] Target role for ${action.intent}: ${targetRole}`);
    const intentMessage = Message.intent(targetRole, action.intent, action.payload)
      .withSource(this.capabilityName);

    console.log(`[IntentLauncher] Created intent message:`, intentMessage);

    // この publish が VoidCore Network 全体に魔法をかける！
    try {
      await this.publish(intentMessage);
      console.log(`[IntentLauncher] ✅ Intent published successfully`);
    } catch (error) {
      console.error(`[IntentLauncher] ❌ Failed to publish intent:`, error);
    }

    // Visual feedback
    this.showLaunchFeedback(action);

    // システム全体への通知
    try {
      await this.publish(Message.notice('user.action_taken', {
        user: 'Alex Chen',
        action: action.title,
        intent_type: action.intent,
        timestamp: Date.now()
      }).withSource(this.capabilityName));
      console.log(`[IntentLauncher] ✅ User action notice sent`);
    } catch (error) {
      console.error(`[IntentLauncher] ❌ Failed to send user action notice:`, error);
    }

    this.log(`✨ Intent "${action.intent}" broadcast to entire network`);
    console.log(`[IntentLauncher] 🎯 Intent launch sequence completed`);
  }

  // Launch feedback animation
  showLaunchFeedback(action) {
    // Create a temporary feedback element
    const feedback = document.createElement('div');
    feedback.className = 'launch-feedback';
    feedback.innerHTML = `
      <div style="font-size: 2rem; margin-bottom: 0.5rem;">${action.icon}</div>
      <div style="font-size: 1.2rem; font-weight: bold;">Intent Launched!</div>
      <div style="font-size: 0.9rem; opacity: 0.9; margin-top: 0.3rem;">${action.title}</div>
    `;
    feedback.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(45deg, #4a90e2, #357abd);
      color: white;
      padding: 2rem 3rem;
      border-radius: 25px;
      font-weight: bold;
      z-index: 1000;
      box-shadow: 0 15px 40px rgba(74, 144, 226, 0.6);
      animation: launchPulse 4s ease-out forwards;
      text-align: center;
      border: 3px solid rgba(255, 255, 255, 0.3);
    `;

    // Add animation keyframes
    if (!document.querySelector('#launch-animation-styles')) {
      const style = document.createElement('style');
      style.id = 'launch-animation-styles';
      style.textContent = `
        @keyframes launchPulse {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
          80% { opacity: 1; transform: translate(-50%, -50%) scale(1.0); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.2); }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(feedback);
    
    // Remove after animation
    setTimeout(() => {
      if (feedback.parentNode) {
        document.body.removeChild(feedback);
      }
    }, 4000);
  }

  // Action history section
  createHistorySection() {
    const historySection = document.createElement('div');
    historySection.className = 'action-history';
    historySection.innerHTML = `
      <h4>📊 Recent Actions</h4>
      <div id="action-history-list" class="history-list"></div>
    `;
    this.container.appendChild(historySection);
  }

  // Update history display
  updateHistoryDisplay() {
    const historyList = document.getElementById('action-history-list');
    if (!historyList) return;

    const recentActions = this.actionHistory.slice(0, 5); // Show last 5 actions
    
    historyList.innerHTML = recentActions.map(action => `
      <div class="history-item">
        <div class="history-time">${action.timestamp}</div>
        <div class="history-action">${action.action}</div>
        <div class="history-status ${action.status}">${action.status.toUpperCase()}</div>
      </div>
    `).join('');
  }

  // Handle system responses
  _handleNotice(message) {
    super._handleNotice(message);
    
    // Update action status based on system responses
    if (message.event_name === 'action.completed') {
      this.updateActionStatus(message.payload.intent, 'completed');
    } else if (message.event_name === 'action.failed') {
      this.updateActionStatus(message.payload.intent, 'failed');
    }
  }

  // Update action status in history
  updateActionStatus(intent, status) {
    const action = this.actionHistory.find(a => a.intent === intent);
    if (action) {
      action.status = status;
      this.log(`📝 Action status updated: ${intent} -> ${status}`);
    }
  }

  // Demo mode - automatic actions for presentation
  async startDemoMode() {
    this.log('🎭 Demo mode activated');
    
    // Wait a bit, then auto-trigger Project Phoenix query
    setTimeout(() => {
      this.log('🎬 Demo: Auto-triggering Project Phoenix query...');
      const phoenixAction = {
        title: 'Get Project Phoenix Info (Demo)',
        intent: 'project.query',
        payload: { project: 'Phoenix', priority: 'high', requester: 'Demo User', demo: true },
        icon: '🔍'
      };
      this.launchIntent(phoenixAction);
    }, 3000);
  }

  // Cleanup
  async _cleanup() {
    console.log('[IntentLauncher] 🧹 Cleaning up...');
    
    // Clear health check interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    // Clear container
    if (this.container) {
      this.container.innerHTML = '';
    }
    
    this.log('🧹 Intent launcher cleaned up');
  }
}