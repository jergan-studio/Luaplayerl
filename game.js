import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js";
import { PointerLockControls } from "https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/controls/PointerLockControls.js";

/* =========================
   SCENE
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
   FPS CONTROLS (IMPORTANT)
========================= */

const controls = new PointerLockControls(camera, document.body);
document.addEventListener("click", () => controls.lock());

camera.position.set(0,2,5);

/* =========================
   VOXEL WORLD
========================= */

const geo = new THREE.BoxGeometry(1,1,1);

const mats = {
  grass: new THREE.MeshStandardMaterial({ color:0x55aa55 }),
  dirt: new THREE.MeshStandardMaterial({ color:0x8b5a2b }),
  stone: new THREE.MeshStandardMaterial({ color:0x888888 })
};

const blocks = [];

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
   PHYSICS
========================= */

let velocityY = 0;
let grounded = false;

const gravity = -0.02;
const jumpPower = 0.35;

/* =========================
   INPUT
========================= */

const keys = {};

document.addEventListener("keydown",(e)=>{
  keys[e.key.toLowerCase()] = true;

  if(e.key===" ") {
    if(grounded){
      velocityY = jumpPower;
      grounded = false;
    }
  }
});

document.addEventListener("keyup",(e)=>{
  keys[e.key.toLowerCase()] = false;
});

/* =========================
   RAYCAST (REAL 3D INTERACTION)
========================= */

const ray = new THREE.Raycaster();
let selected = "grass";

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
    const pos = hit.object.position.clone().add(hit.face.normal);
    addBlock(Math.round(pos.x),Math.round(pos.y),Math.round(pos.z),selected);
  }
});

document.addEventListener("contextmenu",e=>e.preventDefault());

/* =========================
   MOVEMENT (REAL FPS)
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
   PHYSICS LOOP
========================= */

function physics(){

  velocityY += gravity;
  camera.position.y += velocityY;

  if(camera.position.y < 2){
    camera.position.y = 2;
    velocityY = 0;
    grounded = true;
  }
}

/* =========================
   LOOP
========================= */

function animate(){
  requestAnimationFrame(animate);

  move();
  physics();

  renderer.render(scene,camera);
}

animate();

/* resize */
window.addEventListener("resize",()=>{
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});
