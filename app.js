(function () {
  const pages = {
    home: { title: 'Home | HaiFar Solutions' },
    'who-we-are': { title: 'Who We Are | HaiFar Solutions' },
    'what-we-do': { title: 'What We Do | HaiFar Solutions' },
    'our-story': { title: 'Our Story | HaiFar Solutions' },
    'our-vision': { title: 'Our Vision | HaiFar Solutions' },
    contact: { title: 'Contact | HaiFar Solutions' }
  };

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let currentPage = 'home';
  let parallaxBg = null;
  let parallaxPanel = null;

  function getPageFromHash() {
    const hash = window.location.hash.replace('#', '');
    return pages[hash] ? hash : 'home';
  }

  function updateParallax() {
    if (!parallaxBg || !parallaxPanel || currentPage !== 'home') {
      return;
    }

    if (window.matchMedia('(max-width: 768px)').matches || prefersReducedMotion) {
      parallaxBg.style.transform = 'none';
      return;
    }

    const scrolled = window.scrollY - parallaxPanel.offsetTop;
    parallaxBg.style.transform = 'translateY(' + (scrolled * 0.25) + 'px)';
  }

  function setActiveNav(pageId) {
    document.querySelectorAll('nav a[data-page]').forEach(function (link) {
      link.classList.toggle('active', link.getAttribute('data-page') === pageId);
    });
  }

  function showPage(pageId, updateHistory) {
    if (!pages[pageId]) {
      return;
    }

    if (pageId === currentPage) {
      window.scrollTo(0, 0);
      return;
    }

    document.querySelectorAll('.page-section').forEach(function (section) {
      const isActive = section.id === pageId;
      section.classList.toggle('active', isActive);
      section.hidden = !isActive;
    });

    currentPage = pageId;
    document.title = pages[pageId].title;
    setActiveNav(pageId);

    if (updateHistory !== false) {
      const newHash = pageId === 'home' ? '#home' : '#' + pageId;
      if (window.location.hash !== newHash) {
        history.pushState({ page: pageId }, '', newHash);
      }
    }

    window.scrollTo(0, 0);
    updateParallax();
  }

  function setupMobileNav() {
    const header = document.querySelector('header');
    const nav = document.querySelector('header nav');
    const headerBar = document.querySelector('.header-bar');
    if (!header || !nav || !headerBar || header.querySelector('.nav-toggle')) {
      return;
    }

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'nav-toggle';
    toggle.setAttribute('aria-label', 'Open menu');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<span></span><span></span><span></span>';
    headerBar.insertBefore(toggle, headerBar.firstChild);

    toggle.addEventListener('click', function (event) {
      event.stopPropagation();
      const isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    });
  }

  function setupNav() {
    document.querySelectorAll('nav a[data-page]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        const pageId = link.getAttribute('data-page');
        showPage(pageId);

        const nav = document.querySelector('header nav');
        const toggle = document.querySelector('.nav-toggle');
        if (nav) {
          nav.classList.remove('open');
        }
        if (toggle) {
          toggle.setAttribute('aria-expanded', 'false');
          toggle.setAttribute('aria-label', 'Open menu');
        }
      });
    });

    document.querySelector('.site-title a')?.addEventListener('click', function (event) {
      event.preventDefault();
      showPage('home');
    });
  }

  function init() {
    parallaxBg = document.getElementById('parallaxBg');
    parallaxPanel = document.querySelector('.parallax-panel');

    setupMobileNav();
    setupNav();

    const startPage = getPageFromHash();
    showPage(startPage, false);

    if (window.location.hash === '' && startPage === 'home') {
      history.replaceState({ page: 'home' }, '', '#home');
    }

    window.addEventListener('hashchange', function () {
      showPage(getPageFromHash(), false);
    });

    window.addEventListener('popstate', function (event) {
      const pageId = event.state && event.state.page ? event.state.page : getPageFromHash();
      showPage(pageId, false);
    });

    window.addEventListener('scroll', updateParallax, { passive: true });
    updateParallax();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
