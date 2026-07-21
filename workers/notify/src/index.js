/**
 * jocarium-notify — Cloudflare Worker
 *
 * jocarium サイトの問い合わせフォームから受け取ったパラメータを、
 * Twist のチャンネルに通知するだけの単機能アプリ。
 *
 * TWIST_POST_DATA_URL（Twist の channel integration が発行する incoming
 * webhook URL）はシークレットとして扱う。ここにハードコードしない。
 *   本番:   npx wrangler secret put TWIST_POST_DATA_URL
 *   ローカル: .dev.vars に TWIST_POST_DATA_URL=... を書く
 */

const MAX_FIELD_LENGTH = 500;
const MAX_MESSAGE_LENGTH = 5000;
const ALLOWED_BRANDS = new Set([
	"",
	"kokimiza",
	"gutzgutz",
	"bpm",
	"systems",
	"other",
]);

function corsHeaders(origin) {
	return {
		"access-control-allow-origin": origin,
		"access-control-allow-methods": "POST, OPTIONS",
		"access-control-allow-headers": "content-type",
		vary: "origin",
	};
}

function json(body, status, origin) {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"content-type": "application/json",
			...corsHeaders(origin),
		},
	});
}

/** Twist の content はメッセージ内で Markdown を解釈するため、フォーム入力の
 *  記号がそのまま構文として評価されないようエスケープする。 */
function escapeMarkdown(text) {
	return text.replace(/([*_`~[\]])/g, "\\$1");
}

function readField(data, key, maxLength) {
	return String(data[key] ?? "")
		.trim()
		.slice(0, maxLength);
}

async function handleContact(request, env, origin) {
	if (!env.TWIST_POST_DATA_URL) {
		return json({ error: "not_configured" }, 500, origin);
	}

	let data;
	try {
		data = await request.json();
	} catch {
		return json({ error: "invalid_json" }, 400, origin);
	}

	const name = readField(data, "name", MAX_FIELD_LENGTH);
	const email = readField(data, "email", MAX_FIELD_LENGTH);
	const subject = readField(data, "subject", MAX_FIELD_LENGTH);
	const brand = readField(data, "brand", MAX_FIELD_LENGTH);
	const message = readField(data, "message", MAX_MESSAGE_LENGTH);

	if (!name || !email || !subject || !message) {
		return json({ error: "missing_fields" }, 400, origin);
	}
	if (!ALLOWED_BRANDS.has(brand)) {
		return json({ error: "invalid_brand" }, 400, origin);
	}

	const lines = [
		"**New contact form submission**",
		`Name: ${escapeMarkdown(name)}`,
		`Email: ${escapeMarkdown(email)}`,
	];
	if (brand) lines.push(`Brand: ${escapeMarkdown(brand)}`);
	lines.push(`Subject: ${escapeMarkdown(subject)}`, "", escapeMarkdown(message));

	const twistResponse = await fetch(env.TWIST_POST_DATA_URL, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({
			content: lines.join("\n"),
			title: `Contact: ${subject}`,
		}),
	});

	if (!twistResponse.ok) {
		return json({ error: "twist_error" }, 502, origin);
	}

	return json({ ok: true }, 200, origin);
}

export default {
	async fetch(request, env) {
		const origin = env.ALLOWED_ORIGIN ?? "*";

		try {
			if (request.method === "OPTIONS") {
				return new Response(null, { status: 204, headers: corsHeaders(origin) });
			}

			const url = new URL(request.url);

			if (url.pathname === "/contact" && request.method === "POST") {
				return await handleContact(request, env, origin);
			}

			return json({ error: "not_found" }, 404, origin);
		} catch (err) {
			// wrangler tail に詳細を残す — 素の 500（CORS ヘッダー無し）を防ぐ
			console.error("[jocarium-notify] unhandled error:", err?.stack ?? err);
			return json({ error: "internal_error" }, 500, origin);
		}
	},
};
