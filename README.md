# jocarium Overview

## Concept

**jocarium** is a personal creative venture built entirely around leisure-driven creation. Rather than pursuing client work or market trends, every project originates from intrinsic motivation and long-term creative interests.

Its direction is guided by three core values:

* **cultivate veiled VIRTUE** — Cultivate virtue found within ambiguity.
* **clothe form in WISDOM** — Give form through wisdom.
* **SPARK pavilion** — Create a place where creativity and talent ignite.

The organization is designed as if it were a small studio, although it currently operates as a solo project. This structure provides clear separation of responsibilities and allows future expansion without changing its fundamental architecture.

## Creative Brands

### kokimiza

An animation and visual production brand focused on creating satisfying, expressive, and pleasant-to-watch experiences.

* Animation
* Short films
* Motion design
* Visual storytelling

---

### Gutzgutz

A game development brand dedicated to creating experiences that excite players and keep them coming back.

* Game development
* Gameplay systems
* Racing games
* Experimental game mechanics

---

### jocarium Systems

The software engineering brand responsible for the technical foundation of jocarium.

Its primary mission is to build and maintain internal infrastructure, development tools, and core business systems. Open-source publication and external distribution are secondary outcomes rather than primary objectives.

* Internal business systems
* Software engineering
* Open-source software
* Development infrastructure
* Automation and DevSecOps

---

### BURNING PIZZA METHODS

The in-house music label producing original music, background music (BGM), and sound effects for jocarium projects.

It provides audio assets across the entire creative ecosystem while also functioning as an independent music label.

* Original music
* Background music (BGM)
* Sound effects (SE)
* Audio production

## Organization

Internally, jocarium is organized by functional responsibilities rather than brands.

The Production Department oversees **kokimiza**, **Gutzgutz**, and **BURNING PIZZA METHODS**, while the Information & Communications Technology Department is responsible for **jocarium Systems**. Administrative and strategic functions support the organization as a whole.

## Design Philosophy

Each brand contributes a different creative discipline while sharing the same long-term vision.

* **kokimiza** creates visual experiences.
* **Gutzgutz** creates interactive experiences.
* **BURNING PIZZA METHODS** creates audio experiences.
* **jocarium Systems** builds the technology that empowers them.

Together they form a self-sustaining creative ecosystem driven by craftsmanship, curiosity, and the freedom to create.

## Ops — Contact form → Twist notifications

Contact form submissions (`contact/index.html`) are relayed to a Twist channel via a
separate, independently-deployed Cloudflare Worker at `workers/notify/`. Full detail
lives in [`workers/notify/README.md`](workers/notify/README.md); this is the
"rebuild it from zero" cheat sheet in case the integration or `.dev.vars` gets deleted.

### Recreating the Twist channel integration

1. Open the Twist workspace → the channel that should receive notifications.
2. Channel settings → **Integrations** → **Add integration** → **Create Integration**.
3. When asked *General / Thread / Channel*, choose **Channel** (posts a new thread per
   notification; General is for full OAuth apps, Thread only comments on one fixed
   existing thread).
4. Twist gives you a **Shareable Install URL**
   (`https://twist.com/integrations/install/<id>_<hash>`). Open it yourself, pick the
   workspace/channel, and complete the install.
5. After install, Twist shows a **`post_data_url`** — a URL of the shape
   `https://twist.com/api/v3/integration_incoming/post_data?install_id=...&install_token=...`.
   **This URL is a secret** (same category as a Slack webhook URL — whoever has it can
   post into the channel). Never commit it, never put it in client-side JS.

### What goes in `.dev.vars`

Create `workers/notify/.dev.vars` (git-ignored, never committed):

```
TWIST_POST_DATA_URL=https://twist.com/api/v3/integration_incoming/post_data?install_id=...&install_token=...
```

For production, register the same value as a Cloudflare secret instead of a file:

```sh
cd workers/notify
npx wrangler secret put TWIST_POST_DATA_URL
```

### Wiring on the site side

- `assets/js/config.js` → `notifyEndpoint` must point at the deployed worker's
  `/contact` route (currently `https://notify-app.jocarium.productions/contact`).
- `workers/notify/wrangler.jsonc` → `vars.ALLOWED_ORIGIN` must match the site's real
  origin (currently `https://jocarium.productions`) — it's the CORS allow-list, not a
  secret, so it's fine to commit.
