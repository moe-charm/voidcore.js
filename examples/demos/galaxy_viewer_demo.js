// examples/demos/galaxy_viewer_demo.js
import { board } from '/voidcore.js/src/core.js';

let galaxyViewerPluginInstance = null;
let collisionDetectorPluginInstance = null;

export async function runDemo(container) {
  board.log('--- Loading Galaxy Viewer demo ---');

  // Clear the container for this demo
  if (container) {
    container.innerHTML = '';
    container.style.backgroundColor = '#000'; // Black background for space
    container.style.height = '500px'; // Fixed height for the container
    container.style.position = 'relative'; // Add position relative
    container.style.display = 'flex'; // Use flexbox to center canvas
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';
  }

  // Initialize CollisionDetectorPlugin first
  const { init: initCollisionDetector } = await import('/voidcore.js/plugins/collision_detector.js');
  collisionDetectorPluginInstance = initCollisionDetector();
  
  // Initialize GalaxyViewerPlugin
  const { init: initGalaxyViewer } = await import('/voidcore.js/plugins/galaxy_viewer.js');
  galaxyViewerPluginInstance = initGalaxyViewer(container);

  // Return an object with a cleanup method
  return {
    cleanup: () => {
      board.log('--- Cleaning up Galaxy Viewer demo ---');
      
      // First retire plugins (they handle their own DOM cleanup)
      if (galaxyViewerPluginInstance) galaxyViewerPluginInstance.retire();
      if (collisionDetectorPluginInstance) collisionDetectorPluginInstance.retire();
      
      if (container) {
        // Force clear everything including black background
        container.innerHTML = ''; // Clear any remaining UI
        
        // Complete style reset with important flags
        container.style.cssText = ''; // Clear all inline styles
        container.style.backgroundColor = 'transparent !important';
        container.style.background = 'none !important';
        
        // Remove style attribute completely
        container.removeAttribute('style');
      }
      
      board.log('--- Galaxy Viewer cleanup completed ---');
    }
  };
}
