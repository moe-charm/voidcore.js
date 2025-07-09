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

  static initializeNodeFeatures(element, pluginId, voidCoreUI) {
    const sendButton = element.querySelector('.send-button');
    if (sendButton) {
      sendButton.addEventListener('click', (e) => {
        e.stopPropagation();
        voidCoreUI.handleSendButtonClick(pluginId); // voidCoreUIのメソッドを呼び出す
      });
    }
  }
}
