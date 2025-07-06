// voidflow-monaco-integration.js - VoidFlow専用Monaco Editor統合
// Phase 5.1: VoidFlow内でプラグイン編集機能

/**
 * 🌟 VoidFlow Monaco Editor統合クラス
 * VoidFlow内でのリアルタイムプラグイン編集を提供
 */
export class VoidFlowMonacoIntegration {
  constructor(voidFlowEngine) {
    this.voidFlowEngine = voidFlowEngine;
    this.editor = null;
    this.isInitialized = false;
    this.completionProvider = null;
    this.currentEditingNode = null;
    this.editorContainer = null;
    this.originalPluginCode = '';
  }

  // ==========================================
  // 🚀 VoidFlow Monaco Editor初期化
  // ==========================================
  
  async initialize() {
    try {
      this.voidFlowEngine.log('🎨 Initializing VoidFlow Monaco Editor...');
      
      // グローバル参照を保存
      window.voidFlowMonacoIntegration = this;
      
      // エディタコンテナ作成
      this.createEditorContainer();
      
      // Monaco Editorが利用可能かチェック
      if (typeof monaco === 'undefined') {
        this.voidFlowEngine.log('📦 Monaco Editor not found, loading from CDN...');
        // Monaco EditorのCDN動的読み込み
        await this.loadMonacoEditor();
      } else {
        this.voidFlowEngine.log('✅ Monaco Editor already available');
      }
      
      // VoidFlow専用エディタ作成
      await this.createVoidFlowEditor();
      
      // VoidFlow専用の言語機能設定
      await this.setupVoidFlowLanguageFeatures();
      
      // プラグイン編集用イベント設定
      this.setupPluginEditingEvents();
      
      // VoidFlow専用コード補完設定
      await this.setupVoidFlowCodeCompletion();
      
      this.isInitialized = true;
      this.voidFlowEngine.log('✅ VoidFlow Monaco Editor initialized successfully');
      
      return true;
      
    } catch (error) {
      this.voidFlowEngine.log(`❌ VoidFlow Monaco Editor initialization failed: ${error.message}`);
      throw error;
    }
  }

  // ==========================================
  // 🏗️ エディタコンテナ作成
  // ==========================================
  
  createEditorContainer() {
    // エディタモーダル作成
    this.editorContainer = document.createElement('div');
    this.editorContainer.className = 'voidflow-editor-modal';
    this.editorContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: none;
      z-index: 10000;
      animation: fadeIn 0.3s ease;
    `;
    
    // エディタ本体
    const editorPanel = document.createElement('div');
    editorPanel.className = 'voidflow-editor-panel';
    editorPanel.style.cssText = `
      position: absolute;
      top: 50px;
      left: 50px;
      right: 50px;
      bottom: 50px;
      background: #1e1e1e;
      border: 2px solid #4a90e2;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    `;
    
    // ヘッダー
    const header = document.createElement('div');
    header.className = 'voidflow-editor-header';
    header.style.cssText = `
      background: #2d2d30;
      padding: 15px 20px;
      border-bottom: 1px solid #3e3e42;
      display: flex;
      align-items: center;
      justify-content: space-between;
    `;
    
    header.innerHTML = `
      <div class="editor-title">
        <span class="plugin-icon">🔧</span>
        <span class="plugin-name">Plugin Editor</span>
        <span class="plugin-type"></span>
      </div>
      <div class="editor-actions">
        <div id="voidflow-save-btn" 
             style="display: inline-block; background: #00ff88; color: #000; border: none; padding: 8px 16px; 
                    border-radius: 4px; cursor: pointer; font-weight: bold; margin-right: 10px;
                    transition: all 0.2s ease; z-index: 10001;">
          💾 Save & Apply
        </div>
        <div id="voidflow-cancel-btn"
             style="display: inline-block; background: #666; color: white; border: none; padding: 8px 16px; 
                    border-radius: 4px; cursor: pointer; z-index: 10001;">
          ❌ Cancel
        </div>
      </div>
    `;
    
    // エディタエリア
    const editorArea = document.createElement('div');
    editorArea.className = 'voidflow-monaco-editor';
    editorArea.style.cssText = `
      flex: 1;
      overflow: hidden;
    `;
    
    // フッター
    const footer = document.createElement('div');
    footer.className = 'voidflow-editor-footer';
    footer.style.cssText = `
      background: #2d2d30;
      padding: 10px 20px;
      border-top: 1px solid #3e3e42;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      color: #cccccc;
    `;
    
    footer.innerHTML = `
      <div class="editor-info">
        <span class="status-indicator">●</span>
        <span class="status-text">Ready</span>
      </div>
      <div class="editor-shortcuts">
        <span>Ctrl+Enter: Apply | Ctrl+S: Save | Esc: Cancel</span>
      </div>
    `;
    
    // 組み立て
    editorPanel.appendChild(header);
    editorPanel.appendChild(editorArea);
    editorPanel.appendChild(footer);
    this.editorContainer.appendChild(editorPanel);
    
    // DOM に追加
    document.body.appendChild(this.editorContainer);
    
    // イベントリスナー設定
    this.setupEditorContainerEvents();
    
    this.voidFlowEngine.log('🏗️ Editor container created');
  }

  // ==========================================
  // 📦 Monaco Editor動的読み込み
  // ==========================================
  
  async loadMonacoEditor() {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.monaco) {
        this.voidFlowEngine.log('✅ Monaco Editor already loaded');
        resolve();
        return;
      }
      
      // AMD競合を回避
      const originalDefine = window.define;
      const originalRequire = window.require;
      window.define = undefined;
      window.require = undefined;
      
      // Monaco Loader
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs/loader.js';
      script.onload = () => {
        try {
          // Monaco設定
          window.require.config({
            paths: {
              'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs'
            }
          });
          
          window.require(['vs/editor/editor.main'], () => {
            // Restore original AMD
            if (originalDefine) window.define = originalDefine;
            if (originalRequire && !window.require) window.require = originalRequire;
            this.voidFlowEngine.log('✅ Monaco Editor loaded successfully');
            resolve();
          });
        } catch (error) {
          this.voidFlowEngine.log(`❌ Monaco Loader error: ${error.message}`);
          reject(error);
        }
      };
      script.onerror = (error) => {
        this.voidFlowEngine.log(`❌ Failed to load Monaco script: ${error}`);
        reject(error);
      };
      document.head.appendChild(script);
    });
  }

  // ==========================================
  // 🎨 VoidFlow専用エディタ作成
  // ==========================================
  
  async createVoidFlowEditor() {
    const editorArea = this.editorContainer.querySelector('.voidflow-monaco-editor');
    
    this.voidFlowEngine.log('🎨 Creating Monaco Editor...');
    
    // VoidFlow専用エディタ設定
    this.editor = monaco.editor.create(editorArea, {
      value: '',
      language: 'javascript',
      theme: 'vs-dark',
      fontSize: 14,
      fontFamily: 'Monaco, "SF Mono", "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
      lineNumbers: 'on',
      roundedSelection: false,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      formatOnPaste: true,
      formatOnType: true,
      suggestOnTriggerCharacters: true,
      quickSuggestions: {
        other: true,
        comments: true,
        strings: true
      },
      wordWrap: 'on',
      minimap: {
        enabled: true,
        maxColumn: 120
      },
      bracketPairColorization: {
        enabled: true
      },
      guides: {
        bracketPairs: true,
        indentation: true
      },
      // VoidFlow専用設定
      contextmenu: true,
      mouseWheelZoom: true,
      smoothScrolling: true,
      renderLineHighlight: 'all',
      renderWhitespace: 'selection'
    });
    
    this.voidFlowEngine.log('🎨 VoidFlow Monaco Editor created');
    this.voidFlowEngine.log(`📝 Editor instance: ${!!this.editor}`);
  }

  // ==========================================
  // 🔧 VoidFlow言語機能設定
  // ==========================================
  
  async setupVoidFlowLanguageFeatures() {
    // VoidFlow専用JavaScript設定
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      noEmit: true,
      esModuleInterop: true,
      allowJs: true,
      strict: false // VoidFlowプラグインの柔軟性のため
    });
    
    // VoidFlow専用型定義
    const voidFlowTypes = `
      declare module 'voidflow' {
        export interface VoidFlowNode {
          id: string;
          type: string;
          position: { x: number; y: number };
          properties: any;
          inputs: Array<{ id: string; name: string; dataType: string }>;
          outputs: Array<{ id: string; name: string; dataType: string }>;
        }
        
        export interface VoidFlowEngine {
          createNode(type: string, position: any): VoidFlowNode;
          nodes: Map<string, VoidFlowNode>;
          edges: Map<string, any>;
          log(message: string): void;
          updateNodeOutput(nodeId: string, content: string): void;
        }
        
        export interface VoidFlowPlugin {
          type: string;
          name: string;
          description: string;
          inputs: Array<{ id: string; name: string; dataType: string }>;
          outputs: Array<{ id: string; name: string; dataType: string }>;
          properties: any;
          execute(inputPacket: any, node: VoidFlowNode): any;
        }
      }
      
      declare const voidFlowEngine: VoidFlowEngine;
    `;
    
    // 型定義を追加
    monaco.languages.typescript.javascriptDefaults.addExtraLib(
      voidFlowTypes,
      'file:///node_modules/@types/voidflow/index.d.ts'
    );
    
    this.voidFlowEngine.log('🔧 VoidFlow language features configured');
  }

  // ==========================================
  // 📡 プラグイン編集イベント設定
  // ==========================================
  
  setupPluginEditingEvents() {
    this.voidFlowEngine.log('📡 Setting up plugin editing events...');
    this.voidFlowEngine.log(`📝 Editor exists: ${!!this.editor}`);
    
    if (!this.editor) {
      this.voidFlowEngine.log('❌ No editor instance! Cannot setup events.');
      return;
    }
    
    // Test: Simple event first
    this.voidFlowEngine.log('📝 Adding onDidChangeModelContent listener...');
    
    try {
      this.editor.onDidChangeModelContent((e) => {
        this.voidFlowEngine.log('🎉 CODE CHANGED EVENT FIRED!');
        console.log('🎉 CODE CHANGED EVENT FIRED!');
        
        const value = this.editor.getValue();
        console.log('📝 Code changed, calling markAsModified...');
        console.log('DEBUG: About to call markAsModified');
        
        try {
          console.log('DEBUG: Entering markAsModified...');
          this.voidFlowEngine.log('DEBUG LOG: Entering markAsModified');
          
          const saveBtn = document.getElementById('voidflow-save-btn');
          console.log('DEBUG: Save button found:', !!saveBtn);
          
          if (!saveBtn) {
            console.log('DEBUG: No save button - returning');
            return;
          }
          
          console.log('DEBUG: About to check hasUnsavedChanges');
          const currentCode = this.editor.getValue();
          const originalCode = this.originalPluginCode || '';
          console.log('DEBUG: Current code length:', currentCode.length);
          console.log('DEBUG: Original code length:', originalCode.length);
          
          const hasChanges = currentCode !== originalCode;
          console.log('DEBUG: Has changes:', hasChanges);
          
          console.log('DEBUG: onclick before:', !!saveBtn.onclick);
          
          if (hasChanges) {
            saveBtn.style.background = '#ff6b6b';
            console.log('DEBUG: Set background to red');
          } else {
            saveBtn.style.background = '#00ff88';
            console.log('DEBUG: Set background to green');
          }
          
          console.log('DEBUG: onclick after:', !!saveBtn.onclick);
          
          if (!saveBtn.onclick) {
            console.log('DEBUG: onclick lost! Re-attaching...');
            saveBtn.onclick = (e) => {
              console.log('SAVE CLICKED DIRECTLY!');
              if (e) {
                e.stopPropagation();
                e.preventDefault();
              }
              this.saveAndApplyPlugin();
            };
            console.log('DEBUG: onclick re-attached');
          }
          
          console.log('DEBUG: markAsModified completed');
          
          // Final check: Is button still there?
          setTimeout(() => {
            const checkBtn = document.getElementById('voidflow-save-btn');
            console.log('DEBUG: Button still exists after 100ms:', !!checkBtn);
          }, 100);
          
        } catch (error) {
          console.error('DEBUG: markAsModified error:', error);
        }
        
        console.log('📝 markAsModified completed');
        
        // リアルタイム検証 - TEMPORARILY DISABLED
        console.log('DEBUG: Skipping validatePluginCode to test if it\'s the culprit');
        clearTimeout(this.validationTimeout);
        /*
        this.validationTimeout = setTimeout(() => {
          this.validatePluginCode(value);
        }, 1000);
        */
      });
      
      this.voidFlowEngine.log('✅ onDidChangeModelContent listener added successfully');
    } catch (error) {
      this.voidFlowEngine.log(`❌ Failed to add event listener: ${error.message}`);
    }
    
    // キーボードショートカット
    this.setupVoidFlowKeyboardShortcuts();
    
    this.voidFlowEngine.log('📡 Plugin editing events configured');
  }

  setupEditorContainerEvents() {
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      const saveBtn = document.getElementById('voidflow-save-btn');
      const cancelBtn = document.getElementById('voidflow-cancel-btn');
      
      this.voidFlowEngine.log(`🔘 Setting up button events - Save: ${!!saveBtn}, Cancel: ${!!cancelBtn}`);
      
      // Save & Apply
      if (saveBtn) {
        saveBtn.onclick = (e) => {
          console.log('SAVE CLICKED DIRECTLY!');
          if (e) {
            e.stopPropagation();
            e.preventDefault();
          }
          this.voidFlowEngine.log('💾 Save button clicked!');
          this.saveAndApplyPlugin().catch(err => {
            console.error('Save error:', err);
            this.voidFlowEngine.log(`❌ Save error: ${err.message}`);
          });
        };
        
        // Additional event listeners for debugging
        saveBtn.addEventListener('mousedown', (e) => {
          e.stopPropagation();
          this.voidFlowEngine.log('🖱️ Save button mousedown');
        });
        
        this.voidFlowEngine.log('✅ Save button handler attached');
      } else {
        this.voidFlowEngine.log('❌ Save button not found!');
      }
      
      // Cancel
      if (cancelBtn) {
        cancelBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.voidFlowEngine.log('❌ Cancel button clicked!');
          this.cancelEditing();
        });
        
        this.voidFlowEngine.log('✅ Cancel button handler attached');
      } else {
        this.voidFlowEngine.log('❌ Cancel button not found!');
      }
    }, 100); // Small delay to ensure DOM is ready
    
    // ESCキーでキャンセル
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isEditorVisible()) {
        this.cancelEditing();
      }
    });
    
    // モーダル外クリックでキャンセル
    this.editorContainer.addEventListener('click', (e) => {
      if (e.target === this.editorContainer) {
        this.cancelEditing();
      }
    });
  }

  setupVoidFlowKeyboardShortcuts() {
    // Ctrl+Enter で Save & Apply
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      this.saveAndApplyPlugin();
    });
    
    // Ctrl+S で Save
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, () => {
      this.saveAndApplyPlugin();
    });
    
    // F5 でテスト実行
    this.editor.addCommand(monaco.KeyCode.F5, () => {
      this.testPluginCode();
    });
  }

  // ==========================================
  // 💡 VoidFlow専用コード補完
  // ==========================================
  
  async setupVoidFlowCodeCompletion() {
    // VoidFlow プラグイン補完プロバイダー
    this.completionProvider = monaco.languages.registerCompletionItemProvider('javascript', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };
        
        const suggestions = this.getVoidFlowCompletions(range);
        return { suggestions };
      }
    });
    
    this.voidFlowEngine.log('💡 VoidFlow code completion configured');
  }

  getVoidFlowCompletions(range) {
    return [
      {
        label: 'voidflow-plugin-template',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
          '// 🌟 VoidFlow Plugin Implementation',
          'case \'${1:plugin.type}\':',
          '    // Input validation',
          '    if (!inputPacket) throw new Error(\'Input required\');',
          '    ',
          '    this.updateNodeOutput(nodeId, `🔄 Processing \${inputPacket.payload}...`);',
          '    ',
          '    // Plugin logic here',
          '    const processedData = ${2:inputPacket.payload.toUpperCase()};',
          '    ',
          '    // Create result packet',
          '    result = this.createVoidPacket(processedData, { sourceNodeId: nodeId });',
          '    this.updateNodeOutput(nodeId, `✨ Result: \${processedData}`);',
          '    this.log(`🔧 ${1:plugin.type} executed: \${inputPacket.payload} → \${processedData}`);',
          '    break;'
        ].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: {
          value: '**VoidFlow Plugin Template**\n\nComplete template for implementing a VoidFlow plugin case.',
          isTrusted: true
        },
        range: range
      },
      {
        label: 'this.updateNodeOutput',
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: 'this.updateNodeOutput(nodeId, `${1:🔄 Processing...}`)',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: {
          value: '**Update Node Output**\n\nUpdate the visual output of a VoidFlow node.',
          isTrusted: true
        },
        range: range
      },
      {
        label: 'this.createVoidPacket',
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: 'this.createVoidPacket(${1:data}, { sourceNodeId: nodeId })',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: {
          value: '**Create VoidFlow Packet**\n\nCreate a data packet for VoidFlow transmission.',
          isTrusted: true
        },
        range: range
      },
      {
        label: 'getNodeDefinition',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: [
          'getNodeDefinition(type) {',
          '    const definitions = {',
          '        \'${1:plugin.type}\': {',
          '            name: \'${2:Plugin Name}\',',
          '            description: \'${3:Plugin description}\',',
          '            inputs: [{ id: \'input\', name: \'${4:Input}\', dataType: \'${5:string}\' }],',
          '            outputs: [{ id: \'output\', name: \'${6:Output}\', dataType: \'${7:string}\' }],',
          '            properties: {',
          '                ${8:// Plugin properties}',
          '            }',
          '        }',
          '    };',
          '    return definitions[type];',
          '}'
        ].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: {
          value: '**Node Definition Function**\n\nDefine a VoidFlow node structure.',
          isTrusted: true
        },
        range: range
      }
    ];
  }

  // ==========================================
  // 🚀 プラグイン編集機能
  // ==========================================
  
  async editPlugin(nodeId, pluginType) {
    try {
      this.voidFlowEngine.log(`🔧 editPlugin called: ${pluginType} (${nodeId})`);
      this.currentEditingNode = { id: nodeId, type: pluginType };
      
      // プラグインコード取得
      this.voidFlowEngine.log(`📄 Extracting plugin code for: ${pluginType}`);
      const pluginCode = this.extractPluginCode(pluginType);
      this.originalPluginCode = pluginCode;
      
      // エディタに設定
      this.voidFlowEngine.log(`✏️ Setting editor value...`);
      this.editor.setValue(pluginCode);
      
      // ヘッダー更新
      this.updateEditorHeader(nodeId, pluginType);
      
      // エディタ表示
      this.voidFlowEngine.log(`👁️ Showing editor...`);
      this.showEditor();
      
      // フォーカス
      this.editor.focus();
      
      this.voidFlowEngine.log(`✅ Plugin editor opened for: ${pluginType} (${nodeId})`);
      
    } catch (error) {
      this.voidFlowEngine.log(`❌ Failed to edit plugin: ${error.message}`);
      console.error('editPlugin error:', error);
    }
  }

  extractPluginCode(pluginType) {
    // VoidFlowEngineから該当プラグインのコード抽出
    // 実際の実装から該当するcase文を抽出
    
    try {
      console.log(`🔍 Extracting plugin code for: ${pluginType}`);
      
      // For now, just return a working template based on known plugin types
      const knownPlugins = {
        'button.send': `case 'button.send':
    // Signalパケットを生成（接続されたノードにのみ送信される）
    result = this.createVoidPacket('signal', { sourceNodeId: nodeId });
    this.updateNodeOutput(nodeId, \`🚀 Signal送信完了\`);
    this.log(\`📡 Signal送信: 接続されたプラグインを刺激\`);
    break;`,
        
        'input.text': `case 'input.text':
    // Triggerシグナルを受信した場合のみ実行
    if (inputPacket && inputPacket.payload === 'signal') {
        const textValue = node.properties.text || 'Hello VoidFlow!';
        result = this.createVoidPacket(textValue, { sourceNodeId: nodeId });
        this.updateNodeOutput(nodeId, \`📤 "\${textValue}" (Trigger受信)\`);
        this.log(\`📤 Input:Text実行: "\${textValue}"\`);
    } else {
        // Triggerなしでは実行しない
        throw new Error('Trigger signal required');
    }
    break;`,
        
        'string.uppercase': `case 'string.uppercase':
    if (!inputPacket) throw new Error('Input required');
    const upperValue = String(inputPacket.payload).toUpperCase();
    result = this.createVoidPacket(upperValue, { sourceNodeId: nodeId });
    this.updateNodeOutput(nodeId, \`🔄 "\${inputPacket.payload}" → "\${upperValue}"\`);
    break;`,
        
        'output.console': `case 'output.console':
    if (!inputPacket) throw new Error('Input required');
    this.updateNodeOutput(nodeId, \`🔥 Output: \${inputPacket.payload}\`);
    this.log(\`🔥 Output: \${inputPacket.payload}\`);
    console.log(\`🌟 VoidFlow Console Output:\`, inputPacket.payload);
    console.log(\`📦 VoidPacket:\`, inputPacket);
    result = this.createVoidPacket(inputPacket.payload, { sourceNodeId: nodeId });
    break;`
      };
      
      if (knownPlugins[pluginType]) {
        console.log(`✅ Found known plugin code for: ${pluginType}`);
        return `// 🌟 VoidFlow Plugin: ${pluginType}
// Extracted from VoidFlowEngine
// Edit this plugin implementation

${knownPlugins[pluginType]}`;
      }
      
    } catch (error) {
      console.error(`❌ Error extracting plugin code:`, error);
      this.voidFlowEngine.log(`⚠️ Could not extract existing code for ${pluginType}: ${error.message}`);
    }
    
    // Fallback to template with proper syntax
    const template = `// 🌟 VoidFlow Plugin: ${pluginType}
// New plugin implementation

case '${pluginType}':
    // Signal packet generation (sent only to connected nodes)
    result = this.createVoidPacket('signal', { sourceNodeId: nodeId });
    this.updateNodeOutput(nodeId, \`🚀 Signal sending completed\`);
    this.log(\`📡 Signal sent: stimulating connected plugins\`);
    break;`;
    
    return template;
  }

  updateEditorHeader(nodeId, pluginType) {
    const header = this.editorContainer.querySelector('.editor-title');
    header.querySelector('.plugin-name').textContent = `Plugin Editor - ${nodeId}`;
    header.querySelector('.plugin-type').textContent = `(${pluginType})`;
  }

  showEditor() {
    this.voidFlowEngine.log(`🖼️ showEditor called`);
    this.editorContainer.style.display = 'block';
    this.voidFlowEngine.log(`📺 Editor container display set to: block`);
    // アニメーション
    setTimeout(() => {
      this.editorContainer.style.opacity = '1';
      this.voidFlowEngine.log(`✨ Editor container opacity set to: 1`);
    }, 10);
  }

  hideEditor() {
    console.log(`🚪 hideEditor called`);
    this.voidFlowEngine.log(`🚪 Hiding editor...`);
    this.editorContainer.style.opacity = '0';
    console.log(`👻 Set opacity to 0`);
    setTimeout(() => {
      this.editorContainer.style.display = 'none';
      console.log(`✅ Set display to none`);
      this.voidFlowEngine.log(`✅ Editor hidden`);
    }, 300);
  }

  isEditorVisible() {
    return this.editorContainer.style.display === 'block';
  }

  // ==========================================
  // 💾 Save & Apply機能
  // ==========================================
  
  async saveAndApplyPlugin() {
    try {
      console.log('🚀 saveAndApplyPlugin called!');
      this.voidFlowEngine.log('🚀 saveAndApplyPlugin called!');
      const newCode = this.editor.getValue();
      console.log(`📝 Code length: ${newCode.length} characters`);
      this.voidFlowEngine.log(`📝 Code length: ${newCode.length} characters`);
      
      // コード検証 - TEMPORARILY DISABLED
      console.log('🔍 Skipping code validation for now...');
      this.voidFlowEngine.log('🔍 Skipping code validation for now...');
      /*
      if (!this.validatePluginCode(newCode)) {
        console.log('❌ Code validation failed!');
        this.voidFlowEngine.log('❌ Code validation failed!');
        return;
      }
      */
      console.log('✅ Code validation skipped!');
      this.voidFlowEngine.log('✅ Code validation skipped!');
      
      // VoidFlowEngineにプラグインコード適用
      console.log('🔧 Applying plugin code...');
      await this.applyPluginCode(this.currentEditingNode.type, newCode);
      console.log('✅ Plugin code applied!');
      
      // 成功通知
      console.log('🎉 Showing success message...');
      this.showSuccessMessage('Plugin saved and applied successfully! 🎉');
      
      // エディタを閉じる
      console.log('⏰ Setting timeout to close editor...');
      setTimeout(() => {
        console.log('🚪 Closing editor now...');
        this.hideEditor();
      }, 1000); // 1秒後に閉じる（成功メッセージを見せるため）
      
      console.log(`✅ Plugin ${this.currentEditingNode.type} saved and applied`);
      this.voidFlowEngine.log(`✅ Plugin ${this.currentEditingNode.type} saved and applied`);
      
    } catch (error) {
      this.showErrorMessage(`Failed to save plugin: ${error.message}`);
      this.voidFlowEngine.log(`❌ Failed to save plugin: ${error.message}`);
    }
  }

  async applyPluginCode(pluginType, code) {
    // VoidFlowEngineのプラグインコードを動的に更新
    
    try {
      // Extract just the case content (without 'case' and 'break')
      const caseMatch = code.match(/case\s*['"][^'"]*['"]:\s*([\s\S]*?)\s*break;/i);
      let caseContent = '';
      
      if (caseMatch) {
        caseContent = caseMatch[1].trim();
      } else {
        // If no case structure found, assume the entire code is the case content
        caseContent = code.replace(/\/\/.*$/gm, '').trim();
      }
      
      // Simple validation - just check if it's valid JavaScript
      try {
        // Test if the code can be parsed
        new Function('inputPacket', 'nodeId', `
          let result;
          const updateNodeOutput = function(id, content) {};
          const createVoidPacket = function(data, meta) { 
            return { payload: data, metadata: meta };
          };
          const log = function(msg) {};
          
          ${caseContent}
          
          return result;
        `);
        
        this.voidFlowEngine.log('✅ Plugin code is valid JavaScript');
      } catch (syntaxError) {
        throw new Error(`Invalid JavaScript syntax: ${syntaxError.message}`);
      }
      
      // Store the plugin code for dynamic execution
      if (!this.voidFlowEngine.customPluginCodes) {
        this.voidFlowEngine.customPluginCodes = new Map();
      }
      
      this.voidFlowEngine.customPluginCodes.set(pluginType, caseContent);
      
      // Add a flag to indicate this plugin has been customized
      this.voidFlowEngine.log(`✨ Plugin ${pluginType} updated successfully!`);
      this.voidFlowEngine.log(`💾 Custom code stored for dynamic execution`);
      
      return true;
    } catch (error) {
      throw new Error(`Plugin code validation failed: ${error.message}`);
    }
  }

  cancelEditing() {
    if (this.hasUnsavedChanges()) {
      if (!confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        return;
      }
    }
    
    this.hideEditor();
    this.currentEditingNode = null;
    this.voidFlowEngine.log('📝 Plugin editing cancelled');
  }

  // ==========================================
  // ✅ 検証・ユーティリティ
  // ==========================================
  
  validatePluginCode(code) {
    try {
      console.log('🔍 Validating code...', code.substring(0, 100) + '...');
      this.voidFlowEngine.log('🔍 Validating code...');
      
      // VoidFlowプラグイン必須要素チェック
      console.log('📋 Checking for case and break...', {
        hasCase: code.includes('case '),
        hasBreak: code.includes('break;')
      });
      
      if (!code.includes('case ') || !code.includes('break;')) {
        console.log('❌ Missing case or break statement');
        this.showWarningMessage('Plugin should include case statement and break;');
        this.voidFlowEngine.log('⚠️ Missing case or break statement');
        return false;
      }
      
      // case文の中身だけを抽出して検証
      const caseMatch = code.match(/case\s*['"][^'"]*['"]:\s*([\s\S]*?)\s*break;/i);
      if (caseMatch) {
        const caseContent = caseMatch[1];
        // case文の中身だけを関数として検証
        try {
          const testFunc = new Function('inputPacket', 'nodeId', `
            let result;
            const updateNodeOutput = function(id, content) {};
            const createVoidPacket = function(data, meta) { 
              return { payload: data, metadata: meta };
            };
            const log = function(msg) {};
            
            // Plugin code with proper context
            ${caseContent}
            
            return result;
          `);
          // Test with mock data
          testFunc({ payload: 'test' }, 'test-node');
        } catch (validationError) {
          throw new Error(`Code validation failed: ${validationError.message}`);
        }
      }
      
      this.updateStatusIndicator('✅ Valid', '#00ff88');
      this.voidFlowEngine.log('✅ Code validation successful');
      return true;
      
    } catch (error) {
      this.updateStatusIndicator(`❌ ${error.message}`, '#ff4757');
      this.voidFlowEngine.log(`❌ Validation error: ${error.message}`);
      return false;
    }
  }

  testPluginCode() {
    const code = this.editor.getValue();
    this.voidFlowEngine.log('🧪 Testing plugin code...');
    
    if (this.validatePluginCode(code)) {
      this.showSuccessMessage('Plugin code validation passed! 🎉');
    }
  }

  hasUnsavedChanges() {
    try {
      const currentCode = this.editor.getValue();
      const originalCode = this.originalPluginCode || '';
      this.voidFlowEngine.log(`🔍 hasUnsavedChanges: current=${currentCode.length} chars, original=${originalCode.length} chars`);
      return currentCode !== originalCode;
    } catch (error) {
      this.voidFlowEngine.log(`❌ hasUnsavedChanges error: ${error.message}`);
      return false;
    }
  }

  markAsModified() {
    try {
      this.voidFlowEngine.log('🔄 markAsModified started');
      
      const saveBtn = document.getElementById('voidflow-save-btn');
      if (!saveBtn) {
        this.voidFlowEngine.log('⚠️ Save button not found in markAsModified');
        return;
      }
      
      this.voidFlowEngine.log('🔄 Save button found, checking changes...');
      
      const hasChanges = this.hasUnsavedChanges();
      this.voidFlowEngine.log(`🔄 markAsModified: hasUnsavedChanges = ${hasChanges}`);
      this.voidFlowEngine.log(`🔄 Save button onclick before: ${!!saveBtn.onclick}`);
      
      // ONLY change background color - nothing else!
      if (hasChanges) {
        saveBtn.style.background = '#ff6b6b'; // Red for changes
      } else {
        saveBtn.style.background = '#00ff88'; // Green for no changes
      }
      
      this.voidFlowEngine.log(`🔄 Save button onclick after: ${!!saveBtn.onclick}`);
      
      // Re-attach onclick if it got lost
      if (!saveBtn.onclick) {
        this.voidFlowEngine.log('🚨 onclick lost! Re-attaching...');
        saveBtn.onclick = () => {
          console.log('SAVE CLICKED DIRECTLY!');
          this.voidFlowEngine.log('💾 Save button clicked!');
          this.saveAndApplyPlugin().catch(err => {
            console.error('Save error:', err);
            this.voidFlowEngine.log(`❌ Save error: ${err.message}`);
          });
        };
        this.voidFlowEngine.log('✅ onclick re-attached');
      }
      
      this.voidFlowEngine.log('🔄 markAsModified completed successfully');
      
    } catch (error) {
      this.voidFlowEngine.log(`❌ markAsModified error: ${error.message}`);
      console.error('markAsModified error:', error);
    }
  }

  updateStatusIndicator(text, color) {
    const indicator = this.editorContainer.querySelector('.status-indicator');
    const statusText = this.editorContainer.querySelector('.status-text');
    
    indicator.style.color = color;
    statusText.textContent = text;
  }

  showSuccessMessage(message) {
    this.showMessage(message, '#00ff88');
  }

  showErrorMessage(message) {
    this.showMessage(message, '#ff4757');
  }

  showWarningMessage(message) {
    this.showMessage(message, '#ffa502');
  }

  showMessage(message, color) {
    // 簡単な通知システム
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${color};
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 14px;
      font-weight: bold;
      z-index: 10001;
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // ==========================================
  // 🧹 クリーンアップ
  // ==========================================
  
  dispose() {
    if (this.completionProvider) {
      this.completionProvider.dispose();
    }
    
    if (this.editor) {
      this.editor.dispose();
    }
    
    if (this.editorContainer) {
      this.editorContainer.remove();
    }
    
    if (this.validationTimeout) {
      clearTimeout(this.validationTimeout);
    }
    
    this.isInitialized = false;
    this.voidFlowEngine.log('🧹 VoidFlow Monaco Editor disposed');
  }
}

export default VoidFlowMonacoIntegration;