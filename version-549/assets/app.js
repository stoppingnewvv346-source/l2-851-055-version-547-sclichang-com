(function () {
  function qs(selector, parent) {
    return (parent || document).querySelector(selector);
  }

  function qsa(selector, parent) {
    return Array.prototype.slice.call((parent || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function initMenu() {
    var toggle = qs('[data-menu-toggle]');
    var panel = qs('[data-mobile-panel]');
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener('click', function () {
      panel.classList.toggle('is-open');
    });
  }

  function initHero() {
    var carousel = qs('[data-hero-carousel]');
    if (!carousel) {
      return;
    }
    var slides = qsa('[data-hero-slide]', carousel);
    var dots = qsa('[data-hero-dot]', carousel);
    var prev = qs('[data-hero-prev]', carousel);
    var next = qs('[data-hero-next]', carousel);
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        start();
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        start();
      });
    }
    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        start();
      });
    });
    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);
    show(0);
    start();
  }

  function getParams() {
    var params = new URLSearchParams(window.location.search);
    return params;
  }

  function initFilters() {
    var panel = qs('[data-filter-panel]');
    var list = qs('[data-filter-list]');
    if (!panel || !list) {
      return;
    }
    var input = qs('[data-filter-input]', panel);
    var region = qs('[data-filter-region]', panel);
    var type = qs('[data-filter-type]', panel);
    var genre = qs('[data-filter-genre]', panel);
    var year = qs('[data-filter-year]', panel);
    var sort = qs('[data-filter-sort]', panel);
    var empty = qs('[data-empty-state]');
    var cards = qsa('.filter-item', list);
    var original = cards.slice();
    var queryValue = getParams().get('q');

    if (input && queryValue) {
      input.value = queryValue;
    }

    function matches(card) {
      var q = normalize(input && input.value);
      var cardText = normalize(card.getAttribute('data-keywords'));
      var title = normalize(card.getAttribute('data-title'));
      var cardRegion = card.getAttribute('data-region') || '';
      var cardType = card.getAttribute('data-type') || '';
      var cardGenre = card.getAttribute('data-genre') || '';
      var cardYear = card.getAttribute('data-year') || '';
      if (q && cardText.indexOf(q) === -1 && title.indexOf(q) === -1) {
        return false;
      }
      if (region && region.value && cardRegion !== region.value) {
        return false;
      }
      if (type && type.value && cardType !== type.value) {
        return false;
      }
      if (genre && genre.value && cardGenre !== genre.value) {
        return false;
      }
      if (year && year.value && cardYear !== year.value) {
        return false;
      }
      return true;
    }

    function sortCards(items) {
      var value = sort ? sort.value : 'default';
      if (value === 'default') {
        return original.filter(function (card) {
          return items.indexOf(card) !== -1;
        });
      }
      return items.slice().sort(function (a, b) {
        if (value === 'views') {
          return Number(b.getAttribute('data-views')) - Number(a.getAttribute('data-views'));
        }
        if (value === 'rating') {
          return Number(b.getAttribute('data-rating')) - Number(a.getAttribute('data-rating'));
        }
        if (value === 'date') {
          return String(b.getAttribute('data-date')).localeCompare(String(a.getAttribute('data-date')));
        }
        if (value === 'title') {
          return String(a.getAttribute('data-title')).localeCompare(String(b.getAttribute('data-title')), 'zh-Hans-CN');
        }
        return 0;
      });
    }

    function apply() {
      var visible = cards.filter(matches);
      var sorted = sortCards(visible);
      var visibleSet = new Set(sorted);
      sorted.forEach(function (card) {
        list.appendChild(card);
      });
      cards.forEach(function (card) {
        card.classList.toggle('is-hidden', !visibleSet.has(card));
      });
      if (empty) {
        empty.classList.toggle('is-visible', sorted.length === 0);
      }
    }

    [input, region, type, genre, year, sort].forEach(function (node) {
      if (!node) {
        return;
      }
      node.addEventListener(node.tagName === 'INPUT' ? 'input' : 'change', apply);
    });
    apply();
  }

  function initImages() {
    qsa('img').forEach(function (img) {
      img.addEventListener('error', function () {
        img.classList.add('image-missing');
      }, { once: true });
    });
  }

  function initPlayers() {
    qsa('[data-player]').forEach(function (box) {
      var video = qs('video', box);
      var trigger = qs('.player-trigger', box);
      var source = box.getAttribute('data-src');
      var started = false;
      var hls = null;

      function playVideo() {
        var promise = video.play();
        if (promise && typeof promise.catch === 'function') {
          promise.catch(function () {});
        }
      }

      function start() {
        if (!video || !source) {
          return;
        }
        box.classList.add('is-playing');
        if (!started) {
          started = true;
          if (window.Hls && window.Hls.isSupported()) {
            hls = new window.Hls({
              maxBufferLength: 30,
              enableWorker: true,
              lowLatencyMode: true
            });
            hls.loadSource(source);
            hls.attachMedia(video);
            hls.on(window.Hls.Events.MANIFEST_PARSED, playVideo);
            hls.on(window.Hls.Events.ERROR, function (event, data) {
              if (data && data.fatal) {
                if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                  hls.startLoad();
                } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                  hls.recoverMediaError();
                } else {
                  hls.destroy();
                }
              }
            });
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = source;
            video.addEventListener('loadedmetadata', playVideo, { once: true });
          } else {
            video.src = source;
            video.addEventListener('canplay', playVideo, { once: true });
          }
        } else {
          playVideo();
        }
      }

      if (trigger) {
        trigger.addEventListener('click', function (event) {
          event.preventDefault();
          start();
        });
      }
      box.addEventListener('click', function (event) {
        if (event.target === video) {
          return;
        }
        if (!box.classList.contains('is-playing')) {
          start();
        }
      });
      window.addEventListener('beforeunload', function () {
        if (hls) {
          hls.destroy();
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMenu();
    initHero();
    initFilters();
    initImages();
    initPlayers();
  });
})();
