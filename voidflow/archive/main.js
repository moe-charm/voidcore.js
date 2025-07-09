// VoidFlow Constellation Zero - Main Entry Point
import { VoidFlowEngine } from './voidflow-engine.js';
import { ExecuteEngine } from './execute-engine.js';

// グローバル変数
let voidFlowEngine = null;
let executeEngine = null;

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    initializeVoidFlow();
});

// VoidFlow初期化
async function initializeVoidFlow() {
    try {
        // エンジン初期化
        voidFlowEngine = new VoidFlowEngine();
        executeEngine = new ExecuteEngine(voidFlowEngine);
        
        // 実行エンジンをVoidFlowEngineに注入
        voidFlowEngine.executeEngine = executeEngine;
        
        // グローバル変数設定（デバッグ用）
        window.voidFlowEngine = voidFlowEngine;
        window.executeEngine = executeEngine;
        
        // UI初期化
        initializeUI();
        
        voidFlowEngine.log('🌟 VoidFlow Constellation Zero 初期化完了');
        voidFlowEngine.log('💡 使い方: 左パネルからノードをドラッグして配置し、🚀ボタンで実行');
        
    } catch (error) {
        console.error('❌ VoidFlow初期化失敗:', error);
        // フォールバック
        const logElement = document.getElementById('executionLog');
        if (logElement) {
            logElement.innerHTML += `❌ 初期化失敗: ${error.message}<br>`;
        }
    }
}

// UI初期化
function initializeUI() {
    // ノードパレットのドラッグ機能
    initializeNodePalette();
    
    // キャンバスのドロップ機能
    initializeCanvas();
    
    // 実行ボタン
    window.executeFlow = executeFlow;
}

// ノードパレット初期化
function initializeNodePalette() {
    const nodeItems = document.querySelectorAll('.node-item');
    
    nodeItems.forEach(item => {
        // ドラッグ機能
        item.addEventListener('dragstart', (e) => {
            const nodeType = item.getAttribute('data-node-type');
            e.dataTransfer.setData('text/plain', nodeType);
            voidFlowEngine.log(`📦 ドラッグ開始: ${nodeType}`);
        });
        
        // クリック機能（前の動作を復活）
        item.addEventListener('click', (e) => {
            const nodeType = item.getAttribute('data-node-type');
            // ランダムな位置に配置
            const position = {
                x: Math.random() * 400 + 100,
                y: Math.random() * 300 + 100
            };
            
            createNodeOnCanvas(nodeType, position);
            voidFlowEngine.log(`🎯 クリック配置: ${nodeType}`);
        });
        
        item.setAttribute('draggable', true);
    });
}

// キャンバス初期化
function initializeCanvas() {
    const canvasArea = document.querySelector('.canvas-area');
    
    canvasArea.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    
    canvasArea.addEventListener('drop', (e) => {
        e.preventDefault();
        
        const nodeType = e.dataTransfer.getData('text/plain');
        const rect = canvasArea.getBoundingClientRect();
        const position = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        createNodeOnCanvas(nodeType, position);
    });
    
    // 空エリアでの右クリックキャンセル
    canvasArea.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        
        // スマート接続モード中の場合はキャンセル
        if (smartConnectionManager.connectionMode) {
            smartConnectionManager.resetSelection();
            voidFlowEngine.log('❌ 空エリア右クリックで接続モードキャンセル');
        }
        
        return false;
    });
}

// キャンバス上にノード作成
function createNodeOnCanvas(nodeType, position) {
    try {
        const node = voidFlowEngine.createNode(nodeType, position);
        const nodeElement = createNodeElement(node);
        
        document.querySelector('.canvas-area').appendChild(nodeElement);
        
        // Zenメッセージを隠す
        const zenMessage = document.getElementById('zenMessage');
        if (zenMessage) {
            zenMessage.style.display = 'none';
        }
        
        voidFlowEngine.log(`✨ ノード作成: ${nodeType} at (${position.x}, ${position.y})`);
        
    } catch (error) {
        voidFlowEngine.log(`❌ ノード作成失敗: ${error.message}`);
    }
}

// ノード要素作成
function createNodeElement(node) {
    const nodeDiv = document.createElement('div');
    nodeDiv.className = 'voidflow-node waiting';
    nodeDiv.id = `voidflow-node-${node.id}`;
    nodeDiv.style.left = `${node.position.x}px`;
    nodeDiv.style.top = `${node.position.y}px`;
    
    // ノードタイプに応じたタイトル
    const titles = {
        'button.send': 'Button: Send',
        'input.text': 'Input: Text',
        'string.uppercase': 'String: UpperCase',
        'output.console': 'Output: Console',
        'web.fetch': 'Web: Fetch API',
        'json.parser': 'JSON: Parser',
        'ui.card': 'UI: Simple Card',
        'core.plugin-lister': 'Core: Plugin Lister',
        'core.connection-manager': 'Core: Connection Manager',
        'flow.connector': 'Flow: Connector'
    };
    
    const title = titles[node.type] || node.type;
    
    nodeDiv.innerHTML = `
        <div class="node-title">${title}</div>
        <div class="node-content">
            ${createNodeContent(node)}
        </div>
        <div class="node-output" id="node-output-${node.id}">待機中...</div>
        ${node.inputs.length > 0 ? '<div class="connection-port input-port"></div>' : ''}
        ${node.outputs.length > 0 ? '<div class="connection-port output-port"></div>' : ''}
    `;
    
    // ドラッグ機能追加
    makeNodeDraggable(nodeDiv);
    
    // クリック選択機能（スマート接続対応）
    nodeDiv.addEventListener('click', (e) => {
        // ポートクリックでない場合
        if (!e.target.classList.contains('connection-port')) {
            selectNode(node.id);
            // スマート接続モードの処理
            smartConnectionManager.handleNodeClick(node.id);
        }
    });
    
    // 右クリックで接続キャンセル
    nodeDiv.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        
        // スマート接続モード中の場合はキャンセル
        if (smartConnectionManager.connectionMode) {
            smartConnectionManager.resetSelection();
            voidFlowEngine.log('❌ 右クリックで接続モードキャンセル');
        }
        
        return false;
    });
    
    // ポートクリック機能
    const inputPort = nodeDiv.querySelector('.input-port');
    const outputPort = nodeDiv.querySelector('.output-port');
    
    if (inputPort) {
        inputPort.addEventListener('click', (e) => {
            e.stopPropagation();
            handlePortClick(node.id, 'input', inputPort);
        });
    }
    
    if (outputPort) {
        outputPort.addEventListener('click', (e) => {
            e.stopPropagation();
            handlePortClick(node.id, 'output', outputPort);
        });
    }
    
    return nodeDiv;
}

// ノード固有のコンテンツ作成
function createNodeContent(node) {
    switch (node.type) {
        case 'button.send':
            return `
                <button class="execute-button" onclick="startFromNode('${node.id}')" 
                        style="margin: 10px 0; padding: 15px; font-size: 16px; width: 100%;">
                    🚀 Send Signal
                </button>
            `;
        case 'input.text':
            return `<input type="text" class="node-input" value="Hello VoidFlow!" 
                    onchange="updateNodeProperty('${node.id}', 'text', this.value)">`;
        case 'web.fetch':
            return `<input type="text" class="node-input" value="https://httpbin.org/json" 
                    onchange="updateNodeProperty('${node.id}', 'url', this.value)" 
                    placeholder="URL">`;
        case 'json.parser':
            return `<input type="text" class="node-input" value="" 
                    onchange="updateNodeProperty('${node.id}', 'path', this.value)" 
                    placeholder="JSONパス (例: data.title)">`;
        case 'ui.card':
            return `<input type="text" class="node-input" value="VoidFlow Card" 
                    onchange="updateNodeProperty('${node.id}', 'title', this.value)" 
                    placeholder="カードタイトル">`;
        default:
            return '<div style="color: #888; font-size: 10px;">設定不要</div>';
    }
}

// ノードドラッグ機能
function makeNodeDraggable(nodeElement) {
    let isDragging = false;
    let dragStartX, dragStartY;
    
    nodeElement.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('node-input')) return;
        
        isDragging = true;
        dragStartX = e.clientX - nodeElement.offsetLeft;
        dragStartY = e.clientY - nodeElement.offsetTop;
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        
        e.preventDefault();
    });
    
    function onMouseMove(e) {
        if (!isDragging) return;
        
        const newX = e.clientX - dragStartX;
        const newY = e.clientY - dragStartY;
        
        nodeElement.style.left = `${newX}px`;
        nodeElement.style.top = `${newY}px`;
        
        // VoidFlowEngineのノード位置も更新
        const nodeId = nodeElement.id.replace('voidflow-node-', '');
        const node = voidFlowEngine.nodes.get(nodeId);
        if (node) {
            node.position.x = newX;
            node.position.y = newY;
        }
    }
    
    function onMouseUp() {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        
        // ドラッグ終了時に接続線を更新（DOM更新を待つ）
        const nodeId = nodeElement.id.replace('voidflow-node-', '');
        requestAnimationFrame(() => {
            updateConnectionLines(nodeId);
        });
    }
}

// ノード選択
function selectNode(nodeId) {
    // 既存の選択を解除
    document.querySelectorAll('.voidflow-node').forEach(node => {
        node.classList.remove('selected');
    });
    
    // 新しいノードを選択
    const nodeElement = document.getElementById(`voidflow-node-${nodeId}`);
    if (nodeElement) {
        nodeElement.classList.add('selected');
        voidFlowEngine.selectedNode = nodeId;
        
        // プロパティパネル更新
        updatePropertiesPanel(nodeId);
    }
}

// プロパティパネル更新
function updatePropertiesPanel(nodeId) {
    const node = voidFlowEngine.nodes.get(nodeId);
    if (!node) return;
    
    const propertiesContent = document.getElementById('propertiesContent');
    propertiesContent.innerHTML = `
        <div style="margin-bottom: 10px;">
            <strong>ノードID:</strong> ${node.id}<br>
            <strong>タイプ:</strong> ${node.type}<br>
            <strong>位置:</strong> (${Math.round(node.position.x)}, ${Math.round(node.position.y)})
        </div>
        ${createNodePropertyEditor(node)}
    `;
}

// ノードプロパティエディター作成
function createNodePropertyEditor(node) {
    switch (node.type) {
        case 'input.text':
            return `
                <label>テキスト:</label>
                <input type="text" class="node-input" value="${node.properties.text || 'Hello VoidFlow!'}" 
                       onchange="updateNodeProperty('${node.id}', 'text', this.value)">
            `;
        case 'web.fetch':
            return `
                <label>URL:</label>
                <input type="text" class="node-input" value="${node.properties.url || 'https://httpbin.org/json'}" 
                       onchange="updateNodeProperty('${node.id}', 'url', this.value)">
            `;
        case 'json.parser':
            return `
                <label>JSONパス:</label>
                <input type="text" class="node-input" value="${node.properties.path || ''}" 
                       onchange="updateNodeProperty('${node.id}', 'path', this.value)" 
                       placeholder="例: data.title">
            `;
        case 'ui.card':
            return `
                <label>カードタイトル:</label>
                <input type="text" class="node-input" value="${node.properties.title || 'VoidFlow Card'}" 
                       onchange="updateNodeProperty('${node.id}', 'title', this.value)">
            `;
        default:
            return '<p style="color: #888;">このノードには設定可能なプロパティがありません。</p>';
    }
}

// ノードプロパティ更新
window.updateNodeProperty = function(nodeId, propertyName, value) {
    const node = voidFlowEngine.nodes.get(nodeId);
    if (node) {
        node.properties[propertyName] = value;
        voidFlowEngine.log(`⚙️ プロパティ更新: ${nodeId}.${propertyName} = "${value}"`);
    }
};

// フロー実行
window.executeFlow = async function() {
    try {
        // executeEngine存在確認
        if (!executeEngine || !voidFlowEngine) {
            console.error('❌ エンジンが初期化されていません');
            const logElement = document.getElementById('executionLog');
            if (logElement) {
                logElement.innerHTML += '❌ エンジンが初期化されていません<br>';
            }
            return;
        }
        
        voidFlowEngine.log('🚀 フロー実行開始...');
        
        // デバッグ: 現在のノードをログ出力
        const allNodes = Array.from(voidFlowEngine.nodes.values());
        voidFlowEngine.log(`📋 現在のノード数: ${allNodes.length}`);
        allNodes.forEach(node => {
            voidFlowEngine.log(`📍 ノード: ${node.id} (${node.type})`);
        });
        
        // Button.sendノードを探して実行
        const buttonNodes = allNodes.filter(node => node.type === 'button.send');
        
        if (buttonNodes.length === 0) {
            voidFlowEngine.log('⚠️ Button.sendノードが見つかりません');
            voidFlowEngine.log('💡 ヒント: まず左パネルから "Button: Send" をキャンバスにドラッグしてください');
            return;
        }
        
        // 最初のButtonノードから実行開始
        const startNode = buttonNodes[0];
        voidFlowEngine.log(`🎯 実行開始ノード: ${startNode.id}`);
        
        // executeEngineがアクセス可能かチェック
        if (executeEngine && executeEngine.executeNode) {
            await executeEngine.executeNode(startNode.id);
        } else if (voidFlowEngine.executeEngine && voidFlowEngine.executeEngine.executeNode) {
            await voidFlowEngine.executeEngine.executeNode(startNode.id);
        } else {
            throw new Error('ExecuteEngine.executeNode が見つかりません');
        }
        
        voidFlowEngine.log('✅ フロー実行完了');
        
    } catch (error) {
        voidFlowEngine.log(`❌ フロー実行失敗: ${error.message}`);
        console.error('詳細エラー:', error);
    }
};

// 開発用: グローバルアクセス
window.voidFlowEngine = voidFlowEngine;

// 接続機能の変数
let isConnecting = false;
let connectionStart = null;
let tempConnectionLine = null;

// ポートクリック処理
function handlePortClick(nodeId, portType, portElement) {
    if (!isConnecting) {
        // 接続開始
        if (portType === 'output') {
            isConnecting = true;
            connectionStart = { nodeId, portType, element: portElement };
            portElement.style.backgroundColor = '#00ff88';
            portElement.style.boxShadow = '0 0 15px rgba(0, 255, 136, 0.8)';
            voidFlowEngine.log(`🔌 接続開始: ${nodeId} (Output)`);
            
            // マウス移動で一時的な線を描画
            document.addEventListener('mousemove', drawTempConnection);
            document.addEventListener('click', cancelConnection);
        }
    } else {
        // 接続完了
        if (portType === 'input' && connectionStart.portType === 'output') {
            const edge = voidFlowEngine.createEdge(
                connectionStart.nodeId, 'output',
                nodeId, 'input'
            );
            
            drawConnection(edge);
            voidFlowEngine.log(`🔗 接続完了: ${connectionStart.nodeId} → ${nodeId}`);
            
            // 接続後の実行フロー設定
            setupExecutionFlow(connectionStart.nodeId, nodeId);
        }
        
        // 接続状態をリセット
        resetConnectionState();
    }
}

// 一時的な接続線描画
function drawTempConnection(e) {
    if (!isConnecting || !connectionStart) return;
    
    const svg = document.getElementById('connectionSvg');
    const existingTemp = svg.querySelector('.temp-connection');
    if (existingTemp) existingTemp.remove();
    
    const startRect = connectionStart.element.getBoundingClientRect();
    const canvasRect = document.querySelector('.canvas-area').getBoundingClientRect();
    
    const startX = startRect.left + startRect.width/2 - canvasRect.left;
    const startY = startRect.top + startRect.height/2 - canvasRect.top;
    const endX = e.clientX - canvasRect.left;
    const endY = e.clientY - canvasRect.top;
    
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', startX);
    line.setAttribute('y1', startY);
    line.setAttribute('x2', endX);
    line.setAttribute('y2', endY);
    line.setAttribute('stroke', '#4a90e2');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-dasharray', '5,5');
    line.setAttribute('class', 'temp-connection');
    line.style.opacity = '0.7';
    
    svg.appendChild(line);
}

// 接続をキャンセル
function cancelConnection(e) {
    if (e.target.closest('.connection-port')) return;
    resetConnectionState();
}

// 接続状態をリセット
function resetConnectionState() {
    if (connectionStart && connectionStart.element) {
        connectionStart.element.style.backgroundColor = '';
        connectionStart.element.style.boxShadow = '';
    }
    
    isConnecting = false;
    connectionStart = null;
    
    // 一時的な線を削除
    const svg = document.getElementById('connectionSvg');
    const tempLine = svg.querySelector('.temp-connection');
    if (tempLine) tempLine.remove();
    
    document.removeEventListener('mousemove', drawTempConnection);
    document.removeEventListener('click', cancelConnection);
}

// 接続線を描画（新システム対応）
function drawConnection(edge) {
    connectionManager.redrawConnectionsFromNode(edge.sourceNodeId);
}

// 実行フローを設定
function setupExecutionFlow(sourceNodeId, targetNodeId) {
    // エッジに基づいて実行フローを管理
    // executeEngineで接続に従って実行する
}

// スマート接続管理システム
class SmartConnectionManager {
    constructor() {
        this.firstSelected = null;
        this.secondSelected = null;
        this.connectionMode = false;
        this.connectionCandidates = [];
    }
    
    async handleNodeClick(nodeId) {
        if (!this.firstSelected) {
            // 最初のノード選択
            this.firstSelected = nodeId;
            this.highlightNode(nodeId, 'first');
            voidFlowEngine.log(`🎯 接続ソース選択: ${this.getNodeDisplayName(nodeId)}`);
            voidFlowEngine.log('💡 次に接続先ノードをクリックしてください');
            this.connectionMode = true;
        } else if (this.firstSelected === nodeId) {
            // 同じノードクリック = キャンセル
            this.resetSelection();
            voidFlowEngine.log('❌ 接続モードキャンセル');
        } else {
            // 2番目のノード選択 = 接続候補分析
            this.secondSelected = nodeId;
            this.highlightNode(nodeId, 'second');
            voidFlowEngine.log(`🎯 接続ターゲット選択: ${this.getNodeDisplayName(nodeId)}`);
            
            // 接続候補を分析・表示
            this.connectionCandidates = this.analyzeConnectionCandidates(this.firstSelected, this.secondSelected);
            this.showConnectionCandidates(this.connectionCandidates);
        }
    }
    
    getNodeDisplayName(nodeId) {
        const node = voidFlowEngine.nodes.get(nodeId);
        if (!node) return nodeId;
        
        const names = {
            'button.send': 'Button: Send',
            'input.text': 'Input: Text',
            'string.uppercase': 'String: UpperCase',
            'output.console': 'Output: Console',
            'web.fetch': 'Web: Fetch API',
            'json.parser': 'JSON: Parser',
            'ui.card': 'UI: Simple Card'
        };
        return names[node.type] || node.type;
    }
    
    highlightNode(nodeId, type) {
        const nodeElement = document.getElementById(`voidflow-node-${nodeId}`);
        if (nodeElement) {
            if (type === 'first') {
                nodeElement.style.borderColor = '#00ff88';
                nodeElement.style.boxShadow = '0 0 15px rgba(0, 255, 136, 0.5)';
            } else if (type === 'second') {
                nodeElement.style.borderColor = '#ff6b6b';
                nodeElement.style.boxShadow = '0 0 15px rgba(255, 107, 107, 0.5)';
            }
        }
    }
    
    analyzeConnectionCandidates(sourceId, targetId) {
        const sourceNode = voidFlowEngine.nodes.get(sourceId);
        const targetNode = voidFlowEngine.nodes.get(targetId);
        
        if (!sourceNode || !targetNode) return [];
        
        const candidates = [];
        
        // 接続候補を分析
        const compatibility = this.calculateCompatibility(sourceNode, targetNode);
        if (compatibility.score > 0) {
            candidates.push({
                sourcePort: { name: 'Output', dataType: 'any' },
                targetPort: { name: 'Input', dataType: 'any' },
                compatibility: compatibility,
                connectionType: compatibility.connectionType,
                description: compatibility.description
            });
        }
        
        return candidates.sort((a, b) => b.compatibility.score - a.compatibility.score);
    }
    
    calculateCompatibility(sourceNode, targetNode) {
        let score = 70;
        let connectionType = 'data-flow';
        let description = '';
        let reason = '';
        
        const sourceType = sourceNode.type;
        const targetType = targetNode.type;
        
        // 定番の組み合わせ
        if (sourceType === 'input.text' && targetType === 'string.uppercase') {
            score = 100;
            description = 'テキストを大文字に変換';
            reason = '定番の組み合わせ';
        } else if (sourceType === 'string.uppercase' && targetType === 'output.console') {
            score = 100;
            description = '処理結果をコンソールに表示';
            reason = '結果表示';
        } else if (sourceType === 'web.fetch' && targetType === 'json.parser') {
            score = 100;
            description = 'API レスポンスを JSON として解析';
            reason = 'API → JSON の定番';
        } else if (sourceType === 'json.parser' && targetType === 'ui.card') {
            score = 100;
            description = 'JSON データをカードで表示';
            reason = 'データ表示';
        } else if (sourceType === 'button.send' && (targetType === 'input.text' || targetType === 'web.fetch')) {
            score = 100;
            connectionType = 'control-flow';
            description = 'ボタンでプラグインを実行';
            reason = 'トリガー実行';
        } else {
            description = `${sourceType} → ${targetType} 接続`;
            reason = '基本的な互換性';
        }
        
        return {
            score: Math.max(70, Math.min(100, score)),
            connectionType,
            description,
            reason,
            confidence: score >= 95 ? 'perfect' : score >= 85 ? 'high' : 'good'
        };
    }
    
    showConnectionCandidates(candidates) {
        if (candidates.length === 0) {
            voidFlowEngine.log('❌ 互換性のある接続候補が見つかりませんでした');
            this.resetSelection();
            return;
        }
        
        const modal = this.createCandidateModal(candidates);
        document.body.appendChild(modal);
        
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 10);
    }
    
    createCandidateModal(candidates) {
        const modal = document.createElement('div');
        modal.className = 'connection-candidates-modal';
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.9);
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border: 2px solid #4a90e2;
            border-radius: 12px;
            padding: 20px;
            width: 500px;
            max-height: 400px;
            overflow-y: auto;
            z-index: 10000;
            opacity: 0;
            transition: all 0.3s ease;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        `;
        
        const sourceNode = voidFlowEngine.nodes.get(this.firstSelected);
        const targetNode = voidFlowEngine.nodes.get(this.secondSelected);
        
        modal.innerHTML = `
            <div style="margin-bottom: 20px; text-align: center;">
                <h3 style="color: #4a90e2; margin: 0 0 10px 0;">🔗 接続候補を選択</h3>
                <div style="font-size: 14px; color: #aaa;">
                    <span style="color: #00ff88;">${this.getNodeDisplayName(this.firstSelected)}</span>
                    <span style="color: #666;"> → </span>
                    <span style="color: #ff6b6b;">${this.getNodeDisplayName(this.secondSelected)}</span>
                </div>
            </div>
            
            <div class="candidates-list">
                ${candidates.map((candidate, index) => this.createCandidateItem(candidate, index)).join('')}
            </div>
            
            <div style="margin-top: 20px; text-align: center;">
                <button onclick="event.stopPropagation(); smartConnectionManager.closeModal()" 
                        style="background: #666; color: white; border: none; padding: 8px 16px; 
                               border-radius: 4px; cursor: pointer;">
                    キャンセル
                </button>
            </div>
        `;
        
        return modal;
    }
    
    createCandidateItem(candidate, index) {
        const confidenceColor = {
            'perfect': '#00ff88',
            'high': '#00ff88', 
            'good': '#4a90e2'
        }[candidate.compatibility.confidence];
        
        const confidenceText = {
            'perfect': '✅ 完璧',
            'high': '🌟 推奨',
            'good': '👍 良好'
        }[candidate.compatibility.confidence];
        
        return `
            <div class="candidate-item" onclick="event.stopPropagation(); smartConnectionManager.selectCandidate(${index})"
                 style="background: rgba(0, 0, 0, 0.3); border: 1px solid #333; border-radius: 8px; 
                        padding: 15px; margin-bottom: 10px; cursor: pointer; transition: all 0.2s ease;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                    <div style="font-size: 14px; color: #fff;">
                        <span style="color: #00ff88;">${candidate.sourcePort?.name || 'Output'}</span>
                        <span style="color: #666;"> ───➤ </span>
                        <span style="color: #ff6b6b;">${candidate.targetPort?.name || 'Input'}</span>
                    </div>
                    <div style="color: ${confidenceColor}; font-size: 12px; font-weight: bold;">
                        ${confidenceText} (${candidate.compatibility.score}%)
                    </div>
                </div>
                <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">
                    🔄 ${candidate.description}
                </div>
                <div style="font-size: 11px; color: #888;">
                    💡 ${candidate.compatibility.reason}
                </div>
            </div>
        `;
    }
    
    async selectCandidate(index) {
        const modal = document.querySelector('.connection-candidates-modal');
        if (modal) modal.remove();
        
        // 選択された候補から接続タイプを取得
        const selectedCandidate = this.connectionCandidates[index];
        
        // 接続を実行
        const edge = voidFlowEngine.createEdge(
            this.firstSelected, 'output',
            this.secondSelected, 'input'
        );
        
        // 接続タイプを設定
        edge.connectionType = selectedCandidate.connectionType;
        
        drawConnection(edge);
        voidFlowEngine.log(`✅ スマート接続完了: ${this.getNodeDisplayName(this.firstSelected)} → ${this.getNodeDisplayName(this.secondSelected)}`);
        
        this.resetSelection();
    }
    
    closeModal() {
        const modal = document.querySelector('.connection-candidates-modal');
        if (modal) modal.remove();
        this.resetSelection();
    }
    
    resetSelection() {
        // ハイライトを削除
        if (this.firstSelected) {
            const firstElement = document.getElementById(`voidflow-node-${this.firstSelected}`);
            if (firstElement) {
                firstElement.style.borderColor = '#4a90e2';
                firstElement.style.boxShadow = '0 4px 20px rgba(74, 144, 226, 0.2)';
            }
        }
        
        if (this.secondSelected) {
            const secondElement = document.getElementById(`voidflow-node-${this.secondSelected}`);
            if (secondElement) {
                secondElement.style.borderColor = '#4a90e2';
                secondElement.style.boxShadow = '0 4px 20px rgba(74, 144, 226, 0.2)';
            }
        }
        
        this.firstSelected = null;
        this.secondSelected = null;
        this.connectionMode = false;
        this.connectionCandidates = [];
    }
}

// グローバルスマート接続マネージャー
const smartConnectionManager = new SmartConnectionManager();
window.smartConnectionManager = smartConnectionManager;

// 特定ノードから実行開始
window.startFromNode = async function(nodeId) {
    try {
        const node = voidFlowEngine.nodes.get(nodeId);
        if (node) {
            voidFlowEngine.log(`🎯 手動開始: ${smartConnectionManager.getNodeDisplayName(nodeId)}`);
            
            if (executeEngine && executeEngine.executeNode) {
                await executeEngine.executeNode(nodeId);
            } else if (voidFlowEngine.executeEngine && voidFlowEngine.executeEngine.executeNode) {
                await voidFlowEngine.executeEngine.executeNode(nodeId);
            } else {
                throw new Error('ExecuteEngine が見つかりません');
            }
            
            voidFlowEngine.log('✨ 実行完了!');
        }
    } catch (error) {
        voidFlowEngine.log(`❌ ノード実行失敗: ${error.message}`);
        console.error('詳細エラー:', error);
    }
};

// 接続線を更新（ノード移動時）
function updateConnectionLines(movedNodeId) {
    // 移動したノードが関わる全ソースノードを特定
    const sourceNodes = new Set();
    
    for (const [edgeId, edge] of voidFlowEngine.edges) {
        if (edge.sourceNodeId === movedNodeId) {
            sourceNodes.add(movedNodeId);
        }
        if (edge.targetNodeId === movedNodeId) {
            sourceNodes.add(edge.sourceNodeId);
        }
    }
    
    // 各ソースノードの接続を再描画
    sourceNodes.forEach(sourceNodeId => {
        connectionManager.redrawConnectionsFromNode(sourceNodeId);
    });
}

// 接続線管理システム（束ね線機能付き）
class ConnectionManager {
    constructor() {
        this.bundledConnections = new Map(); // sourceNodeId -> bundled connection info
    }
    
    // ノードからの全接続を取得
    getConnectionsFromNode(sourceNodeId) {
        const connections = [];
        for (const [edgeId, edge] of voidFlowEngine.edges) {
            if (edge.sourceNodeId === sourceNodeId) {
                connections.push(edge);
            }
        }
        return connections;
    }
    
    // 接続の再描画（自動切り替え対応）
    redrawConnectionsFromNode(sourceNodeId) {
        // 既存の接続線を削除
        this.clearConnectionsFromNode(sourceNodeId);
        
        // 接続を取得
        const connections = this.getConnectionsFromNode(sourceNodeId);
        
        if (connections.length === 0) return;
        
        voidFlowEngine.log(`🔄 接続再描画: ソース${sourceNodeId} - ${connections.length}本の接続`);
        
        // 接続数に応じて描画方法を切り替え
        if (connections.length === 1) {
            // 単一接続: 通常の線
            voidFlowEngine.log(`📏 単一接続モード`);
            this.drawSingleConnection(connections[0]);
        } else if (connections.length <= 3) {
            // 複数接続: 扇形分散
            voidFlowEngine.log(`🌟 扇形分散モード: ${connections.length}本`);
            this.drawFanOutConnections(connections);
        } else {
            // 多数接続: 束ね太線
            voidFlowEngine.log(`🎯 束ね線モード: ${connections.length}本 → 太い線1本`);
            this.drawBundledConnection(sourceNodeId, connections);
        }
    }
    
    // 既存接続線を削除
    clearConnectionsFromNode(sourceNodeId) {
        const svg = document.getElementById('connectionSvg');
        
        // 一括削除で高速化
        const elementsToRemove = [
            ...svg.querySelectorAll(`[data-source-node="${sourceNodeId}"]`),
            ...svg.querySelectorAll(`[data-bundled-source="${sourceNodeId}"]`)
        ];
        
        voidFlowEngine.log(`🗑️ 接続削除: ${elementsToRemove.length}個の要素を削除 (ソース: ${sourceNodeId})`);
        elementsToRemove.forEach(element => {
            voidFlowEngine.log(`🗑️ 削除要素: ${element.tagName} ${element.getAttribute('class')} ${element.getAttribute('d') || element.textContent}`);
            element.remove();
        });
        
        // 削除後の確認
        const remainingElements = svg.querySelectorAll(`[data-bundled-source="${sourceNodeId}"]`);
        voidFlowEngine.log(`🔍 削除後残り: ${remainingElements.length}個の要素`);
    }
    
    // 扇形分散描画
    drawFanOutConnections(connections) {
        voidFlowEngine.log(`🌟 扇形分散開始: ${connections.length}本の接続`);
        
        // 基本座標を一度だけ計算（全接続で共通）
        const sourceNodeId = connections[0].sourceNodeId;
        const sourceNode = document.getElementById(`voidflow-node-${sourceNodeId}`);
        const sourcePort = sourceNode.querySelector('.output-port');
        const canvasRect = document.querySelector('.canvas-area').getBoundingClientRect();
        const sourceRect = sourcePort.getBoundingClientRect();
        
        const baseStartX = sourceRect.left + sourceRect.width/2 - canvasRect.left;
        const baseStartY = sourceRect.top + sourceRect.height/2 - canvasRect.top;
        
        voidFlowEngine.log(`📍 共通基本座標: (${Math.round(baseStartX)}, ${Math.round(baseStartY)})`);
        
        connections.forEach((edge, index) => {
            let angle = 0;
            
            if (connections.length === 2) {
                // 2本の場合: 上下に分散（水平基準から上下に）
                angle = index === 0 ? -15 : 15; // 上向きと下向き
            } else if (connections.length === 3) {
                // 3本の場合: 中央、上、下
                angle = (index - 1) * 20; // -20, 0, +20度
            } else {
                // 4本以上の場合: 等間隔分散
                const angleStep = 15;
                const baseAngle = -((connections.length - 1) * angleStep) / 2;
                angle = baseAngle + (index * angleStep);
            }
            
            voidFlowEngine.log(`🔄 接続${index + 1}/${connections.length}: 角度${angle}度 (${edge.sourceNodeId} → ${edge.targetNodeId})`);
            this.drawSingleConnectionWithBaseCoords(edge, angle, baseStartX, baseStartY);
        });
    }
    
    // SVG矢印マーカーを作成
    ensureMarkers(svg) {
        let defs = svg.querySelector('defs');
        if (!defs) {
            defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            svg.appendChild(defs);
        }
        
        // 基本矢印マーカー
        if (!defs.querySelector('#arrowhead')) {
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            marker.setAttribute('id', 'arrowhead');
            marker.setAttribute('markerWidth', '10');
            marker.setAttribute('markerHeight', '7');
            marker.setAttribute('refX', '9');
            marker.setAttribute('refY', '3.5');
            marker.setAttribute('orient', 'auto');
            marker.setAttribute('fill', '#4a90e2');
            
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
            marker.appendChild(polygon);
            defs.appendChild(marker);
        }
        
        // オレンジ矢印マーカー（制御フロー用）
        if (!defs.querySelector('#arrowhead-orange')) {
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            marker.setAttribute('id', 'arrowhead-orange');
            marker.setAttribute('markerWidth', '10');
            marker.setAttribute('markerHeight', '7');
            marker.setAttribute('refX', '9');
            marker.setAttribute('refY', '3.5');
            marker.setAttribute('orient', 'auto');
            marker.setAttribute('fill', '#ff9500');
            
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
            marker.appendChild(polygon);
            defs.appendChild(marker);
        }
    }

    // 個別接続線を描画（角度オフセット付き）
    drawSingleConnection(edge, angleOffset = 0) {
        const sourceNode = document.getElementById(`voidflow-node-${edge.sourceNodeId}`);
        const targetNode = document.getElementById(`voidflow-node-${edge.targetNodeId}`);
        
        if (!sourceNode || !targetNode) return;
        
        const sourcePort = sourceNode.querySelector('.output-port');
        const targetPort = targetNode.querySelector('.input-port');
        
        if (!sourcePort || !targetPort) return;
        
        const svg = document.getElementById('connectionSvg');
        this.ensureMarkers(svg);
        
        const canvasRect = document.querySelector('.canvas-area').getBoundingClientRect();
        
        const sourceRect = sourcePort.getBoundingClientRect();
        const targetRect = targetPort.getBoundingClientRect();
        
        let startX = sourceRect.left + sourceRect.width/2 - canvasRect.left;
        let startY = sourceRect.top + sourceRect.height/2 - canvasRect.top;
        const endX = targetRect.left + targetRect.width/2 - canvasRect.left;
        const endY = targetRect.top + targetRect.height/2 - canvasRect.top;
        
        // デバッグ: 基本座標をログ出力
        voidFlowEngine.log(`📍 基本座標: (${Math.round(startX)}, ${Math.round(startY)})`);
        
        // 角度オフセットを適用（より自然な分散）
        if (angleOffset !== 0) {
            const offsetDistance = 10; // 距離をさらに近づける
            const radians = (angleOffset * Math.PI) / 180;
            
            // ポートから放射状に分散（基本座標から）
            const offsetX = Math.cos(radians) * offsetDistance; // 水平方向成分
            const offsetY = Math.sin(radians) * offsetDistance; // 垂直方向成分
            
            startX += offsetX;
            startY += offsetY;
            
            voidFlowEngine.log(`🔄 オフセット適用: +${Math.round(offsetX)}, +${Math.round(offsetY)} → (${Math.round(startX)}, ${Math.round(startY)})`);
        }
        
        // ベジェ曲線で美しい接続線
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const controlOffset = Math.abs(endX - startX) * 0.5;
        const pathData = `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`;
        
        // 接続タイプに応じて色と矢印を変更
        const connectionType = edge.connectionType || 'data-flow';
        let strokeColor = '#4a90e2';
        let markerEnd = 'url(#arrowhead)';
        
        if (connectionType === 'control-flow') {
            strokeColor = '#ff9500';
            markerEnd = 'url(#arrowhead-orange)';
        }
        
        path.setAttribute('d', pathData);
        path.setAttribute('stroke', strokeColor);
        path.setAttribute('stroke-width', '3');
        path.setAttribute('fill', 'none');
        path.setAttribute('marker-end', markerEnd);
        path.setAttribute('class', 'connection');
        path.setAttribute('data-edge-id', edge.id);
        path.setAttribute('data-source-node', edge.sourceNodeId);
        path.style.cursor = 'pointer';
        
        // ホバーエフェクト
        path.addEventListener('mouseenter', () => {
            path.setAttribute('stroke-width', '5');
        });
        
        path.addEventListener('mouseleave', () => {
            path.setAttribute('stroke-width', '3');
        });
        
        // ダブルクリックで削除確認
        path.addEventListener('dblclick', () => {
            this.showConnectionDeleteDialog([edge]);
        });
        
        // 右クリックメニューで削除オプション
        path.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showConnectionContextMenu(e, [edge]);
        });
        
        svg.appendChild(path);
    }
    
    // 基本座標を受け取って描画（扇形分散用）
    drawSingleConnectionWithBaseCoords(edge, angleOffset, baseStartX, baseStartY) {
        const targetNode = document.getElementById(`voidflow-node-${edge.targetNodeId}`);
        if (!targetNode) return;
        
        const targetPort = targetNode.querySelector('.input-port');
        if (!targetPort) return;
        
        const svg = document.getElementById('connectionSvg');
        this.ensureMarkers(svg);
        
        const canvasRect = document.querySelector('.canvas-area').getBoundingClientRect();
        const targetRect = targetPort.getBoundingClientRect();
        
        let startX = baseStartX;
        let startY = baseStartY;
        const endX = targetRect.left + targetRect.width/2 - canvasRect.left;
        const endY = targetRect.top + targetRect.height/2 - canvasRect.top;
        
        // 角度オフセットを適用（共通基本座標から）
        if (angleOffset !== 0) {
            const offsetDistance = 10; // 距離をさらに近づける
            const radians = (angleOffset * Math.PI) / 180;
            
            // 水平方向（右向き）を0度として、角度に応じて上下に分散
            const offsetX = Math.cos(radians) * offsetDistance; // 水平方向成分
            const offsetY = Math.sin(radians) * offsetDistance; // 垂直方向成分（負で上、正で下）
            
            startX += offsetX;
            startY += offsetY;
            
            voidFlowEngine.log(`🔄 オフセット適用: ${Math.round(offsetX) >= 0 ? '+' : ''}${Math.round(offsetX)}, ${Math.round(offsetY) >= 0 ? '+' : ''}${Math.round(offsetY)} → (${Math.round(startX)}, ${Math.round(startY)})`);
        }
        
        // ベジェ曲線で美しい接続線
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const controlOffset = Math.abs(endX - startX) * 0.5;
        const pathData = `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`;
        
        // 接続タイプに応じて色と矢印を変更
        const connectionType = edge.connectionType || 'data-flow';
        let strokeColor = '#4a90e2';
        let markerEnd = 'url(#arrowhead)';
        
        if (connectionType === 'control-flow') {
            strokeColor = '#ff9500';
            markerEnd = 'url(#arrowhead-orange)';
        }
        
        path.setAttribute('d', pathData);
        path.setAttribute('stroke', strokeColor);
        path.setAttribute('stroke-width', '3');
        path.setAttribute('fill', 'none');
        path.setAttribute('marker-end', markerEnd);
        path.setAttribute('class', 'connection');
        path.setAttribute('data-edge-id', edge.id);
        path.setAttribute('data-source-node', edge.sourceNodeId);
        path.style.cursor = 'pointer';
        
        // ホバーエフェクト
        path.addEventListener('mouseenter', () => {
            path.setAttribute('stroke-width', '5');
        });
        
        path.addEventListener('mouseleave', () => {
            path.setAttribute('stroke-width', '3');
        });
        
        // ダブルクリックで削除確認
        path.addEventListener('dblclick', () => {
            this.showConnectionDeleteDialog([edge]);
        });
        
        // 右クリックメニューで削除オプション
        path.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showConnectionContextMenu(e, [edge]);
        });
        
        svg.appendChild(path);
    }
    
    // 束ね太線描画
    drawBundledConnection(sourceNodeId, connections) {
        const sourceNode = document.getElementById(`voidflow-node-${sourceNodeId}`);
        if (!sourceNode) {
            voidFlowEngine.log(`❌ 束ね線描画失敗: ノード ${sourceNodeId} が見つかりません`);
            return;
        }
        
        const sourcePort = sourceNode.querySelector('.output-port');
        if (!sourcePort) {
            voidFlowEngine.log(`❌ 束ね線描画失敗: ポートが見つかりません`);
            return;
        }
        
        const canvasRect = document.querySelector('.canvas-area').getBoundingClientRect();
        
        // ノードの実際の位置をデバッグ
        const nodeStyle = window.getComputedStyle(sourceNode);
        voidFlowEngine.log(`🔍 ノード位置: left=${nodeStyle.left}, top=${nodeStyle.top}`);
        
        const sourceRect = sourcePort.getBoundingClientRect();
        const startX = sourceRect.left + sourceRect.width/2 - canvasRect.left;
        const startY = sourceRect.top + sourceRect.height/2 - canvasRect.top;
        
        voidFlowEngine.log(`🔍 Rect座標: left=${sourceRect.left}, top=${sourceRect.top}`);
        
        // 束ね線の終点（最初のターゲットノードまで）
        const firstTarget = connections[0];
        const targetNode = document.getElementById(`voidflow-node-${firstTarget.targetNodeId}`);
        const targetPort = targetNode ? targetNode.querySelector('.input-port') : null;
        
        let endX, endY;
        if (targetPort) {
            const targetRect = targetPort.getBoundingClientRect();
            endX = targetRect.left + targetRect.width/2 - canvasRect.left;
            endY = targetRect.top + targetRect.height/2 - canvasRect.top;
            voidFlowEngine.log(`🎯 束ね線ターゲット: (${Math.round(endX)}, ${Math.round(endY)})`);
        } else {
            // フォールバック: 右側に150px
            endX = startX + 150;
            endY = startY;
            voidFlowEngine.log(`⚠️ ターゲット見つからず、固定長使用`);
        }
        
        voidFlowEngine.log(`🔄 束ね線移動: (${Math.round(startX)}, ${Math.round(startY)}) → (${Math.round(endX)}, ${Math.round(endY)})`);
        
        const svg = document.getElementById('connectionSvg');
        this.ensureMarkers(svg);
        
        // 束ね線を描画
        const bundlePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const pathData = `M ${startX} ${startY} L ${endX} ${endY}`;
        
        // 接続数に応じて線の太さと色を変更
        const connectionCount = connections.length;
        const strokeWidth = Math.min(3 + connectionCount, 12); // 最大12px
        const intensity = Math.min(connectionCount / 10, 1); // 最大1.0
        const strokeColor = `rgb(${74 + intensity * 100}, ${144}, ${226})`;
        
        bundlePath.setAttribute('d', pathData);
        bundlePath.setAttribute('stroke', strokeColor);
        bundlePath.setAttribute('stroke-width', strokeWidth);
        bundlePath.setAttribute('fill', 'none');
        bundlePath.setAttribute('marker-end', 'url(#arrowhead)');
        bundlePath.setAttribute('class', 'bundled-connection');
        bundlePath.setAttribute('data-bundled-source', sourceNodeId);
        bundlePath.style.cursor = 'pointer';
        
        // ダブルクリックで束ね線内の全接続削除確認
        bundlePath.addEventListener('dblclick', () => {
            this.showConnectionDeleteDialog(connections);
        });
        
        // 接続数ラベル
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', startX + 75); // ラベル位置を線の中央に
        label.setAttribute('y', startY - 10);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('fill', '#ffffff');
        label.setAttribute('font-size', '12');
        label.setAttribute('font-weight', 'bold');
        label.setAttribute('data-bundled-source', sourceNodeId);
        label.textContent = `(${connectionCount})`;
        
        svg.appendChild(bundlePath);
        svg.appendChild(label);
        
        // デバッグ: SVGの実際の内容を確認
        const allBundledElements = svg.querySelectorAll(`[data-bundled-source="${sourceNodeId}"]`);
        voidFlowEngine.log(`🔍 SVG内要素数: ${allBundledElements.length}`);
        allBundledElements.forEach((element, index) => {
            if (element.tagName === 'path') {
                voidFlowEngine.log(`📍 Path${index}: ${element.getAttribute('d')}`);
            } else if (element.tagName === 'text') {
                voidFlowEngine.log(`📝 Text${index}: (${element.getAttribute('x')}, ${element.getAttribute('y')}) "${element.textContent}"`);
            }
        });
        
        // SVG強制再描画
        svg.style.display = 'none';
        svg.offsetHeight; // 強制再フロー
        svg.style.display = 'block';
    }
    
    // 接続削除確認ダイアログ
    showConnectionDeleteDialog(connections) {
        voidFlowEngine.log(`🗑️ 削除確認ダイアログ: ${connections.length}本の接続`);
        
        const modal = this.createDeleteModal(connections);
        document.body.appendChild(modal);
        
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 10);
    }
    
    createDeleteModal(connections) {
        const modal = document.createElement('div');
        modal.className = 'connection-delete-modal';
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.9);
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border: 2px solid #ff4444;
            border-radius: 12px;
            padding: 20px;
            width: 400px;
            max-height: 400px;
            overflow-y: auto;
            z-index: 10000;
            opacity: 0;
            transition: all 0.3s ease;
            color: #ffffff;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        `;
        
        // タイトル
        const title = document.createElement('h3');
        title.textContent = `🗑️ 接続削除確認 (${connections.length}本)`;
        title.style.cssText = `
            margin: 0 0 15px 0;
            color: #ff4444;
            font-size: 16px;
            text-align: center;
        `;
        modal.appendChild(title);
        
        // 接続リスト
        const connectionList = document.createElement('div');
        connectionList.style.cssText = `
            max-height: 250px;
            overflow-y: auto;
            margin-bottom: 20px;
        `;
        
        const checkboxes = [];
        
        connections.forEach((connection, index) => {
            const sourceNode = voidFlowEngine.nodes.get(connection.sourceNodeId);
            const targetNode = voidFlowEngine.nodes.get(connection.targetNodeId);
            
            const item = document.createElement('div');
            item.style.cssText = `
                background: rgba(255, 68, 68, 0.1);
                border: 1px solid #ff4444;
                border-radius: 6px;
                padding: 10px;
                margin-bottom: 8px;
                font-size: 12px;
                display: flex;
                align-items: center;
                gap: 10px;
            `;
            
            // チェックボックス（複数接続の場合のみ）
            let checkboxHtml = '';
            if (connections.length > 1) {
                checkboxHtml = `
                    <input type="checkbox" id="conn-${index}" checked 
                           style="transform: scale(1.2); cursor: pointer;">
                `;
            }
            
            item.innerHTML = `
                ${checkboxHtml}
                <div style="flex: 1;">
                    <div style="font-weight: bold; margin-bottom: 5px;">
                        接続 ${index + 1}: ${sourceNode.type} → ${targetNode.type}
                    </div>
                    <div style="color: #ccc; font-size: 10px;">
                        ${connection.sourceNodeId} → ${connection.targetNodeId}
                    </div>
                </div>
            `;
            
            connectionList.appendChild(item);
            
            if (connections.length > 1) {
                const checkbox = item.querySelector('input[type="checkbox"]');
                checkboxes.push(checkbox);
            }
        });
        
        // 全選択/全解除ボタン（複数接続の場合のみ）
        if (connections.length > 1) {
            const selectAllArea = document.createElement('div');
            selectAllArea.style.cssText = `
                margin-bottom: 10px;
                text-align: center;
                border-bottom: 1px solid #444;
                padding-bottom: 10px;
            `;
            
            const selectAllBtn = document.createElement('button');
            selectAllBtn.textContent = '✅ 全選択';
            selectAllBtn.style.cssText = `
                background: #4a90e2;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 5px 10px;
                cursor: pointer;
                margin-right: 10px;
                font-size: 10px;
            `;
            
            const deselectAllBtn = document.createElement('button');
            deselectAllBtn.textContent = '❌ 全解除';
            deselectAllBtn.style.cssText = `
                background: #666;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 5px 10px;
                cursor: pointer;
                font-size: 10px;
            `;
            
            selectAllBtn.onclick = () => {
                checkboxes.forEach(cb => cb.checked = true);
            };
            
            deselectAllBtn.onclick = () => {
                checkboxes.forEach(cb => cb.checked = false);
            };
            
            selectAllArea.appendChild(selectAllBtn);
            selectAllArea.appendChild(deselectAllBtn);
            connectionList.insertBefore(selectAllArea, connectionList.firstChild);
        }
        
        modal.appendChild(connectionList);
        
        // ボタンエリア
        const buttonArea = document.createElement('div');
        buttonArea.style.cssText = `
            display: flex;
            gap: 10px;
            justify-content: center;
        `;
        
        // 削除ボタン
        const deleteButton = document.createElement('button');
        
        const updateDeleteButtonText = () => {
            if (connections.length === 1) {
                deleteButton.textContent = '🗑️ この接続を削除';
            } else {
                const checkedCount = checkboxes.filter(cb => cb.checked).length;
                deleteButton.textContent = `🗑️ 選択した${checkedCount}本を削除`;
            }
        };
        
        updateDeleteButtonText();
        
        deleteButton.style.cssText = `
            background: linear-gradient(145deg, #ff4444, #cc0000);
            color: white;
            border: none;
            border-radius: 6px;
            padding: 10px 20px;
            cursor: pointer;
            font-family: inherit;
            font-size: 12px;
            font-weight: bold;
        `;
        
        // チェックボックス変更時にボタンテキスト更新
        if (connections.length > 1) {
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', updateDeleteButtonText);
            });
        }
        
        deleteButton.onclick = () => {
            let connectionsToDelete;
            
            if (connections.length === 1) {
                // 単一接続: そのまま削除
                connectionsToDelete = connections;
            } else {
                // 複数接続: チェックされたもののみ削除
                connectionsToDelete = connections.filter((connection, index) => {
                    const checkbox = modal.querySelector(`#conn-${index}`);
                    return checkbox ? checkbox.checked : true;
                });
            }
            
            if (connectionsToDelete.length === 0) {
                voidFlowEngine.log('❌ 削除対象が選択されていません');
                return;
            }
            
            this.deleteConnections(connectionsToDelete);
            document.body.removeChild(modal);
        };
        
        // キャンセルボタン
        const cancelButton = document.createElement('button');
        cancelButton.textContent = '❌ キャンセル';
        cancelButton.style.cssText = `
            background: linear-gradient(145deg, #666, #444);
            color: white;
            border: none;
            border-radius: 6px;
            padding: 10px 20px;
            cursor: pointer;
            font-family: inherit;
            font-size: 12px;
            font-weight: bold;
        `;
        
        cancelButton.onclick = () => {
            document.body.removeChild(modal);
        };
        
        buttonArea.appendChild(deleteButton);
        buttonArea.appendChild(cancelButton);
        modal.appendChild(buttonArea);
        
        // 背景クリックで閉じる
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        return modal;
    }
    
    // 接続削除実行
    deleteConnections(connections) {
        connections.forEach(connection => {
            voidFlowEngine.log(`🗑️ 接続削除実行: ${connection.sourceNodeId} → ${connection.targetNodeId}`);
            voidFlowEngine.edges.delete(connection.id);
        });
        
        // 削除後に再描画
        const sourceNodeIds = new Set(connections.map(c => c.sourceNodeId));
        sourceNodeIds.forEach(sourceNodeId => {
            this.redrawConnectionsFromNode(sourceNodeId);
        });
        
        voidFlowEngine.log(`✅ ${connections.length}本の接続を削除完了`);
    }

    // 右クリックコンテキストメニュー表示
    showConnectionContextMenu(event, connections) {
        // 既存のコンテキストメニューを削除
        const existingMenu = document.getElementById('connection-context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        // コンテキストメニュー作成
        const menu = document.createElement('div');
        menu.id = 'connection-context-menu';
        menu.style.cssText = `
            position: fixed;
            left: ${event.clientX}px;
            top: ${event.clientY}px;
            background: rgba(26, 26, 46, 0.95);
            border: 1px solid #4a90e2;
            border-radius: 8px;
            padding: 8px 0;
            z-index: 10000;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
            min-width: 160px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 12px;
            backdrop-filter: blur(10px);
        `;

        // 削除オプション
        const deleteOption = document.createElement('div');
        deleteOption.innerHTML = `
            <div style="
                padding: 8px 16px;
                color: #ff6b6b;
                cursor: pointer;
                transition: background-color 0.2s;
            " class="menu-item">
                🗑️ 接続を削除
            </div>
        `;
        deleteOption.addEventListener('click', () => {
            this.showConnectionDeleteDialog(connections);
            menu.remove();
        });
        deleteOption.addEventListener('mouseenter', () => {
            deleteOption.firstElementChild.style.backgroundColor = 'rgba(255, 107, 107, 0.1)';
        });
        deleteOption.addEventListener('mouseleave', () => {
            deleteOption.firstElementChild.style.backgroundColor = 'transparent';
        });

        // 情報表示オプション
        const infoOption = document.createElement('div');
        infoOption.innerHTML = `
            <div style="
                padding: 8px 16px;
                color: #4a90e2;
                cursor: pointer;
                transition: background-color 0.2s;
            " class="menu-item">
                ℹ️ 接続情報
            </div>
        `;
        infoOption.addEventListener('click', () => {
            this.showConnectionInfo(connections);
            menu.remove();
        });
        infoOption.addEventListener('mouseenter', () => {
            infoOption.firstElementChild.style.backgroundColor = 'rgba(74, 144, 226, 0.1)';
        });
        infoOption.addEventListener('mouseleave', () => {
            infoOption.firstElementChild.style.backgroundColor = 'transparent';
        });

        menu.appendChild(deleteOption);
        menu.appendChild(infoOption);
        document.body.appendChild(menu);

        // 外部クリックでメニューを閉じる
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 100);
    }

    // 接続情報表示
    showConnectionInfo(connections) {
        const connection = connections[0];
        const sourceNode = document.getElementById(`voidflow-node-${connection.sourceNodeId}`);
        const targetNode = document.getElementById(`voidflow-node-${connection.targetNodeId}`);
        
        const sourceType = sourceNode?.dataset.nodeType || 'unknown';
        const targetType = targetNode?.dataset.nodeType || 'unknown';
        
        const info = `
            🔗 接続情報:
            
            ソース: ${sourceType} (${connection.sourceNodeId})
            ターゲット: ${targetType} (${connection.targetNodeId})
            接続ID: ${connection.id}
            作成時間: ${new Date(connection.created || Date.now()).toLocaleString()}
        `;
        
        voidFlowEngine.log(info);
        
        // 簡単な通知表示
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: rgba(74, 144, 226, 0.9);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 12px;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            max-width: 300px;
            white-space: pre-line;
        `;
        notification.textContent = info;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }
}

// グローバル接続マネージャー
const connectionManager = new ConnectionManager();
window.connectionManager = connectionManager;

// エクスポート削除 - VoidCoreConnectionManagerを使用

// 接続線を再描画（互換性のため）
function redrawConnection(edge) {
    connectionManager.redrawConnectionsFromNode(edge.sourceNodeId);
};