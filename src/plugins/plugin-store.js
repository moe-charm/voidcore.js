// src/plugin-store.js - Phase S4: 状態管理分離
// プラグイン状態管理の専用クラス

export class PluginStore {
  constructor(maxDepth = 10) {
    this.plugins = []
    this.pendingRequests = new Map() // correlationId -> Promise resolver
    this.maxDepth = maxDepth
    this.resourceCost = new Map() // coreId -> resource consumption
  }

  // プラグイン操作
  addPlugin(plugin) {
    this.plugins.push(plugin)
  }

  removePlugin(pluginId) {
    const index = this.plugins.findIndex(p => p.pluginId === pluginId)
    return index !== -1 ? this.plugins.splice(index, 1)[0] : null
  }

  getPlugin(pluginId) {
    return this.plugins.find(p => p.pluginId === pluginId)
  }

  getAllPlugins() {
    return [...this.plugins]
  }

  getPluginCount() {
    return this.plugins.length
  }

  // 階層管理
  getChildren(pluginId) {
    return this.plugins.filter(plugin => plugin.parentId === pluginId)
  }

  getParent(pluginId) {
    const plugin = this.getPlugin(pluginId)
    return plugin?.parentId ? this.getPlugin(plugin.parentId) : null
  }

  // リクエスト管理
  addPendingRequest(correlationId, resolver) {
    this.pendingRequests.set(correlationId, resolver)
  }

  resolvePendingRequest(correlationId, result) {
    const resolver = this.pendingRequests.get(correlationId)
    if (resolver) {
      this.pendingRequests.delete(correlationId)
      resolver(result)
      return true
    }
    return false
  }

  // リソース管理
  allocateResource(coreId, cost) {
    const currentCost = this.resourceCost.get(coreId) || 0
    this.resourceCost.set(coreId, currentCost + cost)
  }

  releaseResource(coreId, cost) {
    const currentCost = this.resourceCost.get(coreId) || 0
    this.resourceCost.set(coreId, Math.max(0, currentCost - cost))
  }

  getResourceUsage(coreId) {
    return this.resourceCost.get(coreId) || 0
  }

  // バリデーション
  hasValidParent(plugin) {
    return !plugin.parentId || this.getPlugin(plugin.parentId) !== undefined
  }

  wouldCreateCircularReference(pluginId, newParentId) {
    if (!newParentId || pluginId === newParentId) return pluginId === newParentId
    
    const descendants = this.getDescendants(pluginId)
    return descendants.some(plugin => plugin.pluginId === newParentId)
  }

  getDescendants(pluginId) {
    const descendants = []
    const queue = [...this.getChildren(pluginId)]
    
    while (queue.length > 0) {
      const current = queue.shift()
      descendants.push(current)
      queue.push(...this.getChildren(current.pluginId))
    }
    
    return descendants
  }

  // 統計情報
  getStats() {
    return {
      pluginCount: this.plugins.length,
      pendingRequests: this.pendingRequests.size,
      resourceAllocations: this.resourceCost.size,
      maxDepth: this.maxDepth
    }
  }

  // クリア操作
  clear() {
    this.plugins = []
    this.pendingRequests.clear()
    this.resourceCost.clear()
  }
}