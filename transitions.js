(function () {
  const fadeDuration = 120;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function isInternalPageLink(link) {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return false;
    }
    if (link.target === '_blank' || link.hasAttribute('download')) {
      return false;
    }
    if (href.startsWith('http://') || href.startsWith('https://')) {
      return link.hostname === window.location.hostname;
    }
    return href.endsWith('.html') || href === '/' || !href.includes(':');
  }

  function getOverlay() {
    let overlay = document.getElementById('page-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'page-overlay';
      overlay.className = 'page-overlay active';
      overlay.setAttribute('aria-hidden', 'true');
      document.body.prepend(overlay);
    }
    return overlay;
  }

  function prefetchPage(url) {
    if (prefersReducedMotion) {
      return;
    }

    const absolute = new URL(url, window.location.href).href;
    if (prefetchPage.cache.has(absolute)) {
      return;
    }

    prefetchPage.cache.add(absolute);

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = absolute;
    document.head.appendChild(link);
  }

  prefetchPage.cache = new Set();

  function prefetchAllNavLinks() {
    document.querySelectorAll('nav a[href]').forEach(function (link) {
      if (isInternalPageLink(link)) {
        prefetchPage(link.getAttribute('href'));
      }
    });
  }

  function revealPage() {
    const overlay = getOverlay();
    document.body.classList.remove('page-leaving');
    document.body.classList.add('page-loaded');

    window.requestAnimationFrame(function () {
      overlay.classList.remove('active');
    });
  }

  function navigateTo(url) {
    if (prefersReducedMotion) {
      window.location.href = url;
      return;
    }

    const overlay = getOverlay();
    document.body.classList.remove('page-loaded');
    document.body.classList.add('page-leaving');
    overlay.classList.add('active');

    window.setTimeout(function () {
      window.location.href = url;
    }, fadeDuration);
  }

  function setupMobileNav() {
    const header = document.querySelector('header');
    const nav = document.querySelector('header nav');
    if (!header || !nav || header.querySelector('.nav-toggle')) {
      return;
    }

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'nav-toggle';
    toggle.setAttribute('aria-label', 'Open menu');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<span></span><span></span><span></span>';

    header.insertBefore(toggle, nav);

    toggle.addEventListener('click', function () {
      const isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
      });
    });
  }

  function setupLinks() {
    document.querySelectorAll('a[href]').forEach(function (link) {
      if (!isInternalPageLink(link)) {
        return;
      }

      const href = link.getAttribute('href');

      link.addEventListener('mouseenter', function () {
        prefetchPage(href);
      });

      link.addEventListener('touchstart', function () {
        prefetchPage(href);
      }, { passive: true });

      link.addEventListener('click', function (event) {
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
          return;
        }

        const targetUrl = new URL(href, window.location.href).href;
        if (targetUrl === window.location.href) {
          return;
        }

        event.preventDefault();
        navigateTo(href);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    getOverlay();
    setupMobileNav();
    setupLinks();
    prefetchAllNavLinks();

    if (prefersReducedMotion) {
      document.body.classList.add('page-loaded');
      getOverlay().classList.remove('active');
      return;
    }

    window.requestAnimationFrame(revealPage);
  }

  window.addEventListener('pageshow', function (event) {
    if (event.persisted) {
      revealPage();
    }
  });
})();
