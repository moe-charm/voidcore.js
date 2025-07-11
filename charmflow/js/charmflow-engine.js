// CharmFlow Engine - ヘッドレス型フロー実行エンジン
import { VoidCore, Message } from '../../src/index.js';

export class CharmFlowEngine {
    constructor() {
        this.nodes = new Map();
        this.edges = new Map();
        this.executionState = new Map();
        this.nodeCounter = 0;
        this.selectedNode = null;
        
        // Phase 5.1: Monaco Editor integration
        this.monacoIntegration = null;
        this.isMonacoInitialized = false;
        
        // Phase R Integration: Universal Node Integration
        this.universalIntegration = null;
        this.initializeUniversalIntegration();
    }

    // Phase R Integration: Universal Node Integration初期化
    async initializeUniversalIntegration() {
        try {
            // 一時的に無効化 - 基本機能テスト優先
            this.log('🔄 Universal Node Integration 一時無効化 (基本機能テスト優先)');
            
            // TODO: 基本機能確認後に復活
            // const { UniversalNodeIntegration, createVoidFlowIntegrationConfig } = await import('../../src/universal-node-integration.js');
            // const config = createVoidFlowIntegrationConfig(this);
            // this.universalIntegration = new UniversalNodeIntegration(config);
            // await this.universalIntegration.initialize();
            // this.log('🔗 Universal Node Integration 初期化完了');
        } catch (error) {
            this.log(`❌ Universal Node Integration 初期化失敗: ${error.message}`);
            console.error('詳細エラー:', error);
        }
    }

    // ノード作成
    createNode(type, position) {
        const nodeId = `node-${++this.nodeCounter}`;
        const node = {
            id: nodeId,
            type: type,
            position: position,
            properties: {},
            inputs: this.getInputPorts(type),
            outputs: this.getOutputPorts(type)
        };

        this.nodes.set(nodeId, node);
        this.executionState.set(nodeId, { status: 'waiting', result: null });
        return node;
    }

    // ノードタイプ別のポート定義
    getInputPorts(type) {
        const portDefs = {
            'button.send': [],
            'input.text': [{ id: 'trigger', name: 'Trigger', dataType: 'signal' }],
            'string.uppercase': [{ id: 'input', name: 'Text', dataType: 'string' }],
            'output.console': [{ id: 'input', name: 'Data', dataType: 'any' }],
            'web.fetch': [{ id: 'trigger', name: 'Trigger', dataType: 'signal' }],
            'json.parser': [{ id: 'input', name: 'JSON', dataType: 'string' }],
            'ui.card': [{ id: 'input', name: 'Data', dataType: 'any' }],
            'core.plugin-lister': [{ id: 'trigger', name: 'Trigger', dataType: 'signal' }],
            'core.connection-manager': [
                { id: 'connect-request', name: 'Connect Request', dataType: 'object' },
                { id: 'disconnect-request', name: 'Disconnect Request', dataType: 'object' }
            ],
            'flow.connector': [
                { id: 'plugin-list', name: 'Plugin List', dataType: 'array' },
                { id: 'source-node', name: 'Source Node ID', dataType: 'string' },
                { id: 'target-node', name: 'Target Node ID', dataType: 'string' }
            ]
        };
        return portDefs[type] || [];
    }

    getOutputPorts(type) {
        const portDefs = {
            'button.send': [{ id: 'signal', name: 'Signal', dataType: 'signal' }],
            'input.text': [{ id: 'output', name: 'Text', dataType: 'string' }],
            'string.uppercase': [{ id: 'output', name: 'Result', dataType: 'string' }],
            'output.console': [],
            'web.fetch': [{ id: 'output', name: 'Response', dataType: 'string' }],
            'json.parser': [{ id: 'output', name: 'Parsed', dataType: 'any' }],
            'ui.card': [],
            'core.plugin-lister': [{ id: 'output', name: 'Plugin List', dataType: 'array' }],
            'core.connection-manager': [{ id: 'result', name: 'Operation Result', dataType: 'object' }],
            'flow.connector': [{ id: 'output', name: 'Connection Result', dataType: 'object' }]
        };
        return portDefs[type] || [];
    }

    // エッジ（接続）作成
    createEdge(sourceNodeId, sourcePortId, targetNodeId, targetPortId) {
        const edgeId = `edge-${Date.now()}`;
        const edge = {
            id: edgeId,
            sourceNodeId,
            sourcePortId,
            targetNodeId,
            targetPortId
        };

        this.edges.set(edgeId, edge);
        return edge;
    }

    // VoidPacket クラス
    createVoidPacket(payload, metadata = {}) {
        return {
            payload: payload,
            timestamp: new Date(),
            sourceNodeId: metadata.sourceNodeId || null,
            error: metadata.error || null
        };
    }

    // ログ出力
    log(message) {
        const logElement = document.getElementById('executionLog');
        if (logElement) {
            logElement.innerHTML += `${message}<br>`;
            logElement.scrollTop = logElement.scrollHeight;
        }
        console.log(`🌟 VoidFlow: ${message}`);
    }

    // ノード状態設定
    setNodeStatus(nodeId, status) {
        const state = this.executionState.get(nodeId);
        if (state) {
            state.status = status;
        }
        
        // UI更新
        const nodeElement = document.getElementById(`voidflow-node-${nodeId}`);
        if (nodeElement) {
            nodeElement.className = `voidflow-node ${status}`;
        }
    }

    // ノード出力更新
    updateNodeOutput(nodeId, content, htmlContent = null) {
        const outputElement = document.getElementById(`node-output-${nodeId}`);
        if (outputElement) {
            if (htmlContent) {
                outputElement.innerHTML = htmlContent;
            } else {
                outputElement.textContent = content;
            }
        }
    }

    // UIカードHTML生成
    createCardHtml(title, data) {
        let content = '';
        if (typeof data === 'object') {
            content = Object.entries(data).map(([key, value]) => 
                `<div style="margin: 4px 0;"><strong>${key}:</strong> ${value}</div>`
            ).join('');
        } else {
            content = String(data);
        }
        
        return `
            <div style="background: rgba(74, 144, 226, 0.1); border: 1px solid #4a90e2; border-radius: 6px; padding: 8px; margin: 4px 0;">
                <div style="font-weight: bold; color: #4a90e2; margin-bottom: 4px;">${title}</div>
                <div style="font-size: 10px; color: #ccc;">${content}</div>
            </div>
        `;
    }
}