import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js";
import { PointerLockControls } from "https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/controls/PointerLockControls.js";

/* =========================
   SETUP
========================= */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(
  75,
  innerWidth / innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

/* LIGHT */
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(10, 20, 10);
scene.add(sun);

/* =========================
   FPS CONTROLS
========================= */

const controls = new PointerLockControls(camera, document.body);
document.addEventListener("click", () => controls.lock());

camera.position.set(0, 3, 5);

/* =========================
   BLOCK SYSTEM
========================= */

const geo = new THREE.BoxGeometry(1, 1, 1);

const mats = {
  grass: new THREE.MeshStandardMaterial({ color: 0x55aa55 }),
  dirt: new THREE.MeshStandardMaterial({ color: 0x8b5a2b }),
  stone: new THREE.MeshStandardMaterial({ color: 0x888888 })
};

/* =========================
   CHUNK SYSTEM
========================= */

const CHUNK_SIZE = 16;
const RENDER_DISTANCE = 2;

const chunks = new Map();
const blocks = []; // all blocks for raycast

function key(cx, cz) {
  return `${cx},${cz}`;
}

/* create voxel */
function createBlock(x, y, z, type = "grass") {
  const b = new THREE.Mesh(geo, mats[type]);
  b.position.set(x, y, z);
  b.userData.type = type;
  scene.add(b);
  blocks.push(b);
  return b;
}

/* generate chunk */
function generateChunk(cx, cz) {
  const k = key(cx, cz);
  if (chunks.has(k)) return;

  const group = new THREE.Group();

  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {

      const wx = cx * CHUNK_SIZE + x;
      const wz = cz * CHUNK_SIZE + z;

      // terrain height (replace later with Perlin noise)
      const h =
        Math.floor(
          Math.sin(wx * 0.2) * 2 +
          Math.cos(wz * 0.2) * 2
        );

      for (let y = -2; y <= h; y++) {
        const mat = y === h ? "grass" : "dirt";

        const block = createBlock(wx, y, wz, mat);
        group.add(block);
      }
    }
  }

  scene.add(group);
  chunks.set(k, group);
}

/* update visible chunks around player */
function updateChunks() {
  const cx = Math.floor(camera.position.x / CHUNK_SIZE);
  const cz = Math.floor(camera.position.z / CHUNK_SIZE);

  for (let x = -RENDER_DISTANCE; x <= RENDER_DISTANCE; x++) {
    for (let z = -RENDER_DISTANCE; z <= RENDER_DISTANCE; z++) {
      generateChunk(cx + x, cz + z);
    }
  }
}

/* =========================
   BLOCK PLACING / BREAKING
========================= */

const ray = new THREE.Raycaster();
let selected = "grass";

function getHit() {
  ray.setFromCamera(new THREE.Vector2(0, 0), camera);
  return ray.intersectObjects(blocks)[0];
}

document.addEventListener("mousedown", (e) => {
  const hit = getHit();
  if (!hit) return;

  // BREAK
  if (e.button === 0) {
    scene.remove(hit.object);
    blocks.splice(blocks.indexOf(hit.object), 1);
  }

  // PLACE
  if (e.button === 2) {
    const p = hit.object.position.clone().add(hit.face.normal);

    createBlock(
      Math.round(p.x),
      Math.round(p.y),
      Math.round(p.z),
      selected
    );
  }
});

document.addEventListener("contextmenu", e => e.preventDefault());

/* =========================
   MOVEMENT
========================= */

const keys = {};

document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

function move() {
  const speed = 0.15;

  if (controls.isLocked) {
    if (keys["w"]) controls.moveForward(speed);
    if (keys["s"]) controls.moveForward(-speed);
    if (keys["a"]) controls.moveRight(-speed);
    if (keys["d"]) controls.moveRight(speed);
  }
}

/* =========================
   LOOP
========================= */

function animate() {
  requestAnimationFrame(animate);

  move();
  updateChunks();

  renderer.render(scene, camera);
}

animate();

/* RESIZE */
window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
