// VoidCoreとの統合
import { voidCore } from './voidcore.js';

class CoreBulletinBoard {
  constructor() {
    this.board = new Map();
    this.subscribers = new Map(); // Map<messageType, Map<eventName, Set<callback>>>
    this.changeListeners = new Set(); // For board change notifications
    this.logElement = null;
    this.voidCore = voidCore; // VoidCoreとの統合
  }

  setLogElement(element) {
    this.logElement = element;
    // VoidCoreにも同じログ要素を設定
    this.voidCore.setLogElement(element);
  }

  log(msg) {
    if (this.logElement) {
      this.logElement.innerHTML += msg + "<br>";
      // Auto-scroll to the bottom after a short delay to allow DOM to update
      setTimeout(() => {
        this.logElement.scrollTop = this.logElement.scrollHeight;
      }, 0);
    } else {
      console.log(msg);
    }
  }

  provide(cap, val) {
    this.board.set(cap, val);
    this.log(`📌 provide: ${cap}`);
    this._notifyChange();
  }

  retract(cap) {
    this.board.delete(cap);
    this.log(`❌ retract: ${cap}`);
    this._notifyChange();
  }

  observe(cap) {
    return this.board.get(cap);
  }

  // New: Notify when board capabilities change
  onChange(callback) {
    this.changeListeners.add(callback);
    this.log(`🔔 Added change listener.`);
  }

  _notifyChange() {
    this.changeListeners.forEach(callback => {
      try {
        callback();
      } catch (e) {
        this.log(`❌ Error in change listener: ${e.message}`);
      }
    });
    this.log(`🔔 Notified change listeners.`);
  }

  // New: Publish a message (Notice, Intent, Proposal)
  publish(message) {
    let actualEventName;
    if (message.type === 'Proposal') {
      actualEventName = message.suggestion;
    } else {
      actualEventName = message.event_name;
    }

    if (!message || !message.type || !actualEventName) {
      this.log("⚠️ Invalid message published: " + JSON.stringify(message));
      return;
    }
    this.log(`✉️ Publish (${message.type}): ${actualEventName}`);

    const typeSubscribers = this.subscribers.get(message.type);
    if (typeSubscribers) {
      // Callbacks for specific event_name (or suggestion for Proposal)
      const eventSubscribers = typeSubscribers.get(actualEventName);
      if (eventSubscribers) {
        eventSubscribers.forEach(callback => {
          try {
            callback(message);
          } catch (e) {
            this.log(`❌ Error in subscriber for ${message.type}:${actualEventName}: ${e.message}`);
          }
        });
      }

      // Callbacks for all events of this type (if any)
      const allEventsOfTypeSubscribers = typeSubscribers.get('*'); // Wildcard for all events of this type
      if (allEventsOfTypeSubscribers) {
        allEventsOfTypeSubscribers.forEach(callback => {
          try {
            callback(message);
          } catch (e) {
            this.log(`❌ Error in wildcard subscriber for ${message.type}: ${e.message}`);
          }
        });
      }
    }
  }

  // New: Subscribe to a message event with messageType and eventName
  subscribe(messageType, eventName, callback) {
    if (!this.subscribers.has(messageType)) {
      this.subscribers.set(messageType, new Map());
    }
    const typeSubscribers = this.subscribers.get(messageType);

    if (!typeSubscribers.has(eventName)) {
      typeSubscribers.set(eventName, new Set());
    }
    typeSubscribers.get(eventName).add(callback);
    this.log(`➕ Subscribe: ${messageType}:${eventName}`);
  }

  // New: Unsubscribe from a message event
  unsubscribe(messageType, eventName, callback) {
    const typeSubscribers = this.subscribers.get(messageType);
    if (typeSubscribers) {
      const eventSubscribers = typeSubscribers.get(eventName);
      if (eventSubscribers) {
        eventSubscribers.delete(callback);
        if (eventSubscribers.size === 0) {
          typeSubscribers.delete(eventName);
        }
      }
      if (typeSubscribers.size === 0) {
        this.subscribers.delete(messageType);
      }
      this.log(`➖ Unsubscribe: ${messageType}:${eventName}`);
    }
  }
}

export const board = new CoreBulletinBoard();