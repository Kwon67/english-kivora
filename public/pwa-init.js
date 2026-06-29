(function () {
  var isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  if (isStandalone) {
    document.documentElement.dataset.pwaStandalone = '1';
  } else {
    document.documentElement.dataset.pwaReady = '1';
  }

  function markPwaReady() {
    document.documentElement.dataset.pwaReady = '1';
  }

  if (isStandalone) {
    document.addEventListener('DOMContentLoaded', function () {
      window.setTimeout(markPwaReady, 900);
    });
    window.setTimeout(markPwaReady, 3500);
  }
})();
