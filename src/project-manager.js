// project-manager.js - VoidCoreプロジェクト管理システム
// ZIP形式構造分離方式でのプロジェクト保存・読込システム

/**
 * 🗂️ ProjectManager - VoidCoreプロジェクト管理システム
 * 
 * VoidCoreプラグインプロジェクトの保存・読込・管理
 * - ZIP形式での構造分離保存 (.plugin.json + .plugin.js)
 * - プラグイン間メッセージフロー管理
 * - プロジェクト履歴・バージョン管理
 * - ブラウザでの完全なプロジェクト復元
 */

export class ProjectManager {
  constructor(voidCore) {
    this.voidCore = voidCore;
    this.currentProject = null;
    this.projectHistory = [];
    
    // プロジェクトデータ構造（ZIP形式構造分離対応）
    this.defaultProject = {
      metadata: {
        name: 'Untitled Project',
        description: '',
        createdWith: '14.0',
        created: Date.now(),
        lastModified: Date.now(),
        author: 'Anonymous',
        version: '1.0.0'
      },
      plugins: [], // { id, name, structure, sourceCode, messageTypes }
      messageFlow: {},
      settings: {
        autoSave: true,
        autoRun: false,
        format: 'zip-separated' // ZIP形式構造分離
      }
    };
    
    // ZIP作成用ライブラリ（CDN経由で読み込み）
    this.JSZip = null;
    this.zipSupported = false;
    
    // 自動保存設定
    this.autoSaveInterval = null;
    this.autoSaveEnabled = true;
    
    // UI要素
    this.container = null;
    this.elements = {};
  }

  // ==========================================
  // 🚀 初期化・UI構築
  // ==========================================
  
  async initialize(container) {
    this.container = container;
    
    try {
      // ZIP ライブラリを動的読み込み
      await this.loadZipLibrary();
      
      // 新規プロジェクト作成
      this.currentProject = { ...this.defaultProject };
      
      // プロジェクト管理UI作成
      this.createProjectManagerUI();
      
      // LocalStorageから履歴読込
      this.loadProjectHistory();
      
      // 自動保存開始
      this.startAutoSave();
      
      console.log('🗂️ ProjectManager initialized with ZIP support:', this.zipSupported);
      return true;
      
    } catch (error) {
      console.error('❌ ProjectManager initialization failed:', error);
      return false;
    }
  }

  async loadZipLibrary() {
    try {
      // JSZip CDN動的読み込み
      if (!window.JSZip) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = () => {
          this.JSZip = window.JSZip;
          this.zipSupported = true;
          console.log('📦 JSZip library loaded successfully');
        };
        script.onerror = () => {
          console.warn('⚠️ Failed to load JSZip, fallback to JSON export');
          this.zipSupported = false;
        };
        document.head.appendChild(script);
        
        // ロード完了を待機
        await new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            if (window.JSZip || script.readyState === 'complete') {
              clearInterval(checkInterval);
              this.JSZip = window.JSZip;
              this.zipSupported = !!window.JSZip;
              resolve();
            }
          }, 100);
        });
      } else {
        this.JSZip = window.JSZip;
        this.zipSupported = true;
      }
    } catch (error) {
      console.warn('⚠️ ZIP library load failed, using fallback:', error);
      this.zipSupported = false;
    }
  }
  
  createProjectManagerUI() {
    this.elements.manager = document.createElement('div');
    this.elements.manager.className = 'project-manager';
    this.elements.manager.innerHTML = `
      <div class="project-header">
        <h3>🗂️ Project Manager</h3>
        <div class="project-controls">
          <button class="new-btn" id="newProjectBtn">📄 New</button>
          <button class="save-btn" id="saveProjectBtn">💾 Save</button>
          <button class="load-btn" id="loadProjectBtn">📂 Load</button>
          <button class="export-btn" id="exportProjectBtn">📦 Export ZIP</button>
          <button class="import-btn" id="importProjectBtn">📥 Import</button>
        </div>
      </div>
      
      <div class="project-content">
        <!-- プロジェクト情報 -->
        <div class="project-info-panel">
          <h4>📋 Project Info</h4>
          <div class="project-form">
            <input type="text" id="projectName" placeholder="Project Name" value="${this.currentProject.metadata.name}">
            <textarea id="projectDescription" placeholder="Description..." rows="2">${this.currentProject.metadata.description}</textarea>
            <div class="project-meta">
              <span>Created: ${new Date(this.currentProject.metadata.created).toLocaleDateString()}</span>
              <span>VoidCore: v${this.currentProject.metadata.createdWith}</span>
            </div>
          </div>
        </div>
        
        <!-- プラグイン一覧 -->
        <div class="plugins-panel">
          <h4>🔧 Plugins (${this.currentProject.plugins.length})</h4>
          <div class="plugins-list" id="pluginsList"></div>
          <button class="add-plugin-btn" id="addPluginBtn">➕ Add Current Plugin</button>
        </div>
        
        <!-- メッセージフロー -->
        <div class="message-flow-panel">
          <h4>🌊 Message Flow</h4>
          <div class="flow-diagram" id="flowDiagram">
            <div class="no-flow">No message flow defined</div>
          </div>
        </div>
        
        <!-- プロジェクト履歴 -->
        <div class="project-history-panel">
          <h4>📚 Recent Projects</h4>
          <div class="history-list" id="historyList"></div>
        </div>
      </div>
    `;
    
    // スタイル追加
    this.addProjectManagerStyles();
    
    // コンテナに追加
    this.container.appendChild(this.elements.manager);
    
    // 要素参照取得
    this.elements.pluginsList = document.getElementById('pluginsList');
    this.elements.flowDiagram = document.getElementById('flowDiagram');
    this.elements.historyList = document.getElementById('historyList');
    
    // イベントリスナー設定
    this.setupEventListeners();
    
    // 初期表示更新
    this.updateUI();
  }
  
  addProjectManagerStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .project-manager {
        background: #252526;
        border-radius: 8px;
        padding: 15px;
        height: 100%;
        overflow-y: auto;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }
      
      .project-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 1px solid #3e3e42;
      }
      
      .project-header h3 {
        color: #cccccc;
        margin: 0;
      }
      
      .project-controls button {
        background: #0e639c;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        margin-left: 5px;
        font-size: 12px;
      }
      
      .project-controls button:hover {
        background: #1177bb;
      }
      
      .project-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: auto auto;
        gap: 15px;
        height: calc(100% - 60px);
      }
      
      .project-info-panel,
      .plugins-panel,
      .message-flow-panel,
      .project-history-panel {
        background: #1e1e1e;
        border-radius: 6px;
        padding: 15px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      
      .project-info-panel h4,
      .plugins-panel h4,
      .message-flow-panel h4,
      .project-history-panel h4 {
        color: #cccccc;
        margin: 0 0 15px 0;
        font-size: 14px;
      }
      
      .project-form input,
      .project-form textarea {
        background: #2d2d30;
        border: 1px solid #3e3e42;
        color: #cccccc;
        padding: 8px;
        border-radius: 4px;
        margin-bottom: 10px;
        font-size: 12px;
        width: 100%;
      }
      
      .project-meta {
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        color: #888;
        margin-top: 10px;
      }
      
      .plugins-list {
        flex: 1;
        overflow-y: auto;
        margin-bottom: 10px;
      }
      
      .plugin-item {
        background: #2d2d30;
        border-radius: 4px;
        padding: 10px;
        margin-bottom: 8px;
        cursor: pointer;
        transition: background 0.2s;
      }
      
      .plugin-item:hover {
        background: #3e3e42;
      }
      
      .plugin-name {
        font-weight: bold;
        color: #4fc1ff;
        font-size: 13px;
        margin-bottom: 3px;
      }
      
      .plugin-info {
        font-size: 10px;
        color: #cccccc;
        margin-bottom: 5px;
        display: flex;
        justify-content: space-between;
      }
      
      .plugin-messages {
        font-size: 10px;
        color: #888;
        display: flex;
        justify-content: space-between;
      }
      
      .plugin-item.selected {
        background: #094771;
        border-left: 3px solid #4fc1ff;
      }
      
      .add-plugin-btn {
        background: #73c991;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        width: 100%;
      }
      
      .add-plugin-btn:hover {
        background: #5bb578;
      }
      
      .flow-diagram {
        flex: 1;
        background: #2d2d30;
        border-radius: 4px;
        padding: 15px;
        overflow-y: auto;
        font-family: monospace;
        font-size: 12px;
      }
      
      .no-flow {
        color: #888;
        text-align: center;
        padding: 40px 20px;
        font-style: italic;
      }
      
      .flow-item {
        background: #1e1e1e;
        border-radius: 4px;
        padding: 8px;
        margin-bottom: 5px;
        color: #cccccc;
      }
      
      .flow-arrow {
        text-align: center;
        color: #4fc1ff;
        margin: 5px 0;
      }
      
      .history-list {
        flex: 1;
        overflow-y: auto;
      }
      
      .history-item {
        background: #2d2d30;
        border-radius: 4px;
        padding: 10px;
        margin-bottom: 8px;
        cursor: pointer;
        transition: background 0.2s;
      }
      
      .history-item:hover {
        background: #3e3e42;
      }
      
      .history-name {
        font-weight: bold;
        color: #4fc1ff;
        font-size: 13px;
      }
      
      .history-meta {
        font-size: 10px;
        color: #888;
        margin-top: 5px;
      }
    `;
    
    document.head.appendChild(style);
  }

  // ==========================================
  // 💾 プロジェクト保存・読込
  // ==========================================
  
  saveProject() {
    if (!this.currentProject) return;
    
    // プロジェクト情報更新
    this.currentProject.metadata.name = document.getElementById('projectName').value || 'Untitled Project';
    this.currentProject.metadata.description = document.getElementById('projectDescription').value || '';
    this.currentProject.metadata.lastModified = Date.now();
    
    // LocalStorageに保存
    const projectId = this.generateProjectId();
    const projectData = {
      id: projectId,
      ...this.currentProject
    };
    
    localStorage.setItem(`voidcore-project-${projectId}`, JSON.stringify(projectData));
    
    // 履歴更新
    this.updateProjectHistory(projectData);
    
    console.log('💾 Project saved:', projectData.metadata.name);
    this.showNotification('Project saved successfully!', 'success');
  }
  
  loadProject(projectId = null) {
    if (!projectId) {
      // ファイル選択ダイアログ
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const projectData = JSON.parse(e.target.result);
              this.loadProjectData(projectData);
            } catch (error) {
              console.error('Failed to load project:', error);
              this.showNotification('Failed to load project file', 'error');
            }
          };
          reader.readAsText(file);
        }
      };
      input.click();
      return;
    }
    
    // LocalStorageから読込
    const projectData = localStorage.getItem(`voidcore-project-${projectId}`);
    if (projectData) {
      try {
        this.loadProjectData(JSON.parse(projectData));
      } catch (error) {
        console.error('Failed to load project:', error);
        this.showNotification('Failed to load project', 'error');
      }
    }
  }
  
  loadProjectData(projectData) {
    this.currentProject = projectData;
    
    // UI更新
    document.getElementById('projectName').value = projectData.metadata.name;
    document.getElementById('projectDescription').value = projectData.metadata.description;
    
    // プラグイン復元
    this.restorePlugins();
    
    // メッセージフロー更新
    this.updateMessageFlow();
    
    // UI表示更新
    this.updateUI();
    
    console.log('📂 Project loaded:', projectData.metadata.name);
    this.showNotification('Project loaded successfully!', 'success');
  }
  
  async exportProjectZip() {
    if (!this.currentProject) {
      this.showNotification('No project to export', 'warning');
      return;
    }
    
    if (!this.zipSupported) {
      // ZIP未対応の場合はJSON fallback
      this.exportProjectJSON();
      return;
    }
    
    try {
      // プロジェクト情報更新
      this.currentProject.metadata.name = document.getElementById('projectName').value || 'Untitled Project';
      this.currentProject.metadata.description = document.getElementById('projectDescription').value || '';
      this.currentProject.metadata.lastModified = Date.now();
      
      // 現在のエディタコードからプラグインを抽出して追加
      await this.addCurrentEditorPlugin();
      
      const zip = new this.JSZip();
      
      // 1. voidcore.project.json (メタ情報)
      const projectMeta = {
        projectName: this.currentProject.metadata.name,
        description: this.currentProject.metadata.description,
        voidcoreVersion: this.currentProject.metadata.createdWith,
        ideVersion: '2.0',
        created: this.currentProject.metadata.created,
        lastModified: this.currentProject.metadata.lastModified,
        author: this.currentProject.metadata.author,
        version: this.currentProject.metadata.version,
        plugins: this.currentProject.plugins.map(p => `${p.id}.plugin.json`),
        linkFile: 'voidcore.link.json',
        format: 'voidcore-zip-v1.0'
      };
      
      zip.file('voidcore.project.json', JSON.stringify(projectMeta, null, 2));
      
      // 2. voidcore.link.json (メッセージフロー)
      const linkData = {
        connections: this.generateConnectionsFromPlugins(),
        routingStrategy: 'byMessageType',
        generatedAt: Date.now()
      };
      
      zip.file('voidcore.link.json', JSON.stringify(linkData, null, 2));
      
      // 3. 各プラグインの構造とソースコード
      for (const plugin of this.currentProject.plugins) {
        // プラグイン構造 (.plugin.json)
        const pluginStructure = {
          name: plugin.name || plugin.id,
          version: plugin.version || '1.0.0',
          entry: `${plugin.id}.plugin.js`,
          messageTypes: plugin.messageTypes,
          dependencies: plugin.dependencies || [],
          settings: plugin.settings || {},
          capabilities: plugin.capabilities || [],
          author: plugin.author || this.currentProject.metadata.author,
          created: plugin.created || Date.now()
        };
        
        zip.file(`${plugin.id}.plugin.json`, JSON.stringify(pluginStructure, null, 2));
        
        // プラグインソースコード (.plugin.js)
        const sourceCode = this.wrapPluginSourceCode(plugin.sourceCode, plugin.id);
        zip.file(`${plugin.id}.plugin.js`, sourceCode);
      }
      
      // 4. assets フォルダ (将来的に)
      // zip.folder('assets');
      
      // ZIP生成とダウンロード
      const blob = await zip.generateAsync({ type: 'blob' });
      const fileName = `${this.currentProject.metadata.name.replace(/\s+/g, '-')}.voidcore.zip`;
      
      this.downloadBlob(blob, fileName);
      
      console.log('📦 ZIP project exported:', fileName);
      this.showNotification(`ZIP project exported: ${fileName}`, 'success');
      
    } catch (error) {
      console.error('❌ ZIP export failed:', error);
      this.showNotification(`Export failed: ${error.message}`, 'error');
      
      // フォールバック
      this.exportProjectJSON();
    }
  }
  
  exportProjectJSON() {
    // JSON形式でのフォールバック保存
    const dataStr = JSON.stringify(this.currentProject, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${this.currentProject.metadata.name.replace(/\s+/g, '-')}.voidproj.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    console.log('📄 JSON project exported:', exportFileDefaultName);
    this.showNotification('Project exported as JSON (ZIP unavailable)', 'info');
  }
  
  importProject() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip,.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        if (file.name.endsWith('.zip')) {
          await this.importProjectZip(file);
        } else {
          await this.importProjectJSON(file);
        }
      } catch (error) {
        console.error('Failed to import project:', error);
        this.showNotification(`Import failed: ${error.message}`, 'error');
      }
    };
    input.click();
  }
  
  async importProjectZip(file) {
    if (!this.zipSupported) {
      this.showNotification('ZIP import not supported', 'error');
      return;
    }
    
    try {
      const zip = new this.JSZip();
      const zipData = await zip.loadAsync(file);
      
      // 1. voidcore.project.json を読み込み
      const projectMetaFile = zipData.file('voidcore.project.json');
      if (!projectMetaFile) {
        throw new Error('Invalid project: voidcore.project.json not found');
      }
      
      const projectMeta = JSON.parse(await projectMetaFile.async('string'));
      
      // 2. voidcore.link.json を読み込み
      const linkFile = zipData.file('voidcore.link.json');
      const linkData = linkFile ? JSON.parse(await linkFile.async('string')) : { connections: [] };
      
      // 3. 各プラグインを読み込み
      const plugins = [];
      
      for (const pluginJsonName of projectMeta.plugins || []) {
        const pluginId = pluginJsonName.replace('.plugin.json', '');
        
        // プラグイン構造を読み込み
        const structureFile = zipData.file(pluginJsonName);
        if (!structureFile) {
          console.warn(`Plugin structure not found: ${pluginJsonName}`);
          continue;
        }
        
        const structure = JSON.parse(await structureFile.async('string'));
        
        // プラグインソースコードを読み込み
        const sourceFile = zipData.file(structure.entry || `${pluginId}.plugin.js`);
        const sourceCode = sourceFile ? await sourceFile.async('string') : '';
        
        plugins.push({
          id: pluginId,
          name: structure.name,
          version: structure.version,
          sourceCode: this.unwrapPluginSourceCode(sourceCode),
          messageTypes: structure.messageTypes || { subscribes: [], publishes: [] },
          dependencies: structure.dependencies || [],
          settings: structure.settings || {},
          capabilities: structure.capabilities || [],
          author: structure.author,
          created: structure.created || Date.now()
        });
      }
      
      // 4. プロジェクトデータを構成
      const projectData = {
        metadata: {
          name: projectMeta.projectName || 'Imported Project',
          description: projectMeta.description || '',
          createdWith: projectMeta.voidcoreVersion || '14.0',
          created: projectMeta.created || Date.now(),
          lastModified: Date.now(),
          author: projectMeta.author || 'Unknown',
          version: projectMeta.version || '1.0.0'
        },
        plugins: plugins,
        messageFlow: this.generateMessageFlowFromConnections(linkData.connections),
        settings: {
          autoSave: true,
          autoRun: false,
          format: 'zip-separated'
        }
      };
      
      this.loadProjectData(projectData);
      
      console.log('📦 ZIP project imported successfully');
      this.showNotification('ZIP project imported successfully!', 'success');
      
    } catch (error) {
      console.error('❌ ZIP import failed:', error);
      throw error;
    }
  }
  
  async importProjectJSON(file) {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const projectData = JSON.parse(e.target.result);
          this.loadProjectData(projectData);
          this.showNotification('JSON project imported successfully!', 'success');
        } catch (error) {
          console.error('Failed to parse JSON project:', error);
          this.showNotification('Failed to parse project file', 'error');
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('❌ JSON import failed:', error);
      throw error;
    }
  }

  // ==========================================
  // 🔧 プラグイン管理
  // ==========================================
  
  addCurrentPlugin() {
    // Monaco Editorから現在のコードを取得
    const editorContent = window.monacoEditor?.getValue() || '';
    
    if (!editorContent.trim()) {
      this.showNotification('No plugin code to add', 'warning');
      return;
    }
    
    this.addCurrentEditorPlugin();
  }
  
  async addCurrentEditorPlugin() {
    try {
      const editorContent = window.monacoEditor?.getValue() || '';
      
      if (!editorContent.trim()) {
        return;
      }
      
      // プラグインIDを抽出
      const pluginId = this.extractPluginId(editorContent);
      
      if (!pluginId) {
        this.showNotification('Cannot detect plugin ID', 'warning');
        return;
      }
      
      // メッセージタイプを抽出
      const messageTypes = this.extractMessageTypes(editorContent);
      
      // プラグイン構造情報を抽出
      const pluginStructure = this.extractPluginStructure(editorContent);
      
      // プラグインデータ作成
      const pluginData = {
        id: pluginId,
        name: pluginStructure.name || pluginId,
        version: pluginStructure.version || '1.0.0',
        sourceCode: editorContent,
        messageTypes: messageTypes,
        dependencies: pluginStructure.dependencies || [],
        settings: pluginStructure.settings || {},
        capabilities: pluginStructure.capabilities || [],
        author: this.currentProject.metadata.author,
        created: Date.now()
      };
      
      // 重複チェック
      const existingIndex = this.currentProject.plugins.findIndex(p => p.id === pluginId);
      if (existingIndex !== -1) {
        this.currentProject.plugins[existingIndex] = pluginData;
        this.showNotification('Plugin updated!', 'success');
      } else {
        this.currentProject.plugins.push(pluginData);
        this.showNotification('Plugin added!', 'success');
      }
      
      // メッセージフロー更新
      this.updateMessageFlow();
      
      // UI更新
      this.updateUI();
      
      // 自動保存
      if (this.autoSaveEnabled) {
        this.saveProject();
      }
      
    } catch (error) {
      console.error('Failed to add current plugin:', error);
      this.showNotification(`Failed to add plugin: ${error.message}`, 'error');
    }
  }
  
  extractPluginId(source) {
    // createPlugin の pluginId を抽出
    const createPluginMatch = source.match(/createPlugin\s*\(\s*\{\s*pluginId:\s*['"`]([^'"`]+)['"`]/);
    if (createPluginMatch) {
      return createPluginMatch[1];
    }
    
    // class名を抽出
    const classMatch = source.match(/class\s+(\w+)/);
    if (classMatch) {
      return classMatch[1].toLowerCase();
    }
    
    // const名を抽出
    const constMatch = source.match(/const\s+(\w+)\s*=\s*createPlugin/);
    if (constMatch) {
      return constMatch[1];
    }
    
    return null;
  }
  
  extractMessageTypes(source) {
    const messageTypes = {
      subscribes: [],
      publishes: []
    };
    
    // subscribe/on の抽出
    const subscribeMatches = source.match(/(?:subscribe|on)\s*\(\s*['"`]([^'"`]+)['"`]/g);
    if (subscribeMatches) {
      subscribeMatches.forEach(match => {
        const type = match.match(/['"`]([^'"`]+)['"`]/)[1];
        if (!messageTypes.subscribes.includes(type)) {
          messageTypes.subscribes.push(type);
        }
      });
    }
    
    // publish/notice の抽出
    const publishMatches = source.match(/(?:publish|notice)\s*\(\s*['"`]([^'"`]+)['"`]/g);
    if (publishMatches) {
      publishMatches.forEach(match => {
        const type = match.match(/['"`]([^'"`]+)['"`]/)[1];
        if (!messageTypes.publishes.includes(type)) {
          messageTypes.publishes.push(type);
        }
      });
    }
    
    return messageTypes;
  }
  
  extractPluginStructure(source) {
    const structure = {
      name: null,
      version: '1.0.0',
      dependencies: [],
      settings: {},
      capabilities: []
    };
    
    // createPlugin の設定部分を抽出
    const createPluginMatch = source.match(/createPlugin\s*\(\s*\{([^}]+)\}/);
    if (createPluginMatch) {
      const configStr = createPluginMatch[1];
      
      // name を抽出
      const nameMatch = configStr.match(/name:\s*['"`]([^'"`]+)['"`]/);
      if (nameMatch) {
        structure.name = nameMatch[1];
      }
      
      // version を抽出
      const versionMatch = configStr.match(/version:\s*['"`]([^'"`]+)['"`]/);
      if (versionMatch) {
        structure.version = versionMatch[1];
      }
      
      // capabilities を抽出
      const capabilitiesMatch = configStr.match(/capabilities:\s*\[([^\]]+)\]/);
      if (capabilitiesMatch) {
        const capStr = capabilitiesMatch[1];
        structure.capabilities = capStr.split(',').map(cap => 
          cap.trim().replace(/['"`]/g, '')
        ).filter(cap => cap);
      }
    }
    
    return structure;
  }
  
  wrapPluginSourceCode(sourceCode, pluginId) {
    // プラグインソースコードをVoidCore実行用にラップ
    return `// ${pluginId}.plugin.js - Generated by VoidIDE Genesis v2.0
// VoidCore v14.0 Plugin

${sourceCode}

// Auto-generated export for VoidCore compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ${pluginId};
}`;
  }
  
  unwrapPluginSourceCode(wrappedCode) {
    // ラップされたコードから元のソースコードを抽出
    const lines = wrappedCode.split('\n');
    const startIndex = lines.findIndex(line => !line.startsWith('//') && line.trim());
    const endIndex = lines.findIndex(line => line.includes('// Auto-generated export'));
    
    if (startIndex === -1) return wrappedCode;
    if (endIndex === -1) return lines.slice(startIndex).join('\n');
    
    return lines.slice(startIndex, endIndex).join('\n').trim();
  }
  
  generateConnectionsFromPlugins() {
    const connections = [];
    
    // 各プラグインのメッセージタイプから接続を構築
    this.currentProject.plugins.forEach(plugin => {
      plugin.messageTypes.publishes.forEach(publishType => {
        this.currentProject.plugins.forEach(otherPlugin => {
          if (plugin.id !== otherPlugin.id) {
            if (otherPlugin.messageTypes.subscribes.includes(publishType)) {
              connections.push({
                from: plugin.id,
                to: otherPlugin.id,
                type: 'Notice',
                topic: publishType,
                generated: true
              });
            }
          }
        });
      });
    });
    
    return connections;
  }
  
  generateMessageFlowFromConnections(connections) {
    const flowMap = new Map();
    
    connections.forEach(conn => {
      const connectionKey = `${conn.from} → ${conn.to}`;
      if (!flowMap.has(connectionKey)) {
        flowMap.set(connectionKey, []);
      }
      flowMap.get(connectionKey).push(conn.topic);
    });
    
    return Object.fromEntries(flowMap);
  }
  
  downloadBlob(blob, fileName) {
    // Blob をファイルとしてダウンロード
    const url = URL.createObjectURL(blob);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', url);
    linkElement.setAttribute('download', fileName);
    linkElement.style.display = 'none';
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
    URL.revokeObjectURL(url);
  }
  
  restorePlugins() {
    if (!this.currentProject.plugins || this.currentProject.plugins.length === 0) {
      return;
    }
    
    // 全プラグインを順番に実行
    this.currentProject.plugins.forEach(async (pluginData, index) => {
      try {
        // プラグインソースを安全に実行
        const safeCode = this.wrapPluginCode(pluginData.source);
        await this.executePluginCode(safeCode);
        
        console.log(`🔧 Plugin restored: ${pluginData.pluginId}`);
        
      } catch (error) {
        console.error(`Failed to restore plugin ${pluginData.pluginId}:`, error);
        this.showNotification(`Failed to restore plugin: ${pluginData.pluginId}`, 'error');
      }
    });
  }
  
  wrapPluginCode(source) {
    return `
      try {
        ${source}
      } catch (error) {
        console.error('Plugin execution error:', error);
        throw error;
      }
    `;
  }
  
  async executePluginCode(code) {
    // 安全な実行環境でプラグインを実行
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    const executeFn = new AsyncFunction('voidCore', 'Message', 'createPlugin', 'createComfortablePlugin', code);
    
    // VoidCoreシステムへの参照を渡す
    await executeFn(
      this.voidCore,
      window.Message,
      window.createPlugin,
      window.createComfortablePlugin
    );
  }

  // ==========================================
  // 🌊 メッセージフロー管理
  // ==========================================
  
  updateMessageFlow() {
    const flowMap = new Map();
    
    // 各プラグインのメッセージタイプから接続を構築
    this.currentProject.plugins.forEach(plugin => {
      plugin.messageTypes.publishes.forEach(publishType => {
        this.currentProject.plugins.forEach(otherPlugin => {
          if (plugin.pluginId !== otherPlugin.pluginId) {
            if (otherPlugin.messageTypes.subscribes.includes(publishType)) {
              const connectionKey = `${plugin.pluginId} → ${otherPlugin.pluginId}`;
              if (!flowMap.has(connectionKey)) {
                flowMap.set(connectionKey, []);
              }
              flowMap.get(connectionKey).push(publishType);
            }
          }
        });
      });
    });
    
    // フロー情報を保存
    this.currentProject.messageFlow = Object.fromEntries(flowMap);
    
    // UI更新
    this.updateFlowDiagram();
  }
  
  updateFlowDiagram() {
    if (!this.elements.flowDiagram) return;
    
    const flowMap = new Map(Object.entries(this.currentProject.messageFlow));
    
    if (flowMap.size === 0) {
      this.elements.flowDiagram.innerHTML = '<div class="no-flow">No message flow defined</div>';
      return;
    }
    
    let flowHTML = '';
    flowMap.forEach((messages, connection) => {
      flowHTML += `
        <div class="flow-item">
          <strong>${connection}</strong>
          <div style="margin-left: 20px; color: #888;">
            Messages: ${messages.join(', ')}
          </div>
        </div>
        <div class="flow-arrow">↓</div>
      `;
    });
    
    this.elements.flowDiagram.innerHTML = flowHTML;
  }

  // ==========================================
  // 📚 プロジェクト履歴
  // ==========================================
  
  loadProjectHistory() {
    const historyData = localStorage.getItem('voidcore-project-history');
    if (historyData) {
      try {
        this.projectHistory = JSON.parse(historyData);
      } catch (error) {
        console.error('Failed to load project history:', error);
        this.projectHistory = [];
      }
    }
    
    this.updateHistoryUI();
  }
  
  updateProjectHistory(projectData) {
    // 履歴から重複を削除
    this.projectHistory = this.projectHistory.filter(p => p.id !== projectData.id);
    
    // 新しいプロジェクトを先頭に追加
    this.projectHistory.unshift(projectData);
    
    // 履歴数制限
    if (this.projectHistory.length > 10) {
      this.projectHistory.splice(10);
    }
    
    // LocalStorageに保存
    localStorage.setItem('voidcore-project-history', JSON.stringify(this.projectHistory));
    
    this.updateHistoryUI();
  }
  
  updateHistoryUI() {
    if (!this.elements.historyList) return;
    
    this.elements.historyList.innerHTML = '';
    
    if (this.projectHistory.length === 0) {
      this.elements.historyList.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">No recent projects</div>';
      return;
    }
    
    this.projectHistory.forEach(project => {
      const item = document.createElement('div');
      item.className = 'history-item';
      item.onclick = () => this.loadProject(project.id);
      
      const lastModified = new Date(project.metadata.lastModified).toLocaleDateString();
      
      item.innerHTML = `
        <div class="history-name">${project.metadata.name}</div>
        <div class="history-meta">
          ${project.plugins.length} plugins • ${lastModified}
        </div>
      `;
      
      this.elements.historyList.appendChild(item);
    });
  }

  // ==========================================
  // 🔧 ユーティリティ
  // ==========================================
  
  newProject() {
    this.currentProject = { ...this.defaultProject };
    this.currentProject.metadata.created = Date.now();
    this.currentProject.metadata.lastModified = Date.now();
    
    // UI更新
    document.getElementById('projectName').value = this.currentProject.metadata.name;
    document.getElementById('projectDescription').value = this.currentProject.metadata.description;
    
    this.updateUI();
    this.showNotification('New project created!', 'success');
  }
  
  generateProjectId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  setupEventListeners() {
    // プロジェクトボタン
    document.getElementById('newProjectBtn').addEventListener('click', () => this.newProject());
    document.getElementById('saveProjectBtn').addEventListener('click', () => this.saveProject());
    document.getElementById('loadProjectBtn').addEventListener('click', () => this.loadProject());
    document.getElementById('exportProjectBtn').addEventListener('click', () => this.exportProjectZip());
    document.getElementById('importProjectBtn').addEventListener('click', () => this.importProject());
    document.getElementById('addPluginBtn').addEventListener('click', () => this.addCurrentPlugin());
    
    // プロジェクト名・説明の自動更新
    const projectName = document.getElementById('projectName');
    const projectDescription = document.getElementById('projectDescription');
    
    if (projectName) {
      projectName.addEventListener('input', () => {
        if (this.currentProject) {
          this.currentProject.metadata.name = projectName.value;
          this.currentProject.metadata.lastModified = Date.now();
        }
      });
    }
    
    if (projectDescription) {
      projectDescription.addEventListener('input', () => {
        if (this.currentProject) {
          this.currentProject.metadata.description = projectDescription.value;
          this.currentProject.metadata.lastModified = Date.now();
        }
      });
    }
  }
  
  updateUI() {
    this.updatePluginsListUI();
    this.updateFlowDiagram();
    this.updateHistoryUI();
  }
  
  updatePluginsListUI() {
    if (!this.elements.pluginsList) return;
    
    this.elements.pluginsList.innerHTML = '';
    
    if (this.currentProject.plugins.length === 0) {
      this.elements.pluginsList.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">No plugins added</div>';
      return;
    }
    
    this.currentProject.plugins.forEach((plugin, index) => {
      const item = document.createElement('div');
      item.className = 'plugin-item';
      item.onclick = () => this.selectPlugin(plugin.id, index);
      
      item.innerHTML = `
        <div class="plugin-name">${plugin.name || plugin.id}</div>
        <div class="plugin-info">
          <span>v${plugin.version || '1.0.0'}</span>
          <span>${plugin.capabilities.length > 0 ? plugin.capabilities.join(', ') : 'No capabilities'}</span>
        </div>
        <div class="plugin-messages">
          <span>📥 ${plugin.messageTypes.subscribes.length} subs</span>
          <span>📤 ${plugin.messageTypes.publishes.length} pubs</span>
        </div>
      `;
      
      this.elements.pluginsList.appendChild(item);
    });
  }
  
  selectPlugin(pluginId, index) {
    // プラグイン選択時の処理
    document.querySelectorAll('.plugin-item').forEach(item => {
      item.classList.remove('selected');
    });
    
    event.currentTarget.classList.add('selected');
    
    // プラグインをエディタに読み込み
    const plugin = this.currentProject.plugins[index];
    if (plugin && window.monacoEditor) {
      window.monacoEditor.setValue(plugin.sourceCode);
      this.showNotification(`Plugin loaded: ${plugin.name || plugin.id}`, 'info');
    }
  }
  
  startAutoSave() {
    if (this.autoSaveEnabled) {
      this.autoSaveInterval = setInterval(() => {
        if (this.currentProject) {
          this.saveProject();
        }
      }, 30000); // 30秒間隔
    }
  }
  
  showNotification(message, type = 'info') {
    // 簡単な通知表示
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 20px;
      border-radius: 4px;
      color: white;
      font-size: 14px;
      z-index: 9999;
      ${type === 'success' ? 'background: #73c991;' : 
        type === 'warning' ? 'background: #dcdcaa;' : 
        type === 'error' ? 'background: #f48771;' : 'background: #4fc1ff;'}
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3000);
  }
  
  dispose() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    
    if (this.elements.manager && this.container.contains(this.elements.manager)) {
      this.container.removeChild(this.elements.manager);
    }
    
    console.log('🧹 ProjectManager disposed');
  }
}

export default ProjectManager;