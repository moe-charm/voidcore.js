// plugin-palette-plugin.js - VoidFlow専用プラグインパレット
// 検索・フィルタリング・グリッド表示機能を持つプラグインパレット

// プラグインは新しいカテゴリー別フォルダ構造から読み込み

/**
 * 🎨 PluginPalettePlugin - VoidFlow専用プラグインパレット
 * 
 * 機能:
 * - 検索バー（テキスト検索・タグ検索）
 * - カテゴリフィルタ
 * - グリッド表示（アイコン・優先度・パフォーマンス）
 * - 使用頻度記録・最近使用・お気に入り
 * - ドラッグ&ドロップでプラグイン追加
 */
export class PluginPalettePlugin {
  constructor(options = {}) {
    this.options = {
      width: 300,
      height: '100%',
      itemSize: 80,
      itemSpacing: 10,
      searchPlaceholder: '🔍 プラグイン検索...',
      showStats: true,
      enableVirtualScroll: true,
      ...options
    }
    
    // Phase Alpha: Intent統合
    this.voidFlowCore = options.voidFlowCore || null
    
    // 状態管理
    this.state = {
      searchText: '',
      selectedCategory: null,
      selectedPriority: null,
      selectedTags: [],
      showFavorites: false,
      showRecent: false,
      sortBy: 'name' // name, usage, recent, priority
    }
    
    // プラグインデータ（初期化時に読み込み）
    this.plugins = []
    this.filteredPlugins = []
    
    // 使用状況データ
    this.usageData = this.loadUsageData()
    this.favorites = this.loadFavorites()
    this.recentPlugins = this.loadRecentPlugins()
    
    // DOM要素
    this.container = null
    this.searchInput = null
    this.categoryFilter = null
    this.pluginGrid = null
    this.statsPanel = null
    
    this.log('🎨 PluginPalettePlugin initialized')
  }
  
  log(message) {
    console.log(`[PluginPalette] ${message}`)
  }
  
  /**
   * プラグインデータを初期化
   */
  async initializePlugins() {
    try {
      this.log('📦 Loading plugins - temporarily using legacy only...')
      
      let allPlugins = []
      
      // 🚨 一時的対応: レガシープラグインのみ読み込み（JSON構文エラー回避）
      try {
        const response = await fetch('/plugins/_archive/legacy-plugins.json');
        if (response.ok) {
          const legacyPlugins = await response.json();
          allPlugins = [...allPlugins, ...legacyPlugins];
          this.log(`✅ ${legacyPlugins.length} legacy plugins loaded from archive.`);
        }
      } catch (fetchError) {
        this.log(`⚠️ Legacy plugins not loaded: ${fetchError.message}`);
      }
      
      // 🚀 全カテゴリーの新プラグインを読み込み
      const categories = ['ui', 'data', 'network', 'logic', 'ai', 'media', 'storage', 'workflow'];
      let newPluginCount = 0;
      
      for (const category of categories) {
        try {
          const pluginFiles = await this.getCategoryPluginFiles(category);
          for (const filename of pluginFiles) {
            try {
              const response = await fetch(`/plugins/categories/${category}/${filename}`);
              if (response.ok) {
                const newPlugin = await response.json();
                newPlugin.category = category;
                allPlugins.push(newPlugin);
                newPluginCount++;
                this.log(`✅ New plugin loaded: ${newPlugin.displayName} (${category})`);
              }
            } catch (fileError) {
              this.log(`⚠️ Failed to load ${filename}: ${fileError.message}`);
            }
          }
        } catch (categoryError) {
          this.log(`⚠️ Failed to load ${category} category: ${categoryError.message}`);
        }
      }
      
      this.log(`🎉 ${newPluginCount} new plugins loaded from categories!`);
      this.log(`📊 Total plugins: ${allPlugins.length} (${10} legacy + ${newPluginCount} new)`);
      
      // 🧪 テスト用の詳細ログ
      this.log(`📋 Plugin list:`)
      allPlugins.forEach((plugin, index) => {
        this.log(`  ${index + 1}. ${plugin.displayName} (${plugin.category || 'legacy'})`)
      })

      this.plugins = allPlugins;
      this.filteredPlugins = this.plugins;
      
      this.log(`✅ ${this.plugins.length} total plugins loaded successfully`);
      
    } catch (error) {
      this.log(`❌ Failed to load plugins: ${error.message}`)
      console.error('Plugin initialization error:', error)
    }
  }
  
  /**
   * 🗂️ カテゴリー別プラグイン読み込み
   */
  async loadPluginsFromCategory(category) {
    const plugins = []
    
    try {
      // カテゴリーフォルダ内のvpluginファイルを読み込み
      const categoryPath = `/plugins/categories/${category}/`
      
      // 各カテゴリーの既知のプラグインファイルを読み込み
      const pluginFiles = await this.getCategoryPluginFiles(category)
      
      for (const filename of pluginFiles) {
        try {
          const response = await fetch(`${categoryPath}${filename}`)
          if (response.ok) {
            const pluginData = await response.json()
            // カテゴリー情報を追加
            pluginData.category = category
            plugins.push(pluginData)
          }
        } catch (error) {
          this.log(`⚠️ Failed to load ${filename}: ${error.message}`)
        }
      }
    } catch (error) {
      this.log(`❌ Error loading category ${category}: ${error.message}`)
    }
    
    return plugins
  }
  
  /**
   * 🗂️ カテゴリー別プラグインファイル一覧取得
   */
  async getCategoryPluginFiles(category) {
    const categoryFiles = {
      'ui': ['ui-button-plugin.vplugin.json'],
      'data': ['data-json-parser-plugin.vplugin.json', 'utility-string-helper-plugin.vplugin.json'],
      'network': ['network-http-client-plugin.vplugin.json'],
      'logic': ['logic-calculator-plugin.vplugin.json'],
      'ai': ['ai-text-generator-plugin.vplugin.json'],
      'media': ['media-image-processor-plugin.vplugin.json', 'visualization-chart-plugin.vplugin.json'],
      'storage': ['storage-database-plugin.vplugin.json'],
      'workflow': ['workflow-automation-plugin.vplugin.json']
    }
    
    return categoryFiles[category] || []
  }
  
  /**
   * パレットを作成してコンテナに追加
   */
  async createPalette(container) {
    this.container = container
    
    // プラグインデータの読み込み完了を待つ
    await this.initializePlugins()
    
    // メインパレット構造を作成
    const paletteHTML = `
      <div class="plugin-palette" style="width: ${this.options.width}px; height: ${this.options.height};">
        <!-- 検索バー -->
        <div class="palette-search-section">
          <div class="search-input-container">
            <input type="text" 
                   class="palette-search-input" 
                   placeholder="${this.options.searchPlaceholder}"
                   id="paletteSearchInput">
            <button class="search-clear-btn" id="searchClearBtn">✕</button>
          </div>
          
          <!-- クイックフィルタボタン -->
          <div class="quick-filters">
            <button class="filter-btn" data-filter="favorites">❤️ お気に入り</button>
            <button class="filter-btn" data-filter="recent">🕐 最近使用</button>
            <button class="filter-btn" data-filter="high">⚡ 高優先度</button>
          </div>
        </div>
        
        <!-- カテゴリフィルタ -->
        <div class="palette-category-section">
          <div class="category-tabs">
            <button class="category-tab active" data-category="all">全て</button>
            <button class="category-tab" data-category="UI">UI</button>
            <button class="category-tab" data-category="Logic">Logic</button>
            <button class="category-tab" data-category="Data">Data</button>
            <button class="category-tab" data-category="Network">Network</button>
            <button class="category-tab" data-category="AI">AI</button>
            <button class="category-tab" data-category="Media">Media</button>
            <button class="category-tab" data-category="Storage">Storage</button>
            <button class="category-tab" data-category="Utility">Utility</button>
            <button class="category-tab" data-category="Visualization">Visualization</button>
            <button class="category-tab" data-category="Workflow">Workflow</button>
          </div>
        </div>
        
        <!-- 統計パネル -->
        <div class="palette-stats-section" id="statsSection">
          <div class="stats-info">
            <span class="stats-count">表示中: <span id="displayedCount">0</span></span>
            <span class="stats-total">全体: <span id="totalCount">0</span></span>
          </div>
          <div class="stats-sort">
            <select class="sort-select" id="sortSelect">
              <option value="name">名前順</option>
              <option value="usage">使用頻度順</option>
              <option value="recent">最近使用順</option>
              <option value="priority">優先度順</option>
            </select>
          </div>
        </div>
        
        <!-- プラグイングリッド -->
        <div class="palette-grid-section">
          <div class="plugin-grid" id="pluginGrid">
            <!-- プラグインアイテムが動的に追加される -->
          </div>
        </div>
      </div>
    `
    
    container.innerHTML = paletteHTML
    
    // DOM要素を取得
    this.searchInput = container.querySelector('#paletteSearchInput')
    this.categoryFilter = container.querySelector('.category-tabs')
    this.pluginGrid = container.querySelector('#pluginGrid')
    this.statsPanel = container.querySelector('#statsSection')
    
    // イベントリスナーを設定
    this.setupEventListeners()
    
    // 初期データを表示
    this.updateDisplay()
    
    // CSSスタイルを追加
    this.addStyles()
    
    this.log('🎨 Palette created and initialized')
  }
  
  /**
   * イベントリスナーの設定
   */
  setupEventListeners() {
    // 検索入力
    this.searchInput.addEventListener('input', async (e) => {
      if (this.voidFlowCore) {
        await this.voidFlowCore.sendIntent('voidflow.ui.palette.search', {
          query: e.target.value,
          timestamp: Date.now()
        })
      } else {
        this.state.searchText = e.target.value
        this.updateDisplay()
      }
    })
    
    // 検索クリアボタン
    this.container.querySelector('#searchClearBtn').addEventListener('click', async () => {
      if (this.voidFlowCore) {
        await this.voidFlowCore.sendIntent('voidflow.ui.palette.search.clear', {
          timestamp: Date.now()
        })
      } else {
        this.searchInput.value = ''
        this.state.searchText = ''
        this.updateDisplay()
      }
    })
    
    // クイックフィルタボタン
    this.container.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const filter = e.target.dataset.filter
        if (this.voidFlowCore) {
          await this.voidFlowCore.sendIntent('voidflow.ui.palette.filter', {
            filter,
            timestamp: Date.now()
          })
        } else {
          this.toggleQuickFilter(filter)
        }
      })
    })
    
    // カテゴリタブ
    this.container.querySelectorAll('.category-tab').forEach(tab => {
      tab.addEventListener('click', async (e) => {
        if (this.voidFlowCore) {
          await this.voidFlowCore.sendIntent('voidflow.ui.palette.category', {
            category: e.target.dataset.category,
            timestamp: Date.now()
          })
        } else {
          this.selectCategory(e.target.dataset.category)
        }
      })
    })
    
    // ソート選択
    this.container.querySelector('#sortSelect').addEventListener('change', async (e) => {
      if (this.voidFlowCore) {
        await this.voidFlowCore.sendIntent('voidflow.ui.palette.sort', {
          sortBy: e.target.value,
          timestamp: Date.now()
        })
      } else {
        this.state.sortBy = e.target.value
        this.updateDisplay()
      }
    })
    })
  }
  
  /**
   * クイックフィルタの切り替え
   */
  toggleQuickFilter(filter) {
    const filterBtns = this.container.querySelectorAll('.filter-btn')
    
    switch (filter) {
      case 'favorites':
        this.state.showFavorites = !this.state.showFavorites
        this.state.showRecent = false
        break
      case 'recent':
        this.state.showRecent = !this.state.showRecent
        this.state.showFavorites = false
        break
      case 'high':
        this.state.selectedPriority = this.state.selectedPriority === 'high' ? null : 'high'
        break
    }
    
    // ボタンの状態を更新
    filterBtns.forEach(btn => {
      const isActive = (
        (filter === 'favorites' && this.state.showFavorites) ||
        (filter === 'recent' && this.state.showRecent) ||
        (filter === 'high' && this.state.selectedPriority === 'high')
      )
      btn.classList.toggle('active', isActive)
    })
    
    this.updateDisplay()
  }
  
  /**
   * カテゴリの選択
   */
  selectCategory(category) {
    this.state.selectedCategory = category === 'all' ? null : category
    
    // タブの状態を更新
    this.container.querySelectorAll('.category-tab').forEach(tab => {
      tab.classList.remove('active')
    })
    
    const activeTab = this.container.querySelector(`[data-category=\"${category}\"]`)
    if (activeTab) {
      activeTab.classList.add('active')
    }
    
    this.updateDisplay()
  }
  
  /**
   * プラグインをフィルタリング
   */
  filterPlugins() {
    let filtered = [...this.plugins]
    
    // テキスト検索
    if (this.state.searchText) {
      const searchLower = this.state.searchText.toLowerCase()
      filtered = filtered.filter(plugin => {
        return (
          plugin.name.toLowerCase().includes(searchLower) ||
          plugin.displayName.toLowerCase().includes(searchLower) ||
          plugin.description.toLowerCase().includes(searchLower) ||
          plugin.tags.some(tag => tag.toLowerCase().includes(searchLower))
        )
      })
    }
    
    // カテゴリフィルタ
    if (this.state.selectedCategory) {
      filtered = filtered.filter(plugin => plugin.category === this.state.selectedCategory)
    }
    
    // 優先度フィルタ
    if (this.state.selectedPriority) {
      filtered = filtered.filter(plugin => plugin.priority === this.state.selectedPriority)
    }
    
    // お気に入りフィルタ
    if (this.state.showFavorites) {
      filtered = filtered.filter(plugin => this.favorites.includes(plugin.id))
    }
    
    // 最近使用フィルタ
    if (this.state.showRecent) {
      filtered = filtered.filter(plugin => this.recentPlugins.includes(plugin.id))
    }
    
    return filtered
  }
  
  /**
   * プラグインをソート
   */
  sortPlugins(plugins) {
    return plugins.sort((a, b) => {
      switch (this.state.sortBy) {
        case 'usage':
          return (this.usageData[b.id] || 0) - (this.usageData[a.id] || 0)
        case 'recent':
          const aRecentIndex = this.recentPlugins.indexOf(a.id)
          const bRecentIndex = this.recentPlugins.indexOf(b.id)
          if (aRecentIndex === -1 && bRecentIndex === -1) return 0
          if (aRecentIndex === -1) return 1
          if (bRecentIndex === -1) return -1
          return aRecentIndex - bRecentIndex
        case 'priority':
          const priorityOrder = { high: 0, medium: 1, low: 2 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        case 'name':
        default:
          return a.name.localeCompare(b.name)
      }
    })
  }
  
  /**
   * 表示を更新
   */
  updateDisplay() {
    // プラグインをフィルタリング・ソート
    const filtered = this.filterPlugins()
    this.filteredPlugins = this.sortPlugins(filtered)
    
    // グリッドを更新
    this.updateGrid()
    
    // 統計を更新
    this.updateStats()
    
    this.log(`📊 Display updated: ${this.filteredPlugins.length} plugins shown`)
  }
  
  /**
   * プラグイングリッドを更新
   */
  updateGrid() {
    this.pluginGrid.innerHTML = ''
    
    this.filteredPlugins.forEach(plugin => {
      const pluginItem = this.createPluginItem(plugin)
      this.pluginGrid.appendChild(pluginItem)
    })
  }
  
  /**
   * プラグインアイテムを作成
   */
  createPluginItem(plugin) {
    const item = document.createElement('div')
    item.className = 'plugin-item'
    item.dataset.pluginId = plugin.id
    
    // パフォーマンス表示
    const perfClass = this.getPerformanceClass(plugin.performance)
    const isFavorite = this.favorites.includes(plugin.id)
    const usageCount = this.usageData[plugin.id] || 0
    
    item.innerHTML = `
      <div class=\"plugin-icon\">
        <span class=\"plugin-emoji\">${plugin.attributes.ui.icon}</span>
        <div class=\"plugin-priority priority-${plugin.priority}\">${this.getPriorityIcon(plugin.priority)}</div>
      </div>
      
      <div class=\"plugin-info\">
        <div class=\"plugin-name\">${plugin.displayName}</div>
        <div class=\"plugin-category\">${plugin.category}</div>
      </div>
      
      <div class=\"plugin-actions\">
        <button class=\"favorite-btn ${isFavorite ? 'active' : ''}\" data-action=\"favorite\">
          ${isFavorite ? '❤️' : '🤍'}
        </button>
        <div class=\"usage-count\">${usageCount > 0 ? usageCount : ''}</div>
      </div>
      
      <div class=\"plugin-performance ${perfClass}\">
        <div class=\"perf-indicator perf-memory\" title=\"メモリ使用量: ${plugin.performance.memory}\"></div>
        <div class=\"perf-indicator perf-cpu\" title=\"CPU使用量: ${plugin.performance.cpu}\"></div>
        <div class=\"perf-indicator perf-network\" title=\"ネットワーク使用量: ${plugin.performance.network}\"></div>
      </div>
      
      <div class=\"plugin-tooltip\">
        <div class=\"tooltip-title\">${plugin.name}</div>
        <div class=\"tooltip-desc\">${plugin.description}</div>
        <div class=\"tooltip-tags\">${plugin.tags.map(tag => `#${tag}`).join(' ')}</div>
      </div>
    `
    
    // イベントリスナーを追加
    this.setupPluginItemEvents(item, plugin)
    
    return item
  }
  
  /**
   * プラグインアイテムのイベントを設定
   */
  setupPluginItemEvents(item, plugin) {
    // お気に入りボタン
    const favoriteBtn = item.querySelector('.favorite-btn')
    favoriteBtn.addEventListener('click', async (e) => {
      e.stopPropagation()
      if (this.voidFlowCore) {
        await this.voidFlowCore.sendIntent('voidflow.ui.plugin.favorite', {
          pluginId: plugin.id,
          action: 'toggle',
          timestamp: Date.now()
        })
      } else {
        this.toggleFavorite(plugin.id)
      }
    })
    
    // シングルクリックでプラグイン追加
    item.addEventListener('click', async (e) => {
      // 接続ポートのクリックでない場合のみプラグイン追加
      // これにより、プラグインアイテム内のボタンなどがクリックされたときに、
      // プラグイン追加とボタンクリックの両方が発生するのを防ぎますにゃ。
      if (!e.target.closest('.favorite-btn')) { // お気に入りボタンなど、内部要素のクリックを除外
        if (this.voidFlowCore) {
          await this.voidFlowCore.sendIntent('voidflow.ui.plugin.add', {
            plugin,
            source: 'palette_click',
            timestamp: Date.now()
          })
        } else {
          await this.addPluginToCanvas(plugin)
        }
      }
    })
    
    // ドラッグ&ドロップ
    item.draggable = true
    item.addEventListener('dragstart', async (e) => {
      e.dataTransfer.setData('application/json', JSON.stringify(plugin))
      e.dataTransfer.setData('text/plain', plugin.id)
      
      if (this.voidFlowCore) {
        await this.voidFlowCore.sendIntent('voidflow.ui.plugin.drag.start', {
          plugin,
          source: 'palette_drag',
          timestamp: Date.now()
        })
      }
    })
    
    // ホバー効果
    item.addEventListener('mouseenter', () => {
      this.showTooltip(item, plugin)
    })
    
    item.addEventListener('mouseleave', () => {
      this.hideTooltip(item)
    })
  }
  
  /**
   * お気に入りの切り替え
   */
  toggleFavorite(pluginId) {
    const index = this.favorites.indexOf(pluginId)
    if (index === -1) {
      this.favorites.push(pluginId)
    } else {
      this.favorites.splice(index, 1)
    }
    
    this.saveFavorites()
    this.updateDisplay()
    
    this.log(`❤️ Favorite toggled: ${pluginId}`)
  }
  
  /**
   * プラグインをキャンバスに追加
   */
  async addPluginToCanvas(plugin) {
    // 使用回数を記録
    this.usageData[plugin.id] = (this.usageData[plugin.id] || 0) + 1
    
    // 最近使用リストに追加
    this.addToRecentPlugins(plugin.id)
    
    // VoidCoreUIに追加
    if (window.voidCoreUI) {
      try {
        // VoidCore v14.0 IPlugin互換のプラグインオブジェクトを作成
        const canvasElement = window.voidCoreUI.canvasManager?.canvasElement;
        if (!canvasElement) {
          console.error('❌ Canvas element not found in canvasManager');
          return;
        }
        const canvasRect = canvasElement.getBoundingClientRect();
        const position = {
            x: Math.random() * (canvasRect.width - 150) + 50, // 左右に少し余白を持たせるにゃ
            y: Math.random() * (canvasRect.height - 100) + 50 // 上下に少し余白を持たせるにゃ
        };
        const voidCorePlugin = await this.createVoidCorePlugin(plugin)
        
        // VoidCoreUIにプラグインを追加（createUIElementではなくcreateUIPluginを呼び出すにゃ！）
            // createUIPluginは、UI要素の作成と同時にVoidCoreへのプラグイン登録も行うにゃ
            await window.voidCoreUI.createUIPlugin(voidCorePlugin.metadata.nodeType, position, voidCorePlugin.id);
        this.log(`✅ Plugin added to canvas: ${plugin.displayName}`)
        
      } catch (error) {
        this.log(`❌ Failed to add plugin to canvas: ${error.message}`)
        console.error('Plugin canvas addition error:', error)
      }
    }
    
    this.saveUsageData()
    this.updateDisplay()
  }
  
  /**
   * VoidCore v14.0 IPlugin互換のプラグインオブジェクトを作成
   */
  async createVoidCorePlugin(plugin) {
    try {
      // IPlugin base class を動的インポート
      const { IPlugin } = await import('../../src/interfaces/plugin-interface.js')
      
      // VoidCore v14.0 IPlugin互換のプラグインクラスを作成
      class PalettePlugin extends IPlugin {
      constructor(pluginData) {
        super({
          id: `${pluginData.id}-${Date.now()}`,
          type: pluginData.type || 'generic',
          parent: window.voidCoreUI,
          displayName: pluginData.displayName || pluginData.name,
          metadata: {
            name: pluginData.name,
            version: pluginData.version,
            author: pluginData.author,
            description: pluginData.description,
            category: pluginData.category,
            tags: pluginData.tags,
            priority: pluginData.priority,
            performance: pluginData.performance,
            attributes: pluginData.attributes,
            config: pluginData.config,
            inputs: pluginData.inputs,
            outputs: pluginData.outputs,
            dependencies: pluginData.dependencies,
            nodeType: pluginData.type // ここを追加するにゃ！
          }
        })
        
        // プラグインデータを保存
        this.pluginData = pluginData
        this.position = { x: 100, y: 100 }
        this.properties = pluginData.config || {}
      }
      
      // 必須: メッセージハンドリング
      async handleMessage(message) {
        this.log(`📨 Message received: ${message.intent}`)
        
        switch (message.intent) {
          case 'plugin.execute':
            return await this.executePlugin(message.payload)
          case 'plugin.getInfo':
            return await this.handleGetInfo(message)
          case 'plugin.updateConfig':
            return await this.handleUpdateConfig(message)
          default:
            return await this.handleCustomIntent(message)
        }
      }
      
      // プラグイン実行ロジック
      async executePlugin(input) {
        this.log(`🚀 Executing plugin: ${this.displayName}`)
        
        // プラグインタイプに応じた実行ロジック
        switch (this.pluginData.type) {
          case 'ui.button':
            return await this.executeButtonPlugin(input)
          case 'logic.calculator':
            return await this.executeCalculatorPlugin(input)
          case 'data.json':
            return await this.executeJsonPlugin(input)
          case 'network.http':
            return await this.executeHttpPlugin(input)
          default:
            return await this.executeGenericPlugin(input)
        }
      }
      
      // ボタンプラグイン実行
      async executeButtonPlugin(input) {
        return {
          type: 'event',
          value: 'button_clicked',
          timestamp: Date.now(),
          pluginId: this.id
        }
      }
      
      // 計算プラグイン実行
      async executeCalculatorPlugin(input) {
        const expression = input?.expression || '2+2'
        try {
          const result = eval(expression) // 注意: 実際の実装では安全な評価を使用
          return {
            type: 'number',
            value: result,
            expression: expression,
            pluginId: this.id
          }
        } catch (error) {
          return {
            type: 'error',
            error: error.message,
            expression: expression,
            pluginId: this.id
          }
        }
      }
      
      // JSON処理プラグイン実行
      async executeJsonPlugin(input) {
        const jsonString = input?.jsonString || '{}'
        try {
          const parsed = JSON.parse(jsonString)
          return {
            type: 'object',
            value: parsed,
            originalString: jsonString,
            pluginId: this.id
          }
        } catch (error) {
          return {
            type: 'error',
            error: error.message,
            originalString: jsonString,
            pluginId: this.id
          }
        }
      }
      
      // HTTP処理プラグイン実行
      async executeHttpPlugin(input) {
        const url = input?.url || 'https://httpbin.org/json'
        try {
          const response = await fetch(url)
          const data = await response.json()
          return {
            type: 'object',
            value: data,
            url: url,
            status: response.status,
            pluginId: this.id
          }
        } catch (error) {
          return {
            type: 'error',
            error: error.message,
            url: url,
            pluginId: this.id
          }
        }
      }
      
      // 汎用プラグイン実行
      async executeGenericPlugin(input) {
        return {
          type: 'generic',
          value: `Plugin ${this.displayName} executed`,
          input: input,
          pluginId: this.id
        }
      }
      
      // プラグイン情報取得
      async handleGetInfo(message) {
        return {
          id: this.id,
          type: this.type,
          displayName: this.displayName,
          metadata: this.metadata,
          position: this.position,
          properties: this.properties,
          status: this.status
        }
      }
      
      // 設定更新
      async handleUpdateConfig(message) {
        if (message.payload && message.payload.config) {
          this.properties = { ...this.properties, ...message.payload.config }
          this.log(`⚙️ Config updated: ${JSON.stringify(message.payload.config)}`)
        }
        return { success: true, config: this.properties }
      }
    }
    
      // プラグインインスタンスを作成して返す
      const createdPlugin = new PalettePlugin(plugin);
      this.log(`📦 createVoidCorePlugin: Created plugin with ID=${createdPlugin.id}, nodeType=${createdPlugin.metadata.nodeType}`); // 追加ログ
      return createdPlugin;
      
    } catch (error) {
      this.log(`❌ VoidCore plugin creation failed: ${error.message}`)
      console.error('VoidCore plugin creation error:', error)
      
      // フォールバック: 簡単なプラグインオブジェクトを返す
      const fallbackPlugin = {
        id: `${plugin.id}-${Date.now()}`,
        type: plugin.type || 'generic',
        displayName: plugin.displayName || plugin.name,
        metadata: plugin,
        async handleMessage(message) {
          console.log(`📨 Simple plugin message: ${message.intent}`)
          return { type: 'generic', value: 'Simple plugin response' }
        }
      };
      this.log(`❌ createVoidCorePlugin: Falling back to simple plugin with ID=${fallbackPlugin.id}`); // 追加ログ
      return fallbackPlugin;
    }
  }
  
  /**
   * 最近使用プラグインに追加
   */
  addToRecentPlugins(pluginId) {
    // 既存のエントリを削除
    const index = this.recentPlugins.indexOf(pluginId)
    if (index !== -1) {
      this.recentPlugins.splice(index, 1)
    }
    
    // 先頭に追加
    this.recentPlugins.unshift(pluginId)
    
    // 最大10個まで保持
    if (this.recentPlugins.length > 10) {
      this.recentPlugins = this.recentPlugins.slice(0, 10)
    }
    
    this.saveRecentPlugins()
  }
  
  /**
   * 統計情報を更新
   */
  updateStats() {
    const displayedCount = this.filteredPlugins.length
    const totalCount = this.plugins.length
    
    this.container.querySelector('#displayedCount').textContent = displayedCount
    this.container.querySelector('#totalCount').textContent = totalCount
  }
  
  /**
   * パフォーマンスクラスを取得
   */
  getPerformanceClass(performance) {
    const scores = {
      none: 0,
      low: 1,
      medium: 2,
      high: 3
    }
    
    const total = scores[performance.memory] + scores[performance.cpu] + scores[performance.network]
    
    if (total <= 3) return 'perf-good'
    if (total <= 6) return 'perf-medium'
    return 'perf-high'
  }
  
  /**
   * 優先度アイコンを取得
   */
  getPriorityIcon(priority) {
    const icons = {
      high: '🔥',
      medium: '⚡',
      low: '💤'
    }
    return icons[priority] || '❓'
  }
  
  /**
   * ツールチップを表示
   */
  showTooltip(item, plugin) {
    const tooltip = item.querySelector('.plugin-tooltip')
    tooltip.style.display = 'block'
  }
  
  /**
   * ツールチップを非表示
   */
  hideTooltip(item) {
    const tooltip = item.querySelector('.plugin-tooltip')
    tooltip.style.display = 'none'
  }
  
  /**
   * データの保存・読み込み
   */
  loadUsageData() {
    try {
      const data = localStorage.getItem('voidflow-plugin-usage')
      return data ? JSON.parse(data) : {}
    } catch (error) {
      return {}
    }
  }
  
  saveUsageData() {
    try {
      localStorage.setItem('voidflow-plugin-usage', JSON.stringify(this.usageData))
    } catch (error) {
      this.log('❌ Failed to save usage data')
    }
  }
  
  loadFavorites() {
    try {
      const data = localStorage.getItem('voidflow-plugin-favorites')
      return data ? JSON.parse(data) : []
    } catch (error) {
      return []
    }
  }
  
  saveFavorites() {
    try {
      localStorage.setItem('voidflow-plugin-favorites', JSON.stringify(this.favorites))
    } catch (error) {
      this.log('❌ Failed to save favorites')
    }
  }
  
  loadRecentPlugins() {
    try {
      const data = localStorage.getItem('voidflow-plugin-recent')
      return data ? JSON.parse(data) : []
    } catch (error) {
      return []
    }
  }
  
  saveRecentPlugins() {
    try {
      localStorage.setItem('voidflow-plugin-recent', JSON.stringify(this.recentPlugins))
    } catch (error) {
      this.log('❌ Failed to save recent plugins')
    }
  }
  
  /**
   * CSSスタイルを追加
   */
  addStyles() {
    if (document.getElementById('plugin-palette-styles')) return
    
    const style = document.createElement('style')
    style.id = 'plugin-palette-styles'
    style.textContent = `
      .plugin-palette {
        background: #1a1a1a;
        border-right: 2px solid #333;
        display: flex;
        flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        color: #fff;
        overflow: hidden;
      }
      
      /* 検索セクション */
      .palette-search-section {
        padding: 15px;
        border-bottom: 1px solid #333;
      }
      
      .search-input-container {
        position: relative;
        margin-bottom: 10px;
      }
      
      .palette-search-input {
        width: 100%;
        padding: 8px 30px 8px 10px;
        background: #2a2a2a;
        border: 1px solid #444;
        border-radius: 6px;
        color: #fff;
        font-size: 12px;
        outline: none;
      }
      
      .palette-search-input:focus {
        border-color: #4fc1ff;
      }
      
      .search-clear-btn {
        position: absolute;
        right: 5px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: #888;
        cursor: pointer;
        font-size: 12px;
      }
      
      .quick-filters {
        display: flex;
        gap: 5px;
        flex-wrap: wrap;
      }
      
      .filter-btn {
        background: #2a2a2a;
        border: 1px solid #444;
        border-radius: 4px;
        color: #ccc;
        padding: 4px 8px;
        font-size: 10px;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .filter-btn:hover {
        border-color: #4fc1ff;
      }
      
      .filter-btn.active {
        background: #4fc1ff;
        color: #000;
        border-color: #4fc1ff;
      }
      
      /* カテゴリセクション */
      .palette-category-section {
        padding: 10px;
        border-bottom: 1px solid #333;
      }
      
      .category-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }
      
      .category-tab {
        background: #2a2a2a;
        border: 1px solid #444;
        border-radius: 4px;
        color: #ccc;
        padding: 4px 8px;
        font-size: 10px;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .category-tab:hover {
        border-color: #4fc1ff;
      }
      
      .category-tab.active {
        background: #4fc1ff;
        color: #000;
        border-color: #4fc1ff;
      }
      
      /* 統計セクション */
      .palette-stats-section {
        padding: 10px;
        border-bottom: 1px solid #333;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .stats-info {
        font-size: 10px;
        color: #888;
      }
      
      .stats-count {
        margin-right: 10px;
      }
      
      .sort-select {
        background: #2a2a2a;
        border: 1px solid #444;
        border-radius: 4px;
        color: #ccc;
        padding: 2px 6px;
        font-size: 10px;
        outline: none;
      }
      
      /* プラグイングリッド */
      .palette-grid-section {
        flex: 1;
        overflow-y: auto;
        padding: 10px;
      }
      
      .plugin-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 10px;
      }
      
      .plugin-item {
        background: #2a2a2a;
        border: 1px solid #444;
        border-radius: 8px;
        padding: 10px;
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
        min-height: 80px;
        display: flex;
        flex-direction: column;
      }
      
      .plugin-item:hover {
        border-color: #4fc1ff;
        background: #333;
        transform: translateY(-2px);
      }
      
      .plugin-icon {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      
      .plugin-emoji {
        font-size: 24px;
      }
      
      .plugin-priority {
        font-size: 12px;
        padding: 2px 4px;
        border-radius: 3px;
        background: rgba(255, 255, 255, 0.1);
      }
      
      .priority-high {
        color: #ff6b6b;
      }
      
      .priority-medium {
        color: #f39c12;
      }
      
      .priority-low {
        color: #95a5a6;
      }
      
      .plugin-info {
        flex: 1;
        margin-bottom: 8px;
      }
      
      .plugin-name {
        font-size: 11px;
        font-weight: bold;
        margin-bottom: 2px;
        line-height: 1.2;
      }
      
      .plugin-category {
        font-size: 9px;
        color: #888;
      }
      
      .plugin-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 5px;
      }
      
      .favorite-btn {
        background: none;
        border: none;
        font-size: 12px;
        cursor: pointer;
        padding: 2px;
        border-radius: 3px;
        transition: all 0.2s;
      }
      
      .favorite-btn:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      
      .usage-count {
        font-size: 9px;
        color: #888;
        background: rgba(255, 255, 255, 0.1);
        padding: 1px 4px;
        border-radius: 2px;
      }
      
      .plugin-performance {
        display: flex;
        gap: 2px;
        justify-content: center;
      }
      
      .perf-indicator {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #666;
      }
      
      .perf-good .perf-indicator {
        background: #27ae60;
      }
      
      .perf-medium .perf-indicator {
        background: #f39c12;
      }
      
      .perf-high .perf-indicator {
        background: #e74c3c;
      }
      
      .plugin-tooltip {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: rgba(0, 0, 0, 0.9);
        border: 1px solid #4fc1ff;
        border-radius: 6px;
        padding: 8px;
        font-size: 10px;
        z-index: 1000;
        display: none;
      }
      
      .tooltip-title {
        font-weight: bold;
        margin-bottom: 4px;
        color: #4fc1ff;
      }
      
      .tooltip-desc {
        margin-bottom: 4px;
        line-height: 1.3;
      }
      
      .tooltip-tags {
        color: #888;
        font-size: 9px;
      }
      
      /* スクロールバー */
      .palette-grid-section::-webkit-scrollbar {
        width: 6px;
      }
      
      .palette-grid-section::-webkit-scrollbar-track {
        background: #1a1a1a;
      }
      
      .palette-grid-section::-webkit-scrollbar-thumb {
        background: #4fc1ff;
        border-radius: 3px;
      }
      
      .palette-grid-section::-webkit-scrollbar-thumb:hover {
        background: #6fd3ff;
      }
    `
    
    document.head.appendChild(style)
  }
  
  /**
   * 統計情報を取得
   */
  getStats() {
    return {
      totalPlugins: this.plugins.length,
      displayedPlugins: this.filteredPlugins.length,
      favoriteCount: this.favorites.length,
      recentCount: this.recentPlugins.length,
      categories: [...new Set(this.plugins.map(p => p.category))],
      usageStats: this.usageData
    }
  }
  
  /**
   * パレットを破棄
   */
  destroy() {
    if (this.container) {
      this.container.innerHTML = ''
    }
    
    const style = document.getElementById('plugin-palette-styles')
    if (style) {
      style.remove()
    }
    
    this.log('🗑️ PluginPalette destroyed')
  }
}

// デフォルトエクスポート
export default PluginPalettePlugin

console.log('🎨 PluginPalettePlugin loaded!')