/**
 * jocarium — Contact notification
 *
 * 問い合わせフォームの送信を、別デプロイの Cloudflare Worker
 * （workers/notify）経由で Twist チャンネルに通知する。
 * 秘密情報（Twist の webhook URL）はこのファイルにも main.js にも存在しない
 * — Worker 側の環境変数にのみ置かれる。
 *
 * 依存: config.js（window.JOCARIUM_CONFIG）が先に読み込まれていること。
 */

window.JOCARIUM_NOTICE = {
	async sendContactNotice(payload) {
		const endpoint = window.JOCARIUM_CONFIG?.notifyEndpoint;
		if (!endpoint) {
			throw new Error("[jocarium] notifyEndpoint が config.js に設定されていません。");
		}

		const response = await fetch(endpoint, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			throw new Error(`contact notice failed: ${response.status}`);
		}

		return response.json();
	},
};
