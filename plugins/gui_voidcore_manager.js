// plugins/gui_voidcore_manager.js
import { AutonomousPlugin } from '../src/autonomous_plugin.js';
import { board } from '../src/core.js'; // Need board for logging and setting log element

export class GUIVoidCoreManager extends AutonomousPlugin {
  constructor() {
    super("GUIVoidCoreManagerService"); // Provide this plugin as a service

    this.demos = {
      'voidcore-quickstart': '/examples/demos/voidcore_quickstart_demo.js',
      'message-city': '/examples/demos/message_city_demo.js',
      'markdown-editor': '/examples/demos/markdown_editor_demo.js',
      'cogito-observer': '/examples/demos/cogito_observer_demo.js',
      'galaxy-viewer': '/examples/demos/galaxy_viewer_demo.js',
      'system-monitor': '/examples/demos/system_monitor_demo.js',
    };

    this.currentDemoInstance = null; // To keep track of the currently running demo

    // Call _prepare to set up the UI
    this._prepare();
  }

  _prepare() {
    super._prepare(); // Call parent's _prepare

    // Create the main application container
    const appRoot = document.getElementById('app-root');
    if (!appRoot) {
      board.log('❌ Error: #app-root not found in index.html');
      return;
    }
    appRoot.innerHTML = ''; // Clear existing content

    // 1. Header
    const header = document.createElement('h1');
    header.innerHTML = 'This screen also runs on VoidCore! • <a href="https://coff.ee/moecharmde6" target="_blank" style="color: #666; text-decoration: none; font-size: 16px;">☕ Support this project</a>';
    header.style.textAlign = 'center';
    header.style.color = '#333';
    appRoot.appendChild(header);

    // 2. Demo Selector and Run Button (no button needed now, will use change event)
    const demoControlDiv = document.createElement('div');
    demoControlDiv.style.marginBottom = '20px';
    demoControlDiv.style.textAlign = 'center';
    appRoot.appendChild(demoControlDiv);

    const label = document.createElement('label');
    label.htmlFor = 'demo-selector';
    label.textContent = 'Select Demo: ';
    demoControlDiv.appendChild(label);

    const demoSelector = document.createElement('select');
    demoSelector.id = 'demo-selector';
    demoControlDiv.appendChild(demoSelector);

    // Populate the demo selector dropdown
    for (const key in this.demos) {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = key.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      demoSelector.appendChild(option);
    }

    // 3. Log Area
    const logDiv = document.createElement('div');
    logDiv.id = 'log';
    logDiv.style.height = '150px';
    logDiv.style.overflowY = 'auto';
    logDiv.style.border = '1px solid #eee';
    logDiv.style.padding = '5px';
    logDiv.style.marginBottom = '20px';
    appRoot.appendChild(logDiv);
    board.setLogElement(logDiv); // Set the log element for the board

    // 4. Main Content Area for Demos
    const demoContentDiv = document.createElement('div');
    demoContentDiv.id = 'demo-content-area';
    demoContentDiv.style.border = '1px solid #ccc';
    demoContentDiv.style.padding = '10px';
    demoContentDiv.style.minHeight = '350px'; // Give some space
    appRoot.appendChild(demoContentDiv);

    // Event listener for changing the selected demo
    demoSelector.addEventListener('change', () => this.runSelectedDemo(demoSelector.value));

    // Automatically run the first demo on page load
    if (demoSelector.options.length > 0) {
      demoSelector.value = demoSelector.options[0].value;
      this.runSelectedDemo(demoSelector.value);
    }

    board.log('✅ GUIVoidCoreManager initialized and UI built.');
  }

  async runSelectedDemo(selectedDemoKey) {
    const demoPath = this.demos[selectedDemoKey];

    if (demoPath) {
      board.log(`--- Loading ${selectedDemoKey} demo ---`);
      // Clear previous log messages for a cleaner demo experience
      board.setLogElement(document.getElementById('log')); // Re-set log element to clear it
      document.getElementById('log').innerHTML = '';

      // Clear the main demo content area
      const demoContentArea = document.getElementById('demo-content-area');
      if (demoContentArea) {
        demoContentArea.innerHTML = '';
      }

      // Dynamically import and run the selected demo
      try {
        // If there was a previous demo, call its cleanup method if it exists
        if (this.currentDemoInstance && typeof this.currentDemoInstance.cleanup === 'function') {
            this.currentDemoInstance.cleanup();
        }

        const { runDemo } = await import(demoPath);
        // Pass the demoContentArea to the runDemo function so demos can append their UI there
        this.currentDemoInstance = await runDemo(demoContentArea); // Store the instance if runDemo returns one
      } catch (error) {
        board.log(`❌ Error loading or running demo ${selectedDemoKey}: ${error.message}`);
        console.error(error);
      }
    } else {
      board.log('⚠️ Please select a demo.');
    }
  }
}

export function init() {
  new GUIVoidCoreManager();
}
