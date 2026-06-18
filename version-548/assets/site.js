(function () {
  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function $all(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function initMenu() {
    var toggle = $('[data-menu-toggle]');
    var panel = $('[data-mobile-panel]');
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener('click', function () {
      panel.classList.toggle('is-open');
      toggle.textContent = panel.classList.contains('is-open') ? '×' : '☰';
    });
  }

  function initHero() {
    var slider = $('[data-hero-slider]');
    if (!slider) {
      return;
    }
    var slides = $all('.hero-slide', slider);
    var dots = $all('[data-hero-dot]', slider);
    if (!slides.length) {
      return;
    }
    var current = 0;
    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === current);
      });
    }
    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(parseInt(dot.getAttribute('data-hero-dot'), 10) || 0);
      });
    });
    window.setInterval(function () {
      show(current + 1);
    }, 5200);
  }

  function initFilters() {
    var boxes = $all('[data-filter-box]');
    boxes.forEach(function (box) {
      var container = box.parentElement;
      var grid = $('[data-filter-grid]', container);
      var input = $('[data-filter-input]', box);
      var year = 'all';
      var region = 'all';
      var cards = grid ? $all('.movie-card', grid) : [];
      function run() {
        var q = input ? input.value.trim().toLowerCase() : '';
        cards.forEach(function (card) {
          var text = [card.getAttribute('data-title'), card.getAttribute('data-genre'), card.getAttribute('data-type'), card.getAttribute('data-region')].join(' ').toLowerCase();
          var okYear = year === 'all' || card.getAttribute('data-year') === year;
          var okRegion = region === 'all' || card.getAttribute('data-region') === region;
          var okText = !q || text.indexOf(q) !== -1;
          card.classList.toggle('is-hidden', !(okYear && okRegion && okText));
        });
      }
      $all('[data-filter-year]', box).forEach(function (button) {
        button.addEventListener('click', function () {
          year = button.getAttribute('data-filter-year') || 'all';
          $all('[data-filter-year]', box).forEach(function (item) {
            item.classList.toggle('is-active', item === button);
          });
          run();
        });
      });
      $all('[data-filter-region]', box).forEach(function (button) {
        button.addEventListener('click', function () {
          region = button.getAttribute('data-filter-region') || 'all';
          $all('[data-filter-region]', box).forEach(function (item) {
            item.classList.toggle('is-active', item === button);
          });
          run();
        });
      });
      if (input) {
        input.addEventListener('input', run);
      }
    });
  }

  function initSearchPage() {
    var page = $('[data-search-page]');
    if (!page || !window.MOVIES) {
      return;
    }
    var input = $('[data-search-input]', page);
    var resultBox = $('[data-search-results]', page);
    var type = 'all';
    var params = new URLSearchParams(window.location.search);
    if (input && params.get('q')) {
      input.value = params.get('q');
    }
    function makeCard(movie) {
      var tags = movie.tags.slice(0, 3).map(function (tag) {
        return '<span>' + escapeHTML(tag) + '</span>';
      }).join('');
      return '<article class="movie-card movie-card-compact" data-title="' + escapeHTML(movie.title) + '">' +
        '<a class="poster-link" href="' + escapeHTML(movie.url) + '" aria-label="' + escapeHTML(movie.title) + '">' +
        '<img src="' + escapeHTML(movie.cover) + '" alt="' + escapeHTML(movie.title) + '" loading="lazy">' +
        '<span class="card-category">' + escapeHTML(movie.category) + '</span>' +
        '</a>' +
        '<div class="movie-card-body">' +
        '<h2><a href="' + escapeHTML(movie.url) + '">' + escapeHTML(movie.title) + '</a></h2>' +
        '<div class="meta-row"><span>' + escapeHTML(movie.year) + '</span><span>' + escapeHTML(movie.region) + '</span><span>' + escapeHTML(movie.type) + '</span></div>' +
        '<p>' + escapeHTML(movie.oneLine) + '</p>' +
        '<div class="tag-row">' + tags + '</div>' +
        '</div>' +
        '</article>';
    }
    function escapeHTML(value) {
      return String(value || '').replace(/[&<>"]/g, function (char) {
        return {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;'
        }[char];
      });
    }
    function run() {
      var q = input ? input.value.trim().toLowerCase() : '';
      var matches = window.MOVIES.filter(function (movie) {
        var content = [movie.title, movie.region, movie.type, movie.year, movie.genre, movie.tags.join(' ')].join(' ').toLowerCase();
        var okText = !q || content.indexOf(q) !== -1;
        var okType = type === 'all' || movie.type.indexOf(type) !== -1 || movie.genre.indexOf(type) !== -1;
        return okText && okType;
      }).slice(0, 120);
      resultBox.innerHTML = matches.map(makeCard).join('');
    }
    $all('[data-search-type]', page).forEach(function (button) {
      button.addEventListener('click', function () {
        type = button.getAttribute('data-search-type') || 'all';
        $all('[data-search-type]', page).forEach(function (item) {
          item.classList.toggle('is-active', item === button);
        });
        run();
      });
    });
    if (input) {
      input.addEventListener('input', run);
    }
    if (params.get('q')) {
      run();
    }
  }

  function initBackTop() {
    var button = $('[data-back-top]');
    if (!button) {
      return;
    }
    window.addEventListener('scroll', function () {
      button.classList.toggle('is-visible', window.scrollY > 380);
    });
    button.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMenu();
    initHero();
    initFilters();
    initSearchPage();
    initBackTop();
  });
})();
