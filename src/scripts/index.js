import '../styles/index.scss';

if (process.env.NODE_ENV === 'development') {
  require('../index.html');
}

import { Scene, PerspectiveCamera, WebGLRenderer, AmbientLight, PointLight, AnimationMixer, Clock } from 'three';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import throttle from 'lodash/throttle';
import VirtualScroll from 'virtual-scroll';
import StageGLTF from '/public/stage.gltf';

/**
 * Init
 */

// camera
let camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 1000);
camera.position.z = 5;
// scene
const scene = new Scene();
// renderer
const renderer = new WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animation);
renderer.setClearColor(0xF8EDE3, 1);
document.body.appendChild(renderer.domElement);
// resize
window.addEventListener('resize', throttle(resize, 100), false);

/**
 * Get user scroll Y
 */

let scrollY = 0;
const scroller = new VirtualScroll({ touchMultiplier: 8 });
scroller.on(e => {
  scrollY -= e.deltaY;
});

/**
 * Load GLTF model and hide loading UI
 */

let isLoaded = false;
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);
loader.load(
  StageGLTF,
  (gltf) => {
    console.log(gltf);
    document.querySelector('.loading').style.display = 'none';
    document.querySelector('.tutorial').style.display = 'block';
    initStage(gltf);
    isLoaded = true;
  },
  (xhr) => {
    console.log(( xhr.loaded / xhr.total * 100 ) + '% loaded');
  },
  (error) => {
    console.log('An error happened', error);
  }
);

/**
 * Add stage elements
 */

let animationMixer,
    animationClip,
    animationAction;

function initStage(gltf) {
  // add scene
  scene.add(gltf.scene);
  // replace default camera
  camera = gltf.cameras[0];
  resize();
  // get camera animation
  animationMixer = new AnimationMixer(camera.parent);
  animationClip = gltf.animations[0];
  animationAction = animationMixer.clipAction(animationClip);
  // pause animation
  animationAction.play();
  animationAction.paused = true;
  // illuminate scene
  const ambientLight = new AmbientLight(0xffffff, .8);
  scene.add(ambientLight);
  const pointLight = new PointLight(0xffffff, .2);
  pointLight.position.set(10, -10, 40);
  scene.add(pointLight);
}

/**
 * Loop
 */

const clock = new Clock();
const scrollRatio = 0.00005;
let scrollPercent = 0;
let smoothScrollPercent = 0;

function animation() {
  // convert scroll pixel value to percent
  scrollPercent = scrollY * scrollRatio;
  // smooth scroll percent
  smoothScrollPercent += (scrollPercent - smoothScrollPercent) * 0.05;
  // update animation time
  if (isLoaded) {
    const percent = smoothScrollPercent % 1;
    animationAction.paused = false;
    animationMixer.setTime(animationClip.duration * percent);
    animationAction.paused = true;
    animationMixer.update( clock.getDelta() );
  }
  // render
  renderer.render(scene, camera);
}

/**
 * Resize
 */
function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}
