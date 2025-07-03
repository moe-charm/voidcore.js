// src/autonomous_plugin.js
import { board } from './core.js';

export class AutonomousPlugin {
  constructor(capabilityName) {
    this.board = board;
    this.capabilityName = capabilityName;
    this.isActivated = false; // Represents the 'active' state
  }

  // Internal preparation logic (can be overridden by subclasses)
  _prepare() {
    // Default preparation: log that preparation is starting
    this.board.log(`🛠️ ${this.capabilityName}: Preparing...`);
    // Subclasses can add their own specific preparation here

    // Responsibility ②: Debut (self-declaration to the board)
    // This is called when the plugin is ready to interact with the world.
    this._debut();
  }

  // Internal debut logic (self-declaration)
  _debut() {
    // Only provide if not already activated
    if (!this.isActivated) {
      this.board.provide(this.capabilityName, this);
      this.isActivated = true;
      this.board.log(`✅ ${this.capabilityName}: Activated and provided.`);
    }
  }

  // Helper to observe capabilities from the board
  observe(name) {
    return this.board.observe(name);
  }

  // Helper to publish messages (Notice, Intent, Proposal)
  publish(message) {
    this.board.publish(message);
  }

  // Helper to subscribe to messages
  subscribe(messageType, eventName, callback) {
    this.board.subscribe(messageType, eventName, callback);
  }

  // Helper to unsubscribe from messages
  unsubscribe(messageType, eventName, callback) {
    this.board.unsubscribe(messageType, eventName, callback);
  }

  // Responsibility ③: Retirement (self-removal from the board)
  retire() {
    if (this.isActivated) {
      this.board.retract(this.capabilityName);
      this.isActivated = false;
      this.board.log(`👋 ${this.capabilityName}: Retired.`);
    }
  }
}
