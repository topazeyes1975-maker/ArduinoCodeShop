// ==========================================
// FILE: bodyParts.js
// Specialized Geometry & UV Mapping Utilities
// ==========================================

/**
 * Maps geometry UVs to designated regions on the texture atlas.
 * Quadrant Layout:
 * - Body/Torso: Top-Left (u: 0.0-0.5, v: 0.5-1.0)
 * - Head/Snout/Ears: Top-Right (u: 0.5-1.0, v: 0.5-1.0)
 * - Legs/Feet/Limbs: Bottom-Left (u: 0.0-0.5, v: 0.0-0.5)
 * - Wings/Tail/Accessories: Bottom-Right (u: 0.5-1.0, v: 0.0-0.5)
 */
function remapUVs(geometry, uMin = 0.0, vMin = 0.0, uMax = 1.0, vMax = 1.0) {
  if (!geometry || !geometry.attributes.position) return;
  
  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox;
  const minY = bbox.min.y;
  const maxY = bbox.max.y;
  const height = (maxY - minY) || 1.0;

  // Add 1.5% safe border padding inside quadrant bounds to stop texture bleeding
  const padU = (uMax - uMin) * 0.015;
  const padV = (vMax - vMin) * 0.015;
  const safeUMin = uMin + padU;
  const safeUMax = uMax - padU;
  const safeVMin = vMin + padV;
  const safeVMax = vMax - padV;

  const posAttr = geometry.attributes.position;
  const uvs = new Float32Array(posAttr.count * 2);

  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const z = posAttr.getZ(i);

    // Shift spherical polar coordinate so +Z (Front) maps U directly to quadrant center
    let angle = Math.atan2(x, z); 
    let rawU = (angle / (2 * Math.PI)) + 0.5;
    
    // Normalized height relative to object bounding box for V (0.0 to 1.0)
    let rawV = Math.max(0, Math.min(1, (y - minY) / height));

    // Map into padded quadrant bounds
    const fittedU = safeUMin + rawU * (safeUMax - safeUMin);
    const fittedV = safeVMin + rawV * (safeVMax - safeVMin);

    uvs[i * 2] = fittedU;
    uvs[i * 2 + 1] = fittedV;
  }

  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  if (geometry.attributes.uv) {
    geometry.attributes.uv.needsUpdate = true;
  }
}

// ==========================================
// GEOMETRY GENERATOR HELPERS
// ==========================================

// Creates Torso / Body Mesh (Mapped to Top-Left Quadrant: U 0.0-0.5, V 0.5-1.0)
function createBodyGeometry(width = 1.2, height = 1.0, depth = 2.0, radialSegs = 12) {
  const geom = new THREE.CylinderGeometry(width * 0.5, width * 0.45, depth, radialSegs);
  geom.rotateX(Math.PI / 2); // Align horizontally for quadrupeds
  remapUVs(geom, 0.0, 0.5, 0.5, 1.0);

  const mat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.6 });
  return new THREE.Mesh(geom, mat);
}

// Creates Head / Snout / Ear Group (Mapped to Top-Right Quadrant: U 0.5-1.0, V 0.5-1.0)
function createHeadGeometry(isQuadruped = true) {
  const headGroup = new THREE.Group();
  const defaultMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.5 });

  // Main Head Structure
  const headGeom = new THREE.BoxGeometry(0.8, 0.7, 0.9);
  remapUVs(headGeom, 0.5, 0.5, 1.0, 1.0);
  const headMesh = new THREE.Mesh(headGeom, defaultMat);
  headGroup.add(headMesh);

  if (isQuadruped) {
    // Snout Block
    const snoutGeom = new THREE.BoxGeometry(0.5, 0.4, 0.7);
    remapUVs(snoutGeom, 0.5, 0.5, 1.0, 1.0);
    const snoutMesh = new THREE.Mesh(snoutGeom, defaultMat);
    snoutMesh.position.set(0, -0.1, 0.7);
    headGroup.add(snoutMesh);

    // Left Ear
    const earGeomLeft = new THREE.ConeGeometry(0.2, 0.5, 4);
    remapUVs(earGeomLeft, 0.5, 0.5, 1.0, 1.0);
    const earLeft = new THREE.Mesh(earGeomLeft, defaultMat);
    earLeft.position.set(-0.3, 0.5, -0.1);
    headGroup.add(earLeft);

    // Right Ear
    const earGeomRight = new THREE.ConeGeometry(0.2, 0.5, 4);
    remapUVs(earGeomRight, 0.5, 0.5, 1.0, 1.0);
    const earRight = new THREE.Mesh(earGeomRight, defaultMat);
    earRight.position.set(0.3, 0.5, -0.1);
    headGroup.add(earRight);
  }

  return headGroup;
}

// Creates Leg Mesh (Mapped to Bottom-Left Quadrant: U 0.0-0.5, V 0.0-0.5)
function createLegGeometry(radius = 0.18, height = 1.2, radialSegs = 8) {
  const geom = new THREE.CylinderGeometry(radius, radius * 0.8, height, radialSegs);
  remapUVs(geom, 0.0, 0.0, 0.5, 0.5);

  const mat = new THREE.MeshStandardMaterial({ color: 0xbbbbbb, roughness: 0.6 });
  return new THREE.Mesh(geom, mat);
}

// Creates Wing Mesh (Mapped to Bottom-Right Quadrant: U 0.5-1.0, V 0.0-0.5)
function createWingGeometry(width = 1.5, height = 1.8) {
  const geom = new THREE.PlaneGeometry(width, height, 4, 4);
  remapUVs(geom, 0.5, 0.0, 1.0, 0.5);

  const mat = new THREE.MeshStandardMaterial({ 
    color: 0xaaaaaa, 
    side: THREE.DoubleSide, 
    roughness: 0.5 
  });
  return new THREE.Mesh(geom, mat);
}

// Creates Tail Mesh (Mapped to Bottom-Right Quadrant: U 0.5-1.0, V 0.0-0.5)
function createTailGeometry(length = 1.8, segments = 6) {
  const geom = new THREE.ConeGeometry(0.25, length, segments);
  geom.rotateX(-Math.PI / 2); // Align trailing backward
  remapUVs(geom, 0.5, 0.0, 1.0, 0.5);

  const mat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.6 });
  return new THREE.Mesh(geom, mat);
}

// ==========================================
// EXPORT TO GLOBAL WINDOW OBJECT
// ==========================================
window.remapUVs = remapUVs;
window.createBodyGeometry = createBodyGeometry;
window.createHeadGeometry = createHeadGeometry;
window.createLegGeometry = createLegGeometry;
window.createWingGeometry = createWingGeometry;
window.createTailGeometry = createTailGeometry;
