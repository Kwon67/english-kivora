(function () {
  var ua = window.navigator.userAgent;
  var isIOS =
    /iPad|iPhone|iPod/i.test(ua) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);

  if (isIOS) {
    document.documentElement.dataset.ios = '1';
  }

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
