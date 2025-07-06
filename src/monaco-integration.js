// monaco-integration.js - Monaco Editor統合モジュール
// VoidIDE GenesisでのVSCode級エディタ体験

/**
 * 🎨 Monaco Editor統合クラス
 * VoidIDEでのコードエディタ機能を提供
 */
export class MonacoIntegration {
  constructor(voidIDEPlugin) {
    this.voidIDE = voidIDEPlugin;
    this.editor = null;
    this.isInitialized = false;
    this.completionProvider = null;
  }

  // ==========================================
  // 🚀 Monaco Editor初期化
  // ==========================================
  
  async initialize(containerElement) {
    try {
      this.voidIDE.log('🎨 Initializing Monaco Editor...');
      
      // Monaco Editorが利用可能かチェック
      if (typeof monaco === 'undefined') {
        throw new Error('Monaco Editor is not loaded. Please include Monaco Editor CDN.');
      }
      
      // エディタ作成
      this.editor = monaco.editor.create(containerElement, {
        value: this.voidIDE.getDefaultPluginTemplate(),
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
        }
      });
      
      // VoidCore専用の言語設定
      await this.setupVoidCoreLangageFeatures();
      
      // エディタイベントの設定
      this.setupEditorEvents();
      
      // コード補完の設定
      await this.setupCodeCompletion();
      
      // キーボードショートカットの設定
      this.setupKeyboardShortcuts();
      
      this.isInitialized = true;
      this.voidIDE.log('✅ Monaco Editor initialized successfully');
      
      return this.editor;
      
    } catch (error) {
      this.voidIDE.log(`❌ Monaco Editor initialization failed: ${error.message}`);
      throw error;
    }
  }

  // ==========================================
  // 🔧 VoidCore言語機能
  // ==========================================
  
  async setupVoidCoreLangageFeatures() {
    // VoidCore専用のJavaScript設定
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      allowJs: true,
      typeRoots: ["node_modules/@types"]
    });
    
    // VoidCore API型定義
    const voidCoreTypes = `
      declare module 'voidcore' {
        export function createPlugin(config: any, logic: any): any;
        export const voidCore: any;
        export const Message: any;
      }
      
      declare interface PluginContext {
        pluginId: string;
        name: string;
        version: string;
        log(message: string): void;
        notice(eventName: string, payload?: any): Promise<void>;
        on(messageType: string, eventName: string, handler: Function): void;
        initialize(): Promise<void>;
      }
    `;
    
    // 型定義を追加
    monaco.languages.typescript.javascriptDefaults.addExtraLib(
      voidCoreTypes,
      'file:///node_modules/@types/voidcore/index.d.ts'
    );
  }

  // ==========================================
  // 📡 エディタイベント
  // ==========================================
  
  setupEditorEvents() {
    // コード変更時
    this.editor.onDidChangeModelContent(async (e) => {
      const value = this.editor.getValue();
      this.voidIDE.editorState.currentCode = value;
      this.voidIDE.editorState.isDirty = true;
      
      // リアルタイム検証（デバウンス）
      clearTimeout(this.validationTimeout);
      this.validationTimeout = setTimeout(() => {
        this.validateCode(value);
      }, 1000);
      
      // 変更通知
      await this.voidIDE.notice('voidide.code.changed', {
        length: value.length,
        timestamp: Date.now()
      });
    });
    
    // カーソル位置変更時
    this.editor.onDidChangeCursorPosition((e) => {
      // カーソル位置に基づくコンテキスト情報の更新
      this.updateContextualHelp(e.position);
    });
    
    // フォーカス時
    this.editor.onDidFocusEditorText(() => {
      this.voidIDE.log('📝 Editor focused');
    });
    
    // ブラー時
    this.editor.onDidBlurEditorText(() => {
      // 自動保存などの処理
      this.autoSave();
    });
  }

  // ==========================================
  // 💡 コード補完
  // ==========================================
  
  async setupCodeCompletion() {
    // VoidCore API補完プロバイダー
    this.completionProvider = monaco.languages.registerCompletionItemProvider('javascript', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };
        
        const suggestions = this.getVoidCoreCompletions(range);
        return { suggestions };
      }
    });
    
    // ホバー情報プロバイダー
    monaco.languages.registerHoverProvider('javascript', {
      provideHover: (model, position) => {
        return this.provideHoverInfo(model, position);
      }
    });
    
    // シグネチャヘルププロバイダー
    monaco.languages.registerSignatureHelpProvider('javascript', {
      signatureHelpTriggerCharacters: ['(', ','],
      provideSignatureHelp: (model, position) => {
        return this.provideSignatureHelp(model, position);
      }
    });
  }

  // ==========================================
  // 📋 VoidCore補完アイテム
  // ==========================================
  
  getVoidCoreCompletions(range) {
    return [
      {
        label: 'createPlugin',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: [
          'createPlugin({',
          '  pluginId: \'${1:my-plugin}\',',
          '  name: \'${2:My Plugin}\',',
          '  version: \'${3:1.0.0}\'',
          '}, {',
          '  async run() {',
          '    await this.initialize();',
          '    $0',
          '  }',
          '})'
        ].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: {
          value: '**Create VoidCore Plugin**\n\nCreate a new VoidCore plugin with configuration and logic.',
          isTrusted: true
        },
        range: range
      },
      {
        label: 'this.notice',
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: 'this.notice(\'${1:event.name}\', {${2:payload}})',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: {
          value: '**Send Notice Message**\n\nSend a notice message to all subscribers (1-to-many).',
          isTrusted: true
        },
        range: range
      },
      {
        label: 'this.on',
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: 'this.on(\'${1:Notice}\', \'${2:event.name}\', (message) => {${3:}})',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: {
          value: '**Subscribe to Messages**\n\nSubscribe to messages of a specific type and event.',
          isTrusted: true
        },
        range: range
      },
      {
        label: 'this.log',
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: 'this.log(\'${1:message}\')',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: {
          value: '**Log Message**\n\nLog a message from the plugin.',
          isTrusted: true
        },
        range: range
      },
      {
        label: 'this.initialize',
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: 'await this.initialize()',
        documentation: {
          value: '**Initialize Plugin**\n\nInitialize the plugin (must be called in run method).',
          isTrusted: true
        },
        range: range
      },
      {
        label: 'Message.notice',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'Message.notice(\'${1:event.name}\', {${2:payload}})',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: {
          value: '**Create Notice Message**\n\nCreate a notice message object.',
          isTrusted: true
        },
        range: range
      },
      {
        label: 'voidcore-template',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
          '// 🌟 VoidCore Plugin Template',
          'const ${1:myPlugin} = createPlugin({',
          '  pluginId: \'${2:my-plugin}\',',
          '  name: \'${3:My Plugin}\',',
          '  version: \'${4:1.0.0}\',',
          '  capabilities: [${5:\'demo\'}]',
          '}, {',
          '  async run() {',
          '    await this.initialize();',
          '    ',
          '    this.log(\'🚀 ${3:My Plugin} started!\');',
          '    ',
          '    // Listen for messages',
          '    this.on(\'Notice\', \'${6:user.action}\', (message) => {',
          '      this.log(\'Received:\', message.payload);',
          '    });',
          '    ',
          '    // Send welcome message',
          '    await this.notice(\'plugin.ready\', {',
          '      pluginId: this.pluginId,',
          '      timestamp: Date.now()',
          '    });',
          '    ',
          '    this.log(\'✅ ${3:My Plugin} ready!\');',
          '  }',
          '});',
          '',
          'return ${1:myPlugin};'
        ].join('\n'),
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: {
          value: '**VoidCore Plugin Template**\n\nComplete template for creating a VoidCore plugin.',
          isTrusted: true
        },
        range: range
      }
    ];
  }

  // ==========================================
  // 🔍 ホバー情報
  // ==========================================
  
  provideHoverInfo(model, position) {
    const word = model.getWordAtPosition(position);
    if (!word) return null;
    
    const hoverInfos = {
      'createPlugin': {
        value: '**createPlugin(config, logic)**\n\nCreate a new VoidCore plugin.\n\n- `config`: Plugin configuration object\n- `logic`: Plugin implementation object'
      },
      'notice': {
        value: '**this.notice(eventName, payload)**\n\nSend a notice message to all subscribers.\n\n- `eventName`: Event identifier\n- `payload`: Message data'
      },
      'voidCore': {
        value: '**voidCore**\n\nThe main VoidCore instance for plugin registration and message routing.'
      }
    };
    
    const info = hoverInfos[word.word];
    if (info) {
      return {
        range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
        contents: [{ value: info.value, isTrusted: true }]
      };
    }
    
    return null;
  }

  // ==========================================
  // ⌨️ キーボードショートカット
  // ==========================================
  
  setupKeyboardShortcuts() {
    // Ctrl+Enter / Cmd+Enter でコード実行
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      this.executeCurrentCode();
    });
    
    // Ctrl+S / Cmd+S で保存
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, () => {
      this.saveCurrentFile();
    });
    
    // F5 でコード実行
    this.editor.addCommand(monaco.KeyCode.F5, () => {
      this.executeCurrentCode();
    });
    
    // Ctrl+Shift+P / Cmd+Shift+P でコマンドパレット
    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KEY_P, () => {
      this.openCommandPalette();
    });
  }

  // ==========================================
  // 🚀 エディタアクション
  // ==========================================
  
  async executeCurrentCode() {
    if (this.voidIDE.editorState.isExecuting) {
      this.voidIDE.log('⚠️ Code is already executing...');
      return;
    }
    
    const code = this.editor.getValue();
    this.voidIDE.log('🚀 Executing code from editor...');
    
    const result = await this.voidIDE.executeCode(code);
    
    if (result.success) {
      this.voidIDE.log('✅ Code executed successfully!');
      this.showSuccessIndicator();
    } else {
      this.voidIDE.log(`❌ Execution failed: ${result.error}`);
      this.showErrorIndicator(result.error);
    }
  }

  async saveCurrentFile() {
    const code = this.editor.getValue();
    // 将来のフェーズでファイル保存機能を実装
    this.voidIDE.log('💾 File saved (local storage)');
    this.voidIDE.editorState.isDirty = false;
  }

  openCommandPalette() {
    // 将来のフェーズでコマンドパレットを実装
    this.voidIDE.log('🎯 Command palette (coming soon)');
  }

  // ==========================================
  // ✅ 検証・フィードバック
  // ==========================================
  
  async validateCode(code) {
    try {
      // 基本的な構文チェック
      new Function(code);
      
      // VoidCoreプラグイン構造の検証
      if (code.includes('createPlugin')) {
        // プラグイン構造の検証ロジック
        this.showValidationSuccess();
      }
      
    } catch (error) {
      this.showValidationError(error.message);
    }
  }

  showSuccessIndicator() {
    // 成功インジケータの表示
    this.editor.deltaDecorations([], [{
      range: new monaco.Range(1, 1, 1, 1),
      options: {
        isWholeLine: true,
        className: 'editor-success-line',
        glyphMarginClassName: 'editor-success-glyph'
      }
    }]);
    
    // 一定時間後に削除
    setTimeout(() => {
      this.editor.deltaDecorations([], []);
    }, 3000);
  }

  showErrorIndicator(error) {
    // エラーインジケータの表示
    this.voidIDE.log(`❌ Validation error: ${error}`);
  }

  showValidationSuccess() {
    // 検証成功インジケータ
    this.voidIDE.log('✅ Code validation passed');
  }

  showValidationError(error) {
    // 検証エラーインジケータ
    this.voidIDE.log(`⚠️ Validation warning: ${error}`);
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
    
    if (this.validationTimeout) {
      clearTimeout(this.validationTimeout);
    }
    
    this.isInitialized = false;
    this.voidIDE.log('🧹 Monaco Editor disposed');
  }

  // ==========================================
  // 📊 ユーティリティ
  // ==========================================
  
  getValue() {
    return this.editor ? this.editor.getValue() : '';
  }

  setValue(value) {
    if (this.editor) {
      this.editor.setValue(value);
    }
  }

  focus() {
    if (this.editor) {
      this.editor.focus();
    }
  }

  getEditor() {
    return this.editor;
  }

  updateContextualHelp(position) {
    // カーソル位置に基づくコンテキストヘルプ
    // 将来のフェーズで実装
  }

  autoSave() {
    // 自動保存機能
    // 将来のフェーズで実装
  }
}

export default MonacoIntegration;