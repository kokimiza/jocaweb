/**
 * jocarium — Site Configuration
 *
 * サイト全体の設定を一元管理します。
 * components.js と main.js の両方から window.JOCARIUM_CONFIG を参照します。
 *
 * 読み込み順: config.js → components.js → main.js
 * （HTMLの <script defer> で順序が保証されます）
 */

window.JOCARIUM_CONFIG = {
	/** サイト基本情報 */
	site: {
		name: "jocarium",
		copyright: "2026 jocarium.",
		rootPage: "index.html",
	},

	/**
	 * workers/notify（別デプロイの Cloudflare Worker）のエンドポイント。
	 * デプロイ後に実際の workers.dev / カスタムドメインの URL へ書き換えること。
	 */
	notifyEndpoint: "https://jocarium-notify.YOUR-SUBDOMAIN.workers.dev/contact",

	/**
	 * ナビゲーションリンク
	 * href は base ディレクトリからの相対パスで記述。
	 * components.js 側で `${base}/${item.href}` として解決します。
	 */
	navLinks: [
		{ href: "press/index.html", label: "Press" },
		{ href: "kokimiza/index.html", label: "kokimiza" },
		{ href: "gutzgutz/index.html", label: "Gutzgutz" },
		{ href: "bpm/index.html", label: "BPM" },
		{ href: "systems/index.html", label: "Systems" },
		{ href: "contact/index.html", label: "Contact" },
	],

	/** フッターリンク */
	footerLinks: [
		{ href: "press/index.html", label: "Press" },
		{ href: "contact/index.html", label: "Contact" },
	],

	/**
	 * 対応言語 — i18n.js / components.js が参照
	 * code: BCP 47 言語タグ, short: ナビ表示用略称
	 */
	languages: [
		{ code: "ja", label: "日本語", short: "JA" },
		{ code: "en", label: "English", short: "EN" },
	],

	/**
	 * コンポーネントが使うアイコンファイル名
	 * パスは `${base}/assets/icons/${icons.xxx}` で解決します。
	 */
	icons: {
		menu: "menu.svg",
		earth: "earth.svg",
		sun: "sun.svg",
		moon: "moon.svg",
	},
};
