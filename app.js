(function () {
  const transitionMs = 120;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pageCache = new Map();
  let isNavigating = false;
  let currentPageUrl = resolveUrl(window.location.href);
  let parallaxBg = null;
  let parallaxPanel = null;
  let scrollHandler = null;

  function resolveUrl(href) {
    return new URL(href, window.location.href).href;
  }

  function isInternalPageLink(link) {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return false;
    }
    if (link.target === '_blank' || link.hasAttribute('download')) {
      return false;
    }

    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) {
      return false;
    }

    const path = url.pathname;
    return path.endsWith('.html') || path.endsWith('/') || /\/index\.html?$/.test(path);
  }

  function wait(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  function closeMobileNav() {
    const nav = document.querySelector('header nav');
    const toggle = document.querySelector('.nav-toggle');
    if (nav) {
      nav.classList.remove('open');
    }
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
    }
  }

  function syncNavActive(doc) {
    const currentLinks = document.querySelectorAll('header nav a');
    const nextLinks = doc.querySelectorAll('header nav a');
    const activeHref = [];

    nextLinks.forEach(function (link) {
      if (link.classList.contains('active')) {
        activeHref.push(link.getAttribute('href'));
      }
    });

    currentLinks.forEach(function (link) {
      const href = link.getAttribute('href');
      link.classList.toggle('active', activeHref.indexOf(href) !== -1);
    });
  }

  function teardownParallax() {
    if (scrollHandler) {
      window.removeEventListener('scroll', scrollHandler);
      scrollHandler = null;
    }
    parallaxBg = null;
    parallaxPanel = null;
  }

  function setupParallax() {
    teardownParallax();

    parallaxBg = document.getElementById('parallaxBg');
    parallaxPanel = document.querySelector('.parallax-panel');
    if (!parallaxBg || !parallaxPanel) {
      return;
    }

    function updateParallax() {
      if (window.matchMedia('(max-width: 768px)').matches || prefersReducedMotion) {
        parallaxBg.style.transform = 'none';
        return;
      }

      const scrolled = window.scrollY - parallaxPanel.offsetTop;
      parallaxBg.style.transform = 'translateY(' + (scrolled * 0.25) + 'px)';
    }

    scrollHandler = updateParallax;
    window.addEventListener('scroll', scrollHandler, { passive: true });
    updateParallax();
  }

  async function fetchPage(url) {
    if (pageCache.has(url)) {
      return pageCache.get(url);
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to load page');
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const payload = {
      mainHtml: doc.querySelector('main') ? doc.querySelector('main').innerHTML : '',
      title: doc.querySelector('title') ? doc.querySelector('title').textContent : document.title,
      doc: doc
    };

    pageCache.set(url, payload);
    return payload;
  }

  function prefetchPage(url) {
    if (pageCache.has(url)) {
      return;
    }

    fetchPage(url).catch(function () {
      pageCache.delete(url);
    });
  }

  async function navigateTo(url, updateHistory) {
    const targetUrl = resolveUrl(url);
    if (isNavigating) {
      return;
    }

    if (targetUrl === currentPageUrl && updateHistory !== false) {
      return;
    }

    isNavigating = true;
    const main = document.querySelector('main');

    try {
      if (prefersReducedMotion || !main) {
        window.location.href = targetUrl;
        return;
      }

      main.classList.add('is-switching');
      await wait(transitionMs);

      const page = await fetchPage(targetUrl);
      main.innerHTML = page.mainHtml;
      document.title = page.title;
      syncNavActive(page.doc);
      currentPageUrl = targetUrl;

      if (updateHistory !== false) {
        history.pushState({ url: targetUrl }, '', targetUrl);
      }

      window.scrollTo(0, 0);
      setupParallax();
      closeMobileNav();

      main.classList.remove('is-switching');
    } catch (error) {
      window.location.href = targetUrl;
    } finally {
      isNavigating = false;
    }
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

  function setupNavigation() {
    document.addEventListener('click', function (event) {
      const link = event.target.closest('a');
      if (!link || !isInternalPageLink(link)) {
        return;
      }

      event.preventDefault();
      navigateTo(link.getAttribute('href'));
    });

    document.querySelectorAll('header nav a').forEach(function (link) {
      link.addEventListener('mouseenter', function () {
        prefetchPage(resolveUrl(link.getAttribute('href')));
      });
      link.addEventListener('touchstart', function () {
        prefetchPage(resolveUrl(link.getAttribute('href')));
      }, { passive: true });
    });

    window.addEventListener('popstate', function () {
      navigateTo(window.location.href, false);
    });
  }

  function init() {
    currentPageUrl = resolveUrl(window.location.href);
    setupMobileNav();
    setupNavigation();
    setupParallax();
    history.replaceState({ url: currentPageUrl }, '', currentPageUrl);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
