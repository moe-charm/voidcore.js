// examples/demos/cogito_observer_demo.js
import { board } from '../../src/core.js';
import { CogitoPlugin } from '../../plugins/cogito.js';
import { ObserverPlugin } from '../../plugins/observer.js';

let cogitoPluginInstance = null;
let observerPluginInstance = null;

export async function runDemo(container) {
  board.log('--- Loading Cogito Observer demo ---');

  // Clear the container for this demo
  if (container) {
    container.innerHTML = '';
    container.style.position = 'relative';
    container.style.height = '500px';
    container.style.backgroundColor = '#f0f8ff';
    container.style.borderRadius = '10px';
    container.style.overflow = 'hidden';
  }

  // Create demo info panel (top-right)
  const infoPanel = document.createElement('div');
  infoPanel.style.position = 'absolute';
  infoPanel.style.top = '10px';
  infoPanel.style.right = '10px';
  infoPanel.style.backgroundColor = 'rgba(70, 130, 180, 0.9)';
  infoPanel.style.color = 'white';
  infoPanel.style.padding = '12px';
  infoPanel.style.borderRadius = '8px';
  infoPanel.style.fontSize = '12px';
  infoPanel.style.maxWidth = '250px';
  infoPanel.style.zIndex = '100';
  infoPanel.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 8px; color: #87ceeb;">
      🤔 Philosophy Demo
    </div>
    <div style="line-height: 1.4;">
      <strong>🚀 VoidCore Messaging:</strong><br>
      • Intent → Notice → Proposal<br>
      • Autonomous plugin dialogue<br><br>
      
      <strong>🎭 Story Flow:</strong><br>
      1. 🤖 Cogito: "Am I alive?"<br>
      2. 👁️ Observer: "Yes, you sent a message!"<br>
      3. 👁️ Observer: "Please retire now"<br>
      4. 🤖 Cogito: "OK, I'll sleep..." 💤<br><br>
      
      <strong>🏗️ VoidCore Architecture:</strong><br>
      • <strong>One Core</strong> - Central messaging system<br>
      • <strong>One Observer</strong> - Shared advisor service<br>
      • <strong>Many Cogitos</strong> - Freely clonable plugins<br>
      • All instances use same message bus<br><br>
      
      <strong>💫 This screen also runs on VoidCore Network!</strong><br>
      <strong>🎯 Try cloning Cogito plugins!</strong>
    </div>
  `;
  container.appendChild(infoPanel);

  // Create conversation log area (top-left)
  const logDiv = document.createElement('div');
  logDiv.id = 'cogito-log';
  logDiv.style.position = 'absolute';
  logDiv.style.top = '10px';
  logDiv.style.left = '10px';
  logDiv.style.width = '300px';
  logDiv.style.height = '200px';
  logDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
  logDiv.style.border = '2px solid #4682b4';
  logDiv.style.borderRadius = '10px';
  logDiv.style.padding = '15px';
  logDiv.style.fontSize = '14px';
  logDiv.style.overflowY = 'auto';
  logDiv.style.fontFamily = 'Arial, sans-serif';
  logDiv.innerHTML = '<div style="color: #666;">💭 Philosophical dialogue will appear here...</div>';
  container.appendChild(logDiv);

  // Create character stage area (bottom)
  const stageDiv = document.createElement('div');
  stageDiv.id = 'character-stage';
  stageDiv.style.position = 'absolute';
  stageDiv.style.bottom = '0';
  stageDiv.style.left = '0';
  stageDiv.style.right = '0';
  stageDiv.style.height = '250px';
  stageDiv.style.backgroundColor = '#e6f3ff';
  stageDiv.style.borderTop = '3px solid #4682b4';
  container.appendChild(stageDiv);

  // Create Cogito character
  const cogitoChar = document.createElement('div');
  cogitoChar.id = 'cogito-character';
  cogitoChar.style.position = 'absolute';
  cogitoChar.style.left = '100px';
  cogitoChar.style.bottom = '50px';
  cogitoChar.style.width = '80px';
  cogitoChar.style.height = '80px';
  cogitoChar.style.borderRadius = '50%';
  cogitoChar.style.backgroundColor = '#4169e1';
  cogitoChar.style.border = '4px solid #191970';
  cogitoChar.style.display = 'flex';
  cogitoChar.style.alignItems = 'center';
  cogitoChar.style.justifyContent = 'center';
  cogitoChar.style.fontSize = '30px';
  cogitoChar.style.transition = 'all 0.5s ease';
  cogitoChar.innerHTML = '🤖';
  stageDiv.appendChild(cogitoChar);

  // Create Observer character
  const observerChar = document.createElement('div');
  observerChar.id = 'observer-character';
  observerChar.style.position = 'absolute';
  observerChar.style.right = '100px';
  observerChar.style.bottom = '50px';
  observerChar.style.width = '80px';
  observerChar.style.height = '80px';
  observerChar.style.borderRadius = '50%';
  observerChar.style.backgroundColor = '#32cd32';
  observerChar.style.border = '4px solid #228b22';
  observerChar.style.display = 'flex';
  observerChar.style.alignItems = 'center';
  observerChar.style.justifyContent = 'center';
  observerChar.style.fontSize = '30px';
  observerChar.style.transition = 'all 0.5s ease';
  observerChar.innerHTML = '👁️';
  stageDiv.appendChild(observerChar);

  // Create "Clone Cogito" button
  const addMoreBtn = document.createElement('button');
  addMoreBtn.innerHTML = '🤖➕ Clone Cogito';
  addMoreBtn.style.position = 'absolute';
  addMoreBtn.style.bottom = '10px';
  addMoreBtn.style.left = '50%';
  addMoreBtn.style.transform = 'translateX(-50%)';
  addMoreBtn.style.backgroundColor = '#32cd32';
  addMoreBtn.style.color = 'white';
  addMoreBtn.style.border = 'none';
  addMoreBtn.style.padding = '12px 24px';
  addMoreBtn.style.borderRadius = '25px';
  addMoreBtn.style.fontSize = '14px';
  addMoreBtn.style.fontWeight = 'bold';
  addMoreBtn.style.cursor = 'pointer';
  addMoreBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
  addMoreBtn.style.transition = 'all 0.3s ease';
  addMoreBtn.style.zIndex = '200';
  
  let pluginInstanceCounter = 1;
  
  addMoreBtn.addEventListener('click', () => {
    const instanceId = pluginInstanceCounter++;
    
    // Create new Cogito character only (Observer stays single)
    const newCogitoChar = document.createElement('div');
    newCogitoChar.style.position = 'absolute';
    newCogitoChar.style.left = `${50 + instanceId * 100}px`;
    newCogitoChar.style.bottom = '50px';
    newCogitoChar.style.width = '60px';
    newCogitoChar.style.height = '60px';
    newCogitoChar.style.borderRadius = '50%';
    newCogitoChar.style.backgroundColor = '#4169e1';
    newCogitoChar.style.border = '3px solid #191970';
    newCogitoChar.style.display = 'flex';
    newCogitoChar.style.alignItems = 'center';
    newCogitoChar.style.justifyContent = 'center';
    newCogitoChar.style.fontSize = '24px';
    newCogitoChar.style.transition = 'all 0.5s ease';
    newCogitoChar.innerHTML = '🤖';
    stageDiv.appendChild(newCogitoChar);
    
    // Set global references for new Cogito instance
    window[`cogitoChar_${instanceId}`] = newCogitoChar;
    
    // Initialize new Cogito instance only (Observer is shared)
    import('../../plugins/cogito.js').then(({ init: initCogito }) => {
      const newCogito = initCogito(instanceId);
      
      // Store instance
      window[`cogitoInstance_${instanceId}`] = newCogito;
      
      // Add log entry
      const entry = document.createElement('div');
      entry.style.marginBottom = '10px';
      entry.style.padding = '8px';
      entry.style.borderLeft = '4px solid #ffa500';
      entry.style.backgroundColor = 'rgba(255,255,255,0.7)';
      entry.style.borderRadius = '5px';
      entry.innerHTML = `
        <div style="font-weight: bold; color: #ffa500;">🎭 System</div>
        <div style="color: #333; margin-top: 3px;">New Cogito #${instanceId} joined! One Observer handles all questions.</div>
      `;
      logDiv.appendChild(entry);
      logDiv.scrollTop = logDiv.scrollHeight;
    });
  });
  
  addMoreBtn.addEventListener('mouseenter', () => {
    addMoreBtn.style.backgroundColor = '#42d142';
    addMoreBtn.style.transform = 'translateX(-50%) scale(1.05)';
  });
  
  addMoreBtn.addEventListener('mouseleave', () => {
    addMoreBtn.style.backgroundColor = '#32cd32';
    addMoreBtn.style.transform = 'translateX(-50%) scale(1)';
  });
  
  container.appendChild(addMoreBtn);

  // Store references for animation
  window.cogitoLogDiv = logDiv;
  window.cogitoChar = cogitoChar;
  window.observerChar = observerChar;

  // Initialize ObserverPlugin and then CogitoPlugin
  const { init: initObserver } = await import('../../plugins/observer.js');
  observerPluginInstance = initObserver();

  const { init: initCogito } = await import('../../plugins/cogito.js');
  cogitoPluginInstance = initCogito();

  // Return an object with a cleanup method
  return {
    cleanup: () => {
      board.log('--- Cleaning up Cogito Observer demo ---');
      if (container) container.innerHTML = ''; // Clear UI
      // In a more complex scenario, you might call retire() on plugins here
      // if (cogitoPluginInstance) cogitoPluginInstance.retire();
      // if (observerPluginInstance) observerPluginInstance.retire();
    }
  };
}
