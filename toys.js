// ==========================================
// FILE: toys.js
// Prop, Toy, & Handheld Gear Attachment System
// ==========================================

function attachToys(promptText = "", parentGroup = null, targetBudget = 6000) {
  if (!parentGroup || typeof promptText !== 'string') return;

  const text = promptText.toLowerCase();

  // Character variant detection matching human.js
  const isBaby = text.includes('baby') || text.includes('child') || text.includes('infant');
  const isFemale = text.includes('female') || text.includes('woman') || text.includes('girl') || text.includes('doll');
  const isMale = !isFemale && !isBaby && (text.includes('male') || text.includes('man') || text.includes('guy') || text.includes('manikin') || text === '');

  // Vertical alignment offset matching human.js baseShift
  const baseShift = isBaby ? -0.55 : (isMale ? -0.85 : -0.90);

  const toyMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xf1c40f, // Warm yellow default
    roughness: 0.3 
  });

  // Safe wrapper for atlas quadrant UV mapping
  function applyQuadrantUVs(geom, uMin, vMin, uMax, vMax) {
    if (typeof remapUVs === 'function') {
      remapUVs(geom, uMin, vMin, uMax, vMax);
    }
  }

  // Check prop & toy keywords
  if (text.includes('toy') || text.includes('sword') || text.includes('wand') || text.includes('prop') || text.includes('ball')) {
    
    // Dynamic LOD scaling based on budget
    const budgetScale = Math.sqrt(Math.max(1000, targetBudget) / 6000);
    const radSegs = Math.max(6, Math.round(12 * budgetScale));

    // Calculate hand position coordinates matching human.js arm geometry
    const shoulderX = isFemale ? 0.12 : (isMale ? 0.125 : (isBaby ? 0.11 : 0.075));
    const armY = isBaby ? 0.71 : (isMale ? 1.12 : 1.32);
    const armAngle = 0.75;
    const totalArmLength = isBaby ? (0.14 + 0.13) : (0.25 + 0.24);

    // Right hand contact coordinates
    const handX = shoulderX + (Math.sin(armAngle) * totalArmLength);
    const handY = armY - (Math.cos(armAngle) * totalArmLength);
    const handZ = 0.02;

    const swordGroup = new THREE.Group();
    swordGroup.name = "Toy_Sword";

    // 1. Handle
    const handleLen = isBaby ? 0.15 : 0.25;
    const handleGeo = new THREE.CylinderGeometry(0.012, 0.014, handleLen, radSegs);
    applyQuadrantUVs(handleGeo, 0.0, 0.0, 0.5, 0.5);
    const handle = new THREE.Mesh(handleGeo, toyMaterial);
    swordGroup.add(handle);

    // 2. Blade
    const bladeLen = isBaby ? 0.28 : 0.45;
    const bladeGeo = new THREE.BoxGeometry(0.035, bladeLen, 0.008);
    applyQuadrantUVs(bladeGeo, 0.0, 0.0, 0.5, 0.5);
    const blade = new THREE.Mesh(bladeGeo, toyMaterial);
    
    // Position blade extending out from the handle
    blade.position.y = (handleLen / 2) + (bladeLen / 2);
    swordGroup.add(blade);

    // Position sword directly into right hand coordinates with ground offset applied
    swordGroup.position.set(handX, handY + baseShift, handZ);
    swordGroup.rotation.x = Math.PI / 4; // Forward grip angle
    swordGroup.rotation.z = -0.2;

    parentGroup.add(swordGroup);
  }
}

// Global window registration
window.attachToys = attachToys;

