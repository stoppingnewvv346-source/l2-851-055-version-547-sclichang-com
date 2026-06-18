(function () {
  function start(shell) {
    var video = shell.querySelector('video');
    var cover = shell.querySelector('.player-cover');
    var url = shell.getAttribute('data-video');
    if (!video || !url) {
      return;
    }
    if (cover) {
      cover.classList.add('hidden');
    }
    if (shell.classList.contains('is-started')) {
      video.play().catch(function () {});
      return;
    }
    shell.classList.add('is-started');
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.load();
      video.play().catch(function () {});
      return;
    }
    if (window.Hls && window.Hls.isSupported()) {
      var hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
        video.play().catch(function () {});
      });
      video.addEventListener('error', function () {
        try {
          hls.recoverMediaError();
        } catch (error) {}
      });
      return;
    }
    video.src = url;
    video.load();
    video.play().catch(function () {});
  }

  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.slice.call(document.querySelectorAll('.player-shell')).forEach(function (shell) {
      var cover = shell.querySelector('.player-cover');
      var video = shell.querySelector('video');
      if (cover) {
        cover.addEventListener('click', function (event) {
          event.preventDefault();
          event.stopPropagation();
          start(shell);
        });
      }
      shell.addEventListener('click', function (event) {
        if (video && event.target === video && shell.classList.contains('is-started')) {
          return;
        }
        start(shell);
      });
    });
  });
})();
