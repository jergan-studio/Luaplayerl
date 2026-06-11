import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js";

/* =========================
   SETUP
========================= */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

/* LIGHT */
scene.add(new THREE.AmbientLight(0xffffff,0.6));
const sun = new THREE.DirectionalLight(0xffffff,1);
sun.position.set(10,20,10);
scene.add(sun);

/* =========================
   WORLD BLOCKS
========================= */

const geo = new THREE.BoxGeometry(1,1,1);
const mats = {
  grass: new THREE.MeshStandardMaterial({ color:0x55aa55 }),
  dirt: new THREE.MeshStandardMaterial({ color:0x8b5a2b }),
  stone: new THREE.MeshStandardMaterial({ color:0x888888 })
};

const blocks = [];

/* flat world */
for(let x=-20;x<=20;x++){
  for(let z=-20;z<=20;z++){
    addBlock(x,0,z,"grass");
    addBlock(x,-1,z,"dirt");
  }
}

function addBlock(x,y,z,type){
  const b = new THREE.Mesh(geo, mats[type]);
  b.position.set(x,y,z);
  b.userData.type = type;
  scene.add(b);
  blocks.push(b);
}

/* =========================
   PLAYER + PHYSICS
========================= */

camera.position.set(0,3,5);

const player = {
  velY:0,
  grounded:false,
  speed:0.12
};

const gravity = -0.02;
const jumpPower = 0.35;

/* =========================
   BUILD MODE (` key)
========================= */

let buildMode = false;

document.addEventListener("keydown",(e)=>{

  // toggle build mode
  if(e.key === "`"){
    buildMode = !buildMode;
  }

  keys[e.key.toLowerCase()] = true;

  // inventory
  if(e.key==="1") selected="grass";
  if(e.key==="2") selected="dirt";
  if(e.key==="3") selected="stone";

  // jump
  if(e.key===" " && player.grounded){
    player.velY = jumpPower;
    player.grounded = false;
  }
});

document.addEventListener("keyup",(e)=>{
  keys[e.key.toLowerCase()] = false;
});

const keys = {};
let selected = "grass";

/* =========================
   HOTBAR UI
========================= */

const hotbar = document.getElementById("hotbar");

["grass","dirt","stone"].forEach((t,i)=>{
  const s = document.createElement("div");
  s.className="slot"+(i===0?" sel":"");
  s.innerText=i+1;
  hotbar.appendChild(s);
});

/* =========================
   RAYCAST (BLOCK PLACE/REMOVE)
========================= */

const ray = new THREE.Raycaster();

function getHit(){
  ray.setFromCamera(new THREE.Vector2(0,0), camera);
  return ray.intersectObjects(blocks)[0];
}

document.addEventListener("mousedown",(e)=>{

  const hit = getHit();
  if(!hit) return;

  // left click break
  if(e.button===0){
    if(buildMode){
      scene.remove(hit.object);
      blocks.splice(blocks.indexOf(hit.object),1);
    }
  }

  // right click place
  if(e.button===2){
    if(buildMode){
      const p = hit.object.position.clone().add(hit.face.normal);
      addBlock(
        Math.round(p.x),
        Math.round(p.y),
        Math.round(p.z),
        selected
      );
    }
  }
});

document.addEventListener("contextmenu",e=>e.preventDefault());

/* =========================
   MOVEMENT
========================= */

document.addEventListener("click",()=>document.body.requestPointerLock?.());

function move(){
  if(keys["w"]) camera.position.z -= player.speed;
  if(keys["s"]) camera.position.z += player.speed;
  if(keys["a"]) camera.position.x -= player.speed;
  if(keys["d"]) camera.position.x += player.speed;
}

/* =========================
   PHYSICS
========================= */

function physics(){

  player.velY += gravity;
  camera.position.y += player.velY;

  // ground collision
  if(camera.position.y < 2){
    camera.position.y = 2;
    player.velY = 0;
    player.grounded = true;
  }
}

/* =========================
   MOB (simple chase cube)
========================= */

const mob = new THREE.Mesh(
  new THREE.BoxGeometry(1,1,1),
  new THREE.MeshStandardMaterial({ color:0xff4444 })
);

mob.position.set(5,1,5);
scene.add(mob);

function mobAI(){
  const dx = camera.position.x - mob.position.x;
  const dz = camera.position.z - mob.position.z;
  const dist = Math.sqrt(dx*dx+dz*dz);

  if(dist>1){
    mob.position.x += dx/dist*0.03;
    mob.position.z += dz/dist*0.03;
  }
}

/* =========================
   LOOP
========================= */

function animate(){
  requestAnimationFrame(animate);

  move();
  physics();
  mobAI();

  renderer.render(scene,camera);
}

animate();

/* resize */
window.addEventListener("resize",()=>{
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});
