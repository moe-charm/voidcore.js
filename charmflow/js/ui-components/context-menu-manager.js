// context-menu-manager.js - 右クリックメニュー管理機能
// VoidCoreUI から分離された右クリックメニュー専用管理クラス

/**
 * 🖱️ ContextMenuManager - 右クリックメニューの管理
 * 
 * 責任:
 * - 右クリックメニューの表示・非表示
 * - プラグイン編集・削除メニュー
 * - 線の削除メニュー
 * - メニュー項目の動的生成
 * - メニュー位置の調整
 */
export class ContextMenuManager {
  constructor(nyaCoreUI, options = {}) {
    this.nyaCoreUI = nyaCoreUI
    this.voidFlowCore = options.voidFlowCore || null  // Phase Alpha: Intent統合
    this.menuElement = null
    this.currentTarget = null
    this.currentTargetType = null // 'plugin' | 'connection' | 'canvas'
    
    this.createContextMenu()
    this.setupEventListeners()
  }

  /**
   * 🎨 右クリックメニューのHTML作成
   */
  createContextMenu() {
    const menu = document.createElement('div')
    menu.id = 'voidflow-context-menu'
    menu.className = 'voidflow-context-menu'
    menu.style.cssText = `
      position: fixed;
      background: rgba(30, 30, 30, 0.95);
      border: 1px solid #4a90e2;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 9999;
      min-width: 180px;
      padding: 4px 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      color: white;
      display: none;
    `
    
    document.body.appendChild(menu)
    this.menuElement = menu
  }

  /**
   * 🖱️ イベントリスナー設定
   */
  setupEventListeners() {
    // 右クリックメニューを閉じる - Phase Alpha Intent統合
    document.addEventListener('click', async (e) => {
      if (this.voidFlowCore) {
        await this.voidFlowCore.sendIntent('voidflow.ui.contextmenu.close', {
          clickTarget: e.target.tagName || 'unknown',
          timestamp: Date.now()
        })
      }
      if (!this.menuElement.contains(e.target)) {
        this.hideMenu()
      }
    })
    
    // ESCキーでメニューを閉じる - Phase Alpha Intent統合
    document.addEventListener('keydown', async (e) => {
      if (this.voidFlowCore && e.key === 'Escape') {
        await this.voidFlowCore.sendIntent('voidflow.ui.contextmenu.escape', {
          key: e.key,
          timestamp: Date.now()
        })
      }
      if (e.key === 'Escape') {
        this.hideMenu()
      }
    })
  }

  /**
   * 📋 メニュー項目作成
   */
  createMenuItem(text, icon, action, options = {}) {
    const item = document.createElement('div')
    item.className = 'context-menu-item'
    item.innerHTML = `${icon} ${text}`
    item.style.cssText = `
      padding: 8px 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: background 0.2s;
      ${options.color ? `color: ${options.color};` : ''}
      ${options.disabled ? 'opacity: 0.5; cursor: not-allowed;' : ''}
    `
    
    if (!options.disabled) {
      item.addEventListener('mouseenter', async () => {
        if (this.voidFlowCore) {
          await this.voidFlowCore.sendIntent('voidflow.ui.contextmenu.item.hover', {
            itemText: text,
            action: 'enter',
            timestamp: Date.now()
          })
        }
        item.style.background = 'rgba(74, 144, 226, 0.2)'
      })
      
      item.addEventListener('mouseleave', async () => {
        if (this.voidFlowCore) {
          await this.voidFlowCore.sendIntent('voidflow.ui.contextmenu.item.hover', {
            itemText: text,
            action: 'leave',
            timestamp: Date.now()
          })
        }
        item.style.background = 'transparent'
      })
      
      item.addEventListener('click', async (e) => {
        e.stopPropagation()
        if (this.voidFlowCore) {
          await this.voidFlowCore.sendIntent('voidflow.ui.contextmenu.item.click', {
            itemText: text,
            targetType: this.currentTargetType,
            targetId: this.currentTarget,
            timestamp: Date.now()
          })
        }
        action()
        this.hideMenu()
      })
    }
    
    return item
  }

  /**
   * 📋 区切り線作成
   */
  createSeparator() {
    const separator = document.createElement('div')
    separator.style.cssText = `
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
      margin: 4px 0;
    `
    return separator
  }

  /**
   * 🎯 プラグイン用メニュー表示
   */
  showPluginMenu(pluginId, x, y) {
    console.log(`🎯 showPluginMenu called for: ${pluginId} at (${x}, ${y})`)
    this.nyaCoreUI.log(`🎯 右クリックメニュー表示: ${pluginId}`)
    this.currentTarget = pluginId
    this.currentTargetType = 'plugin'
    
    // メニュー内容をクリア
    this.menuElement.innerHTML = ''
    
    // メニュー項目を追加
    this.menuElement.appendChild(
      this.createMenuItem('🎨 Edit Code', '🎨', () => this.editPluginCode(pluginId))
    )
    
    this.menuElement.appendChild(
      this.createMenuItem('📝 Properties', '📝', () => this.showPluginProperties(pluginId))
    )
    
    this.menuElement.appendChild(this.createSeparator())
    
    this.menuElement.appendChild(
      this.createMenuItem('📋 Copy', '📋', () => this.copyPlugin(pluginId))
    )
    
    this.menuElement.appendChild(
      this.createMenuItem('📄 Duplicate', '📄', () => this.duplicatePlugin(pluginId))
    )
    
    this.menuElement.appendChild(this.createSeparator())
    
    this.menuElement.appendChild(
      this.createMenuItem('🗑️ Delete', '🗑️', () => this.deletePlugin(pluginId), { color: '#ff6b6b' })
    )
    
    this.showMenu(x, y)
  }

  /**
   * 🔗 接続線用メニュー表示
   */
  showConnectionMenu(connectionId, x, y) {
    this.currentTarget = connectionId
    this.currentTargetType = 'connection'
    
    // メニュー内容をクリア
    this.menuElement.innerHTML = ''
    
    this.menuElement.appendChild(
      this.createMenuItem('🔗 Edit Connection', '🔗', () => this.editConnection(connectionId))
    )
    
    this.menuElement.appendChild(this.createSeparator())
    
    this.menuElement.appendChild(
      this.createMenuItem('✂️ Delete Connection', '✂️', () => this.deleteConnection(connectionId), { color: '#ff6b6b' })
    )
    
    this.showMenu(x, y)
  }

  /**
   * 🖼️ キャンバス用メニュー表示
   */
  showCanvasMenu(x, y) {
    console.log(`🖼️ showCanvasMenu called at (${x}, ${y})`)
    this.currentTarget = null
    this.currentTargetType = 'canvas'
    
    // メニュー内容をクリア
    this.menuElement.innerHTML = ''
    
    this.menuElement.appendChild(
      this.createMenuItem('📋 Paste', '📋', () => this.pastePlugin(x, y))
    )
    
    this.menuElement.appendChild(this.createSeparator())
    
    this.menuElement.appendChild(
      this.createMenuItem('🎨 Canvas Properties', '🎨', () => this.showCanvasProperties())
    )
    
    this.showMenu(x, y)
  }

  /**
   * 📱 メニュー表示
   */
  showMenu(x, y) {
    // 画面境界チェック
    const menuRect = this.menuElement.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // 右端チェック
    if (x + menuRect.width > viewportWidth) {
      x = viewportWidth - menuRect.width - 10
    }
    
    // 下端チェック
    if (y + menuRect.height > viewportHeight) {
      y = viewportHeight - menuRect.height - 10
    }
    
    this.menuElement.style.left = `${x}px`
    this.menuElement.style.top = `${y}px`
    this.menuElement.style.display = 'block'
  }

  /**
   * 🔒 メニュー非表示
   */
  hideMenu() {
    this.menuElement.style.display = 'none'
    this.currentTarget = null
    this.currentTargetType = null
  }

  /**
   * 🎨 プラグインコード編集
   */
  async editPluginCode(pluginId) {
    this.nyaCoreUI.log(`🎨 Edit code for plugin: ${pluginId}`)
    
    // Monaco Editor を開く
    if (window.monacoPluginEditor && typeof window.monacoPluginEditor.openPluginEditor === 'function') {
      try {
        await window.monacoPluginEditor.openPluginEditor(pluginId)
      } catch (error) {
        this.nyaCoreUI.log(`❌ Monaco Editor error: ${error.message}`)
        alert(`Monaco Editor error: ${error.message}`)
      }
    } else {
      this.nyaCoreUI.log('❌ Monaco Editor not available or not initialized')
      alert('Monaco Editor not available. Please check if it is properly initialized.')
    }
  }

  /**
   * 📝 プラグインプロパティ表示
   */
  showPluginProperties(pluginId) {
    this.nyaCoreUI.log(`📝 Show properties for plugin: ${pluginId}`)
    // TODO: プロパティダイアログを実装
    alert(`Plugin Properties: ${pluginId}`)
  }

  /**
   * 🗑️ プラグイン削除
   */
  async deletePlugin(pluginId) {
    this.nyaCoreUI.log(`🗑️ Delete plugin: ${pluginId}`)
    
    // 確認ダイアログ
    if (confirm(`Delete plugin "${pluginId}"?`)) {
      try {
        // VoidCoreUI の削除メソッドを呼び出し
        await this.nyaCoreUI.removeUIPlugin(pluginId)
        this.nyaCoreUI.log(`✅ Plugin deleted: ${pluginId}`)
      } catch (error) {
        this.nyaCoreUI.log(`❌ Failed to delete plugin: ${error.message}`)
      }
    }
  }

  /**
   * 📋 プラグインコピー
   */
  copyPlugin(pluginId) {
    this.nyaCoreUI.log(`📋 Copy plugin: ${pluginId}`)
    // TODO: クリップボード機能を実装
    alert(`Plugin copied: ${pluginId}`)
  }

  /**
   * 📄 プラグイン複製
   */
  async duplicatePlugin(pluginId) {
    this.nyaCoreUI.log(`📄 Duplicate plugin start: ${pluginId}`)
    console.log(`📄 Duplicate plugin called for: ${pluginId}`)
    
    try {
      // 🔍 デバッグ: 利用可能なプラグインIDをチェック
      const allPluginIds = this.nyaCoreUI.elementManager.getPluginIds()
      const allElementIds = this.nyaCoreUI.elementManager.getElementIds()
      this.nyaCoreUI.log(`📄 Available plugin IDs: ${JSON.stringify(allPluginIds)}`)
      this.nyaCoreUI.log(`📄 Available element IDs: ${JSON.stringify(allElementIds)}`)
      this.nyaCoreUI.log(`📄 Target plugin ID: ${pluginId}`)
      
      // 元のプラグイン情報を取得
      this.nyaCoreUI.log(`📄 Getting original plugin: ${pluginId}`)
      const originalPlugin = this.nyaCoreUI.getUIPlugin(pluginId)
      const originalElement = this.nyaCoreUI.elementManager.getElement(pluginId)
      
      this.nyaCoreUI.log(`📄 Original plugin: ${originalPlugin ? 'found' : 'not found'}`)
      this.nyaCoreUI.log(`📄 Original element: ${originalElement ? 'found' : 'not found'}`)
      
      // 🔍 ElementとPluginが別々に管理されている可能性をチェック
      if (!originalPlugin && originalElement) {
        // 要素は見つかったがプラグインインスタンスがない場合
        this.nyaCoreUI.log(`📄 Element found but plugin instance missing, proceeding with element-based duplication`)
        
        // DOM要素が見つかった場合、それを使って複製
        const nodeType = originalElement.getAttribute('data-node-type') || 'input.text'
        this.nyaCoreUI.log(`📄 Found element with nodeType: ${nodeType}`)
        
        // 位置計算
        const originalRect = originalElement.getBoundingClientRect()
        const canvasRect = this.nyaCoreUI.canvasManager.canvasElement.getBoundingClientRect()
        const newPosition = {
          x: (originalRect.left - canvasRect.left) + 30,
          y: (originalRect.top - canvasRect.top) + 30
        }
        
        // 新しいプラグインを作成
        const newPluginId = await this.nyaCoreUI.createUIPlugin(nodeType, newPosition)
        
        // 元の設定値をコピー
        if (newPluginId) {
          const newElement = this.nyaCoreUI.elementManager.getElement(newPluginId)
          if (newElement) {
            const originalInput = originalElement.querySelector('input[type="text"]')
            const newInput = newElement.querySelector('input[type="text"]')
            if (originalInput && newInput && originalInput.value) {
              newInput.value = originalInput.value
              newElement.setAttribute('data-current-value', originalInput.value)
            }
            
            this.nyaCoreUI.log(`✅ Plugin duplicated via element: ${pluginId} → ${newPluginId}`)
            return
          }
        }
        
        throw new Error(`Failed to create duplicate plugin`)
      }
      
      if (!originalPlugin && !originalElement) {
        // DOM要素から直接探す
        const domElement = document.getElementById(`ui-element-${pluginId}`)
        this.nyaCoreUI.log(`📄 DOM element search: ${domElement ? 'found' : 'not found'}`)
        
        if (domElement) {
          // DOM要素が見つかった場合、それを使って複製
          const nodeType = domElement.getAttribute('data-node-type') || 'input.text'
          this.nyaCoreUI.log(`📄 Found DOM element with nodeType: ${nodeType}`)
          
          // 位置計算
          const originalRect = domElement.getBoundingClientRect()
          const canvasRect = this.nyaCoreUI.canvasManager.canvasElement.getBoundingClientRect()
          const newPosition = {
            x: (originalRect.left - canvasRect.left) + 30,
            y: (originalRect.top - canvasRect.top) + 30
          }
          
          // 新しいプラグインを作成
          const newPluginId = await this.nyaCoreUI.createUIPlugin(nodeType, newPosition)
          
          // 元の設定値をコピー
          if (newPluginId) {
            const newElement = this.nyaCoreUI.elementManager.getElement(newPluginId)
            if (newElement) {
              const originalInput = domElement.querySelector('input[type="text"]')
              const newInput = newElement.querySelector('input[type="text"]')
              if (originalInput && newInput && originalInput.value) {
                newInput.value = originalInput.value
                newElement.setAttribute('data-current-value', originalInput.value)
              }
              
              this.nyaCoreUI.log(`✅ Plugin duplicated via DOM: ${pluginId} → ${newPluginId}`)
              return
            }
          }
        }
        
        throw new Error(`Plugin not found: ${pluginId}`)
      }
      
      if (!originalPlugin || !originalElement) {
        throw new Error(`Plugin not found: ${pluginId}`)
      }
      
      // 🎯 通常のプラグイン・要素ベース複製
      this.nyaCoreUI.log(`📄 Using normal plugin-element based duplication`)
      
      // 元の位置から少しずらした位置を計算
      const originalRect = originalElement.getBoundingClientRect()
      const canvasRect = this.nyaCoreUI.canvasManager.canvasElement.getBoundingClientRect()
      const newPosition = {
        x: (originalRect.left - canvasRect.left) + 30,
        y: (originalRect.top - canvasRect.top) + 30
      }
      
      // プラグインタイプを取得
      const nodeType = originalPlugin.type || originalElement.getAttribute('data-node-type') || 'input.text'
      
      this.nyaCoreUI.log(`📄 Duplicating ${nodeType} from (${originalRect.left - canvasRect.left}, ${originalRect.top - canvasRect.top}) to (${newPosition.x}, ${newPosition.y})`)
      
      // 新しいプラグインを作成
      const newPluginId = await this.nyaCoreUI.createUIPlugin(nodeType, newPosition)
      
      // 元の設定値をコピー（テキスト入力値など）
      if (originalElement && newPluginId) {
        const newElement = this.nyaCoreUI.elementManager.getElement(newPluginId)
        if (newElement) {
          // テキスト入力値のコピー
          const originalInput = originalElement.querySelector('input[type="text"]')
          const newInput = newElement.querySelector('input[type="text"]')
          if (originalInput && newInput && originalInput.value) {
            newInput.value = originalInput.value
            newElement.setAttribute('data-current-value', originalInput.value)
          }
          
          this.nyaCoreUI.log(`✅ Plugin duplicated: ${pluginId} → ${newPluginId}`)
        }
      }
      
    } catch (error) {
      this.nyaCoreUI.log(`❌ Plugin duplication failed: ${error.message}`)
      alert(`Duplication failed: ${error.message}`)
    }
  }

  /**
   * ✂️ 接続削除
   */
  deleteConnection(connectionId) {
    this.nyaCoreUI.log(`✂️ Delete connection: ${connectionId}`)
    
    // 確認ダイアログ
    if (confirm(`Delete connection "${connectionId}"?`)) {
      try {
        // ConnectionManager の削除メソッドを呼び出し
        this.nyaCoreUI.connectionManager.removeConnection(connectionId)
        this.nyaCoreUI.log(`✅ Connection deleted: ${connectionId}`)
      } catch (error) {
        this.nyaCoreUI.log(`❌ Failed to delete connection: ${error.message}`)
      }
    }
  }

  /**
   * 🔗 接続編集
   */
  editConnection(connectionId) {
    this.nyaCoreUI.log(`🔗 Edit connection: ${connectionId}`)
    // TODO: 接続編集ダイアログを実装
    alert(`Edit connection: ${connectionId}`)
  }

  /**
   * 📋 プラグイン貼り付け
   */
  pastePlugin(x, y) {
    this.nyaCoreUI.log(`📋 Paste plugin at: (${x}, ${y})`)
    // TODO: 貼り付け機能を実装
    alert(`Paste plugin at: (${x}, ${y})`)
  }

  /**
   * 🎨 キャンバスプロパティ表示
   */
  showCanvasProperties() {
    this.nyaCoreUI.log(`🎨 Show canvas properties`)
    // TODO: キャンバスプロパティダイアログを実装
    alert(`Canvas Properties`)
  }
}