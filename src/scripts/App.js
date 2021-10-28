import { Scene, PerspectiveCamera, WebGLRenderer, AmbientLight, PointLight, AnimationMixer, Clock } from 'three';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import throttle from 'lodash/throttle';
import VirtualScroll from 'virtual-scroll';
import StageGLTF from '/public/stage.gltf';

class App {
  constructor() {
    this.initThree();
    this.loadStage();
  }

  /**
   * Add three elements
   */
  initThree = () => {
    this.camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 1000);
    this.camera.position.z = 5;
    this.scene = new Scene();
    this.clock = new Clock();
    this.renderer = new WebGLRenderer({
      antialias: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setAnimationLoop(this.animation);
    this.renderer.setClearColor(0xF8EDE3, 1);
    document.body.appendChild(this.renderer.domElement);
    window.addEventListener('resize', throttle(this.resize, 100), false);
  }

  /**
   * Load GLTF model and hide loading UI
   */
  loadStage = () => {
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    loader.setDRACOLoader(dracoLoader);
    loader.load(
      StageGLTF,
      (gltf) => {
        console.log(gltf);
        document.querySelector('.loading').style.display = 'none';
        document.querySelector('.tutorial').style.display = 'block';
        this.initStage(gltf.scene, gltf.cameras[0], gltf.animations[0]);
      },
      (xhr) => {
        console.log(( xhr.loaded / xhr.total * 100 ) + '% loaded');
      },
      (error) => {
        console.log('An error happened', error);
      }
    );
  }

  /**
   * Add stage elements
   */
  initStage = (stage, camera, animation) => {
    this.scene.add(stage);
    // illuminate stage
    const ambientLight = new AmbientLight(0xffffff, .8);
    this.scene.add(ambientLight);
    const pointLight = new PointLight(0xffffff, .2);
    pointLight.position.set(10, -10, 40);
    this.scene.add(pointLight);
    // replace default camera
    this.camera = camera;
    this.resize();
    // get camera animation and pause at start
    this.animationMixer = new AnimationMixer(this.camera.parent);
    this.animationClip = animation;
    this.animationAction = this.animationMixer.clipAction(this.animationClip);
    this.animationAction.play();
    this.animationAction.paused = true;
    // start scroll detect
    this.initScroll();
  }

  /**
   * Get user virtual scroll value
   */
  initScroll = () => {
    const scroller = new VirtualScroll({
      touchMultiplier: 8,
    });
    const scrollRatio = 0.00005;
    this.scrollPercent = 0;
    this.smoothScrollPercent = 0;
    scroller.on(e => {
      this.scrollPercent += -e.deltaY * scrollRatio;
      // this.scrollPercent = Math.min(Math.max(this.scrollPercent, 0), 1);
    });
  }

  /**
   * Loop
   */
  animation = () => {
    if (this.animationMixer) {
      // smooth scroll animation
      this.smoothScrollPercent += (this.scrollPercent - this.smoothScrollPercent) * 0.05;
      // update animation time
      this.animationAction.paused = false;
      this.animationMixer.setTime(this.animationClip.duration * (this.smoothScrollPercent % 1));
      this.animationAction.paused = true;
      this.animationMixer.update( this.clock.getDelta() );
    }
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Resize
   */
  resize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize( window.innerWidth, window.innerHeight );
  }
}

export default App;
