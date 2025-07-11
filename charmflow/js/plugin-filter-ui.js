// plugin-filter-ui.js - プラグインフィルタリングUI
// 属性システムに基づく高度なフィルタリング・検索機能

import { PluginAttributeTypes } from '/src/core/plugin-attributes.js'

/**
 * 🔍 PluginFilterUI - プラグインフィルタリングUI
 * 
 * 1000個以上のプラグインを効率的に検索・フィルタリングするためのUI
 * - カテゴリフィルター
 * - タグ検索
 * - 属性ベースフィルター
 * - インクリメンタルサーチ
 */
export class PluginFilterUI {
  constructor(voidCoreUI, options = {}) {
    this.voidCoreUI = voidCoreUI
    this.voidFlowCore = options.voidFlowCore || null  // Phase Alpha: Intent統合
    this.container = null
    this.searchInput = null
    this.filterButtons = new Map()
    this.tagCloud = null
    this.isVisible = false
    
    // フィルター状態
    this.currentFilters = {
      search: '',
      category: null,
      tags: [],
      priority: null,
      showHidden: false,
      showExperimental: true,
      performance: null,
      complexity: null
    }
    
    // 統計データ
    this.stats = {
      totalPlugins: 0,
      filteredPlugins: 0,
      categoryStats: {},
      tagCloud: []
    }
    
    this.log('🔍 PluginFilterUI initialized')
  }
  
  log(message) {
    console.log(`[PluginFilterUI] ${message}`)
  }
  
  /**
   * UIの初期化
   */
  initialize(container) {
    this.container = container
    this.createFilterUI()
    this.updateStats()
    this.bindEvents()
    
    this.log('🎨 Filter UI initialized')
  }
  
  /**
   * フィルターUIの作成
   */
  createFilterUI() {
    this.container.innerHTML = `
      <div class="plugin-filter-ui" style="
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 8px;
        padding: 15px;
        margin: 10px 0;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      ">
        <!-- 検索セクション -->
        <div class="filter-section">
          <h3 style="color: #4fc1ff; margin: 0 0 10px 0; font-size: 14px;">🔍 Plugin Search</h3>
          <div class="search-container" style="position: relative;">
            <input type="text" id="pluginSearch" placeholder="Search plugins by name, tag, or description..." 
                   style="
                     width: 100%;
                     padding: 8px 12px;
                     background: #2a2a2a;
                     border: 1px solid #444;
                     border-radius: 4px;
                     color: #fff;
                     font-size: 12px;
                   ">
            <div class="search-results" id="searchResults" style="
              position: absolute;
              top: 100%;
              left: 0;
              right: 0;
              background: #2a2a2a;
              border: 1px solid #444;
              border-radius: 4px;
              max-height: 200px;
              overflow-y: auto;
              z-index: 1000;
              display: none;
            "></div>
          </div>
        </div>
        
        <!-- カテゴリフィルター -->
        <div class="filter-section" style="margin-top: 15px;">
          <h3 style="color: #4fc1ff; margin: 0 0 10px 0; font-size: 14px;">📂 Categories</h3>
          <div class="category-filters" id="categoryFilters" style="
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          "></div>
        </div>
        
        <!-- タグクラウド -->
        <div class="filter-section" style="margin-top: 15px;">
          <h3 style="color: #4fc1ff; margin: 0 0 10px 0; font-size: 14px;">🏷️ Popular Tags</h3>
          <div class="tag-cloud" id="tagCloud" style="
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            max-height: 120px;
            overflow-y: auto;
          "></div>
        </div>
        
        <!-- 属性フィルター -->
        <div class="filter-section" style="margin-top: 15px;">
          <h3 style="color: #4fc1ff; margin: 0 0 10px 0; font-size: 14px;">⚙️ Filters</h3>
          <div class="attribute-filters" style="display: flex; flex-wrap: wrap; gap: 10px;">
            <div class="filter-group">
              <label style="color: #ccc; font-size: 11px;">Priority:</label>
              <select id="priorityFilter" style="
                background: #2a2a2a;
                border: 1px solid #444;
                border-radius: 4px;
                color: #fff;
                padding: 4px 8px;
                font-size: 11px;
              ">
                <option value="">All</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label style="color: #ccc; font-size: 11px;">Performance:</label>
              <select id="performanceFilter" style="
                background: #2a2a2a;
                border: 1px solid #444;
                border-radius: 4px;
                color: #fff;
                padding: 4px 8px;
                font-size: 11px;
              ">
                <option value="">All</option>
                <option value="light">Light</option>
                <option value="medium">Medium</option>
                <option value="heavy">Heavy</option>
              </select>
            </div>
            
            <div class="filter-group">
              <label style="color: #ccc; font-size: 11px;">
                <input type="checkbox" id="showHidden" style="margin-right: 4px;">
                Show Hidden
              </label>
            </div>
            
            <div class="filter-group">
              <label style="color: #ccc; font-size: 11px;">
                <input type="checkbox" id="showExperimental" checked style="margin-right: 4px;">
                Show Experimental
              </label>
            </div>
          </div>
        </div>
        
        <!-- 統計情報 -->
        <div class="filter-section" style="margin-top: 15px;">
          <h3 style="color: #4fc1ff; margin: 0 0 10px 0; font-size: 14px;">📊 Statistics</h3>
          <div class="stats-info" id="statsInfo" style="
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #aaa;
          "></div>
        </div>
        
        <!-- リセットボタン -->
        <div class="filter-section" style="margin-top: 15px;">
          <button id="resetFilters" style="
            background: #ff6b6b;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            width: 100%;
          ">🔄 Reset All Filters</button>
        </div>
      </div>
    `
    
    // 要素への参照を取得
    this.searchInput = this.container.querySelector('#pluginSearch')
    this.searchResults = this.container.querySelector('#searchResults')
    this.categoryFilters = this.container.querySelector('#categoryFilters')
    this.tagCloud = this.container.querySelector('#tagCloud')
    this.statsInfo = this.container.querySelector('#statsInfo')
    
    // カテゴリフィルターボタンを作成
    this.createCategoryFilters()
    
    // タグクラウドを作成
    this.createTagCloud()
  }
  
  /**
   * カテゴリフィルターボタンの作成
   */
  createCategoryFilters() {
    const categories = Object.values(PluginAttributeTypes.CATEGORIES)
    
    // All カテゴリボタン
    const allButton = this.createFilterButton('All', 'all', true)
    this.categoryFilters.appendChild(allButton)
    
    // 各カテゴリボタン
    categories.forEach(category => {
      const button = this.createFilterButton(category, category, false)
      this.categoryFilters.appendChild(button)
    })
  }
  
  /**
   * フィルターボタンの作成
   */
  createFilterButton(text, value, isActive) {
    const button = document.createElement('button')
    button.textContent = text
    button.dataset.value = value
    button.className = `filter-btn ${isActive ? 'active' : ''}`
    button.style.cssText = `
      background: ${isActive ? '#4fc1ff' : '#2a2a2a'};
      color: ${isActive ? '#000' : '#ccc'};
      border: 1px solid ${isActive ? '#4fc1ff' : '#444'};
      border-radius: 4px;
      padding: 6px 12px;
      font-size: 11px;
      cursor: pointer;
      transition: all 0.2s;
    `
    
    // ホバーエフェクト
    button.addEventListener('mouseenter', () => {
      if (!button.classList.contains('active')) {
        button.style.borderColor = '#4fc1ff'
        button.style.color = '#4fc1ff'
      }
    })
    
    button.addEventListener('mouseleave', () => {
      if (!button.classList.contains('active')) {
        button.style.borderColor = '#444'
        button.style.color = '#ccc'
      }
    })
    
    this.filterButtons.set(value, button)
    return button
  }
  
  /**
   * タグクラウドの作成
   */
  createTagCloud() {
    const tagCloudData = this.voidCoreUI.generateTagCloud()
    
    this.tagCloud.innerHTML = ''
    
    tagCloudData.slice(0, 20).forEach(({ tag, count }) => {
      const tagElement = document.createElement('span')
      tagElement.textContent = `${tag} (${count})`
      tagElement.className = 'tag-item'
      tagElement.dataset.tag = tag
      tagElement.style.cssText = `
        background: rgba(74, 144, 226, 0.2);
        color: #4a90e2;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: ${Math.min(11 + count, 14)}px;
        cursor: pointer;
        transition: all 0.2s;
        user-select: none;
      `
      
      // クリックでタグフィルター
      tagElement.addEventListener('click', async () => {
        if (this.voidFlowCore) {
          await this.voidFlowCore.sendIntent('charmflow.ui.filter.tag', {
            tag,
            action: 'toggle',
            timestamp: Date.now()
          })
        } else {
          this.toggleTagFilter(tag)
        }
      })
      
      // ホバーエフェクト
      tagElement.addEventListener('mouseenter', () => {
        tagElement.style.background = 'rgba(74, 144, 226, 0.4)'
        tagElement.style.transform = 'scale(1.1)'
      })
      
      tagElement.addEventListener('mouseleave', () => {
        tagElement.style.background = 'rgba(74, 144, 226, 0.2)'
        tagElement.style.transform = 'scale(1)'
      })
      
      this.tagCloud.appendChild(tagElement)
    })
  }
  
  /**
   * イベントのバインド
   */
  bindEvents() {
    // 検索入力
    this.searchInput.addEventListener('input', async (e) => {
      if (this.voidFlowCore) {
        await this.voidFlowCore.sendIntent('charmflow.ui.filter.search', {
          query: e.target.value,
          timestamp: Date.now()
        })
      } else {
        this.handleSearch(e.target.value)
      }
    })
    
    // カテゴリフィルター
    this.categoryFilters.addEventListener('click', async (e) => {
      if (e.target.classList.contains('filter-btn')) {
        if (this.voidFlowCore) {
          await this.voidFlowCore.sendIntent('charmflow.ui.filter.category', {
            category: e.target.dataset.value,
            timestamp: Date.now()
          })
        } else {
          this.handleCategoryFilter(e.target.dataset.value)
        }
      }
    })
    
    // 属性フィルター
    this.container.querySelector('#priorityFilter').addEventListener('change', async (e) => {
      if (this.voidFlowCore) {
        await this.voidFlowCore.sendIntent('charmflow.ui.filter.attribute', {
          attribute: 'priority',
          value: e.target.value,
          timestamp: Date.now()
        })
      } else {
        this.handleAttributeFilter('priority', e.target.value)
      }
    })
    
    this.container.querySelector('#performanceFilter').addEventListener('change', async (e) => {
      if (this.voidFlowCore) {
        await this.voidFlowCore.sendIntent('charmflow.ui.filter.attribute', {
          attribute: 'performance',
          value: e.target.value,
          timestamp: Date.now()
        })
      } else {
        this.handleAttributeFilter('performance', e.target.value)
      }
    })
    
    this.container.querySelector('#showHidden').addEventListener('change', async (e) => {
      if (this.voidFlowCore) {
        await this.voidFlowCore.sendIntent('charmflow.ui.filter.attribute', {
          attribute: 'showHidden',
          value: e.target.checked,
          timestamp: Date.now()
        })
      } else {
        this.handleAttributeFilter('showHidden', e.target.checked)
      }
    })
    
    this.container.querySelector('#showExperimental').addEventListener('change', async (e) => {
      if (this.voidFlowCore) {
        await this.voidFlowCore.sendIntent('charmflow.ui.filter.attribute', {
          attribute: 'showExperimental',
          value: e.target.checked,
          timestamp: Date.now()
        })
      } else {
        this.handleAttributeFilter('showExperimental', e.target.checked)
      }
    })
    
    // リセットボタン
    this.container.querySelector('#resetFilters').addEventListener('click', async () => {
      if (this.voidFlowCore) {
        await this.voidFlowCore.sendIntent('charmflow.ui.filter.reset', {
          timestamp: Date.now()
        })
      } else {
        this.resetFilters()
      }
    })
  }
  
  /**
   * 検索処理
   */
  handleSearch(query) {
    this.currentFilters.search = query
    this.applyFilters()
    
    if (query.length > 0) {
      this.showSearchResults(query)
    } else {
      this.hideSearchResults()
    }
  }
  
  /**
   * カテゴリフィルター処理
   */
  handleCategoryFilter(category) {
    // アクティブボタンの更新
    this.filterButtons.forEach((button, value) => {
      if (value === category) {
        button.classList.add('active')
        button.style.background = '#4fc1ff'
        button.style.color = '#000'
      } else {
        button.classList.remove('active')
        button.style.background = '#2a2a2a'
        button.style.color = '#ccc'
      }
    })
    
    this.currentFilters.category = category === 'all' ? null : category
    this.applyFilters()
  }
  
  /**
   * 属性フィルター処理
   */
  handleAttributeFilter(filterType, value) {
    this.currentFilters[filterType] = value
    this.applyFilters()
  }
  
  /**
   * タグフィルター切り替え
   */
  toggleTagFilter(tag) {
    const tagIndex = this.currentFilters.tags.indexOf(tag)
    
    if (tagIndex > -1) {
      this.currentFilters.tags.splice(tagIndex, 1)
    } else {
      this.currentFilters.tags.push(tag)
    }
    
    this.applyFilters()
    this.updateTagCloudVisual()
  }
  
  /**
   * フィルターの適用
   */
  applyFilters() {
    // VoidCoreUIにフィルターを適用
    Object.entries(this.currentFilters).forEach(([key, value]) => {
      if (key !== 'search' && value !== null && value !== '') {
        this.voidCoreUI.setAttributeFilter(key, value)
      }
    })
    
    // 検索クエリの処理
    if (this.currentFilters.search) {
      // 検索結果を取得してフィルタリング
      const searchResults = this.voidCoreUI.searchPluginsByTag(this.currentFilters.search)
      this.log(`Search results: ${searchResults.length} plugins found`)
    }
    
    this.updateStats()
  }
  
  /**
   * 統計情報の更新
   */
  updateStats() {
    const categoryStats = this.voidCoreUI.getCategoryStats()
    const filteredPlugins = this.voidCoreUI.getFilteredPlugins()
    
    this.stats.totalPlugins = this.voidCoreUI.uiPlugins.size
    this.stats.filteredPlugins = filteredPlugins.length
    this.stats.categoryStats = categoryStats
    
    this.statsInfo.innerHTML = `
      <span>Total: ${this.stats.totalPlugins}</span>
      <span>Filtered: ${this.stats.filteredPlugins}</span>
      <span>Categories: ${Object.keys(categoryStats).length}</span>
    `
  }
  
  /**
   * 検索結果の表示
   */
  showSearchResults(query) {
    const results = this.voidCoreUI.searchPluginsByTag(query)
    
    this.searchResults.innerHTML = ''
    
    if (results.length === 0) {
      this.searchResults.innerHTML = '<div style="padding: 8px; color: #666; text-align: center;">No plugins found</div>'
    } else {
      results.slice(0, 10).forEach(([pluginId, plugin]) => {
        const attributes = this.voidCoreUI.getPluginAttributes(pluginId)
        const item = document.createElement('div')
        item.style.cssText = `
          padding: 8px;
          border-bottom: 1px solid #333;
          cursor: pointer;
          transition: background 0.2s;
        `
        
        item.innerHTML = `
          <div style="font-weight: bold; color: #4fc1ff; font-size: 12px;">${plugin.displayName || pluginId}</div>
          <div style="font-size: 10px; color: #aaa;">${attributes.metadata.description}</div>
          <div style="font-size: 9px; color: #666; margin-top: 2px;">
            ${attributes.tags.slice(0, 3).map(tag => `#${tag}`).join(' ')}
          </div>
        `
        
        item.addEventListener('mouseenter', () => {
          item.style.background = '#333'
        })
        
        item.addEventListener('mouseleave', () => {
          item.style.background = 'transparent'
        })
        
        item.addEventListener('click', async () => {
          if (this.voidFlowCore) {
            await this.voidFlowCore.sendIntent('charmflow.ui.plugin.select', {
              pluginId,
              source: 'filter_search',
              timestamp: Date.now()
            })
          } else {
            this.selectPlugin(pluginId)
            this.hideSearchResults()
          }
        })
        
        this.searchResults.appendChild(item)
      })
    }
    
    this.searchResults.style.display = 'block'
  }
  
  /**
   * 検索結果の非表示
   */
  hideSearchResults() {
    this.searchResults.style.display = 'none'
  }
  
  /**
   * プラグインの選択
   */
  selectPlugin(pluginId) {
    // プラグインを選択状態にする
    this.voidCoreUI.selectedElements.clear()
    this.voidCoreUI.selectedElements.add(pluginId)
    
    // UI要素をハイライト
    const element = this.voidCoreUI.uiElements.get(pluginId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      element.classList.add('selected')
    }
    
    this.log(`Plugin selected: ${pluginId}`)
  }
  
  /**
   * タグクラウドの視覚的更新
   */
  updateTagCloudVisual() {
    this.tagCloud.querySelectorAll('.tag-item').forEach(item => {
      const tag = item.dataset.tag
      const isSelected = this.currentFilters.tags.includes(tag)
      
      if (isSelected) {
        item.style.background = 'rgba(0, 255, 136, 0.3)'
        item.style.color = '#00ff88'
      } else {
        item.style.background = 'rgba(74, 144, 226, 0.2)'
        item.style.color = '#4a90e2'
      }
    })
  }
  
  /**
   * フィルターのリセット
   */
  resetFilters() {
    // フィルター状態をリセット
    this.currentFilters = {
      search: '',
      category: null,
      tags: [],
      priority: null,
      showHidden: false,
      showExperimental: true,
      performance: null,
      complexity: null
    }
    
    // UI要素をリセット
    this.searchInput.value = ''
    this.container.querySelector('#priorityFilter').value = ''
    this.container.querySelector('#performanceFilter').value = ''
    this.container.querySelector('#showHidden').checked = false
    this.container.querySelector('#showExperimental').checked = true
    
    // カテゴリフィルターをリセット
    this.handleCategoryFilter('all')
    
    // タグクラウドをリセット
    this.updateTagCloudVisual()
    
    // フィルターを適用
    this.applyFilters()
    
    this.log('🔄 All filters reset')
  }
  
  /**
   * UIの表示/非表示切り替え
   */
  toggle() {
    this.isVisible = !this.isVisible
    this.container.style.display = this.isVisible ? 'block' : 'none'
  }
  
  /**
   * UIの表示
   */
  show() {
    this.isVisible = true
    this.container.style.display = 'block'
    this.updateStats()
    this.createTagCloud()
  }
  
  /**
   * UIの非表示
   */
  hide() {
    this.isVisible = false
    this.container.style.display = 'none'
  }
}

console.log('🔍 PluginFilterUI system loaded!')