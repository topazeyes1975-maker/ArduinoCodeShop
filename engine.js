// ==========================================
// FILE: engine.js
// Controls Three.js scene setup, render loop, button listeners, and master routing
// ==========================================

let scene, camera, renderer, controls, modelGroup;
let activePolyBudget = 6000;

// Global reference for active texture canvas
window.currentCanvas = window.currentCanvas || null;

// Run startup immediately with error guards
try {
  initEngine();
} catch (err) {
  alert("Init Engine Error: " + err.message);
}

try {
  bindEngineEvents();
} catch (err) {
  alert("Bind Events Error: " + err.message);
}

function initEngine() {
  const container = document.getElementById('canvas-container');
  if (!container) return;

  // 1. Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  // 2. Camera
  camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(0, 1, 4.5);

  // 3. Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Color Space standard configuration
  if ('outputColorSpace' in renderer && typeof THREE.SRGBColorSpace !== 'undefined') {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  } else {
    renderer.outputEncoding = THREE.sRGBEncoding;
  }

  container.innerHTML = ''; 
  container.appendChild(renderer.domElement);

  // 4. Controls
  if (typeof THREE.OrbitControls !== 'undefined') {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0.3, 0);
  }

  // 5. Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight1.position.set(5, 10, 7);
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0x00aaff, 0.3);
  dirLight2.position.set(-5, -5, -5);
  scene.add(dirLight2);

  // 6. Model Root Group
  modelGroup = new THREE.Group();
  scene.add(modelGroup);

  // Handle Window Resize
  window.addEventListener('resize', onWindowResize);

  // Start Animation Loop
  animate();
}

function animate() {
  requestAnimationFrame(animate);
  if (controls) controls.update();
  if (renderer && scene && camera) renderer.render(scene, camera);
}

function onWindowResize() {
  const container = document.getElementById('canvas-container');
  if (!container || !renderer || !camera) return;
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

// Safely dispose geometries and materials to avoid GPU memory leaks
function disposeGroup(group) {
  if (!group) return;
  group.traverse((child) => {
    if (child.isMesh) {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
    }
  });
  group.clear();
}

// --- BUTTON EVENT HANDLERS ---

function handleLockPoly() {
  const polyInput = document.getElementById('poly-input');
  const lockBtn = document.getElementById('lock-btn');
  const promptInput = document.getElementById('prompt-input');
  const genBtn = document.getElementById('generate-btn');
  const statusEl = document.getElementById('status-text');

  activePolyBudget = polyInput ? (parseInt(polyInput.value, 10) || 6000) : 6000;

  if (polyInput) polyInput.disabled = true;
  if (lockBtn) {
    lockBtn.disabled = true;
    lockBtn.innerText = `Locked at ${activePolyBudget} Polys`;
  }
  if (promptInput) {
    promptInput.disabled = false;
    promptInput.placeholder = "Try: female, dragon, centaur, lamia, dog, wolf, chimera, cat...";
  }
  if (genBtn) genBtn.disabled = false;
  if (statusEl) statusEl.innerText = `Status: Cage locked at ${activePolyBudget} polygons. Ready for prompt.`;

  // Scale wireframe segment density dynamically based on poly count
  if (modelGroup) {
    disposeGroup(modelGroup);

    const wireMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc, wireframe: true });
    const segMultiplier = Math.max(1, Math.floor(Math.sqrt(activePolyBudget / 6000)));
    const headSegs = Math.min(64, 8 * segMultiplier);
    const torsoRadSegs = Math.min(48, 8 * segMultiplier);
    const torsoHSegs = Math.min(32, 4 * segMultiplier);
    const limbRadSegs = Math.min(32, 6 * segMultiplier);
    const limbHSegs = Math.min(24, 4 * segMultiplier);

    const headWire = new THREE.Mesh(new THREE.SphereGeometry(0.45, headSegs, headSegs), wireMat);
    headWire.position.set(0, 1.45, 0);
    modelGroup.add(headWire);

    const torsoWire = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 1.2, torsoRadSegs, torsoHSegs), wireMat);
    torsoWire.position.set(0, 0.4, 0);
    modelGroup.add(torsoWire);

    const armLeftWire = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.8, limbRadSegs, limbHSegs), wireMat);
    armLeftWire.position.set(-0.52, 0.4, 0);
    modelGroup.add(armLeftWire);

    const armRightWire = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.8, limbRadSegs, limbHSegs), wireMat);
    armRightWire.position.set(0.52, 0.4, 0);
    modelGroup.add(armRightWire);

    const legLeftWire = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.09, 1.0, limbRadSegs, limbHSegs), wireMat);
    legLeftWire.position.set(-0.22, -0.7, 0);
    modelGroup.add(legLeftWire);

    const legRightWire = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.09, 1.0, limbRadSegs, limbHSegs), wireMat);
    legRightWire.position.set(0.22, -0.7, 0);
    modelGroup.add(legRightWire);
  }
}

function handleResetEngine() {
  const polyInput = document.getElementById('poly-input');
  const lockBtn = document.getElementById('lock-btn');
  const promptInput = document.getElementById('prompt-input');
  const genBtn = document.getElementById('generate-btn');
  const statusEl = document.getElementById('status-text');

  if (polyInput) {
    polyInput.disabled = false;
    polyInput.value = "6000";
  }
  if (lockBtn) {
    lockBtn.disabled = false;
    lockBtn.innerText = "Lock Poly Count & Size";
  }
  if (promptInput) {
    promptInput.disabled = true;
    promptInput.value = "";
    promptInput.placeholder = "Set polycount in Step 1 first...";
  }
  if (genBtn) genBtn.disabled = true;
  if (statusEl) statusEl.innerText = "Status: Engine reset. Lock poly count to begin.";

  if (modelGroup) disposeGroup(modelGroup);
  window.currentCanvas = null;
}

function bindEngineEvents() {
  const lockBtn = document.getElementById('lock-btn');
  const resetBtn = document.getElementById('reset-btn');
  const genBtn = document.getElementById('generate-btn');
  const exportBtn = document.getElementById('export-btn');

  if (lockBtn) {
    lockBtn.onclick = (e) => {
      e.preventDefault();
      handleLockPoly();
    };
  }

  if (resetBtn) {
    resetBtn.onclick = (e) => {
      e.preventDefault();
      handleResetEngine();
    };
  }

  if (genBtn) {
    genBtn.onclick = (e) => {
      e.preventDefault();
      if (typeof handleGenerate === 'function') {
        handleGenerate();
      }
    };
  }

  if (exportBtn) {
    exportBtn.onclick = (e) => {
      e.preventDefault();
      if (typeof handleExport === 'function') {
        handleExport();
      }
    };
  }
}

// --- EXPORT BRIDGE ---
function handleExport() {
  if (typeof exportOBJBundle === 'function') {
    exportOBJBundle();
  } else {
    alert("Export module (texturesAndExport.js) is not loaded!");
  }
}

// ==========================================
// CENTRAL MODEL REGISTRY (Lookup Map)
// ==========================================
const MODEL_REGISTRY = {
  // Fictional / Mythological
  'dragon': (p, g, b) => typeof buildDragonModel === 'function' && buildDragonModel(p, g, b),
  'monster': (p, g, b) => typeof buildDragonModel === 'function' && buildDragonModel(p, g, b),
  'creature': (p, g, b) => typeof buildDragonModel === 'function' && buildDragonModel(p, g, b),
  'chimera': (p, g, b) => typeof buildChimeraModel === 'function' && buildChimeraModel(p, g, b),
  'centaur': (p, g, b) => typeof buildCentaurModel === 'function' && buildCentaurModel(p, g, b),
  'horse': (p, g, b) => typeof buildCentaurModel === 'function' && buildCentaurModel(p, g, b),
  'lamia': (p, g, b) => typeof buildSnakeHumanModel === 'function' && buildSnakeHumanModel(p, g, b),
  'snake': (p, g, b) => typeof buildSnakeHumanModel === 'function' && buildSnakeHumanModel(p, g, b),
  'naga': (p, g, b) => typeof buildSnakeHumanModel === 'function' && buildSnakeHumanModel(p, g, b),

  // Quadruped Animals
  'dog': (p, g, b) => typeof buildQuadrupedModel === 'function' && buildQuadrupedModel(p, g, b),
  'wolf': (p, g, b) => typeof buildQuadrupedModel === 'function' && buildQuadrupedModel(p, g, b),
  'cat': (p, g, b) => typeof buildQuadrupedModel === 'function' && buildQuadrupedModel(p, g, b),
  'bear': (p, g, b) => typeof buildQuadrupedModel === 'function' && buildQuadrupedModel(p, g, b),
  'animal': (p, g, b) => typeof buildQuadrupedModel === 'function' && buildQuadrupedModel(p, g, b),
  'quadruped': (p, g, b) => typeof buildQuadrupedModel === 'function' && buildQuadrupedModel(p, g, b)
};

// --- MASTER ROUTER FUNCTION WITH AI TEXTURE GENERATION ---
async function handleGenerate() {
  const promptInput = document.getElementById('prompt-input');
  const statusEl = document.getElementById('status-text');
  if (!promptInput || !modelGroup) return;

  const promptText = promptInput.value.toLowerCase().trim();
  if (!promptText) {
    alert("Please enter a prompt first!");
    return;
  }

  if (statusEl) {
    statusEl.innerText = `Status: Generating 3D mesh for "${promptText}"...`;
  }

  // 1. Clear previous scene & free GPU memory
  disposeGroup(modelGroup);

  // 2. Find matching builder function from registry map
  let builderFunction = null;
  for (const keyword in MODEL_REGISTRY) {
    if (promptText.includes(keyword)) {
      builderFunction = MODEL_REGISTRY[keyword];
      break;
    }
  }

  // 3. Render client-side mesh
  if (builderFunction) {
    builderFunction(promptText, modelGroup, activePolyBudget);
  } else {
    if (typeof buildHumanModel === 'function') {
      buildHumanModel(promptText, modelGroup, activePolyBudget);
    } else {
      console.error("buildHumanModel function is missing!");
    }
  }

  // 4. Attach optional overlays
  if (typeof attachClothing === 'function') attachClothing(promptText, modelGroup, activePolyBudget);
  if (typeof attachArmor === 'function') attachArmor(promptText, modelGroup, activePolyBudget);
  if (typeof attachToys === 'function') attachToys(promptText, modelGroup, activePolyBudget);

  // 5. Trigger AI Texture Pipeline (Pollinations.ai)
  if (typeof generateAITexture === 'function') {
    if (statusEl) statusEl.innerText = `Status: Requesting AI Texture for "${promptText}"...`;
    try {
      const aiTexture = await generateAITexture(promptText);
      if (aiTexture) {
        modelGroup.traverse((child) => {
          if (child.isMesh) {
            child.material.map = aiTexture;
            child.material.needsUpdate = true;
          }
        });
        if (statusEl) statusEl.innerText = `Status: Model & AI Texture loaded for "${promptText}" (${activePolyBudget} Polys)`;
      }
    } catch (err) {
      console.warn("AI Texture generation failed, keeping default mesh material:", err);
      if (statusEl) statusEl.innerText = `Status: Generated mesh for "${promptText}" (${activePolyBudget} Polys)`;
    }
  } else {
    if (statusEl) statusEl.innerText = `Status: Generated mesh for "${promptText}" (${activePolyBudget} Polys)`;
  }
      }
          
