/**
 * jocarium — Web Components
 * <site-header> / <site-footer>
 *
 * 依存: config.js（window.JOCARIUM_CONFIG）が先に読み込まれていること。
 *
 * - DOM構築は createElement + append のみ（innerHTML 禁止）
 * - import/export 不使用 — file:// でも動作
 * - ナビのアクティブリンクは pathname で自動判定
 * - アイコンパスは base 属性で注入（"." = ルート / ".." = サブページ）
 */

(() => {
	// config.js が先行していることを保証
	const CFG = window.JOCARIUM_CONFIG;
	if (!CFG) {
		console.error("[jocarium] config.js が読み込まれていません。");
		return;
	}

	const { site, navLinks, footerLinks, icons, languages = [] } = CFG;

	// ==========================================================================
	// ユーティリティ
	// ==========================================================================

	/**
	 * 現在のページパスとリンクの href を比較してアクティブか判定。
	 * ルートの index.html は完全一致のみアクティブ。
	 */
	function isActivePath(href) {
        const normalize = (pathname) => pathname.replace(/\/index\.html$/, "").replace(/\/$/, "") || "/";
        return normalize(location.pathname) === normalize(new URL(href, location.href).pathname);
    }

	/** 装飾アイコン用 <img> を生成 */
	function createIcon(src, size = 22) {
		const img = document.createElement("img");
		img.src = src;
		img.width = size;
		img.height = size;
		img.alt = "";
		img.setAttribute("aria-hidden", "true");
		return img;
	}

	/** 属性とテキストを持つ要素を生成 */
	function el(tag, attrs = {}, text = "") {
		const node = document.createElement(tag);
		for (const [k, v] of Object.entries(attrs)) {
			if (k === "class") node.className = v;
			else node.setAttribute(k, v);
		}
		if (text) node.textContent = text;
		return node;
	}

	// ==========================================================================
	// <site-header>
	// ==========================================================================

	class SiteHeader extends HTMLElement {
		/** base: アセットへの相対パス基点（"." = ルート / ".." = サブページ） */
		get base() {
			return this.getAttribute("base") ?? ".";
		}

		connectedCallback() {
			this.#render();
		}

		#render() {
			const { base } = this;

			const header = el("header");
			const nav = el("nav", { class: "navbar" });
			const container = el("div", { class: "container" });

			// ブランドロゴ
			const brand = el("div", { class: "navbar-brand" });
			const brandLink = el(
				"a",
				{ href: `${base}/${site.rootPage}` },
				site.name,
			);
			brand.append(brandLink, el("span", { class: "navbar-brand-note", "data-i18n": "nav.brandNote" }, "ヨカリウム ／ 奇を収蔵する容器"));

			// ハンバーガーボタン
			const toggle = el("button", {
				class: "navbar-toggle",
				"aria-label": "メニューを開く",
				"aria-expanded": "false",
				"aria-controls": "nav-menu",
                "data-i18n-label": "nav.menuOpen",
			});
			toggle.append(createIcon(`${base}/assets/icons/${icons.menu}`, 22));

			// ナビメニュー
			const menu = el("ul", {
				class: "navbar-menu",
				id: "nav-menu",
			});

			for (const { href, label, key } of navLinks) {
				const resolvedHref = `${base}/${href}`;
				const li = document.createElement("li");
				const a = el("a", { href: resolvedHref, ...(key ? { "data-i18n": key } : {}) }, label);
				if (isActivePath(resolvedHref)) {
					a.setAttribute("aria-current", "page");
					a.classList.add("is-active");
				}
				li.append(a);
				menu.append(li);
			}

			const openMenu = () => {
				toggle.setAttribute("aria-expanded", "true");
				toggle.dataset.i18nLabel = "nav.menuClose";
                toggle.setAttribute("aria-label", window.jocariumI18n?.text("nav.menuClose") ?? "メニューを閉じる");
			};
			const closeMenu = () => {
				toggle.setAttribute("aria-expanded", "false");
				toggle.dataset.i18nLabel = "nav.menuOpen";
                toggle.setAttribute("aria-label", window.jocariumI18n?.text("nav.menuOpen") ?? "メニューを開く");
			};

			toggle.addEventListener("click", (e) => {
				e.stopPropagation();
				toggle.getAttribute("aria-expanded") === "true"
					? closeMenu()
					: openMenu();
			});

			// メニュー内リンクをクリックしたら閉じる
			menu.addEventListener("click", (e) => {
				if (e.target.closest("a")) closeMenu();
			});

			// メニュー外クリックで閉じる
			document.addEventListener("click", (e) => {
				if (!e.target.closest(".navbar")) closeMenu();
			});
			document.addEventListener("keydown", (e) => {
				if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
					closeMenu();
					toggle.focus();
				}
			});

			// 言語スイッチャー
			const langSwitcher = this.#buildLangSwitcher(base);

			const stamp = el("span", { class: "header-stamp", "data-i18n": "nav.stamp" }, "余暇の活動");
			container.append(brand, stamp, langSwitcher, toggle, menu);
			nav.append(container);
			header.append(el("a", { class: "skip-link", href: "#main", "data-i18n": "nav.skip" }, "本文へ"), nav, this.#buildWelcome());
			this.append(header);
		}

        #buildWelcome() {
            const strip = el("div", { class: "webmaster-strip" });
            const window = el("div", { class: "welcome-window", "aria-hidden": "true" });
            const track = el("div", { class: "welcome-track" });
            for (let i = 0; i < 2; i++) {
                track.append(el("span", { "data-i18n": "retro.ticker" }, "★ 握る！ ★ 無害です。小競り合いは、少々。 ★ 余暇を、奇を、ぎゅっと。"));
            }
            window.append(track);
            const toggle = el("button", { class: "motion-toggle", type: "button", "aria-pressed": "false", "data-i18n": "retro.pause" }, "動きを止める");
            strip.append(window, toggle);
            return strip;
        }

		#buildLangSwitcher(base) {
			const wrapper = el("div", { class: "navbar-lang" });

			const toggle = el("button", {
				class: "navbar-lang-toggle",
				"aria-label": "言語を選択",
				"aria-expanded": "false",
				"aria-controls": "lang-menu",
				"data-i18n-label": "nav.langToggle",
			});
			toggle.append(createIcon(`${base}/assets/icons/${icons.earth}`, 18));
			const current = el("span", {
				class: "navbar-lang-current",
				"aria-hidden": "true",
			});
			current.textContent = "JA";
			toggle.append(current);

			const menu = el("ul", {
				id: "lang-menu",
				class: "navbar-lang-menu",
				"aria-label": "言語を選択",
				"data-i18n-label": "nav.langToggle",
			});

			for (const lang of languages) {
				const li = document.createElement("li");
				const btn = el(
					"button",
					{
						class: "navbar-lang-option",
						"data-lang": lang.code,
						"aria-pressed": "false",
					},
					lang.label,
				);
				li.append(btn);
				menu.append(li);
			}

			// ドロップダウン開閉
			toggle.addEventListener("click", (e) => {
				e.stopPropagation();
				const expanded = toggle.getAttribute("aria-expanded") === "true";
				toggle.setAttribute("aria-expanded", String(!expanded));
			});

			menu.addEventListener("click", () => {
				toggle.setAttribute("aria-expanded", "false");
			});

			document.addEventListener("click", (e) => {
				if (!e.target.closest(".navbar-lang")) {
					toggle.setAttribute("aria-expanded", "false");
				}
			});
			wrapper.addEventListener("keydown", (e) => {
				if (e.key === "Escape") {
					toggle.setAttribute("aria-expanded", "false");
					toggle.focus();
				}
			});

			wrapper.append(toggle, menu);
			return wrapper;
		}

	}

	// ==========================================================================
	// <site-footer>
	// ==========================================================================

	class SiteFooter extends HTMLElement {
		get base() {
			return this.getAttribute("base") ?? ".";
		}

		connectedCallback() {
			this.#render();
		}

		#render() {
			const { base } = this;

			const footer = el("footer");
			const container = el("div", { class: "container" });
			const band = el("div", { class: "footer-band" });

			// ワードマーク + タグライン（Ft1 mast-headed）
			const wordmark = el(
				"a",
				{ class: "footer-wordmark", href: `${base}/${site.rootPage}` },
				site.name,
			);
			const tagline = el("p", { class: "footer-tagline", "data-i18n": "footer.tagline" }, "握る！ 余暇を、奇を、ぎゅっと。");

			// フッターリンク
			const linkList = el("ul", { class: "footer-links" });
			for (const { href, label, key } of footerLinks) {
				const li = document.createElement("li");
				li.append(el("a", { href: `${base}/${href}`, ...(key ? { "data-i18n": key } : {}) }, label));
				linkList.append(li);
			}

			// Copyright
			const copy = el("p", { class: "footer-copyright" }, `© ${site.copyright}`);

			band.append(wordmark, tagline, linkList);
			const badges = el("div", { class: "footer-badges" });
            badges.append(
                el("a", { class: "web-badge", href: `${base}/${site.rootPage}` }, "JOCARIUM\nHOME"),
                el("span", { class: "web-badge", lang: "ja" }, "握る！\n余暇リウム"),
                el("a", { class: "web-badge", href: "https://namaran.jocarium.productions/" }, "NAMARAN"),
                el("a", { class: "web-badge", href: `${base}/contact/index.html`, "data-i18n": "shared.getInTouch" }, "お問い合わせ")
            );
            container.append(band, badges, copy);
			footer.append(container);
			this.append(footer);
		}
	}

	// ==========================================================================
	// Custom Elements 登録
	// ==========================================================================

	customElements.define("site-header", SiteHeader);
	customElements.define("site-footer", SiteFooter);
})();
