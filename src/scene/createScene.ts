import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { CabinetParams } from '../state/params';
import { buildCabinet, disposeObject } from './buildCabinet';

export interface SceneHandle {
  setCabinet: (params: CabinetParams) => void;
  /** Aims the camera at the vertical middle of a cabinet of the given height (meters). */
  frameHeight: (height: number) => void;
  dispose: () => void;
}

export function createScene(container: HTMLElement): SceneHandle {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x15171c);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
  camera.position.set(1.8, 1.6, 2.4);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.85, 0);
  controls.enableDamping = true;
  controls.update();

  scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3f4a, 1.2));
  const sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.position.set(2, 4, 3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -2;
  sun.shadow.camera.right = 2;
  sun.shadow.camera.top = 2;
  sun.shadow.camera.bottom = -2;
  scene.add(sun);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.ShadowMaterial({ opacity: 0.35 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(10, 100, 0x3a3f4a, 0x262a33);
  grid.position.y = 0.0005;
  scene.add(grid);

  let cabinet: THREE.Group | null = null;

  // The canvas tracks its container, so splitter drags and window resizes both apply.
  const resize = () => {
    const { clientWidth, clientHeight } = container;
    if (clientWidth === 0 || clientHeight === 0) return;
    renderer.setSize(clientWidth, clientHeight);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  renderer.setAnimationLoop(() => {
    controls.update();
    renderer.render(scene, camera);
  });

  return {
    setCabinet(params) {
      if (cabinet) {
        scene.remove(cabinet);
        disposeObject(cabinet);
      }
      cabinet = buildCabinet(params);
      scene.add(cabinet);
    },
    frameHeight(height) {
      // Shift camera and target together so the user's orbit angle is preserved.
      const dy = height / 2 - controls.target.y;
      controls.target.y += dy;
      camera.position.y += dy;
      controls.update();
    },
    dispose() {
      renderer.setAnimationLoop(null);
      observer.disconnect();
      controls.dispose();
      disposeObject(scene);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
