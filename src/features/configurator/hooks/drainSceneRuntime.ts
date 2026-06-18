import {
  ACESFilmicToneMapping,
  AmbientLight,
  Color,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from "three";

export interface CameraState {
  distance: number;
  zoom: number;
  rotationX: number;
  rotationY: number;
  targetX: number;
  targetY: number;
  autoRotate: boolean;
  pointerX: number;
  pointerY: number;
  dragging: boolean;
}

export interface DrainSceneRuntime {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  topMaterial: MeshStandardMaterial;
  bottomMaterial: MeshStandardMaterial;
  floor: Mesh<PlaneGeometry, MeshStandardMaterial>;
  resizeObserver: ResizeObserver;
  removeContextListener: () => void;
}

export const initialCameraState: CameraState = {
  distance: 22,
  zoom: 1,
  rotationX: 0.5,
  rotationY: 0.58,
  targetX: 0.5,
  targetY: 0.58,
  autoRotate: true,
  pointerX: 0,
  pointerY: 0,
  dragging: false,
};

export function createDrainSceneRuntime(
  canvas: HTMLCanvasElement,
  container: HTMLElement,
  onContextLost: () => void,
): DrainSceneRuntime {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  const scene = new Scene();
  scene.background = new Color(0x0b0e13);
  const camera = new PerspectiveCamera(38, 1, 0.1, 600);
  const topMaterial = new MeshStandardMaterial({
    color: new Color(0.8, 0.8, 0.83),
    metalness: 0.93,
    roughness: 0.13,
  });
  const bottomMaterial = new MeshStandardMaterial({
    color: new Color(0.52, 0.53, 0.56),
    metalness: 0.88,
    roughness: 0.3,
  });
  const floorMaterial = new MeshStandardMaterial({
    color: 0x11151d,
    roughness: 0.97,
    metalness: 0,
  });
  const floor = new Mesh(new PlaneGeometry(400, 400), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  scene.add(new AmbientLight(0x8090b0, 0.3));
  const key = new DirectionalLight(0xffffff, 1.3);
  key.position.set(14, 26, 14);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, {
    left: -20,
    right: 20,
    top: 20,
    bottom: -20,
    near: 0.5,
    far: 80,
  });
  scene.add(key);

  const fill = new DirectionalLight(0x6080ff, 0.42);
  fill.position.set(-12, 7, -9);
  scene.add(fill);
  const rim = new DirectionalLight(0xffe4b0, 0.38);
  rim.position.set(3, 3, -16);
  scene.add(rim);
  const top = new DirectionalLight(0xffffff, 0.5);
  top.position.set(1, 30, 4);
  scene.add(top);

  const resize = () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  const handleContextLost = (event: Event) => {
    event.preventDefault();
    onContextLost();
  };
  canvas.addEventListener("webglcontextlost", handleContextLost);

  return {
    scene,
    camera,
    renderer,
    topMaterial,
    bottomMaterial,
    floor,
    resizeObserver,
    removeContextListener: () =>
      canvas.removeEventListener("webglcontextlost", handleContextLost),
  };
}

export function renderDrainScene(
  runtime: DrainSceneRuntime,
  state: CameraState,
  deltaSeconds: number,
) {
  if (state.autoRotate) {
    state.targetY += 0.24 * deltaSeconds;
  }

  const smoothing = 1 - Math.exp(-9 * deltaSeconds);
  state.rotationX += (state.targetX - state.rotationX) * smoothing;
  state.rotationY += (state.targetY - state.rotationY) * smoothing;

  const distance = state.distance / state.zoom;
  runtime.camera.position.set(
    Math.sin(state.rotationY) * Math.cos(state.rotationX) * distance,
    Math.sin(state.rotationX) * distance,
    Math.cos(state.rotationY) * Math.cos(state.rotationX) * distance,
  );
  runtime.camera.lookAt(0, 0, 0);
  runtime.renderer.render(runtime.scene, runtime.camera);

  return (
    state.autoRotate ||
    Math.abs(state.targetX - state.rotationX) > 0.0005 ||
    Math.abs(state.targetY - state.rotationY) > 0.0005
  );
}

export function disposeDrainSceneRuntime(runtime: DrainSceneRuntime) {
  runtime.resizeObserver.disconnect();
  runtime.removeContextListener();
  runtime.floor.geometry.dispose();
  runtime.floor.material.dispose();
  runtime.topMaterial.dispose();
  runtime.bottomMaterial.dispose();
  runtime.renderer.dispose();
}
