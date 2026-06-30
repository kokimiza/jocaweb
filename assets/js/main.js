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
		document.documentElement.style.colorScheme = this.#isDark ? "dark" : "light";
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
			// TODO: バックエンド実装時は fetch('/api/contact', ...) に差し替え
			await new Promise((resolve) => setTimeout(resolve, 900));

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
// 初期化
// ============================================================================

function initialize() {
	initScrollAnimation();
	initSmoothScroll();
	initPageLoad();
	new DarkModeToggle();
	new ContactForm();
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
