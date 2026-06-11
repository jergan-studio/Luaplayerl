import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js";
import { PointerLockControls } from "https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/controls/PointerLockControls.js";

/* scene */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

/* controls */
const controls = new PointerLockControls(camera, document.body);
document.addEventListener("click", () => controls.lock());

camera.position.set(0,2,5);

/* lighting */
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10,20,10);
scene.add(light);

/* blocks */
const blocks = [];
const geo = new THREE.BoxGeometry(1,1,1);
const mat = new THREE.MeshStandardMaterial({ color: 0x55aa55 });

function addBlock(x,y,z){
  const b = new THREE.Mesh(geo, mat);
  b.position.set(x,y,z);
  scene.add(b);
  blocks.push(b);
}

/* world */
for(let x=-10;x<=10;x++){
  for(let z=-10;z<=10;z++){
    addBlock(x,0,z);
  }
}

/* movement */
const keys = {};
document.addEventListener("keydown",e=>keys[e.key.toLowerCase()]=true);
document.addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);

/* loop */
function animate(){
  requestAnimationFrame(animate);

  if(controls.isLocked){
    if(keys["w"]) controls.moveForward(0.1);
    if(keys["s"]) controls.moveForward(-0.1);
    if(keys["a"]) controls.moveRight(-0.1);
    if(keys["d"]) controls.moveRight(0.1);
  }

  renderer.render(scene,camera);
}
animate();
