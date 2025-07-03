// examples/demos/hello_world_demo.js
import { board } from '../../src/core.js';

let helloPluginInstance = null;
let worldPluginInstance = null;

export async function runDemo(container) {
  board.log('--- Loading Hello World demo ---');

  // Clear the container for this demo
  if (container) {
    container.innerHTML = '';
  }

  // Create elements for Hello and World display
  const helloDiv = document.createElement('div');
  helloDiv.id = 'hello-display';
  helloDiv.style.fontSize = '2em';
  helloDiv.style.textAlign = 'center';
  helloDiv.style.marginBottom = '10px';
  if (container) container.appendChild(helloDiv);

  const worldDiv = document.createElement('div');
  worldDiv.id = 'world-display';
  worldDiv.style.fontSize = '2em';
  worldDiv.style.textAlign = 'center';
  if (container) container.appendChild(worldDiv);

  // Initialize WorldPlugin and then HelloPlugin, passing display elements
  const { init: initWorld } = await import('../../plugins/world.js');
  worldPluginInstance = initWorld(worldDiv);

  const { init: initHello } = await import('../../plugins/hello.js');
  helloPluginInstance = initHello(helloDiv);

  // Return an object with a cleanup method
  return {
    cleanup: () => {
      board.log('--- Cleaning up Hello World demo ---');
      if (container) container.innerHTML = ''; // Clear UI
      // In a more complex scenario, you might call retire() on plugins here
      // if (helloPluginInstance) helloPluginInstance.retire();
      // if (worldPluginInstance) worldPluginInstance.retire();
    }
  };
}
