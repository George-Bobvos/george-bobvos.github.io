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

    const goTo = (i, { user = false } = {}) => {
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
      if (user) restartAuto();
    };

    if (prev) prev.addEventListener('click', () => goTo(active - 1, { user: true }));
    if (next) next.addEventListener('click', () => goTo(active + 1, { user: true }));
    dots.forEach((d) => {
      d.addEventListener('click', () => {
        const i = parseInt(d.dataset.go, 10) || 0;
        goTo(i, { user: true });
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
      if (e.key === 'ArrowLeft')  { goTo(active - 1, { user: true }); }
      if (e.key === 'ArrowRight') { goTo(active + 1, { user: true }); }
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
          goTo(active + (dx < 0 ? 1 : -1), { user: true });
        }
      });
      stage.addEventListener('pointercancel', () => { tracking = false; });
    }

    /* Auto-advance — gentle, pauses on hover/focus or off-screen */
    let timer = null;
    let paused = false;
    const interval = 8500;
    const tick = () => {
      if (!paused && inView && !document.hidden) goTo(active + 1);
    };
    const startAuto = () => {
      if (reduceMotion) return;
      stopAuto();
      timer = setInterval(tick, interval);
    };
    const stopAuto = () => { if (timer) { clearInterval(timer); timer = null; } };
    const restartAuto = () => { startAuto(); };
    voicesRoot.addEventListener('mouseenter', () => { paused = true; });
    voicesRoot.addEventListener('mouseleave', () => { paused = false; });
    voicesRoot.addEventListener('focusin',   () => { paused = true; });
    voicesRoot.addEventListener('focusout',  () => { paused = false; });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopAuto(); else startAuto();
    });
    startAuto();
  }

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
