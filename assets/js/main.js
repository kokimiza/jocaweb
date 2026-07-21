/**
 * jocarium — Main JavaScript
 * 2026年 Web Platform 準拠。Baseline 確定済みの機能を前提とし、
 * polyfill・レガシー分岐は原則排除。
 */

// ============================================================================
// ダークモード — color-scheme プロパティで管理
// prefers-color-scheme に完全に委ねつつ、手動トグルも対応
// ============================================================================

class DarkModeToggle {
	#isDark;

	constructor() {
		const stored = localStorage.getItem("color-scheme");

		if (stored) {
			this.#isDark = stored === "dark";
		} else {
			this.#isDark = matchMedia("(prefers-color-scheme: dark)").matches;
		}

		this.#apply();

		// システム設定の変更を追従（手動設定がない場合のみ）
		matchMedia("(prefers-color-scheme: dark)").addEventListener(
			"change",
			(e) => {
				if (!localStorage.getItem("color-scheme")) {
					this.#isDark = e.matches;
					this.#apply();
				}
			},
		);

		// ヘッダーのテーマトグルボタンからのイベントを受け取る
		window.addEventListener("jocarium:theme-toggle", () => this.toggle());
	}

	#apply() {
		document.documentElement.style.colorScheme = this.#isDark
			? "dark"
			: "light";
		document.documentElement.dataset.theme = this.#isDark ? "dark" : "light";

		// テーマトグルボタンのラベルを更新
		document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
			btn.setAttribute(
				"aria-label",
				this.#isDark ? "ライトモードに切り替え" : "ダークモードに切り替え",
			);
		});
	}

	toggle() {
		this.#isDark = !this.#isDark;
		localStorage.setItem("color-scheme", this.#isDark ? "dark" : "light");
		this.#apply();
	}
}

// ============================================================================
// スクロールアニメーション — IntersectionObserver
// CSS 側で [data-animate] を使った宣言的な制御に統一
// ============================================================================

function initScrollAnimation() {
	const selectors = [
		".card",
		".brand-card",
		".service-card",
		".value-card",
		".value-item",
		".org-item",
		".philosophy-point",
		".responsibility-card",
		".brand-contact",
		".animate-on-scroll",
		"[data-animate]",
	];

	const targets = document.querySelectorAll(selectors.join(", "));
	if (!targets.length) return;

	// staggered delay — nth-child ではなく DOM 順で付与
	targets.forEach((el, i) => {
		el.dataset.animate = "";
		el.style.animationDelay = `${(i % 6) * 0.07}s`;
	});

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					entry.target.classList.add("is-visible");
					observer.unobserve(entry.target);
				}
			}
		},
		{
			threshold: 0.1,
			rootMargin: "0px 0px -60px 0px",
		},
	);

	targets.forEach((el) => observer.observe(el));
}

// ============================================================================
// フォーム処理 — ContactForm
// ============================================================================

class ContactForm {
	constructor() {
		this.form = document.getElementById("contactForm");
		if (this.form) {
			this.form.addEventListener("submit", (e) => this.#handleSubmit(e));
		}
	}

	async #handleSubmit(e) {
		e.preventDefault();

		const submitBtn = this.form.querySelector('button[type="submit"]');
		// ボタン内のテキストノードだけ保持（img は残す）
		const iconEl = submitBtn.querySelector("img.icon-btn");
		const originalLabel =
			submitBtn.lastChild?.textContent?.trim() ?? "Send Message";

		const setLabel = (text) => {
			if (submitBtn.lastChild?.nodeType === Node.TEXT_NODE) {
				submitBtn.lastChild.textContent = ` ${text}`;
			} else {
				submitBtn.append(` ${text}`);
			}
		};

		submitBtn.disabled = true;
		if (iconEl)
			iconEl.src = iconEl.src.replace(/[^/]+\.svg$/, "loader-pinwheel.svg");
		setLabel("Sending…");

		// アイコンの相対パスを解決するユーティリティ
		const resolveIconPath = (filename) => {
			const base = iconEl?.src ?? "";
			return base.replace(/[^/]+\.svg$/, filename);
		};

		try {
			const data = Object.fromEntries(new FormData(this.form).entries());
			await window.JOCARIUM_NOTICE.sendContactNotice(data);

			if (iconEl) iconEl.src = resolveIconPath("check.svg");
			setLabel("Sent!");
			submitBtn.style.setProperty("background-color", "#28a745", "important");
			this.form.reset();

			setTimeout(() => {
				submitBtn.disabled = false;
				if (iconEl) iconEl.src = resolveIconPath("send.svg");
				setLabel(originalLabel);
				submitBtn.style.removeProperty("background-color");
			}, 3000);
		} catch (err) {
			console.error("ContactForm error:", err);

			if (iconEl) iconEl.src = resolveIconPath("ban.svg");
			setLabel("Error. Try again.");
			submitBtn.style.setProperty("background-color", "#dc3545", "important");

			setTimeout(() => {
				submitBtn.disabled = false;
				if (iconEl) iconEl.src = resolveIconPath("send.svg");
				setLabel(originalLabel);
				submitBtn.style.removeProperty("background-color");
			}, 3000);
		}
	}
}

// ============================================================================
// スムーズスクロール — CSS scroll-behavior: smooth があるのでほぼ不要
// ハッシュリンクのフォーカス管理だけ補完
// ============================================================================

function initSmoothScroll() {
	document.addEventListener("click", (e) => {
		const link = e.target.closest('a[href^="#"]');
		if (!link) return;

		const target = document.querySelector(link.getAttribute("href"));
		if (!target) return;

		// CSS scroll-behavior:smooth が有効なので scrollIntoView は不要。
		// ただし focus をターゲットへ移してアクセシビリティを確保
		target.setAttribute("tabindex", "-1");
		target.focus({ preventScroll: true });
	});
}

// ============================================================================
// ページロードアニメーション — View Transitions が有効な場合は CSS 側に委譲
// ============================================================================

function initPageLoad() {
	// View Transitions 非対応環境のフォールバック
	if (document.startViewTransition) return;

	const hero = document.querySelector(".hero, .page-header");
	if (hero) {
		hero.style.opacity = "0";
		requestAnimationFrame(() => {
			hero.style.transition = "opacity 0.55s ease-out";
			hero.style.opacity = "1";
		});
	}
}

// ============================================================================
// 背景の動物 GIF スキャッタリング — Wikimedia Commons の
// Category:Animated_GIF_files_of_animals からランダムに何点か拾ってきて、
// ページ背景にごく薄く散らす。稚拙で無邪気な「ホームページ感」の演出。
// 実在の外部画像のみを使い、コピーは一切でっち上げない。
// ロック済みのブランド固有ページ（bpm/gutzgutz/kokimiza）と
// prefers-reduced-motion では出さない。
// ============================================================================

class GifScatter {
	#CATEGORY = "Category:Animated_GIF_files_of_animals";
	#CACHE_KEY = "jocarium-scatter-titles-v1";
	#CACHE_TTL = 24 * 60 * 60 * 1000;
	#COUNT = 7;
	#THUMB_WIDTH = 140;
	#API = "https://commons.wikimedia.org/w/api.php";

	async init() {
		const lockedPages = ["bpm", "gutzgutz", "kokimiza"];
		if (lockedPages.includes(document.body.dataset.page)) return;
		if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

		try {
			const titles = await this.#titlePool();
			if (!titles.length) return;

			const picked = this.#sample(titles, this.#COUNT);
			const infos = await this.#imageInfos(picked);
			if (infos.length) this.#render(infos);
		} catch (e) {
			console.warn("[jocarium] gif scatter skipped:", e);
		}
	}

	async #titlePool() {
		try {
			const cached = JSON.parse(localStorage.getItem(this.#CACHE_KEY) ?? "null");
			if (cached && Date.now() - cached.ts < this.#CACHE_TTL && cached.titles?.length) {
				return cached.titles;
			}
		} catch {
			/* 壊れたキャッシュは無視して取り直す */
		}

		const url =
			`${this.#API}?action=query&list=categorymembers` +
			`&cmtitle=${encodeURIComponent(this.#CATEGORY)}&cmtype=file&cmlimit=500` +
			`&format=json&origin=*`;
		const resp = await fetch(url);
		if (!resp.ok) throw new Error(`categorymembers HTTP ${resp.status}`);
		const data = await resp.json();
		const titles = (data.query?.categorymembers ?? []).map((m) => m.title);

		try {
			localStorage.setItem(
				this.#CACHE_KEY,
				JSON.stringify({ ts: Date.now(), titles }),
			);
		} catch {
			/* ストレージ不可でも致命的ではない */
		}

		return titles;
	}

	async #imageInfos(titles) {
		const url =
			`${this.#API}?action=query&titles=${encodeURIComponent(titles.join("|"))}` +
			`&prop=imageinfo&iiprop=url&iiurlwidth=${this.#THUMB_WIDTH}&format=json&origin=*`;
		const resp = await fetch(url);
		if (!resp.ok) throw new Error(`imageinfo HTTP ${resp.status}`);
		const data = await resp.json();
		const pages = Object.values(data.query?.pages ?? {});
		return pages.map((p) => p.imageinfo?.[0]).filter((info) => info?.thumburl);
	}

	#sample(source, n) {
		const pool = [...source];
		const picked = [];
		while (pool.length && picked.length < n) {
			const i = Math.floor(Math.random() * pool.length);
			picked.push(pool.splice(i, 1)[0]);
		}
		return picked;
	}

	#render(infos) {
		const docHeight = Math.max(
			document.documentElement.scrollHeight,
			window.innerHeight,
		);

		const layer = document.createElement("div");
		layer.className = "gif-scatter-layer";
		layer.setAttribute("aria-hidden", "true");
		layer.style.height = `${docHeight}px`;

		for (const info of infos) {
			const img = document.createElement("img");
			img.src = info.thumburl;
			img.alt = "";
			img.loading = "lazy";
			img.decoding = "async";
			img.className = "gif-scatter-item";

			const top = Math.random() * Math.max(docHeight - 160, 0);
			const left = Math.random() * 90;
			const size = 80 + Math.random() * 60;
			const rotate = (Math.random() * 24 - 12).toFixed(1);

			img.style.top = `${top}px`;
			img.style.left = `${left}%`;
			img.style.width = `${size}px`;
			img.style.setProperty("--gif-rotate", `${rotate}deg`);

			layer.append(img);
		}

		document.body.prepend(layer);
	}
}

// ============================================================================
// 初期化
// ============================================================================

function initialize() {
	initScrollAnimation();
	initSmoothScroll();
	initPageLoad();
	new DarkModeToggle();
	new ContactForm();
	new GifScatter().init();
}

// ES module ではなく defer で読み込まれるため、
// DOM は構築済みだが念のため readyState を確認
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initialize);
} else {
	initialize();
}

// ============================================================================
// グローバルエラーハンドリング
// ============================================================================

window.addEventListener("error", ({ message, filename, lineno }) => {
	console.error(`❌ [jocarium] ${message} (${filename}:${lineno})`);
});

window.addEventListener("unhandledrejection", ({ reason }) => {
	console.error("❌ [jocarium] Unhandled rejection:", reason);
});

// ============================================================================
// Performance metrics (dev only)
// ============================================================================

if (
	typeof __DEV__ === "undefined" &&
	window.location.hostname === "localhost"
) {
	window.addEventListener("load", () => {
		const [nav] = performance.getEntriesByType("navigation");
		if (nav) {
			console.log(`⏱ Page load: ${nav.loadEventEnd.toFixed(0)}ms`);
		}
	});
}
