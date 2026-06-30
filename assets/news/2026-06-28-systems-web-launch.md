---
title: jocarium Systems、公式サイトのインフラを構築・公開
date: 2026-06-28
genre: Systems
---

jocarium Systems は、jocarium 公式サイトの設計・構築・Cloudflare Pages へのデプロイを完了しました。

## 技術スタック

フレームワーク不使用のバニラ HTML / CSS / JavaScript で構築。2026年の Web Platform 標準機能（Popover API、CSS `light-dark()`、Container Queries、View Transitions など）を積極的に採用し、外部依存ゼロの軽量構成を実現しています。

ヘッダー・フッターは Web Components として実装し、設定は `config.js` に一元管理しています。
