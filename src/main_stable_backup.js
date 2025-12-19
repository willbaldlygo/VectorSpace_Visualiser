import './style.css';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

console.log("--- APP STARTING ---");

// --- CONFIGURATION ---
const TOTAL_POINTS = 40000;
const BACKGROUND_POINTS = 50000;
const SPACE_SIZE = 800;
const CLUSTER_COUNT = 80;
const NEIGHBOR_COUNT = 250;

// --- SCENE SETUP ---
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 5000);
camera.position.set(0, 200, 900);

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ReinhardToneMapping;
document.getElementById('canvas-container').appendChild(renderer.domElement);

// --- POST PROCESSING ---
const renderScene = new RenderPass(scene, camera);

// Bloom Pass - Created but NOT added to composer yet to prevent black screen issues
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.2;
bloomPass.strength = 1.2;
bloomPass.radius = 0.5;

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
// composer.addPass(bloomPass); // DISABLED FOR STABILITY

// --- BACKGROUND (JWST IMAGE) ---
const textureLoader = new THREE.TextureLoader();
const nebulaTexture = textureLoader.load('/nebula.png',
  () => console.log("Texture loaded successfully"),
  undefined,
  (err) => console.error("Texture load failed", err)
);
nebulaTexture.mapping = THREE.EquirectangularReflectionMapping;
nebulaTexture.encoding = THREE.sRGBEncoding;

const nebulaGeo = new THREE.SphereGeometry(2000, 64, 64);
const nebulaMat = new THREE.MeshBasicMaterial({
  map: nebulaTexture,
  side: THREE.BackSide,
  transparent: false, // Fully opaque
  opacity: 1.0,       // Full visibility
  color: 0xffffff,    // No tint
  depthWrite: false,  // Don't write to depth buffer
  depthTest: false    // Don't test against depth buffer (always behind)
});
const nebulaMesh = new THREE.Mesh(nebulaGeo, nebulaMat);
nebulaMesh.renderOrder = -1; // Draw first
scene.add(nebulaMesh);


// --- TEXTURES ---
function createStarTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
  grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  return new THREE.CanvasTexture(canvas);
}
const starTexture = createStarTexture();

function createFlareTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
  grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  return new THREE.CanvasTexture(canvas);
}
const flareTexture = createFlareTexture();

function createBeamTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 128, 0);
  grad.addColorStop(0, 'rgba(0, 255, 255, 0)');
  grad.addColorStop(0.2, 'rgba(0, 255, 255, 0.2)');
  grad.addColorStop(0.5, 'rgba(0, 255, 255, 0.8)');
  grad.addColorStop(0.8, 'rgba(0, 255, 255, 0.2)');
  grad.addColorStop(1, 'rgba(0, 255, 255, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 32);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
const beamTexture = createBeamTexture();

// --- REALISTIC STAR COLORS ---
const STAR_COLORS = [
  new THREE.Color(0x9bb0ff), // O - Blue
  new THREE.Color(0xaabfff), // B - Blue-White
  new THREE.Color(0xcad7ff), // A - White
  new THREE.Color(0xf8f7ff), // F - Yellow-White
  new THREE.Color(0xfff4ea), // G - Yellow
  new THREE.Color(0xffd2a1), // K - Orange
  new THREE.Color(0xffcc6f)  // M - Red
];

function getStarColor() {
  return STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
}

// --- DATA GENERATION (MAIN CLUSTERS) ---
const positions = new Float32Array(TOTAL_POINTS * 3);
const colors = new Float32Array(TOTAL_POINTS * 3);
const sizes = new Float32Array(TOTAL_POINTS);
const originalColors = new Float32Array(TOTAL_POINTS * 3);

const clusters = [];
for (let i = 0; i < CLUSTER_COUNT; i++) {
  clusters.push({
    x: (Math.random() - 0.5) * SPACE_SIZE * 1.8,
    y: (Math.random() - 0.5) * SPACE_SIZE * 1.8,
    z: (Math.random() - 0.5) * SPACE_SIZE * 1.8,
    // Anisotropic clusters (ellipsoids)
    rx: 50 + Math.random() * 200,
    ry: 50 + Math.random() * 200,
    rz: 50 + Math.random() * 200,
    density: 0.5 + Math.random() * 1.5
  });
}

const totalWeight = clusters.reduce((acc, c) => acc + c.density, 0);

for (let i = 0; i < TOTAL_POINTS; i++) {
  let cx = 0, cy = 0, cz = 0;
  let rx = 100, ry = 100, rz = 100;

  // 50% Noise for disorder
  if (Math.random() < 0.50) {
    cx = (Math.random() - 0.5) * SPACE_SIZE * 2.5;
    cy = (Math.random() - 0.5) * SPACE_SIZE * 2.5;
    cz = (Math.random() - 0.5) * SPACE_SIZE * 2.5;
    rx = 50 + Math.random() * 100;
    ry = rx;
    rz = rx;
  } else {
    let r = Math.random() * totalWeight;
    let selectedCluster = clusters[0];
    for (let c of clusters) {
      r -= c.density;
      if (r <= 0) {
        selectedCluster = c;
        break;
      }
    }

    cx = selectedCluster.x;
    cy = selectedCluster.y;
    cz = selectedCluster.z;
    rx = selectedCluster.rx;
    ry = selectedCluster.ry;
    rz = selectedCluster.rz;
  }

  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const dist = Math.pow(Math.random(), 0.5); // Less center-biased

  const x = cx + dist * rx * Math.sin(phi) * Math.cos(theta);
  const y = cy + dist * ry * Math.sin(phi) * Math.sin(theta);
  const z = cz + dist * rz * Math.cos(phi);

  positions[i * 3] = x;
  positions[i * 3 + 1] = y;
  positions[i * 3 + 2] = z;

  const starCol = getStarColor();
  const brightness = 0.5 + Math.random() * 1.5;

  colors[i * 3] = starCol.r * brightness;
  colors[i * 3 + 1] = starCol.g * brightness;
  colors[i * 3 + 2] = starCol.b * brightness;

  originalColors[i * 3] = colors[i * 3];
  originalColors[i * 3 + 1] = colors[i * 3 + 1];
  originalColors[i * 3 + 2] = colors[i * 3 + 2];

  sizes[i] = 1.0;
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

const material = new THREE.PointsMaterial({
  size: 6,
  vertexColors: true,
  map: starTexture,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  transparent: true,
  opacity: 1.0,
  sizeAttenuation: true
});

const pointsSystem = new THREE.Points(geometry, material);
scene.add(pointsSystem);

// --- BACKGROUND STAR FIELD (DEEP SPACE) ---
const bgPositions = new Float32Array(BACKGROUND_POINTS * 3);
const bgColors = new Float32Array(BACKGROUND_POINTS * 3);

for (let i = 0; i < BACKGROUND_POINTS; i++) {
  const r = 1000 + Math.random() * 2000;
  const theta = 2 * Math.PI * Math.random();
  const phi = Math.acos(2 * Math.random() - 1);

  bgPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
  bgPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
  bgPositions[i * 3 + 2] = r * Math.cos(phi);

  const col = getStarColor();
  const dim = 0.3 + Math.random() * 0.3;
  bgColors[i * 3] = col.r * dim;
  bgColors[i * 3 + 1] = col.g * dim;
  bgColors[i * 3 + 2] = col.b * dim;
}

const bgGeo = new THREE.BufferGeometry();
bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));
bgGeo.setAttribute('color', new THREE.BufferAttribute(bgColors, 3));

const bgMat = new THREE.PointsMaterial({
  size: 2,
  vertexColors: true,
  transparent: true,
  opacity: 0.6,
  sizeAttenuation: true,
  depthWrite: false
});
const bgSystem = new THREE.Points(bgGeo, bgMat);
scene.add(bgSystem);


// --- INTERACTIVE ELEMENTS ---
let tubeMesh = null;
let tubeMaterial = null;
const activeSprites = [];

// --- LOGIC & STATE ---
const wordToNodeMap = new Map();
const usedNodeIndices = new Set();
let currentWords = [];

const SEQUENCE_COLORS = [
  [1, 0.2, 0.2], // Red
  [0.2, 1, 0.2], // Green
  [0.2, 0.5, 1], // Blue
  [1, 1, 0.2],   // Yellow
  [1, 0.2, 1],   // Magenta
  [0.2, 1, 1]    // Cyan
];

function getNodeForWord(word) {
  const key = word.toLowerCase();
  if (wordToNodeMap.has(key)) return wordToNodeMap.get(key);

  let idx;
  let attempts = 0;
  do {
    idx = Math.floor(Math.random() * TOTAL_POINTS);
    attempts++;
  } while (usedNodeIndices.has(idx) && attempts < 1000);

  usedNodeIndices.add(idx);
  wordToNodeMap.set(key, idx);
  return idx;
}

function getTokenId(word) {
  let hash = 0;
  for (let i = 0; i < word.length; i++) {
    hash = ((hash << 5) - hash) + word.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 50000;
}

function getNearestNeighbors(targetIdx, k) {
  const px = positions[targetIdx * 3];
  const py = positions[targetIdx * 3 + 1];
  const pz = positions[targetIdx * 3 + 2];

  const distances = [];
  for (let i = 0; i < TOTAL_POINTS; i++) {
    if (i === targetIdx) continue;
    const dx = positions[i * 3] - px;
    const dy = positions[i * 3 + 1] - py;
    const dz = positions[i * 3 + 2] - pz;
    const distSq = dx * dx + dy * dy + dz * dz;
    distances.push({ id: i, distSq: distSq });
  }

  distances.sort((a, b) => a.distSq - b.distSq);
  return distances.slice(0, k);
}

// --- UPDATE VISUALIZATION ---
function updateVisualization(words) {
  currentWords = words;
  const wordCount = words.length;

  const positionsAttr = geometry.attributes.position.array;
  const colorsAttr = geometry.attributes.color.array;
  const sizesAttr = geometry.attributes.size.array;

  // Reset
  for (let i = 0; i < TOTAL_POINTS; i++) {
    colorsAttr[i * 3] = originalColors[i * 3] * 0.3;
    colorsAttr[i * 3 + 1] = originalColors[i * 3 + 1] * 0.3;
    colorsAttr[i * 3 + 2] = originalColors[i * 3 + 2] * 0.3;
    sizesAttr[i] = 1.0;
  }

  activeSprites.forEach(sprite => scene.remove(sprite));
  activeSprites.length = 0;

  const pathPoints = [];

  if (wordCount === 0) {
    for (let i = 0; i < TOTAL_POINTS; i++) {
      colorsAttr[i * 3] = originalColors[i * 3];
      colorsAttr[i * 3 + 1] = originalColors[i * 3 + 1];
      colorsAttr[i * 3 + 2] = originalColors[i * 3 + 2];
      sizesAttr[i] = 1.0;
    }
    if (tubeMesh) { scene.remove(tubeMesh); tubeMesh = null; }
    geometry.attributes.color.needsUpdate = true;
    geometry.attributes.size.needsUpdate = true;

    document.getElementById('nav-panel').style.display = 'none';
    moveCameraTo(new THREE.Vector3(0, 0, 0), 900);
    return;
  }

  // Apply Colors
  for (let w = 0; w < wordCount; w++) {
    const word = words[w];
    const idx = getNodeForWord(word);

    const px = positionsAttr[idx * 3];
    const py = positionsAttr[idx * 3 + 1];
    const pz = positionsAttr[idx * 3 + 2];
    const pos = new THREE.Vector3(px, py, pz);
    pathPoints.push(pos);

    const col = SEQUENCE_COLORS[w % SEQUENCE_COLORS.length];

    // Sprite
    const spriteMaterial = new THREE.SpriteMaterial({
      map: flareTexture,
      color: new THREE.Color(col[0], col[1], col[2]),
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.copy(pos);
    sprite.scale.set(60, 60, 1);
    scene.add(sprite);
    activeSprites.push(sprite);

    // KNN Cloud
    const neighbors = getNearestNeighbors(idx, NEIGHBOR_COUNT);
    const maxDistSq = neighbors[neighbors.length - 1].distSq;
    const maxDist = Math.sqrt(maxDistSq);

    neighbors.forEach(n => {
      const i = n.id;
      const dist = Math.sqrt(n.distSq);
      const intensity = 1 - (dist / maxDist);

      // Boost brightness for bloom
      colorsAttr[i * 3] = Math.max(colorsAttr[i * 3], col[0] * intensity * 2.0);
      colorsAttr[i * 3 + 1] = Math.max(colorsAttr[i * 3 + 1], col[1] * intensity * 2.0);
      colorsAttr[i * 3 + 2] = Math.max(colorsAttr[i * 3 + 2], col[2] * intensity * 2.0);

      sizesAttr[i] = Math.max(sizesAttr[i], 2.0 + (intensity * 3.0));
    });
  }

  geometry.attributes.color.needsUpdate = true;
  geometry.attributes.size.needsUpdate = true;

  // Draw Energy Beam
  if (tubeMesh) { scene.remove(tubeMesh); tubeMesh = null; }

  if (pathPoints.length > 1) {
    const curve = new THREE.CatmullRomCurve3(pathPoints);
    const tubeGeo = new THREE.TubeGeometry(curve, pathPoints.length * 20, 3, 8, false);

    tubeMaterial = new THREE.MeshBasicMaterial({
      map: beamTexture,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
      color: new THREE.Color(0x00ffff).multiplyScalar(1.5) // Boost for bloom
    });

    tubeMesh = new THREE.Mesh(tubeGeo, tubeMaterial);
    scene.add(tubeMesh);
  }

  // --- NAVIGATION LOGIC (>= 6 words) ---
  if (wordCount >= 6) {
    const lastPos = pathPoints[pathPoints.length - 1];
    const prevPos = pathPoints[pathPoints.length - 2];
    const lastWord = words[words.length - 1];

    const bearing = new THREE.Vector3().subVectors(lastPos, prevPos).normalize();

    const navPanel = document.getElementById('nav-panel');
    navPanel.style.display = 'block';

    const normScale = 1 / (SPACE_SIZE / 1.5);
    const nx = lastPos.x * normScale;
    const ny = lastPos.y * normScale;
    const nz = lastPos.z * normScale;

    document.getElementById('nav-token-id').innerText = getTokenId(lastWord);
    document.getElementById('nav-coords').innerText = `[${nx.toFixed(3)}, ${ny.toFixed(3)}, ${nz.toFixed(3)}]`;
    document.getElementById('nav-bearing').innerText = `[${bearing.x.toFixed(3)}, ${bearing.y.toFixed(3)}, ${bearing.z.toFixed(3)}]`;

    const statusEl = document.getElementById('nav-status');
    statusEl.innerText = "VECTOR ACQUIRED";
    statusEl.style.color = "#00ffff";

    // Just framing the path
    const box = new THREE.Box3();
    pathPoints.forEach(p => box.expandByPoint(p));
    const center = new THREE.Vector3();
    box.getCenter(center);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = 60 * (Math.PI / 180);
    let cameraDist = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraDist *= 1.2;
    moveCameraTo(center, cameraDist);

  } else {
    document.getElementById('nav-panel').style.display = 'none';

    if (pathPoints.length > 0) {
      const center = new THREE.Vector3();
      const box = new THREE.Box3();
      pathPoints.forEach(p => box.expandByPoint(p));
      const padding = 150;
      const lastPos = pathPoints[pathPoints.length - 1];
      box.expandByPoint(new THREE.Vector3(lastPos.x + padding, lastPos.y + padding, lastPos.z + padding));
      box.expandByPoint(new THREE.Vector3(lastPos.x - padding, lastPos.y - padding, lastPos.z - padding));
      box.getCenter(center);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = 60 * (Math.PI / 180);
      let cameraDist = Math.abs(maxDim / 2 / Math.tan(fov / 2));
      cameraDist *= 1.2;
      moveCameraTo(center, cameraDist);
    }
  }
}

// --- CAMERA CONTROLS ---
let cameraTarget = new THREE.Vector3(0, 0, 0);
let targetCameraPos = new THREE.Vector3(0, 200, 900);
let isDragging = false;
let isPanning = false;
let lastMouseX = 0, lastMouseY = 0;
let theta = 0, phi = Math.PI / 2;
let radius = 900;

function moveCameraTo(target, dist) {
  cameraTarget.copy(target);
  if (dist) radius = dist;
  updateCameraPosition();
}

function updateCameraPosition() {
  targetCameraPos.x = cameraTarget.x + radius * Math.sin(theta) * Math.cos(phi);
  targetCameraPos.y = cameraTarget.y + radius * Math.sin(phi);
  targetCameraPos.z = cameraTarget.z + radius * Math.cos(theta) * Math.cos(phi);
}

renderer.domElement.addEventListener('mousedown', e => {
  if (e.button === 0) isDragging = true;
  if (e.button === 2) isPanning = true;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
});

window.addEventListener('mouseup', () => {
  isDragging = false;
  isPanning = false;
});

renderer.domElement.addEventListener('mousemove', e => {
  const dx = e.clientX - lastMouseX;
  const dy = e.clientY - lastMouseY;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;

  if (isDragging) {
    theta -= dx * 0.005;
    phi += dy * 0.005;
    phi = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, phi));
    updateCameraPosition();
  }

  if (isPanning) {
    const panSpeed = radius * 0.001;
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
    const up = new THREE.Vector3().crossVectors(right, forward).normalize();

    cameraTarget.addScaledVector(right, -dx * panSpeed);
    cameraTarget.addScaledVector(up, dy * panSpeed);
    updateCameraPosition();
  }
});

renderer.domElement.addEventListener('wheel', e => {
  e.preventDefault();
  radius += e.deltaY * 0.5;
  radius = Math.max(50, Math.min(3000, radius));
  updateCameraPosition();
}, { passive: false });

renderer.domElement.addEventListener('contextmenu', e => e.preventDefault());

// --- UI CONTROLS ---
const controlsDiv = document.getElementById('controls');
const toggleBtn = document.getElementById('toggle-btn');

toggleBtn.addEventListener('click', () => {
  controlsDiv.classList.toggle('minimized');
  if (controlsDiv.classList.contains('minimized')) {
    toggleBtn.innerHTML = '';
  } else {
    toggleBtn.innerHTML = '_';
  }
});

controlsDiv.addEventListener('click', (e) => {
  if (controlsDiv.classList.contains('minimized') && e.target !== toggleBtn) {
    controlsDiv.classList.remove('minimized');
    toggleBtn.innerHTML = '_';
  }
});

// --- INPUT HANDLING (RICH TEXT) ---
const input = document.getElementById('text-input');
const overlay = document.getElementById('text-overlay');

input.addEventListener('input', (e) => {
  const rawText = e.target.value;

  const words = rawText.split(/(\s+)/);
  let html = '';
  let wordIndex = 0;

  words.forEach(part => {
    if (part.trim().length > 0) {
      const col = SEQUENCE_COLORS[wordIndex % SEQUENCE_COLORS.length];
      const colorStr = `rgb(${Math.floor(col[0] * 255)}, ${Math.floor(col[1] * 255)}, ${Math.floor(col[2] * 255)})`;
      html += `<span class="word-span" style="color: ${colorStr}">${part}</span>`;
      wordIndex++;
    } else {
      html += part;
    }
  });

  overlay.innerHTML = html;

  const completedText = rawText.slice(0, rawText.lastIndexOf(' ') + 1);
  const finalWords = completedText.trim().split(/\s+/).filter(w => w.length > 0);

  if (finalWords.length !== currentWords.length || !finalWords.every((v, i) => v === currentWords[i])) {
    updateVisualization(finalWords);

    if (finalWords.length > 0) {
      document.getElementById('status').innerHTML =
        `Sequence: <span class="highlight">${finalWords.join(' → ')}</span><br>` +
        `<small>Probability field narrowed.</small>`;
    } else {
      document.getElementById('status').innerHTML = 'Type words to explore the semantic galaxy...';
    }
  }
});

input.addEventListener('scroll', () => {
  overlay.scrollLeft = input.scrollLeft;
});

document.getElementById('reset').addEventListener('click', () => {
  input.value = '';
  overlay.innerHTML = '';
  updateVisualization([]);
});

// --- ANIMATION LOOP ---
function animate() {
  requestAnimationFrame(animate);

  const time = performance.now() * 0.001;
  // nebulaMat.uniforms.time.value = time; // Shader removed

  if (tubeMaterial && tubeMaterial.map) {
    tubeMaterial.map.offset.x -= 0.02;
  }

  camera.position.lerp(targetCameraPos, 0.05);
  camera.lookAt(cameraTarget);

  // Use Composer instead of Renderer
  // composer.render(); 
  renderer.render(scene, camera); // STABLE RENDER
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

animate();
updateVisualization([]);
