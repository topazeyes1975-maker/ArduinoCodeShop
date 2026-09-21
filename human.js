// ==========================================
// FILE: human.js
// Complete Human Figure Generator (Female, Male, Baby - All with necks, jointed arms, and aligned torsos)
// ==========================================

function buildHumanModel(promptText = "", parentGroup = null, targetBudget = 6000) {
  const targetGroup = parentGroup || (typeof modelGroup !== 'undefined' ? modelGroup : null);
  if (!targetGroup) return;

  const humanGroup = new THREE.Group();

  const text = promptText.toLowerCase();
  const isFemale = text.includes('female') || text.includes('woman') || text.includes('girl') || text.includes('doll');
  const isBaby = text.includes('baby') || text.includes('child') || text.includes('infant');
  const isMale = !isFemale && !isBaby && (text.includes('male') || text.includes('man') || text.includes('guy') || text.includes('manikin') || text === '');

  // Variant Scaling & Proportions
  let headSize = isBaby ? 1.15 : 1.0;
  let shoulderX = isFemale ? 0.12 : (isMale ? 0.125 : (isBaby ? 0.11 : 0.075));
  let hipX = isFemale ? 0.085 : (isMale ? 0.082 : 0.07);

  // Vertical alignment offset based on character type
  const baseShift = isBaby ? -0.55 : (isMale ? -0.85 : -0.90);

  // Calculate LOD Segments with budget scaling
  const budgetScale = Math.sqrt(Math.max(1000, targetBudget) / 6000);
  const radSegs = Math.max(8, Math.round(16 * budgetScale));
  const hSegs = Math.max(4, Math.round(10 * budgetScale));

  // Materials
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xfce2ce, roughness: 0.45, metalness: 0.05 });
  const jointMat = new THREE.MeshStandardMaterial({ color: 0xebd2be, roughness: 0.4 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.6 });
  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  const eyePupilMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1 });
  const browMat = new THREE.MeshStandardMaterial({ color: 0x3a2518, roughness: 0.8 });
  const lipMat = new THREE.MeshStandardMaterial({ color: 0xd96b75, roughness: 0.3 });

  // Safe wrapper to apply atlas quadrant mapping if bodyParts.js is loaded
  function applyQuadrantUVs(geom, uMin, vMin, uMax, vMax) {
    if (typeof remapUVs === 'function') {
      remapUVs(geom, uMin, vMin, uMax, vMax);
    }
  }

  function addSegment(geom, mat, pos, rot = [0, 0, 0], name = "", uMin = 0.0, vMin = 0.5, uMax = 0.5, vMax = 1.0) {
    applyQuadrantUVs(geom, uMin, vMin, uMax, vMax);
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(pos[0], pos[1] + baseShift, pos[2]);
    mesh.rotation.set(...rot);
    if (name) mesh.name = name;
    humanGroup.add(mesh);
    return mesh;
  }

  // 1. Head Position (Mapped to Top-Right Quadrant: 0.5-1.0, 0.5-1.0)
  const headY = isBaby ? 0.98 : (isFemale ? 1.55 : 1.37);
  const headGeom = new THREE.SphereGeometry(0.14 * headSize, radSegs, radSegs);
  headGeom.scale(0.85, 1.1, 0.9);

  const pos = headGeom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    if (z > 0.05 && y > -0.02 && y < 0.06) {
      const distL = Math.hypot(x - (-0.045 * headSize), y - (0.015 * headSize));
      const distR = Math.hypot(x - (0.045 * headSize), y - (0.015 * headSize));
      const minDist = Math.min(distL, distR);
      const socketRadius = 0.04 * headSize;
      if (minDist < socketRadius) {
        pos.setZ(i, z - (1 - minDist / socketRadius) * 0.025 * headSize);
      }
    }
  }
  headGeom.computeVertexNormals();
  addSegment(headGeom, skinMat, [0, headY, 0], [0, 0, 0], "Human_Head", 0.5, 0.5, 1.0, 1.0);

  // Facial Features (Top-Right Quadrant)
  const eyeRadius = 0.02 * headSize;
  const faceYOffset = headY - (isBaby ? 0.98 : (isFemale ? 1.55 : 1.37));

  [-1, 1].forEach(side => {
    const xBase = side * 0.045 * headSize;
    const yBase = (isBaby ? 0.995 : (isFemale ? 1.565 : 1.385)) + faceYOffset;
    const zBase = 0.114 * headSize;
    const rotY = side * 0.12;

    const eyeWhiteGeom = new THREE.SphereGeometry(eyeRadius, 16, 16);
    eyeWhiteGeom.scale(1.2, 0.65, 0.3);
    addSegment(eyeWhiteGeom, eyeWhiteMat, [xBase, yBase, zBase], [0, rotY, 0], "", 0.5, 0.5, 1.0, 1.0);

    const pupilGeom = new THREE.SphereGeometry(eyeRadius * 0.5, 12, 12);
    pupilGeom.scale(0.8, 0.95, 0.2);
    addSegment(pupilGeom, eyePupilMat, [xBase, yBase, zBase + 0.005], [0, rotY, 0], "", 0.5, 0.5, 1.0, 1.0);

    const eyelidGeom = new THREE.TorusGeometry(0.026 * headSize, 0.003 * headSize, 8, radSegs, Math.PI * 0.7);
    addSegment(eyelidGeom, skinMat, [xBase, yBase - 0.01 * headSize, zBase + 0.006], [0, rotY, 0.5], "", 0.5, 0.5, 1.0, 1.0);

    const botEyelidGeom = new THREE.TorusGeometry(0.026 * headSize, 0.003 * headSize, 8, radSegs, Math.PI * 0.7);
    addSegment(botEyelidGeom, skinMat, [xBase, yBase + 0.013 * headSize, zBase + 0.006], [0, rotY, -2.7], "", 0.5, 0.5, 1.0, 1.0);

    const browGeom = new THREE.RingGeometry(0.018 * headSize, 0.022 * headSize, 8, 1, 0, Math.PI);
    addSegment(browGeom, browMat, [xBase, yBase + 0.012 * headSize, zBase + 0.003], [0.15, rotY, side * 0.25], "", 0.5, 0.5, 1.0, 1.0);

    const earGeom = new THREE.SphereGeometry(0.02 * headSize, radSegs, radSegs);
    earGeom.scale(0.35, 1.2, 0.85);
    addSegment(earGeom, skinMat, [side * 0.118 * headSize, (isBaby ? 0.97 : (isFemale ? 1.54 : 1.36)) + faceYOffset, -0.005 * headSize], [0.1, 0, 0], "", 0.5, 0.5, 1.0, 1.0);
  });
  
  addSegment(new THREE.ConeGeometry(0.012 * headSize, 0.03 * headSize, radSegs), skinMat, [0, (isBaby ? 0.96 : (isFemale ? 1.53 : 1.35)) + faceYOffset, 0.122 * headSize], [0.3, 0, 0], "", 0.5, 0.5, 1.0, 1.0);
  addSegment(new THREE.TorusGeometry(0.015 * headSize, 0.003 * headSize, 8, radSegs, Math.PI), lipMat, [0, (isBaby ? 0.922 : (isFemale ? 1.492 : 1.312)) + faceYOffset, 0.116 * headSize], [Math.PI * 0.55, 0, 0], "", 0.5, 0.5, 1.0, 1.0);
  addSegment(new THREE.TorusGeometry(0.014 * headSize, 0.0032 * headSize, 8, radSegs, Math.PI), lipMat, [0, (isBaby ? 0.914 : (isFemale ? 1.484 : 1.304)) + faceYOffset, 0.116 * headSize], [Math.PI * 0.45, 0, 0], "", 0.5, 0.5, 1.0, 1.0);

  if (isFemale || isBaby) {
    const topHairGeom = new THREE.SphereGeometry(0.144 * headSize, radSegs, radSegs, 0, Math.PI * 2, 0, Math.PI * 0.45);
    topHairGeom.scale(0.86, 1.02, 0.91);
    addSegment(topHairGeom, hairMat, [0, (isBaby ? 1.00 : 1.57) + faceYOffset, -0.005], [0,0,0], "", 0.5, 0.5, 1.0, 1.0);

    if (isFemale) {
      const backHairGeom = new THREE.CylinderGeometry(0.125 * headSize, 0.145 * headSize, 0.20, radSegs, hSegs, true, Math.PI * 0.25, Math.PI * 1.5);
      addSegment(backHairGeom, hairMat, [0, 1.53 + faceYOffset, -0.01], [0.05, 0, 0], "", 0.5, 0.5, 1.0, 1.0);

      addSegment(new THREE.CylinderGeometry(0.035 * headSize, 0.01 * headSize, 0.20, radSegs), hairMat, [-0.095 * headSize, 1.50 + faceYOffset, 0.04 * headSize], [0.1, 0, -0.18], "", 0.5, 0.5, 1.0, 1.0);
      addSegment(new THREE.CylinderGeometry(0.035 * headSize, 0.01 * headSize, 0.20, radSegs), hairMat, [0.095 * headSize, 1.50 + faceYOffset, 0.04 * headSize], [0.1, 0, 0.18], "", 0.5, 0.5, 1.0, 1.0);
    }
  }

  // 2. Neck Cylinder (Top-Left Quadrant: 0.0-0.5, 0.5-1.0)
  const neckY = isBaby ? 0.87 : (isFemale ? 1.42 : 1.20);
  const neckHeight = isBaby ? 0.24 : 0.14;
  addSegment(new THREE.CylinderGeometry(isBaby ? 0.032 : 0.035, isBaby ? 0.035 : 0.04, neckHeight, radSegs), skinMat, [0, neckY, 0], [0, 0, 0], "Human_Neck", 0.0, 0.5, 0.5, 1.0);

  // 3. Torso Assembly (Top-Left Quadrant: 0.0-0.5, 0.5-1.0)
  if (isBaby) {
    addSegment(new THREE.SphereGeometry(0.095, radSegs, radSegs).scale(1.1, 0.9, 1.15), skinMat, [0, 0.70, 0], [0,0,0], "Baby_UpperChest", 0.0, 0.5, 0.5, 1.0);
    addSegment(new THREE.SphereGeometry(0.11, radSegs, radSegs).scale(1.2, 1.1, 1.25), skinMat, [0, 0.55, 0.01], [0,0,0], "Baby_RoundedBelly", 0.0, 0.5, 0.5, 1.0);
    addSegment(new THREE.SphereGeometry(0.085, radSegs, radSegs).scale(1.1, 0.8, 1.0), skinMat, [0, 0.44, 0], [0,0,0], "Baby_Pelvis", 0.0, 0.5, 0.5, 1.0);
  } else if (isMale) {
    const chestGeom = new THREE.CylinderGeometry(0.12, 0.098, 0.14, radSegs, hSegs);
    chestGeom.scale(1.15, 1.0, 0.9);
    addSegment(chestGeom, skinMat, [0, 1.12, 0], [0, 0, 0], "Male_Chest_Base", 0.0, 0.5, 0.5, 1.0);

    const pecGeom = new THREE.SphereGeometry(0.052, radSegs, radSegs);
    pecGeom.scale(1.3, 0.75, 1.15);
    addSegment(pecGeom, skinMat, [-0.052, 1.14, 0.062], [0.25, -0.15, 0.05], "Male_Pec_L", 0.0, 0.5, 0.5, 1.0);
    addSegment(pecGeom, skinMat, [0.052, 1.14, 0.062], [0.25, 0.15, -0.05], "Male_Pec_R", 0.0, 0.5, 0.5, 1.0);

    for (let row = 0; row < 3; row++) {
      [-1, 1].forEach(side => {
        const abGeom = new THREE.SphereGeometry(0.022, 12, 12);
        abGeom.scale(1.1, 0.9, 1.4);
        addSegment(abGeom, skinMat, [side * 0.028, 1.02 - (row * 0.032), 0.068], [0.1, side * 0.05, 0], "", 0.0, 0.5, 0.5, 1.0);
      });
    }

    addSegment(new THREE.CylinderGeometry(0.095, 0.09, 0.16, radSegs, hSegs).scale(1.05, 1.0, 0.85), skinMat, [0, 1.01, 0], [0,0,0], "", 0.0, 0.5, 0.5, 1.0);
    addSegment(new THREE.CylinderGeometry(0.09, hipX * 1.15, 0.15, radSegs, hSegs).scale(1.15, 1.0, 0.9), skinMat, [0, 0.86, 0], [0,0,0], "", 0.0, 0.5, 0.5, 1.0);
  } else {
    addSegment(new THREE.CylinderGeometry(shoulderX * 0.85, 0.082, 0.20, radSegs, hSegs).scale(1.05, 1.0, 0.82), skinMat, [0, 1.27, 0], [0,0,0], "Human_Chest", 0.0, 0.5, 0.5, 1.0);
    addSegment(new THREE.CylinderGeometry(0.08, 0.09, 0.18, radSegs, hSegs).scale(0.95, 1.0, 0.78), skinMat, [0, 1.08, 0], [0,0,0], "Human_Waist", 0.0, 0.5, 0.5, 1.0);
    addSegment(new THREE.CylinderGeometry(0.09, hipX * 1.15, 0.16, radSegs, hSegs).scale(1.1, 1.0, 0.85), skinMat, [0, 0.92, 0], [0,0,0], "Human_Pelvis", 0.0, 0.5, 0.5, 1.0);

    const bustGeom = new THREE.SphereGeometry(0.052, radSegs, radSegs);
    bustGeom.scale(1.0, 0.88, 1.05);
    addSegment(bustGeom, skinMat, [-0.048, 1.28, 0.065], [0.15, -0.08, 0], "Human_Bust_L", 0.0, 0.5, 0.5, 1.0);
    addSegment(bustGeom, skinMat, [0.048, 1.28, 0.065], [0.15, 0.08, 0], "Human_Bust_R", 0.0, 0.5, 0.5, 1.0);
  }

  // Glutes (Top-Left Quadrant)
  const gluteGeom = new THREE.SphereGeometry(isBaby ? 0.045 : 0.054, radSegs, radSegs);
  gluteGeom.scale(isBaby ? 0.95 : 0.95, 0.9, 0.85);
  const gluteX = isBaby ? 0.015 : 0.042;
  const gluteZ = isBaby ? -0.045 : -0.055;
  addSegment(gluteGeom, skinMat, [-gluteX, isBaby ? 0.42 : (isMale ? 0.85 : 0.89), gluteZ], [-0.1, 0.05, 0], "", 0.0, 0.5, 0.5, 1.0);
  addSegment(gluteGeom, skinMat, [gluteX, isBaby ? 0.42 : (isMale ? 0.85 : 0.89), gluteZ], [-0.1, -0.05, 0], "", 0.0, 0.5, 0.5, 1.0);

  // 4. Arms & Hands (Bottom-Left Quadrant: 0.0-0.5, 0.0-0.5)
  const armAngle = 0.75;
  [-1, 1].forEach(side => {
    const xJoint = side * shoulderX;
    const yJoint = isBaby ? 0.71 : (isMale ? 1.12 : 1.32);

    addSegment(new THREE.SphereGeometry(isBaby ? 0.038 : 0.046, radSegs, radSegs).scale(0.9, 1.1, 0.9), skinMat, [xJoint, yJoint + 0.01, 0], [0, 0, side * -0.15], "", 0.0, 0.0, 0.5, 0.5);
    addSegment(new THREE.SphereGeometry(isBaby ? 0.028 : 0.034, radSegs, radSegs), jointMat, [xJoint, yJoint, 0], [0,0,0], "", 0.0, 0.0, 0.5, 0.5);

    const armLen = isBaby ? 0.14 : 0.25;
    const dxUpper = Math.sin(armAngle) * (armLen / 2) * side;
    const dyUpper = Math.cos(armAngle) * (armLen / 2);
    addSegment(new THREE.CylinderGeometry(isBaby ? 0.032 : 0.032, isBaby ? 0.026 : 0.026, armLen, radSegs, hSegs), skinMat, [xJoint + dxUpper, yJoint - dyUpper, 0], [0, 0, side * armAngle], "", 0.0, 0.0, 0.5, 0.5);

    const elbowX = xJoint + Math.sin(armAngle) * armLen * side;
    const elbowY = yJoint - Math.cos(armAngle) * armLen;
    addSegment(new THREE.SphereGeometry(isBaby ? 0.022 : 0.026, radSegs, radSegs), jointMat, [elbowX, elbowY, 0], [0,0,0], "", 0.0, 0.0, 0.5, 0.5);

    const forearmLen = isBaby ? 0.13 : 0.24;
    const dxLower = Math.sin(armAngle) * (forearmLen / 2) * side;
    const dyLower = Math.cos(armAngle) * (forearmLen / 2);
    addSegment(new THREE.CylinderGeometry(isBaby ? 0.026 : 0.026, isBaby ? 0.02 : 0.02, forearmLen, radSegs, hSegs), skinMat, [elbowX + dxLower, elbowY - dyLower, 0], [0, 0, side * armAngle], "", 0.0, 0.0, 0.5, 0.5);

    const handX = elbowX + Math.sin(armAngle) * forearmLen * side;
    const handY = elbowY - Math.cos(armAngle) * forearmLen;
    addSegment(new THREE.BoxGeometry(0.022, 0.045, 0.014), skinMat, [handX, handY, 0], [0, 0, side * armAngle], "", 0.0, 0.0, 0.5, 0.5);
  });

  // 5. Legs & Feet (Bottom-Left Quadrant: 0.0-0.5, 0.0-0.5)
  [-1, 1].forEach(side => {
    const x = side * hipX;
    const hipJointY = isBaby ? 0.38 : (isMale ? 0.79 : 0.83);
    const kneeJointY = isBaby ? 0.23 : (isMale ? 0.38 : 0.42);
    const footY = isBaby ? 0.08 : (isMale ? 0.01 : 0.01);

    addSegment(new THREE.SphereGeometry(isBaby ? 0.035 : 0.042, radSegs, radSegs), jointMat, [x, hipJointY, 0], [0,0,0], "", 0.0, 0.0, 0.5, 0.5);
    const thighLen = isBaby ? 0.14 : 0.38;
    addSegment(new THREE.CylinderGeometry(isBaby ? 0.048 : 0.05, isBaby ? 0.042 : 0.034, thighLen, radSegs, hSegs), skinMat, [x, hipJointY - (thighLen / 2), 0], [0,0,0], "", 0.0, 0.0, 0.5, 0.5);

    addSegment(new THREE.SphereGeometry(isBaby ? 0.030 : 0.033, radSegs, radSegs), jointMat, [x, kneeJointY, 0], [0,0,0], "", 0.0, 0.0, 0.5, 0.5);
    const shinLen = isBaby ? 0.13 : 0.38;
    addSegment(new THREE.CylinderGeometry(isBaby ? 0.042 : 0.033, isBaby ? 0.035 : 0.024, shinLen, radSegs, hSegs), skinMat, [x, kneeJointY - (shinLen / 2), 0], [0,0,0], "", 0.0, 0.0, 0.5, 0.5);

    const footGeom = new THREE.BoxGeometry(isBaby ? 0.035 : 0.032, isBaby ? 0.022 : 0.024, isBaby ? 0.065 : 0.085);
    footGeom.translate(0, -0.005, 0.022);
    addSegment(footGeom, skinMat, [x, footY, 0], [0,0,0], "", 0.0, 0.0, 0.5, 0.5);
  });

  targetGroup.add(humanGroup);
}

// Make explicit global assignment on window for browser-level accessibility
window.buildHumanModel = buildHumanModel;

// ==========================================
// CREATURE FACTORY & EXCLUSIVE LOCK ROUTER
// ==========================================

// 1. Registry mapping keywords directly to isolated builder functions
const CREATURE_REGISTRY = {
  dragon: window.buildDragonModel,
  centaur: window.buildCentaurModel,
  lamia: window.buildSnakeHumanModel,
  snake: window.buildSnakeHumanModel,
  chimera: window.buildChimeraModel,
  human: window.buildHumanModel // standard human fallback
};

/**
 * Main entrance function to process prompts with strict category locking.
 */
function generateCreature(promptText, targetGroup, targetBudget = 6000) {
  if (!targetGroup) return;

  // STEP 1: Traverse and dispose all sub-geometries safely to prevent memory leaks
  while (targetGroup.children.length > 0) {
    const child = targetGroup.children[0];
    child.traverse((node) => {
      if (node.isMesh && node.geometry) {
        node.geometry.dispose();
      }
    });
    targetGroup.remove(child);
  }

  const cleanPrompt = promptText ? promptText.toLowerCase().trim() : '';

  // STEP 2: Find the matching category keyword
  let selectedBuilder = null;
  let matchedCategory = null;

  for (const [categoryKey, builderFunc] of Object.entries(CREATURE_REGISTRY)) {
    if (cleanPrompt.includes(categoryKey)) {
      selectedBuilder = builderFunc;
      matchedCategory = categoryKey;
      break; // Lock into the FIRST matching category
    }
  }

  // STEP 3: Fallback strictly to window.buildHumanModel or local buildHumanModel
  if (!selectedBuilder) {
    selectedBuilder = window.buildHumanModel || buildHumanModel;
    matchedCategory = 'human (default)';
  }

  // STEP 4: Execute ONLY the locked category function inside its isolated container
  console.log(`[Creature Router] Locked into category: "${matchedCategory}"`);
  
  // Create an isolated sub-group for this specific model call
  const categoryContainer = new THREE.Group();
  categoryContainer.name = `CreatureGroup_${matchedCategory}`;

  // Execute the builder on the isolated sub-group
  selectedBuilder(cleanPrompt, categoryContainer, targetBudget);

  // Attach the cleanly generated creature back to the target canvas scene
  targetGroup.add(categoryContainer);
                                    }
                  
