import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js";

/* =========================
   BASIC SETUP
========================= */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.set(0, 10, 20);

/* =========================
   LIGHTING
========================= */

scene.add(new THREE.AmbientLight(0xffffff, 0.6));

const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(10, 20, 10);
scene.add(sun);

/* =========================
   VOXEL BLOCKS
========================= */

const geo = new THREE.BoxGeometry(1, 1, 1);

const matGrass = new THREE.MeshStandardMaterial({ color: 0x55aa55 });
const matDirt = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });

/* =========================
   CHUNK SYSTEM
========================= */

const CHUNK_SIZE = 16;
const chunks = new Map();

function chunkKey(x, z) {
  return `${x},${z}`;
}

/* create chunk */
function createChunk(cx, cz) {
  const key = chunkKey(cx, cz);
  if (chunks.has(key)) return;

  const group = new THREE.Group();

  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {

      const worldX = cx * CHUNK_SIZE + x;
      const worldZ = cz * CHUNK_SIZE + z;

      // simple terrain (replace later with Perlin noise)
      const height =
        Math.floor(
          Math.sin(worldX * 0.25) * 2 +
          Math.cos(worldZ * 0.25) * 2
        );

      for (let y = -3; y <= height; y++) {
        const mat = y === height ? matGrass : matDirt;

        const block = new THREE.Mesh(geo, mat);
        block.position.set(worldX, y, worldZ);

        group.add(block);
      }
    }
  }

  scene.add(group);
  chunks.set(key, group);
}

/* =========================
   LOAD CHUNKS AROUND PLAYER
========================= */

function updateChunks() {
  const cx = Math.floor(camera.position.x / CHUNK_SIZE);
  const cz = Math.floor(camera.position.z / CHUNK_SIZE);

  const renderDistance = 2;

  for (let x = -renderDistance; x <= renderDistance; x++) {
    for (let z = -renderDistance; z <= renderDistance; z++) {
      createChunk(cx + x, cz + z);
    }
  }
}

/* =========================
   MOVEMENT SYSTEM
========================= */

const keys = {};

document.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
});

document.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

function move() {
  const speed = 0.25;

  if (keys["w"]) camera.position.z -= speed;
  if (keys["s"]) camera.position.z += speed;
  if (keys["a"]) camera.position.x -= speed;
  if (keys["d"]) camera.position.x += speed;
}

/* optional FPS feel */
document.addEventListener("click", () => {
  document.body.requestPointerLock?.();
});

/* =========================
   GAME LOOP
========================= */

function animate() {
  requestAnimationFrame(animate);

  move();
  updateChunks();

  renderer.render(scene, camera);
}

animate();

/* =========================
   RESIZE FIX
========================= */

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
