// selection-manager.js - 選択管理機能
// VoidCoreUI から分離された選択機能専用管理クラス

import { Message } from '/src/messaging/message.js'

/**
 * 🎯 SelectionManager - UI要素の選択状態管理
 * 
 * 責任:
 * - 要素の選択/非選択状態管理
 * - 複数選択サポート
 * - 選択状態の視覚的表現
 * - 選択イベントの通知
 * - 選択状態のクリア
 */
export class SelectionManager {
  constructor(nyaCoreUI) {
    this.nyaCoreUI = nyaCoreUI
    this.selectedElements = new Set()
  }

  /**
   * 🎯 要素の選択状態を更新
   */
  updateElementSelection(data) {
    const { elementId, selected } = data
    const element = this.nyaCoreUI.uiElements.get(String(elementId))
    
    if (element) {
      if (selected) {
        element.classList.add('selected')
        this.selectedElements.add(elementId)
      } else {
        element.classList.remove('selected')
        this.selectedElements.delete(elementId)
      }
      
      this.nyaCoreUI.voidCore.base.publish(Message.notice('ui.element.selected', {
        elementId: elementId,
        selected: selected,
        selectedCount: this.selectedElements.size
      }))
    }
  }

  /**
   * 🎯 要素を選択
   */
  selectElement(elementId) {
    this.updateElementSelection({ elementId, selected: true })
  }

  /**
   * 🎯 要素の選択を解除
   */
  deselectElement(elementId) {
    this.updateElementSelection({ elementId, selected: false })
  }

  /**
   * 🎯 要素の選択状態をトグル
   */
  toggleElementSelection(elementId) {
    const isSelected = this.selectedElements.has(elementId)
    this.updateElementSelection({ elementId, selected: !isSelected })
  }

  /**
   * 🧹 全選択解除
   */
  clearAllSelections() {
    const selectedIds = Array.from(this.selectedElements)
    selectedIds.forEach(elementId => {
      this.deselectElement(elementId)
    })
  }

  /**
   * ✅ 要素が選択されているかチェック
   */
  isElementSelected(elementId) {
    return this.selectedElements.has(elementId)
  }

  /**
   * 📋 選択された要素IDの配列取得
   */
  getSelectedElementIds() {
    return Array.from(this.selectedElements)
  }

  /**
   * 🔢 選択数取得
   */
  getSelectedCount() {
    return this.selectedElements.size
  }

  /**
   * 🎯 複数要素を一括選択
   */
  selectMultipleElements(elementIds) {
    elementIds.forEach(elementId => {
      this.selectElement(elementId)
    })
  }

  /**
   * 🎯 選択範囲での要素選択（矩形選択など）
   */
  selectElementsInRange(x1, y1, x2, y2) {
    const minX = Math.min(x1, x2)
    const maxX = Math.max(x1, x2)
    const minY = Math.min(y1, y2)
    const maxY = Math.max(y1, y2)

    this.nyaCoreUI.uiElements.forEach((element, elementId) => {
      const rect = element.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      if (centerX >= minX && centerX <= maxX && centerY >= minY && centerY <= maxY) {
        this.selectElement(elementId)
      }
    })
  }

  /**
   * 📊 選択状態の統計情報
   */
  getSelectionStats() {
    return {
      selectedCount: this.selectedElements.size,
      selectedIds: this.getSelectedElementIds(),
      totalElements: this.nyaCoreUI.uiElements.size,
      selectionRatio: this.nyaCoreUI.uiElements.size > 0 
        ? this.selectedElements.size / this.nyaCoreUI.uiElements.size 
        : 0
    }
  }

  /**
   * 🔍 デバッグ情報取得
   */
  getDebugInfo() {
    return {
      selectedElements: Array.from(this.selectedElements),
      selectedCount: this.selectedElements.size
    }
  }
}