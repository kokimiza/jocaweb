# jocarium-notify

問い合わせフォームの送信を Twist のチャンネルに通知するだけの、単機能 Cloudflare Worker。

jocarium サイト本体（リポジトリルート）とは別デプロイのワーカーとして構成している。
サイト本体の `wrangler.jsonc`（静的アセット配信のみ）はこのワーカーに一切依存しない。

## セットアップ

### 1. Twist 側で channel integration を作成

1. Twist ワークスペース → 通知したいチャンネル → チャンネル設定 → Integrations
2. 外部サービスからの投稿を受け付ける integration（channel integration）を追加
3. インストール後に発行される `post_data_url`
   （`https://api.twist.com/api/v3/integration_incoming/post_data?install_id=...&install_token=...`）
   を控える。**この URL 自体が秘密情報**（Slack の webhook URL と同じ扱い）。

### 2. 依存関係のインストール

リポジトリルートで（npm workspaces 経由）:

```sh
npm install
```

### 3. ローカル開発

`workers/notify/.dev.vars` を作成（`.gitignore` 済み、コミットされない）:

```
TWIST_POST_DATA_URL=https://api.twist.com/api/v3/integration_incoming/post_data?install_id=...&install_token=...
```

```sh
cd workers/notify
npm run dev
```

### 4. 本番シークレットの登録

```sh
cd workers/notify
npx wrangler secret put TWIST_POST_DATA_URL
```

### 5. デプロイ

```sh
cd workers/notify
npm run deploy
```

デプロイ後に発行される URL（`https://jocarium-notify.<subdomain>.workers.dev` または
設定したカスタムドメイン）の末尾に `/contact` を付けたものを、
サイト本体の `assets/js/config.js` の `notifyEndpoint` に反映すること。

### 6. CORS の許可オリジン

`wrangler.jsonc` の `vars.ALLOWED_ORIGIN` を、実際にサイトを配信するオリジン
（例: `https://jocarium.com`）に書き換える。ここはシークレットではないので
コミットしてよい。

## エンドポイント

`POST /contact` — JSON body: `{ name, email, subject, brand, message }`
（`contact/index.html` のフォームの `name` 属性とそのまま対応）。
