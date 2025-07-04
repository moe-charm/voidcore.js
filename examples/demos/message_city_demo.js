// examples/demos/message_city_demo.js
import { board } from '../../src/core.js';

let trafficLightPluginInstance = null;
let vehiclePluginInstances = [];
let pedestrianPluginInstances = [];
let emergencyVehiclePluginInstance = null;

export async function runDemo(container) {
  board.log('--- Loading Message City demo ---');

  // Clear the container for this demo
  if (container) {
    container.innerHTML = '';
    container.style.position = 'relative';
    container.style.height = '500px';
    container.style.backgroundColor = '#87CEEB'; // Sky blue background
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
      🏙️ Message City Demo
    </div>
    <div style="line-height: 1.4;">
      <strong>🚀 Features:</strong><br>
      • Traffic lights control via messages<br>
      • Vehicles respond to signals<br>
      • Pedestrians cross safely<br>
      • 🚨 Emergency vehicles override all!<br><br>
      
      <strong>✨ What makes this special:</strong><br>
      • <strong>No central control!</strong> - Message-driven<br>
      • <strong>Autonomous cooperation</strong> - Self-deciding<br>
      • <strong>Visual clarity</strong> - Easy to understand<br>
      • <strong>Lightweight</strong> - GPU optimized CSS<br><br>
      
      <strong>🎯 Watch emergency ambulance! 🚨</strong><br><br>
      
      <strong>📌 Not just for games!</strong><br>
      This is just one example - VoidCore can power<br>
      ANY message-driven system:<br>
      • Business workflows<br>
      • IoT networks<br>
      • Microservices<br>
      • Real-time collaboration<br><br>
      
      <strong>💫 This screen also runs on VoidCore Network!</strong>
    </div>
  `;
  container.appendChild(infoPanel);

  // Create message log area (top-left)
  const logDiv = document.createElement('div');
  logDiv.style.position = 'absolute';
  logDiv.style.top = '10px';
  logDiv.style.left = '10px';
  logDiv.style.width = '300px';
  logDiv.style.height = '150px';
  logDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
  logDiv.style.border = '2px solid #4682b4';
  logDiv.style.borderRadius = '10px';
  logDiv.style.padding = '10px';
  logDiv.style.fontSize = '11px';
  logDiv.style.overflowY = 'auto';
  logDiv.style.fontFamily = 'monospace';
  logDiv.innerHTML = '<div style="color: #666;">🏙️ City messages will appear here...</div>';
  container.appendChild(logDiv);

  // Create city area (bottom)
  const cityDiv = document.createElement('div');
  cityDiv.style.position = 'absolute';
  cityDiv.style.bottom = '0';
  cityDiv.style.left = '0';
  cityDiv.style.right = '0';
  cityDiv.style.height = '300px';
  cityDiv.style.backgroundColor = '#90EE90'; // Light green for ground
  cityDiv.style.borderTop = '3px solid #4682b4';
  container.appendChild(cityDiv);

  // Create road (horizontal)
  const roadHorizontal = document.createElement('div');
  roadHorizontal.style.position = 'absolute';
  roadHorizontal.style.left = '0';
  roadHorizontal.style.right = '0';
  roadHorizontal.style.top = '50%';
  roadHorizontal.style.height = '60px';
  roadHorizontal.style.backgroundColor = '#696969'; // Dark gray
  roadHorizontal.style.transform = 'translateY(-50%)';
  cityDiv.appendChild(roadHorizontal);

  // Create road (vertical)
  const roadVertical = document.createElement('div');
  roadVertical.style.position = 'absolute';
  roadVertical.style.top = '0';
  roadVertical.style.bottom = '0';
  roadVertical.style.left = '50%';
  roadVertical.style.width = '60px';
  roadVertical.style.backgroundColor = '#696969'; // Dark gray
  roadVertical.style.transform = 'translateX(-50%)';
  cityDiv.appendChild(roadVertical);

  // Create intersection
  const intersection = document.createElement('div');
  intersection.style.position = 'absolute';
  intersection.style.left = '50%';
  intersection.style.top = '50%';
  intersection.style.width = '60px';
  intersection.style.height = '60px';
  intersection.style.backgroundColor = '#808080'; // Gray
  intersection.style.transform = 'translate(-50%, -50%)';
  cityDiv.appendChild(intersection);

  // Store references for plugins
  window.messageCityLogDiv = logDiv;
  window.messageCityContainer = cityDiv;

  // Initialize Traffic Light Plugin
  const { init: initTrafficLight } = await import('../../plugins/traffic_light.js');
  trafficLightPluginInstance = initTrafficLight();

  // Initialize Vehicle Plugins
  const { init: initVehicle } = await import('../../plugins/city_vehicle.js');
  vehiclePluginInstances.push(initVehicle('vehicle1', 'horizontal'));
  vehiclePluginInstances.push(initVehicle('vehicle2', 'horizontal'));

  // Initialize Pedestrian Plugins  
  const { init: initPedestrian } = await import('../../plugins/city_pedestrian.js');
  pedestrianPluginInstances.push(initPedestrian('pedestrian1'));
  pedestrianPluginInstances.push(initPedestrian('pedestrian2'));

  // Initialize Emergency Vehicle Plugin
  const { init: initEmergencyVehicle } = await import('../../plugins/emergency_vehicle.js');
  emergencyVehiclePluginInstance = initEmergencyVehicle();

  // Return cleanup function
  return {
    cleanup: () => {
      board.log('--- Cleaning up Message City demo ---');
      if (container) container.innerHTML = '';
      
      // Clean up plugin instances
      if (trafficLightPluginInstance) trafficLightPluginInstance.retire();
      if (emergencyVehiclePluginInstance) emergencyVehiclePluginInstance.retire();
      vehiclePluginInstances.forEach(instance => instance && instance.retire());
      pedestrianPluginInstances.forEach(instance => instance && instance.retire());
      
      vehiclePluginInstances = [];
      pedestrianPluginInstances = [];
    }
  };
}