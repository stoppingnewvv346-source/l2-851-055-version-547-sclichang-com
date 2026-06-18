
(function () {
  var menuButton = document.querySelector('[data-menu-toggle]');
  var mobileMenu = document.querySelector('[data-mobile-menu]');

  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', function () {
      mobileMenu.classList.toggle('is-open');
    });
  }

  var hero = document.querySelector('[data-hero-slider]');

  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var current = 0;

    var activate = function (index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    };

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        activate(Number(dot.getAttribute('data-hero-dot')));
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        activate(current - 1);
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        activate(current + 1);
      });
    }

    window.setInterval(function () {
      activate(current + 1);
    }, 5200);
  }

  var list = document.querySelector('[data-card-list]');
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));
  var search = document.querySelector('[data-card-search]');
  var genre = document.querySelector('[data-genre-filter]');
  var sort = document.querySelector('[data-sort]');

  var normalize = function (value) {
    return String(value || '').toLowerCase().trim();
  };

  var applyFilters = function () {
    var query = normalize(search && search.value);
    var selectedGenre = normalize(genre && genre.value);

    cards.forEach(function (card) {
      var haystack = normalize([
        card.getAttribute('data-title'),
        card.getAttribute('data-region'),
        card.getAttribute('data-genre'),
        card.getAttribute('data-year')
      ].join(' '));
      var cardGenre = normalize(card.getAttribute('data-genre'));
      var matchQuery = !query || haystack.indexOf(query) !== -1;
      var matchGenre = !selectedGenre || cardGenre.indexOf(selectedGenre) !== -1;
      card.classList.toggle('is-hidden', !(matchQuery && matchGenre));
    });
  };

  var applySort = function () {
    if (!list || !sort) {
      return;
    }

    var value = sort.value;
    var sorted = cards.slice();

    if (value === 'year-desc') {
      sorted.sort(function (a, b) {
        return Number(b.getAttribute('data-year') || 0) - Number(a.getAttribute('data-year') || 0);
      });
    }

    if (value === 'title-asc') {
      sorted.sort(function (a, b) {
        return String(a.getAttribute('data-title') || '').localeCompare(String(b.getAttribute('data-title') || ''), 'zh-Hans-CN');
      });
    }

    sorted.forEach(function (card) {
      list.appendChild(card);
    });
  };

  if (search) {
    search.addEventListener('input', applyFilters);
  }

  if (genre) {
    genre.addEventListener('change', applyFilters);
  }

  if (sort) {
    sort.addEventListener('change', function () {
      applySort();
      applyFilters();
    });
  }

  var params = new URLSearchParams(window.location.search);
  var query = params.get('q');

  if (query && search) {
    search.value = query;
    applyFilters();
  }

  var player = document.querySelector('[data-player]');

  if (player) {
    var video = player.querySelector('video');
    var overlay = player.querySelector('[data-play-trigger]');
    var stream = player.getAttribute('data-stream');
    var attached = false;
    var hlsInstance = null;

    var attach = function () {
      if (attached || !video || !stream) {
        return;
      }

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = stream;
      } else if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(stream);
        hlsInstance.attachMedia(video);
      } else {
        video.src = stream;
      }

      attached = true;
    };

    var play = function () {
      attach();
      player.classList.add('is-started');
      var attempt = video.play();

      if (attempt && typeof attempt.catch === 'function') {
        attempt.catch(function () {});
      }
    };

    if (overlay) {
      overlay.addEventListener('click', play);
    }

    video.addEventListener('click', function () {
      if (video.paused) {
        play();
      }
    });

    video.addEventListener('play', function () {
      player.classList.add('is-started');
    });

    window.addEventListener('beforeunload', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  }
})();
