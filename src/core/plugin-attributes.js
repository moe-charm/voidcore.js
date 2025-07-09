// plugin-attributes.js - VoidFlow プラグイン属性システム
// プラグインの分類・管理・フィルタリングのための属性定義

/**
 * 🏷️ PluginAttributes - プラグイン属性システム
 * 
 * 1000個以上のプラグインを効率的に管理するための属性定義
 * - カテゴリ分類
 * - タグベース検索
 * - 優先度管理
 * - フィルタリング対応
 */

/**
 * プラグイン属性の型定義
 */
export const PluginAttributeTypes = {
  // 基本カテゴリ
  CATEGORIES: {
    UI: 'UI',                           // ユーザーインターフェース
    LOGIC: 'Logic',                     // ロジック・処理
    DATA: 'Data',                       // データ処理・変換
    AI: 'AI',                          // AI・機械学習
    INPUT: 'Input',                     // 入力・センサー
    VISUALIZATION: 'Visualization',     // 可視化・表示
    MEDIA: 'Media',                     // メディア・エンタメ
    NETWORK: 'Network',                 // ネットワーク・通信
    UTILITY: 'Utility',                 // ユーティリティ・開発
    GAME: 'Game',                      // ゲーム・インタラクティブ
    SYSTEM: 'System'                   // システム・内部
  },
  
  // 優先度
  PRIORITIES: {
    HIGH: 'high',       // 重要・頻繁に使用
    MEDIUM: 'medium',   // 通常
    LOW: 'low'         // 補助的・特殊用途
  },
  
  // パフォーマンス分類
  PERFORMANCE: {
    LIGHT: 'light',     // 軽量・高速
    MEDIUM: 'medium',   // 中程度
    HEAVY: 'heavy'      // 重い・時間がかかる
  },
  
  // 複雑度
  COMPLEXITY: {
    SIMPLE: 'simple',       // 単純・初心者向け
    INTERMEDIATE: 'intermediate', // 中級者向け
    ADVANCED: 'advanced'    // 上級者向け
  }
}

/**
 * プラグイン属性のデフォルト値
 */
export const DefaultPluginAttributes = {
  category: PluginAttributeTypes.CATEGORIES.UTILITY,
  tags: [],
  priority: PluginAttributeTypes.PRIORITIES.MEDIUM,
  group: null,
  isHidden: false,
  isExperimental: false,
  performance: PluginAttributeTypes.PERFORMANCE.MEDIUM,
  complexity: PluginAttributeTypes.COMPLEXITY.SIMPLE,
  author: 'Anonymous',
  license: 'MIT',
  version: '1.0.0',
  dependencies: [],
  compatibility: ['voidcore-14.0']
}

/**
 * プラグイン属性クラス
 */
export class PluginAttributes {
  constructor(attributes = {}) {
    // 基本属性
    this.category = attributes.category || DefaultPluginAttributes.category
    this.tags = Array.isArray(attributes.tags) ? attributes.tags : []
    this.priority = attributes.priority || DefaultPluginAttributes.priority
    this.group = attributes.group || DefaultPluginAttributes.group
    this.isHidden = Boolean(attributes.isHidden)
    this.isExperimental = Boolean(attributes.isExperimental)
    
    // 拡張属性
    this.author = attributes.author || DefaultPluginAttributes.author
    this.license = attributes.license || DefaultPluginAttributes.license
    this.version = attributes.version || DefaultPluginAttributes.version
    this.dependencies = Array.isArray(attributes.dependencies) ? attributes.dependencies : []
    this.performance = attributes.performance || DefaultPluginAttributes.performance
    this.complexity = attributes.complexity || DefaultPluginAttributes.complexity
    this.compatibility = Array.isArray(attributes.compatibility) ? attributes.compatibility : DefaultPluginAttributes.compatibility
    
    // 使用統計
    this.usage = {
      frequency: attributes.usage?.frequency || 0,
      lastUsed: attributes.usage?.lastUsed || null,
      totalExecutions: attributes.usage?.totalExecutions || 0,
      averageExecutionTime: attributes.usage?.averageExecutionTime || 0
    }
    
    // 視覚的属性
    this.visual = {
      icon: attributes.visual?.icon || '🔧',
      color: attributes.visual?.color || '#4a90e2',
      thumbnail: attributes.visual?.thumbnail || null,
      backgroundColor: attributes.visual?.backgroundColor || null
    }
    
    // レイアウトヒント
    this.layout = {
      preferredPosition: attributes.layout?.preferredPosition || 'center',
      preferredSize: attributes.layout?.preferredSize || { width: 200, height: 150 },
      canResize: attributes.layout?.canResize !== false,
      minSize: attributes.layout?.minSize || { width: 100, height: 80 }
    }
    
    // メタデータ
    this.metadata = {
      description: attributes.metadata?.description || '',
      documentation: attributes.metadata?.documentation || null,
      examples: attributes.metadata?.examples || [],
      keywords: attributes.metadata?.keywords || [],
      created: attributes.metadata?.created || Date.now(),
      modified: attributes.metadata?.modified || Date.now()
    }
  }
  
  /**
   * 属性の検証
   */
  validate() {
    const errors = []
    
    // カテゴリ検証
    if (!Object.values(PluginAttributeTypes.CATEGORIES).includes(this.category)) {
      errors.push(`Invalid category: ${this.category}`)
    }
    
    // 優先度検証
    if (!Object.values(PluginAttributeTypes.PRIORITIES).includes(this.priority)) {
      errors.push(`Invalid priority: ${this.priority}`)
    }
    
    // パフォーマンス検証
    if (!Object.values(PluginAttributeTypes.PERFORMANCE).includes(this.performance)) {
      errors.push(`Invalid performance: ${this.performance}`)
    }
    
    // 複雑度検証
    if (!Object.values(PluginAttributeTypes.COMPLEXITY).includes(this.complexity)) {
      errors.push(`Invalid complexity: ${this.complexity}`)
    }
    
    // タグ検証
    if (!Array.isArray(this.tags)) {
      errors.push('Tags must be an array')
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    }
  }
  
  /**
   * 他の属性との類似度計算
   */
  calculateSimilarity(otherAttributes) {
    let score = 0
    let maxScore = 0
    
    // カテゴリ一致
    maxScore += 10
    if (this.category === otherAttributes.category) {
      score += 10
    }
    
    // タグ一致
    const commonTags = this.tags.filter(tag => otherAttributes.tags.includes(tag))
    const totalTags = new Set([...this.tags, ...otherAttributes.tags]).size
    maxScore += 20
    if (totalTags > 0) {
      score += (commonTags.length / totalTags) * 20
    }
    
    // 優先度類似性
    maxScore += 5
    const priorityScore = {
      [PluginAttributeTypes.PRIORITIES.HIGH]: 3,
      [PluginAttributeTypes.PRIORITIES.MEDIUM]: 2,
      [PluginAttributeTypes.PRIORITIES.LOW]: 1
    }
    const diff = Math.abs(priorityScore[this.priority] - priorityScore[otherAttributes.priority])
    score += Math.max(0, 5 - diff * 2)
    
    // パフォーマンス類似性
    maxScore += 5
    if (this.performance === otherAttributes.performance) {
      score += 5
    }
    
    return maxScore > 0 ? score / maxScore : 0
  }
  
  /**
   * 検索クエリとのマッチング
   */
  matchesSearch(query) {
    if (!query || typeof query !== 'string') return true
    
    const searchText = query.toLowerCase()
    const searchTargets = [
      this.category.toLowerCase(),
      ...this.tags.map(tag => tag.toLowerCase()),
      this.metadata.description.toLowerCase(),
      ...this.metadata.keywords.map(keyword => keyword.toLowerCase()),
      this.author.toLowerCase()
    ]
    
    return searchTargets.some(target => target.includes(searchText))
  }
  
  /**
   * フィルター条件とのマッチング
   */
  matchesFilter(filterCriteria) {
    // カテゴリフィルター
    if (filterCriteria.category && this.category !== filterCriteria.category) {
      return false
    }
    
    // タグフィルター（AND条件）
    if (filterCriteria.tags && filterCriteria.tags.length > 0) {
      const hasAllTags = filterCriteria.tags.every(tag => this.tags.includes(tag))
      if (!hasAllTags) return false
    }
    
    // 優先度フィルター
    if (filterCriteria.priority && this.priority !== filterCriteria.priority) {
      return false
    }
    
    // 非表示フィルター
    if (filterCriteria.showHidden === false && this.isHidden) {
      return false
    }
    
    // 実験的フィルター
    if (filterCriteria.showExperimental === false && this.isExperimental) {
      return false
    }
    
    // パフォーマンスフィルター
    if (filterCriteria.performance && this.performance !== filterCriteria.performance) {
      return false
    }
    
    // 複雑度フィルター
    if (filterCriteria.complexity && this.complexity !== filterCriteria.complexity) {
      return false
    }
    
    // 作成者フィルター
    if (filterCriteria.author && this.author !== filterCriteria.author) {
      return false
    }
    
    return true
  }
  
  /**
   * JSON形式でのエクスポート
   */
  toJSON() {
    return {
      category: this.category,
      tags: [...this.tags],
      priority: this.priority,
      group: this.group,
      isHidden: this.isHidden,
      isExperimental: this.isExperimental,
      author: this.author,
      license: this.license,
      version: this.version,
      dependencies: [...this.dependencies],
      performance: this.performance,
      complexity: this.complexity,
      compatibility: [...this.compatibility],
      usage: { ...this.usage },
      visual: { ...this.visual },
      layout: { ...this.layout },
      metadata: { ...this.metadata }
    }
  }
  
  /**
   * JSONからの復元
   */
  static fromJSON(json) {
    return new PluginAttributes(json)
  }
  
  /**
   * 属性の更新
   */
  update(newAttributes) {
    Object.assign(this, new PluginAttributes({
      ...this.toJSON(),
      ...newAttributes,
      metadata: {
        ...this.metadata,
        ...newAttributes.metadata,
        modified: Date.now()
      }
    }))
    
    return this
  }
  
  /**
   * 使用統計の更新
   */
  updateUsageStats(executionTime = 0) {
    this.usage.frequency++
    this.usage.lastUsed = Date.now()
    this.usage.totalExecutions++
    
    // 平均実行時間の更新
    if (executionTime > 0) {
      const totalTime = this.usage.averageExecutionTime * (this.usage.totalExecutions - 1) + executionTime
      this.usage.averageExecutionTime = totalTime / this.usage.totalExecutions
    }
    
    this.metadata.modified = Date.now()
  }
}

/**
 * カテゴリ別のデフォルトタグ
 */
export const CategoryDefaultTags = {
  [PluginAttributeTypes.CATEGORIES.UI]: ['interface', 'visual', 'interactive'],
  [PluginAttributeTypes.CATEGORIES.LOGIC]: ['processing', 'algorithm', 'computation'],
  [PluginAttributeTypes.CATEGORIES.DATA]: ['data', 'transform', 'analysis'],
  [PluginAttributeTypes.CATEGORIES.AI]: ['ai', 'ml', 'neural', 'intelligent'],
  [PluginAttributeTypes.CATEGORIES.INPUT]: ['input', 'sensor', 'device'],
  [PluginAttributeTypes.CATEGORIES.VISUALIZATION]: ['chart', 'graph', 'visual', 'display'],
  [PluginAttributeTypes.CATEGORIES.MEDIA]: ['audio', 'video', 'image', 'media'],
  [PluginAttributeTypes.CATEGORIES.NETWORK]: ['network', 'api', 'http', 'communication'],
  [PluginAttributeTypes.CATEGORIES.UTILITY]: ['utility', 'tool', 'helper'],
  [PluginAttributeTypes.CATEGORIES.GAME]: ['game', 'interactive', 'entertainment'],
  [PluginAttributeTypes.CATEGORIES.SYSTEM]: ['system', 'internal', 'core']
}

/**
 * 属性ヘルパー関数
 */
export const AttributeHelpers = {
  /**
   * カテゴリに応じたデフォルト属性生成
   */
  createDefaultForCategory(category) {
    const defaultTags = CategoryDefaultTags[category] || []
    const defaultIcon = {
      [PluginAttributeTypes.CATEGORIES.UI]: '🎨',
      [PluginAttributeTypes.CATEGORIES.LOGIC]: '🧠',
      [PluginAttributeTypes.CATEGORIES.DATA]: '📊',
      [PluginAttributeTypes.CATEGORIES.AI]: '🤖',
      [PluginAttributeTypes.CATEGORIES.INPUT]: '🎮',
      [PluginAttributeTypes.CATEGORIES.VISUALIZATION]: '📈',
      [PluginAttributeTypes.CATEGORIES.MEDIA]: '🎵',
      [PluginAttributeTypes.CATEGORIES.NETWORK]: '🌐',
      [PluginAttributeTypes.CATEGORIES.UTILITY]: '🔧',
      [PluginAttributeTypes.CATEGORIES.GAME]: '🎯',
      [PluginAttributeTypes.CATEGORIES.SYSTEM]: '⚙️'
    }[category] || '🔧'
    
    return new PluginAttributes({
      category: category,
      tags: defaultTags,
      visual: {
        icon: defaultIcon
      }
    })
  },
  
  /**
   * 全カテゴリの統計取得
   */
  getCategoryStats(plugins) {
    const stats = {}
    Object.values(PluginAttributeTypes.CATEGORIES).forEach(category => {
      stats[category] = {
        count: 0,
        hidden: 0,
        experimental: 0
      }
    })
    
    plugins.forEach(plugin => {
      if (plugin.attributes) {
        const category = plugin.attributes.category
        if (stats[category]) {
          stats[category].count++
          if (plugin.attributes.isHidden) stats[category].hidden++
          if (plugin.attributes.isExperimental) stats[category].experimental++
        }
      }
    })
    
    return stats
  },
  
  /**
   * タグクラウド用データ生成
   */
  generateTagCloud(plugins) {
    const tagCounts = new Map()
    
    plugins.forEach(plugin => {
      if (plugin.attributes && plugin.attributes.tags) {
        plugin.attributes.tags.forEach(tag => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
        })
      }
    })
    
    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
  }
}

console.log('🏷️ PluginAttributes system loaded!')