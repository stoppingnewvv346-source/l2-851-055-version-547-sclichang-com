(function () {
  "use strict";

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function initMobileMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var menu = document.querySelector("[data-mobile-menu]");

    if (!toggle || !menu) {
      return;
    }

    toggle.addEventListener("click", function () {
      menu.classList.toggle("is-open");
    });
  }

  function initHeroSlider() {
    var slider = document.querySelector("[data-hero-slider]");

    if (!slider) {
      return;
    }

    var slides = Array.prototype.slice.call(slider.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(slider.querySelectorAll("[data-hero-dot]"));
    var index = 0;
    var timer = null;

    function activate(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    }

    function start() {
      timer = window.setInterval(function () {
        activate(index + 1);
      }, 6200);
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        if (timer) {
          window.clearInterval(timer);
        }

        activate(dotIndex);
        start();
      });
    });

    if (slides.length > 1) {
      start();
    }
  }

  function initFilterScopes() {
    var scopes = Array.prototype.slice.call(document.querySelectorAll("[data-filter-scope]"));

    scopes.forEach(function (scope) {
      var input = scope.querySelector("[data-filter-input]");
      var grid = scope.querySelector("[data-card-grid]");
      var sort = scope.querySelector("[data-sort-select]");
      var empty = scope.querySelector("[data-empty-state]");
      var resultCount = scope.querySelector("[data-result-count]");

      if (!grid) {
        return;
      }

      var cards = Array.prototype.slice.call(grid.children);

      function cardText(card) {
        return normalize([
          card.getAttribute("data-title"),
          card.getAttribute("data-tags"),
          card.getAttribute("data-genre"),
          card.getAttribute("data-year")
        ].join(" "));
      }

      function applyFilter() {
        var query = normalize(input ? input.value : "");
        var shown = 0;

        cards.forEach(function (card) {
          var matched = !query || cardText(card).indexOf(query) !== -1;
          card.classList.toggle("is-hidden", !matched);

          if (matched) {
            shown += 1;
          }
        });

        if (empty) {
          empty.classList.toggle("is-visible", shown === 0);
        }

        if (resultCount) {
          resultCount.textContent = "共 " + shown + " 部影片";
        }
      }

      function applySort() {
        var value = sort ? sort.value : "default";
        var sorted = cards.slice();

        if (value === "views-desc") {
          sorted.sort(function (a, b) {
            return Number(b.getAttribute("data-views") || 0) - Number(a.getAttribute("data-views") || 0);
          });
        }

        if (value === "year-desc") {
          sorted.sort(function (a, b) {
            return Number(b.getAttribute("data-year") || 0) - Number(a.getAttribute("data-year") || 0);
          });
        }

        if (value === "title-asc") {
          sorted.sort(function (a, b) {
            return String(a.getAttribute("data-title") || "").localeCompare(String(b.getAttribute("data-title") || ""), "zh-Hans-CN");
          });
        }

        sorted.forEach(function (card) {
          grid.appendChild(card);
        });
      }

      if (input) {
        input.addEventListener("input", applyFilter);
      }

      if (sort) {
        sort.addEventListener("change", function () {
          applySort();
          applyFilter();
        });
      }

      if (scope.hasAttribute("data-search-page") && input) {
        var params = new URLSearchParams(window.location.search);
        var query = params.get("q");

        if (query) {
          input.value = query;
        }
      }

      applySort();
      applyFilter();
    });
  }

  function initPlayers() {
    var videos = Array.prototype.slice.call(document.querySelectorAll("[data-hls-src]"));

    videos.forEach(function (video) {
      var source = video.getAttribute("data-hls-src");
      var shell = video.closest("[data-player]");
      var overlay = shell ? shell.querySelector("[data-player-toggle]") : null;
      var status = shell ? shell.querySelector("[data-player-status]") : null;
      var hlsInstance = null;

      function setStatus(message) {
        if (status) {
          status.textContent = message;
        }
      }

      function hideOverlay() {
        if (overlay) {
          overlay.classList.add("is-hidden");
        }
      }

      function showOverlay() {
        if (overlay) {
          overlay.classList.remove("is-hidden");
        }
      }

      if (!source) {
        setStatus("播放源缺失");
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });

        hlsInstance.loadSource(source);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
          setStatus("播放源已就绪");
        });
        hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            setStatus("播放源加载异常，可刷新页面重试");
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
        setStatus("播放源已就绪");
      } else {
        video.src = source;
        setStatus("浏览器将尝试原生播放 HLS");
      }

      if (overlay) {
        overlay.addEventListener("click", function () {
          var playPromise = video.play();

          if (playPromise && typeof playPromise.then === "function") {
            playPromise.then(hideOverlay).catch(function () {
              setStatus("点击播放器控制栏开始播放");
            });
          } else {
            hideOverlay();
          }
        });
      }

      video.addEventListener("play", hideOverlay);
      video.addEventListener("pause", showOverlay);
      video.addEventListener("ended", showOverlay);

      window.addEventListener("beforeunload", function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  }

  function initScrollPlayerButtons() {
    var buttons = Array.prototype.slice.call(document.querySelectorAll("[data-scroll-player]"));

    buttons.forEach(function (button) {
      button.addEventListener("click", function (event) {
        var player = document.querySelector("[data-player]");

        if (player) {
          event.preventDefault();
          player.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initMobileMenu();
    initHeroSlider();
    initFilterScopes();
    initPlayers();
    initScrollPlayerButtons();
  });
})();
