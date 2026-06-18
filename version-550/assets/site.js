(function () {
  "use strict";

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }
    callback();
  }

  function initMobileMenu() {
    var toggle = document.querySelector(".menu-toggle");
    var panel = document.querySelector(".mobile-panel");
    if (!toggle || !panel) {
      return;
    }

    toggle.addEventListener("click", function () {
      var isOpen = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!isOpen));
      panel.hidden = isOpen;
    });
  }

  function initBackTop() {
    var button = document.querySelector(".back-top");
    if (!button) {
      return;
    }

    function update() {
      if (window.scrollY > 500) {
        button.classList.add("is-visible");
      } else {
        button.classList.remove("is-visible");
      }
    }

    window.addEventListener("scroll", update, { passive: true });
    button.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    update();
  }

  function initHeroCarousel() {
    var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
    if (slides.length <= 1) {
      return;
    }

    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
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

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        show(dotIndex);
        start();
      });
    });

    var showcase = document.querySelector(".hero-showcase");
    if (showcase) {
      showcase.addEventListener("mouseenter", stop);
      showcase.addEventListener("mouseleave", start);
    }
    start();
  }

  function initLocalFilters() {
    var toolbars = Array.prototype.slice.call(document.querySelectorAll("[data-filter-toolbar]"));
    toolbars.forEach(function (toolbar) {
      var section = toolbar.parentElement;
      var grid = section ? section.querySelector("[data-filter-grid]") : null;
      if (!grid) {
        return;
      }

      var cards = Array.prototype.slice.call(grid.querySelectorAll(".movie-card"));
      var searchInput = toolbar.querySelector(".local-search");
      var typeFilter = toolbar.querySelector(".type-filter");
      var yearFilter = toolbar.querySelector(".year-filter");
      var clearButton = toolbar.querySelector(".clear-filter");
      var count = toolbar.querySelector(".filter-count");

      function apply() {
        var query = (searchInput && searchInput.value || "").trim().toLowerCase();
        var type = typeFilter && typeFilter.value || "";
        var year = yearFilter && yearFilter.value || "";
        var visible = 0;

        cards.forEach(function (card) {
          var text = [
            card.dataset.title,
            card.dataset.genre,
            card.dataset.region,
            card.dataset.type,
            card.dataset.year
          ].join(" ").toLowerCase();
          var matchQuery = !query || text.indexOf(query) !== -1;
          var matchType = !type || (card.dataset.type || "").indexOf(type) !== -1;
          var matchYear = !year || (card.dataset.year || "").indexOf(year) !== -1;
          var shouldShow = matchQuery && matchType && matchYear;
          card.hidden = !shouldShow;
          if (shouldShow) {
            visible += 1;
          }
        });

        if (count) {
          count.textContent = "显示 " + visible + " / " + cards.length + " 部";
        }
      }

      [searchInput, typeFilter, yearFilter].forEach(function (control) {
        if (control) {
          control.addEventListener("input", apply);
          control.addEventListener("change", apply);
        }
      });

      if (clearButton) {
        clearButton.addEventListener("click", function () {
          if (searchInput) {
            searchInput.value = "";
          }
          if (typeFilter) {
            typeFilter.value = "";
          }
          if (yearFilter) {
            yearFilter.value = "";
          }
          apply();
        });
      }

      apply();
    });
  }

  function cardTemplate(movie) {
    var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return "<span>" + escapeHtml(tag) + "</span>";
    }).join("");

    return "" +
      "<article class=\"movie-card\" data-title=\"" + escapeHtml(movie.title) + "\" data-year=\"" + escapeHtml(movie.year) + "\" data-type=\"" + escapeHtml(movie.type) + "\" data-genre=\"" + escapeHtml(movie.genre) + "\" data-region=\"" + escapeHtml(movie.region) + "\">" +
      "<a href=\"" + escapeHtml(movie.url) + "\" class=\"poster\" aria-label=\"观看 " + escapeHtml(movie.title) + "\">" +
      "<img src=\"" + escapeHtml(movie.cover) + "\" alt=\"" + escapeHtml(movie.title) + " 封面\" loading=\"lazy\" onerror=\"this.closest('.poster').classList.add('poster-missing');\" />" +
      "<span class=\"poster-fallback\">" + escapeHtml(movie.title) + "</span>" +
      "<span class=\"card-play\">▶</span>" +
      "</a>" +
      "<div class=\"movie-card-body\">" +
      "<div class=\"movie-card-meta\"><span>" + escapeHtml(movie.year) + "</span><span>" + escapeHtml(movie.region) + "</span><span>" + escapeHtml(movie.type) + "</span></div>" +
      "<h3><a href=\"" + escapeHtml(movie.url) + "\">" + escapeHtml(movie.title) + "</a></h3>" +
      "<p>" + escapeHtml(movie.oneLine || "") + "</p>" +
      "<div class=\"tag-row\">" + tags + "</div>" +
      "</div>" +
      "</article>";
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function initSearchPage() {
    var results = document.querySelector("[data-search-results]");
    var status = document.querySelector("[data-search-status]");
    if (!results || !status || !window.MOVIE_SEARCH_INDEX) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var query = (params.get("q") || "").trim();
    var pageInput = document.querySelector(".page-search input[name='q']");
    if (pageInput) {
      pageInput.value = query;
    }

    if (!query) {
      status.textContent = "请输入关键词开始搜索。";
      return;
    }

    var lower = query.toLowerCase();
    var matched = window.MOVIE_SEARCH_INDEX.filter(function (movie) {
      var haystack = [
        movie.title,
        movie.region,
        movie.type,
        movie.year,
        movie.genre,
        (movie.tags || []).join(" "),
        movie.oneLine
      ].join(" ").toLowerCase();
      return haystack.indexOf(lower) !== -1;
    }).slice(0, 240);

    status.textContent = "“" + query + "” 找到 " + matched.length + " 条结果" + (matched.length >= 240 ? "，已显示前 240 条。" : "。");
    results.innerHTML = matched.map(cardTemplate).join("");
  }

  function initPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll(".js-player"));
    players.forEach(function (player) {
      var video = player.querySelector("video");
      var startButton = player.querySelector(".player-start");
      var status = player.querySelector(".player-status");
      var source = player.dataset.videoSrc;
      var hlsInstance = null;
      var initialized = false;

      function setStatus(message) {
        if (status) {
          status.textContent = message;
        }
      }

      function playVideo() {
        var promise = video.play();
        if (promise && typeof promise.catch === "function") {
          promise.catch(function () {
            setStatus("浏览器阻止了自动播放，请再次点击视频播放。 ");
          });
        }
      }

      function initialize() {
        if (!video || !source) {
          setStatus("播放源不可用");
          return;
        }

        if (initialized) {
          player.classList.add("is-playing");
          playVideo();
          return;
        }
        initialized = true;

        if (video.canPlayType("application/vnd.apple.mpegurl") || video.canPlayType("application/x-mpegURL")) {
          video.src = source;
          player.classList.add("is-playing");
          setStatus("使用浏览器原生 HLS 播放");
          playVideo();
          return;
        }

        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });
          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);
          hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
            player.classList.add("is-playing");
            setStatus("HLS 播放源已加载");
            playVideo();
          });
          hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
            if (data && data.fatal) {
              setStatus("播放遇到网络或媒体错误，请刷新后重试。 ");
            }
          });
          return;
        }

        video.src = source;
        player.classList.add("is-playing");
        setStatus("当前浏览器未检测到 HLS.js，已尝试直接播放 m3u8。 ");
        playVideo();
      }

      if (startButton) {
        startButton.addEventListener("click", initialize);
      }
      if (video) {
        video.addEventListener("play", function () {
          player.classList.add("is-playing");
        });
        video.addEventListener("pause", function () {
          if (!video.ended) {
            setStatus("已暂停");
          }
        });
      }
      window.addEventListener("beforeunload", function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  }

  ready(function () {
    initMobileMenu();
    initBackTop();
    initHeroCarousel();
    initLocalFilters();
    initSearchPage();
    initPlayers();
  });
})();
