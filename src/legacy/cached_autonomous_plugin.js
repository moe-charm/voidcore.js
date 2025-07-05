// src/cached_autonomous_plugin.js
import { AutonomousPlugin } from './autonomous_plugin.js';

export class CachedAutonomousPlugin extends AutonomousPlugin {
  constructor(capabilityName) {
    super(capabilityName);
    this.messageCache = [];
    this.batchTimer = null;
    this.batchDelay = 16; // ~60fps batching
    this.board.log(`🧠 ${capabilityName}: CachedAutonomousPlugin initialized with batching.`);
  }
  
  // Override publish to add caching logic
  publish(message) {
    // Add timestamp and source to the message
    message.timestamp = Date.now();
    message.source = this.capabilityName;
    
    // Check if message should be cached based on priority
    if (this._shouldCache(message)) {
      this._addToCache(message);
      this._scheduleBatch();
    } else {
      // Send immediately for high-priority messages
      this.board.log(`⚡ Immediate send: ${message.type}:${message.event_name}`);
      super.publish(message);
    }
  }
  
  _shouldCache(message) {
    // Check explicit priority first
    if (message.payload.priority) {
      const priority = message.payload.priority;
      if (priority === 'immediate' || priority === 'urgent' || priority === 'realtime') {
        return false; // Send immediately
      }
      if (priority === 'batch' || priority === 'throttle') {
        return true; // Cache this message
      }
    }
    
    // Default rules for common message types
    const highPriorityEvents = [
      'collision.occurred',
      'user.input',
      'error.critical',
      'system.shutdown'
    ];
    
    if (highPriorityEvents.includes(message.event_name)) {
      return false; // Send immediately
    }
    
    const batchableEvents = [
      'object.moved',
      'position.updated',
      'metrics.updated',
      'log.info'
    ];
    
    if (batchableEvents.includes(message.event_name)) {
      return true; // Cache for batching
    }
    
    // Default: send immediately (safe side)
    return false;
  }
  
  _addToCache(message) {
    this.messageCache.push(message);
    this.board.log(`📦 Cached: ${message.type}:${message.event_name} (${this.messageCache.length} in cache)`);
    
    // Prevent cache from growing too large
    if (this.messageCache.length > 100) {
      this.board.log(`⚠️ Cache size limit reached, flushing early...`);
      this._flushCache();
    }
  }
  
  _scheduleBatch() {
    if (this.batchTimer) return; // Already scheduled
    
    this.batchTimer = setTimeout(() => {
      this._flushCache();
      this.batchTimer = null;
    }, this.batchDelay);
  }
  
  _flushCache() {
    if (this.messageCache.length === 0) return;
    
    const messageCount = this.messageCache.length;
    this.board.log(`🚀 Flushing ${messageCount} cached messages...`);
    
    // Send all cached messages
    this.messageCache.forEach(message => {
      super.publish(message);
    });
    
    // Clear cache
    this.messageCache = [];
    this.board.log(`✅ Cache flushed successfully.`);
  }
  
  // Override retire to clean up properly
  retire() {
    // Flush any remaining messages before retiring
    if (this.messageCache.length > 0) {
      this.board.log(`🧹 Flushing ${this.messageCache.length} messages before retirement...`);
      this._flushCache();
    }
    
    // Clean up timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    // Call parent retire
    super.retire();
    this.board.log(`👋 ${this.capabilityName}: CachedAutonomousPlugin retired cleanly.`);
  }
}