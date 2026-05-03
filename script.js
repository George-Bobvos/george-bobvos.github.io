/* ============================================================
   PIPA YOGA — interactions
   ============================================================ */

(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Year in footer ---------- */
  const yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- Sticky / shrinking nav ---------- */
  const nav = document.getElementById('nav');
  const onScroll = () => {
    if (!nav) return;
    nav.classList.toggle('is-scrolled', window.scrollY > 40);
    // Scroll progress bar
    const bar = document.querySelector('.scroll-progress');
    if (bar) {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const pct = max > 0 ? window.scrollY / max : 0;
      bar.style.transform = `scaleX(${pct})`;
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const menuBtn = document.getElementById('menuBtn');
  const menu = document.getElementById('mobileMenu');
  if (menuBtn && menu) {
    const closeMenu = () => {
      menuBtn.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
      menu.classList.remove('is-open');
      document.body.style.overflow = '';
    };
    const openMenu = () => {
      menuBtn.setAttribute('aria-expanded', 'true');
      menu.setAttribute('aria-hidden', 'false');
      menu.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    };
    menuBtn.addEventListener('click', () => {
      const open = menuBtn.getAttribute('aria-expanded') === 'true';
      open ? closeMenu() : openMenu();
    });
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  }

  /* ---------- Split text on display headlines ---------- */
  const splitTargets = document.querySelectorAll('[data-split]');
  splitTargets.forEach(el => {
    // Walk children, wrap text-node words in spans, preserve <em>, <br>, etc.
    const wrapTextNode = (node) => {
      const frag = document.createDocumentFragment();
      const parts = node.textContent.split(/(\s+)/);
      parts.forEach(part => {
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(part));
        } else if (part.length) {
          const span = document.createElement('span');
          span.className = 'word';
          span.textContent = part;
          frag.appendChild(span);
        }
      });
      node.replaceWith(frag);
    };
    const walk = (root) => {
      const children = Array.from(root.childNodes);
      children.forEach(n => {
        if (n.nodeType === Node.TEXT_NODE) wrapTextNode(n);
        else if (n.nodeType === Node.ELEMENT_NODE && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el);
    // assign per-word delays
    const words = el.querySelectorAll('.word');
    words.forEach((w, i) => {
      w.style.transitionDelay = (i * 0.06) + 's';
    });
  });

  /* ---------- IntersectionObserver — reveal + split ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });

  // Auto-add .reveal to common blocks for a soft default
  const autoReveal = [
    '.section__head', '.intro', '.cards .card', '.training__copy',
    '.benefits li', '.filipa', '.sessions .session', '.sessions__note',
    '.contact__copy', '.contact__form', '.hero__foot', '.hero__image',
    '.hero__meta', '.facts', '.intro__image', '.intro__copy',
    '.filipa__image', '.filipa__copy',
    '.page-head', '.schedule', '.schedule__foot',
    '.voices', '.voices__nav'
  ];
  autoReveal.forEach(sel => {
    document.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = (i % 3) * 0.08 + 's';
      io.observe(el);
    });
  });
  document.querySelectorAll('[data-split]').forEach(el => io.observe(el));

  /* ---------- Image blur-up: mark wrappers .is-loaded once each <img> is ready ---------- */
  const lazyImgs = document.querySelectorAll(
    '.card__image > img, .intro__image .img-frame > img, .filipa__image .img-frame > img'
  );
  lazyImgs.forEach((img) => {
    const wrap = img.parentElement;
    if (!wrap) return;
    const onReady = () => wrap.classList.add('is-loaded');
    if (img.complete && img.naturalHeight !== 0) {
      onReady();
    } else {
      img.addEventListener('load',  onReady, { once: true });
      img.addEventListener('error', onReady, { once: true });
    }
  });

  /* ---------- Hero parallax ---------- */
  const parallaxEls = document.querySelectorAll('[data-parallax]');
  if (!reduceMotion && parallaxEls.length) {
    let ticking = false;
    const update = () => {
      parallaxEls.forEach(el => {
        const img = el.querySelector('img');
        if (!img) return;
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2 - window.innerHeight / 2;
        const offset = Math.max(-60, Math.min(60, center * -0.08));
        img.style.transform = `translate3d(0, ${offset}px, 0) scale(1.06)`;
      });
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ---------- Magnetic buttons (subtle) ---------- */
  if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        btn.style.transform = `translate(${x * 0.12}px, ${y * 0.18}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  /* ---------- Contact form → mailto ---------- */
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = (data.get('name') || '').toString().trim();
      const email = (data.get('email') || '').toString().trim();
      const interest = (data.get('interest') || '').toString().trim();
      const message = (data.get('message') || '').toString().trim();

      if (!name || !email) {
        const firstEmpty = !name ? form.querySelector('#name') : form.querySelector('#email');
        firstEmpty && firstEmpty.focus();
        return;
      }

      const subject = `PipaYoga — ${interest || 'a session'} (${name})`;
      const body =
`Hi Filipa,

I'd like to know more about: ${interest || '—'}

${message || ''}

— ${name}
${email}`;

      const href = `mailto:filipa-martinho94@hotmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = href;

      // Visual feedback
      const btn = form.querySelector('button[type="submit"]');
      if (btn) {
        const original = btn.innerHTML;
        btn.innerHTML = 'Opening your email…';
        setTimeout(() => { btn.innerHTML = original; }, 2400);
      }
    });
  }

  /* ---------- Voices (testimonials carousel) ---------- */
  const voicesRoot = document.querySelector('[data-voices]');
  if (voicesRoot) {
    const slides = Array.from(voicesRoot.querySelectorAll('.voice'));
    const dots   = Array.from(voicesRoot.querySelectorAll('.voices__dot'));
    const prev   = voicesRoot.querySelector('[data-voices-prev]');
    const next   = voicesRoot.querySelector('[data-voices-next]');
    const counter = voicesRoot.querySelector('[data-voices-current]');
    const total  = slides.length;
    let active   = 0;
    const pad2 = (n) => String(n).padStart(2, '0');

    const goTo = (i) => {
      const idx = ((i % total) + total) % total;
      if (idx === active) return;
      slides[active].classList.remove('is-active');
      dots[active].classList.remove('is-active');
      dots[active].setAttribute('aria-selected', 'false');
      active = idx;
      slides[active].classList.add('is-active');
      dots[active].classList.add('is-active');
      dots[active].setAttribute('aria-selected', 'true');
      if (counter) counter.textContent = pad2(active + 1);
    };

    if (prev) prev.addEventListener('click', () => goTo(active - 1));
    if (next) next.addEventListener('click', () => goTo(active + 1));
    dots.forEach((d) => {
      d.addEventListener('click', () => {
        const i = parseInt(d.dataset.go, 10) || 0;
        goTo(i);
      });
    });

    /* Keyboard arrows when the section is in view */
    let inView = false;
    const sectionEl = voicesRoot.closest('.section--voices') || voicesRoot;
    const ioVoices = new IntersectionObserver((entries) => {
      entries.forEach(e => { inView = e.isIntersecting; });
    }, { threshold: 0.25 });
    ioVoices.observe(sectionEl);
    document.addEventListener('keydown', (e) => {
      if (!inView) return;
      const t = e.target;
      if (t && (t.matches('input, textarea, select') || t.isContentEditable)) return;
      if (e.key === 'ArrowLeft')  { goTo(active - 1); }
      if (e.key === 'ArrowRight') { goTo(active + 1); }
    });

    /* Touch / pointer swipe on the stage */
    const stage = voicesRoot.querySelector('.voices__stage');
    if (stage) {
      let startX = 0, startY = 0, tracking = false;
      const threshold = 50;
      stage.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        startX = e.clientX; startY = e.clientY; tracking = true;
      });
      stage.addEventListener('pointerup', (e) => {
        if (!tracking) return;
        tracking = false;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy)) {
          goTo(active + (dx < 0 ? 1 : -1));
        }
      });
      stage.addEventListener('pointercancel', () => { tracking = false; });

      /* Trackpad / horizontal-wheel navigation
         Listens to predominantly horizontal scroll gestures and steps the
         carousel one slide per gesture, with a short cooldown to prevent
         a single two-finger swipe from skipping multiple slides. */
      let wheelLock = false;
      let wheelAccum = 0;
      const wheelThreshold = 40;
      const wheelCooldown = 520;
      stage.addEventListener('wheel', (e) => {
        // Only react to horizontal-dominant gestures
        if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) * 1.2) return;
        // Suppress the browser's back/forward swipe & any horizontal page scroll
        e.preventDefault();
        if (wheelLock) return;
        wheelAccum += e.deltaX;
        if (Math.abs(wheelAccum) >= wheelThreshold) {
          goTo(active + (wheelAccum > 0 ? 1 : -1));
          wheelLock = true;
          wheelAccum = 0;
          setTimeout(() => { wheelLock = false; }, wheelCooldown);
        }
      }, { passive: false });
    }
  }

  /* ---------- Section vine ornaments ----------
     Small hand-drawn vine sprig left of each section numeral. Four variants
     (cycled), three wobble-filter seeds (cycled), every other one mirrored —
     subtle variation without ever feeling repetitive. Draws when the label
     enters view; blossoms bloom in the favicon's lotus style. */
  (function buildVineMarks() {
    const labels = document.querySelectorAll('.section__label');
    if (!labels.length) return;

    /* Inject shared <defs> with three wobble filters once */
    if (!document.getElementById('vine-defs')) {
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      defs.id = 'vine-defs';
      defs.setAttribute('aria-hidden', 'true');
      defs.setAttribute('width', '0');
      defs.setAttribute('height', '0');
      defs.style.cssText =
        'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
      defs.innerHTML = `
        <defs>
          <filter id="vw1" x="-20%" y="-10%" width="140%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="2" seed="3"/>
            <feDisplacementMap in="SourceGraphic" scale="1.4"/>
          </filter>
          <filter id="vw2" x="-20%" y="-10%" width="140%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="11"/>
            <feDisplacementMap in="SourceGraphic" scale="1.6"/>
          </filter>
          <filter id="vw3" x="-20%" y="-10%" width="140%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.026" numOctaves="2" seed="19"/>
            <feDisplacementMap in="SourceGraphic" scale="1.3"/>
          </filter>
        </defs>
      `;
      document.body.appendChild(defs);
    }

    /* Mini lotus, favicon-style, centred at (0,0). 8 petals + a small core. */
    const lotus = () => `
      <ellipse cx="0" cy="-5" rx="1.2" ry="3.2"/>
      <ellipse cx="0" cy="-5" rx="1.2" ry="3.2" transform="rotate(45)"/>
      <ellipse cx="0" cy="-5" rx="1.2" ry="3.2" transform="rotate(90)"/>
      <ellipse cx="0" cy="-5" rx="1.2" ry="3.2" transform="rotate(135)"/>
      <ellipse cx="0" cy="-5" rx="1.2" ry="3.2" transform="rotate(180)"/>
      <ellipse cx="0" cy="-5" rx="1.2" ry="3.2" transform="rotate(225)"/>
      <ellipse cx="0" cy="-5" rx="1.2" ry="3.2" transform="rotate(270)"/>
      <ellipse cx="0" cy="-5" rx="1.2" ry="3.2" transform="rotate(315)"/>
      <circle cx="0" cy="0" r="1.4"/>
    `;

    /* Four hand-tuned variants (viewBox 0 0 30 142). Stems start at the bottom
       and grow up; blooms sit at the upper tip(s). */
    const variants = [
      // A — climber, single bloom at top, one leaf mid-left
      {
        stem:   'M 21,138 C 14,124 9,112 14,96 C 19,80 23,68 17,54 C 11,40 16,28 13,18 C 12,12 14,8 15,4',
        leaves: ['M 14,72 Q 6,66 3,72 Q 7,78 14,72 Z'],
        blooms: [{ x: 15, y: 4, scale: 1 }]
      },
      // B — gentle S, small middle bud + larger top bloom, leaf right
      {
        stem:   'M 13,138 C 17,122 8,108 14,92 C 20,76 12,60 17,42 C 21,26 14,16 17,4',
        leaves: ['M 17,92 Q 25,86 27,92 Q 22,98 17,92 Z'],
        blooms: [
          { x: 14, y: 92, scale: 0.6 },
          { x: 17, y: 4,  scale: 1 }
        ]
      },
      // C — flourish with mid bloom and trailing leaves
      {
        stem:   'M 15,138 C 10,122 19,108 13,92 C 7,76 19,62 13,46 C 9,32 16,20 13,8',
        leaves: [
          'M 14,108 Q 22,104 23,110 Q 18,114 14,108 Z',
          'M 14,52 Q 7,48 5,54 Q 9,58 14,52 Z'
        ],
        blooms: [{ x: 13, y: 8, scale: 0.95 }]
      },
      // D — gentle climb, single small top bud, leaves both sides
      {
        stem:   'M 17,138 C 12,124 19,108 14,92 C 9,76 19,60 14,44 C 9,28 16,18 14,6',
        leaves: [
          'M 16,114 Q 24,110 25,116 Q 20,120 16,114 Z',
          'M 14,72 Q 6,68 4,74 Q 8,78 14,72 Z'
        ],
        blooms: [{ x: 14, y: 6, scale: 0.85 }]
      }
    ];

    const filters = ['vw1', 'vw2', 'vw3'];

    labels.forEach((label, i) => {
      const v = variants[i % variants.length];
      const filterId = filters[i % filters.length];
      const flip = (i % 2 === 1);

      const leafPaths = v.leaves
        .map(d => `<path class="leaf" d="${d}"/>`)
        .join('');

      const bloomGroups = v.blooms.map(b => `
        <g class="bloom" transform="translate(${b.x},${b.y}) scale(${b.scale})">
          <g class="bloom-inner">${lotus()}</g>
        </g>
      `).join('');

      const svgMarkup = `
        <svg class="vine-mark${flip ? ' vine-mark--flip' : ''}"
             viewBox="0 0 30 142"
             preserveAspectRatio="xMidYMid meet"
             aria-hidden="true">
          <g filter="url(#${filterId})">
            <path class="stem" d="${v.stem}"/>
            ${leafPaths}
          </g>
          ${bloomGroups}
        </svg>
      `;

      label.insertAdjacentHTML('afterbegin', svgMarkup);

      /* Per-element path lengths fed to CSS via custom props so the dasharray
         exactly matches each path. Avoids over/under-shoot in the draw. */
      const svg  = label.querySelector('.vine-mark');
      const stem = svg && svg.querySelector('.stem');
      if (stem && typeof stem.getTotalLength === 'function') {
        try {
          stem.style.setProperty('--stem-len', stem.getTotalLength());
        } catch (e) { /* no-op */ }
      }
      svg && svg.querySelectorAll('.leaf').forEach(leaf => {
        if (typeof leaf.getTotalLength === 'function') {
          try {
            leaf.style.setProperty('--leaf-len', leaf.getTotalLength());
          } catch (e) { /* no-op */ }
        }
      });
    });

    /* Trigger draw when label enters view. Reuses .is-visible — same idiom
       as the rest of the reveal system. */
    const ioVine = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          ioVine.unobserve(e.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });

    labels.forEach(l => ioVine.observe(l));
  })();

  /* ---------- Cleanup transform on scroll-end (avoid stuck magnetic) ---------- */
  let lastTouch = 0;
  document.addEventListener('mousemove', () => { lastTouch = Date.now(); });
  setInterval(() => {
    if (Date.now() - lastTouch > 300) {
      document.querySelectorAll('.btn').forEach(b => {
        if (!b.matches(':hover')) b.style.transform = '';
      });
    }
  }, 600);
})();
