// ==========================================
// FILE: armor.js
// Plate Armor & Accessories Attachment System
// ==========================================

// Shared/cached material to prevent duplicate allocations
const DEFAULT_METAL_MATERIAL = new THREE.MeshStandardMaterial({ 
  color: 0x8899a6, 
  metalness: 0.8, 
  roughness: 0.2 
});

function attachArmor(promptText = "", parentGroup = null, targetBudget = 6000) {
  if (!parentGroup || typeof promptText !== 'string') return;

  const text = promptText.toLowerCase();

  // Variant detection matching human.js base shifts and proportions
  const isBaby = text.includes('baby') || text.includes('child') || text.includes('infant');
  const isFemale = text.includes('female') || text.includes('woman') || text.includes('girl') || text.includes('doll');
  const isMale = !isFemale && !isBaby && (text.includes('male') || text.includes('man') || text.includes('guy') || text.includes('manikin') || text === '');

  // Vertical alignment offset matching human.js baseShift
  const baseShift = isBaby ? -0.55 : (isMale ? -0.85 : -0.90);

  // Safe wrapper for UV atlas remapping
  function applyQuadrantUVs(geom, uMin, vMin, uMax, vMax) {
    if (typeof remapUVs === 'function') {
      remapUVs(geom, uMin, vMin, uMax, vMax);
    }
  }

  // Check armor keywords
  if (text.includes('armor') || text.includes('plate') || text.includes('shield') || text.includes('knight') || text.includes('cuirass')) {
    
    // Budget-based LOD adjustments
    const budgetScale = Math.sqrt(Math.max(1000, targetBudget) / 6000);
    const radSegs = Math.max(8, Math.round(12 * budgetScale));

    // 1. Chestplate / Cuirass
    const chestY = isBaby ? 0.65 : (isMale ? 1.12 : 1.18);
    const chestRadiusTop = isBaby ? 0.11 : (isMale ? 0.135 : 0.125);
    const chestRadiusBot = isBaby ? 0.095 : (isMale ? 0.105 : 0.095);
    const chestHeight = isBaby ? 0.25 : (isMale ? 0.38 : 0.36);

    const chestPlateGeo = new THREE.CylinderGeometry(chestRadiusTop, chestRadiusBot, chestHeight, radSegs);
    
    // Map armor to Top-Left Quadrant (0.0, 0.5, 0.5, 1.0)
    applyQuadrantUVs(chestPlateGeo, 0.0, 0.5, 0.5, 1.0);

    const chestPlate = new THREE.Mesh(chestPlateGeo, DEFAULT_METAL_MATERIAL);
    chestPlate.name = "Armor_Chestplate";
    chestPlate.position.set(0, chestY + baseShift, 0);
    chestPlate.scale.set(1.08, 1.0, 1.08); // Slightly layered over torso mesh
    parentGroup.add(chestPlate);

    // 2. Shoulder Guards (Pauldrons)
    const pauldronY = isBaby ? 0.72 : (isMale ? 1.15 : 1.30);
    const shoulderX = isBaby ? 0.11 : (isFemale ? 0.12 : 0.135);
    const pauldronRadius = isBaby ? 0.045 : (isMale ? 0.075 : 0.065);

    const pauldronGeo = new THREE.SphereGeometry(pauldronRadius, radSegs, radSegs, 0, Math.PI);
    applyQuadrantUVs(pauldronGeo, 0.0, 0.5, 0.5, 1.0);

    // Left Pauldron
    const leftPauldron = new THREE.Mesh(pauldronGeo, DEFAULT_METAL_MATERIAL);
    leftPauldron.name = "Armor_Pauldron_L";
    leftPauldron.position.set(-shoulderX - 0.02, pauldronY + baseShift, 0);
    leftPauldron.rotation.z = Math.PI / 4; 
    parentGroup.add(leftPauldron);

    // Right Pauldron
    const rightPauldron = new THREE.Mesh(pauldronGeo, DEFAULT_METAL_MATERIAL);
    rightPauldron.name = "Armor_Pauldron_R";
    rightPauldron.position.set(shoulderX + 0.02, pauldronY + baseShift, 0);
    rightPauldron.rotation.z = -Math.PI / 4; 
    parentGroup.add(rightPauldron);
  }
}

// Global window registration
window.attachArmor = attachArmor;

