import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js";
import { PointerLockControls } from "https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/controls/PointerLockControls.js";

/* =========================
   SCENE
========================= */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(
  75,
  innerWidth / innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({ antialias:true });
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
   BLOCKS
========================= */

const geo = new THREE.BoxGeometry(1,1,1);

const mats = {
  grass: new THREE.MeshStandardMaterial({ color:0x55aa55 }),
  dirt: new THREE.MeshStandardMaterial({ color:0x8b5a2b }),
  stone: new THREE.MeshStandardMaterial({ color:0x888888 })
};

const blocks = [];

/* =========================
   CHUNKS
========================= */

const CHUNK_SIZE = 16;
const RENDER_DIST = 2;
const chunks = new Map();

function key(x,z){ return `${x},${z}`; }

function createBlock(x,y,z,type){
  const b = new THREE.Mesh(geo, mats[type]);
  b.position.set(x,y,z);
  b.userData.type = type;
  scene.add(b);
  blocks.push(b);
}

function generateChunk(cx,cz){
  const k = key(cx,cz);
  if(chunks.has(k)) return;

  const group = new THREE.Group();

  for(let x=0;x<CHUNK_SIZE;x++){
    for(let z=0;z<CHUNK_SIZE;z++){

      const wx = cx*CHUNK_SIZE + x;
      const wz = cz*CHUNK_SIZE + z;

      const h =
        Math.floor(
          Math.sin(wx*0.2)*2 +
          Math.cos(wz*0.2)*2
        );

      for(let y=-2;y<=h;y++){
        const type = y===h ? "grass":"dirt";
        const b = new THREE.Mesh(geo, mats[type]);

        b.position.set(wx,y,wz);
        group.add(b);
        blocks.push(b);
      }
    }
  }

  scene.add(group);
  chunks.set(k,group);
}

function updateChunks(){
  const cx = Math.floor(camera.position.x / CHUNK_SIZE);
  const cz = Math.floor(camera.position.z / CHUNK_SIZE);

  for(let x=-RENDER_DIST;x<=RENDER_DIST;x++){
    for(let z=-RENDER_DIST;z<=RENDER_DIST;z++){
      generateChunk(cx+x, cz+z);
    }
  }
}

/* =========================
   INPUT
========================= */

const keys = {};
let selected = "grass";

document.addEventListener("keydown",(e)=>{
  keys[e.key.toLowerCase()] = true;

  if(e.key==="1") selected="grass";
  if(e.key==="2") selected="dirt";
  if(e.key==="3") selected="stone";
});

document.addEventListener("keyup",(e)=>{
  keys[e.key.toLowerCase()] = false;
});

/* =========================
   RAYCAST (BUILD SYSTEM)
========================= */

const ray = new THREE.Raycaster();

function getHit(){
  ray.setFromCamera(new THREE.Vector2(0,0), camera);
  return ray.intersectObjects(blocks)[0];
}

document.addEventListener("mousedown",(e)=>{
  const hit = getHit();
  if(!hit) return;

  // break
  if(e.button===0){
    scene.remove(hit.object);
    blocks.splice(blocks.indexOf(hit.object),1);
  }

  // place
  if(e.button===2){
    const p = hit.object.position.clone().add(hit.face.normal);
    createBlock(
      Math.round(p.x),
      Math.round(p.y),
      Math.round(p.z),
      selected
    );
  }
});

document.addEventListener("contextmenu",e=>e.preventDefault());

/* =========================
   MOVEMENT
========================= */

function move(){
  const speed = 0.15;

  if(controls.isLocked){
    if(keys["w"]) controls.moveForward(speed);
    if(keys["s"]) controls.moveForward(-speed);
    if(keys["a"]) controls.moveRight(-speed);
    if(keys["d"]) controls.moveRight(speed);
  }
}

/* =========================
   LOOP
========================= */

function animate(){
  requestAnimationFrame(animate);

  move();
  updateChunks();

  renderer.render(scene,camera);
}

animate();

/* RESIZE */
window.addEventListener("resize",()=>{
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});
