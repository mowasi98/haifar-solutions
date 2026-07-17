(function () {
  const duration = 450;

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

  function fadeIn() {
    document.body.classList.remove('page-leaving');
    document.body.classList.add('page-loaded');
  }

  function fadeOutAndGo(url) {
    document.body.classList.remove('page-loaded');
    document.body.classList.add('page-leaving');
    window.setTimeout(function () {
      window.location.href = url;
    }, duration);
  }

  document.addEventListener('DOMContentLoaded', function () {
    requestAnimationFrame(fadeIn);

    document.querySelectorAll('a[href]').forEach(function (link) {
      if (!isInternalPageLink(link)) {
        return;
      }

      link.addEventListener('click', function (event) {
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
          return;
        }

        const href = link.getAttribute('href');
        const targetUrl = new URL(href, window.location.href).href;

        if (targetUrl === window.location.href) {
          return;
        }

        event.preventDefault();
        fadeOutAndGo(href);
      });
    });
  });

  window.addEventListener('pageshow', function (event) {
    if (event.persisted) {
      fadeIn();
    }
  });
})();
