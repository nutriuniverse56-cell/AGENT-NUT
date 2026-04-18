import * as THREE from 'three';

function makeCanvasLabel() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#10032a');
  grad.addColorStop(1, '#060614');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);

  // accent stripes
  ctx.fillStyle = '#7b4fff';
  ctx.fillRect(0, 36, 1024, 6);
  ctx.fillRect(0, 470, 1024, 6);

  // thin hot stripe
  ctx.fillStyle = '#c84bff';
  ctx.fillRect(0, 44, 1024, 2);
  ctx.fillRect(0, 466, 1024, 2);

  // brand name
  ctx.font = 'bold 88px Inter, Arial';
  ctx.fillStyle = '#f0eeff';
  ctx.textAlign = 'center';
  ctx.fillText('NUTRIUNIVERSE', 512, 195);

  // product name
  ctx.font = '300 40px Inter, Arial';
  ctx.fillStyle = '#c084fc';
  ctx.letterSpacing = '0.2em';
  ctx.fillText('PERFORMANCE FORMULA', 512, 270);

  // macros
  ctx.font = 'bold 30px Inter, Arial';
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.85;
  ctx.fillText('25g PROTEIN  ·  5g BCAA  ·  2g CREATINE', 512, 360);
  ctx.globalAlpha = 1;

  // serving info
  ctx.font = '300 22px Inter, Arial';
  ctx.fillStyle = '#8b82b3';
  ctx.fillText('30 SERVINGS  ·  NET WT 600g', 512, 428);

  return new THREE.CanvasTexture(canvas);
}

export function buildProduct() {
  const productGroup = new THREE.Group();
  productGroup.position.set(1.2, -0.2, 0);

  // ── Materials ──────────────────────────────────────────────────────────────
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x0d0b18,
    metalness: 0.2,
    roughness: 0.55,
  });

  const labelMat = new THREE.MeshStandardMaterial({
    map: makeCanvasLabel(),
    metalness: 0.05,
    roughness: 0.45,
    emissive: new THREE.Color(0x2a0550),
    emissiveIntensity: 0.25,
    side: THREE.DoubleSide,
  });

  const lidMat = new THREE.MeshStandardMaterial({
    color: 0x6d28d9,
    metalness: 0.82,
    roughness: 0.12,
    envMapIntensity: 2.0,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xccccdd,
    metalness: 1.0,
    roughness: 0.04,
    envMapIntensity: 2.5,
  });

  const scoopMat = new THREE.MeshStandardMaterial({
    color: 0xe8e0ff,
    metalness: 0.05,
    roughness: 0.7,
  });

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x1e1638,
    metalness: 0.55,
    roughness: 0.35,
  });

  // ── Tub body ───────────────────────────────────────────────────────────────
  const tubBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.70, 0.72, 1.8, 64, 1, false),
    bodyMat
  );
  tubBody.castShadow = true;
  productGroup.add(tubBody);

  // ── Label wrap ─────────────────────────────────────────────────────────────
  const labelWrap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.706, 0.726, 1.38, 64, 1, true),
    labelMat
  );
  labelWrap.position.y = -0.01;
  productGroup.add(labelWrap);

  // ── Lid ────────────────────────────────────────────────────────────────────
  const lid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.72, 0.72, 0.26, 64, 1, false),
    lidMat
  );
  lid.position.y = 1.03;
  lid.castShadow = true;
  productGroup.add(lid);

  // ── Lid top disc (extra sheen) ─────────────────────────────────────────────
  const lidTop = new THREE.Mesh(
    new THREE.CircleGeometry(0.72, 64),
    new THREE.MeshStandardMaterial({ color: 0x7c3aed, metalness: 0.9, roughness: 0.08 })
  );
  lidTop.rotation.x = -Math.PI / 2;
  lidTop.position.y = 1.162;
  productGroup.add(lidTop);

  // ── Lid rim (chrome torus) ─────────────────────────────────────────────────
  const lidRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.72, 0.028, 16, 64),
    chromeMat
  );
  lidRim.position.y = 0.9;
  lidRim.rotation.x = Math.PI / 2;
  productGroup.add(lidRim);

  // ── Scoop handle ───────────────────────────────────────────────────────────
  const scoopHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.78, 12),
    scoopMat
  );
  scoopHandle.position.set(0.22, 0.62, 0);
  scoopHandle.rotation.z = 0.42;
  productGroup.add(scoopHandle);

  // ── Scoop bowl ─────────────────────────────────────────────────────────────
  const scoopBowl = new THREE.Mesh(
    new THREE.SphereGeometry(0.17, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    scoopMat
  );
  scoopBowl.position.set(0.22, 0.52, 0);
  productGroup.add(scoopBowl);

  // ── Base ring ──────────────────────────────────────────────────────────────
  const baseRing = new THREE.Mesh(
    new THREE.RingGeometry(0.64, 0.72, 64),
    baseMat
  );
  baseRing.rotation.x = -Math.PI / 2;
  baseRing.position.y = -0.9;
  productGroup.add(baseRing);

  // ── Orbiting particles (InstancedMesh) ─────────────────────────────────────
  const COUNT = 200;
  const particleMat = new THREE.MeshStandardMaterial({
    color: 0x9f7fff,
    emissive: new THREE.Color(0x7b4fff),
    emissiveIntensity: 0.8,
    metalness: 0.2,
    roughness: 0.4,
  });
  const particles = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.012, 6, 6),
    particleMat,
    COUNT
  );
  particles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  const dummy = new THREE.Object3D();
  const angles = new Float32Array(COUNT);
  const radii  = new Float32Array(COUNT);
  const elevs  = new Float32Array(COUNT);
  const speeds = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    angles[i] = Math.random() * Math.PI * 2;
    radii[i]  = 1.1 + Math.random() * 1.4;
    elevs[i]  = (Math.random() - 0.5) * 3.0;
    speeds[i] = (0.003 + Math.random() * 0.006) * (Math.random() < 0.5 ? 1 : -1);
  }

  // particles added to scene by scene.js

  const parts = {
    tubBody, labelWrap, lid, lidTop, lidRim,
    scoopHandle, scoopBowl, baseRing,
    particles, angles, radii, elevs, speeds, dummy, COUNT,
  };

  return { productGroup, parts };
}
