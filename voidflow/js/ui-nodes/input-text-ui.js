// input-text-ui.js - Input: Text ノードのUIコンポーネント

export class InputTextUI {
  static getAdditionalContent(pluginId) {
    return `
      <div style="margin: 8px 0;">
        <input type="text" class="text-input" data-plugin-id="${pluginId}" placeholder="テキストを入力" style="
          background: rgba(255,255,255,0.1);
          border: 1px solid #4a90e2;
          color: white;
          padding: 4px 8px;
          border-radius: 3px;
          font-size: 10px;
          width: 100%;
          box-sizing: border-box;
        ">
      </div>
    `;
  }

  static initializeNodeFeatures(element, pluginId, voidCoreUI) {
    const textInput = element.querySelector('.text-input');
    if (textInput) {
      textInput.addEventListener('input', async (e) => {
        // Phase Alpha: Intent統合
        if (voidCoreUI.voidFlowCore) {
          await voidCoreUI.voidFlowCore.sendIntent('voidflow.ui.input.text.change', {
            pluginId,
            value: e.target.value,
            timestamp: Date.now()
          });
        }
        voidCoreUI.handleTextInputChange(pluginId, e.target.value);
      });

      textInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
          // Phase Alpha: Intent統合
          if (voidCoreUI.voidFlowCore) {
            await voidCoreUI.voidFlowCore.sendIntent('voidflow.ui.input.text.submit', {
              pluginId,
              value: e.target.value,
              key: e.key,
              timestamp: Date.now()
            });
          }
          voidCoreUI.handleTextInputSubmit(pluginId, e.target.value);
        }
      });
    }
  }
}
