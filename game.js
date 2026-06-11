import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js";

/* =========================
   BASIC SETUP
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
   WORLD (simple flat ground)
========================= */

const blocks = [];
const geo = new THREE.BoxGeometry(1,1,1);

const mats = {
  grass: new THREE.MeshStandardMaterial({ color: 0x55aa55 }),
  dirt: new THREE.MeshStandardMaterial({ color: 0x8b5a2b }),
  stone: new THREE.MeshStandardMaterial({ color: 0x888888 })
};

function addBlock(x,y,z,type="grass"){
  const b = new THREE.Mesh(geo, mats[type]);
  b.position.set(x,y,z);
  scene.add(b);
  blocks.push(b);
}

/* ground */
for(let x=-10;x<=10;x++){
  for(let z=-10;z<=10;z++){
    addBlock(x,0,z,"grass");
    addBlock(x,-1,z,"dirt");
  }
}

/* =========================
   PLAYER PHYSICS
========================= */

const player = {
  yVel: 0,
  grounded: false
};

camera.position.set(0,3,5);

const gravity = -0.015;
const jumpPower = 0.35;

/* =========================
   CONTROLS
========================= */

const keys = {};

document.addEventListener("keydown", e=>{
  keys[e.key.toLowerCase()] = true;

  // inventory switch
  if(e.key==="1") selectedBlock="grass";
  if(e.key==="2") selectedBlock="dirt";
  if(e.key==="3") selectedBlock="stone";

  // jump
  if(e.key===" " && player.grounded){
    player.yVel = jumpPower;
    player.grounded = false;
  }
});

document.addEventListener("keyup", e=>{
  keys[e.key.toLowerCase()] = false;
});

/* =========================
   INVENTORY
========================= */

let selectedBlock = "grass";

/* =========================
   MOBS
========================= */

const mobs = [];

function spawnMob(x,z){
  const mob = new THREE.Mesh(
    new THREE.BoxGeometry(1,1,1),
    new THREE.MeshStandardMaterial({ color: 0xff4444 })
  );

  mob.position.set(x,1,z);
  mob.userData = { speed: 0.02 };

  scene.add(mob);
  mobs.push(mob);
}

/* spawn some mobs */
spawnMob(5,5);
spawnMob(-5,-5);

/* =========================
   MOVEMENT
========================= */

function movePlayer(){
  const speed = 0.12;

  if(keys["w"]) camera.position.z -= speed;
  if(keys["s"]) camera.position.z += speed;
  if(keys["a"]) camera.position.x -= speed;
  if(keys["d"]) camera.position.x += speed;
}

/* =========================
   PHYSICS UPDATE
========================= */

function physics(){

  // gravity
  player.yVel += gravity;
  camera.position.y += player.yVel;

  // ground collision (simple)
  if(camera.position.y < 2){
    camera.position.y = 2;
    player.yVel = 0;
    player.grounded = true;
  }
}

/* =========================
   MOBS AI
========================= */

function updateMobs(){
  mobs.forEach(m => {
    const dx = camera.position.x - m.position.x;
    const dz = camera.position.z - m.position.z;

    const dist = Math.sqrt(dx*dx + dz*dz);

    if(dist > 1){
      m.position.x += (dx / dist) * m.userData.speed;
      m.position.z += (dz / dist) * m.userData.speed;
    }
  });
}

/* =========================
   SIMPLE RAY ACTION (optional)
========================= */

document.addEventListener("click", ()=>{
  document.body.requestPointerLock?.();
});

/* =========================
   LOOP
========================= */

function animate(){
  requestAnimationFrame(animate);

  movePlayer();
  physics();
  updateMobs();

  renderer.render(scene,camera);
}

animate();

/* resize */
window.addEventListener("resize",()=>{
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});
