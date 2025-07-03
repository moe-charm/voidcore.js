// plugins/emergency_vehicle.js
import { AutonomousPlugin } from '../src/autonomous_plugin.js';

export class EmergencyVehiclePlugin extends AutonomousPlugin {
  constructor() {
    super("EmergencyVehicleService");
    this.board.log('✅ EmergencyVehiclePlugin initialized.');
    
    this.position = -100;
    this.isActive = false;
    this.speed = 15; // Faster than regular vehicles
    
    this._prepare();
  }
  
  _prepare() {
    super._prepare();
    
    // Create emergency vehicle visual
    this._createEmergencyVehicle();
    
    // Start random emergency events
    this._startEmergencyEvents();
    
    this.board.log('🚨 Emergency Vehicle service ready.');
  }
  
  _createEmergencyVehicle() {
    const cityContainer = window.messageCityContainer;
    if (!cityContainer) return;
    
    this.vehicleDiv = document.createElement('div');
    this.vehicleDiv.style.position = 'absolute';
    this.vehicleDiv.style.width = '50px';
    this.vehicleDiv.style.height = '25px';
    this.vehicleDiv.style.backgroundColor = '#ff0000';
    this.vehicleDiv.style.borderRadius = '5px';
    this.vehicleDiv.style.border = '2px solid #fff';
    this.vehicleDiv.style.display = 'flex';
    this.vehicleDiv.style.alignItems = 'center';
    this.vehicleDiv.style.justifyContent = 'center';
    this.vehicleDiv.style.fontSize = '16px';
    this.vehicleDiv.style.fontWeight = 'bold';
    this.vehicleDiv.style.zIndex = '20';
    this.vehicleDiv.style.top = '50%';
    this.vehicleDiv.style.left = '-100px';
    this.vehicleDiv.style.transform = 'translateY(-50%)';
    this.vehicleDiv.style.transition = 'all 0.2s ease-out'; // Smooth movement
    this.vehicleDiv.style.boxShadow = '0 0 20px rgba(255, 0, 0, 0.7)';
    this.vehicleDiv.innerHTML = '🚨';
    
    // Initially hidden
    this.vehicleDiv.style.opacity = '0';
    
    cityContainer.appendChild(this.vehicleDiv);
  }
  
  _startEmergencyEvents() {
    // Random emergency every 15-25 seconds
    this.emergencyInterval = setInterval(() => {
      if (!this.isActive && Math.random() < 0.4) {
        this._triggerEmergency();
      }
    }, 15000);
  }
  
  _triggerEmergency() {
    this.isActive = true;
    this.position = -100;
    
    this._logMessage('🚨 EMERGENCY: Ambulance approaching!');
    
    // Show emergency vehicle
    this.vehicleDiv.style.opacity = '1';
    this.vehicleDiv.style.left = `${this.position}px`;
    
    // Emergency override - force all lights to green
    this.publish({
      type: 'Intent',
      event_name: 'emergency.override',
      payload: {
        type: 'ambulance',
        priority: 'immediate',
        message: 'All traffic must yield immediately'
      },
      message_id: `emergency-${Date.now()}`
    });
    
    // Start siren animation
    this._startSiren();
    
    // Start movement
    this._startEmergencyMovement();
  }
  
  _startSiren() {
    let isRed = true;
    this.sirenInterval = setInterval(() => {
      if (this.isActive) {
        this.vehicleDiv.style.backgroundColor = isRed ? '#ff0000' : '#ffffff';
        this.vehicleDiv.style.color = isRed ? '#ffffff' : '#ff0000';
        isRed = !isRed;
      }
    }, 300); // Flash every 300ms
  }
  
  _startEmergencyMovement() {
    this.movementInterval = setInterval(() => {
      if (this.isActive) {
        this.position += this.speed;
        this.vehicleDiv.style.left = `${this.position}px`;
        
        // Publish emergency movement
        this.publish({
          type: 'Notice',
          event_name: 'emergency.moving',
          payload: {
            vehicleType: 'ambulance',
            position: this.position,
            speed: this.speed,
            status: 'active'
          },
          message_id: `emergency-move-${Date.now()}`
        });
        
        // Check if passed through
        if (this.position > window.innerWidth + 50) {
          this._endEmergency();
        }
      }
    }, 100); // Very smooth movement
  }
  
  _endEmergency() {
    this.isActive = false;
    
    this._logMessage('🚨 Emergency vehicle has passed. Normal traffic resuming.');
    
    // Hide emergency vehicle
    this.vehicleDiv.style.opacity = '0';
    
    // Stop siren
    if (this.sirenInterval) {
      clearInterval(this.sirenInterval);
    }
    
    // Stop movement
    if (this.movementInterval) {
      clearInterval(this.movementInterval);
    }
    
    // Send all-clear message
    this.publish({
      type: 'Notice',
      event_name: 'emergency.cleared',
      payload: {
        message: 'Emergency vehicle has passed',
        resumeNormalOperation: true
      },
      message_id: `emergency-clear-${Date.now()}`
    });
    
    // Reset vehicle appearance
    this.vehicleDiv.style.backgroundColor = '#ff0000';
    this.vehicleDiv.style.color = '#ffffff';
  }
  
  _logMessage(message) {
    const logDiv = window.messageCityLogDiv;
    if (!logDiv) return;
    
    const entry = document.createElement('div');
    entry.style.marginBottom = '3px';
    entry.style.color = '#ff0000';
    entry.style.fontWeight = 'bold';
    entry.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
    entry.style.padding = '2px 5px';
    entry.style.borderLeft = '3px solid #ff0000';
    entry.innerHTML = `${new Date().toLocaleTimeString()}: ${message}`;
    
    logDiv.appendChild(entry);
    logDiv.scrollTop = logDiv.scrollHeight;
  }
  
  retire() {
    super.retire();
    if (this.emergencyInterval) clearInterval(this.emergencyInterval);
    if (this.sirenInterval) clearInterval(this.sirenInterval);
    if (this.movementInterval) clearInterval(this.movementInterval);
    
    if (this.vehicleDiv && this.vehicleDiv.parentNode) {
      this.vehicleDiv.parentNode.removeChild(this.vehicleDiv);
    }
    this.board.log('🚨 EmergencyVehiclePlugin retired.');
  }
}

export function init() {
  const instance = new EmergencyVehiclePlugin();
  return instance;
}