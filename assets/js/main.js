/** jocarium — small interactions for the printed-flyer UI. */
class ContactForm {
  constructor() {
    this.form = document.getElementById('contactForm');
    this.form?.addEventListener('submit', (event) => this.submit(event));
  }

  async submit(event) {
    event.preventDefault();
    if (!this.form.reportValidity() || this.form.dataset.sending === 'true') return;
    const button = this.form.querySelector('[type="submit"]');
    const label = button.querySelector('[data-i18n]');
    const status = document.getElementById('form-status');
    const text = (key) => window.jocariumI18n?.text(`contact.form.${key}`) ?? {
      submit: 'おたよりを送る', sending: '送信中…', sent: '送信しました。',
      error: '送信できませんでした。内容を残していますので、もう一度お試しください。'
    }[key];
    this.form.dataset.sending = 'true';
    this.form.setAttribute('aria-busy', 'true');
    button.disabled = true;
    label.textContent = text('sending');
    label.dataset.i18n = 'contact.form.sending';
    status.textContent = text('sending');
    status.dataset.i18n = 'contact.form.sending';
    try {
      const data = Object.fromEntries(new FormData(this.form).entries());
      await window.JOCARIUM_NOTICE.sendContactNotice(data);
      this.form.reset();
      status.textContent = text('sent');
      status.dataset.i18n = 'contact.form.sent';
    } catch {
      status.textContent = text('error');
      status.dataset.i18n = 'contact.form.error';
    } finally {
      delete this.form.dataset.sending;
      this.form.removeAttribute('aria-busy');
      button.disabled = false;
      label.textContent = text('submit');
      label.dataset.i18n = 'contact.form.submit';
    }
  }
}
new ContactForm();

// Persist the pause control across pages. OS reduced-motion preference wins.
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const motionButton = document.querySelector('.motion-toggle');
let motionPaused = false;
try { motionPaused = localStorage.getItem('jocarium-motion') === 'paused'; } catch {}
function applyMotion() {
  const paused = motionPreference.matches || motionPaused;
  document.documentElement.dataset.motion = paused ? 'paused' : 'running';
  if (!motionButton) return;
  const key = motionPreference.matches ? 'reduced' : paused ? 'resume' : 'pause';
  motionButton.dataset.i18n = `retro.${key}`;
  motionButton.textContent = window.jocariumI18n?.text(`retro.${key}`) ?? {
    reduced: '動きは停止中', resume: '動かす', pause: '動きを止める'
  }[key];
  motionButton.disabled = motionPreference.matches;
  motionButton.setAttribute('aria-pressed', String(paused));
}
motionButton?.addEventListener('click', () => {
  motionPaused = !motionPaused;
  try { localStorage.setItem('jocarium-motion', motionPaused ? 'paused' : 'running'); } catch {}
  applyMotion();
});
motionPreference.addEventListener('change', applyMotion);
applyMotion();

// An honest local interaction counter, not a fabricated visitor count.
const gripConsole = document.querySelector('.grip-console');
if (gripConsole) {
  const output = document.getElementById('grip-count');
  const button = gripConsole.querySelector('.grip-button');
  const message = gripConsole.querySelector('.grip-console-message');
  const stage = document.querySelector('.hero-stage');
  let count = 0;
  let squeezeTimer;
  try {
    const saved = Number(localStorage.getItem('jocarium-grips'));
    if (Number.isSafeInteger(saved) && saved >= 0) count = Math.min(saved, 9999999);
  } catch {}
  output.value = String(count).padStart(7, '0');
  gripConsole.hidden = false;
  button.addEventListener('click', () => {
    count = Math.min(count + 1, 9999999);
    output.value = String(count).padStart(7, '0');
    try { localStorage.setItem('jocarium-grips', String(count)); } catch {}
    message.dataset.i18n = 'retro.squeeze';
    message.textContent = window.jocariumI18n?.text('retro.squeeze') ?? 'ぎゅっ！';
    clearTimeout(squeezeTimer);
    stage.classList.remove('is-gripping');
    // Restart the short CSS squeeze when clicked again.
    void stage.offsetWidth;
    stage.classList.add('is-gripping');
    squeezeTimer = setTimeout(() => stage.classList.remove('is-gripping'), 350);
  });
}

// Move keyboard focus with in-page navigation, including the skip link.
document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;
  const target = document.getElementById(link.hash.slice(1));
  if (!target) return;
  target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
});
