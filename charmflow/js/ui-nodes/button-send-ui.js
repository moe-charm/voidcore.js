// button-send-ui.js - Button: Send ノードのUIコンポーネント

export class ButtonSendUI {
  static getAdditionalContent(pluginId) {
    return `
      <div style="margin: 8px 0;">
        <button class="send-button" data-plugin-id="${pluginId}" style="
          background: linear-gradient(145deg, #ff6b6b, #ee5a52);
          border: none;
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">🚀 送信</button>
      </div>
    `;
  }

  static initializeNodeFeatures(element, pluginId, nyaCoreUI) {
    const sendButton = element.querySelector('.send-button');
    if (sendButton) {
      sendButton.addEventListener('click', async (e) => {
        console.log(`🖱️ Button clicked for: ${pluginId}`);
        
        // Phase Alpha: Intent統合
        if (nyaCoreUI.voidFlowCore) {
          await nyaCoreUI.voidFlowCore.sendIntent('voidflow.ui.button.send.click', {
            pluginId,
            buttonType: 'send',
            timestamp: Date.now()
          });
        }
        
        // 🔗 接続管理のためにConnectionManagerに処理を委譲
        if (window.connectionManager && window.connectionManager.handlePluginClick) {
          console.log(`🔗 Delegating button click to ConnectionManager for: ${pluginId}`);
          window.connectionManager.handlePluginClick(pluginId, e);
        }
        
        e.stopPropagation();
        nyaCoreUI.handleSendButtonClick(pluginId); // nyaCoreUIのメソッドを呼び出す
      });
    }
  }
}
