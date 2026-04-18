import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { buildProduct } from '/js/product.js';
import { initScrollAnimator, tick as animatorTick } from '/js/scroll-animator.js';
import { initHero } from '/js/hero.js';

// ── Scene ────────────────────────────────────────────────────────────────────
export const scene = new THREE.Scene();

// ── Camera ───────────────────────────────────────────────────────────────────
export const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 0.5, 5.5);
camera.lookAt(0, 0, 0);

// ── Renderer ─────────────────────────────────────────────────────────────────
const canvas = document.getElementById('three-canvas');
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// ── Lights ────────────────────────────────────────────────────────────────────
const keyLight = new THREE.PointLight(0xc084fc, 3.0, 30);
keyLight.position.set(3, 4, 3);
scene.add(keyLight);

const fillLight = new THREE.PointLight(0x60a5fa, 1.5, 20);
fillLight.position.set(-3, 1, 2);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 0.8);
rimLight.position.set(0, -2, -3);
scene.add(rimLight);

const ambientLight = new THREE.AmbientLight(0x1a0a2e, 0.4);
scene.add(ambientLight);

const groundGlow = new THREE.PointLight(0x7b4fff, 2.0, 15);
groundGlow.position.set(0, -2.5, 0);
scene.add(groundGlow);

// ── Product ───────────────────────────────────────────────────────────────────
const { productGroup, parts } = buildProduct();
scene.add(productGroup);
scene.add(parts.particles);

// ── Bloom post-processing ─────────────────────────────────────────────────────
const isMobile = window.innerWidth < 768;
let composer;

if (!isMobile) {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.55, 0.4, 0.82
  );
  composer.addPass(bloom);
}

// ── Scroll animator + hero ────────────────────────────────────────────────────
initScrollAnimator(parts, productGroup, camera);
initHero();

// ── Resize ────────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (composer) composer.setSize(window.innerWidth, window.innerHeight);

  if (window.innerWidth < 768) {
    productGroup.position.x = 0;
    camera.position.z = 6.5;
  } else {
    productGroup.position.x = 1.2;
    camera.position.z = 5.5;
  }
});

// ── RAF loop ──────────────────────────────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);
  animatorTick(parts, productGroup);
  if (composer) {
    composer.render();
  } else {
    renderer.render(scene, camera);
  }
}
animate();
