// plugin-serializer.js - VoidFlow プラグインJSON保存システム
// プラグインの完全なシリアライゼーション・デシリアライゼーション

import { PluginAttributes } from './plugin-attributes.js'

/**
 * 💾 PluginSerializer - プラグインJSON保存システム
 * 
 * プラグインを.vplugin.json形式で保存・読み込みするシステム
 * - 完全なメタデータ保存
 * - 属性システム統合
 * - ソースコード保存
 * - 依存関係管理
 * - バージョン管理
 */
export class PluginSerializer {
  constructor() {
    this.version = '1.0.0'
    this.fileExtension = '.vplugin.json'
    this.mimeType = 'application/json'
    
    // シリアライゼーション設定
    this.options = {
      includeSourceCode: true,
      includeAttributes: true,
      includeUsageStats: true,
      includeMetadata: true,
      compressOutput: false,
      validateOnSave: true
    }
    
    this.log('💾 PluginSerializer initialized')
  }
  
  log(message) {
    console.log(`[PluginSerializer] ${message}`)
  }
  
  /**
   * プラグインのシリアライゼーション
   */
  serialize(plugin, options = {}) {
    const config = { ...this.options, ...options }
    
    try {
      this.log(`💾 Serializing plugin: ${plugin.id}`)
      
      // 基本情報
      const serialized = {
        // メタデータ
        formatVersion: this.version,
        pluginVersion: plugin.version || '1.0.0',
        createdAt: Date.now(),
        createdBy: 'VoidFlow Plugin System',
        
        // プラグイン識別情報
        id: plugin.id,
        displayName: plugin.displayName || plugin.id,
        type: plugin.type || 'custom',
        
        // 属性システム
        attributes: config.includeAttributes && plugin.attributes ? 
          this.serializeAttributes(plugin.attributes) : null,
        
        // ソースコード
        sourceCode: config.includeSourceCode ? 
          this.serializeSourceCode(plugin) : null,
        
        // 機能・メソッド情報
        methods: this.serializeMethods(plugin),
        
        // 依存関係
        dependencies: this.serializeDependencies(plugin),
        
        // 設定・プロパティ
        configuration: this.serializeConfiguration(plugin),
        
        // 実行統計
        statistics: config.includeUsageStats ? 
          this.serializeStatistics(plugin) : null,
        
        // 追加メタデータ
        metadata: config.includeMetadata ? 
          this.serializeMetadata(plugin) : null
      }
      
      // 検証
      if (config.validateOnSave) {
        this.validateSerialized(serialized)
      }
      
      this.log(`✅ Plugin serialized successfully: ${plugin.id}`)
      return serialized
      
    } catch (error) {
      this.log(`❌ Serialization failed: ${error.message}`)
      throw new Error(`Plugin serialization failed: ${error.message}`)
    }
  }
  
  /**
   * 属性のシリアライゼーション
   */
  serializeAttributes(attributes) {
    if (attributes instanceof PluginAttributes) {
      return attributes.toJSON()
    } else if (typeof attributes === 'object') {
      return new PluginAttributes(attributes).toJSON()
    }
    return null
  }
  
  /**
   * ソースコードのシリアライゼーション
   */
  serializeSourceCode(plugin) {
    const sourceCode = {
      main: null,
      methods: {},
      dependencies: []
    }
    
    // メインソースコード
    if (plugin.sourceCode) {
      sourceCode.main = plugin.sourceCode
    } else {
      // 関数からソースコードを抽出
      sourceCode.main = this.extractSourceFromMethods(plugin)
    }
    
    // 個別メソッドのソースコード
    Object.entries(plugin).forEach(([key, value]) => {
      if (typeof value === 'function') {
        sourceCode.methods[key] = {
          source: value.toString(),
          async: value.constructor.name === 'AsyncFunction',
          parameters: this.extractParameters(value)
        }
      }
    })
    
    return sourceCode
  }
  
  /**
   * メソッド情報のシリアライゼーション
   */
  serializeMethods(plugin) {
    const methods = {}
    
    Object.entries(plugin).forEach(([key, value]) => {
      if (typeof value === 'function') {
        methods[key] = {
          type: 'function',
          async: value.constructor.name === 'AsyncFunction',
          parameters: this.extractParameters(value),
          description: this.extractDocumentation(value)
        }
      }
    })
    
    return methods
  }
  
  /**
   * 依存関係のシリアライゼーション
   */
  serializeDependencies(plugin) {
    const dependencies = {
      plugins: [],
      modules: [],
      external: []
    }
    
    // プラグインの依存関係
    if (plugin.dependencies) {
      dependencies.plugins = Array.isArray(plugin.dependencies) ? 
        plugin.dependencies : [plugin.dependencies]
    }
    
    // 属性からの依存関係
    if (plugin.attributes && plugin.attributes.dependencies) {
      dependencies.external = plugin.attributes.dependencies
    }
    
    // ソースコードからの依存関係抽出
    if (plugin.sourceCode) {
      dependencies.modules = this.extractImports(plugin.sourceCode)
    }
    
    return dependencies
  }
  
  /**
   * 設定のシリアライゼーション
   */
  serializeConfiguration(plugin) {
    const configuration = {
      settings: {},
      properties: {},
      defaultValues: {}
    }
    
    // 設定値
    if (plugin.settings) {
      configuration.settings = { ...plugin.settings }
    }
    
    // プロパティ
    Object.entries(plugin).forEach(([key, value]) => {
      if (typeof value !== 'function' && key !== 'attributes' && key !== 'sourceCode') {
        configuration.properties[key] = {
          value: value,
          type: typeof value,
          serializable: this.isSerializable(value)
        }
      }
    })
    
    return configuration
  }
  
  /**
   * 統計情報のシリアライゼーション
   */
  serializeStatistics(plugin) {
    const statistics = {
      usage: {
        frequency: 0,
        lastUsed: null,
        totalExecutions: 0,
        averageExecutionTime: 0
      },
      performance: {
        memoryUsage: 0,
        cpuUsage: 0,
        loadTime: 0
      },
      errors: {
        totalErrors: 0,
        lastError: null,
        commonErrors: []
      }
    }
    
    // 属性からの統計情報
    if (plugin.attributes && plugin.attributes.usage) {
      statistics.usage = { ...plugin.attributes.usage }
    }
    
    // ランタイム統計
    if (plugin.stats) {
      Object.assign(statistics, plugin.stats)
    }
    
    return statistics
  }
  
  /**
   * メタデータのシリアライゼーション
   */
  serializeMetadata(plugin) {
    const metadata = {
      author: 'Anonymous',
      license: 'MIT',
      version: '1.0.0',
      description: '',
      keywords: [],
      documentation: null,
      examples: [],
      changelog: []
    }
    
    // 属性からのメタデータ
    if (plugin.attributes) {
      Object.assign(metadata, plugin.attributes.metadata || {})
      metadata.author = plugin.attributes.author || metadata.author
      metadata.license = plugin.attributes.license || metadata.license
      metadata.version = plugin.attributes.version || metadata.version
    }
    
    // プラグイン直接のメタデータ
    if (plugin.metadata) {
      Object.assign(metadata, plugin.metadata)
    }
    
    return metadata
  }
  
  /**
   * プラグインのデシリアライゼーション
   */
  deserialize(serializedData, options = {}) {
    try {
      this.log(`📦 Deserializing plugin: ${serializedData.id}`)
      
      // 基本検証
      this.validateSerialized(serializedData)
      
      // プラグインオブジェクト構築
      const plugin = {
        id: serializedData.id,
        displayName: serializedData.displayName,
        type: serializedData.type,
        version: serializedData.pluginVersion
      }
      
      // 属性の復元
      if (serializedData.attributes) {
        plugin.attributes = PluginAttributes.fromJSON(serializedData.attributes)
      }
      
      // ソースコードの復元
      if (serializedData.sourceCode) {
        this.deserializeSourceCode(plugin, serializedData.sourceCode)
      }
      
      // メソッドの復元
      if (serializedData.methods) {
        this.deserializeMethods(plugin, serializedData.methods)
      }
      
      // 設定の復元
      if (serializedData.configuration) {
        this.deserializeConfiguration(plugin, serializedData.configuration)
      }
      
      // 統計の復元
      if (serializedData.statistics) {
        plugin.stats = serializedData.statistics
      }
      
      // メタデータの復元
      if (serializedData.metadata) {
        plugin.metadata = serializedData.metadata
      }
      
      this.log(`✅ Plugin deserialized successfully: ${plugin.id}`)
      return plugin
      
    } catch (error) {
      this.log(`❌ Deserialization failed: ${error.message}`)
      throw new Error(`Plugin deserialization failed: ${error.message}`)
    }
  }
  
  /**
   * ソースコードの復元
   */
  deserializeSourceCode(plugin, sourceCodeData) {
    if (sourceCodeData.main) {
      plugin.sourceCode = sourceCodeData.main
    }
    
    // メソッドの復元
    if (sourceCodeData.methods) {
      Object.entries(sourceCodeData.methods).forEach(([methodName, methodData]) => {
        try {
          if (methodData.async) {
            plugin[methodName] = new AsyncFunction('return ' + methodData.source)()
          } else {
            plugin[methodName] = new Function('return ' + methodData.source)()
          }
        } catch (error) {
          this.log(`⚠️ Failed to restore method ${methodName}: ${error.message}`)
        }
      })
    }
  }
  
  /**
   * メソッドの復元
   */
  deserializeMethods(plugin, methodsData) {
    Object.entries(methodsData).forEach(([methodName, methodInfo]) => {
      if (methodInfo.type === 'function') {
        // メソッドの基本情報を設定
        plugin[`${methodName}_info`] = methodInfo
      }
    })
  }
  
  /**
   * 設定の復元
   */
  deserializeConfiguration(plugin, configData) {
    if (configData.settings) {
      plugin.settings = configData.settings
    }
    
    if (configData.properties) {
      Object.entries(configData.properties).forEach(([key, propData]) => {
        if (propData.serializable) {
          plugin[key] = propData.value
        }
      })
    }
  }
  
  /**
   * ファイルへの保存
   */
  async saveToFile(plugin, filename = null) {
    try {
      const serialized = this.serialize(plugin)
      const jsonString = JSON.stringify(serialized, null, 2)
      
      const finalFilename = filename || `${plugin.id}${this.fileExtension}`
      
      // ブラウザでのファイル保存
      const blob = new Blob([jsonString], { type: this.mimeType })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = finalFilename
      a.click()
      
      URL.revokeObjectURL(url)
      
      this.log(`💾 Plugin saved to file: ${finalFilename}`)
      return finalFilename
      
    } catch (error) {
      this.log(`❌ Save to file failed: ${error.message}`)
      throw error
    }
  }
  
  /**
   * ファイルからの読み込み
   */
  async loadFromFile(file) {
    try {
      const text = await file.text()
      const serialized = JSON.parse(text)
      
      const plugin = this.deserialize(serialized)
      
      this.log(`📦 Plugin loaded from file: ${file.name}`)
      return plugin
      
    } catch (error) {
      this.log(`❌ Load from file failed: ${error.message}`)
      throw error
    }
  }
  
  /**
   * 複数プラグインの一括保存
   */
  async saveMultiplePlugins(plugins, archiveName = 'plugins') {
    try {
      const JSZip = await this.loadJSZip()
      const zip = new JSZip()
      
      // プラグインフォルダ作成
      const pluginsFolder = zip.folder('plugins')
      
      // マニフェストファイル作成
      const manifest = {
        version: this.version,
        createdAt: Date.now(),
        totalPlugins: plugins.length,
        plugins: []
      }
      
      // 各プラグインを保存
      for (const plugin of plugins) {
        const serialized = this.serialize(plugin)
        const filename = `${plugin.id}${this.fileExtension}`
        
        pluginsFolder.file(filename, JSON.stringify(serialized, null, 2))
        
        manifest.plugins.push({
          id: plugin.id,
          filename: filename,
          displayName: plugin.displayName,
          category: plugin.attributes?.category || 'unknown',
          version: plugin.version || '1.0.0'
        })
      }
      
      // マニフェストファイルを追加
      zip.file('manifest.json', JSON.stringify(manifest, null, 2))
      
      // ZIPファイル生成
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      
      // ダウンロード
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${archiveName}.zip`
      a.click()
      
      URL.revokeObjectURL(url)
      
      this.log(`📦 ${plugins.length} plugins saved to archive: ${archiveName}.zip`)
      return `${archiveName}.zip`
      
    } catch (error) {
      this.log(`❌ Multiple plugins save failed: ${error.message}`)
      throw error
    }
  }
  
  // ヘルパーメソッド
  
  /**
   * 関数のパラメータを抽出
   */
  extractParameters(func) {
    const funcStr = func.toString()
    const match = funcStr.match(/\(([^)]*)\)/)
    if (match) {
      return match[1].split(',').map(param => param.trim()).filter(param => param)
    }
    return []
  }
  
  /**
   * 関数のドキュメントを抽出
   */
  extractDocumentation(func) {
    const funcStr = func.toString()
    const match = funcStr.match(/\/\*\*([\s\S]*?)\*\//)
    return match ? match[1].trim() : null
  }
  
  /**
   * ソースコードからimportを抽出
   */
  extractImports(sourceCode) {
    const imports = []
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g
    let match
    
    while ((match = importRegex.exec(sourceCode)) !== null) {
      imports.push(match[1])
    }
    
    return imports
  }
  
  /**
   * 値がシリアライズ可能かチェック
   */
  isSerializable(value) {
    try {
      JSON.stringify(value)
      return true
    } catch {
      return false
    }
  }
  
  /**
   * メソッドからソースコードを抽出
   */
  extractSourceFromMethods(plugin) {
    const methods = []
    
    Object.entries(plugin).forEach(([key, value]) => {
      if (typeof value === 'function') {
        methods.push(`${key}: ${value.toString()}`)
      }
    })
    
    return `{\n  ${methods.join(',\n  ')}\n}`
  }
  
  /**
   * シリアライズされたデータの検証
   */
  validateSerialized(data) {
    const required = ['id', 'displayName', 'formatVersion']
    
    for (const field of required) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`)
      }
    }
    
    if (data.formatVersion !== this.version) {
      this.log(`⚠️ Format version mismatch: ${data.formatVersion} vs ${this.version}`)
    }
    
    return true
  }
  
  /**
   * JSZipライブラリの動的読み込み
   */
  async loadJSZip() {
    if (window.JSZip) {
      return window.JSZip
    }
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
      script.onload = () => resolve(window.JSZip)
      script.onerror = () => reject(new Error('Failed to load JSZip'))
      document.head.appendChild(script)
    })
  }
}

// グローバルインスタンス
export const pluginSerializer = new PluginSerializer()

console.log('💾 PluginSerializer system loaded!')