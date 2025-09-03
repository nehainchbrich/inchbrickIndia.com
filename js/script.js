// ------- Helpers -------
const q = (sel, root = document) => root.querySelector(sel);
const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// ------- Navbar hamburger toggle -------
(() => {
  const menuToggle = q('#menuToggle');
  const navbar = q('#navbar');
  const mobileOverlay = q('#mobileOverlay');
  const closeNavBtn = q('#closeNavBtn');
  const navbarLinks = navbar ? qa('a', navbar) : [];

  const dropdownTrigger = q('.dropdown-trigger');
  const dropdownMenu = q('.dropdown-menu');

  if (navbar && mobileOverlay && menuToggle) {
    function openMobileNav() {
      navbar.classList.add('active');
      mobileOverlay.classList.add('active');
    }
    function closeMobileNav() {
      navbar.classList.remove('active');
      mobileOverlay.classList.remove('active');
    }

    menuToggle.addEventListener('click', () => {
      navbar.classList.contains('active') ? closeMobileNav() : openMobileNav();
    });
    mobileOverlay.addEventListener('click', closeMobileNav);
    navbarLinks.forEach(link => link.addEventListener('click', closeMobileNav));
    if (closeNavBtn) closeNavBtn.addEventListener('click', closeMobileNav);
  }

  // Dropdown functionality
  if (dropdownTrigger && dropdownMenu) {
    let dropdownTimeout;

    const show = () => {
      clearTimeout(dropdownTimeout);
      dropdownMenu.style.opacity = '1';
      dropdownMenu.style.visibility = 'visible';
      dropdownMenu.style.marginTop = '0';
    };
    const hide = () => {
      dropdownTimeout = setTimeout(() => {
        dropdownMenu.style.opacity = '0';
        dropdownMenu.style.visibility = 'hidden';
        dropdownMenu.style.marginTop = '10px';
      }, 200);
    };

    // Desktop hover
    dropdownTrigger.addEventListener('mouseenter', show);
    dropdownTrigger.addEventListener('mouseleave', hide);
    dropdownMenu.addEventListener('mouseenter', () => clearTimeout(dropdownTimeout));
    dropdownMenu.addEventListener('mouseleave', hide);

    // Mobile click
    dropdownTrigger.addEventListener('click', (e) => {
      if (window.innerWidth <= 900) {
        e.preventDefault();
        dropdownMenu.classList.toggle('active');
        const arrow = q('.dropdown-arrow', dropdownTrigger);
        if (arrow) {
          arrow.style.transform = dropdownMenu.classList.contains('active') ? 'rotate(270deg)' : 'rotate(90deg)';
        }
      }
    });

    // Outside click
    document.addEventListener('click', (e) => {
      if (!dropdownTrigger.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.classList.remove('active');
        const arrow = q('.dropdown-arrow', dropdownTrigger);
        if (arrow) arrow.style.transform = 'rotate(90deg)';
      }
    });

    // Resize
    window.addEventListener('resize', () => {
      dropdownMenu.classList.remove('active');
      const arrow = q('.dropdown-arrow', dropdownTrigger);
      if (arrow) arrow.style.transform = 'rotate(0deg)';
    });
  }
})();

// ------- Testimonials slider -------
(() => {
  const slides = qa('.testimonial-slide');
  const prevBtn = q('#testimonialPrev');
  const nextBtn = q('#testimonialNext');
  if (!slides.length || !prevBtn || !nextBtn) return;

  let idx = 0;
  const show = (i) => slides.forEach((s, k) => s.classList.toggle('active', k === i));
  const next = () => { idx = (idx + 1) % slides.length; show(idx); };
  const prev = () => { idx = (idx - 1 + slides.length) % slides.length; show(idx); };

  nextBtn.addEventListener('click', next);
  prevBtn.addEventListener('click', prev);
  show(idx);
  setInterval(next, 7000);
})();

// ------- Property slider (infinite) -------
(() => {
  const track = q('#propertySliderTrack');
  const prev = q('#propertyPrev');
  const next = q('#propertyNext');
  const slider = q('.property-slider');
  if (!track) return;

  let items = qa('.slider-item, .property-card', track);
  let current = 0;
  let visible = 3;
  let cloned = false;
  let transitioning = false;
  let autoplay = null;

  const updateVisible = () => {
    visible = window.innerWidth <= 600 ? 1 : window.innerWidth <= 900 ? 2 : 3;
  };

  const cloneItems = () => {
    if (cloned) return;
    track.querySelectorAll('.slider-clone').forEach(el => el.remove());
    updateVisible();
    const base = qa('.slider-item, .property-card', track).filter(el => !el.classList.contains('slider-clone'));
    const first = base.slice(0, visible).map(n => { const c = n.cloneNode(true); c.classList.add('slider-clone'); return c; });
    const last  = base.slice(-visible).map(n => { const c = n.cloneNode(true); c.classList.add('slider-clone'); return c; });
    last.forEach(c => track.insertBefore(c, track.firstChild));
    first.forEach(c => track.appendChild(c));
    cloned = true;
  };

  const allItems = () => qa('.slider-item, .property-card', track);

  const setSlider = (noTransition = false) => {
    updateVisible();
    cloneItems();
    items = allItems();
    const itemW = items[0]?.offsetWidth || 320;
    const gap = parseInt(getComputedStyle(track).gap || '24', 10);
    const moveX = (itemW + gap) * (current + visible);
    track.style.transition = noTransition ? 'none' : 'transform 0.4s cubic-bezier(.4,2,.6,1)';
    track.style.transform = `translateX(-${moveX}px)`;
  };

  const nextSlide = () => { if (transitioning) return; transitioning = true; current++; setSlider(); };
  const prevSlide = () => { if (transitioning) return; transitioning = true; current--; setSlider(); };

  if (next) next.addEventListener('click', nextSlide);
  if (prev) prev.addEventListener('click', prevSlide);

  window.addEventListener('resize', () => { cloned = false; setSlider(true); });

  track.addEventListener('transitionend', () => {
    const real = track.querySelectorAll('.slider-item, .property-card').length - 2 * visible;
    if (current >= real) { current = 0; setSlider(true); }
    else if (current < 0) { current = real - 1; setSlider(true); }
    transitioning = false;
  });

  const start = () => { stop(); autoplay = setInterval(nextSlide, 3000); };
  const stop = () => { if (autoplay) clearInterval(autoplay); };

  if (slider) {
    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);
  }

  setTimeout(() => { setSlider(true); start(); }, 10);
})();

// ------- Auto-slider seamless loop -------
(() => {
  const track = q('#autoSliderTrack');
  const container = q('.auto-slider');
  if (!track) return;

  track.innerHTML += track.innerHTML;

  let t;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    track.style.animation = 'none';
    t = setTimeout(() => { track.style.animation = ''; }, 50);
  });

  if (container) {
    container.addEventListener('mouseenter', () => { track.style.animationPlayState = 'paused'; });
    container.addEventListener('mouseleave', () => { track.style.animationPlayState = 'running'; });
  }
})();

// ------- Circle card slider -------
(() => {
  const track = q('#circleCardSliderTrack');
  const prev = q('#circleCardPrev');
  const next = q('#circleCardNext');
  if (!track) return;

  let visible = 3, current = 0, transitioning = false, cloned = false, count = 0;

  const updateVisible = () => {
    visible = window.innerWidth <= 700 ? 1 : window.innerWidth <= 1100 ? 2 : 3;
  };

  const clone = () => {
    track.querySelectorAll('.slider-clone').forEach(el => el.remove());
    const items = qa('.circle-card-slider-item:not(.slider-clone)', track);
    count = items.length;
    const first = items.slice(0, visible).map(n => { const c = n.cloneNode(true); c.classList.add('slider-clone'); return c; });
    const last  = items.slice(-visible).map(n => { const c = n.cloneNode(true); c.classList.add('slider-clone'); return c; });
    last.forEach(c => track.insertBefore(c, track.firstChild));
    first.forEach(c => track.appendChild(c));
    cloned = true;
  };

  const all = () => qa('.circle-card-slider-item', track);

  const setSlider = (noTransition = false) => {
    updateVisible();
    if (!cloned) clone();
    const items = all();
    const itemW = items[0]?.offsetWidth || 340;
    const gap = parseInt(getComputedStyle(track).gap || '24', 10);
    const moveX = (itemW + gap) * (current + visible);
    track.style.transition = noTransition ? 'none' : 'transform 0.5s cubic-bezier(.4,2,.6,1)';
    track.style.transform = `translateX(-${moveX}px)`;
  };

  const nextSlide = () => { if (transitioning) return; transitioning = true; current++; setSlider(); };
  const prevSlide = () => { if (transitioning) return; transitioning = true; current--; setSlider(); };

  if (next) next.addEventListener('click', nextSlide);
  if (prev) prev.addEventListener('click', prevSlide);

  window.addEventListener('resize', () => { cloned = false; current = 0; setSlider(true); });

  track.addEventListener('transitionend', () => {
    if (!count) return;
    if (current >= count) { current = 0; setSlider(true); }
    else if (current < 0) { current = count - 1; setSlider(true); }
    transitioning = false;
  });

  setTimeout(() => setSlider(true), 10);
})();

// ------- Featured Property Slider -------
(() => {
  const track = q('#featuredPropertyTrack');
  if (!track) return;

  const prev = q('#featuredPropertyPrev');
  const next = q('#featuredPropertyNext');
  const slider = q('.featured-property-slider');

  let visible = 3, current = 0, transitioning = false, cloned = false, autoplay = null;

  const updateVisible = () => {
    visible = window.innerWidth <= 500 ? 1 : window.innerWidth <= 1100 ? 2 : 3;
  };

  const clone = () => {
    if (cloned) return;
    track.querySelectorAll('.slider-clone').forEach(el => el.remove());
    const items = qa('.featured-property-item:not(.slider-clone)', track);
    const first = items.slice(0, visible).map(n => { const c = n.cloneNode(true); c.classList.add('slider-clone'); return c; });
    const last  = items.slice(-visible).map(n => { const c = n.cloneNode(true); c.classList.add('slider-clone'); return c; });
    last.forEach(c => track.insertBefore(c, track.firstChild));
    first.forEach(c => track.appendChild(c));
    cloned = true;
  };

  const all = () => qa('.featured-property-item', track);

  const setSlider = (noTransition = false) => {
    updateVisible();
    if (!cloned) clone();
    const items = all();
    const itemW = items[0]?.offsetWidth || 350;
    const gap = parseInt(getComputedStyle(track).gap || '30', 10);
    const moveX = (itemW + gap) * (current + visible);
    track.style.transition = noTransition ? 'none' : 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    track.style.transform = `translateX(-${moveX}px)`;
  };

  const nextSlide = () => { if (transitioning) return; transitioning = true; current++; setSlider(); };
  const prevSlide = () => { if (transitioning) return; transitioning = true; current--; setSlider(); };

  if (next) next.addEventListener('click', nextSlide);
  if (prev) prev.addEventListener('click', prevSlide);

  track.addEventListener('transitionend', () => {
    const real = track.querySelectorAll('.featured-property-item:not(.slider-clone)').length;
    if (current >= real) { current = 0; setSlider(true); }
    else if (current < 0) { current = real - 1; setSlider(true); }
    transitioning = false;
  });

  const start = () => { stop(); autoplay = setInterval(nextSlide, 4000); };
  const stop = () => { if (autoplay) clearInterval(autoplay); };

  if (slider) {
    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);
  }

  window.addEventListener('resize', () => { cloned = false; setSlider(true); });

  setTimeout(() => { setSlider(true); start(); }, 100);
})();

// ------- Scroll / reveal animations -------
(() => {
  const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('animate-in'); });
  }, observerOptions);

  function initScrollAnimations() {
    qa('section').forEach(section => { section.classList.add('scroll-animate'); observer.observe(section); });

    qa(`
      .property-card,
      .featured-property-card,
      .explore-service-card,
      .popular-city-card,
      .browse-category-img-wrap,
      .investment-highlight,
      .hero-content,
      .hero-image,
      .find-home-form,
      .explore-property
    `).forEach((el, i) => {
      el.classList.add('scroll-animate');
      el.style.animationDelay = `${i * 0.1}s`;
      observer.observe(el);
    });

    qa('h1, h2, h3, h4').forEach((h, i) => {
      h.classList.add('scroll-animate');
      h.style.animationDelay = `${i * 0.05}s`;
      observer.observe(h);
    });

    qa('button, .btn, .explore-now-btn').forEach((btn, i) => {
      btn.classList.add('scroll-animate');
      btn.style.animationDelay = `${i * 0.1}s`;
      observer.observe(btn);
    });

    qa('input, select, .input-group, .select-group').forEach((el, i) => {
      el.classList.add('scroll-animate');
      el.style.animationDelay = `${i * 0.1}s`;
      observer.observe(el);
    });
  }

  function initParallax() {
    const heroImage = q('.hero-image');
    if (!heroImage) return;
    window.addEventListener('scroll', () => {
      const rate = window.pageYOffset * -0.5;
      heroImage.style.transform = `translateY(${rate}px)`;
    });
  }

  function initRevealAnimations() {
    qa('.hero-content, .find-home h2, .featured-property-title').forEach(el => { el.classList.add('reveal-left'); observer.observe(el); });
    qa('.hero-image, .explore-property').forEach(el => { el.classList.add('reveal-right'); observer.observe(el); });
    qa('.property-card, .featured-property-card, .explore-service-card').forEach(el => { el.classList.add('reveal-bottom'); observer.observe(el); });
    qa('.browse-category-img-wrap, .investment-highlight').forEach(el => { el.classList.add('reveal-scale'); observer.observe(el); });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    initParallax();
    initRevealAnimations();
  });
})();

// ------- City slider (2-row, by page) -------
(() => {
  const track = q('#citySliderTrack');
  const prev = q('#cityPrev');
  const next = q('#cityNext');
  if (!track) return;

  let current = 0;
  let transitioning = false;

  const pages = () => qa('.city-slider-page', track);

  const clonePages = () => {
    track.querySelectorAll('.slider-clone').forEach(el => el.remove());
    const p = pages();
    if (p.length > 1) {
      const first = p[0].cloneNode(true);
      const last = p[p.length - 1].cloneNode(true);
      first.classList.add('slider-clone');
      last.classList.add('slider-clone');
      track.insertBefore(last, p[0]);
      track.appendChild(first);
    }
  };

  const setSlider = (noTransition = false) => {
    const p = pages();
    const pageW = p[0]?.offsetWidth || track.offsetWidth;
    track.style.transition = noTransition ? 'none' : 'transform 0.5s cubic-bezier(.4,2,.6,1)';
    track.style.transform = `translateX(-${(current + 1) * pageW}px)`;
  };

  const nextSlide = () => { if (transitioning) return; transitioning = true; current++; setSlider(); };
  const prevSlide = () => { if (transitioning) return; transitioning = true; current--; setSlider(); };

  if (next) next.addEventListener('click', nextSlide);
  if (prev) prev.addEventListener('click', prevSlide);

  window.addEventListener('resize', () => {
    track.querySelectorAll('.slider-clone').forEach(el => el.remove());
    current = 0;
    clonePages();
    setSlider(true);
  });

  track.addEventListener('transitionend', () => {
    const p = pages();
    // indexes with clones present: [cloneLast][0..n-1][cloneFirst]
    if (current >= p.length - 2) { // moved past real last to cloneFirst
      current = 0;
      setTimeout(() => setSlider(true), 20);
    } else if (current < 0) { // moved before real first to cloneLast
      current = (p.length - 2) - 1;
      setTimeout(() => setSlider(true), 20);
    }
    transitioning = false;
  });

  setTimeout(() => { clonePages(); setSlider(true); }, 10);
})();
