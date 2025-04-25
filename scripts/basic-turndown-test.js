#!/usr/bin/env node

/**
 * Very simple test of the Turndown library
 */

const TurndownService = require('turndown');
const fs = require('fs');
const path = require('path');

// Simple HTML to convert
const html = `
<h1>テストタイトル</h1>
<p>これはテスト段落です。</p>
<figure>
  <img src="test.jpg" alt="テスト画像">
  <figcaption>テストのキャプション</figcaption>
</figure>
<pre><code>&lt;div&gt;HTMLコード例&lt;/div&gt;</code></pre>
`;

// Create basic Turndown service
const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-'
});

// Test basic conversion
console.log("=== 基本変換 ===");
console.log(turndown.turndown(html));

// Add rule to preserve HTML tags
turndown.addRule('preserveHtmlTags', {
  filter: ['figure', 'img', 'figcaption'],
  replacement: function (content, node) {
    return '\n' + node.outerHTML + '\n';
  }
});

console.log("\n=== HTMLタグ保持 ===");
console.log(turndown.turndown(html));

// Test output
console.log("\nTurndownのテスト完了");
