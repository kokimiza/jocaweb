#!/usr/bin/env node
'use strict';
/**
 * build-news.js
 *
 * assets/news/*.md を読み込んで assets/news/news-data.js を生成します。
 *
 * 使い方:
 *   node build-news.js          # 1回ビルド
 *   node build-news.js --watch  # .md の変更を監視して自動再生成
 */

const { readdir, readFile, writeFile } = require('fs/promises');
const { watch } = require('fs');
const { join } = require('path');

const NEWS_DIR = join(__dirname, 'assets', 'news');
const OUTPUT   = join(NEWS_DIR, 'news-data.js');

/** frontmatter を解析して { title, date, genre, body } を返す */
function parseMd(raw) {
  // CRLF → LF に正規化
  const src = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const m = src.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return null;

  const fm   = m[1];
  const body = m[2].trim();

  const get = key => {
    const r = fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
    return r ? r[1].trim() : '';
  };

  const title = get('title');
  const date  = get('date');
  const genre = get('genre');

  if (!title || !date || !genre) return null;
  return { title, date, genre, body };
}

async function build() {
  let files;
  try {
    files = await readdir(NEWS_DIR);
  } catch {
    console.error(`[build-news] ディレクトリが見つかりません: ${NEWS_DIR}`);
    process.exit(1);
  }

  // ファイル名は YYYY-MM-DD- 形式を前提に降順ソート（新しい順）
  const mdFiles = files.filter(f => f.endsWith('.md')).sort().reverse();

  const items = [];
  for (const file of mdFiles) {
    const raw  = await readFile(join(NEWS_DIR, file), 'utf-8');
    const item = parseMd(raw);
    if (item) {
      items.push(item);
    } else {
      console.warn(`[build-news] スキップ: ${file} (frontmatter 不正)`);
    }
  }

  const header = [
    '// AUTO-GENERATED — build-news.js で生成。直接編集しないでください。',
    '// 記事を追加・編集するには assets/news/*.md を操作してください。',
    '',
  ].join('\n');

  const output = `${header}window.JOCARIUM_NEWS = ${JSON.stringify(items, null, 2)};\n`;

  await writeFile(OUTPUT, output, 'utf-8');
  console.log(`[build-news] ${items.length} 件 → assets/news/news-data.js`);
}

// --watch モード
if (process.argv.includes('--watch')) {
  console.log('[build-news] assets/news/*.md を監視中... (Ctrl+C で終了)');
  build().catch(console.error);

  let debounce;
  watch(NEWS_DIR, (_, filename) => {
    if (!filename?.endsWith('.md')) return;
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      console.log(`[build-news] 変更検知: ${filename}`);
      build().catch(console.error);
    }, 150);
  });
} else {
  build().catch(err => {
    console.error('[build-news]', err.message);
    process.exit(1);
  });
}
