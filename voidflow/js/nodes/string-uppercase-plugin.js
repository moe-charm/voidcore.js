// string-uppercase-plugin.js - String UpperCase ノードのVoidCoreプラグイン実装

import { VoidFlowNodePlugin } from '../voidflow-node-plugin.js'

/**
 * 🔤 StringUppercasePlugin - 文字列大文字変換ノードのVoidCoreプラグイン実装
 * 
 * 機能:
 * - 入力テキストの大文字変換
 * - 文字列処理オプション
 * - 処理統計の記録
 */
export class StringUppercasePlugin extends VoidFlowNodePlugin {
  constructor(config = {}) {
    super('string.uppercase', {
      ...config,
      properties: {
        trimSpaces: config.properties?.trimSpaces || true,
        preserveNumbers: config.properties?.preserveNumbers || true,
        locale: config.properties?.locale || 'en-US'
      }
    })
    
    // 処理統計
    this.processingStats = {
      totalProcessed: 0,
      totalCharacters: 0,
      averageLength: 0
    }
  }

  /**
   * 🚀 ノード実行処理
   */
  async executeNode(input) {
    let inputText = ''
    
    // 入力データの解析
    if (typeof input === 'string') {
      inputText = input
    } else if (input && typeof input.value === 'string') {
      inputText = input.value
    } else if (input && typeof input.text === 'string') {
      inputText = input.text
    } else {
      throw new Error('Invalid input: expected string or object with text/value property')
    }
    
    // 前処理
    let processedText = inputText
    if (this.properties.trimSpaces) {
      processedText = processedText.trim()
    }
    
    // 大文字変換
    const uppercaseText = processedText.toLocaleUpperCase(this.properties.locale)
    
    // 統計更新
    this.updateProcessingStats(inputText, uppercaseText)
    
    // 処理結果
    const result = {
      type: 'text',
      value: uppercaseText,
      originalValue: inputText,
      length: uppercaseText.length,
      originalLength: inputText.length,
      transformation: 'uppercase',
      metadata: {
        nodeType: this.nodeType,
        nodeId: this.id,
        timestamp: Date.now(),
        locale: this.properties.locale,
        trimmed: this.properties.trimSpaces && inputText !== inputText.trim()
      }
    }
    
    // UI更新通知（VoidCore互換版）
    try {
      if (this.core && this.core.sendIntent) {
        await this.core.sendIntent('voidflow.ui.updateOutput', {
          nodeId: this.id,
          output: `🔤 大文字変換: "${uppercaseText}"`
        })
      }
    } catch (error) {
      // UI更新失敗は無視（必須ではない）
      console.warn('UI update failed:', error.message)
    }
    
    this.log(`🔤 String uppercase conversion: "${inputText}" → "${uppercaseText}"`)
    
    return result
  }

  /**
   * 📊 処理統計更新
   */
  updateProcessingStats(inputText, outputText) {
    this.processingStats.totalProcessed++
    this.processingStats.totalCharacters += inputText.length
    this.processingStats.averageLength = 
      this.processingStats.totalCharacters / this.processingStats.totalProcessed
  }

  /**
   * 🎯 自動実行判定（文字列処理ノードは常に自動実行）
   */
  shouldAutoExecute(payload) {
    // データフローでの自動実行（より柔軟な判定）
    return payload.connectionType === 'data-flow' || 
           payload.autoExecution === true ||
           payload.triggerType === 'dataflow'
  }

  /**
   * 📊 ノード固有状態
   */
  getNodeState() {
    const baseState = super.getNodeState()
    
    return {
      ...baseState,
      processingStats: this.processingStats,
      locale: this.properties.locale,
      trimSpaces: this.properties.trimSpaces
    }
  }

  /**
   * 🧪 テスト用メソッド
   */
  async testTransformation(testText) {
    const result = await this.executeNode(testText)
    return {
      input: testText,
      output: result.value,
      success: true
    }
  }
}

export default StringUppercasePlugin