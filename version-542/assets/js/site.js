(function () {
    function ready(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    }

    function setupMobileNav() {
        var toggle = document.querySelector('[data-mobile-toggle]');
        var nav = document.querySelector('[data-mobile-nav]');
        if (!toggle || !nav) {
            return;
        }
        toggle.addEventListener('click', function () {
            nav.classList.toggle('is-open');
        });
    }

    function setupHero() {
        var hero = document.querySelector('[data-hero]');
        if (!hero) {
            return;
        }
        var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
        var prev = hero.querySelector('[data-hero-prev]');
        var next = hero.querySelector('[data-hero-next]');
        if (slides.length <= 1) {
            return;
        }
        var index = 0;
        var timer = null;

        function show(nextIndex) {
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === index);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === index);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5600);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
            }
        }

        dots.forEach(function (dot, dotIndex) {
            dot.addEventListener('click', function () {
                show(dotIndex);
                start();
            });
        });

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

        hero.addEventListener('mouseenter', stop);
        hero.addEventListener('mouseleave', start);
        start();
    }

    function textMatch(value, needle) {
        return !needle || String(value || '').toLowerCase().indexOf(needle) !== -1;
    }

    function setupFilters() {
        var forms = Array.prototype.slice.call(document.querySelectorAll('[data-filter-form]'));
        forms.forEach(function (form) {
            var scope = form.parentElement || document;
            var items = Array.prototype.slice.call(scope.querySelectorAll('[data-filter-item]'));
            var keywordInput = form.querySelector('[data-filter-input]');
            var regionInput = form.querySelector('[data-filter-region]');
            var yearInput = form.querySelector('[data-filter-year]');
            var typeInput = form.querySelector('[data-filter-type]');
            var count = form.querySelector('[data-result-count]');
            var empty = scope.querySelector('[data-empty-message]');
            var params = new URLSearchParams(window.location.search);
            var query = params.get('q') || '';

            if (keywordInput && query) {
                keywordInput.value = query;
            }

            function apply() {
                var keyword = keywordInput ? keywordInput.value.trim().toLowerCase() : '';
                var region = regionInput ? regionInput.value.trim().toLowerCase() : '';
                var year = yearInput ? yearInput.value.trim().toLowerCase() : '';
                var type = typeInput ? typeInput.value.trim().toLowerCase() : '';
                var visible = 0;

                items.forEach(function (item) {
                    var haystack = item.getAttribute('data-search') || '';
                    var itemRegion = item.getAttribute('data-region') || '';
                    var itemYear = item.getAttribute('data-year') || '';
                    var itemType = item.getAttribute('data-type') || '';
                    var matched = textMatch(haystack, keyword) &&
                        textMatch(itemRegion, region) &&
                        textMatch(itemYear, year) &&
                        textMatch(itemType, type);

                    item.classList.toggle('hidden-by-filter', !matched);
                    if (matched) {
                        visible += 1;
                    }
                });

                if (count) {
                    count.textContent = String(visible);
                }
                if (empty) {
                    empty.classList.toggle('is-visible', visible === 0);
                }
            }

            [keywordInput, regionInput, yearInput, typeInput].forEach(function (input) {
                if (input) {
                    input.addEventListener('input', apply);
                }
            });

            apply();
        });
    }

    function setupPlayers() {
        var players = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));
        players.forEach(function (player) {
            var video = player.querySelector('video');
            var button = player.querySelector('[data-play-button]');
            var message = player.querySelector('[data-player-message]');
            var url = player.getAttribute('data-video-url');
            var attached = false;
            var hls = null;

            if (!video || !button || !url) {
                return;
            }

            function setMessage(text) {
                if (!message) {
                    return;
                }
                message.textContent = text || '';
                message.classList.toggle('is-visible', Boolean(text));
            }

            function attach() {
                if (attached) {
                    return Promise.resolve();
                }
                attached = true;
                setMessage('正在加载');

                if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = url;
                    video.load();
                    return Promise.resolve();
                }

                if (window.Hls && window.Hls.isSupported()) {
                    return new Promise(function (resolve) {
                        hls = new window.Hls({
                            enableWorker: true,
                            lowLatencyMode: true
                        });
                        hls.attachMedia(video);
                        hls.on(window.Hls.Events.MEDIA_ATTACHED, function () {
                            hls.loadSource(url);
                        });
                        hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
                            resolve();
                        });
                        hls.on(window.Hls.Events.ERROR, function () {
                            setMessage('当前网络暂时无法加载，请稍后再试');
                            resolve();
                        });
                        window.setTimeout(resolve, 1800);
                    });
                }

                video.src = url;
                video.load();
                return Promise.resolve();
            }

            function play() {
                attach().then(function () {
                    return video.play();
                }).then(function () {
                    player.classList.add('is-playing');
                    setMessage('');
                }).catch(function () {
                    setMessage('点击播放器继续观看');
                });
            }

            button.addEventListener('click', function (event) {
                event.preventDefault();
                play();
            });

            video.addEventListener('play', function () {
                player.classList.add('is-playing');
                setMessage('');
            });

            video.addEventListener('pause', function () {
                if (!video.ended && video.currentTime > 0) {
                    player.classList.add('is-playing');
                }
            });

            video.addEventListener('ended', function () {
                player.classList.remove('is-playing');
            });

            window.addEventListener('pagehide', function () {
                if (hls && typeof hls.destroy === 'function') {
                    hls.destroy();
                }
            });
        });
    }

    ready(function () {
        setupMobileNav();
        setupHero();
        setupFilters();
        setupPlayers();
    });
})();
