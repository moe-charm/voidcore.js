// plugins/galaxy_viewer.js
import { CachedAutonomousPlugin } from '../src/cached_autonomous_plugin.js';

export class GalaxyViewerPlugin extends CachedAutonomousPlugin {
  constructor(containerElement) {
    super("GalaxyViewerService");
    this.containerElement = containerElement;
    this.board.log('✅ GalaxyViewerPlugin initialized.');

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.stars = new Map(); // Map to store Three.js objects for each plugin
    this.animationFrameId = null;
    
    // Star management settings - EMERGENCY LIGHTWEIGHT PATCH
    this.maxStars = 8; // REDUCED: Maximum number of stars
    this.starLifetime = 5000; // REDUCED: 5 seconds lifetime
    this.starCreatedTimes = new Map(); // Track when each star was created

    this._prepare();
  }

  _prepare() {
    super._prepare();

    // Setup scene immediately, assuming Three.js is already loaded globally
    this._setupScene();

    // Subscribe to board changes to add/remove stars
    this.board.onChange(this.handleBoardChange.bind(this));
    this.board.log('➕ GalaxyViewerPlugin subscribed to board changes.');
    
    // Subscribe to collision notifications
    this.subscribe('Notice', 'collision.occurred', this.handleCollision.bind(this));
    this.board.log('💥 GalaxyViewerPlugin subscribed to collision events.');

    this._animate();
    this.board.log('🎬 Animation started!');
  }

  _setupScene() {
    this.board.log('🌌 Setting up Three.js scene...');
    
    if (!window.THREE) {
      this.board.log('❌ Three.js not loaded!');
      return;
    }
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.board.log(`🌌 Renderer created. Container size: ${this.containerElement.clientWidth}x${this.containerElement.clientHeight}`);
    this.renderer.setSize(this.containerElement.clientWidth, this.containerElement.clientHeight);
    this.containerElement.appendChild(this.renderer.domElement);
    this.board.log(`🌌 Renderer DOM element appended. Canvas size: ${this.renderer.domElement.width}x${this.renderer.domElement.height}`);

    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000); // Black background for space

    // Create camera
    this.camera = new THREE.PerspectiveCamera(75, this.containerElement.clientWidth / this.containerElement.clientHeight, 0.1, 1000);
    this.camera.position.z = 5;

    // Add some ambient light
    const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
    this.scene.add(ambientLight);

    // Add a point light
    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(5, 5, 5);
    this.scene.add(pointLight);

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this), false);
    
    // Create star counter UI
    this._createStarCounter();
    
    // Create demo info panel
    this._createDemoInfo();
    
    // Add some initial test stars to see if the scene is working
    this._addTestStars();
    
    this.board.log('🌌 Scene setup completed!');
  }

  onWindowResize() {
    this.camera.aspect = this.containerElement.clientWidth / this.containerElement.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.containerElement.clientWidth, this.containerElement.clientHeight);
  }

  _animate() {
    this.animationFrameId = requestAnimationFrame(this._animate.bind(this));
    
    // Rotate stars for visual effect
    this.frameCount = (this.frameCount || 0) + 1;
    const time = Date.now() * 0.001;
    const currentTime = Date.now();
    
    // Check for star expiration and cleanup
    this.starCreatedTimes.forEach((createdTime, starId) => {
      if (currentTime - createdTime > this.starLifetime) {
        this._expireStar(starId);
      }
    });
    
    // EMERGENCY: Force star limit and reduce spawn rate
    if (this.stars.size >= this.maxStars) {
      // Force remove oldest stars
      const oldestStars = Array.from(this.starCreatedTimes.entries())
        .sort((a, b) => a[1] - b[1])
        .slice(0, this.stars.size - this.maxStars + 1);
      oldestStars.forEach(([starId]) => this._forceRemoveStar(starId));
    }
    
    // Reduce spawn rate to 0.5%
    if (this.stars.size < this.maxStars && Math.random() < 0.005) {
      this._spawnRandomStar();
    }
    
    // Update star counter every 10 frames
    if (this.frameCount % 10 === 0) {
      this._updateStarCounter();
    }
    
    this.stars.forEach((star, capabilityName) => {
      star.rotation.x += 0.02;  // Much faster rotation
      star.rotation.y += 0.02;
      star.rotation.z += 0.01;
      
      // Make stars move around to create more collisions!
      const starIndex = Array.from(this.stars.keys()).indexOf(capabilityName);
      const offset = starIndex * 0.8; // Closer phase differences for more intersections
      
      // Smaller orbits and varied speeds for maximum collision potential
      const radius = 1.5 + (starIndex % 3) * 0.3; // Radius between 1.5-2.1
      const speed = 0.3 + (starIndex % 5) * 0.1;   // Speed between 0.3-0.7
      
      star.position.x = Math.cos(time * speed + offset) * radius;
      star.position.y = Math.sin(time * (speed * 1.3) + offset) * radius;
      star.position.z = Math.sin(time * (speed * 0.7) + offset) * (radius * 0.5);
      
      // Only notify position updates every 5 frames to reduce message spam
      if (this.frameCount % 5 === 0) {
        this.publish({
          type: 'Notice',
          event_name: 'object.moved',
          payload: {
            objectId: capabilityName,
            position: star.position,
            priority: 'batch' // Position updates can be batched for performance
          }
        });
      }
    });
    
    // Also slowly rotate the camera around the scene
    const cameraTime = Date.now() * 0.0005;
    this.camera.position.x = Math.cos(cameraTime) * 5;
    this.camera.position.z = Math.sin(cameraTime) * 5;
    this.camera.lookAt(0, 0, 0);
    
    this.renderer.render(this.scene, this.camera);
  }

  handleBoardChange() {
    this.board.log('🔔 Board change detected.');
    // This is called when provide/retract happens
    const currentCapabilities = this.board.board; // Access the internal map directly for now
    this.board.log(`Current capabilities on board: ${Array.from(currentCapabilities.keys()).join(', ')}`);

    // Add new stars
    currentCapabilities.forEach((value, key) => {
      if (!this.stars.has(key)) {
        this._addStar(key);
      }
    });

    // Remove old stars
    this.stars.forEach((star, key) => {
      if (!currentCapabilities.has(key)) {
        this._removeStar(key, star);
      }
    });
  }

  _addTestStars() {
    this.board.log('✨ Adding test stars...');
    
    // EMERGENCY: Limit initial stars to match maxStars
    const testStars = [
      'TestStar1', 'TestStar2', 'TestStar3', 'TestStar4', 'TestStar5'
    ]; // Only 5 initial stars
    testStars.forEach(name => {
      this._addStar(name);
    });
    
    // Add a bright center star to make sure something is visible
    const centerGeometry = new THREE.SphereGeometry(0.2, 32, 32);
    const centerMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xffff00, 
      emissive: 0x444400 
    });
    const centerStar = new THREE.Mesh(centerGeometry, centerMaterial);
    centerStar.position.set(0, 0, 0);
    this.scene.add(centerStar);
    this.stars.set('CenterTestStar', centerStar);
    
    this.board.log(`✨ Added ${testStars.length + 1} test stars`);
  }

  _addStar(capabilityName) {
    this.board.log(`✨ Adding star for: ${capabilityName}`);
    const geometry = new THREE.SphereGeometry(0.1, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color: Math.random() * 0xffffff });
    const star = new THREE.Mesh(geometry, material);

    // Position the star randomly in a sphere
    const radius = 3;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    star.position.x = radius * Math.sin(phi) * Math.cos(theta);
    star.position.y = radius * Math.sin(phi) * Math.sin(theta);
    star.position.z = radius * Math.cos(phi);
    this.board.log(`Star position for ${capabilityName}: x=${star.position.x.toFixed(2)}, y=${star.position.y.toFixed(2)}, z=${star.position.z.toFixed(2)}`);

    this.scene.add(star);
    this.stars.set(capabilityName, star);
    
    // Track creation time for lifetime management
    this.starCreatedTimes.set(capabilityName, Date.now());
    
    // Register with collision detector
    this.publish({
      type: 'Intent',
      event_name: 'collision.register',
      payload: {
        objectId: capabilityName,
        position: star.position,
        radius: 0.15, // Slightly larger than visual radius for better collision
        pluginId: this.id
      }
    });
  }

  _removeStar(capabilityName, star) {
    this.board.log(`☄️ Removing star for: ${capabilityName}`);
    
    // Unregister from collision detector
    this.publish({
      type: 'Intent',
      event_name: 'collision.unregister',
      payload: {
        objectId: capabilityName
      }
    });
    
    // Simple removal for now, can add comet-like animation later
    this.scene.remove(star);
    this.stars.delete(capabilityName);
    this.starCreatedTimes.delete(capabilityName);
  }

  retire() {
    super.retire();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.renderer && this.renderer.domElement && this.containerElement.contains(this.renderer.domElement)) {
      this.containerElement.removeChild(this.renderer.domElement);
      this.renderer.dispose();
    }
    if (this.starCounterDiv && this.containerElement.contains(this.starCounterDiv)) {
      this.containerElement.removeChild(this.starCounterDiv);
    }
    if (this.demoInfoDiv && this.containerElement.contains(this.demoInfoDiv)) {
      this.containerElement.removeChild(this.demoInfoDiv);
    }
    
    // Reset container styles completely
    if (this.containerElement) {
      this.containerElement.style.position = '';
    }
    
    // Clear all stars and timers
    this.stars.clear();
    this.starCreatedTimes.clear();
    
    window.removeEventListener('resize', this.onWindowResize.bind(this), false);
    this.board.log('🌌 GalaxyViewerPlugin: Completely cleaned up.');
  }
  
  handleCollision(message) {
    const { objectId, collidedWith, targetPlugin } = message.payload;
    
    // Only handle collisions for our own objects
    if (targetPlugin !== this.id) return;
    
    const star = this.stars.get(objectId);
    if (!star) return;
    
    this.board.log(`💥 Star ${objectId} collided with ${collidedWith}!`);
    
    // Increment collision counter
    this.collisionCount++;
    
    // Create spectacular collision effect!
    this._createCollisionEffect(star, objectId);
  }
  
  _createCollisionEffect(star, objectId) {
    // Flash bright white
    const originalMaterial = star.material;
    star.material = new THREE.MeshPhongMaterial({ 
      color: 0xffffff, 
      emissive: 0xffffff 
    });
    
    // Create explosion particles
    this._createExplosion(star.position);
    
    // EMERGENCY: Reduce split chance to 10%
    setTimeout(() => {
      if (Math.random() > 0.9) { // Only 10% chance to split
        this._splitStar(star, objectId);
      } else {
        // Just restore original color
        star.material = originalMaterial;
      }
    }, 200);
    
    this.board.log(`✨ Collision effect created for ${objectId}!`);
  }
  
  _createExplosion(position) {
    // Create multiple small particles that fly away
    for (let i = 0; i < 8; i++) {
      const particle = new THREE.Mesh(
        new THREE.SphereGeometry(0.02, 8, 8),
        new THREE.MeshPhongMaterial({ color: 0xff4444, emissive: 0x442222 })
      );
      
      particle.position.copy(position);
      this.scene.add(particle);
      
      // Random velocity
      const velocity = {
        x: (Math.random() - 0.5) * 0.1,
        y: (Math.random() - 0.5) * 0.1,
        z: (Math.random() - 0.5) * 0.1
      };
      
      // Animate particle
      const animateParticle = () => {
        particle.position.x += velocity.x;
        particle.position.y += velocity.y;
        particle.position.z += velocity.z;
        particle.scale.multiplyScalar(0.95); // Shrink
        
        if (particle.scale.x > 0.1) {
          requestAnimationFrame(animateParticle);
        } else {
          this.scene.remove(particle);
        }
      };
      
      requestAnimationFrame(animateParticle);
    }
  }
  
  _splitStar(originalStar, objectId) {
    // EMERGENCY: Check if we're already at limit
    if (this.stars.size >= this.maxStars) {
      this.board.log(`🚫 Cannot split ${objectId}: at star limit`);
      return;
    }
    
    // Remove original star
    this.scene.remove(originalStar);
    this.stars.delete(objectId);
    this.starCreatedTimes.delete(objectId);
    
    // Create only one smaller star to prevent explosion
    const newStar = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 16, 16), // Smaller
      new THREE.MeshPhongMaterial({ color: Math.random() * 0xffffff })
    );
    
    newStar.position.copy(originalStar.position);
    newStar.position.x += (Math.random() - 0.5) * 0.3;
    newStar.position.y += (Math.random() - 0.5) * 0.3;
    newStar.position.z += (Math.random() - 0.5) * 0.3;
    
    this.scene.add(newStar);
    
    const newId = `${objectId}_split_0`;
    this.stars.set(newId, newStar);
    this.starCreatedTimes.set(newId, Date.now());
    
    // Register new star with collision detector
    this.publish({
      type: 'Intent',
      event_name: 'collision.register',
      payload: {
        objectId: newId,
        position: newStar.position,
        radius: 0.08,
        pluginId: this.id
      }
    });
    
    this.board.log(`💥 Star ${objectId} split into 1 smaller star!`);
  }
  
  _expireStar(starId) {
    const star = this.stars.get(starId);
    if (!star) return;
    
    this.board.log(`⏰ Star ${starId} expired, creating supernova effect...`);
    
    // Create beautiful death animation
    this._createSupernovaEffect(star, starId);
    
    // Remove after effect
    setTimeout(() => {
      this._removeStar(starId, star);
    }, 1000);
  }
  
  _spawnRandomStar() {
    const randomId = `RandomStar_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    this._addStar(randomId);
    this.board.log(`🌟 New star spawned: ${randomId}`);
  }
  
  _createSupernovaEffect(star, starId) {
    // Flash bright white and expand
    const originalScale = star.scale.clone();
    star.material = new THREE.MeshPhongMaterial({ 
      color: 0xffffff, 
      emissive: 0xffffff 
    });
    
    // Expanding animation
    const expandAnimation = () => {
      star.scale.multiplyScalar(1.05);
      star.material.opacity = Math.max(0, star.material.opacity - 0.02);
      
      if (star.scale.x < 3) {
        requestAnimationFrame(expandAnimation);
      }
    };
    
    // EMERGENCY: Reduce particles from 16 to 4
    for (let i = 0; i < 4; i++) {
      const particle = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 8, 8),
        new THREE.MeshPhongMaterial({ color: 0xff6644, emissive: 0x442211 })
      );
      
      particle.position.copy(star.position);
      this.scene.add(particle);
      
      const angle = (i / 16) * Math.PI * 2;
      const velocity = {
        x: Math.cos(angle) * 0.15,
        y: Math.sin(angle) * 0.15,
        z: (Math.random() - 0.5) * 0.1
      };
      
      const animateRing = () => {
        particle.position.x += velocity.x;
        particle.position.y += velocity.y;
        particle.position.z += velocity.z;
        particle.scale.multiplyScalar(0.98);
        
        if (particle.scale.x > 0.1) {
          requestAnimationFrame(animateRing);
        } else {
          this.scene.remove(particle);
        }
      };
      
      requestAnimationFrame(animateRing);
    }
    
    requestAnimationFrame(expandAnimation);
    this.board.log(`💫 Supernova effect created for ${starId}!`);
  }
  
  _createStarCounter() {
    // Create a semi-transparent overlay div for the counter
    this.starCounterDiv = document.createElement('div');
    this.starCounterDiv.style.position = 'absolute';
    this.starCounterDiv.style.top = '10px';
    this.starCounterDiv.style.left = '10px';
    this.starCounterDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    this.starCounterDiv.style.color = '#ffffff';
    this.starCounterDiv.style.padding = '10px 15px';
    this.starCounterDiv.style.borderRadius = '8px';
    this.starCounterDiv.style.fontFamily = 'Arial, sans-serif';
    this.starCounterDiv.style.fontSize = '14px';
    this.starCounterDiv.style.fontWeight = 'bold';
    this.starCounterDiv.style.zIndex = '1000';
    this.starCounterDiv.style.border = '1px solid #444';
    this.starCounterDiv.style.backdropFilter = 'blur(5px)';
    
    // Initial content
    this.starCounterDiv.innerHTML = `
      🌟 Stars: 0/${this.maxStars}<br>
      ⏰ Lifetime: ${this.starLifetime/1000}s<br>
      💥 Collisions: 0
    `;
    
    // Add to container
    this.containerElement.style.position = 'relative';
    this.containerElement.appendChild(this.starCounterDiv);
    
    this.collisionCount = 0; // Track collision count
    this.board.log('📊 Star counter UI created.');
  }
  
  _createDemoInfo() {
    // Create demo info panel in top-right
    this.demoInfoDiv = document.createElement('div');
    this.demoInfoDiv.style.position = 'absolute';
    this.demoInfoDiv.style.top = '10px';
    this.demoInfoDiv.style.right = '10px';
    this.demoInfoDiv.style.backgroundColor = 'rgba(0, 20, 40, 0.85)';
    this.demoInfoDiv.style.color = '#e0e0ff';
    this.demoInfoDiv.style.padding = '12px 16px';
    this.demoInfoDiv.style.borderRadius = '10px';
    this.demoInfoDiv.style.fontFamily = 'Arial, sans-serif';
    this.demoInfoDiv.style.fontSize = '13px';
    this.demoInfoDiv.style.lineHeight = '1.4';
    this.demoInfoDiv.style.zIndex = '1000';
    this.demoInfoDiv.style.border = '1px solid #4a90e2';
    this.demoInfoDiv.style.backdropFilter = 'blur(8px)';
    this.demoInfoDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    this.demoInfoDiv.style.maxWidth = '280px';
    
    this.demoInfoDiv.innerHTML = `
      <div style="color: #4a90e2; font-weight: bold; margin-bottom: 8px; text-align: center;">
        🌌 VoidCore Galaxy Demo
      </div>
      <div style="font-size: 11px; color: #b0c4de;">
        <strong>🚀 Autonomous Plugin System</strong><br>
        • CollisionDetector + GalaxyViewer<br>
        • Real-time message caching<br>
        • Self-managing star lifecycle<br><br>
        
        <strong>⭐ Features:</strong><br>
        • Stars orbit and collide<br>
        • Explosion & split effects<br>
        • Auto-spawn & expire (5s)<br>
        • Max 8 stars for performance<br><br>
        
        <strong>🎯 Architecture:</strong><br>
        • Intent/Notice/Proposal messaging<br>
        • Priority-based caching<br>
        • Complete plugin autonomy<br><br>
        
        <span style="color: #90EE90;">💡 Try Edge/Chrome for best performance</span>
      </div>
    `;
    
    this.containerElement.appendChild(this.demoInfoDiv);
    this.board.log('📖 Demo info panel created.');
  }
  
  _updateStarCounter() {
    if (this.starCounterDiv) {
      const averageAge = this.starCreatedTimes.size > 0 ? 
        Array.from(this.starCreatedTimes.values())
          .reduce((sum, time) => sum + (Date.now() - time), 0) / this.starCreatedTimes.size / 1000 : 0;
      
      this.starCounterDiv.innerHTML = `
        🌟 Stars: ${this.stars.size}/${this.maxStars}<br>
        ⏰ Avg Age: ${averageAge.toFixed(1)}s<br>
        💥 Collisions: ${this.collisionCount}<br>
        🎯 Cache: ${this.messageCache ? this.messageCache.length : 0}
      `;
    }
  }
  
  _forceRemoveStar(starId) {
    const star = this.stars.get(starId);
    if (star) {
      this.scene.remove(star);
      this.stars.delete(starId);
      this.starCreatedTimes.delete(starId);
      this.board.log(`🗑️ Force removed star: ${starId}`);
    }
  }
}

export function init(containerElement) {
  const instance = new GalaxyViewerPlugin(containerElement);
  // _prepare() is already called in constructor, no need to call again
  return instance;
}
