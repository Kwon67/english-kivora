(function () {
  var theme = null;

  try {
    theme = localStorage.getItem('kivora-theme');
  } catch (_error) {
    theme = null;
  }

  if (!theme) {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  var isDark = theme === 'dark';

  document.documentElement.classList.toggle('dark', isDark);

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