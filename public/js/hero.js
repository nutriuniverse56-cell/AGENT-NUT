function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function rangeProgress(t, start, end) {
  const clamped = Math.max(0, Math.min(1, (t - start) / (end - start)));
  return easeInOutCubic(clamped);
}

function getScrollProgress() {
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  if (maxScroll <= 0) return 0;
  return Math.min(window.scrollY / maxScroll, 1.0);
}

export function initHero() {
  const headline   = document.querySelector('.hero-headline');
  const eyebrow    = document.querySelector('.hero-eyebrow');
  const subText    = document.querySelector('.hero-sub');
  const ctaBtn     = document.querySelector('.cta-btn');
  const scrollHint = document.getElementById('scroll-hint');

  if (!headline) return;

  function onScroll() {
    const t = getScrollProgress();

    // Headline: drifts up and fades through early explode phase
    const hP = rangeProgress(t, 0, 0.30);
    headline.style.transform = `translateY(${-hP * 70}px)`;
    headline.style.opacity   = String(Math.max(0, 1 - rangeProgress(t, 0.05, 0.28) * 1.3));

    eyebrow.style.transform = `translateY(${-hP * 50}px)`;
    eyebrow.style.opacity   = headline.style.opacity;

    // Sub-text fades slightly after headline
    subText.style.transform = `translateY(${-rangeProgress(t, 0.02, 0.32) * 55}px)`;
    subText.style.opacity   = String(Math.max(0, 1 - rangeProgress(t, 0.08, 0.32) * 1.3));

    // CTA: fades out as product sinks
    const ctaOpacity = Math.max(0, 1 - rangeProgress(t, 0.62, 0.88));
    ctaBtn.style.opacity     = String(ctaOpacity);
    ctaBtn.style.pointerEvents = ctaOpacity < 0.05 ? 'none' : 'auto';

    // Scroll hint: gone after first 6% scroll
    scrollHint.style.opacity = String(Math.max(0, 1 - rangeProgress(t, 0, 0.06) * 2));
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // set initial transition for smooth feel
  [headline, eyebrow, subText].forEach(el => {
    el.style.transition = 'opacity 0.05s, transform 0.05s';
  });
}
