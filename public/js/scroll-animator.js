import * as THREE from 'three';

let targetT = 0;
let currentT = 0;
let autoRotY = 0;

function getScrollProgress() {
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  if (maxScroll <= 0) return 0;
  return Math.min(window.scrollY / maxScroll, 1.0);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function rangeProgress(t, start, end) {
  const clamped = Math.max(0, Math.min(1, (t - start) / (end - start)));
  return easeInOutCubic(clamped);
}

export function initScrollAnimator(parts, productGroup, camera) {
  window.addEventListener('scroll', () => {
    targetT = getScrollProgress();
  }, { passive: true });
}

export function tick(parts, productGroup) {
  currentT = lerp(currentT, targetT, 0.055);
  applyScrollState(currentT, parts, productGroup);
}

function applyScrollState(t, parts, productGroup) {
  const {
    tubBody, labelWrap, lid, lidTop, lidRim,
    scoopHandle, scoopBowl, baseRing,
    particles, angles, radii, elevs, speeds, dummy, COUNT,
  } = parts;

  // Phase 1: Rise (0.10 → 0.30) — group lifts
  const p1 = rangeProgress(t, 0.10, 0.30);
  const groupY = lerp(-0.2, 0.4, p1);

  // Phase 2: Explode (0.30 → 0.70)
  const p2 = rangeProgress(t, 0.30, 0.70);

  // Phase 3: Sink (0.70 → 1.00)
  const p3 = rangeProgress(t, 0.70, 1.00);
  const sinkY = lerp(0, -2.8, p3);

  productGroup.position.y = groupY + sinkY;

  // subtle x drift during sink
  productGroup.position.x = lerp(window.innerWidth < 768 ? 0 : 1.2, 0.6, p3);

  // ── Tub body: drops slightly down ────────────────────────────────────────
  tubBody.position.y   = lerp(0,    -0.65, p2);
  labelWrap.position.y = lerp(-0.01,-0.66, p2);
  labelWrap.rotation.y = lerp(0,     0.35, p2);

  // ── Lid: flies up ─────────────────────────────────────────────────────────
  lid.position.y    = lerp(1.03,  2.85, p2);
  lid.rotation.y    = lerp(0,     0.85, p2);
  lid.rotation.x    = lerp(0,     0.18, p2);

  lidTop.position.y = lerp(1.162, 3.012, p2);
  lidTop.rotation.y = lid.rotation.y;
  lidTop.rotation.x = lid.rotation.x;

  // ── Lid rim: follows lid partway ──────────────────────────────────────────
  lidRim.position.y = lerp(0.9,   2.45, p2);
  lidRim.rotation.z = lerp(Math.PI / 2, Math.PI / 2 + 0.6, p2);

  // ── Scoop: flies out to the right ─────────────────────────────────────────
  scoopHandle.position.x = lerp(0.22, 1.85, p2);
  scoopHandle.position.y = lerp(0.62, 1.55, p2);
  scoopHandle.position.z = lerp(0,    0.85, p2);
  scoopHandle.rotation.z = lerp(0.42, 1.15, p2);

  scoopBowl.position.x   = lerp(0.22, 1.85, p2);
  scoopBowl.position.y   = lerp(0.52, 1.22, p2);
  scoopBowl.position.z   = lerp(0,    0.85, p2);
  scoopBowl.rotation.y   = lerp(0,    1.2,  p2);

  // ── Base ring: falls down ─────────────────────────────────────────────────
  baseRing.position.y    = lerp(-0.9, -2.25, p2);
  baseRing.rotation.x    = lerp(-Math.PI / 2, -1.05, p2);
  baseRing.rotation.z    = lerp(0, 0.35, p2);

  // ── Auto-rotation — slows during explode, resumes during sink ─────────────
  const rotSpeed = lerp(lerp(0.004, 0.0004, p2), 0.002, p3);
  autoRotY += rotSpeed;
  productGroup.rotation.y = autoRotY;

  // ── Particle orbits ───────────────────────────────────────────────────────
  const explodeScale = 1 + p2 * 1.6;
  const worldPos = new THREE.Vector3();
  productGroup.getWorldPosition(worldPos);

  for (let i = 0; i < COUNT; i++) {
    angles[i] += speeds[i];
    const r = radii[i] * explodeScale;
    dummy.position.set(
      worldPos.x + Math.cos(angles[i]) * r,
      worldPos.y + elevs[i] + p2 * (Math.random() - 0.5) * 0.02,
      worldPos.z + Math.sin(angles[i]) * r
    );
    const s = 0.5 + p2 * 0.8;
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    particles.setMatrixAt(i, dummy.matrix);
  }
  particles.instanceMatrix.needsUpdate = true;
}
