// element-manager.js - DOM要素管理機能
// VoidCoreUI から分離された DOM要素とプラグイン管理専用クラス

/**
 * 📦 ElementManager - DOM要素とUIプラグインの管理
 * 
 * 責任:
 * - DOM要素の生成・登録・削除
 * - UIプラグインインスタンスの管理
 * - 要素とプラグインの関連付け
 * - 安全な要素アクセス
 * - 要素の検索・フィルタリング
 * - 要素統計情報の提供
 */
export class ElementManager {
  constructor(voidCoreUI) {
    this.voidCoreUI = voidCoreUI
    this.uiElements = new Map() // elementId → DOM element
    this.uiPlugins = new Map()  // pluginId → UI plugin instance
    this.elementTypes = new Map() // elementId → nodeType
  }

  /**
   * 📦 要素を登録
   */
  registerElement(elementId, domElement, nodeType = null) {
    const safeElementId = String(elementId)
    this.uiElements.set(safeElementId, domElement)
    
    if (nodeType) {
      this.elementTypes.set(safeElementId, nodeType)
    }
    
    this.voidCoreUI.log(`📦 Element registered: ${safeElementId}`)
    return safeElementId
  }

  /**
   * 📦 プラグインを登録
   */
  registerPlugin(pluginId, pluginInstance) {
    const safePluginId = String(pluginId)
    this.uiPlugins.set(safePluginId, pluginInstance)
    
    this.voidCoreUI.log(`🧩 Plugin registered: ${safePluginId}`)
    return safePluginId
  }

  /**
   * 🔍 要素を取得
   */
  getElement(elementId) {
    const safeElementId = String(elementId)
    return this.uiElements.get(safeElementId)
  }

  /**
   * 🔍 プラグインを取得
   */
  getPlugin(pluginId) {
    const safePluginId = String(pluginId)
    return this.uiPlugins.get(safePluginId)
  }

  /**
   * ✅ 要素の存在確認
   */
  hasElement(elementId) {
    const safeElementId = String(elementId)
    return this.uiElements.has(safeElementId)
  }

  /**
   * ✅ プラグインの存在確認
   */
  hasPlugin(pluginId) {
    const safePluginId = String(pluginId)
    return this.uiPlugins.has(safePluginId)
  }

  /**
   * 🗑️ 要素を削除
   */
  removeElement(elementId) {
    const safeElementId = String(elementId)
    const element = this.uiElements.get(safeElementId)
    
    if (element) {
      // DOM から削除
      if (element.parentNode) {
        element.parentNode.removeChild(element)
      }
      
      this.uiElements.delete(safeElementId)
      this.elementTypes.delete(safeElementId)
      
      this.voidCoreUI.log(`🗑️ Element removed: ${safeElementId}`)
      return true
    }
    
    return false
  }

  /**
   * 🗑️ プラグインを削除
   */
  removePlugin(pluginId) {
    const safePluginId = String(pluginId)
    const removed = this.uiPlugins.delete(safePluginId)
    
    if (removed) {
      this.voidCoreUI.log(`🗑️ Plugin removed: ${safePluginId}`)
    }
    
    return removed
  }

  /**
   * 🧹 全要素をクリア
   */
  clearAllElements() {
    this.uiElements.forEach((element, elementId) => {
      if (element.parentNode) {
        element.parentNode.removeChild(element)
      }
    })
    
    this.uiElements.clear()
    this.elementTypes.clear()
    this.voidCoreUI.log(`🧹 All elements cleared`)
  }

  /**
   * 🧹 全プラグインをクリア
   */
  clearAllPlugins() {
    this.uiPlugins.clear()
    this.voidCoreUI.log(`🧹 All plugins cleared`)
  }

  /**
   * 📋 要素ID一覧取得
   */
  getElementIds() {
    return Array.from(this.uiElements.keys())
  }

  /**
   * 📋 プラグインID一覧取得
   */
  getPluginIds() {
    return Array.from(this.uiPlugins.keys())
  }

  /**
   * 🔍 タイプ別要素検索
   */
  getElementsByType(nodeType) {
    const elements = []
    this.elementTypes.forEach((type, elementId) => {
      if (type === nodeType) {
        elements.push({
          elementId,
          element: this.uiElements.get(elementId),
          type
        })
      }
    })
    return elements
  }

  /**
   * 🔍 タイプ別プラグイン検索
   */
  getPluginsByType(nodeType) {
    const plugins = []
    this.elementTypes.forEach((type, elementId) => {
      if (type === nodeType) {
        const plugin = this.uiPlugins.get(elementId)
        if (plugin) {
          plugins.push({
            pluginId: elementId,
            plugin,
            type
          })
        }
      }
    })
    return plugins
  }

  /**
   * 📊 要素統計取得
   */
  getElementStats() {
    const typeStats = new Map()
    this.elementTypes.forEach((type) => {
      typeStats.set(type, (typeStats.get(type) || 0) + 1)
    })

    return {
      totalElements: this.uiElements.size,
      totalPlugins: this.uiPlugins.size,
      typeBreakdown: Object.fromEntries(typeStats),
      elementIds: this.getElementIds(),
      pluginIds: this.getPluginIds()
    }
  }

  /**
   * 🔍 デバッグ情報取得
   */
  getDebugInfo() {
    return {
      elementCount: this.uiElements.size,
      pluginCount: this.uiPlugins.size,
      elementIds: this.getElementIds(),
      pluginIds: this.getPluginIds(),
      typeMap: Object.fromEntries(this.elementTypes)
    }
  }

  /**
   * 📍 要素位置更新
   */
  updateElementPosition(elementId, x, y) {
    const element = this.getElement(elementId)
    if (element) {
      element.style.left = `${x}px`
      element.style.top = `${y}px`
      return true
    }
    return false
  }

  /**
   * 🎨 要素スタイル更新
   */
  updateElementStyle(elementId, styles) {
    const element = this.getElement(elementId)
    if (element) {
      Object.assign(element.style, styles)
      return true
    }
    return false
  }
}