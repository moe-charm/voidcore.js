// VoidFlow Execute Engine - ノード実行専用モジュール
export class ExecuteEngine {
    constructor(flowEngine) {
        this.flowEngine = flowEngine;
    }

    // ノード実行のメインメソッド
    async executeNode(nodeId, inputPacket = null) {
        const node = this.flowEngine.nodes.get(nodeId);
        if (!node) return null;

        this.flowEngine.setNodeStatus(nodeId, 'executing');
        
        try {
            let result;
            
            // Phase 5.1: Check for custom plugin code first
            if (this.flowEngine.customPluginCodes && this.flowEngine.customPluginCodes.has(node.type)) {
                result = await this.executeCustomPlugin(node, nodeId, inputPacket);
            } else {
                // Default plugin execution
                result = await this.executeDefaultPlugin(node, nodeId, inputPacket);
            }

            this.flowEngine.setNodeStatus(nodeId, 'success');
            
            // 接続された次のノードを自動実行
            await this.executeConnectedNodes(nodeId, result);
            
            return result;
        } catch (error) {
            this.flowEngine.log(`❌ ノード実行失敗 [${nodeId}]: ${error.message}`);
            this.flowEngine.updateNodeOutput(nodeId, `❌ エラー: ${error.message}`);
            this.flowEngine.setNodeStatus(nodeId, 'error');
            return this.flowEngine.createVoidPacket(null, { sourceNodeId: nodeId, error: error.message });
        }
    }

    // カスタムプラグイン実行
    async executeCustomPlugin(node, nodeId, inputPacket) {
        try {
            const customCode = this.flowEngine.customPluginCodes.get(node.type);
            const self = this.flowEngine;
            
            const customFunction = function(inputPacket, nodeId) {
                let result;
                
                // Make VoidFlowEngine methods available
                const updateNodeOutput = (id, content) => self.updateNodeOutput(id, content);
                const createVoidPacket = (data, meta) => self.createVoidPacket(data, meta);
                const log = (msg) => self.log(msg);
                
                // Execute custom plugin code
                eval(customCode);
                
                return result;
            };
            
            const result = customFunction(inputPacket, nodeId);
            this.flowEngine.log(`🎨 Custom plugin executed: ${node.type}`);
            return result;
            
        } catch (error) {
            this.flowEngine.log(`❌ Custom plugin error in ${node.type}: ${error.message}`);
            this.flowEngine.updateNodeOutput(nodeId, `❌ Custom plugin error: ${error.message}`);
            return this.flowEngine.createVoidPacket(null, { sourceNodeId: nodeId, error: error.message });
        }
    }

    // デフォルトプラグイン実行
    async executeDefaultPlugin(node, nodeId, inputPacket) {
        let result;

        switch (node.type) {
            case 'button.send':
                result = this.flowEngine.createVoidPacket('signal', { sourceNodeId: nodeId });
                this.flowEngine.updateNodeOutput(nodeId, `🚀 Signal送信完了`);
                this.flowEngine.log(`📡 Signal送信: 接続されたプラグインを刺激`);
                break;
                
            case 'input.text':
                if (inputPacket && inputPacket.payload === 'signal') {
                    const textValue = node.properties.text || 'Hello VoidFlow!';
                    result = this.flowEngine.createVoidPacket(textValue, { sourceNodeId: nodeId });
                    this.flowEngine.updateNodeOutput(nodeId, `📤 "${textValue}" (Trigger受信)`);
                    this.flowEngine.log(`📤 Input:Text実行: "${textValue}"`);
                } else {
                    throw new Error('Trigger signal required');
                }
                break;
                
            case 'string.uppercase':
                if (!inputPacket) throw new Error('Input required');
                const upperValue = String(inputPacket.payload).toUpperCase();
                result = this.flowEngine.createVoidPacket(upperValue, { sourceNodeId: nodeId });
                this.flowEngine.updateNodeOutput(nodeId, `🔄 "${inputPacket.payload}" → "${upperValue}"`);
                break;
                
            case 'output.console':
                if (!inputPacket) throw new Error('Input required');
                this.flowEngine.log(`🔥 Output: ${inputPacket.payload}`);
                console.log(`🌟 VoidFlow Console Output:`, inputPacket.payload);
                console.log(`📦 VoidPacket:`, inputPacket);
                result = this.flowEngine.createVoidPacket(inputPacket.payload, { sourceNodeId: nodeId });
                this.flowEngine.updateNodeOutput(nodeId, `📺 "${inputPacket.payload}" (→ブラウザコンソール)`);
                break;

            case 'web.fetch':
                result = await this.executeFetchNode(node, nodeId, inputPacket);
                break;

            case 'json.parser':
                result = await this.executeJsonParserNode(node, nodeId, inputPacket);
                break;

            case 'ui.card':
                result = await this.executeUiCardNode(node, nodeId, inputPacket);
                break;

            case 'core.plugin-lister':
                result = await this.executePluginListerNode(node, nodeId, inputPacket);
                break;

            case 'flow.connector':
                result = await this.executeFlowConnectorNode(node, nodeId, inputPacket);
                break;

            default:
                throw new Error(`Unknown node type: ${node.type}`);
        }

        return result;
    }

    // Web Fetch ノード実行
    async executeFetchNode(node, nodeId, inputPacket) {
        if (inputPacket && inputPacket.payload === 'signal') {
            const url = node.properties.url || 'https://httpbin.org/json';
            this.flowEngine.updateNodeOutput(nodeId, `🌐 取得中... ${url}`);
            
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                const data = await response.text();
                this.flowEngine.updateNodeOutput(nodeId, `✅ 成功 (${data.length}文字)`);
                this.flowEngine.log(`🌐 Fetch成功: ${url} → ${data.length}文字`);
                return this.flowEngine.createVoidPacket(data, { sourceNodeId: nodeId });
            } catch (error) {
                // CORS エラーの場合、モック データを返す
                if (error.message.includes('CORS') || error.message.includes('fetch')) {
                    this.flowEngine.log(`⚠️ CORS制限によりモックデータを使用: ${url}`);
                    const mockData = JSON.stringify({
                        message: "VoidFlow Demo Data",
                        timestamp: new Date().toISOString(),
                        source: "VoidFlow Mock API",
                        data: {
                            title: "創造性の永久機関",
                            version: "v14.0",
                            philosophy: "すべての存在は、メッセージで生まれ、メッセージで終わる"
                        }
                    });
                    this.flowEngine.updateNodeOutput(nodeId, `🎭 モックデータ (${mockData.length}文字)`);
                    return this.flowEngine.createVoidPacket(mockData, { sourceNodeId: nodeId });
                }
                throw new Error(`Fetch失敗: ${error.message}`);
            }
        } else {
            throw new Error('Trigger signal required');
        }
    }

    // JSON Parser ノード実行
    async executeJsonParserNode(node, nodeId, inputPacket) {
        if (!inputPacket) throw new Error('Input required');
        
        try {
            const jsonData = JSON.parse(inputPacket.payload);
            const path = node.properties.path || '';
            
            let extractedData = jsonData;
            if (path) {
                const pathParts = path.split('.');
                for (const part of pathParts) {
                    if (part && extractedData != null) {
                        extractedData = extractedData[part];
                    }
                }
            }
            
            this.flowEngine.updateNodeOutput(nodeId, `📊 解析完了: ${JSON.stringify(extractedData).substring(0, 50)}...`);
            this.flowEngine.log(`📊 JSON解析成功: パス "${path}" → ${typeof extractedData}`);
            return this.flowEngine.createVoidPacket(extractedData, { sourceNodeId: nodeId });
        } catch (error) {
            throw new Error(`JSON解析失敗: ${error.message}`);
        }
    }

    // UI Card ノード実行
    async executeUiCardNode(node, nodeId, inputPacket) {
        if (!inputPacket) throw new Error('Input required');
        
        const cardData = inputPacket.payload;
        const title = node.properties.title || 'VoidFlow Card';
        
        const cardHtml = this.flowEngine.createCardHtml(title, cardData);
        this.flowEngine.updateNodeOutput(nodeId, '', cardHtml);
        
        this.flowEngine.log(`🎨 UIカード表示: ${title}`);
        return this.flowEngine.createVoidPacket(cardData, { sourceNodeId: nodeId });
    }

    // Plugin Lister ノード実行
    async executePluginListerNode(node, nodeId, inputPacket) {
        this.flowEngine.log(`🔍 Plugin Lister受信: ${JSON.stringify(inputPacket)}`);
        
        if (inputPacket && inputPacket.payload === 'signal') {
            this.flowEngine.updateNodeOutput(nodeId, `🔍 VoidCore自己観測中...`);
            
            // 参照プラグイン: VoidCoreに問い合わせ
            const registeredPlugins = await this.flowEngine.handleCoreFunction('plugin-lister', {});
            
            this.flowEngine.updateNodeOutput(nodeId, `🌟 発見: ${registeredPlugins.length}個のプラグイン (参照型)`);
            this.flowEngine.log(`🔍 参照Plugin Lister実行: ${registeredPlugins.length}個のプラグインを発見`);
            this.flowEngine.log(`📋 発見されたプラグイン: ${registeredPlugins.map(p => p.type).join(', ')}`);
            
            return this.flowEngine.createVoidPacket(registeredPlugins, { sourceNodeId: nodeId });
        } else {
            throw new Error('Trigger signal required');
        }
    }

    // Flow Connector ノード実行
    async executeFlowConnectorNode(node, nodeId, inputPacket) {
        if (!inputPacket) throw new Error('Input required');
        
        this.flowEngine.updateNodeOutput(nodeId, `🔗 フロー自己編集実行中...`);
        
        const connectorResult = await this.flowEngine.executeFlowConnector(nodeId, inputPacket);
        
        this.flowEngine.updateNodeOutput(nodeId, `✨ 自己編集完了: ${connectorResult.action}`);
        this.flowEngine.log(`🔗 Flow Connector実行: ${connectorResult.action}`);
        
        return this.flowEngine.createVoidPacket(connectorResult, { sourceNodeId: nodeId });
    }

    // 接続されたノードを自動実行
    async executeConnectedNodes(sourceNodeId, sourceResult) {
        // sourceNodeIdから出ているエッジを探す
        const connectedEdges = [];
        for (const [edgeId, edge] of this.flowEngine.edges) {
            if (edge.sourceNodeId === sourceNodeId) {
                connectedEdges.push(edge);
            }
        }

        // 接続された各ノードを実行
        for (const edge of connectedEdges) {
            const targetNodeId = edge.targetNodeId;
            this.flowEngine.log(`🔗 接続実行: ${sourceNodeId} → ${targetNodeId}`);
            
            try {
                // 1秒待機してから実行（視覚的効果）
                setTimeout(async () => {
                    await this.executeNode(targetNodeId, sourceResult);
                }, 500);
            } catch (error) {
                this.flowEngine.log(`❌ 接続実行失敗: ${targetNodeId} - ${error.message}`);
            }
        }
    }
}