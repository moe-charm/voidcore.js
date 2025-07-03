// plugins/collision_detector.js
import { AutonomousPlugin } from '../src/autonomous_plugin.js';

export class CollisionDetectorPlugin extends AutonomousPlugin {
  constructor() {
    super("CollisionDetectorService");
    this.board.log('✅ CollisionDetectorPlugin initialized.');
    
    this.trackedObjects = new Map(); // id -> {position: {x,y,z}, radius, plugin}
    this.animationFrameId = null;
    
    this._prepare();
  }
  
  _prepare() {
    super._prepare();
    
    // Subscribe to object registration from other plugins
    this.subscribe('Intent', 'collision.register', this.handleObjectRegistration.bind(this));
    this.subscribe('Intent', 'collision.unregister', this.handleObjectUnregistration.bind(this));
    this.subscribe('Notice', 'object.moved', this.handleObjectMoved.bind(this));
    
    this.board.log('➕ CollisionDetectorPlugin: Subscribed to collision events.');
    
    // Start collision detection loop
    this._startDetection();
  }
  
  handleObjectRegistration(message) {
    const { objectId, position, radius, pluginId } = message.payload;
    this.trackedObjects.set(objectId, {
      position: position || {x: 0, y: 0, z: 0},
      radius: radius || 0.1,
      pluginId: pluginId
    });
    this.board.log(`🎯 CollisionDetector: Registered object ${objectId} from ${pluginId}`);
  }
  
  handleObjectUnregistration(message) {
    const { objectId } = message.payload;
    if (this.trackedObjects.delete(objectId)) {
      this.board.log(`🗑️ CollisionDetector: Unregistered object ${objectId}`);
    }
  }
  
  handleObjectMoved(message) {
    const { objectId, position } = message.payload;
    const obj = this.trackedObjects.get(objectId);
    if (obj) {
      obj.position = position;
    }
  }
  
  _startDetection() {
    this.board.log('🔍 CollisionDetector: Starting detection loop...');
    this._detectCollisions();
  }
  
  _detectCollisions() {
    this.animationFrameId = requestAnimationFrame(this._detectCollisions.bind(this));
    
    // Only check collisions every 3 frames (20fps instead of 60fps)
    this.frameCount = (this.frameCount || 0) + 1;
    if (this.frameCount % 3 !== 0) return;
    
    // Check all pairs of objects for collisions
    const objects = Array.from(this.trackedObjects.entries());
    
    for (let i = 0; i < objects.length; i++) {
      for (let j = i + 1; j < objects.length; j++) {
        const [id1, obj1] = objects[i];
        const [id2, obj2] = objects[j];
        
        if (this._checkCollision(obj1, obj2)) {
          this._notifyCollision(id1, obj1, id2, obj2);
        }
      }
    }
  }
  
  _checkCollision(obj1, obj2) {
    const dx = obj1.position.x - obj2.position.x;
    const dy = obj1.position.y - obj2.position.y;
    const dz = obj1.position.z - obj2.position.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const minDistance = obj1.radius + obj2.radius;
    
    return distance < minDistance;
  }
  
  _notifyCollision(id1, obj1, id2, obj2) {
    this.board.log(`💥 COLLISION DETECTED: ${id1} <-> ${id2}`);
    
    // Send collision notice to both objects with high priority
    this.publish({
      type: 'Notice',
      event_name: 'collision.occurred',
      payload: {
        objectId: id1,
        collidedWith: id2,
        targetPlugin: obj1.pluginId,
        position: obj1.position,
        priority: 'immediate' // Collision effects must be instant!
      }
    });
    
    this.publish({
      type: 'Notice',
      event_name: 'collision.occurred',
      payload: {
        objectId: id2,
        collidedWith: id1,
        targetPlugin: obj2.pluginId,
        position: obj2.position,
        priority: 'immediate' // Collision effects must be instant!
      }
    });
    
    // Visual feedback
    this.board.log(`✨ Collision notification sent to both objects!`);
  }
  
  retire() {
    super.retire();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.board.log('🔍 CollisionDetectorPlugin: Detection stopped.');
  }
}

export function init() {
  const instance = new CollisionDetectorPlugin();
  return instance;
}