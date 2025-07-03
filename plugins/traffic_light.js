// plugins/traffic_light.js
import { AutonomousPlugin } from '../src/autonomous_plugin.js';

export class TrafficLightPlugin extends AutonomousPlugin {
  constructor() {
    super("TrafficLightService");
    this.board.log('✅ TrafficLightPlugin initialized.');
    
    this.currentColor = 'red';
    this.cycleInterval = null;
    this.emergencyMode = false;
    this.normalCycleActive = true;
    
    this._prepare();
  }
  
  _prepare() {
    super._prepare();
    
    // Subscribe to emergency events
    this.subscribe('Intent', 'emergency.override', this.handleEmergencyOverride.bind(this));
    this.subscribe('Notice', 'emergency.cleared', this.handleEmergencyCleared.bind(this));
    
    // Create traffic light visual
    this._createTrafficLight();
    
    // Start traffic light cycle
    this._startCycle();
    
    this.board.log('🚦 Traffic light started with red signal.');
  }
  
  _createTrafficLight() {
    const cityContainer = window.messageCityContainer;
    if (!cityContainer) return;
    
    // Create traffic light post
    this.trafficLightDiv = document.createElement('div');
    this.trafficLightDiv.style.position = 'absolute';
    this.trafficLightDiv.style.left = '50%';
    this.trafficLightDiv.style.top = '30px';
    this.trafficLightDiv.style.width = '30px';
    this.trafficLightDiv.style.height = '80px';
    this.trafficLightDiv.style.backgroundColor = '#333';
    this.trafficLightDiv.style.borderRadius = '15px';
    this.trafficLightDiv.style.transform = 'translateX(-50%)';
    this.trafficLightDiv.style.border = '2px solid #000';
    this.trafficLightDiv.style.zIndex = '10';
    
    // Create red light
    this.redLight = document.createElement('div');
    this.redLight.style.width = '20px';
    this.redLight.style.height = '20px';
    this.redLight.style.borderRadius = '50%';
    this.redLight.style.backgroundColor = '#ff0000';
    this.redLight.style.margin = '5px auto';
    this.redLight.style.border = '1px solid #000';
    
    // Create green light  
    this.greenLight = document.createElement('div');
    this.greenLight.style.width = '20px';
    this.greenLight.style.height = '20px';
    this.greenLight.style.borderRadius = '50%';
    this.greenLight.style.backgroundColor = '#004400';
    this.greenLight.style.margin = '5px auto';
    this.greenLight.style.border = '1px solid #000';
    
    this.trafficLightDiv.appendChild(this.redLight);
    this.trafficLightDiv.appendChild(this.greenLight);
    cityContainer.appendChild(this.trafficLightDiv);
  }
  
  _startCycle() {
    // Change light every 4 seconds
    this.cycleInterval = setInterval(() => {
      if (this.normalCycleActive && !this.emergencyMode) {
        this._changeLight();
      }
    }, 4000);
  }
  
  _changeLight() {
    if (this.currentColor === 'red') {
      this.currentColor = 'green';
      this.redLight.style.backgroundColor = '#440000';
      this.greenLight.style.backgroundColor = '#00ff00';
      this._logMessage('🟢 Traffic light: GREEN');
    } else {
      this.currentColor = 'red';
      this.redLight.style.backgroundColor = '#ff0000';
      this.greenLight.style.backgroundColor = '#004400';
      this._logMessage('🔴 Traffic light: RED');
    }
    
    // Publish traffic light change notice
    this.publish({
      type: 'Notice',
      event_name: 'traffic.light.changed',
      payload: { 
        color: this.currentColor,
        intersection: 'main',
        timestamp: Date.now()
      },
      message_id: `traffic-${Date.now()}`
    });
    
    this.board.log(`🚦 Traffic light changed to ${this.currentColor.toUpperCase()}`);
  }
  
  handleEmergencyOverride(message) {
    this.emergencyMode = true;
    this.normalCycleActive = false;
    
    // Force green light for emergency vehicle
    this.currentColor = 'green';
    this.redLight.style.backgroundColor = '#440000';
    this.greenLight.style.backgroundColor = '#00ff00';
    this.greenLight.style.boxShadow = '0 0 15px #00ff00';
    
    this._logMessage('🚨 EMERGENCY OVERRIDE: All lights GREEN for emergency vehicle!');
    
    // Publish emergency traffic state
    this.publish({
      type: 'Notice',
      event_name: 'traffic.emergency.active',
      payload: { 
        color: 'green',
        emergencyMode: true,
        message: 'Emergency vehicle priority'
      },
      message_id: `traffic-emergency-${Date.now()}`
    });
  }
  
  handleEmergencyCleared(message) {
    this.emergencyMode = false;
    this.normalCycleActive = true;
    
    // Remove emergency effects
    this.greenLight.style.boxShadow = 'none';
    
    this._logMessage('🚦 Emergency cleared: Normal traffic light operation resumed');
    
    // Resume normal cycle
    setTimeout(() => {
      if (!this.emergencyMode) {
        this._changeLight();
      }
    }, 2000);
  }
  
  _logMessage(message) {
    const logDiv = window.messageCityLogDiv;
    if (!logDiv) return;
    
    const entry = document.createElement('div');
    entry.style.marginBottom = '3px';
    entry.style.color = this.emergencyMode ? '#ff4400' : (this.currentColor === 'red' ? '#cc0000' : '#00aa00');
    entry.style.fontWeight = this.emergencyMode ? 'bold' : 'normal';
    entry.style.backgroundColor = this.emergencyMode ? 'rgba(255, 68, 0, 0.1)' : 'transparent';
    entry.innerHTML = `${new Date().toLocaleTimeString()}: ${message}`;
    
    logDiv.appendChild(entry);
    logDiv.scrollTop = logDiv.scrollHeight;
  }
  
  retire() {
    super.retire();
    if (this.cycleInterval) {
      clearInterval(this.cycleInterval);
    }
    if (this.trafficLightDiv && this.trafficLightDiv.parentNode) {
      this.trafficLightDiv.parentNode.removeChild(this.trafficLightDiv);
    }
    this.board.log('🚦 TrafficLightPlugin retired.');
  }
}

export function init() {
  const instance = new TrafficLightPlugin();
  return instance;
}