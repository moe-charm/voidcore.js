// core/hierarchy-manager.js - 階層管理コアモジュール
// VoidCore v14.0 コア分割: プラグイン階層構造管理の専門化

/**
 * 🌳 HierarchyManager - 階層管理専門モジュール
 * 
 * VoidCore v14.0の階層構造管理を担当する分離されたコアモジュール
 * 暫定実装から本格実装への移行
 * 
 * 哲学: 「階層構造の整合性と効率性の保証」
 */
export class HierarchyManager {
  constructor(config = {}) {
    this.coreId = config.coreId || 'core-hierarchy-manager';
    this.resourceManager = config.resourceManager || null;
    this.pluginManager = config.pluginManager || null;
    
    // 階層構造管理
    this.hierarchy = new Map(); // parentId -> Set<childId>
    this.parentMap = new Map(); // childId -> parentId
    this.rootPlugins = new Set(); // 親を持たないプラグイン
    this.pluginDepths = new Map(); // pluginId -> depth
    
    // 階層制約
    this.maxDepth = config.maxDepth || 10;
    this.maxChildren = config.maxChildren || 100;
    this.maxSiblings = config.maxSiblings || 50;
    
    // 階層統計
    this.stats = {
      totalNodes: 0,
      totalRelations: 0,
      maxDepthReached: 0,
      averageDepth: 0,
      rootCount: 0,
      leafCount: 0,
      cyclicChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      totalHierarchyTime: 0,
      startTime: Date.now()
    };
    
    // 階層操作履歴（最新50件）
    this.operationHistory = [];
    this.maxHistorySize = 50;
    
    // 階層バリデーション
    this.validationRules = new Map();
    this.cyclicReferenceCache = new Map(); // 循環参照チェックキャッシュ
    
    // 階層変更イベント
    this.eventHandlers = new Map();
    
    this.log('🌳 HierarchyManager initialized');
  }

  /**
   * 子プラグイン追加
   * @param {string} parentId - 親プラグインID
   * @param {string} childId - 子プラグインID
   * @returns {Promise<boolean>} 追加成功フラグ
   */
  async addChild(parentId, childId) {
    const startTime = Date.now();
    
    try {
      // バリデーション
      await this.validateAddChild(parentId, childId);
      
      // 階層に追加
      this.addToHierarchy(parentId, childId);
      
      // 深度更新
      await this.updateDepths(childId);
      
      // 統計更新
      this.updateAddStats(parentId, childId, Date.now() - startTime);
      
      // 履歴記録
      this.recordOperation('addChild', { parentId, childId }, Date.now() - startTime);
      
      // イベント発火
      await this.emitEvent('childAdded', { parentId, childId });
      
      this.log(`✅ Child added: ${childId} -> ${parentId}`);
      
      return true;
      
    } catch (error) {
      this.log(`❌ Add child failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * 子プラグイン削除
   * @param {string} parentId - 親プラグインID
   * @param {string} childId - 子プラグインID
   * @returns {Promise<boolean>} 削除成功フラグ
   */
  async removeChild(parentId, childId) {
    const startTime = Date.now();
    
    try {
      // 存在チェック
      if (!this.hasChild(parentId, childId)) {
        throw new Error(`Child relationship not found: ${parentId} -> ${childId}`);
      }
      
      // 階層から削除
      this.removeFromHierarchy(parentId, childId);
      
      // 深度更新
      await this.updateDepths(childId);
      
      // 統計更新
      this.updateRemoveStats(parentId, childId, Date.now() - startTime);
      
      // 履歴記録
      this.recordOperation('removeChild', { parentId, childId }, Date.now() - startTime);
      
      // イベント発火
      await this.emitEvent('childRemoved', { parentId, childId });
      
      this.log(`✅ Child removed: ${childId} from ${parentId}`);
      
      return true;
      
    } catch (error) {
      this.log(`❌ Remove child failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * プラグイン親子関係変更
   * @param {string} childId - 子プラグインID
   * @param {string} newParentId - 新親プラグインID
   * @param {string} oldParentId - 旧親プラグインID
   * @returns {Promise<boolean>} 変更成功フラグ
   */
  async reparentPlugin(childId, newParentId, oldParentId) {
    const startTime = Date.now();
    
    try {
      // バリデーション
      await this.validateReparenting(childId, newParentId, oldParentId);
      
      // 旧親から削除
      if (oldParentId) {
        this.removeFromHierarchy(oldParentId, childId);
      } else {
        this.rootPlugins.delete(childId);
      }
      
      // 新親に追加
      if (newParentId) {
        this.addToHierarchy(newParentId, childId);
      } else {
        this.rootPlugins.add(childId);
        this.parentMap.delete(childId);
      }
      
      // 深度更新
      await this.updateDepths(childId);
      
      // 統計更新
      this.updateReparentStats(childId, newParentId, oldParentId, Date.now() - startTime);
      
      // 履歴記録
      this.recordOperation('reparent', { childId, newParentId, oldParentId }, Date.now() - startTime);
      
      // イベント発火
      await this.emitEvent('pluginReparented', { childId, newParentId, oldParentId });
      
      this.log(`✅ Plugin reparented: ${childId} ${oldParentId} -> ${newParentId}`);
      
      return true;
      
    } catch (error) {
      this.log(`❌ Reparenting failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * 子プラグイン取得
   * @param {string} parentId - 親プラグインID
   * @returns {Array} 子プラグインID配列
   */
  getChildren(parentId) {
    const children = this.hierarchy.get(parentId);
    return children ? Array.from(children) : [];
  }

  /**
   * 親プラグイン取得
   * @param {string} childId - 子プラグインID
   * @returns {string|null} 親プラグインID
   */
  getParent(childId) {
    return this.parentMap.get(childId) || null;
  }

  /**
   * 階層深度取得
   * @param {string} pluginId - プラグインID
   * @returns {number} 階層深度
   */
  getDepth(pluginId) {
    return this.pluginDepths.get(pluginId) || 0;
  }

  /**
   * 子孫プラグイン取得（再帰）
   * @param {string} parentId - 親プラグインID
   * @param {boolean} includeSelf - 自分自身を含むかどうか
   * @returns {Array} 子孫プラグインID配列
   */
  getDescendants(parentId, includeSelf = false) {
    const descendants = [];
    
    if (includeSelf) {
      descendants.push(parentId);
    }
    
    const children = this.getChildren(parentId);
    for (const childId of children) {
      descendants.push(childId);
      descendants.push(...this.getDescendants(childId, false));
    }
    
    return descendants;
  }

  /**
   * 祖先プラグイン取得（再帰）
   * @param {string} childId - 子プラグインID
   * @param {boolean} includeSelf - 自分自身を含むかどうか
   * @returns {Array} 祖先プラグインID配列
   */
  getAncestors(childId, includeSelf = false) {
    const ancestors = [];
    
    if (includeSelf) {
      ancestors.push(childId);
    }
    
    const parentId = this.getParent(childId);
    if (parentId) {
      ancestors.push(parentId);
      ancestors.push(...this.getAncestors(parentId, false));
    }
    
    return ancestors;
  }

  /**
   * ルートプラグイン取得
   * @returns {Array} ルートプラグインID配列
   */
  getRootPlugins() {
    return Array.from(this.rootPlugins);
  }

  /**
   * リーフプラグイン取得
   * @returns {Array} リーフプラグインID配列
   */
  getLeafPlugins() {
    const leafPlugins = [];
    
    for (const [pluginId, children] of this.hierarchy) {
      if (children.size === 0) {
        leafPlugins.push(pluginId);
      }
    }
    
    // 階層に登録されていないプラグインもリーフとして扱う
    for (const pluginId of this.rootPlugins) {
      if (!this.hierarchy.has(pluginId)) {
        leafPlugins.push(pluginId);
      }
    }
    
    return leafPlugins;
  }

  // ==========================================
  // 🔍 階層バリデーション
  // ==========================================

  /**
   * 子追加バリデーション
   * @param {string} parentId - 親プラグインID
   * @param {string} childId - 子プラグインID
   * @returns {Promise<boolean>} バリデーション結果
   */
  async validateAddChild(parentId, childId) {
    // 基本チェック
    if (!parentId || !childId) {
      throw new Error('Parent ID and Child ID are required');
    }
    
    if (parentId === childId) {
      throw new Error('Cannot add self as child');
    }
    
    // 既存関係チェック
    if (this.hasChild(parentId, childId)) {
      throw new Error(`Child relationship already exists: ${parentId} -> ${childId}`);
    }
    
    // 循環参照チェック
    if (await this.wouldCreateCycle(parentId, childId)) {
      throw new Error(`Adding child would create circular reference: ${parentId} -> ${childId}`);
    }
    
    // 深度制限チェック
    const newDepth = this.getDepth(parentId) + 1;
    if (newDepth > this.maxDepth) {
      throw new Error(`Maximum depth exceeded: ${newDepth} > ${this.maxDepth}`);
    }
    
    // 子数制限チェック
    const currentChildCount = this.getChildren(parentId).length;
    if (currentChildCount >= this.maxChildren) {
      throw new Error(`Maximum children exceeded: ${currentChildCount} >= ${this.maxChildren}`);
    }
    
    // カスタムバリデーション
    await this.runCustomValidation('addChild', { parentId, childId });
    
    return true;
  }

  /**
   * 親子関係変更バリデーション
   * @param {string} childId - 子プラグインID
   * @param {string} newParentId - 新親プラグインID
   * @param {string} oldParentId - 旧親プラグインID
   * @returns {Promise<Object>} バリデーション結果
   */
  async validateReparenting(childId, newParentId, oldParentId) {
    // 基本チェック
    if (!childId) {
      throw new Error('Child ID is required');
    }
    
    if (newParentId === childId) {
      throw new Error('Cannot set self as parent');
    }
    
    // 既存関係チェック
    if (oldParentId && !this.hasChild(oldParentId, childId)) {
      throw new Error(`Child relationship not found: ${oldParentId} -> ${childId}`);
    }
    
    // 新親への循環参照チェック
    if (newParentId && await this.wouldCreateCycle(newParentId, childId)) {
      throw new Error(`Reparenting would create circular reference: ${newParentId} -> ${childId}`);
    }
    
    // 深度制限チェック
    if (newParentId) {
      const newDepth = this.getDepth(newParentId) + 1;
      if (newDepth > this.maxDepth) {
        throw new Error(`Maximum depth exceeded: ${newDepth} > ${this.maxDepth}`);
      }
    }
    
    // カスタムバリデーション
    await this.runCustomValidation('reparent', { childId, newParentId, oldParentId });
    
    return { valid: true };
  }

  /**
   * 階層整合性チェック
   * @returns {Promise<Object>} チェック結果
   */
  async validateHierarchy() {
    const startTime = Date.now();
    const issues = [];
    
    try {
      // 循環参照チェック
      const cycles = await this.detectCycles();
      if (cycles.length > 0) {
        issues.push({
          type: 'circular_reference',
          description: 'Circular references detected',
          details: cycles
        });
      }
      
      // 孤立ノードチェック
      const orphans = this.detectOrphans();
      if (orphans.length > 0) {
        issues.push({
          type: 'orphaned_nodes',
          description: 'Orphaned nodes detected',
          details: orphans
        });
      }
      
      // 深度制限チェック
      const depthViolations = this.detectDepthViolations();
      if (depthViolations.length > 0) {
        issues.push({
          type: 'depth_violations',
          description: 'Depth limit violations detected',
          details: depthViolations
        });
      }
      
      // 統計更新
      this.updateValidationStats(Date.now() - startTime, issues.length === 0);
      
      return {
        valid: issues.length === 0,
        issues: issues,
        validationTime: Date.now() - startTime
      };
      
    } catch (error) {
      this.updateValidationStats(Date.now() - startTime, false);
      throw error;
    }
  }

  /**
   * 循環参照チェック
   * @param {string} parentId - 親プラグインID
   * @param {string} childId - 子プラグインID
   * @returns {Promise<boolean>} 循環参照が発生するかどうか
   */
  async wouldCreateCycle(parentId, childId) {
    const cacheKey = `${parentId}-${childId}`;
    
    // キャッシュチェック
    if (this.cyclicReferenceCache.has(cacheKey)) {
      return this.cyclicReferenceCache.get(cacheKey);
    }
    
    // 子の祖先に親が含まれているかチェック
    const ancestors = this.getAncestors(childId, true);
    const wouldCycle = ancestors.includes(parentId);
    
    // キャッシュに保存
    this.cyclicReferenceCache.set(cacheKey, wouldCycle);
    
    // 統計更新
    this.stats.cyclicChecks++;
    if (wouldCycle) {
      this.stats.failedChecks++;
    } else {
      this.stats.successfulChecks++;
    }
    
    return wouldCycle;
  }

  /**
   * 循環参照検出
   * @returns {Promise<Array>} 検出された循環参照
   */
  async detectCycles() {
    const cycles = [];
    const visited = new Set();
    const recursionStack = new Set();
    
    const detectCycleFromNode = (nodeId, path = []) => {
      if (recursionStack.has(nodeId)) {
        const cycleStart = path.indexOf(nodeId);
        cycles.push(path.slice(cycleStart).concat(nodeId));
        return;
      }
      
      if (visited.has(nodeId)) {
        return;
      }
      
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);
      
      const children = this.getChildren(nodeId);
      for (const childId of children) {
        detectCycleFromNode(childId, [...path]);
      }
      
      recursionStack.delete(nodeId);
    };
    
    // 全ルートノードから検査
    for (const rootId of this.rootPlugins) {
      detectCycleFromNode(rootId);
    }
    
    return cycles;
  }

  /**
   * 孤立ノード検出
   * @returns {Array} 孤立ノードID配列
   */
  detectOrphans() {
    const orphans = [];
    
    // 階層に登録されているが親マップにないノード
    for (const [parentId, children] of this.hierarchy) {
      if (!this.parentMap.has(parentId) && !this.rootPlugins.has(parentId)) {
        orphans.push(parentId);
      }
    }
    
    return orphans;
  }

  /**
   * 深度制限違反検出
   * @returns {Array} 深度制限違反
   */
  detectDepthViolations() {
    const violations = [];
    
    for (const [pluginId, depth] of this.pluginDepths) {
      if (depth > this.maxDepth) {
        violations.push({
          pluginId: pluginId,
          depth: depth,
          maxDepth: this.maxDepth
        });
      }
    }
    
    return violations;
  }

  // ==========================================
  // 🔧 内部ヘルパーメソッド
  // ==========================================

  /**
   * 階層に追加
   * @param {string} parentId - 親プラグインID
   * @param {string} childId - 子プラグインID
   */
  addToHierarchy(parentId, childId) {
    // 親の子リストに追加
    if (!this.hierarchy.has(parentId)) {
      this.hierarchy.set(parentId, new Set());
    }
    this.hierarchy.get(parentId).add(childId);
    
    // 子の親マップに追加
    this.parentMap.set(childId, parentId);
    
    // ルートから削除（親が付いたため）
    this.rootPlugins.delete(childId);
    
    // 統計更新
    this.stats.totalRelations++;
  }

  /**
   * 階層から削除
   * @param {string} parentId - 親プラグインID
   * @param {string} childId - 子プラグインID
   */
  removeFromHierarchy(parentId, childId) {
    // 親の子リストから削除
    if (this.hierarchy.has(parentId)) {
      this.hierarchy.get(parentId).delete(childId);
      
      // 子がいなくなったら親もクリーンアップ
      if (this.hierarchy.get(parentId).size === 0) {
        this.hierarchy.delete(parentId);
      }
    }
    
    // 子の親マップから削除
    this.parentMap.delete(childId);
    
    // ルートに追加（親がいなくなったため）
    this.rootPlugins.add(childId);
    
    // 統計更新
    this.stats.totalRelations--;
  }

  /**
   * 深度更新
   * @param {string} pluginId - プラグインID
   * @returns {Promise<void>}
   */
  async updateDepths(pluginId) {
    const visited = new Set();
    
    const updateDepth = (nodeId, currentDepth = 0) => {
      if (visited.has(nodeId)) {
        return; // 循環参照防止
      }
      
      visited.add(nodeId);
      
      // 深度更新
      this.pluginDepths.set(nodeId, currentDepth);
      
      // 統計更新
      if (currentDepth > this.stats.maxDepthReached) {
        this.stats.maxDepthReached = currentDepth;
      }
      
      // 子ノードの深度更新
      const children = this.getChildren(nodeId);
      for (const childId of children) {
        updateDepth(childId, currentDepth + 1);
      }
    };
    
    // プラグインの深度を計算
    const ancestors = this.getAncestors(pluginId, true);
    const rootAncestor = ancestors[ancestors.length - 1];
    
    if (this.rootPlugins.has(rootAncestor)) {
      updateDepth(rootAncestor, 0);
    }
  }

  /**
   * 子関係チェック
   * @param {string} parentId - 親プラグインID
   * @param {string} childId - 子プラグインID
   * @returns {boolean} 子関係の有無
   */
  hasChild(parentId, childId) {
    const children = this.hierarchy.get(parentId);
    return children ? children.has(childId) : false;
  }

  /**
   * 依存関係チェック
   * @param {string} pluginId - プラグインID
   * @returns {Object} 依存関係情報
   */
  checkDependencies(pluginId) {
    const children = this.getChildren(pluginId);
    
    return {
      hasChilden: children.length > 0,
      childrenIds: children,
      childrenCount: children.length
    };
  }

  // ==========================================
  // 📊 統計・情報取得
  // ==========================================

  /**
   * 階層統計取得
   * @returns {Object} 階層統計
   */
  getStats() {
    const runtime = Date.now() - this.stats.startTime;
    const totalNodes = this.hierarchy.size + this.rootPlugins.size;
    
    // 平均深度計算
    let totalDepth = 0;
    for (const depth of this.pluginDepths.values()) {
      totalDepth += depth;
    }
    const averageDepth = totalNodes > 0 ? totalDepth / totalNodes : 0;
    
    return {
      ...this.stats,
      runtime: runtime,
      totalNodes: totalNodes,
      averageDepth: averageDepth,
      rootCount: this.rootPlugins.size,
      leafCount: this.getLeafPlugins().length,
      cyclicCheckRate: this.stats.cyclicChecks / (runtime / 1000),
      validationSuccessRate: this.stats.cyclicChecks > 0 ? 
        this.stats.successfulChecks / this.stats.cyclicChecks : 0
    };
  }

  /**
   * 階層情報取得
   * @returns {Object} 階層情報
   */
  getHierarchy() {
    const hierarchyData = {
      roots: Array.from(this.rootPlugins),
      relationships: {},
      depths: Object.fromEntries(this.pluginDepths),
      stats: this.getStats()
    };
    
    // 関係マップを構築
    for (const [parentId, children] of this.hierarchy) {
      hierarchyData.relationships[parentId] = Array.from(children);
    }
    
    return hierarchyData;
  }

  /**
   * 操作履歴取得
   * @param {number} limit - 取得件数制限
   * @returns {Array} 操作履歴
   */
  getOperationHistory(limit = 10) {
    return this.operationHistory.slice(-limit);
  }

  // ==========================================
  // 🔧 統計・履歴更新
  // ==========================================

  /**
   * 追加統計更新
   * @param {string} parentId - 親プラグインID
   * @param {string} childId - 子プラグインID
   * @param {number} operationTime - 操作時間
   */
  updateAddStats(parentId, childId, operationTime) {
    this.stats.totalHierarchyTime += operationTime;
  }

  /**
   * 削除統計更新
   * @param {string} parentId - 親プラグインID
   * @param {string} childId - 子プラグインID
   * @param {number} operationTime - 操作時間
   */
  updateRemoveStats(parentId, childId, operationTime) {
    this.stats.totalHierarchyTime += operationTime;
  }

  /**
   * 親子関係変更統計更新
   * @param {string} childId - 子プラグインID
   * @param {string} newParentId - 新親プラグインID
   * @param {string} oldParentId - 旧親プラグインID
   * @param {number} operationTime - 操作時間
   */
  updateReparentStats(childId, newParentId, oldParentId, operationTime) {
    this.stats.totalHierarchyTime += operationTime;
  }

  /**
   * バリデーション統計更新
   * @param {number} validationTime - バリデーション時間
   * @param {boolean} success - 成功フラグ
   */
  updateValidationStats(validationTime, success) {
    this.stats.totalHierarchyTime += validationTime;
    
    if (success) {
      this.stats.successfulChecks++;
    } else {
      this.stats.failedChecks++;
    }
  }

  /**
   * 操作履歴記録
   * @param {string} operation - 操作名
   * @param {Object} payload - ペイロード
   * @param {number} executionTime - 実行時間
   */
  recordOperation(operation, payload, executionTime) {
    const record = {
      timestamp: Date.now(),
      operation: operation,
      payload: payload,
      executionTime: executionTime
    };
    
    this.operationHistory.push(record);
    
    // 履歴サイズ制限
    if (this.operationHistory.length > this.maxHistorySize) {
      this.operationHistory.shift();
    }
  }

  // ==========================================
  // 📡 イベント・バリデーション管理
  // ==========================================

  /**
   * イベントハンドラー登録
   * @param {string} eventName - イベント名
   * @param {Function} handler - ハンドラー関数
   */
  on(eventName, handler) {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, new Set());
    }
    this.eventHandlers.get(eventName).add(handler);
  }

  /**
   * イベント発火
   * @param {string} eventName - イベント名
   * @param {Object} eventData - イベントデータ
   */
  async emitEvent(eventName, eventData) {
    const handlers = this.eventHandlers.get(eventName);
    if (!handlers) return;
    
    for (const handler of handlers) {
      try {
        await handler(eventData);
      } catch (error) {
        this.log(`❌ Event handler error: ${error.message}`);
      }
    }
  }

  /**
   * カスタムバリデーション追加
   * @param {string} operation - 操作名
   * @param {Function} validator - バリデーター関数
   */
  addValidationRule(operation, validator) {
    if (!this.validationRules.has(operation)) {
      this.validationRules.set(operation, new Set());
    }
    this.validationRules.get(operation).add(validator);
  }

  /**
   * カスタムバリデーション実行
   * @param {string} operation - 操作名
   * @param {Object} data - バリデーションデータ
   * @returns {Promise<boolean>} バリデーション結果
   */
  async runCustomValidation(operation, data) {
    const validators = this.validationRules.get(operation);
    if (!validators) return true;
    
    for (const validator of validators) {
      const result = await validator(data);
      if (!result) {
        throw new Error(`Custom validation failed for operation: ${operation}`);
      }
    }
    
    return true;
  }

  /**
   * モジュール連携設定
   * @param {Object} managers - 各種マネージャー
   */
  setManagers(managers) {
    if (managers.resourceManager) {
      this.resourceManager = managers.resourceManager;
      this.log('🔧 ResourceManager connected');
    }
    
    if (managers.pluginManager) {
      this.pluginManager = managers.pluginManager;
      this.log('🔧 PluginManager connected');
    }
  }

  /**
   * ログ出力
   * @param {string} message - ログメッセージ
   */
  log(message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] 🌳 HierarchyManager: ${message}`);
  }
}

/**
 * HierarchyManager ファクトリー
 * @param {Object} config - 設定
 * @returns {HierarchyManager} HierarchyManager インスタンス
 */
export function createHierarchyManager(config = {}) {
  return new HierarchyManager(config);
}

// デフォルトエクスポート
export default HierarchyManager;