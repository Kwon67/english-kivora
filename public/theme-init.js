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
  var surface = isDark ? '#050704' : '#f4f5e8';

  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.style.backgroundColor = surface;
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';

  function applyBodySurface() {
    if (document.body) {
      document.body.style.backgroundColor = surface;
    }
  }

  applyBodySurface();
  document.addEventListener('DOMContentLoaded', applyBodySurface);

  if (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  ) {
    document.documentElement.dataset.pwaStandalone = '1';
  }
})();