// ==========================================
// FULL TEXTURES & EXPORT MODULE (texturesAndExport.js)
// ==========================================

// 1. GENERATE REAL-TIME AI TEXTURE VIA POLLINATIONS.AI
async function generateAITexture(promptText = '') {
  return new Promise((resolve, reject) => {
    const text = encodeURIComponent(promptText || 'character texture map');
    const aiImageUrl = `https://image.pollinations.ai/prompt/${text}%20seamless%203d%20texture%20map?width=512&height=512&nologo=true`;

    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin('anonymous');

    textureLoader.load(
      aiImageUrl,
      (texture) => {
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.needsUpdate = true;
        resolve(texture);
      },
      undefined,
      (err) => {
        console.warn('Pollinations AI fetch failed, falling back to local procedural canvas atlas:', err);
        const fallbackCanvas = generateModelTextureCanvas(promptText);
        const fallbackTexture = new THREE.CanvasTexture(fallbackCanvas);
        resolve(fallbackTexture);
      }
    );
  });
}

// 2. GENERATE PROCEDURAL FALLBACK CANVAS (ATLAS QUADRANTS)
function generateModelTextureCanvas(promptText = '') {
  const canvas = document.createElement('canvas');
  canvas.id = 'textureCanvas';
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const text = (promptText || '').toLowerCase();

  // QUADRANT 1: Top-Left Canvas (U: 0.0-0.5, V: 0.5-1.0 in UV Space) -> Body / Torso
  if (text.includes('dragon')) {
    ctx.fillStyle = '#228b22'; // Green for Dragon Body
  } else if (text.includes('snake') || text.includes('lamia')) {
    ctx.fillStyle = '#1e4d2b'; // Dark Green
  } else {
    ctx.fillStyle = '#ebd2be'; // Standard Skin Base
  }
  ctx.fillRect(0, 0, 256, 256);

  // QUADRANT 2: Top-Right Canvas (U: 0.5-1.0, V: 0.5-1.0 in UV Space) -> Head & Facial Details
  ctx.fillStyle = '#ebd2be'; // Head skin base
  ctx.fillRect(256, 0, 256, 256);

  // Draw Facial Features into Center of Quadrant 2
  ctx.fillStyle = '#ffffff'; // Eyes
  ctx.fillRect(320, 80, 40, 20);
  ctx.fillRect(408, 80, 40, 20);

  ctx.fillStyle = '#111111'; // Pupils
  ctx.fillRect(335, 85, 10, 10);
  ctx.fillRect(423, 85, 10, 10);

  ctx.fillStyle = '#d96b75'; // Lips
  ctx.fillRect(354, 140, 60, 12);

  // QUADRANT 3: Bottom-Left Canvas (U: 0.0-0.5, V: 0.0-0.5 in UV Space) -> Legs & Limbs
  ctx.fillStyle = '#d8bca6';
  ctx.fillRect(0, 256, 256, 256);

  // QUADRANT 4: Bottom-Right Canvas (U: 0.5-1.0, V: 0.0-0.5 in UV Space) -> Wings / Tail / Extras
  if (text.includes('dragon')) {
    ctx.fillStyle = '#b22222'; // Red for Dragon Wings/Tail
  } else {
    ctx.fillStyle = '#2e8b57'; // Accessories Base
  }
  ctx.fillRect(256, 256, 256, 256);

  return canvas;
}

// 3. APPLY TEXTURE TO LIVE VIEWPORT MATERIALS
function applyCanvasTextureToGroup(targetGroup, textureCanvas) {
  if (!targetGroup) return;
  
  const canvasTexture = new THREE.CanvasTexture(textureCanvas);
  canvasTexture.wrapS = THREE.ClampToEdgeWrapping;
  canvasTexture.wrapT = THREE.ClampToEdgeWrapping;
  canvasTexture.needsUpdate = true;

  targetGroup.traverse((child) => {
    if (child.isMesh && child.material) {
      child.material.map = canvasTexture;
      child.material.needsUpdate = true;
    }
  });
}

// 4. COMPLETE EXPORT BUNDLE (OBJ + MTL + TEXTURE ZIP)
function exportModelBundle(modelGroup, promptText = 'ModelExport', filename = 'ModelExport_6000poly') {
  if (typeof JSZip === 'undefined') {
    alert('JSZip library is missing! Make sure jszip.min.js is included in index.html.');
    return;
  }

  const zip = new JSZip();
  const exportName = filename || 'ModelExport';

  // Step A: Parse OBJ Structure
  let objData = '';
  if (typeof THREE.OBJExporter !== 'undefined') {
    const objExporter = new THREE.OBJExporter();
    objData = objExporter.parse(modelGroup);
  } else {
    alert('THREE.OBJExporter is not loaded!');
    return;
  }

  // Link OBJ to the accompanying MTL file header
  const mtlFilename = `${exportName}.mtl`;
  const formattedObjData = `mtllib ${mtlFilename}\n` + objData;
  zip.file(`${exportName}.obj`, formattedObjData);

  // Step B: Build Matching MTL Material File
  const mtlData = `# Generated Material Template\nnewmtl Material_Atlas\nKa 1.0 1.0 1.0\nKd 1.0 1.0 1.0\nKs 0.0 0.0 0.0\nmap_Kd texture.png\n`;
  zip.file(mtlFilename, mtlData);

  // Step C: Render Canvas Atlas and Save to Zip
  const textureCanvas = generateModelTextureCanvas(promptText);
  
  // Update Live Viewport
  applyCanvasTextureToGroup(modelGroup, textureCanvas);

  textureCanvas.toBlob((blob) => {
    zip.file('texture.png', blob);

    // Step D: Trigger ZIP Download containing 3 Files (.obj, .mtl, texture.png)
    zip.generateAsync({ type: 'blob' }).then((content) => {
      if (typeof saveAs !== 'undefined') {
        saveAs(content, `${exportName}.zip`);
      } else {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `${exportName}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  });
}

// ==========================================
// EXPORT TO GLOBAL WINDOW OBJECT
// ==========================================
window.generateAITexture = generateAITexture;
window.generateModelTextureCanvas = generateModelTextureCanvas;
window.applyCanvasTextureToGroup = applyCanvasTextureToGroup;
window.exportModelBundle = exportModelBundle;
window.exportOBJBundle = function() {
  const promptInput = document.getElementById('prompt-input');
  const exportNameInput = document.getElementById('export-name-input');
  
  const promptText = promptInput ? promptInput.value : 'ModelExport';
  const exportName = exportNameInput ? exportNameInput.value : 'ModelExport';

  window.exportModelBundle(modelGroup, promptText, exportName);
};

