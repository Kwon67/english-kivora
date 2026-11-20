import LandingWordmark from './LandingWordmark'
import styles from './LandingPolish.module.css'

const bootIntro = `(() => {
  const overlay = document.getElementById('kivora-intro');
  if (!overlay || document.hidden || location.hash || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const connection = navigator.connection;
  if (connection?.saveData || ['slow-2g', '2g', '3g'].includes(connection?.effectiveType) ||
      (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 2) ||
      (navigator.deviceMemory > 0 && navigator.deviceMemory <= 2)) return;
  try {
    if (sessionStorage.getItem('kivora-intro-seen')) return;
    sessionStorage.setItem('kivora-intro-seen', '1');
  } catch { return; }

  overlay.dataset.intro = 'waiting';
  const started = performance.now();
  let delay;
  const open = () => {
    if (overlay.dataset.intro !== 'waiting') return;
    clearTimeout(deadline);
    clearTimeout(delay);
    removeEventListener('pointerdown', open);
    removeEventListener('keydown', open);
    document.removeEventListener('visibilitychange', onVisibility);
    overlay.dataset.intro = 'opening';
  };
  const onVisibility = () => { if (document.hidden) open(); };
  const deadline = setTimeout(open, 1050);
  const ready = () => {
    const hero = document.querySelector('[data-art-scene="discovery"] img');
    Promise.allSettled([document.fonts.ready, hero?.decode()]).then(() => {
      if (overlay.dataset.intro === 'waiting') delay = setTimeout(open, Math.max(0, 560 - (performance.now() - started)));
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true });
  else ready();
  addEventListener('pointerdown', open, { once: true, passive: true });
  addEventListener('keydown', open, { once: true });
  document.addEventListener('visibilitychange', onVisibility);
})();`

export default function LandingIntro() {
  return <>
    <div id="kivora-intro" className={styles.intro} aria-hidden="true" suppressHydrationWarning>
      <div className={styles.introBrand}><LandingWordmark /><span className={styles.introHello} lang="en">hello.</span></div>
    </div>
    <script dangerouslySetInnerHTML={{ __html: bootIntro }} />
  </>
}
