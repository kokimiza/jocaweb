/**
 * jocarium — i18n
 * catalog.json を fetch して data-i18n 属性を持つ要素にテキストを適用する。
 * 言語選択は localStorage に保存し、html[lang] も更新する。
 *
 * 依存: config.js（window.JOCARIUM_CONFIG.languages が先に読まれていること）
 * 読み込み順: config.js → components.js → main.js → i18n.js
 */

const STORAGE_KEY = 'jocarium-lang';
const DEFAULT_LANG = 'ja';

class I18n {
	#catalog  = null;
	#lang     = DEFAULT_LANG;

	async init() {
		try {
			this.#catalog = await this.#fetchCatalog();
		} catch (e) {
			console.warn('[i18n] catalog の読み込みに失敗しました:', e);
			return;
		}

		this.#lang = this.#detectLang();
		this.#apply(this.#lang);
		this.#bindEvents();
	}

	// -------------------------------------------------------------------------
	// Catalog 取得
	// -------------------------------------------------------------------------

	async #fetchCatalog() {
		// base 属性から assets へのパスを解決
		const base = document.querySelector('site-header')?.getAttribute('base') ?? '.';
		const resp = await fetch(`${base}/assets/catalog.json`);
		if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
		return resp.json();
	}

	// -------------------------------------------------------------------------
	// 言語検出
	// -------------------------------------------------------------------------

	#detectLang() {
		const available = (this.#catalog.languages ?? []).map(l => l.code);
		const stored    = localStorage.getItem(STORAGE_KEY);
		const browser   = (navigator.language ?? '').split('-')[0];

		if (stored   && available.includes(stored))   return stored;
		if (browser  && available.includes(browser))  return browser;
		return DEFAULT_LANG;
	}

	// -------------------------------------------------------------------------
	// 翻訳の適用
	// -------------------------------------------------------------------------

	#apply(lang) {
		this.#lang = lang;
		localStorage.setItem(STORAGE_KEY, lang);

		const t = this.#catalog[lang];
		if (!t) return;

		// <html lang="…">
		document.documentElement.lang = lang;

		// <title> / <meta> — body[data-page] でページを特定
		const page = document.body.dataset.page;
		if (page) {
			const pageTitle = this.#resolve(t, `meta.${page}.title`);
			if (pageTitle) document.title = pageTitle;
		}

		// data-i18n="key" → textContent
		document.querySelectorAll('[data-i18n]').forEach(el => {
			const val = this.#resolve(t, el.dataset.i18n);
			if (val != null) el.textContent = val;
		});

		// data-i18n-label="key" → aria-label
		document.querySelectorAll('[data-i18n-label]').forEach(el => {
			const val = this.#resolve(t, el.dataset.i18nLabel);
			if (val != null) el.setAttribute('aria-label', val);
		});

		// 言語スイッチャー UI の更新
		this.#updateSwitcherUI(lang);

		document.dispatchEvent(
			new CustomEvent('i18n:change', { detail: { lang } })
		);
	}

	// -------------------------------------------------------------------------
	// 言語スイッチャー UI
	// -------------------------------------------------------------------------

	#updateSwitcherUI(lang) {
		// 現在の言語ラベル表示
		const currentEl = document.querySelector('.navbar-lang-current');
		if (currentEl) {
			const meta = (this.#catalog.languages ?? []).find(l => l.code === lang);
			if (meta) currentEl.textContent = meta.short;
		}

		// aria-selected
		document.querySelectorAll('.navbar-lang-option').forEach(btn => {
			btn.setAttribute(
				'aria-selected',
				btn.dataset.lang === lang ? 'true' : 'false'
			);
		});
	}

	// -------------------------------------------------------------------------
	// イベントバインド
	// -------------------------------------------------------------------------

	#bindEvents() {
		// 言語オプションのクリック（委譲）
		document.addEventListener('click', e => {
			const btn = e.target.closest('.navbar-lang-option[data-lang]');
			if (!btn) return;
			this.#apply(btn.dataset.lang);
			// ドロップダウンを閉じる
			document.querySelector('.navbar-lang-toggle')
				?.setAttribute('aria-expanded', 'false');
		});
	}

	// -------------------------------------------------------------------------
	// ユーティリティ — ドット記法でネストを辿る
	// -------------------------------------------------------------------------

	#resolve(obj, key) {
		return key.split('.').reduce(
			(acc, part) => (acc != null && typeof acc === 'object' ? acc[part] : undefined),
			obj
		);
	}
}

// DOMContentLoaded 後に初期化（defer との二重安全策）
const i18n = new I18n();

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', () => i18n.init());
} else {
	i18n.init();
}
