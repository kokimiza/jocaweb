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
	initFilter();
}

// --------------------------------------------------------------------------
// Filter
// --------------------------------------------------------------------------

// Filtering keeps the same disclosure elements, preserving articles already opened.
function initFilter() {
	const radios = document.querySelectorAll('input[name="genre-filter"]');
	const entries = document.querySelectorAll(".news-item");
	const empty = document.getElementById("news-empty");
	const requestedGenre = new URLSearchParams(window.location.search).get("genre")?.toLowerCase();
	const requested = Array.from(radios).find((radio) => radio.value.toLowerCase() === requestedGenre);
	if (requested) requested.checked = true;

	const applyFilter = () => {
		const genre = document.querySelector('input[name="genre-filter"]:checked')?.value ?? "all";
		let visibleCount = 0;
		entries.forEach((entry) => {
			entry.hidden = genre !== "all" && entry.dataset.genre !== genre;
			if (!entry.hidden) visibleCount++;
		});
		if (empty) empty.hidden = visibleCount > 0;
	};

	radios.forEach((radio) => radio.addEventListener("change", applyFilter));
	applyFilter();
}

// --------------------------------------------------------------------------
// News is read in the document flow. Native details handles mouse and keyboard.
// --------------------------------------------------------------------------

function renderList(items) {
	const list = document.getElementById("news-list");
	if (!list) return;

	list.innerHTML = items.map((item) => `
    <details class="news-item" data-genre="${esc(item.genre)}" lang="ja">
      <summary class="news-summary">
        <span class="news-toggle" aria-hidden="true"></span>
        <time class="news-date" datetime="${esc(item.date)}">${formatDate(item.date)}</time>
        <span class="news-genre-badge genre-${esc(item.genre.toLowerCase())}">${escHtml(item.genre)}</span>
        <span class="news-title">${escHtml(item.title)}</span>
      </summary>
      <div class="news-body">${parseMarkdown(item.body ?? "")}</div>
    </details>
  `).join("") + '<p id="news-empty" class="section-note" data-i18n="press.empty" role="status" hidden>該当するお知らせはありません。</p>';
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
