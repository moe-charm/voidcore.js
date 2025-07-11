#!/usr/bin/env node
// 🧪 VoidCore v14.0 Pure System - Simple Node.js Test
// セリンの大改革テスト: 基底クラス継承完全排除確認

import { voidCore, Message, createPlugin } from './src/index.js';

console.log('🧪 VoidCore v14.0 Pure System Test Starting...');
console.log('🌟 セリンの大改革: 基底クラス継承完全排除テスト');

// Test state
let testResults = {
  initialization: false,
  messagePublish: false,
  messageSubscribe: false,
  pluginCreation: false,
  healthCheck: false
};

async function runTests() {
  console.log('\n=== 🔧 Phase 1: VoidCore Initialization ===');
  
  try {
    // Force initialization
    await voidCore._ensureInitialized();
    console.log('✅ VoidCore initialized successfully!');
    console.log(`   Initialized: ${voidCore.initialized}`);
    testResults.initialization = true;
  } catch (error) {
    console.error('❌ VoidCore initialization failed:', error);
    return;
  }

  console.log('\n=== 📮 Phase 2: Basic Message Publishing ===');
  
  try {
    // Simple message subscription test
    let messageReceived = false;
    
    voidCore.subscribe('Notice', (message) => {
      console.log('📥 Received Notice:', message.event_name, message.payload);
      if (message.event_name === 'test.simple') {
        messageReceived = true;
        testResults.messageSubscribe = true;
      }
    });
    
    console.log('📡 Subscribed to Notice messages');
    
    // Send test message
    const testMessage = Message.notice('test.simple', {
      content: 'Hello from VoidCore v14.0!',
      timestamp: Date.now()
    });
    
    const deliveredCount = await voidCore.publish(testMessage);
    console.log(`📮 Test message published, delivered to ${deliveredCount} subscribers`);
    testResults.messagePublish = true;
    
    // Wait a moment for message delivery
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (messageReceived) {
      console.log('✅ Message subscription working correctly!');
    } else {
      console.log('❌ Message was not received by subscriber');
    }
    
  } catch (error) {
    console.error('❌ Message publishing failed:', error);
  }

  console.log('\n=== 🤖 Phase 3: Pure Plugin Creation ===');
  
  try {
    // Create a simple plugin using the pure system
    const testPlugin = createPlugin({
      pluginId: 'test-plugin',
      name: 'Test Plugin',
      version: '1.0.0',
      capabilities: ['test'],
      autoHealth: true,
      autoProcess: true
    }, {
      async run() {
        await this.initialize();
        
        this.on('IntentRequest', 'test.ping', async (msg) => {
          console.log('🏓 Test plugin received ping request');
          await this.notice('test.pong', { 
            originalMessage: msg.message_id,
            timestamp: Date.now() 
          });
        });
        
        this.log('Test plugin started successfully');
      }
    });
    
    console.log('✅ Pure plugin created successfully!');
    console.log(`   Plugin ID: ${testPlugin.pluginId}`);
    console.log(`   Capabilities: ${Array.from(testPlugin.capabilities)}`);
    testResults.pluginCreation = true;
    
    // Start the plugin
    await testPlugin.run();
    console.log('✅ Plugin running');
    
  } catch (error) {
    console.error('❌ Plugin creation failed:', error);
  }

  console.log('\n=== 💊 Phase 4: Health Check System ===');
  
  try {
    let healthResponseReceived = false;
    
    // Listen for health responses
    voidCore.subscribe('IntentResponse', (message) => {
      if (message.action === 'core.health.ping') {
        console.log('💊 Health response:', message.payload);
        healthResponseReceived = true;
        testResults.healthCheck = true;
      }
    });
    
    // Send health check request
    const healthRequest = Message.intentRequest('*', 'core.health.ping', {
      timestamp: Date.now()
    });
    
    await voidCore.publish(healthRequest);
    console.log('📮 Health check request sent');
    
    // Wait for responses
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (healthResponseReceived) {
      console.log('✅ Health check system working!');
    } else {
      console.log('❌ No health check responses received');
    }
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
  }

  console.log('\n=== 📊 Test Results Summary ===');
  console.log('🌟 セリンの大改革 - 純粋メッセージベースシステム');
  
  Object.entries(testResults).forEach(([test, passed]) => {
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const passedCount = Object.values(testResults).filter(Boolean).length;
  const totalCount = Object.keys(testResults).length;
  
  console.log(`\n🎯 Overall: ${passedCount}/${totalCount} tests passed`);
  
  if (passedCount === totalCount) {
    console.log('🎉 All tests passed! VoidCore v14.0 Pure System is working correctly!');
    console.log('🌟 セリンの大改革は成功にゃ！');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above for details.');
  }
  
  process.exit(passedCount === totalCount ? 0 : 1);
}

// Run the tests
runTests().catch(console.error);