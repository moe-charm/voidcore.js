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
  }

  // Create a simple display area for this demo's output
  const displayDiv = document.createElement('div');
  displayDiv.id = 'cogito-observer-display';
  displayDiv.style.fontSize = '1.2em';
  displayDiv.style.textAlign = 'center';
  displayDiv.style.padding = '20px';
  displayDiv.textContent = 'Watch the log for philosophical dialogue...';
  if (container) container.appendChild(displayDiv);

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
