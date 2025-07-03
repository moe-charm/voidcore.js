// plugins/city_vehicle.js
import { AutonomousPlugin } from '../src/autonomous_plugin.js';

export class CityVehiclePlugin extends AutonomousPlugin {
  constructor(vehicleId, direction) {
    super(`CityVehicle_${vehicleId}`);
    this.vehicleId = vehicleId;
    this.direction = direction; // 'horizontal' or 'vertical'
    this.position = 0;
    this.isMoving = false;
    this.currentTrafficLight = 'red';
    
    this.board.log(`✅ CityVehiclePlugin ${vehicleId} initialized.`);
    
    this._prepare();
  }
  
  _prepare() {
    super._prepare();
    
    // Subscribe to traffic light changes
    this.subscribe('Notice', 'traffic.light.changed', this.handleTrafficLightChange.bind(this));
    
    // Subscribe to emergency events
    this.subscribe('Notice', 'traffic.emergency.active', this.handleEmergencyActive.bind(this));
    this.subscribe('Notice', 'emergency.cleared', this.handleEmergencyCleared.bind(this));
    
    // Create vehicle visual
    this._createVehicle();
    
    // Start movement loop
    this._startMovement();
    
    this.board.log(`🚗 Vehicle ${this.vehicleId} ready to move.`);
  }
  
  _createVehicle() {
    const cityContainer = window.messageCityContainer;
    if (!cityContainer) return;
    
    this.vehicleDiv = document.createElement('div');
    this.vehicleDiv.style.position = 'absolute';
    this.vehicleDiv.style.width = '40px';
    this.vehicleDiv.style.height = '20px';
    this.vehicleDiv.style.backgroundColor = this.vehicleId === 'vehicle1' ? '#ff4444' : '#4444ff';
    this.vehicleDiv.style.borderRadius = '5px';
    this.vehicleDiv.style.border = '2px solid #000';
    this.vehicleDiv.style.display = 'flex';
    this.vehicleDiv.style.alignItems = 'center';
    this.vehicleDiv.style.justifyContent = 'center';
    this.vehicleDiv.style.fontSize = '12px';
    this.vehicleDiv.style.zIndex = '5';
    this.vehicleDiv.style.transition = 'all 0.3s ease-out'; // Smooth movement!
    this.vehicleDiv.innerHTML = '🚗';
    
    if (this.direction === 'horizontal') {
      this.vehicleDiv.style.top = '50%';
      this.vehicleDiv.style.left = this.vehicleId === 'vehicle1' ? '20px' : '80%';
      this.vehicleDiv.style.transform = 'translateY(-50%)';
    }
    
    cityContainer.appendChild(this.vehicleDiv);
  }
  
  handleTrafficLightChange(message) {
    const { color } = message.payload;
    this.currentTrafficLight = color;
    
    this._logMessage(`🚗 Vehicle ${this.vehicleId}: Traffic light is ${color.toUpperCase()}`);
    
    if (color === 'green' && !this.isMoving) {
      this.isMoving = true;
      this._logMessage(`🚗 Vehicle ${this.vehicleId}: Starting to move`);
    } else if (color === 'red' && this.isMoving) {
      this.isMoving = false;
      this._logMessage(`🚗 Vehicle ${this.vehicleId}: Stopping for red light`);
    }
  }
  
  _startMovement() {
    this.movementInterval = setInterval(() => {
      if (this.isMoving && this.currentTrafficLight === 'green') {
        this._moveVehicle();
      }
    }, 200); // Move every 200ms when green
  }
  
  _moveVehicle() {
    if (!this.vehicleDiv) return;
    
    if (this.direction === 'horizontal') {
      this.position += 5;
      
      // Reset position if off screen
      if (this.position > window.innerWidth) {
        this.position = -50;
      }
      
      this.vehicleDiv.style.left = `${this.position}px`;
    }
    
    // Publish movement notice
    this.publish({
      type: 'Notice',
      event_name: 'vehicle.moved',
      payload: {
        vehicleId: this.vehicleId,
        position: this.position,
        direction: this.direction,
        isMoving: this.isMoving
      },
      message_id: `vehicle-move-${Date.now()}`
    });
  }
  
  handleEmergencyActive(message) {
    // Stop immediately for emergency vehicle
    this.isMoving = false;
    this.vehicleDiv.style.backgroundColor = '#ffaa00'; // Orange to show yielding
    this._logMessage(`🚗 Vehicle ${this.vehicleId}: YIELDING to emergency vehicle`);
  }
  
  handleEmergencyCleared(message) {
    // Resume normal operation
    this.vehicleDiv.style.backgroundColor = this.vehicleId === 'vehicle1' ? '#ff4444' : '#4444ff';
    this._logMessage(`🚗 Vehicle ${this.vehicleId}: Emergency cleared, resuming normal operation`);
  }
  
  _logMessage(message) {
    const logDiv = window.messageCityLogDiv;
    if (!logDiv) return;
    
    const entry = document.createElement('div');
    entry.style.marginBottom = '3px';
    entry.style.color = this.vehicleId === 'vehicle1' ? '#aa4444' : '#4444aa';
    entry.innerHTML = `${new Date().toLocaleTimeString()}: ${message}`;
    
    logDiv.appendChild(entry);
    logDiv.scrollTop = logDiv.scrollHeight;
  }
  
  retire() {
    super.retire();
    if (this.movementInterval) {
      clearInterval(this.movementInterval);
    }
    if (this.vehicleDiv && this.vehicleDiv.parentNode) {
      this.vehicleDiv.parentNode.removeChild(this.vehicleDiv);
    }
    this.board.log(`🚗 CityVehiclePlugin ${this.vehicleId} retired.`);
  }
}

export function init(vehicleId, direction) {
  const instance = new CityVehiclePlugin(vehicleId, direction);
  return instance;
}