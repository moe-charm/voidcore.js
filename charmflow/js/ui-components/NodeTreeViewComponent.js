/**
 * 🌳 NodeTreeViewComponent - ノードツリービュー
 * 
 * 🎯 CharmFlowノードの階層構造表示・管理
 * 🌟 BaseUIComponent継承による統一UI
 * 
 * Created: 2025-07-11 (Phase 2)
 * 
 * 🔥 革命的機能:
 * - ノード階層リアルタイム表示
 * - ドラッグ&ドロップで階層変更
 * - 折りたたみ/展開機能
 * - ノード検索・フィルタリング
 * - 接続関係の可視化
 * - 一括選択・操作
 * - JSONエクスポート/インポート
 */

import { BaseUIComponent } from './BaseUIComponent.js'
import { INTENT_TYPES } from '../intent-definitions.js'

/**
 * 🌳 NodeTreeViewComponent - ノードツリービュー
 */
export class NodeTreeViewComponent extends BaseUIComponent {
    constructor(pluginNode, options = {}) {
        super(pluginNode, {
            type: 'node-tree-view',
            position: { x: 50, y: 50 },
            size: { width: 350, height: 600 },
            minSize: { width: 250, height: 400 },
            maxSize: { width: 500, height: 900 },
            zIndex: 1700,
            ...options
        })
        
        // 🎯 ツリービュー固有状態
        this.nodes = new Map() // nodeId -> nodeData
        this.nodeTree = [] // ルートノード配列
        this.expandedNodes = new Set() // 展開されているノードID
        this.selectedNodes = new Set() // 選択されているノードID
        this.searchQuery = ''
        this.filterType = 'all'
        
        // 🎨 UI要素参照
        this.treeContainer = null
        this.searchInput = null
        this.filterSelect = null
        this.statsElement = null
        
        // ⚙️ ツリービュー設定
        this.treeConfig = {
            showConnections: options.showConnections !== false,
            showNodeTypes: options.showNodeTypes !== false,
            enableDragDrop: options.enableDragDrop !== false,
            enableMultiSelect: options.enableMultiSelect !== false,
            enableSearch: options.enableSearch !== false,
            autoExpand: options.autoExpand || false,
            indentSize: options.indentSize || 20
        }
        
        // 🎨 ノードタイプ別アイコン
        this.nodeIcons = {
            'button.send': '🔘',
            'input.text': '📝',
            'output.console': '📺',
            'string.uppercase': '🔠',
            'logic.condition': '🔀',
            'data.variable': '📦',
            'flow.start': '▶️',
            'flow.end': '⏹️',
            'default': '📦'
        }
        
        // 🎨 カラーマップ
        this.nodeColors = {
            'button': '#007acc',
            'input': '#28a745',
            'output': '#dc3545',
            'string': '#ffc107',
            'logic': '#6f42c1',
            'data': '#17a2b8',
            'flow': '#fd7e14',
            'default': '#6c757d'
        }
        
        // ドラッグ&ドロップ状態
        this.dragState = {
            isDragging: false,
            draggedNode: null,
            dropTarget: null,
            placeholder: null
        }
        
        this.log('NodeTreeViewComponent initialized', { 
            enableDragDrop: this.treeConfig.enableDragDrop,
            enableMultiSelect: this.treeConfig.enableMultiSelect 
        })
    }
    
    /**
     * 📡 Intent リスナー設定
     */
    setupIntentListeners() {
        super.setupIntentListeners()
        
        // ノード作成/削除監視
        this.addIntentListener(INTENT_TYPES.UI.ELEMENT.CREATE, (data) => {
            this.addNode({
                id: data.pluginId,
                type: data.nodeType,
                position: data.position,
                parent: null
            })
        })
        
        this.addIntentListener(INTENT_TYPES.UI.ELEMENT.DELETE, (data) => {
            this.removeNode(data.elementId)
        })
        
        // ノード更新監視
        this.addIntentListener(INTENT_TYPES.UI.ELEMENT.UPDATE, (data) => {
            this.updateNode(data.elementId, data.updates)
        })
        
        // 接続変更監視
        this.addIntentListener(INTENT_TYPES.UI.CONNECTION.COMPLETE, (data) => {
            this.updateConnection(data.sourceId, data.targetId, 'create')
        })
        
        this.addIntentListener(INTENT_TYPES.UI.CONNECTION.DELETE, (data) => {
            this.updateConnection(data.sourceId, data.targetId, 'delete')
        })
        
        // ツリー更新要求
        this.addIntentListener('charmflow.tree.refresh', () => {
            this.refreshTree()
        })
        
        // ノード検索要求
        this.addIntentListener('charmflow.tree.search', (data) => {
            this.searchNodes(data.query)
        })
    }
    
    /**
     * 🎨 DOM要素作成・描画
     */
    render() {
        const element = this.createBaseElement()
        element.className += ' node-tree-view-component'
        
        // 🎨 ツリービュースタイル
        element.style.cssText += `
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            font-size: 13px;
        `
        
        element.innerHTML = this.getTemplate()
        
        // 要素参照設定
        this.treeContainer = element.querySelector('.tree-container')
        this.searchInput = element.querySelector('.search-input')
        this.filterSelect = element.querySelector('.filter-select')
        this.statsElement = element.querySelector('.tree-stats')
        
        // イベント設定
        this.setupEventHandlers(element)
        
        // ドラッグ・リサイズ設定
        const header = element.querySelector('.tree-header')
        this.setupDragging(header)
        this.setupResizing()
        
        // 初期データ読み込み
        this.loadInitialData()
        
        return element
    }
    
    /**
     * 📄 HTMLテンプレート
     */
    getTemplate() {
        return `
            <div class="tree-header" style="
                background: linear-gradient(90deg, #007acc 0%, #005a9e 100%);
                padding: 10px 15px;
                border-radius: 8px 8px 0 0;
                cursor: grab;
                color: white;
            ">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <h3 style="margin: 0; font-size: 14px; font-weight: 600;">
                        🌳 Node Tree View
                    </h3>
                    <div class="header-controls" style="display: flex; gap: 5px;">
                        <button class="expand-all-btn" title="全て展開" style="
                            background: rgba(255,255,255,0.2);
                            border: none;
                            color: white;
                            padding: 4px 8px;
                            border-radius: 3px;
                            cursor: pointer;
                            font-size: 11px;
                        ">➕</button>
                        <button class="collapse-all-btn" title="全て折りたたむ" style="
                            background: rgba(255,255,255,0.2);
                            border: none;
                            color: white;
                            padding: 4px 8px;
                            border-radius: 3px;
                            cursor: pointer;
                            font-size: 11px;
                        ">➖</button>
                        <button class="refresh-btn" title="更新" style="
                            background: rgba(255,255,255,0.2);
                            border: none;
                            color: white;
                            padding: 4px 8px;
                            border-radius: 3px;
                            cursor: pointer;
                            font-size: 11px;
                        ">🔄</button>
                    </div>
                </div>
            </div>
            
            <div class="tree-toolbar" style="
                background: #ffffff;
                padding: 10px;
                border-bottom: 1px solid #dee2e6;
            ">
                <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                    <input type="text" class="search-input" placeholder="ノードを検索..." style="
                        flex: 1;
                        padding: 6px 10px;
                        border: 1px solid #ced4da;
                        border-radius: 4px;
                        font-size: 12px;
                    ">
                    <select class="filter-select" style="
                        padding: 6px 10px;
                        border: 1px solid #ced4da;
                        border-radius: 4px;
                        font-size: 12px;
                        background: white;
                    ">
                        <option value="all">全て表示</option>
                        <option value="button">ボタン</option>
                        <option value="input">入力</option>
                        <option value="output">出力</option>
                        <option value="logic">ロジック</option>
                        <option value="data">データ</option>
                    </select>
                </div>
                
                <div class="tree-actions" style="display: flex; gap: 5px;">
                    <button class="select-all-btn" style="
                        background: #e9ecef;
                        border: 1px solid #ced4da;
                        padding: 4px 8px;
                        border-radius: 3px;
                        cursor: pointer;
                        font-size: 11px;
                    ">全選択</button>
                    <button class="clear-selection-btn" style="
                        background: #e9ecef;
                        border: 1px solid #ced4da;
                        padding: 4px 8px;
                        border-radius: 3px;
                        cursor: pointer;
                        font-size: 11px;
                    ">選択解除</button>
                    <button class="export-btn" style="
                        background: #e9ecef;
                        border: 1px solid #ced4da;
                        padding: 4px 8px;
                        border-radius: 3px;
                        cursor: pointer;
                        font-size: 11px;
                    ">📥 Export</button>
                    <button class="import-btn" style="
                        background: #e9ecef;
                        border: 1px solid #ced4da;
                        padding: 4px 8px;
                        border-radius: 3px;
                        cursor: pointer;
                        font-size: 11px;
                    ">📤 Import</button>
                </div>
            </div>
            
            <div class="tree-container" style="
                flex: 1;
                overflow-y: auto;
                padding: 10px;
                background: #ffffff;
            ">
                <!-- ツリーノードがここに表示される -->
            </div>
            
            <div class="tree-stats" style="
                background: #f8f9fa;
                padding: 8px 12px;
                border-top: 1px solid #dee2e6;
                font-size: 11px;
                color: #6c757d;
                display: flex;
                justify-content: space-between;
                border-radius: 0 0 8px 8px;
            ">
                <span class="node-count">ノード: 0</span>
                <span class="connection-count">接続: 0</span>
                <span class="selected-count">選択: 0</span>
            </div>
        `
    }
    
    /**
     * 🎯 イベントハンドラー設定
     */
    setupEventHandlers(element) {
        // 検索
        this.addEventListener(this.searchInput, 'input', (e) => {
            this.searchQuery = e.target.value.toLowerCase()
            this.renderTree()
        })
        
        // フィルター
        this.addEventListener(this.filterSelect, 'change', (e) => {
            this.filterType = e.target.value
            this.renderTree()
        })
        
        // 全て展開/折りたたむ
        const expandAllBtn = element.querySelector('.expand-all-btn')
        this.addEventListener(expandAllBtn, 'click', () => {
            this.expandAll()
        })
        
        const collapseAllBtn = element.querySelector('.collapse-all-btn')
        this.addEventListener(collapseAllBtn, 'click', () => {
            this.collapseAll()
        })
        
        // 更新
        const refreshBtn = element.querySelector('.refresh-btn')
        this.addEventListener(refreshBtn, 'click', () => {
            this.refreshTree()
        })
        
        // 選択操作
        const selectAllBtn = element.querySelector('.select-all-btn')
        this.addEventListener(selectAllBtn, 'click', () => {
            this.selectAll()
        })
        
        const clearSelectionBtn = element.querySelector('.clear-selection-btn')
        this.addEventListener(clearSelectionBtn, 'click', () => {
            this.clearSelection()
        })
        
        // エクスポート/インポート
        const exportBtn = element.querySelector('.export-btn')
        this.addEventListener(exportBtn, 'click', () => {
            this.exportTree()
        })
        
        const importBtn = element.querySelector('.import-btn')
        this.addEventListener(importBtn, 'click', () => {
            this.importTree()
        })
    }
    
    /**
     * 📊 初期データ読み込み
     */
    loadInitialData() {
        // デモデータまたは実際のノードデータを読み込み
        this.addNode({
            id: 'root-flow',
            type: 'flow.start',
            name: 'Start',
            position: { x: 100, y: 100 },
            parent: null
        })
        
        this.addNode({
            id: 'input-1',
            type: 'input.text',
            name: 'User Input',
            position: { x: 100, y: 200 },
            parent: 'root-flow'
        })
        
        this.addNode({
            id: 'process-1',
            type: 'string.uppercase',
            name: 'To Uppercase',
            position: { x: 100, y: 300 },
            parent: 'root-flow'
        })
        
        this.addNode({
            id: 'button-1',
            type: 'button.send',
            name: 'Send Button',
            position: { x: 200, y: 200 },
            parent: null
        })
        
        // 接続追加
        this.updateConnection('input-1', 'process-1', 'create')
        this.updateConnection('button-1', 'process-1', 'create')
        
        this.renderTree()
    }
    
    /**
     * 🌳 ツリー構築
     */
    buildTree() {
        this.nodeTree = []
        const nodeMap = new Map()
        
        // 全ノードをマップに追加
        for (const [id, node] of this.nodes) {
            nodeMap.set(id, {
                ...node,
                children: []
            })
        }
        
        // 親子関係構築
        for (const [id, node] of nodeMap) {
            if (node.parent) {
                const parent = nodeMap.get(node.parent)
                if (parent) {
                    parent.children.push(node)
                }
            } else {
                this.nodeTree.push(node)
            }
        }
        
        // ソート
        this.sortTree(this.nodeTree)
    }
    
    /**
     * 🔄 ツリーソート
     */
    sortTree(nodes) {
        nodes.sort((a, b) => {
            // タイプでソート、次に名前でソート
            if (a.type !== b.type) {
                return a.type.localeCompare(b.type)
            }
            return (a.name || a.id).localeCompare(b.name || b.id)
        })
        
        // 子ノードも再帰的にソート
        nodes.forEach(node => {
            if (node.children && node.children.length > 0) {
                this.sortTree(node.children)
            }
        })
    }
    
    /**
     * 🎨 ツリーレンダリング
     */
    renderTree() {
        this.buildTree()
        
        // フィルター適用
        const filteredTree = this.filterTree(this.nodeTree)
        
        // レンダリング
        this.treeContainer.innerHTML = ''
        filteredTree.forEach(node => {
            this.renderNode(node, 0)
        })
        
        // 統計更新
        this.updateStats()
    }
    
    /**
     * 🔍 ツリーフィルタリング
     */
    filterTree(nodes) {
        return nodes.filter(node => {
            // タイプフィルター
            if (this.filterType !== 'all') {
                const nodeCategory = node.type.split('.')[0]
                if (nodeCategory !== this.filterType) {
                    return false
                }
            }
            
            // 検索フィルター
            if (this.searchQuery) {
                const searchText = (node.name || node.id).toLowerCase()
                if (!searchText.includes(this.searchQuery)) {
                    // 子ノードもチェック
                    if (node.children) {
                        node.children = this.filterTree(node.children)
                        return node.children.length > 0
                    }
                    return false
                }
            }
            
            // 子ノードフィルター
            if (node.children) {
                node.children = this.filterTree(node.children)
            }
            
            return true
        })
    }
    
    /**
     * 🎨 ノードレンダリング
     */
    renderNode(node, level) {
        const nodeElement = document.createElement('div')
        nodeElement.className = 'tree-node'
        nodeElement.dataset.nodeId = node.id
        nodeElement.style.cssText = `
            margin-left: ${level * this.treeConfig.indentSize}px;
            padding: 6px 8px;
            cursor: pointer;
            user-select: none;
            border-radius: 4px;
            margin-bottom: 2px;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s;
        `
        
        // 選択状態
        if (this.selectedNodes.has(node.id)) {
            nodeElement.style.background = '#e3f2fd'
            nodeElement.style.border = '1px solid #2196f3'
        } else {
            nodeElement.style.background = '#ffffff'
            nodeElement.style.border = '1px solid transparent'
        }
        
        // ホバー効果
        this.addEventListener(nodeElement, 'mouseenter', () => {
            if (!this.selectedNodes.has(node.id)) {
                nodeElement.style.background = '#f5f5f5'
            }
        })
        
        this.addEventListener(nodeElement, 'mouseleave', () => {
            if (!this.selectedNodes.has(node.id)) {
                nodeElement.style.background = '#ffffff'
            }
        })
        
        // 展開/折りたたみアイコン
        let expandIcon = ''
        if (node.children && node.children.length > 0) {
            const isExpanded = this.expandedNodes.has(node.id)
            expandIcon = `<span class="expand-icon" style="cursor: pointer; font-size: 10px;">${isExpanded ? '▼' : '▶'}</span>`
        } else {
            expandIcon = '<span style="width: 12px; display: inline-block;"></span>'
        }
        
        // ノードアイコン
        const nodeCategory = node.type.split('.')[0]
        const icon = this.nodeIcons[node.type] || this.nodeIcons.default
        const color = this.nodeColors[nodeCategory] || this.nodeColors.default
        
        // 接続数表示
        const connections = this.getNodeConnections(node.id)
        const connectionBadge = connections.length > 0 ? 
            `<span style="background: ${color}; color: white; padding: 1px 4px; border-radius: 10px; font-size: 10px;">${connections.length}</span>` : ''
        
        nodeElement.innerHTML = `
            ${expandIcon}
            <span style="color: ${color}; font-size: 16px;">${icon}</span>
            <span style="flex: 1; font-weight: ${level === 0 ? '600' : '400'};">${node.name || node.id}</span>
            ${this.treeConfig.showNodeTypes ? `<span style="color: #999; font-size: 11px;">${node.type}</span>` : ''}
            ${connectionBadge}
        `
        
        // イベントハンドラー
        this.addEventListener(nodeElement, 'click', (e) => {
            e.stopPropagation()
            
            if (e.target.classList.contains('expand-icon')) {
                // 展開/折りたたみ
                this.toggleExpand(node.id)
            } else {
                // 選択
                this.selectNode(node.id, e.ctrlKey || e.metaKey)
            }
        })
        
        // ドラッグ&ドロップ設定
        if (this.treeConfig.enableDragDrop) {
            this.setupNodeDragDrop(nodeElement, node)
        }
        
        this.treeContainer.appendChild(nodeElement)
        
        // 子ノード描画
        if (node.children && this.expandedNodes.has(node.id)) {
            node.children.forEach(child => {
                this.renderNode(child, level + 1)
            })
        }
    }
    
    /**
     * 🖱️ ノード選択
     */
    selectNode(nodeId, multiSelect = false) {
        if (!multiSelect || !this.treeConfig.enableMultiSelect) {
            this.selectedNodes.clear()
        }
        
        if (this.selectedNodes.has(nodeId)) {
            this.selectedNodes.delete(nodeId)
        } else {
            this.selectedNodes.add(nodeId)
        }
        
        this.renderTree()
        
        // 選択Intent送信
        this.sendIntent(INTENT_TYPES.UI.ELEMENT.SELECT, {
            elementId: nodeId,
            multiSelect: multiSelect,
            selectedNodes: Array.from(this.selectedNodes)
        })
    }
    
    /**
     * 📂 展開/折りたたみ切り替え
     */
    toggleExpand(nodeId) {
        if (this.expandedNodes.has(nodeId)) {
            this.expandedNodes.delete(nodeId)
        } else {
            this.expandedNodes.add(nodeId)
        }
        
        this.renderTree()
    }
    
    /**
     * ➕ ノード追加
     */
    addNode(nodeData) {
        const node = {
            id: nodeData.id,
            type: nodeData.type || 'default',
            name: nodeData.name || nodeData.id,
            position: nodeData.position,
            parent: nodeData.parent,
            data: nodeData.data || {},
            connections: {
                inputs: [],
                outputs: []
            }
        }
        
        this.nodes.set(node.id, node)
        
        // 自動展開
        if (this.treeConfig.autoExpand && node.parent) {
            this.expandedNodes.add(node.parent)
        }
        
        this.renderTree()
        
        this.log('Node added', { id: node.id, type: node.type })
    }
    
    /**
     * ➖ ノード削除
     */
    removeNode(nodeId) {
        const node = this.nodes.get(nodeId)
        if (!node) return
        
        // 子ノードも削除
        const childNodes = this.getChildNodes(nodeId)
        childNodes.forEach(child => {
            this.nodes.delete(child.id)
        })
        
        this.nodes.delete(nodeId)
        this.selectedNodes.delete(nodeId)
        this.expandedNodes.delete(nodeId)
        
        this.renderTree()
        
        this.log('Node removed', { id: nodeId })
    }
    
    /**
     * 🔄 ノード更新
     */
    updateNode(nodeId, updates) {
        const node = this.nodes.get(nodeId)
        if (!node) return
        
        Object.assign(node, updates)
        this.renderTree()
        
        this.log('Node updated', { id: nodeId, updates })
    }
    
    /**
     * 🔗 接続更新
     */
    updateConnection(sourceId, targetId, action) {
        const source = this.nodes.get(sourceId)
        const target = this.nodes.get(targetId)
        
        if (!source || !target) return
        
        if (action === 'create') {
            if (!source.connections.outputs.includes(targetId)) {
                source.connections.outputs.push(targetId)
            }
            if (!target.connections.inputs.includes(sourceId)) {
                target.connections.inputs.push(sourceId)
            }
        } else if (action === 'delete') {
            source.connections.outputs = source.connections.outputs.filter(id => id !== targetId)
            target.connections.inputs = target.connections.inputs.filter(id => id !== sourceId)
        }
        
        this.renderTree()
    }
    
    /**
     * 🔍 ノード接続取得
     */
    getNodeConnections(nodeId) {
        const node = this.nodes.get(nodeId)
        if (!node) return []
        
        return [
            ...node.connections.inputs,
            ...node.connections.outputs
        ]
    }
    
    /**
     * 🔍 子ノード取得
     */
    getChildNodes(parentId) {
        const children = []
        
        for (const [id, node] of this.nodes) {
            if (node.parent === parentId) {
                children.push(node)
                // 再帰的に子ノードも取得
                children.push(...this.getChildNodes(id))
            }
        }
        
        return children
    }
    
    /**
     * 📊 統計更新
     */
    updateStats() {
        const nodeCount = this.nodes.size
        let connectionCount = 0
        
        for (const node of this.nodes.values()) {
            connectionCount += node.connections.outputs.length
        }
        
        const selectedCount = this.selectedNodes.size
        
        // 表示更新
        const nodeCountEl = this.statsElement.querySelector('.node-count')
        const connectionCountEl = this.statsElement.querySelector('.connection-count')
        const selectedCountEl = this.statsElement.querySelector('.selected-count')
        
        if (nodeCountEl) nodeCountEl.textContent = `ノード: ${nodeCount}`
        if (connectionCountEl) connectionCountEl.textContent = `接続: ${connectionCount}`
        if (selectedCountEl) selectedCountEl.textContent = `選択: ${selectedCount}`
    }
    
    /**
     * 🔄 ツリー更新
     */
    refreshTree() {
        // 実際のノードデータを再読み込み
        this.sendIntent('charmflow.tree.request_nodes', {})
        this.renderTree()
        
        this.log('Tree refreshed')
    }
    
    /**
     * 📂 全て展開
     */
    expandAll() {
        for (const nodeId of this.nodes.keys()) {
            const node = this.nodes.get(nodeId)
            if (node.children && node.children.length > 0) {
                this.expandedNodes.add(nodeId)
            }
        }
        
        this.renderTree()
    }
    
    /**
     * 📁 全て折りたたむ
     */
    collapseAll() {
        this.expandedNodes.clear()
        this.renderTree()
    }
    
    /**
     * ✅ 全選択
     */
    selectAll() {
        for (const nodeId of this.nodes.keys()) {
            this.selectedNodes.add(nodeId)
        }
        
        this.renderTree()
    }
    
    /**
     * ❌ 選択解除
     */
    clearSelection() {
        this.selectedNodes.clear()
        this.renderTree()
    }
    
    /**
     * 💾 ツリーエクスポート
     */
    exportTree() {
        const exportData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            nodes: Array.from(this.nodes.values()),
            expandedNodes: Array.from(this.expandedNodes),
            selectedNodes: Array.from(this.selectedNodes)
        }
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `node-tree-${Date.now()}.json`
        a.click()
        URL.revokeObjectURL(url)
        
        this.log('Tree exported', { nodeCount: this.nodes.size })
    }
    
    /**
     * 📤 ツリーインポート
     */
    importTree() {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'
        
        input.onchange = (e) => {
            const file = e.target.files[0]
            if (!file) return
            
            const reader = new FileReader()
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result)
                    
                    // データ復元
                    this.nodes.clear()
                    data.nodes.forEach(node => {
                        this.nodes.set(node.id, node)
                    })
                    
                    this.expandedNodes = new Set(data.expandedNodes || [])
                    this.selectedNodes = new Set(data.selectedNodes || [])
                    
                    this.renderTree()
                    
                    this.log('Tree imported', { nodeCount: this.nodes.size })
                } catch (error) {
                    this.log('Import failed', { error: error.message })
                    alert('インポート失敗: ' + error.message)
                }
            }
            
            reader.readAsText(file)
        }
        
        input.click()
    }
    
    /**
     * 🖱️ ドラッグ&ドロップ設定
     */
    setupNodeDragDrop(element, node) {
        element.draggable = true
        
        this.addEventListener(element, 'dragstart', (e) => {
            this.dragState.isDragging = true
            this.dragState.draggedNode = node
            element.style.opacity = '0.5'
            e.dataTransfer.effectAllowed = 'move'
        })
        
        this.addEventListener(element, 'dragend', (e) => {
            this.dragState.isDragging = false
            this.dragState.draggedNode = null
            element.style.opacity = '1'
            
            if (this.dragState.placeholder) {
                this.dragState.placeholder.remove()
                this.dragState.placeholder = null
            }
        })
        
        this.addEventListener(element, 'dragover', (e) => {
            if (!this.dragState.isDragging) return
            e.preventDefault()
            e.dataTransfer.dropEffect = 'move'
            
            // ドロップ位置インジケーター表示
            const rect = element.getBoundingClientRect()
            const midpoint = rect.top + rect.height / 2
            
            if (e.clientY < midpoint) {
                element.style.borderTop = '2px solid #2196f3'
                element.style.borderBottom = ''
            } else {
                element.style.borderTop = ''
                element.style.borderBottom = '2px solid #2196f3'
            }
        })
        
        this.addEventListener(element, 'dragleave', (e) => {
            element.style.borderTop = ''
            element.style.borderBottom = ''
        })
        
        this.addEventListener(element, 'drop', (e) => {
            e.preventDefault()
            element.style.borderTop = ''
            element.style.borderBottom = ''
            
            if (!this.dragState.draggedNode || this.dragState.draggedNode.id === node.id) {
                return
            }
            
            // 親子関係更新
            const draggedNode = this.nodes.get(this.dragState.draggedNode.id)
            if (draggedNode) {
                draggedNode.parent = node.id
                this.expandedNodes.add(node.id)
                this.renderTree()
                
                // Intent送信
                this.sendIntent('charmflow.tree.node_moved', {
                    nodeId: draggedNode.id,
                    newParent: node.id
                })
            }
        })
    }
    
    // ライフサイクルフック
    onMounted() {
        super.onMounted()
        this.log('NodeTreeViewComponent mounted')
    }
    
    onShown() {
        super.onShown()
        // 表示時に更新
        this.refreshTree()
    }
}

// グローバル公開
window.NodeTreeViewComponent = NodeTreeViewComponent

export default NodeTreeViewComponent