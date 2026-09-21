// ==========================================
// FILE: clothes.js
// Clothing & Overlay Attachment System
// ==========================================

function attachClothing(promptText = "", parentGroup = null, targetBudget = 6000) {
  if (!parentGroup) return;

  const text = (promptText || '').toLowerCase();

  // Detect character variant for proper vertical shift & scale alignment
  const isBaby = text.includes('baby') || text.includes('child') || text.includes('infant');
  const isFemale = text.includes('female') || text.includes('woman') || text.includes('girl') || text.includes('doll');
  const isMale = !isFemale && !isBaby && (text.includes('male') || text.includes('man') || text.includes('guy') || text.includes('manikin') || text === '');

  // Vertical alignment offset matching human.js baseShift
  const baseShift = isBaby ? -0.55 : (isMale ? -0.85 : -0.90);

  const clothesMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x9b59b6, // Elegant purple default
    roughness: 0.6,
    side: THREE.DoubleSide
  });

  // Safe wrapper to apply atlas quadrant mapping if bodyParts.js is loaded
  function applyQuadrantUVs(geom, uMin, vMin, uMax, vMax) {
    if (typeof remapUVs === 'function') {
      remapUVs(geom, uMin, vMin, uMax, vMax);
    }
  }

  // 1. Ball Gown / Dress / Skirt Attachment
  if (text.includes('gown') || text.includes('dress') || text.includes('skirt')) {
    // Dynamic LOD scaling based on target budget
    const budgetScale = Math.sqrt(Math.max(1000, targetBudget) / 6000);
    const radialSegments = Math.max(8, Math.round(16 * budgetScale));
    const heightSegments = Math.max(4, Math.round(8 * budgetScale));

    const topRadius = isBaby ? 0.12 : (isFemale ? 0.14 : 0.15);
    const bottomRadius = isBaby ? 0.35 : (isFemale ? 0.55 : 0.50);
    const gownHeight = isBaby ? 0.45 : (isFemale ? 0.85 : 0.80);
    const waistY = isBaby ? 0.55 : (isFemale ? 0.95 : 0.90);

    const gownGeo = new THREE.CylinderGeometry(topRadius, bottomRadius, gownHeight, radialSegments, heightSegments, true);
    gownGeo.translate(0, -gownHeight / 2, 0); // Origin at waist line

    // Map clothing to Top-Left Atlas Quadrant (0.0, 0.5, 0.5, 1.0)
    applyQuadrantUVs(gownGeo, 0.0, 0.5, 0.5, 1.0);
    
    const gownMesh = new THREE.Mesh(gownGeo, clothesMaterial);
    gownMesh.name = "Clothing_Gown";
    gownMesh.position.set(0, waistY + baseShift, 0); 
    
    parentGroup.add(gownMesh);
  }
}

// Global window registration
window.attachClothing = attachClothing;

