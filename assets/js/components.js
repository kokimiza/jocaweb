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

	const { site, navLinks, footerLinks, icons } = CFG;

	// ==========================================================================
	// ユーティリティ
	// ==========================================================================

	/**
	 * 現在のページパスとリンクの href を比較してアクティブか判定。
	 * ルートの index.html は完全一致のみアクティブ。
	 */
	function isActivePath(href) {
		const current = location.pathname.replace(/\/$/, "") || "/";
		const target =
			new URL(href, location.href).pathname.replace(/\/$/, "") || "/";

		if (target === "" || target === "/index.html" || target === "/") {
			return current === "" || current === "/" || current === "/index.html";
		}
		return (
			current === target ||
			current.startsWith(target.replace(/\/index\.html$/, "/"))
		);
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
			brand.append(brandLink);

			// ハンバーガーボタン
			const toggle = el("button", {
				class: "navbar-toggle",
				"aria-label": "メニューを開く",
				"aria-expanded": "false",
				"aria-controls": "nav-menu",
			});
			toggle.append(createIcon(`${base}/assets/icons/${icons.menu}`, 22));

			// ナビメニュー
			const menu = el("ul", {
				class: "navbar-menu",
				id: "nav-menu",
			});

			for (const { href, label } of navLinks) {
				const resolvedHref = `${base}/${href}`;
				const li = document.createElement("li");
				const a = el("a", { href: resolvedHref }, label);
				if (isActivePath(resolvedHref)) {
					a.setAttribute("aria-current", "page");
					a.classList.add("is-active");
				}
				li.append(a);
				menu.append(li);
			}

			const openMenu = () => {
				menu.classList.add("is-open");
				toggle.setAttribute("aria-expanded", "true");
				toggle.setAttribute("aria-label", "メニューを閉じる");
			};
			const closeMenu = () => {
				menu.classList.remove("is-open");
				toggle.setAttribute("aria-expanded", "false");
				toggle.setAttribute("aria-label", "メニューを開く");
			};

			toggle.addEventListener("click", (e) => {
				e.stopPropagation();
				menu.classList.contains("is-open") ? closeMenu() : openMenu();
			});

			// メニュー内リンクをクリックしたら閉じる
			menu.addEventListener("click", (e) => {
				if (e.target.closest("a")) closeMenu();
			});

			// メニュー外クリックで閉じる
			document.addEventListener("click", (e) => {
				if (!e.target.closest(".navbar")) closeMenu();
			});

			container.append(brand, toggle, menu);
			nav.append(container);
			header.append(nav);
			this.append(header);
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

			// Copyright
			const copy = document.createElement("p");
			const icon = createIcon(`${base}/assets/icons/${icons.earth}`, 14);
			icon.classList.add("icon-inline", "icon-muted");
			copy.append(icon, document.createTextNode(` \u00A9 ${site.copyright}`));

			// フッターリンク
			const linkList = el("ul", { class: "footer-links" });
			for (const { href, label } of footerLinks) {
				const li = document.createElement("li");
				li.append(el("a", { href: `${base}/${href}` }, label));
				linkList.append(li);
			}

			container.append(copy, linkList);
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
