// src/transport.js - VoidCore v13.0 Transport Adapter Layer
// Elegant abstraction for swappable communication backends

/**
 * Transport Interface - The "Heart" of VoidCore
 * 
 * This interface defines how VoidCore sends and receives messages.
 * Developers can implement custom transports for WebSocket, Worker, IPC, etc.
 */
export class ITransport {
  /**
   * Initialize the transport
   * @returns {Promise<void>}
   */
  async initialize() {
    throw new Error('Transport.initialize() must be implemented');
  }

  /**
   * Send a message through this transport
   * @param {Object} message - The message to send
   * @param {string} channel - The channel to send on (optional)
   * @returns {Promise<void>}
   */
  async send(message, channel = 'default') {
    throw new Error('Transport.send() must be implemented');
  }

  /**
   * Subscribe to incoming messages
   * @param {Function} handler - Function to call when message received
   * @param {string} channel - The channel to listen on (optional)
   * @returns {Function} Unsubscribe function
   */
  subscribe(handler, channel = 'default') {
    throw new Error('Transport.subscribe() must be implemented');
  }

  /**
   * Get transport statistics
   * @returns {Object} Stats object
   */
  getStats() {
    return {
      type: this.constructor.name,
      status: 'unknown',
      messageCount: 0,
      channels: []
    };
  }

  /**
   * Cleanup and shutdown transport
   * @returns {Promise<void>}
   */
  async destroy() {
    // Default implementation - override if needed
  }
}

/**
 * DefaultTransport - Uses current VoidCore v12.0 implementation
 * 
 * This preserves exact v12.0 behavior while providing the Transport interface.
 * Zero breaking changes for existing code.
 */
export class DefaultTransport extends ITransport {
  constructor() {
    super();
    this.handlers = new Map(); // channel -> Set<handler>
    this.messageCount = 0;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) {
      return; // 重複初期化防止
    }
    this.initialized = true;
    console.log('🔌 DefaultTransport initialized (v12.0 compatibility mode)');
  }

  async send(message, channel = 'default') {
    if (!this.initialized) {
      throw new Error('Transport not initialized');
    }

    this.messageCount++;
    
    // Get handlers for this channel
    const channelHandlers = this.handlers.get(channel);
    if (!channelHandlers || channelHandlers.size === 0) {
      return 0; // No subscribers
    }

    // Deliver to all handlers (same as v12.0 Channel.publish)
    const promises = Array.from(channelHandlers).map(handler => {
      try {
        return Promise.resolve(handler(message));
      } catch (error) {
        console.error(`❌ Transport handler error: ${error.message}`);
        return Promise.resolve();
      }
    });

    await Promise.all(promises);
    return channelHandlers.size;
  }

  subscribe(handler, channel = 'default') {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());
    }
    
    this.handlers.get(channel).add(handler);
    
    // Return unsubscribe function
    return () => {
      const channelHandlers = this.handlers.get(channel);
      if (channelHandlers) {
        channelHandlers.delete(handler);
        if (channelHandlers.size === 0) {
          this.handlers.delete(channel);
        }
      }
    };
  }

  getStats() {
    const channels = Array.from(this.handlers.entries()).map(([name, handlers]) => ({
      name,
      subscriberCount: handlers.size
    }));

    return {
      type: 'DefaultTransport',
      status: this.initialized ? 'active' : 'inactive',
      messageCount: this.messageCount,
      channels: channels,
      totalSubscribers: channels.reduce((sum, ch) => sum + ch.subscriberCount, 0)
    };
  }

  async destroy() {
    this.handlers.clear();
    this.initialized = false;
    console.log('🔌 DefaultTransport destroyed');
  }
}

/**
 * WebSocketTransport - Example custom transport
 * 
 * Demonstrates how developers can create distributed VoidCore networks
 */
export class WebSocketTransport extends ITransport {
  constructor(url, options = {}) {
    super();
    this.url = url;
    this.options = options;
    this.socket = null;
    this.handlers = new Map();
    this.messageCount = 0;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(this.url);
        
        this.socket.onopen = () => {
          console.log('🌐 WebSocketTransport connected to', this.url);
          this.reconnectAttempts = 0;
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const { message, channel } = JSON.parse(event.data);
            this.handleIncomingMessage(message, channel);
          } catch (error) {
            console.error('❌ WebSocketTransport parse error:', error);
          }
        };

        this.socket.onclose = () => {
          console.log('🌐 WebSocketTransport disconnected');
          this.attemptReconnect();
        };

        this.socket.onerror = (error) => {
          console.error('❌ WebSocketTransport error:', error);
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  async send(message, channel = 'default') {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const payload = {
      message,
      channel,
      timestamp: Date.now(),
      sender: 'voidcore-client'
    };

    this.socket.send(JSON.stringify(payload));
    this.messageCount++;
  }

  subscribe(handler, channel = 'default') {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());
    }
    
    this.handlers.get(channel).add(handler);
    
    return () => {
      const channelHandlers = this.handlers.get(channel);
      if (channelHandlers) {
        channelHandlers.delete(handler);
        if (channelHandlers.size === 0) {
          this.handlers.delete(channel);
        }
      }
    };
  }

  handleIncomingMessage(message, channel) {
    const channelHandlers = this.handlers.get(channel);
    if (channelHandlers) {
      channelHandlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('❌ WebSocketTransport handler error:', error);
        }
      });
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000;
      
      console.log(`🔄 WebSocketTransport reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.initialize().catch(() => {
          this.attemptReconnect();
        });
      }, delay);
    } else {
      console.error('❌ WebSocketTransport max reconnection attempts reached');
    }
  }

  getStats() {
    const channels = Array.from(this.handlers.entries()).map(([name, handlers]) => ({
      name,
      subscriberCount: handlers.size
    }));

    return {
      type: 'WebSocketTransport',
      status: this.socket?.readyState === WebSocket.OPEN ? 'connected' : 'disconnected',
      url: this.url,
      messageCount: this.messageCount,
      reconnectAttempts: this.reconnectAttempts,
      channels: channels,
      totalSubscribers: channels.reduce((sum, ch) => sum + ch.subscriberCount, 0)
    };
  }

  async destroy() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.handlers.clear();
    console.log('🌐 WebSocketTransport destroyed');
  }
}

/**
 * BroadcastChannelTransport - For inter-tab communication
 */
export class BroadcastChannelTransport extends ITransport {
  constructor(channelName = 'voidcore') {
    super();
    this.channelName = channelName;
    this.broadcastChannel = null;
    this.handlers = new Map();
    this.messageCount = 0;
  }

  async initialize() {
    if (!('BroadcastChannel' in window)) {
      throw new Error('BroadcastChannel not supported in this environment');
    }

    this.broadcastChannel = new BroadcastChannel(this.channelName);
    
    this.broadcastChannel.onmessage = (event) => {
      const { message, channel } = event.data;
      this.handleIncomingMessage(message, channel);
    };

    console.log('📡 BroadcastChannelTransport initialized on', this.channelName);
  }

  async send(message, channel = 'default') {
    if (!this.broadcastChannel) {
      throw new Error('BroadcastChannel not initialized');
    }

    const payload = {
      message,
      channel,
      timestamp: Date.now(),
      sender: window.location.href
    };

    this.broadcastChannel.postMessage(payload);
    this.messageCount++;
  }

  subscribe(handler, channel = 'default') {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());
    }
    
    this.handlers.get(channel).add(handler);
    
    return () => {
      const channelHandlers = this.handlers.get(channel);
      if (channelHandlers) {
        channelHandlers.delete(handler);
        if (channelHandlers.size === 0) {
          this.handlers.delete(channel);
        }
      }
    };
  }

  handleIncomingMessage(message, channel) {
    const channelHandlers = this.handlers.get(channel);
    if (channelHandlers) {
      channelHandlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('❌ BroadcastChannelTransport handler error:', error);
        }
      });
    }
  }

  getStats() {
    const channels = Array.from(this.handlers.entries()).map(([name, handlers]) => ({
      name,
      subscriberCount: handlers.size
    }));

    return {
      type: 'BroadcastChannelTransport',
      status: this.broadcastChannel ? 'active' : 'inactive',
      channelName: this.channelName,
      messageCount: this.messageCount,
      channels: channels,
      totalSubscribers: channels.reduce((sum, ch) => sum + ch.subscriberCount, 0)
    };
  }

  async destroy() {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    this.handlers.clear();
    console.log('📡 BroadcastChannelTransport destroyed');
  }
}