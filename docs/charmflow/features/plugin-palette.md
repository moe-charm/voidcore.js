# 🎨 Plugin Palette System

> **高機能プラグイン管理システム** - 検索・フィルタリング・分類・使用履歴管理

## 📋 概要

Plugin Paletteは、VoidFlowの中核機能として、プラグインの検索、フィルタリング、分類、使用履歴管理を提供する高機能なプラグイン管理システムです。

## ✨ 主要機能

### 🔍 検索・フィルタリング機能
- **テキスト検索**: プラグイン名、説明、タグでの検索
- **カテゴリフィルタ**: 9つのカテゴリ別フィルタリング
- **優先度フィルタ**: High/Medium/Low優先度での絞り込み
- **リアルタイム検索**: 入力と同時に結果を更新

### 🏷️ カテゴリ分類システム
```javascript
const PLUGIN_CATEGORIES = {
  UI: '🎨 ユーザーインターフェース',
  Logic: '🧮 ロジック・演算',
  Data: '📊 データ処理',
  Network: '🌐 ネットワーク・通信',
  AI: '🤖 AI・機械学習',
  Media: '🖼️ メディア・画像',
  Storage: '💾 ストレージ・データベース',
  Utility: '🔧 ユーティリティ・ツール',
  Visualization: '📈 可視化・グラフ',
  Workflow: '⚡ ワークフロー・自動化'
}
```

### 📊 使用履歴管理
- **使用回数記録**: プラグインの使用頻度を追跡
- **最近使用**: 最近使用したプラグインの履歴
- **お気に入り**: ユーザーのお気に入りプラグイン管理
- **LocalStorage永続化**: ブラウザ再起動後も情報を保持

## 🏗️ アーキテクチャ

### クラス構造
```javascript
class PluginPalettePlugin {
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
    
    // 状態管理
    this.state = {
      searchText: '',
      selectedCategory: null,
      selectedPriority: null,
      selectedTags: [],
      showFavorites: false,
      showRecent: false,
      sortBy: 'name'
    }
    
    // プラグインデータ
    this.plugins = []
    this.filteredPlugins = []
    
    // 使用状況データ
    this.usageData = this.loadUsageData()
    this.favorites = this.loadFavorites()
    this.recentPlugins = this.loadRecentPlugins()
  }
}
```

### 主要メソッド

#### 1. プラグイン初期化
```javascript
async initializePlugins() {
  try {
    this.log('📦 Loading plugin samples...')
    
    // シンプルプラグインを直接読み込み
    this.plugins = simplePlugins
    this.filteredPlugins = this.plugins
    
    this.log(`✅ ${this.plugins.length} plugins loaded successfully`)
    
  } catch (error) {
    this.log(`❌ Failed to load plugins: ${error.message}`)
    console.error('Plugin initialization error:', error)
  }
}
```

#### 2. パレット作成
```javascript
async createPalette(container) {
  this.container = container
  
  // プラグインデータの読み込み完了を待つ
  await this.initializePlugins()
  
  // メインパレット構造を作成
  const paletteHTML = this.generatePaletteHTML()
  container.innerHTML = paletteHTML
  
  // DOM要素を取得
  this.setupDOMReferences()
  
  // イベントリスナーを設定
  this.setupEventListeners()
  
  // 初期データを表示
  this.updateDisplay()
  
  // CSSスタイルを追加
  this.addStyles()
  
  this.log('🎨 Palette created and initialized')
}
```

#### 3. フィルタリング
```javascript
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
    filtered = filtered.filter(plugin => 
      plugin.category === this.state.selectedCategory
    )
  }
  
  // 優先度フィルタ
  if (this.state.selectedPriority) {
    filtered = filtered.filter(plugin => 
      plugin.priority === this.state.selectedPriority
    )
  }
  
  // お気に入りフィルタ
  if (this.state.showFavorites) {
    filtered = filtered.filter(plugin => 
      this.favorites.includes(plugin.id)
    )
  }
  
  // 最近使用フィルタ
  if (this.state.showRecent) {
    filtered = filtered.filter(plugin => 
      this.recentPlugins.includes(plugin.id)
    )
  }
  
  return filtered
}
```

#### 4. ソート機能
```javascript
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
```

## 🎨 UI コンポーネント

### 1. 検索バー
```html
<div class="palette-search-section">
  <div class="search-input-container">
    <input type="text" 
           class="palette-search-input" 
           placeholder="🔍 プラグイン検索..."
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
```

### 2. カテゴリタブ
```html
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
```

### 3. プラグインアイテム
```html
<div class="plugin-item" data-plugin-id="plugin-id">
  <div class="plugin-icon">
    <span class="plugin-emoji">🔘</span>
    <div class="plugin-priority priority-high">🔥</div>
  </div>
  
  <div class="plugin-info">
    <div class="plugin-name">Interactive Button</div>
    <div class="plugin-category">UI</div>
  </div>
  
  <div class="plugin-actions">
    <button class="favorite-btn" data-action="favorite">🤍</button>
    <div class="usage-count">5</div>
  </div>
  
  <div class="plugin-performance perf-good">
    <div class="perf-indicator perf-memory" title="メモリ使用量: low"></div>
    <div class="perf-indicator perf-cpu" title="CPU使用量: low"></div>
    <div class="perf-indicator perf-network" title="ネットワーク使用量: none"></div>
  </div>
  
  <div class="plugin-tooltip">
    <div class="tooltip-title">Interactive Button</div>
    <div class="tooltip-desc">Multi-purpose interactive button with customizable actions</div>
    <div class="tooltip-tags">#button #interactive #ui #click #action</div>
  </div>
</div>
```

### 4. 統計パネル
```html
<div class="palette-stats-section">
  <div class="stats-info">
    <span class="stats-count">表示中: <span id="displayedCount">10</span></span>
    <span class="stats-total">全体: <span id="totalCount">50</span></span>
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
```

## 🔄 インタラクション

### 1. ドラッグ&ドロップ
```javascript
setupPluginItemEvents(item, plugin) {
  // ドラッグ&ドロップ
  item.draggable = true
  item.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('application/json', JSON.stringify(plugin))
    e.dataTransfer.setData('text/plain', plugin.id)
  })
  
  // ダブルクリックでプラグイン追加
  item.addEventListener('dblclick', async () => {
    await this.addPluginToCanvas(plugin)
  })
}
```

### 2. お気に入り管理
```javascript
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
```

### 3. 使用履歴記録
```javascript
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
```

## 🎛️ カスタマイズ

### 設定オプション
```javascript
const paletteOptions = {
  // 基本設定
  width: '100%',
  height: '100%',
  itemSize: 80,
  itemSpacing: 10,
  
  // UI設定
  searchPlaceholder: '🔍 プラグイン検索...',
  showStats: true,
  enableVirtualScroll: true,
  
  // フィルタ設定
  defaultCategory: null,
  defaultSortBy: 'name',
  maxRecentItems: 10,
  
  // パフォーマンス設定
  batchSize: 50,
  loadDelay: 100,
  debounceTime: 300
}
```

### テーマカスタマイズ
```javascript
const customTheme = {
  colors: {
    primary: '#4fc1ff',
    secondary: '#00ff88',
    background: '#1a1a1a',
    surface: '#2a2a2a',
    text: '#ffffff',
    textSecondary: '#888888'
  },
  spacing: {
    padding: 10,
    margin: 5,
    borderRadius: 6
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 12,
    lineHeight: 1.4
  }
}
```

## 📊 パフォーマンス最適化

### 1. 仮想スクロール
```javascript
class VirtualScrollManager {
  constructor(container, itemHeight, bufferSize = 5) {
    this.container = container
    this.itemHeight = itemHeight
    this.bufferSize = bufferSize
    this.visibleItems = []
  }
  
  updateVisibleItems(scrollTop, containerHeight, totalItems) {
    const startIndex = Math.max(0, 
      Math.floor(scrollTop / this.itemHeight) - this.bufferSize
    )
    const endIndex = Math.min(totalItems, 
      Math.ceil((scrollTop + containerHeight) / this.itemHeight) + this.bufferSize
    )
    
    this.visibleItems = { startIndex, endIndex }
    return this.visibleItems
  }
}
```

### 2. 検索デバウンス
```javascript
class SearchDebouncer {
  constructor(delay = 300) {
    this.delay = delay
    this.timeout = null
  }
  
  debounce(func, ...args) {
    clearTimeout(this.timeout)
    this.timeout = setTimeout(() => {
      func.apply(this, args)
    }, this.delay)
  }
}
```

### 3. メモリ管理
```javascript
class PluginMemoryManager {
  constructor() {
    this.cache = new Map()
    this.maxCacheSize = 100
  }
  
  addToCache(pluginId, data) {
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    this.cache.set(pluginId, data)
  }
  
  getFromCache(pluginId) {
    return this.cache.get(pluginId)
  }
  
  clearCache() {
    this.cache.clear()
  }
}
```

## 🧪 テスト

### 単体テスト例
```javascript
describe('PluginPalettePlugin', () => {
  let palette
  
  beforeEach(() => {
    palette = new PluginPalettePlugin({
      width: 300,
      height: 400,
      showStats: true
    })
  })
  
  describe('filterPlugins', () => {
    it('should filter plugins by text search', () => {
      palette.plugins = mockPlugins
      palette.state.searchText = 'button'
      
      const filtered = palette.filterPlugins()
      
      expect(filtered).toHaveLength(1)
      expect(filtered[0].name).toContain('Button')
    })
    
    it('should filter plugins by category', () => {
      palette.plugins = mockPlugins
      palette.state.selectedCategory = 'UI'
      
      const filtered = palette.filterPlugins()
      
      expect(filtered.every(p => p.category === 'UI')).toBe(true)
    })
  })
  
  describe('sortPlugins', () => {
    it('should sort plugins by name', () => {
      const plugins = [
        { name: 'Zebra', id: 'z' },
        { name: 'Alpha', id: 'a' }
      ]
      
      palette.state.sortBy = 'name'
      const sorted = palette.sortPlugins(plugins)
      
      expect(sorted[0].name).toBe('Alpha')
      expect(sorted[1].name).toBe('Zebra')
    })
  })
})
```

## 📋 API Reference

### 主要メソッド
```javascript
// プラグインパレット操作
await palette.createPalette(container)
await palette.initializePlugins()
palette.updateDisplay()
palette.filterPlugins()
palette.sortPlugins(plugins)

// 状態管理
palette.selectCategory(category)
palette.toggleQuickFilter(filter)
palette.toggleFavorite(pluginId)

// プラグイン操作
await palette.addPluginToCanvas(plugin)
await palette.createVoidCorePlugin(plugin)

// データ管理
palette.loadUsageData()
palette.saveUsageData()
palette.loadFavorites()
palette.saveFavorites()

// 統計・デバッグ
palette.getStats()
palette.log(message)
```

### イベント
```javascript
// カスタムイベント
palette.addEventListener('pluginAdded', (event) => {
  console.log('Plugin added:', event.detail.plugin)
})

palette.addEventListener('filterChanged', (event) => {
  console.log('Filter changed:', event.detail.filter)
})

palette.addEventListener('searchChanged', (event) => {
  console.log('Search changed:', event.detail.searchText)
})
```

---

## 📝 関連ドキュメント

- [Layout System](./layout-system.md) - レイアウト・配置システム
- [Search & Filter](./search-filter.md) - 検索・フィルタリング詳細
- [Plugin Management](./plugin-management.md) - プラグイン管理機能
- [Plugin Development](../plugins/development-guide.md) - プラグイン開発ガイド

---

**Last Updated**: 2025-07-09  
**Author**: VoidFlow Development Team  
**Version**: v1.0.0