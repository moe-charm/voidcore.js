// plugins/city_pedestrian.js
import { AutonomousPlugin } from '../src/autonomous_plugin.js';

export class CityPedestrianPlugin extends AutonomousPlugin {
  constructor(pedestrianId) {
    super(`CityPedestrian_${pedestrianId}`);
    this.pedestrianId = pedestrianId;
    this.position = { x: 0, y: 0 };
    this.isCrossing = false;
    this.currentTrafficLight = 'red';
    this.waitingToCross = false;
    
    this.board.log(`✅ CityPedestrianPlugin ${pedestrianId} initialized.`);
    
    this._prepare();
  }
  
  _prepare() {
    super._prepare();
    
    // Subscribe to traffic light changes
    this.subscribe('Notice', 'traffic.light.changed', this.handleTrafficLightChange.bind(this));
    
    // Subscribe to vehicle movements (to check safety)
    this.subscribe('Notice', 'vehicle.moved', this.handleVehicleMovement.bind(this));
    
    // Create pedestrian visual
    this._createPedestrian();
    
    // Start pedestrian AI
    this._startBehavior();
    
    this.board.log(`🚶 Pedestrian ${this.pedestrianId} ready to walk.`);
  }
  
  _createPedestrian() {
    const cityContainer = window.messageCityContainer;
    if (!cityContainer) return;
    
    this.pedestrianDiv = document.createElement('div');
    this.pedestrianDiv.style.position = 'absolute';
    this.pedestrianDiv.style.width = '20px';
    this.pedestrianDiv.style.height = '20px';
    this.pedestrianDiv.style.backgroundColor = this.pedestrianId === 'pedestrian1' ? '#ffaa00' : '#aa00ff';
    this.pedestrianDiv.style.borderRadius = '50%';
    this.pedestrianDiv.style.border = '2px solid #000';
    this.pedestrianDiv.style.display = 'flex';
    this.pedestrianDiv.style.alignItems = 'center';
    this.pedestrianDiv.style.justifyContent = 'center';
    this.pedestrianDiv.style.fontSize = '12px';
    this.pedestrianDiv.style.zIndex = '6';
    this.pedestrianDiv.innerHTML = '🚶';
    
    // Position pedestrian on sidewalk
    this.position.x = this.pedestrianId === 'pedestrian1' ? 100 : 300;
    this.position.y = 80;
    
    this.pedestrianDiv.style.left = `${this.position.x}px`;
    this.pedestrianDiv.style.top = `${this.position.y}px`;
    
    cityContainer.appendChild(this.pedestrianDiv);
  }
  
  handleTrafficLightChange(message) {
    const { color } = message.payload;
    this.currentTrafficLight = color;
    
    this._logMessage(`🚶 Pedestrian ${this.pedestrianId}: Traffic light is ${color.toUpperCase()}`);
    
    // Pedestrians cross when light is RED (cars stop)
    if (color === 'red' && this.waitingToCross) {
      this._startCrossing();
    }
  }
  
  handleVehicleMovement(message) {
    const { vehicleId, isMoving, position } = message.payload;
    
    // Check if it's safe to cross
    if (this.isCrossing && isMoving) {
      this._logMessage(`🚶 Pedestrian ${this.pedestrianId}: Waiting for vehicle ${vehicleId} to pass`);
    }
  }
  
  _startBehavior() {
    // Random decision to cross
    this.behaviorInterval = setInterval(() => {
      if (!this.isCrossing && !this.waitingToCross && Math.random() < 0.3) {
        this.waitingToCross = true;
        this._logMessage(`🚶 Pedestrian ${this.pedestrianId}: Wants to cross the street`);
        
        // Send proposal to cross
        this.publish({
          type: 'Proposal',
          event_name: 'pedestrian.cross.request',
          payload: {
            pedestrianId: this.pedestrianId,
            crosswalk: 'main',
            timestamp: Date.now()
          },
          message_id: `pedestrian-cross-${Date.now()}`
        });
        
        // Check if it's safe (traffic light is red)
        if (this.currentTrafficLight === 'red') {
          setTimeout(() => this._startCrossing(), 1000);
        }
      }
    }, 3000); // Check every 3 seconds
  }
  
  _startCrossing() {
    if (this.currentTrafficLight !== 'red') {
      this._logMessage(`🚶 Pedestrian ${this.pedestrianId}: Cannot cross - traffic light is ${this.currentTrafficLight.toUpperCase()}`);
      this.waitingToCross = false;
      return;
    }
    
    this.isCrossing = true;
    this.waitingToCross = false;
    this._logMessage(`🚶 Pedestrian ${this.pedestrianId}: Starting to cross`);
    
    // Animate crossing
    let step = 0;
    const crossingInterval = setInterval(() => {
      step += 5;
      this.position.y = 80 + step;
      this.pedestrianDiv.style.top = `${this.position.y}px`;
      
      if (step >= 140) { // Reached other side
        clearInterval(crossingInterval);
        this.isCrossing = false;
        this._logMessage(`🚶 Pedestrian ${this.pedestrianId}: Crossed safely!`);
        
        // Return to original position after a while
        setTimeout(() => this._returnToStart(), 2000);
      }
    }, 200);
    
    // Publish crossing notice
    this.publish({
      type: 'Notice',
      event_name: 'pedestrian.crossing',
      payload: {
        pedestrianId: this.pedestrianId,
        status: 'crossing',
        position: this.position
      },
      message_id: `pedestrian-crossing-${Date.now()}`
    });
  }
  
  _returnToStart() {
    this.position.y = 80;
    this.pedestrianDiv.style.top = `${this.position.y}px`;
    this._logMessage(`🚶 Pedestrian ${this.pedestrianId}: Returned to sidewalk`);
  }
  
  _logMessage(message) {
    const logDiv = window.messageCityLogDiv;
    if (!logDiv) return;
    
    const entry = document.createElement('div');
    entry.style.marginBottom = '3px';
    entry.style.color = this.pedestrianId === 'pedestrian1' ? '#cc8800' : '#8800cc';
    entry.innerHTML = `${new Date().toLocaleTimeString()}: ${message}`;
    
    logDiv.appendChild(entry);
    logDiv.scrollTop = logDiv.scrollHeight;
  }
  
  retire() {
    super.retire();
    if (this.behaviorInterval) {
      clearInterval(this.behaviorInterval);
    }
    if (this.pedestrianDiv && this.pedestrianDiv.parentNode) {
      this.pedestrianDiv.parentNode.removeChild(this.pedestrianDiv);
    }
    this.board.log(`🚶 CityPedestrianPlugin ${this.pedestrianId} retired.`);
  }
}

export function init(pedestrianId) {
  const instance = new CityPedestrianPlugin(pedestrianId);
  return instance;
}