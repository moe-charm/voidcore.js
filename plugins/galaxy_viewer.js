// plugins/galaxy_viewer.js
import { AutonomousPlugin } from '../src/autonomous_plugin.js';

export class GalaxyViewerPlugin extends AutonomousPlugin {
  constructor(containerElement) {
    super("GalaxyViewerService");
    this.containerElement = containerElement;
    this.board.log('✅ GalaxyViewerPlugin initialized.');

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.stars = new Map(); // Map to store Three.js objects for each plugin
    this.animationFrameId = null;

    this._prepare();
  }

  _prepare() {
    super._prepare();

    // Load Three.js from CDN
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.onload = () => {
      this.board.log('🌌 Three.js loaded.');
      this._setupScene();

      // Subscribe to board changes to add/remove stars
      this.board.onChange(this.handleBoardChange.bind(this));
      this.board.log('➕ GalaxyViewerPlugin subscribed to board changes.');

      this._animate();
    };
    document.head.appendChild(script);
  }

  _setupScene() {
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.containerElement.clientWidth, this.containerElement.clientHeight);
    this.containerElement.appendChild(this.renderer.domElement);

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
  }

  onWindowResize() {
    this.camera.aspect = this.containerElement.clientWidth / this.containerElement.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.containerElement.clientWidth, this.containerElement.clientHeight);
  }

  _animate() {
    this.animationFrameId = requestAnimationFrame(this._animate.bind(this));
    this.renderer.render(this.scene, this.camera);

    // Rotate stars for visual effect
    this.stars.forEach(star => {
      star.rotation.x += 0.001;
      star.rotation.y += 0.001;
    });
  }

  handleBoardChange() {
    // This is called when provide/retract happens
    const currentCapabilities = this.board.board; // Access the internal map directly for now

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

    this.scene.add(star);
    this.stars.set(capabilityName, star);
  }

  _removeStar(capabilityName, star) {
    this.board.log(`☄️ Removing star for: ${capabilityName}`);
    // Simple removal for now, can add comet-like animation later
    this.scene.remove(star);
    this.stars.delete(capabilityName);
  }

  retire() {
    super.retire();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.renderer) {
      this.containerElement.removeChild(this.renderer.domElement);
      this.renderer.dispose();
    }
    window.removeEventListener('resize', this.onWindowResize.bind(this), false);
    this.board.log('🌌 GalaxyViewerPlugin: Cleaned up.');
  }
}

export function init(containerElement) {
  return new GalaxyViewerPlugin(containerElement);
}
