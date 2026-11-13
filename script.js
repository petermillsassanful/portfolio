/**
 * script.js — Peter Mills Assanful Portfolio
 * Phase 1: Hero canvas animation, nav scroll behaviour,
 *          hamburger menu, and Intersection Observer reveals.
 *
 * Zero dependencies — vanilla ES2022+.
 */

'use strict';

/* ===============================================================
   1. HERO CANVAS — Animated grid + floating particles
   A dark, security-tinted scene: dotted grid lines suggesting
   a network/SOC monitoring dashboard, with drifting particles
   and occasional "scan pulse" rings radiating from the origin.
   =============================================================== */

(function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // --- Mobile detection & power saving ---
  const isMobile = window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // --- Configuration ---
  const CFG = {
    grid: {
      cellSize: 60,          // px between grid nodes
      dotRadius: 1.2,        // radius of node dots
      lineOpacity: 0.06,     // grid line opacity
      dotOpacity: 0.18,      // node dot opacity
    },
    particles: {
      count: isMobile ? 22 : 55, // reduced count on mobile to conserve CPU/battery
      maxRadius: 2.2,
      minRadius: 0.4,
      speed: 0.3,            // base drift speed
      opacity: 0.45,
    },
    pulse: {
      interval: 3200,        // ms between pulses
      maxRadius: 350,
      speed: 1.8,            // px per frame
      lineWidth: 1.5,
    },
    colors: {
      accent: '45, 127, 255',    // RGB string for rgba()
      faint:  '255, 255, 255',   // dim grid lines / dots
    },
  };

  // --- Resize ---
  let W, H;

  function resize() {
    const hero = document.getElementById('hero');
    const newW = hero ? hero.offsetWidth  : window.innerWidth;
    const newH = hero ? hero.offsetHeight : window.innerHeight;

    // Ignore tiny resizes caused by mobile address bar expansion/collapse
    if (W && H && Math.abs(newW - W) < 5 && Math.abs(newH - H) < 15) return;

    W = canvas.width  = newW;
    H = canvas.height = newH;

    if (prefersReducedMotion.matches && typeof particles !== 'undefined' && particles.length) {
      drawStaticFrame();
    }
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(document.getElementById('hero') || document.body);
  resize();

  // --- Particles ---
  class Particle {
    constructor() { this.reset(true); }

    reset(initial = false) {
      this.x   = Math.random() * W;
      this.y   = initial ? Math.random() * H : (Math.random() < 0.5 ? -10 : H + 10);
      this.r   = CFG.particles.minRadius + Math.random() * (CFG.particles.maxRadius - CFG.particles.minRadius);
      this.vx  = (Math.random() - 0.5) * CFG.particles.speed;
      this.vy  = (Math.random() - 0.5) * CFG.particles.speed;
      /* Ensure some vertical drift so they actually move */
      if (Math.abs(this.vy) < 0.08) this.vy = 0.12 * (Math.random() < 0.5 ? 1 : -1);
      this.opacity = 0.08 + Math.random() * CFG.particles.opacity;
      this.twinkle = Math.random() * Math.PI * 2; // phase offset for breathing effect
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.twinkle += 0.018;

      if (this.x < -20 || this.x > W + 20 || this.y < -20 || this.y > H + 20) {
        this.reset();
      }
    }

    draw() {
      const breathing = 0.6 + 0.4 * Math.sin(this.twinkle);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${CFG.colors.accent}, ${this.opacity * breathing})`;
      ctx.fill();
    }
  }

  const particles = Array.from({ length: CFG.particles.count }, () => new Particle());

  // --- Pulse Rings ---
  class PulseRing {
    constructor() {
      /* Spawn near center, slight random offset */
      this.x = W * (0.4 + Math.random() * 0.2);
      this.y = H * (0.35 + Math.random() * 0.2);
      this.r = 0;
      this.alive = true;
    }

    update() {
      this.r += CFG.pulse.speed;
      if (this.r > CFG.pulse.maxRadius) this.alive = false;
    }

    draw() {
      const progress = this.r / CFG.pulse.maxRadius;  // 0 → 1
      const alpha = (1 - progress) * 0.25;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${CFG.colors.accent}, ${alpha})`;
      ctx.lineWidth = CFG.pulse.lineWidth * (1 - progress * 0.5);
      ctx.stroke();
    }
  }

  const pulseRings = [];
  let lastPulse = 0;

  // --- Grid drawing ---
  function drawGrid() {
    const { cellSize, dotRadius, lineOpacity, dotOpacity } = CFG.grid;
    const cols = Math.ceil(W / cellSize) + 1;
    const rows = Math.ceil(H / cellSize) + 1;

    // Vertical lines
    ctx.strokeStyle = `rgba(${CFG.colors.faint}, ${lineOpacity})`;
    ctx.lineWidth = 0.5;
    for (let c = 0; c < cols; c++) {
      const x = c * cellSize;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }

    // Horizontal lines
    for (let r = 0; r < rows; r++) {
      const y = r * cellSize;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Node dots at intersections
    ctx.fillStyle = `rgba(${CFG.colors.faint}, ${dotOpacity})`;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        ctx.beginPath();
        ctx.arc(c * cellSize, r * cellSize, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // --- Static frame for reduced motion fallback ---
  function drawStaticFrame() {
    ctx.clearRect(0, 0, W, H);
    drawGrid();
    particles.slice(0, 16).forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${CFG.colors.accent}, 0.25)`;
      ctx.fill();
    });
  }

  // --- Animation loop ---
  let animationId = null;
  let isAnimating = false;
  let isHeroVisible = true;
  let then = performance.now();
  // 30 FPS cap on mobile to save battery; 60 FPS on desktop
  const FPS_CAP = isMobile ? 30 : 60;
  const FRAME_MS = 1000 / FPS_CAP;

  // --- Matrix rain ---
  const matrixChars = "0101101001010101001011010010101010101001010101010110101010101010101010101".split("");
  const fontSize = 14;
  let columns = [];

  function initMatrixRain() {
    columns = [];
    const colCount = Math.floor(W / fontSize) + 1;
    for (let i = 0; i < colCount; i++) {
      columns.push({
        x: i * fontSize,
        y: Math.random() * -H,
        speed: 1.5 + Math.random() * 3
      });
    }
  }

  function drawMatrixRain() {
    ctx.fillStyle = 'rgba(8, 12, 20, 0.08)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#00ff66';
    ctx.font = `bold ${fontSize}px var(--font-mono)`;

    columns.forEach(col => {
      const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
      ctx.fillText(char, col.x, col.y);
      col.y += col.speed * 2.5;

      if (col.y > H && Math.random() > 0.975) {
        col.y = 0;
        col.speed = 1.5 + Math.random() * 3;
      }
    });
  }

  function animate(now) {
    if (!isAnimating) return;
    animationId = requestAnimationFrame(animate);

    /* FPS cap to avoid burning GPU/battery */
    const delta = now - then;
    if (delta < FRAME_MS) return;
    then = now - (delta % FRAME_MS);

    if (window.isMatrixMode) {
      if (columns.length === 0) initMatrixRain();
      drawMatrixRain();
      return;
    }

    /* Clear */
    ctx.clearRect(0, 0, W, H);

    /* Particles */
    particles.forEach(p => { p.update(); p.draw(); });

    /* Pulse rings: spawn on interval */
    if (now - lastPulse > CFG.pulse.interval) {
      pulseRings.push(new PulseRing());
      lastPulse = now;
    }

    /* Update + draw rings, remove dead ones */
    for (let i = pulseRings.length - 1; i >= 0; i--) {
      pulseRings[i].update();
      pulseRings[i].draw();
      if (!pulseRings[i].alive) pulseRings.splice(i, 1);
    }
  }

  function startAnimation() {
    if (isAnimating || prefersReducedMotion.matches || document.hidden || !isHeroVisible) return;
    isAnimating = true;
    then = performance.now();
    animationId = requestAnimationFrame(animate);
  }

  function stopAnimation() {
    isAnimating = false;
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  // --- Reduced motion handling with live listener ---
  function handleReducedMotionChange() {
    if (prefersReducedMotion.matches) {
      stopAnimation();
      drawStaticFrame();
    } else {
      startAnimation();
    }
  }

  prefersReducedMotion.addEventListener('change', handleReducedMotionChange);

  // --- IntersectionObserver: Pause canvas when hero is scrolled out of viewport ---
  const heroEl = document.getElementById('hero');
  if (heroEl && 'IntersectionObserver' in window) {
    const heroObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isHeroVisible = entry.isIntersecting;
        if (isHeroVisible) {
          startAnimation();
        } else {
          stopAnimation(); // Free GPU/CPU completely when reading below hero
        }
      });
    }, { threshold: 0 });

    heroObserver.observe(heroEl);
  }

  /* Pause animation when tab is hidden (performance) */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAnimation();
    } else if (isHeroVisible) {
      startAnimation();
    }
  });

  // Start or render static frame
  if (prefersReducedMotion.matches) {
    drawStaticFrame();
  } else {
    startAnimation();
  }
})();


/* ===============================================================
   1b. TYPEWRITER — Name animation (Peter / Mills / Assanful)
   Sequences through the three headline lines character by character
   with a natural, slightly-randomised typing speed.
   =============================================================== */

(function initTypewriter() {
  const lines = [
    { el: document.getElementById('typewriter-line-1'), text: 'Peter' },
    { el: document.getElementById('typewriter-line-2'), text: 'Mills' },
    { el: document.getElementById('typewriter-line-3'), text: 'Assanful' },
  ];
  const cursor = document.getElementById('typewriter-cursor');

  /* Bail if any element is missing */
  if (!lines.every(l => l.el) || !cursor) return;

  /* Move cursor into line-1 initially (before any typing) */
  lines[0].el.appendChild(cursor);

  const BASE_DELAY   = 90;   // ms per character (base)
  const JITTER       = 40;   // ± random jitter for natural feel
  const LINE_PAUSE   = 260;  // ms pause between finishing one line & starting next
  const START_DELAY  = 700;  // ms before typing begins (lets reveal animation settle)
  const DONE_LINGER  = 800;  // ms cursor stays visible after typing finishes

  function randomDelay() {
    return BASE_DELAY + (Math.random() * JITTER * 2 - JITTER);
  }

  function typeLine(lineIndex, charIndex, onDone) {
    const { el, text } = lines[lineIndex];

    if (charIndex === 0) {
      /* Ensure cursor is at the end of this line */
      el.appendChild(cursor);
    }

    if (charIndex < text.length) {
      /* Insert the next character as a text node before the cursor */
      const textNode = document.createTextNode(text[charIndex]);
      el.insertBefore(textNode, cursor);
      setTimeout(() => typeLine(lineIndex, charIndex + 1, onDone), randomDelay());
    } else {
      /* Line done — move on */
      onDone();
    }
  }

  function typeAllLines(index) {
    if (index >= lines.length) {
      /* All done — hide cursor after a brief linger */
      setTimeout(() => cursor.classList.add('is-done'), DONE_LINGER);
      return;
    }

    typeLine(index, 0, () => {
      setTimeout(() => typeAllLines(index + 1), LINE_PAUSE);
    });
  }

  /* Respect reduced-motion preference */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (prefersReducedMotion.matches) {
    lines.forEach(({ el, text }) => {
      el.appendChild(cursor);           // move cursor to last line
      el.insertBefore(document.createTextNode(text), cursor);
    });
    cursor.classList.add('is-done');
    return;
  }

  setTimeout(() => typeAllLines(0), START_DELAY);
})();


/* ===============================================================
   2. INTERSECTION OBSERVER — Section reveal system (Phase 1+2+)
   Handles all .reveal-item elements across every section.

   Strategy:
   - Hero items: stagger by sequential index (Phase 1 behaviour).
   - About + Skills cards: each data-reveal-group gets its OWN
     per-group stagger counter so the delay resets to 0 at the
     start of each new section's batch.
   - Uses data-skill-index on skill cards for precise timing.
   - Native CSS scroll-driven animations applied as progressive
     enhancement for browsers that support them (Chrome/Edge 115+).
   - Falls back to IntersectionObserver for Firefox and older browsers.
   =============================================================== */

(function initRevealObserver() {
  /* Respect reduced-motion preference — skip animations entirely */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (prefersReducedMotion.matches) {
    document.querySelectorAll('.reveal-item').forEach(el => el.classList.add('is-visible'));
    return;
  }

  const STAGGER_MS       = 120;   // ms between sequential hero items
  const CARD_STAGGER_MS  = 80;    // tighter stagger for skill cards (grid)
  const GROUP_BASE_DELAY = 0;     // each group resets to 0ms base

  /* ── Track per-group indices so stagger is local to each section ── */
  const groupCounters = {};

  /* ── IntersectionObserver (primary for Firefox, fallback elsewhere) ── */
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const el    = entry.target;
        const group = el.dataset.revealGroup;   // e.g. "hero", "about", "skills"

        let delay;

        if (group === 'skills') {
          /* Skill cards use data-skill-index for grid stagger */
          const cardIdx = parseInt(el.dataset.skillIndex ?? '0', 10);
          delay = GROUP_BASE_DELAY + cardIdx * CARD_STAGGER_MS;
        } else if (group) {
          /* Named group — stagger within the group */
          if (groupCounters[group] === undefined) groupCounters[group] = 0;
          delay = GROUP_BASE_DELAY + groupCounters[group] * STAGGER_MS;
          groupCounters[group]++;
        } else {
          /* Hero items (no group set in Phase 1) */
          const index = parseInt(el.dataset.revealIndex ?? '0', 10);
          delay = index * STAGGER_MS;
        }

        el.style.transitionDelay = `${delay}ms`;
        el.classList.add('is-visible');

        /* Unobserve — reveals fire once only */
        observer.unobserve(el);
      });
    },
    {
      root: null,
      threshold: 0.08,
      rootMargin: '0px 0px -48px 0px',
    }
  );

  /* ── Hero items: reveal immediately with stagger — they're in the viewport on load ── */
  document.querySelectorAll('#hero-content .reveal-item').forEach((el, index) => {
    const delay = index * STAGGER_MS;
    el.style.transitionDelay = `${delay}ms`;
    // Double-rAF ensures the browser has painted opacity:0 before we flip to is-visible
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.classList.add('is-visible');
      });
    });
  });

  /* ── Observe all non-hero reveal items (Phase 2+) ── */
  document.querySelectorAll('.reveal-item:not(#hero-content .reveal-item)').forEach(el => {
    observer.observe(el);
  });

  /* Export for future phases */
  window._portfolioRevealObserver = observer;
})();




/* ===============================================================
   3. NAVIGATION — Scroll shadow + active link highlighting
   =============================================================== */

(function initNav() {
  const header   = document.querySelector('.nav-header');
  const navLinks = document.querySelectorAll('.nav-link');

  if (!header) return;

  /* Add scrolled class for elevated nav styling — throttled with requestAnimationFrame */
  let scrollTicking = false;
  let isScrolled = false;

  const updateNavScroll = () => {
    const shouldBeScrolled = window.scrollY > 30;
    if (shouldBeScrolled !== isScrolled) {
      isScrolled = shouldBeScrolled;
      header.classList.toggle('scrolled', isScrolled);
    }
    scrollTicking = false;
  };

  const scrollHandler = () => {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(updateNavScroll);
    }
  };

  window.addEventListener('scroll', scrollHandler, { passive: true });
  updateNavScroll(); /* Run once on init */

  /* Highlight the nav link whose section is in view */
  const sections = document.querySelectorAll('section[id]');

  if (!sections.length) return;

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.getAttribute('id');
        navLinks.forEach((link) => {
          link.classList.toggle(
            'nav-link--active',
            link.getAttribute('href') === `#${id}`
          );
        });
      });
    },
    {
      root: null,
      threshold: 0.5,
    }
  );

  sections.forEach((section) => sectionObserver.observe(section));
})();


/* ===============================================================
   4. HAMBURGER MENU — Mobile overlay open/close
   =============================================================== */

(function initHamburger() {
  const btn         = document.getElementById('hamburger-btn');
  const menu        = document.getElementById('mobile-menu');
  const mobileLinks = menu?.querySelectorAll('.mobile-menu__link');
  const body        = document.body;

  if (!btn || !menu) return;

  let isOpen = false;

  function openMenu() {
    isOpen = true;
    btn.classList.add('is-open');
    menu.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', 'Close navigation menu');
    menu.setAttribute('aria-hidden', 'false');
    body.style.overflow = 'hidden'; // prevent background scroll

    /* Make links focusable */
    mobileLinks?.forEach(link => link.removeAttribute('tabindex'));

    /* Focus first link for keyboard users */
    setTimeout(() => mobileLinks?.[0]?.focus(), 100);
  }

  function closeMenu() {
    isOpen = false;
    btn.classList.remove('is-open');
    menu.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Open navigation menu');
    menu.setAttribute('aria-hidden', 'true');
    body.style.overflow = '';

    /* Remove focusability */
    mobileLinks?.forEach(link => link.setAttribute('tabindex', '-1'));

    /* Return focus to hamburger button */
    btn.focus();
  }

  function toggleMenu() {
    isOpen ? closeMenu() : openMenu();
  }

  /* Toggle on button click */
  btn.addEventListener('click', toggleMenu);

  /* Close when a nav link is clicked (SPA-like navigation) */
  mobileLinks?.forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  /* Close on Escape key */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) closeMenu();
  });

  /* Trap focus within overlay when open */
  menu.addEventListener('keydown', (e) => {
    if (!isOpen || e.key !== 'Tab') return;

    const focusable = Array.from(menu.querySelectorAll(
      'a, button, [tabindex]:not([tabindex="-1"])'
    ));

    if (!focusable.length) return;

    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
})();


/* ===============================================================
   5. SMOOTH SCROLL — Native scroll with offset for sticky nav
   =============================================================== */

(function initSmoothScroll() {
  const NAV_HEIGHT = 80; // px — approximate height of sticky nav

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (!targetId || targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      const top = target.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();


/* ===============================================================
   6. CURSOR GLOW — Subtle mouse-following light effect
   A translucent radial glow that tracks the cursor position,
   reinforcing the "scanning" security terminal aesthetic.
   =============================================================== */

(function initCursorGlow() {
  /* Skip on touch devices */
  if (window.matchMedia('(pointer: coarse)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const glow = document.createElement('div');
  glow.setAttribute('aria-hidden', 'true');
  glow.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 600px;
    height: 600px;
    margin-left: -300px;
    margin-top: -300px;
    pointer-events: none;
    z-index: 9999;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(45, 127, 255, 0.055) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.4s ease;
    will-change: transform;
    transform: translate3d(-1000px, -1000px, 0);
  `;
  document.body.appendChild(glow);

  let mouseX = -1000, mouseY = -1000;
  let ticking = false;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        glow.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
        glow.style.opacity = '1';
        ticking = false;
      });
    }
  }, { passive: true });

  /* Fade out glow when mouse leaves window */
  document.addEventListener('mouseleave', () => {
    glow.style.opacity = '0';
  });
})();


/* ===============================================================
   7. PROJECT MODALS — Phase 3
   Uses native <dialog>.showModal() for free:
     - Focus trapping (built into the browser)
     - Escape key to close (built-in, but we also handle it explicitly)
     - ::backdrop pseudo-element
   Backdrop-click detection uses pointer coordinates vs. dialog rect.
   =============================================================== */

(function initProjectModals() {
  /* ── Wire each "open" trigger button ── */
  document.querySelectorAll('[data-modal]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const modalId = trigger.dataset.modal;
      const modal   = document.getElementById(modalId);
      if (!modal) return;

      modal.showModal();

      /* Prevent body scroll while modal is open */
      document.body.style.overflow = 'hidden';
    });
  });

  /* ── Shared close helper ── */
  function closeModal(modal) {
    modal.close();
    document.body.style.overflow = '';

    /* Return focus to the card trigger that opened it */
    const triggerId = modal.id.replace('modal-', '');
    const card = document.querySelector(`[data-modal="modal-${triggerId}"]`);
    card?.focus();
  }

  /* ── Wire ALL modals for backdrop click + close buttons ── */
  document.querySelectorAll('.project-modal').forEach((modal) => {

    /* Backdrop click: dialog element covers the full viewport;
       a click on the backdrop hits the <dialog> element itself
       (not the .modal__inner child). Check if the click target
       is the dialog element and the click was OUTSIDE the inner box. */
    modal.addEventListener('click', (e) => {
      /* If the clicked element is the dialog itself (i.e. not a child) */
      if (e.target !== modal) return;

      const rect = modal.querySelector('.modal__inner')?.getBoundingClientRect();
      if (!rect) { closeModal(modal); return; }

      const clickedInside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right  &&
        e.clientY >= rect.top    &&
        e.clientY <= rect.bottom;

      if (!clickedInside) closeModal(modal);
    });

    /* Header × close button */
    modal.querySelector('.modal__close')?.addEventListener('click', () => closeModal(modal));

    /* Footer "Close" button */
    modal.querySelector('.modal__close-btn')?.addEventListener('click', () => closeModal(modal));

    /* Restore scroll on native Escape close (the browser fires the
       'close' event when Escape is pressed or .close() is called) */
    modal.addEventListener('close', () => {
      document.body.style.overflow = '';
    });
  });

  /* ── Wire work section cards into the reveal observer ── */
  /* The observer already targets all non-hero .reveal-items —
     but project cards use data-project-index for their stagger timing,
     similar to how skill cards use data-skill-index. */
  const observer = window._portfolioRevealObserver;
  if (observer) {
    document.querySelectorAll('[data-project-index]').forEach((el) => {
      /* Convert data-project-index → data-skill-index naming used by observer
         (or we can just read it directly in the observer — handled below) */
      el.dataset.skillIndex = el.dataset.projectIndex;
      /* Stagger group = 'work' but with card-level timing */
      el.dataset.revealGroup = 'skills'; /* reuse the skills path (80ms per index) */
    });
  }
})();


/* ===============================================================
   8. FOOTER — Dynamic copyright year
   =============================================================== */
(function setFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
})();


/* ===============================================================
   9. CONTACT FORM — Phase 4
   Validates fields client-side without browser alerts, then
   submits asynchronously to Formspree via fetch.
   Shows a spinner while pending, success state on 200, and
   inline error messages on validation or network failure.
   =============================================================== */

(function initContactForm() {
  const form       = document.getElementById('contact-form');
  if (!form) return;

  const submitBtn  = document.getElementById('contact-submit');
  const statusEl   = document.getElementById('submit-status');
  const successDiv = document.getElementById('form-success');
  const resetBtn   = document.getElementById('form-reset-btn');

  /* ── Validation rules per field ── */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validators = {
    'contact-name': {
      groupId: 'group-name',
      errorId: 'error-name',
      validate(val) {
        if (!val.trim()) return 'Name is required.';
        if (val.trim().length < 2) return 'Name must be at least 2 characters.';
        return '';
      },
    },
    'contact-email': {
      groupId: 'group-email',
      errorId: 'error-email',
      validate(val) {
        if (!val.trim()) return 'Email address is required.';
        if (!EMAIL_RE.test(val.trim())) return 'Please enter a valid email address.';
        return '';
      },
    },
    'contact-message': {
      groupId: 'group-message',
      errorId: 'error-message',
      validate(val) {
        if (!val.trim()) return 'Message is required.';
        if (val.trim().length < 10) return 'Message must be at least 10 characters.';
        return '';
      },
    },
  };

  /* ── Show / clear a single field's error ── */
  function setFieldState(fieldId, errorMsg) {
    const rule    = validators[fieldId];
    const group   = document.getElementById(rule.groupId);
    const errorEl = document.getElementById(rule.errorId);
    if (!group || !errorEl) return;

    if (errorMsg) {
      group.classList.add('has-error');
      group.classList.remove('is-valid');
      errorEl.textContent = errorMsg;
    } else {
      group.classList.remove('has-error');
      group.classList.add('is-valid');
      errorEl.textContent = '';
    }
  }

  /* ── Validate a single field; returns true if valid ── */
  function validateField(fieldId) {
    const input = document.getElementById(fieldId);
    if (!input) return true;
    const msg = validators[fieldId].validate(input.value);
    setFieldState(fieldId, msg);
    return msg === '';
  }

  /* ── Validate all fields; returns true if all pass ── */
  function validateAll() {
    const results = Object.keys(validators).map(id => validateField(id));
    return results.every(Boolean);
  }

  /* ── Live validation: validate on blur, re-validate on input if already errored ── */
  Object.keys(validators).forEach((fieldId) => {
    const input = document.getElementById(fieldId);
    if (!input) return;

    input.addEventListener('blur', () => validateField(fieldId));

    input.addEventListener('input', () => {
      /* Only re-run validation if the field already has an error shown */
      const group = document.getElementById(validators[fieldId].groupId);
      if (group?.classList.contains('has-error')) {
        validateField(fieldId);
      }
    });
  });

  /* ── Submit handler ── */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    /* Run full validation */
    if (!validateAll()) {
      /* Move focus to the first errored field */
      const firstError = form.querySelector('.form-group.has-error .form-input');
      firstError?.focus();
      return;
    }

    /* Show submitting state */
    form.classList.add('is-submitting');
    submitBtn.disabled = true;
    if (statusEl) statusEl.textContent = '';

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        /* Success — swap form for success message */
        form.hidden = true;
        if (successDiv) successDiv.hidden = false;
        successDiv?.querySelector('.form-success__title')?.focus();
      } else {
        /* Formspree returned an error */
        const data = await response.json().catch(() => ({}));
        const msg = data?.errors?.[0]?.message ?? 'Something went wrong. Please try again.';
        if (statusEl) statusEl.textContent = msg;
      }
    } catch {
      if (statusEl) statusEl.textContent = 'Network error — please check your connection and try again.';
    } finally {
      form.classList.remove('is-submitting');
      submitBtn.disabled = false;
    }
  });

  /* ── Reset: show form again after success ── */
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      form.reset();

      /* Clear all validation states */
      Object.keys(validators).forEach((fieldId) => {
        const group = document.getElementById(validators[fieldId].groupId);
        group?.classList.remove('has-error', 'is-valid');
        const errorEl = document.getElementById(validators[fieldId].errorId);
        if (errorEl) errorEl.textContent = '';
      });

      if (statusEl) statusEl.textContent = '';
      form.hidden = false;
      if (successDiv) successDiv.hidden = true;
      document.getElementById('contact-name')?.focus();
    });
  }
})();


/* ===============================================================
   10. FINAL REVEAL PASS — Phase 4
   Ensures contact section items are observed by the shared IO.
   (Non-hero reveal items are already observed by initRevealObserver,
   but this ensures any dynamically added items are picked up too.)
   =============================================================== */
(function finalRevealPass() {
  const observer = window._portfolioRevealObserver;
  if (!observer) return;

  /* Any .reveal-item that wasn't observed yet (not already .is-visible) */
  document.querySelectorAll('.reveal-item:not(.is-visible)').forEach((el) => {
    /* Skip hero items (already observed) */
    if (el.closest('#hero-content')) return;
    observer.observe(el);
  });
})();

/* ===============================================================
   11. THEME SWITCHER & INTERACTIVE CLI TERMINAL
   =============================================================== */
(function initThemeAndCli() {
  // --- Theme Switcher ---
  const themeToggle = document.getElementById('theme-toggle-btn');
  const themes = ['', 'theme-green', 'theme-gold', 'theme-magenta', 'theme-red', 'theme-cyan'];
  let currentThemeIndex = 0;

  // Load from localStorage
  const savedTheme = localStorage.getItem('portfolio-theme');
  if (savedTheme && themes.includes(savedTheme)) {
    currentThemeIndex = themes.indexOf(savedTheme);
    if (savedTheme) {
      document.body.className = savedTheme;
    }
  }

  function cycleTheme() {
    currentThemeIndex = (currentThemeIndex + 1) % themes.length;
    const newTheme = themes[currentThemeIndex];
    
    // Clear other classes
    document.body.className = '';
    if (newTheme) {
      document.body.classList.add(newTheme);
    }
    
    localStorage.setItem('portfolio-theme', newTheme);
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', cycleTheme);
  }

  // --- Interactive Terminal CLI ---
  const cliInput = document.getElementById('terminal-cli');
  const historyContainer = document.getElementById('terminal-history');

  if (cliInput && historyContainer) {
    const terminalBody = cliInput.closest('.terminal__body');
    if (terminalBody) {
      terminalBody.addEventListener('click', () => {
        cliInput.focus();
      });
    }

    cliInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        const rawCmd = cliInput.value.trim();
        cliInput.value = '';

        if (!rawCmd) return;

        // 1. Print command to history
        const line = document.createElement('p');
        line.className = 'terminal__line';
        line.innerHTML = `<span class="terminal__prompt">guest@petermills:~$</span> <span class="terminal__cmd">${escapeHTML(rawCmd)}</span>`;
        historyContainer.appendChild(line);

        // 2. Parse command
        const cmd = rawCmd.toLowerCase();
        let outputText = '';
        let isError = false;

        if (cmd === 'help') {
          outputText = 'Available commands:<br>' +
            '  <span class="terminal__output--accent">bio</span>          Display biography details<br>' +
            '  <span class="terminal__output--accent">skills</span>       Switch terminal tab to core skills<br>' +
            '  <span class="terminal__output--accent">experience</span>   Switch terminal tab to experience<br>' +
            '  <span class="terminal__output--accent">projects</span>     List case study projects<br>' +
            '  <span class="terminal__output--accent">theme</span>        Cycle color themes (Blue / Green / Gold / Pink / Red / Cyan)<br>' +
            '  <span class="terminal__output--accent">hack</span>         Toggle matrix digital rain override<br>' +
            '  <span class="terminal__output--accent">clear</span>        Clear terminal history log';
        } else if (cmd === 'bio') {
          outputText = 'Biography:<br>' +
            '  I\'m an IT professional turned cybersecurity practitioner, most at home in a SOC environment, dissecting alerts, hunting threats, and turning raw telemetry into decisive action.<br><br>' +
            '  What sets me apart is that I don\'t just defend systems. I build them: polished web experiences with clean, semantic HTML/CSS and cross-platform mobile apps with Flutter and Dart.';
        } else if (cmd === 'skills') {
          outputText = 'Core Skills &amp; Tech Stack:<br>' +
            '  • <span class="terminal__output--accent">Security Operations</span> — SIEM Monitoring, Threat Hunting, Log Analysis, Incident Triage<br>' +
            '  • <span class="terminal__output--accent">Front-End Dev</span> — Semantic HTML/CSS, Scroll-driven animations, performance audits<br>' +
            '  • <span class="terminal__output--accent">Mobile Apps</span> — Cross-platform Dart &amp; Flutter development<br>' +
            '  • <span class="terminal__output--accent">Security Architecture</span> — Identity and Access Management (IAM), Cloud Security (AWS/Supabase)';
        } else if (cmd === 'experience') {
          outputText = 'Work Experience:<br>' +
            '  • <span class="terminal__output--accent">Lead Developer &amp; Security Architect</span> — Zenrixa &amp; Academic Hub (2024-Present)<br>' +
            '  • <span class="terminal__output--accent">Freelance Full-Stack Developer</span> — Melody &amp; V2 Herbal Care (2023-2024)<br>' +
            '  • <span class="terminal__output--accent">IT Analyst &amp; Threat Detection Practitioner</span> — Focus on security auditing and robust engineering.';
        } else if (cmd === 'projects') {
          outputText = 'Showcase Projects:<br>' +
            '  01. <span class="terminal__output--accent">Zenrixa</span> — Cybersecurity &amp; Systems Integration<br>' +
            '  02. <span class="terminal__output--accent">Academic Hub</span> — Full-Stack LMS Platform<br>' +
            '  03. <span class="terminal__output--accent">Melody</span> — Luxury Editorial Portfolio<br>' +
            '  04. <span class="terminal__output--accent">V2 Herbal Care</span> — Medical Naturopathy Website';
        } else if (cmd === 'theme') {
          cycleTheme();
          const themeNames = {
            '': 'Electric Blue (Default)',
            'theme-green': 'Matrix Green',
            'theme-gold': 'Luxury Gold',
            'theme-magenta': 'Cyberpunk Magenta',
            'theme-red': 'Volcanic Red',
            'theme-cyan': 'Electric Cyan'
          };
          const currentThemeName = themeNames[themes[currentThemeIndex]];
          outputText = `Theme cycled. Active accent: <span class="terminal__output--accent">${currentThemeName}</span>`;
        } else if (cmd === 'hack' || cmd === 'matrix') {
          window.isMatrixMode = !window.isMatrixMode;
          if (window.isMatrixMode) {
            outputText = '<span class="terminal__output--accent">MATRIX OVERRIDE ACTIVE. Mainframe hacked.</span>';
            document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' });
          } else {
            outputText = 'Mainframe connection restored. Network nodes online.';
          }
        } else if (cmd === 'clear') {
          historyContainer.innerHTML = '';
          return;
        } else {
          outputText = `command not found: ${escapeHTML(rawCmd)}. Type 'help' for options.`;
          isError = true;
        }

        // 3. Print output
        const outputLine = document.createElement('p');
        outputLine.className = isError ? 'terminal__output terminal__line-error' : 'terminal__output';
        outputLine.innerHTML = outputText;
        historyContainer.appendChild(outputLine);

        // 4. Scroll terminal to bottom
        if (terminalBody) {
          terminalBody.scrollTop = terminalBody.scrollHeight;
        }
      }
    });
  }

  function escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
})();


