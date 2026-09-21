// ==========================================
// FILE: animal.js
// Quadruped & Base Animal Generator
// ==========================================

function buildQuadrupedModel(promptText = "", parentGroup = null, targetBudget = 6000) {
  // Use passed parentGroup or fall back to global modelGroup
  const targetGroup = parentGroup || (typeof modelGroup !== 'undefined' ? modelGroup : null);
  if (!targetGroup) return;

  const animalGroup = new THREE.Group();
  animalGroup.name = "Quadruped_Animal";

  // Dynamic budget scaling
  const bodyBudget = Math.floor(targetBudget * 0.40);
  const bodyRadSegs = Math.max(8, Math.min(32, Math.floor(Math.sqrt(bodyBudget / 4))));
  const bodyHSegs = Math.max(4, Math.min(24, Math.floor(bodyBudget / (bodyRadSegs * 2))));
  const legSegs = Math.max(6, Math.min(16, Math.floor(bodyRadSegs * 0.75))));

  const animalMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8b5a2b, 
    roughness: 0.6 
  });

  // Safe wrapper for atlas quadrant UV mapping
  function applyQuadrantUVs(geom, uMin, vMin, uMax, vMax) {
    if (typeof remapUVs === 'function') {
      remapUVs(geom, uMin, vMin, uMax, vMax);
    }
  }

  // 1. Main Body Barrel (Mapped to Top-Left Quadrant: 0.0, 0.5, 0.5, 1.0)
  const bodyGeo = new THREE.CylinderGeometry(0.28, 0.30, 1.1, bodyRadSegs, bodyHSegs);
  bodyGeo.rotateX(Math.PI / 2);
  applyQuadrantUVs(bodyGeo, 0.0, 0.5, 0.5, 1.0);
  
  const bodyMesh = new THREE.Mesh(bodyGeo, animalMaterial);
  bodyMesh.position.set(0, 0.5, 0);
  animalGroup.add(bodyMesh);

  // 2. Neck & Head Assembly (Mapped to Top-Right Quadrant: 0.5, 0.5, 1.0, 1.0)
  const headGroup = new THREE.Group();
  headGroup.name = "Animal_HeadGroup";

  const headGeo = new THREE.BoxGeometry(0.25, 0.22, 0.28);
  applyQuadrantUVs(headGeo, 0.5, 0.5, 1.0, 1.0);
  const headMesh = new THREE.Mesh(headGeo, animalMaterial);
  headGroup.add(headMesh);

  // Snout
  const snoutGeo = new THREE.BoxGeometry(0.18, 0.12, 0.22);
  applyQuadrantUVs(snoutGeo, 0.5, 0.5, 1.0, 1.0);
  const snoutMesh = new THREE.Mesh(snoutGeo, animalMaterial);
  snoutMesh.position.set(0, -0.03, 0.22);
  headGroup.add(snoutMesh);

  headGroup.position.set(0, 0.8, 0.55);
  animalGroup.add(headGroup);

  // 3. Four Legs (Mapped to Bottom-Left Quadrant: 0.0, 0.0, 0.5, 0.5)
  const legGeo = new THREE.CylinderGeometry(0.08, 0.06, 0.55, legSegs);
  applyQuadrantUVs(legGeo, 0.0, 0.0, 0.5, 0.5);

  const legPositions = [
    [-0.2, 0.275,  0.35], // Front Left
    [ 0.2, 0.275,  0.35], // Front Right
    [-0.2, 0.275, -0.35], // Back Left
    [ 0.2, 0.275, -0.35]  // Back Right
  ];

  legPositions.forEach((pos, idx) => {
    const legMesh = new THREE.Mesh(legGeo, animalMaterial);
    legMesh.name = `Animal_Leg_${idx + 1}`;
    legMesh.position.set(pos[0], pos[1], pos[2]);
    animalGroup.add(legMesh);
  });

  // 4. Tail (Mapped to Bottom-Left Quadrant: 0.0, 0.0, 0.5, 0.5)
  const tailGeo = new THREE.CylinderGeometry(0.05, 0.02, 0.5, legSegs);
  tailGeo.translate(0, -0.25, 0); // Pivot at root base
  applyQuadrantUVs(tailGeo, 0.0, 0.0, 0.5, 0.5);
  
  const tailMesh = new THREE.Mesh(tailGeo, animalMaterial);
  tailMesh.name = "Animal_Tail";
  tailMesh.position.set(0, 0.52, -0.52);
  tailMesh.rotation.x = -Math.PI / 4; // Angled outward away from body
  animalGroup.add(tailMesh);

  targetGroup.add(animalGroup);
}

// Global window assignments
window.buildQuadrupedModel = buildQuadrupedModel;
window.buildAnimalModel = buildQuadrupedModel;

// Register in CREATURE_REGISTRY if available globally
if (typeof CREATURE_REGISTRY !== 'undefined') {
  CREATURE_REGISTRY.quadruped = window.buildQuadrupedModel;
  CREATURE_REGISTRY.animal = window.buildQuadrupedModel;
  CREATURE_REGISTRY.dog = window.buildQuadrupedModel;
  CREATURE_REGISTRY.wolf = window.buildQuadrupedModel;
  CREATURE_REGISTRY.cat = window.buildQuadrupedModel;
  CREATURE_REGISTRY.horse = window.buildQuadrupedModel;
  CREATURE_REGISTRY.bear = window.buildQuadrupedModel;
  }

