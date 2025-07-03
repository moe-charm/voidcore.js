// examples/demos/voidcore_quickstart_demo.js
import { board } from '../../src/core.js';

export async function runDemo(container) {
  board.log('--- Loading VoidCore Quick Start demo ---');

  // Clear the container for this demo
  if (container) {
    container.innerHTML = '';
    container.style.position = 'relative';
    container.style.height = '650px';
    container.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    container.style.borderRadius = '10px';
    container.style.overflow = 'auto';
    container.style.fontFamily = 'Arial, sans-serif';
  }

  // Create main content wrapper
  const content = document.createElement('div');
  content.style.position = 'absolute';
  content.style.top = '0';
  content.style.left = '0';
  content.style.right = '0';
  content.style.bottom = '0';
  content.style.padding = '40px';
  content.style.color = 'white';
  content.style.textAlign = 'center';
  container.appendChild(content);

  // Header section with title and coffee link
  const headerSection = document.createElement('div');
  headerSection.style.display = 'flex';
  headerSection.style.justifyContent = 'space-between';
  headerSection.style.alignItems = 'flex-start';
  headerSection.style.marginBottom = '20px';
  
  // Main title
  const titleDiv = document.createElement('div');
  titleDiv.style.flex = '1';
  titleDiv.style.textAlign = 'center';
  
  const title = document.createElement('h1');
  title.style.fontSize = '36px';
  title.style.marginBottom = '10px';
  title.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
  title.innerHTML = '🌟 Welcome to VoidCore! 🌟';
  titleDiv.appendChild(title);

  // Subtitle
  const subtitle = document.createElement('p');
  subtitle.style.fontSize = '18px';
  subtitle.style.marginBottom = '0';
  subtitle.style.opacity = '0.9';
  subtitle.innerHTML = 'The message-driven framework for autonomous systems';
  titleDiv.appendChild(subtitle);
  
  headerSection.appendChild(titleDiv);
  content.appendChild(headerSection);

  // Demo cards container
  const cardsContainer = document.createElement('div');
  cardsContainer.style.display = 'grid';
  cardsContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))';
  cardsContainer.style.gap = '20px';
  cardsContainer.style.marginTop = '40px';
  content.appendChild(cardsContainer);

  // Demo cards data
  const demos = [
    {
      title: '🏙️ Message City',
      description: 'Urban simulation powered by autonomous plugins',
      features: [
        '🚦 Traffic lights respond to messages',
        '🚗 Vehicles cooperate autonomously', 
        '🚨 Emergency override system',
        '🎯 No central control needed'
      ],
      color: '#ff6b6b',
      selector: 'message-city'
    },
    {
      title: '📝 Markdown Editor',
      description: 'Real-time collaboration with message visualization',
      features: [
        '⚡ Message flow animation',
        '🎯 Plugin communication shown',
        '📊 Real-time statistics',
        '💫 Beautiful UI effects'
      ],
      color: '#4ecdc4',
      selector: 'markdown-editor'
    },
    {
      title: '🤖 Cogito Observer',
      description: 'Philosophical AI dialogue system',
      features: [
        '🧠 Self-aware plugins',
        '👥 Multiple instances',
        '🔄 Complete lifecycle demo',
        '🎭 Character animations'
      ],
      color: '#45b7d1',
      selector: 'cogito-observer'
    },
    {
      title: '🌌 Galaxy Viewer',
      description: 'Advanced 3D collision detection demo',
      features: [
        '⭐ Dynamic star creation',
        '💥 Collision animations',
        '🎮 Performance optimized',
        '📊 Real-time metrics'
      ],
      color: '#96ceb4',
      selector: 'galaxy-viewer'
    },
    {
      title: '📊 System Monitor',
      description: 'Real-time system performance tracking',
      features: [
        '💻 CPU & Memory metrics',
        '📈 Live performance graphs',
        '⚡ Plugin communication stats',
        '🔍 System diagnostics'
      ],
      color: '#f39c12',
      selector: 'system-monitor'
    }
  ];

  // Create demo cards
  demos.forEach(demo => {
    const card = document.createElement('div');
    card.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    card.style.backdropFilter = 'blur(10px)';
    card.style.borderRadius = '15px';
    card.style.padding = '25px';
    card.style.border = `2px solid ${demo.color}`;
    card.style.cursor = 'pointer';
    card.style.transition = 'all 0.3s ease';
    card.style.textAlign = 'left';
    
    // Card hover effects
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-5px)';
      card.style.boxShadow = `0 10px 25px rgba(0,0,0,0.3)`;
      card.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = 'none';
      card.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    });

    // Card title
    const cardTitle = document.createElement('h3');
    cardTitle.style.color = demo.color;
    cardTitle.style.marginBottom = '10px';
    cardTitle.style.fontSize = '20px';
    cardTitle.innerHTML = demo.title;
    card.appendChild(cardTitle);

    // Card description
    const cardDesc = document.createElement('p');
    cardDesc.style.fontSize = '14px';
    cardDesc.style.marginBottom = '15px';
    cardDesc.style.opacity = '0.9';
    cardDesc.innerHTML = demo.description;
    card.appendChild(cardDesc);

    // Features list
    const featuresList = document.createElement('ul');
    featuresList.style.listStyle = 'none';
    featuresList.style.padding = '0';
    featuresList.style.margin = '0';
    
    demo.features.forEach(feature => {
      const li = document.createElement('li');
      li.style.fontSize = '12px';
      li.style.marginBottom = '5px';
      li.style.opacity = '0.8';
      li.innerHTML = feature;
      featuresList.appendChild(li);
    });
    
    card.appendChild(featuresList);

    // Click to switch demo
    card.addEventListener('click', () => {
      const demoSelector = document.getElementById('demo-selector');
      if (demoSelector) {
        demoSelector.value = demo.selector;
        demoSelector.dispatchEvent(new Event('change'));
      }
    });

    cardsContainer.appendChild(card);
  });


  // Footer message with coffee link
  const footer = document.createElement('div');
  footer.style.position = 'absolute';
  footer.style.bottom = '20px';
  footer.style.left = '0';
  footer.style.right = '0';
  footer.style.textAlign = 'center';
  footer.style.fontSize = '14px';
  footer.style.opacity = '0.7';
  footer.innerHTML = `
    💡 Click any card above to explore the demo!<br>
    💫 This screen also runs on VoidCore!
  `;
  container.appendChild(footer);

  // Add floating particles effect
  createParticles(container);

  // Return cleanup function
  return {
    cleanup: () => {
      board.log('--- Cleaning up VoidCore Quick Start demo ---');
      if (container) container.innerHTML = '';
    }
  };
}

function createParticles(container) {
  // Create floating particles for visual effect
  for (let i = 0; i < 20; i++) {
    const particle = document.createElement('div');
    particle.style.position = 'absolute';
    particle.style.width = '4px';
    particle.style.height = '4px';
    particle.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    particle.style.borderRadius = '50%';
    particle.style.pointerEvents = 'none';
    
    // Random position
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    
    // Random animation
    const duration = 3 + Math.random() * 4; // 3-7 seconds
    particle.style.animation = `float ${duration}s ease-in-out infinite`;
    particle.style.animationDelay = Math.random() * 2 + 's';
    
    container.appendChild(particle);
  }
  
  // Add CSS for floating animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes float {
      0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
      25% { transform: translateY(-20px) translateX(10px); opacity: 0.7; }
      50% { transform: translateY(-10px) translateX(-5px); opacity: 0.5; }
      75% { transform: translateY(-30px) translateX(15px); opacity: 0.8; }
    }
  `;
  document.head.appendChild(style);
}