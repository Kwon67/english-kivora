(function () {
  var theme =
    localStorage.getItem('kivora-theme') ??
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.classList.toggle('dark', theme === 'dark');
})();