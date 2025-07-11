// plugin-collection.js - VoidFlow プラグインコレクション
// GUI要件洗い出しのための多様なプラグイン集

import { PluginAttributes, PluginAttributeTypes, AttributeHelpers } from '/src/core/plugin-attributes.js'

/**
 * 🎨 VoidFlow Plugin Collection
 * 様々なタイプのプラグインでGUI要件を探る
 * 🏷️ 属性システム対応版
 */

// 1. 🎵 リアルタイムオーディオビジュアライザー
export const audioVisualizerPlugin = {
  id: 'plugin-audio-visualizer',
  type: 'media.visualizer',
  displayName: '🎵 Audio Visualizer',
  
  // 🏷️ 属性システム
  attributes: new PluginAttributes({
    category: PluginAttributeTypes.CATEGORIES.VISUALIZATION,
    tags: ['audio', 'visualization', 'realtime', 'canvas', 'waveform'],
    priority: PluginAttributeTypes.PRIORITIES.HIGH,
    group: 'Media Processing',
    isExperimental: false,
    performance: PluginAttributeTypes.PERFORMANCE.MEDIUM,
    complexity: PluginAttributeTypes.COMPLEXITY.INTERMEDIATE,
    visual: {
      icon: '🎵',
      color: '#ff6b6b',
      backgroundColor: '#2d1b2e'
    },
    layout: {
      preferredSize: { width: 250, height: 150 },
      canResize: true
    },
    metadata: {
      description: 'リアルタイムオーディオ波形ビジュアライザー - 音声データをキャンバスに描画',
      keywords: ['audio', 'visualization', 'waveform', 'realtime', 'canvas']
    }
  }),
  
  // GUI要件: キャンバス表示エリア
  async initialize() {
    this.canvas = document.createElement('canvas')
    this.canvas.width = 200
    this.canvas.height = 100
    this.ctx = this.canvas.getContext('2d')
    this.animationId = null
  },
  
  async visualize(audioData) {
    // GUI要件: リアルタイム更新
    const draw = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      this.ctx.fillStyle = '#00ff88'
      
      // 波形描画
      for (let i = 0; i < audioData.length; i++) {
        const barHeight = audioData[i] * this.canvas.height
        this.ctx.fillRect(i * 2, this.canvas.height - barHeight, 2, barHeight)
      }
      
      this.animationId = requestAnimationFrame(draw)
    }
    draw()
  },
  
  async stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
  }
}

// 2. 🎨 カラーグラデーションジェネレーター
export const gradientGeneratorPlugin = {
  id: 'plugin-gradient-generator',
  type: 'visual.generator',
  displayName: '🎨 Gradient Generator',
  
  // 🏷️ 属性システム
  attributes: new PluginAttributes({
    category: PluginAttributeTypes.CATEGORIES.UI,
    tags: ['color', 'gradient', 'visual', 'generator', 'css'],
    priority: PluginAttributeTypes.PRIORITIES.HIGH,
    group: 'Visual Tools',
    isExperimental: false,
    performance: PluginAttributeTypes.PERFORMANCE.LIGHT,
    complexity: PluginAttributeTypes.COMPLEXITY.SIMPLE,
    visual: {
      icon: '🎨',
      color: '#00ff88',
      backgroundColor: '#1a2e1a'
    },
    layout: {
      preferredSize: { width: 300, height: 200 },
      canResize: true
    },
    metadata: {
      description: 'カラーグラデーション生成ツール - CSSグラデーションとプレビュー機能',
      keywords: ['color', 'gradient', 'css', 'visual', 'design']
    }
  }),
  
  // GUI要件: 複数のカラーピッカー、プレビューエリア
  async initialize() {
    this.colors = ['#ff0000', '#00ff00', '#0000ff']
    this.angle = 45
  },
  
  async generateGradient(options = {}) {
    const { colors = this.colors, angle = this.angle } = options
    
    // CSS グラデーション生成
    const gradient = `linear-gradient(${angle}deg, ${colors.join(', ')})`
    
    return {
      css: gradient,
      colors: colors,
      angle: angle,
      preview: this.createPreview(gradient)
    }
  },
  
  createPreview(gradient) {
    // GUI要件: プレビュー表示
    const div = document.createElement('div')
    div.style.width = '200px'
    div.style.height = '100px'
    div.style.background = gradient
    div.style.borderRadius = '8px'
    return div
  }
}

// 3. 📊 リアルタイムデータグラフ
export const realtimeGraphPlugin = {
  id: 'plugin-realtime-graph',
  type: 'data.visualization',
  displayName: '📊 Realtime Graph',
  
  // 🏷️ 属性システム
  attributes: new PluginAttributes({
    category: PluginAttributeTypes.CATEGORIES.VISUALIZATION,
    tags: ['data', 'chart', 'realtime', 'graph', 'timeline'],
    priority: PluginAttributeTypes.PRIORITIES.HIGH,
    group: 'Data Visualization',
    isExperimental: false,
    performance: PluginAttributeTypes.PERFORMANCE.MEDIUM,
    complexity: PluginAttributeTypes.COMPLEXITY.INTERMEDIATE,
    visual: {
      icon: '📊',
      color: '#4fc1ff',
      backgroundColor: '#1a2a3a'
    },
    layout: {
      preferredSize: { width: 400, height: 250 },
      canResize: true
    },
    metadata: {
      description: 'リアルタイムデータグラフ - 時系列データの動的可視化',
      keywords: ['data', 'chart', 'realtime', 'visualization', 'timeline']
    }
  }),
  
  // GUI要件: グラフ表示エリア、軸ラベル、凡例
  async initialize() {
    this.dataPoints = []
    this.maxPoints = 50
    this.chart = null
  },
  
  async addDataPoint(value) {
    this.dataPoints.push({
      time: Date.now(),
      value: value
    })
    
    if (this.dataPoints.length > this.maxPoints) {
      this.dataPoints.shift()
    }
    
    this.updateChart()
  },
  
  updateChart() {
    // GUI要件: スムーズなアニメーション
    if (this.chart) {
      this.chart.update({
        data: this.dataPoints,
        smooth: true
      })
    }
  }
}

// 4. 🎮 インタラクティブゲームコントローラー
export const gameControllerPlugin = {
  id: 'plugin-game-controller',
  type: 'input.controller',
  displayName: '🎮 Game Controller',
  
  // 🏷️ 属性システム
  attributes: new PluginAttributes({
    category: PluginAttributeTypes.CATEGORIES.INPUT,
    tags: ['input', 'controller', 'game', 'joystick', 'interactive'],
    priority: PluginAttributeTypes.PRIORITIES.MEDIUM,
    group: 'Game Input',
    isExperimental: false,
    performance: PluginAttributeTypes.PERFORMANCE.LIGHT,
    complexity: PluginAttributeTypes.COMPLEXITY.SIMPLE,
    visual: {
      icon: '🎮',
      color: '#ff6b6b',
      backgroundColor: '#2e1a1a'
    },
    layout: {
      preferredSize: { width: 200, height: 200 },
      canResize: false
    },
    metadata: {
      description: 'ゲームコントローラー - ジョイスティックとボタン入力',
      keywords: ['controller', 'joystick', 'game', 'input', 'interactive']
    }
  }),
  
  // GUI要件: ジョイスティック、ボタン配置
  async initialize() {
    this.state = {
      x: 0,
      y: 0,
      buttons: {
        A: false,
        B: false,
        X: false,
        Y: false
      }
    }
  },
  
  async handleJoystick(x, y) {
    this.state.x = x
    this.state.y = y
    
    // GUI要件: 視覚的フィードバック
    this.updateVisualState()
    
    // データフロー送信
    if (window.connectionManager) {
      await window.connectionManager.executeDataFlow(this.id, this.state)
    }
  },
  
  updateVisualState() {
    // GUI要件: リアルタイムな状態表示
    const element = document.querySelector(`[data-plugin-id="${this.id}"]`)
    if (element) {
      element.style.transform = `translate(${this.state.x * 10}px, ${this.state.y * 10}px)`
    }
  }
}

// 5. 🌐 WebSocketストリーミング
export const websocketStreamPlugin = {
  id: 'plugin-websocket-stream',
  type: 'network.stream',
  displayName: '🌐 WebSocket Stream',
  
  // 🏷️ 属性システム
  attributes: new PluginAttributes({
    category: PluginAttributeTypes.CATEGORIES.NETWORK,
    tags: ['websocket', 'network', 'stream', 'realtime', 'communication'],
    priority: PluginAttributeTypes.PRIORITIES.HIGH,
    group: 'Network Communication',
    isExperimental: false,
    performance: PluginAttributeTypes.PERFORMANCE.MEDIUM,
    complexity: PluginAttributeTypes.COMPLEXITY.ADVANCED,
    visual: {
      icon: '🌐',
      color: '#9b59b6',
      backgroundColor: '#2a1a2e'
    },
    layout: {
      preferredSize: { width: 350, height: 200 },
      canResize: true
    },
    metadata: {
      description: 'WebSocketリアルタイム通信 - ストリーミングデータの送受信',
      keywords: ['websocket', 'stream', 'realtime', 'network', 'communication']
    }
  }),
  
  // GUI要件: 接続状態表示、メッセージログ
  async initialize() {
    this.ws = null
    this.connected = false
    this.messageLog = []
  },
  
  async connect(url) {
    try {
      this.ws = new WebSocket(url)
      
      this.ws.onopen = () => {
        this.connected = true
        this.updateConnectionStatus('connected')
      }
      
      this.ws.onmessage = (event) => {
        this.messageLog.push({
          time: new Date(),
          data: event.data
        })
        
        // GUI要件: スクロール可能なログビュー
        this.updateMessageLog()
      }
      
      this.ws.onclose = () => {
        this.connected = false
        this.updateConnectionStatus('disconnected')
      }
      
    } catch (error) {
      console.error('WebSocket connection failed:', error)
    }
  },
  
  updateConnectionStatus(status) {
    // GUI要件: 状態インジケーター
    const indicator = document.querySelector(`[data-plugin-id="${this.id}"] .connection-status`)
    if (indicator) {
      indicator.className = `connection-status ${status}`
    }
  }
}

// 6. 📝 マークダウンエディター
export const markdownEditorPlugin = {
  id: 'plugin-markdown-editor',
  type: 'text.editor',
  displayName: '📝 Markdown Editor',
  
  // 🏷️ 属性システム
  attributes: new PluginAttributes({
    category: PluginAttributeTypes.CATEGORIES.UI,
    tags: ['markdown', 'text', 'editor', 'preview', 'split-view'],
    priority: PluginAttributeTypes.PRIORITIES.HIGH,
    group: 'Text Editors',
    isExperimental: false,
    performance: PluginAttributeTypes.PERFORMANCE.LIGHT,
    complexity: PluginAttributeTypes.COMPLEXITY.SIMPLE,
    visual: {
      icon: '📝',
      color: '#e67e22',
      backgroundColor: '#2e231a'
    },
    layout: {
      preferredSize: { width: 500, height: 300 },
      canResize: true
    },
    metadata: {
      description: 'マークダウンエディター - リアルタイムプレビュー機能付き',
      keywords: ['markdown', 'editor', 'text', 'preview', 'documentation']
    }
  }),
  
  // GUI要件: 分割ビュー（エディター/プレビュー）
  async initialize() {
    this.markdown = '# Hello VoidFlow!'
    this.html = ''
  },
  
  async updateMarkdown(text) {
    this.markdown = text
    
    // 簡易マークダウンパーサー
    this.html = this.parseMarkdown(text)
    
    // GUI要件: リアルタイムプレビュー
    this.updatePreview()
  },
  
  parseMarkdown(text) {
    return text
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*)\*/g, '<em>$1</em>')
  }
}

// 7. 🎬 アニメーションシーケンサー
export const animationSequencerPlugin = {
  id: 'plugin-animation-sequencer',
  type: 'animation.control',
  displayName: '🎬 Animation Sequencer',
  
  // 🏷️ 属性システム
  attributes: new PluginAttributes({
    category: PluginAttributeTypes.CATEGORIES.MEDIA,
    tags: ['animation', 'timeline', 'keyframe', 'sequence', 'visual'],
    priority: PluginAttributeTypes.PRIORITIES.MEDIUM,
    group: 'Animation Tools',
    isExperimental: true,
    performance: PluginAttributeTypes.PERFORMANCE.MEDIUM,
    complexity: PluginAttributeTypes.COMPLEXITY.ADVANCED,
    visual: {
      icon: '🎬',
      color: '#f39c12',
      backgroundColor: '#2e251a'
    },
    layout: {
      preferredSize: { width: 600, height: 200 },
      canResize: true
    },
    metadata: {
      description: 'アニメーションシーケンサー - タイムラインとキーフレーム管理',
      keywords: ['animation', 'timeline', 'keyframe', 'sequence', 'motion']
    }
  }),
  
  // GUI要件: タイムライン、キーフレーム
  async initialize() {
    this.timeline = []
    this.currentTime = 0
    this.isPlaying = false
  },
  
  async addKeyframe(time, properties) {
    this.timeline.push({
      time: time,
      properties: properties
    })
    
    // GUI要件: ドラッグ可能なキーフレーム
    this.updateTimelineUI()
  },
  
  async play() {
    this.isPlaying = true
    const startTime = Date.now()
    
    const animate = () => {
      if (!this.isPlaying) return
      
      this.currentTime = (Date.now() - startTime) / 1000
      
      // GUI要件: プレイヘッド表示
      this.updatePlayhead()
      
      requestAnimationFrame(animate)
    }
    animate()
  }
}

// 8. 🔢 数式エバリュエーター
export const mathEvaluatorPlugin = {
  id: 'plugin-math-evaluator',
  type: 'compute.math',
  displayName: '🔢 Math Evaluator',
  
  // 🏷️ 属性システム
  attributes: new PluginAttributes({
    category: PluginAttributeTypes.CATEGORIES.LOGIC,
    tags: ['math', 'calculator', 'expression', 'computation', 'formula'],
    priority: PluginAttributeTypes.PRIORITIES.HIGH,
    group: 'Mathematical Tools',
    isExperimental: false,
    performance: PluginAttributeTypes.PERFORMANCE.LIGHT,
    complexity: PluginAttributeTypes.COMPLEXITY.SIMPLE,
    visual: {
      icon: '🔢',
      color: '#3498db',
      backgroundColor: '#1a2a3e'
    },
    layout: {
      preferredSize: { width: 300, height: 250 },
      canResize: true
    },
    metadata: {
      description: '数式評価エンジン - 数学式の計算と履歴管理',
      keywords: ['math', 'calculator', 'expression', 'formula', 'computation']
    }
  }),
  
  // GUI要件: 数式入力フィールド、結果表示
  async initialize() {
    this.expression = ''
    this.result = null
    this.history = []
  },
  
  async evaluate(expression) {
    try {
      // セキュアな数式評価
      const result = this.safeEval(expression)
      
      this.history.push({
        expression: expression,
        result: result,
        timestamp: Date.now()
      })
      
      // GUI要件: 計算履歴表示
      this.updateHistory()
      
      return result
      
    } catch (error) {
      return { error: error.message }
    }
  },
  
  safeEval(expr) {
    // 安全な数式評価
    const allowed = /^[0-9+\-*/().\s]+$/
    if (!allowed.test(expr)) {
      throw new Error('Invalid expression')
    }
    return Function('"use strict"; return (' + expr + ')')()
  }
}

// 9. 🗺️ ノードマップナビゲーター
export const nodeMapNavigatorPlugin = {
  id: 'plugin-node-map-navigator',
  type: 'ui.navigation',
  displayName: '🗺️ Node Map Navigator',
  
  // 🏷️ 属性システム
  attributes: new PluginAttributes({
    category: PluginAttributeTypes.CATEGORIES.UI,
    tags: ['navigation', 'minimap', 'zoom', 'pan', 'overview'],
    priority: PluginAttributeTypes.PRIORITIES.HIGH,
    group: 'Navigation Tools',
    isExperimental: false,
    performance: PluginAttributeTypes.PERFORMANCE.MEDIUM,
    complexity: PluginAttributeTypes.COMPLEXITY.INTERMEDIATE,
    visual: {
      icon: '🗺️',
      color: '#16a085',
      backgroundColor: '#1a2e2a'
    },
    layout: {
      preferredSize: { width: 200, height: 150 },
      canResize: true,
      preferredPosition: 'top'
    },
    metadata: {
      description: 'ノードマップナビゲーター - ミニマップとズーム操作',
      keywords: ['navigation', 'minimap', 'zoom', 'overview', 'map']
    }
  }),
  
  // GUI要件: ミニマップ、ズーム/パン
  async initialize() {
    this.viewState = {
      zoom: 1,
      offsetX: 0,
      offsetY: 0
    }
    this.nodes = new Map()
  },
  
  async updateNodePositions(nodes) {
    this.nodes = nodes
    
    // GUI要件: ミニマップ更新
    this.renderMinimap()
  },
  
  renderMinimap() {
    // GUI要件: 全体俯瞰ビュー
    const minimap = document.createElement('canvas')
    minimap.width = 200
    minimap.height = 150
    
    const ctx = minimap.getContext('2d')
    
    // ノード位置を縮小表示
    this.nodes.forEach((node, id) => {
      const x = node.x * 0.1
      const y = node.y * 0.1
      
      ctx.fillStyle = '#4a90e2'
      ctx.fillRect(x, y, 5, 5)
    })
    
    return minimap
  }
}

// 10. 🎯 ターゲティングシステム
export const targetingSystemPlugin = {
  id: 'plugin-targeting-system',
  type: 'interaction.targeting',
  displayName: '🎯 Targeting System',
  
  // 🏷️ 属性システム
  attributes: new PluginAttributes({
    category: PluginAttributeTypes.CATEGORIES.UI,
    tags: ['targeting', 'selection', 'crosshair', 'interactive', 'ui'],
    priority: PluginAttributeTypes.PRIORITIES.MEDIUM,
    group: 'Interaction Tools',
    isExperimental: true,
    performance: PluginAttributeTypes.PERFORMANCE.LIGHT,
    complexity: PluginAttributeTypes.COMPLEXITY.INTERMEDIATE,
    visual: {
      icon: '🎯',
      color: '#e74c3c',
      backgroundColor: '#2e1a1a'
    },
    layout: {
      preferredSize: { width: 250, height: 200 },
      canResize: false
    },
    metadata: {
      description: 'ターゲティングシステム - クロスヘアとターゲット選択',
      keywords: ['targeting', 'crosshair', 'selection', 'interactive', 'aim']
    }
  }),
  
  // GUI要件: クロスヘア、ターゲットリスト
  async initialize() {
    this.targets = []
    this.currentTarget = null
    this.crosshairPosition = { x: 0, y: 0 }
  },
  
  async addTarget(element) {
    const target = {
      id: element.id,
      element: element,
      distance: 0,
      angle: 0
    }
    
    this.targets.push(target)
    
    // GUI要件: ターゲットインジケーター
    this.createTargetIndicator(target)
  },
  
  createTargetIndicator(target) {
    // GUI要件: 動的なターゲット表示
    const indicator = document.createElement('div')
    indicator.className = 'target-indicator'
    indicator.style.position = 'absolute'
    indicator.style.border = '2px solid #ff0000'
    indicator.style.borderRadius = '50%'
    indicator.style.width = '40px'
    indicator.style.height = '40px'
    indicator.style.pointerEvents = 'none'
    
    return indicator
  }
}

// プラグインコレクションをエクスポート
export const pluginCollection = {
  audioVisualizerPlugin,
  gradientGeneratorPlugin,
  realtimeGraphPlugin,
  gameControllerPlugin,
  websocketStreamPlugin,
  markdownEditorPlugin,
  animationSequencerPlugin,
  mathEvaluatorPlugin,
  nodeMapNavigatorPlugin,
  targetingSystemPlugin
}

// GUI要件サマリー
export const guiRequirements = {
  display: [
    'キャンバス表示エリア',
    'リアルタイムグラフ',
    'プレビューエリア',
    'ミニマップ',
    'ステータスインジケーター'
  ],
  input: [
    'カラーピッカー',
    'スライダー',
    'ジョイスティック',
    'テキストエディター',
    'ドラッグ可能要素'
  ],
  layout: [
    '分割ビュー',
    'タイムライン',
    'スクロール可能ログ',
    'フローティングパネル',
    'ドッキング可能ウィンドウ'
  ],
  animation: [
    'スムーズアニメーション',
    'リアルタイム更新',
    'プレイヘッド',
    'キーフレーム',
    'トランジション'
  ]
}

console.log('🎨 VoidFlow Plugin Collection loaded!')
console.log('📋 GUI Requirements:', guiRequirements)