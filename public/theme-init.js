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

  document.documentElement.classList.toggle('dark', theme === 'dark');
})();