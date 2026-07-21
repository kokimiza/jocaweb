/**
 * jocarium Press — press.js
 * fetch 不要。news-data.js が window.JOCARIUM_NEWS を事前に設定します。
 * file:// でも Cloudflare Pages でも動作します。
 */

function init() {
	const loadingEl = document.getElementById("news-loading");
	const allItems = window.JOCARIUM_NEWS;

	if (!Array.isArray(allItems) || !allItems.length) {
		if (loadingEl) loadingEl.textContent = "お知らせを読み込めませんでした。";
		return;
	}

	if (loadingEl) loadingEl.remove();
	renderList(allItems);
	initFilter(allItems);
	initListEvents();
	initModal();
}

// --------------------------------------------------------------------------
// Filter
// --------------------------------------------------------------------------

function initFilter(allItems) {
	document.querySelectorAll('input[name="genre-filter"]').forEach((radio) => {
		radio.addEventListener("change", () => {
			const genre = radio.value;
			const filtered =
				genre === "all"
					? allItems
					: allItems.filter((item) => item.genre === genre);
			renderList(filtered);
		});
	});
}

// --------------------------------------------------------------------------
// List rendering
// --------------------------------------------------------------------------

function renderList(items) {
	const list = document.getElementById("news-list");
	if (!list) return;

	if (!items.length) {
		list.innerHTML =
			'<p class="section-note">該当するお知らせはありません。</p>';
		return;
	}

	list.innerHTML = items
		.map(
			(item, i) => `
    <article
      class="news-item"
      role="button"
      tabindex="0"
      data-index="${i}"
    >
      <span class="news-genre-badge genre-${esc(item.genre.toLowerCase())}">${escHtml(item.genre)}</span>
      <time class="news-date" datetime="${esc(item.date)}">${formatDate(item.date)}</time>
      <h3 class="news-title">${escHtml(item.title)}</h3>
    </article>
  `,
		)
		.join("");

	// フィルター後のアイテム配列をリストに紐付ける
	list._items = items;
}

// イベントは init() 時に一度だけ登録
function initListEvents() {
	const list = document.getElementById("news-list");
	if (!list) return;

	list.addEventListener("click", onItemActivate);
	list.addEventListener("keydown", (e) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			onItemActivate(e);
		}
	});
}

function onItemActivate(e) {
	const list = document.getElementById("news-list");
	const el = e.target.closest(".news-item");
	if (!el || !list._items) return;
	const item = list._items[Number(el.dataset.index)];
	if (item) openModal(item);
}

// --------------------------------------------------------------------------
// Modal
// --------------------------------------------------------------------------

function initModal() {
	const modal = document.getElementById("news-modal");
	if (!modal) return;

	modal.addEventListener("click", (e) => {
		if (e.target === modal) modal.close();
	});

	// 閉じるボタン — Invoker API 非対応ブラウザ向けフォールバック
	const closeBtn = modal.querySelector(".news-modal-close");
	if (closeBtn && !("command" in closeBtn)) {
		closeBtn.addEventListener("click", () => modal.close());
	}

	// モーダル close イベントで inert を解除（Escape キー含む全パス対応）
	modal.addEventListener("close", () => {
		document.querySelector("main")?.removeAttribute("inert");
	});
}

function openModal(item) {
	const modal = document.getElementById("news-modal");
	const bodyEl = document.getElementById("modal-body");
	const genreEl = document.getElementById("modal-genre");
	const dateEl = document.getElementById("modal-date");
	const titleEl = document.getElementById("modal-title");

	genreEl.textContent = item.genre;
	genreEl.className = `news-genre-badge genre-${item.genre.toLowerCase()}`;
	dateEl.textContent = formatDate(item.date);
	dateEl.setAttribute("datetime", item.date);
	titleEl.textContent = item.title;
	bodyEl.innerHTML = parseMarkdown(item.body ?? "");

	document.querySelector("main")?.setAttribute("inert", "");
	modal.showModal();
}

// --------------------------------------------------------------------------
// Markdown parser
// --------------------------------------------------------------------------

function parseMarkdown(raw) {
	const lines = raw.split("\n");
	let html = "";
	let inUl = false;
	let pendingLines = [];

	const flushParagraph = () => {
		if (!pendingLines.length) return;
		html += `<p>${pendingLines.map(inline).join("<br>")}</p>`;
		pendingLines = [];
	};

	for (const line of lines) {
		const headingMatch = line.match(/^(#{1,6})\s+(.*)/);

		if (headingMatch) {
			if (inUl) {
				html += "</ul>";
				inUl = false;
			}
			flushParagraph();
			const level = headingMatch[1].length;
			html += `<h${level}>${inline(headingMatch[2])}</h${level}>`;
		} else if (line.startsWith("- ")) {
			flushParagraph();
			if (!inUl) {
				html += "<ul>";
				inUl = true;
			}
			html += `<li>${inline(line.slice(2))}</li>`;
		} else if (line.trim() === "") {
			if (inUl) {
				html += "</ul>";
				inUl = false;
			}
			flushParagraph();
		} else {
			if (inUl) {
				html += "</ul>";
				inUl = false;
			}
			pendingLines.push(line);
		}
	}

	if (inUl) html += "</ul>";
	flushParagraph();

	return html;
}

function inline(text) {
	return escHtml(text)
		.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
		.replace(/`([^`]+)`/g, "<code>$1</code>")
		.replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

// --------------------------------------------------------------------------
// Utilities
// --------------------------------------------------------------------------

function formatDate(dateStr) {
	const d = new Date(`${dateStr}T00:00:00`);
	return d.toLocaleDateString("ja-JP", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

function escHtml(str) {
	return String(str)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function esc(str) {
	return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

// --------------------------------------------------------------------------
// Bootstrap
// --------------------------------------------------------------------------

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", init);
} else {
	init();
}
