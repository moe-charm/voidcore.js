// input-text-plugin.js - Input Text ノードのVoidCoreプラグイン実装

import { CharmFlowNodePlugin } from '../charmflow-node-plugin.js'

/**
 * 📝 InputTextPlugin - テキスト入力ノードのVoidCoreプラグイン実装
 * 
 * 機能:
 * - ユーザーテキスト入力の受付
 * - 入力値の検証・変換
 * - テキストデータの出力
 */
export class InputTextPlugin extends CharmFlowNodePlugin {
  constructor(config = {}) {
    super('input.text', {
      ...config,
      properties: {
        text: config.properties?.text || 'Hello VoidFlow!',
        placeholder: config.properties?.placeholder || 'テキストを入力...',
        multiline: config.properties?.multiline || false,
        maxLength: config.properties?.maxLength || 1000
      }
    })
  }

  /**
   * 🚀 ノード実行処理
   */
  async executeNode(input) {
    // プロパティからテキストを取得
    const text = this.properties.text || ''
    
    // 入力値の検証
    if (typeof text !== 'string') {
      throw new Error('Invalid text input: must be string')
    }
    
    if (this.properties.maxLength && text.length > this.properties.maxLength) {
      throw new Error(`Text too long: max ${this.properties.maxLength} characters`)
    }
    
    // テキスト処理結果
    const result = {
      type: 'text',
      value: text,
      length: text.length,
      isEmpty: text.trim().length === 0,
      metadata: {
        nodeType: this.nodeType,
        nodeId: this.id,
        timestamp: Date.now(),
        multiline: this.properties.multiline
      }
    }
    
    // UI更新通知
    await this.sendIntent('charmflow.ui.updateOutput', {
      nodeId: this.id,
      output: `📝 テキスト: "${text}"`
    })
    
    this.log(`📝 Text input processed: "${text}" (${text.length} chars)`)
    
    return result
  }

  /**
   * ⚙️ プロパティ更新時の追加処理
   */
  async handlePropertyUpdate(payload) {
    const result = await super.handlePropertyUpdate(payload)
    
    // テキスト変更時は即座に実行
    if (payload.propertyName === 'text') {
      await this.handleExecuteRequest({
        input: {},
        autoTriggered: true,
        reason: 'property_changed'
      })
    }
    
    return result
  }

  /**
   * 📊 ノード固有状態
   */
  getNodeState() {
    const baseState = super.getNodeState()
    
    return {
      ...baseState,
      textLength: this.properties.text?.length || 0,
      isMultiline: this.properties.multiline,
      hasContent: !!this.properties.text?.trim()
    }
  }
}

export default InputTextPlugin