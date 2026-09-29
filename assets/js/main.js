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
