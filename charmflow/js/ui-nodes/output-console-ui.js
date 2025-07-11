// output-console-ui.js - Output: Console ノードのUIコンポーネント

export class OutputConsoleUI {
  static getAdditionalContent(pluginId) {
    return `
      <div style="margin: 8px 0;">
        <div class="console-output" data-plugin-id="${pluginId}" style="
          background: rgba(0,0,0,0.3);
          border: 1px solid #555;
          color: #80c0ff;
          padding: 4px 6px;
          border-radius: 3px;
          font-size: 9px;
          font-family: monospace;
          min-height: 20px;
          max-height: 40px;
          overflow-y: auto;
        ">出力待機中...</div>
      </div>
    `;
  }
}
