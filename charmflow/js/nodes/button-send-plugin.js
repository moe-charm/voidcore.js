// button-send-plugin.js - ボタン送信ノードプラグイン

import { CharmFlowNodePlugin } from '../charmflow-node-plugin.js'

/**
 * 🔘 ButtonSendPlugin - ボタンクリックで実行を開始するノード
 * 
 * 特徴:
 * - ユーザーのボタンクリックで実行開始
 * - 実行結果を接続先ノードに送信
 * - リッチUI展開対応（SimpleButtonComponent）
 */
export class ButtonSendPlugin extends CharmFlowNodePlugin {
  constructor(config = {}) {
    super('button.send', {
      ...config,
      displayName: config.displayName || 'Button: Send',
      // 🎨 UIコンポーネントタイプ指定（toggleExpand用）
      uiComponentType: 'SimpleButtonComponent',
      properties: {
        label: 'Send',
        buttonColor: '#007acc',
        textColor: '#ffffff',
        ...config.properties
      }
    })
    
    // ボタン固有の状態
    this.clickCount = 0
    this.lastClickTime = null
  }

  /**
   * 📨 メッセージ処理
   */
  async onMessage(message) {
    if (message.action === 'charmflow.button.click') {
      // ボタンクリック処理
      await this.handleButtonClick(message.payload)
    } else {
      // 基底クラスの処理
      return super.onMessage(message)
    }
  }

  /**
   * 🔘 ボタンクリック処理
   */
  async handleButtonClick(payload = {}) {
    this.clickCount++
    this.lastClickTime = Date.now()
    
    this.log(`🔘 Button clicked (${this.clickCount} times)`)
    
    // ボタンクリック実行
    const result = await this.execute({
      trigger: 'button-click',
      clickCount: this.clickCount,
      timestamp: this.lastClickTime,
      ...payload
    })
    
    return result
  }

  /**
   * ⚙️ ノード実行処理
   */
  async executeNode(input) {
    // ボタンノードは入力データをそのまま送信
    const output = {
      ...input,
      processedBy: this.id,
      nodeType: this.nodeType,
      label: this.properties.label,
      executedAt: Date.now()
    }
    
    // 実行通知
    await this.sendIntent('charmflow.button.executed', {
      nodeId: this.id,
      label: this.properties.label,
      clickCount: this.clickCount
    })
    
    return output
  }

  /**
   * 📊 ノード状態取得（拡張）
   */
  getNodeState() {
    const baseState = super.getNodeState()
    
    return {
      ...baseState,
      clickCount: this.clickCount,
      lastClickTime: this.lastClickTime,
      buttonLabel: this.properties.label
    }
  }
}

// グローバル登録
window.ButtonSendPlugin = ButtonSendPlugin

export default ButtonSendPlugin