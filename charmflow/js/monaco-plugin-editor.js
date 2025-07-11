// monaco-plugin-editor.js - Monaco Editorプラグイン編集機能
// VoidFlowノードのソースコード編集機能

/**
 * 🎨 Monaco Editor Plugin Editor
 * VoidFlowノードのダブルクリックでソースコード編集
 */
class MonacoPluginEditor {
  constructor() {
    this.editor = null
    this.currentPluginId = null
    this.originalCode = ''
    this.isInitialized = false
    
    // 保存されたプラグインコードのキャッシュ
    this.savedPluginCodes = new Map() // pluginId -> code
    
    this.log('🎨 MonacoPluginEditor initialized')
  }
  
  log(message) {
    console.log(`[MonacoPluginEditor] ${message}`)
  }
  
  /**
   * 🚀 Monaco Editor初期化
   */
  async initialize() {
    if (this.isInitialized) return
    
    try {
      this.log('🚀 Initializing Monaco Editor...')
      
      // CDN版で初期化
      await this.initializeViaCDN()
      
      this.isInitialized = true
      this.log('✅ Monaco Editor initialized successfully')
      
    } catch (error) {
      this.log(`❌ Monaco Editor initialization failed: ${error.message}`)
      throw error
    }
  }
  
  /**
   * 📡 CDN版Monaco Editor初期化
   */
  async initializeViaCDN() {
    return new Promise((resolve, reject) => {
      // requireが未定義の場合は待機
      if (typeof require === 'undefined') {
        this.log('⏳ Waiting for Monaco Editor CDN to load...')
        
        // CDNローダーが読み込まれるまで待機
        const checkInterval = setInterval(() => {
          if (typeof require !== 'undefined') {
            clearInterval(checkInterval)
            this.startMonacoLoading(resolve, reject)
          }
        }, 100)
        
        // タイムアウト（10秒）
        setTimeout(() => {
          clearInterval(checkInterval)
          reject(new Error('Monaco Editor CDN loading timeout'))
        }, 10000)
      } else {
        this.startMonacoLoading(resolve, reject)
      }
    })
  }
  
  /**
   * 🚀 Monaco Editor読み込み開始
   */
  startMonacoLoading(resolve, reject) {
    try {
      require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs' } })
      
      require(['vs/editor/editor.main'], () => {
        this.log('📡 Monaco Editor loaded via CDN')
        resolve()
      }, (error) => {
        reject(new Error(`Failed to load Monaco Editor: ${error}`))
      })
    } catch (error) {
      reject(new Error(`Monaco Editor loading error: ${error.message}`))
    }
  }
  
  /**
   * 🎯 プラグインコードエディターを開く
   */
  async openPluginEditor(pluginId) {
    try {
      await this.initialize()
      
      this.currentPluginId = pluginId
      
      // プラグインのソースコード取得
      const sourceCode = await this.getPluginSourceCode(pluginId)
      this.originalCode = sourceCode
      
      // エディター作成
      this.createEditor(sourceCode)
      
      // モーダル表示
      this.showEditorModal(pluginId)
      
      this.log(`🎯 Plugin editor opened for: ${pluginId}`)
      
    } catch (error) {
      this.log(`❌ Failed to open plugin editor: ${error.message}`)
      alert(`エディターの起動に失敗しました: ${error.message}`)
    }
  }
  
  /**
   * 📝 プラグインのソースコード取得
   */
  async getPluginSourceCode(pluginId) {
    // 保存されたコードがあるか確認
    if (this.savedPluginCodes.has(pluginId)) {
      this.log(`📝 Loading saved code for: ${pluginId}`)
      return this.savedPluginCodes.get(pluginId)
    }
    
    // 初回の場合はテンプレート生成
    this.log(`📋 Generating template for: ${pluginId}`)
    
    // NyaCoreUIからプラグイン情報取得
    if (window.nyaCoreUI && window.nyaCoreUI.uiElements.has(pluginId)) {
      const element = window.nyaCoreUI.uiElements.get(pluginId)
      const nodeType = element.getAttribute('data-node-type')
      
      // ノードタイプに応じたテンプレートコード生成
      return this.generateTemplateCode(pluginId, nodeType)
    }
    
    // デフォルトプラグインテンプレート
    return this.generateDefaultTemplate(pluginId)
  }
  
  /**
   * 📋 テンプレートコード生成
   */
  generateTemplateCode(pluginId, nodeType) {
    const templates = {
      'button.send': `// 🚀 Send Button Plugin
const plugin = {
  id: '${pluginId}',
  type: 'ui.button',
  displayName: 'Send Button',
  
  async handleClick() {
    console.log('Send button clicked!')
    
    // データを接続先に送信
    if (window.connectionManager) {
      await window.connectionManager.executeDataFlow('${pluginId}', 'trigger')
    }
  },
  
  // カスタム処理をここに追加
  async customProcess(data) {
    // あなたのコードをここに書いてください
    return data
  }
}

// プラグインを返す
return plugin`,

      'input.text': `// 📝 Text Input Plugin  
const plugin = {
  id: '${pluginId}',
  type: 'ui.input',
  displayName: 'Text Input',
  
  async getValue() {
    const element = document.querySelector('[data-plugin-id="${pluginId}"] .text-input')
    return element ? element.value : ''
  },
  
  async setValue(value) {
    const element = document.querySelector('[data-plugin-id="${pluginId}"] .text-input')
    if (element) element.value = value
  },
  
  // カスタム処理をここに追加
  async customProcess(data) {
    // あなたのコードをここに書いてください
    return data
  }
}

// プラグインを返す
return plugin`,

      'output.console': `// 📺 Console Output Plugin
const plugin = {
  id: '${pluginId}',
  type: 'ui.output',
  displayName: 'Console Output',
  
  async displayData(data) {
    console.log('Console Output:', data)
    
    // UI更新
    const element = document.querySelector('[data-plugin-id="${pluginId}"] .console-output')
    if (element) {
      element.textContent = String(data)
    }
  },
  
  // カスタム処理をここに追加
  async customProcess(data) {
    // あなたのコードをここに書いてください
    await this.displayData(data)
    return data
  }
}

// プラグインを返す
return plugin`,

      'string.uppercase': `// 🔤 String Uppercase Plugin
const plugin = {
  id: '${pluginId}',
  type: 'data.transform',
  displayName: 'String Uppercase',
  
  async transform(input) {
    if (typeof input === 'string') {
      return input.toUpperCase()
    }
    return String(input).toUpperCase()
  },
  
  // カスタム処理をここに追加
  async customProcess(data) {
    // あなたのコードをここに書いてください
    const result = await this.transform(data)
    
    // 接続先に送信
    if (window.connectionManager) {
      await window.connectionManager.executeDataFlow('${pluginId}', result)
    }
    
    return result
  }
}

// プラグインを返す
return plugin`
    }
    
    return templates[nodeType] || this.generateDefaultTemplate(pluginId)
  }
  
  /**
   * 📋 デフォルトテンプレート生成
   */
  generateDefaultTemplate(pluginId) {
    return `// 🔧 Custom Plugin
const plugin = {
  id: '${pluginId}',
  type: 'custom',
  displayName: 'Custom Plugin',
  
  async run() {
    console.log('Plugin running:', this.id)
  },
  
  async handleMessage(message) {
    console.log('Message received:', message)
    return { success: true }
  },
  
  // カスタム処理をここに追加
  async customProcess(data) {
    // あなたのコードをここに書いてください
    console.log('Processing data:', data)
    return data
  }
}

// プラグインを返す
return plugin`
  }
  
  /**
   * 🎨 Monaco Editorインスタンス作成
   */
  createEditor(code) {
    const container = document.getElementById('monacoEditorContent')
    
    // 既存エディターがあれば破棄
    if (this.editor) {
      this.editor.dispose()
    }
    
    // Monaco Editorインスタンス作成
    this.editor = monaco.editor.create(container, {
      value: code,
      language: 'javascript',
      theme: 'vs-dark',
      fontSize: 13,
      minimap: { enabled: true },
      automaticLayout: true,
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      lineNumbers: 'on',
      folding: true,
      selectOnLineNumbers: true,
      matchBrackets: 'always',
      autoIndent: 'full',
      formatOnPaste: true,
      formatOnType: true
    })
    
    this.log('🎨 Monaco Editor instance created')
  }
  
  /**
   * 👁️ エディターモーダル表示
   */
  showEditorModal(pluginId) {
    const modal = document.getElementById('monacoEditorModal')
    const title = document.getElementById('editorTitle')
    
    // タイトル更新
    const element = window.nyaCoreUI?.uiElements.get(pluginId)
    const nodeType = element?.getAttribute('data-node-type') || 'unknown'
    title.textContent = `🎨 Editing: ${nodeType} (${pluginId.substring(0, 8)}...)`
    
    // モーダル表示
    modal.style.display = 'block'
    
    // ESCキーでクローズ
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        this.closeEditor()
        document.removeEventListener('keydown', handleEscape)
      }
    }
    document.addEventListener('keydown', handleEscape)
  }
  
  /**
   * 💾 プラグインコード保存・適用
   */
  async savePluginCode() {
    if (!this.editor || !this.currentPluginId) return
    
    try {
      const newCode = this.editor.getValue()
      
      this.log(`💾 Saving plugin code for: ${this.currentPluginId}`)
      
      // コード実行・プラグイン更新
      await this.executePluginCode(newCode)
      
      // オリジナルコードを更新
      this.originalCode = newCode
      
      // 💾 保存されたコードをキャッシュに保存
      this.savedPluginCodes.set(this.currentPluginId, newCode)
      this.log(`💾 Code saved to cache for: ${this.currentPluginId}`)
      
      this.log('✅ Plugin code saved and applied successfully')
      
      // 成功メッセージ表示
      alert('プラグインコードが保存・適用されました！')
      
      // 自動でモーダルを閉じる
      this.closeEditor()
      
    } catch (error) {
      this.log(`❌ Failed to save plugin code: ${error.message}`)
      alert(`保存に失敗しました: ${error.message}`)
    }
  }
  
  /**
   * 🚀 プラグインコード実行
   */
  async executePluginCode(code) {
    try {
      // セキュアな実行環境でコード実行
      const result = await this.safeExecuteCode(code)
      
      this.log(`🔍 Code execution result:`, result)
      this.log(`🔍 Result type: ${typeof result}`)
      
      if (result && typeof result === 'object') {
        // プラグインオブジェクトかチェック
        if (result.id || result.pluginId) {
          this.log(`🔧 Plugin object created: ${result.id || result.pluginId}`)
          
          // 既存プラグインの動作を更新
          await this.updatePluginBehavior(this.currentPluginId, result)
          
          return result
        } else {
          // IDがなくても、オブジェクトなら受け入れる
          this.log(`🔧 Custom object created (no ID)`)
          
          // 現在のプラグインIDを設定
          result.id = this.currentPluginId
          result.pluginId = this.currentPluginId
          
          await this.updatePluginBehavior(this.currentPluginId, result)
          
          return result
        }
      } else {
        this.log(`❌ Invalid result type. Expected object, got: ${typeof result}`)
        throw new Error(`Invalid plugin code: Expected plugin object, got ${typeof result}`)
      }
      
    } catch (error) {
      this.log(`❌ Plugin code execution failed: ${error.message}`)
      throw error
    }
  }
  
  /**
   * 🔒 セキュアなコード実行
   */
  async safeExecuteCode(code) {
    // セキュアな実行環境
    const sandboxGlobals = {
      console: {
        log: (...args) => this.log(`[Plugin] ${args.join(' ')}`),
        warn: (...args) => this.log(`[Plugin] WARN: ${args.join(' ')}`),
        error: (...args) => this.log(`[Plugin] ERROR: ${args.join(' ')}`)
      },
      window: {
        connectionManager: window.connectionManager,
        nyaCoreUI: window.nyaCoreUI
      },
      document: {
        querySelector: document.querySelector.bind(document),
        querySelectorAll: document.querySelectorAll.bind(document)
      },
      setTimeout,
      setInterval,
      Date,
      Math,
      JSON
    }
    
    // Function constructorで安全に実行
    const executor = new Function(...Object.keys(sandboxGlobals), code)
    return executor(...Object.values(sandboxGlobals))
  }
  
  /**
   * 🔄 プラグイン動作更新
   */
  async updatePluginBehavior(pluginId, newPluginObj) {
    // NyaCoreUIプラグインの動作を更新
    if (window.nyaCoreUI && window.nyaCoreUI.uiPlugins.has(pluginId)) {
      const existingPlugin = window.nyaCoreUI.uiPlugins.get(pluginId)
      
      // 新しい動作をマージ
      Object.assign(existingPlugin, newPluginObj)
      
      this.log(`🔄 Plugin behavior updated: ${pluginId}`)
    }
  }
  
  /**
   * 🔄 コードリセット
   */
  resetPluginCode() {
    if (this.editor && this.originalCode) {
      const confirmed = confirm('変更内容を破棄して、元のコードに戻しますか？')
      if (confirmed) {
        this.editor.setValue(this.originalCode)
        this.log('🔄 Plugin code reset to original')
      }
    }
  }
  
  /**
   * ✕ エディター終了
   */
  closeEditor() {
    const modal = document.getElementById('monacoEditorModal')
    modal.style.display = 'none'
    
    if (this.editor) {
      this.editor.dispose()
      this.editor = null
    }
    
    this.currentPluginId = null
    this.originalCode = ''
    
    this.log('✕ Plugin editor closed')
  }
}

// グローバルインスタンス作成
window.monacoPluginEditor = new MonacoPluginEditor()

// グローバル関数（HTMLから呼び出し用）
window.savePluginCode = () => window.monacoPluginEditor.savePluginCode()
window.resetPluginCode = () => window.monacoPluginEditor.resetPluginCode()
window.closeCodeEditor = () => window.monacoPluginEditor.closeEditor()

export default MonacoPluginEditor