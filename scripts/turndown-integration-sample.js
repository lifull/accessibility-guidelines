#!/usr/bin/env node

/**
 * Turndown integration sample for accessibility-guidelines
 * This script demonstrates how to use Turndown to convert HTML to Markdown
 * with different approaches for handling HTML tags
 */

const fs = require('fs');
const path = require('path');
const TurndownService = require('turndown');

// Sample HTML content that mimics your accessibility guidelines
const sampleHtml = `
<main>
  <h1>アクセシビリティチェック項目 (レベル2)</h1>
  
  <p>このガイドラインは、Webサイトのアクセシビリティを向上させるためのチェック項目を提供します。</p>
  
  <h2>良い実装例</h2>
  
  <pre><code>&lt;button type="button" aria-label="閉じる"&gt;
  &lt;span class="icon"&gt;&times;&lt;/span&gt;
&lt;/button&gt;</code></pre>
  
  <h2>注意点</h2>
  
  <ul>
    <li>フォームコントロールには適切なラベルを提供すること</li>
    <li>アイコンのみのボタンには、aria-labelを使用すること</li>
    <li>装飾的な画像にはalt=""を設定すること</li>
  </ul>
  
  <h2>視覚的な例</h2>
  
  <figure>
    <img src="example.jpg" alt="アクセシブルなフォームの例">
    <figcaption>アクセシブルなフォームコントロールの実装例</figcaption>
  </figure>
  
  <h2>実装時の注意点</h2>
  
  <p>以下のHTMLタグに注意してください：</p>
  <p>input</p>
  <p>button</p>
  <p>img</p>
  <p>alt属性の値は具体的に記述する</p>
</main>
`;

/**
 * 1. 基本的なTurndownの設定
 * 通常のマークダウン変換向け
 */
function basicTurndown() {
  console.log("\n=== 基本的なTurndown設定の結果 ===\n");
  
  const turndownService = new TurndownService({
    headingStyle: 'atx',      // # スタイルの見出し
    codeBlockStyle: 'fenced', // ```code``` スタイルのブロック
    bulletListMarker: '-',    // - 箇条書きマーカー
    emDelimiter: '_',         // _italic_ 強調
    strongDelimiter: '**'     // **bold** 強調
  });
  
  // マークダウンに変換
  const markdown = turndownService.turndown(sampleHtml);
  console.log(markdown);
  
  return markdown;
}

/**
 * 2. HTMLタグを保持するTurndownの設定
 * 特定のHTMLタグをそのまま保持する
 */
function preserveHtmlTurndown() {
  console.log("\n=== HTMLタグを保持するTurndownの結果 ===\n");
  
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-'
  });
  
  // 特定のHTMLタグを保持するルールを追加
  turndownService.addRule('preserveHtmlTags', {
    filter: ['figure', 'img', 'figcaption'],
    replacement: function (content, node) {
      return '\n' + node.outerHTML + '\n';
    }
  });
  
  // マークダウンに変換
  const markdown = turndownService.turndown(sampleHtml);
  console.log(markdown);
  
  return markdown;
}

/**
 * 3. HTMLタグをコードブロックとして保持するTurndownの設定
 * 特定のHTMLタグをコードブロックとして表示する
 */
function codeBlockHtmlTurndown() {
  console.log("\n=== HTMLタグをコードブロックとして保持するTurndownの結果 ===\n");
  
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-'
  });
  
  // HTMLタグをコードブロックとして表示するルールを追加
  turndownService.addRule('codeBlockHtmlTags', {
    filter: ['figure', 'img', 'figcaption'],
    replacement: function (content, node) {
      return '\n```html\n' + node.outerHTML + '\n```\n';
    }
  });
  
  // マークダウンに変換
  const markdown = turndownService.turndown(sampleHtml);
  console.log(markdown);
  
  return markdown;
}

/**
 * 4. コードブロックの処理を改善したTurndownの設定
 * プログラムコードとHTMLタグの処理を改善
 */
function enhancedCodeTurndown() {
  console.log("\n=== コードブロック処理を改善したTurndownの結果 ===\n");
  
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-'
  });
  
  // preタグとcodeタグの処理を改善するルールを追加
  turndownService.addRule('enhancedCodeBlocks', {
    filter: function (node) {
      return node.nodeName === 'PRE' && 
             node.firstChild && 
             node.firstChild.nodeName === 'CODE';
    },
    replacement: function (content, node) {
      // 言語の自動検出を試みる
      let lang = '';
      if (node.firstChild.className) {
        const match = node.firstChild.className.match(/language-(\w+)/);
        if (match) lang = match[1];
      }
      
      // HTMLっぽい内容ならhtmlとして設定
      const code = node.firstChild.textContent;
      if (code.includes('<') && code.includes('>') && code.includes('</')) {
        lang = 'html';
      }
      
      return '\n```' + lang + '\n' + code + '\n```\n';
    }
  });
  
  // 図表関連のタグはHTMLとして保持
  turndownService.addRule('preserveFigures', {
    filter: ['figure', 'img', 'figcaption'],
    replacement: function (content, node) {
      return '\n' + node.outerHTML + '\n';
    }
  });
  
  // 単独のHTMLタグ名のような単語を特別に処理
  turndownService.addRule('singleHtmlTags', {
    filter: function (node) {
      if (node.nodeName !== 'P') return false;
      
      const text = node.textContent.trim();
      return /^(input|button|img|figure|figcaption|alt)$/.test(text) || 
             text.startsWith('alt=') || 
             text.startsWith('type=');
    },
    replacement: function (content, node) {
      // コードインラインとして表示
      return '\n`' + node.textContent.trim() + '`\n';
    }
  });
  
  // マークダウンに変換
  const markdown = turndownService.turndown(sampleHtml);
  console.log(markdown);
  
  return markdown;
}

/**
 * 5. 現在のスクリプトに近い形で改善したTurndownの設定
 * あなたの現在のスクリプトに近い形で、いくつかの改善を加えた例
 */
function improvedCurrentTurndown() {
  console.log("\n=== 改善版Turndownの結果 ===\n");
  
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-'
  });
  
  // HTMLタグを保持するルールを追加（現在のスクリプトに近い形で）
  turndownService.addRule('preserveHtmlTags', {
    filter: function (node) {
      // 保持したいタグを検出
      return ['figure', 'figcaption', 'img'].includes(node.nodeName.toLowerCase());
    },
    replacement: function (content, node) {
      // HTML要素の処理方法を選択できます
      
      // 方法1: コードブロックとして出力
      // return '\n```html\n' + node.outerHTML + '\n```\n';
      
      // 方法2: そのままのHTMLとして出力
      return '\n' + node.outerHTML + '\n';
    }
  });
  
  // カスタムルール: HTMLタグに言及しているがコードではない場合は特別に処理
  turndownService.addRule('mentionedHtmlTags', {
    filter: function (node) {
      if (node.nodeName !== 'P') return false;
      
      // 単一のHTMLタグ名や属性の参照を検出
      const text = node.textContent.trim();
      return /^(input|button|img|figure|figcaption)$/.test(text) || 
             text.includes('alt=') || 
             text.includes('type=');
    },
    replacement: function (content, node) {
      // インラインコードとして表示
      return '\n`' + node.textContent.trim() + '`\n';
    }
  });
  
  // コードブロックの処理を改善
  turndownService.addRule('enhancedCodeBlocks', {
    filter: function (node) {
      return node.nodeName === 'PRE' && 
             node.firstChild && 
             node.firstChild.nodeName === 'CODE';
    },
    replacement: function (content, node) {
      const code = node.firstChild.textContent;
      
      // HTMLコードを検出
      let lang = '';
      if (code.includes('<') && code.includes('>')) {
        lang = 'html';
      }
      
      return '\n```' + lang + '\n' + code + '\n```\n';
    }
  });
  
  // マークダウンに変換
  const markdown = turndownService.turndown(sampleHtml);
  console.log(markdown);
  
  return markdown;
}

// 各種方法を実行してテスト
console.log("Turndownのさまざまな使用方法をテストします...");
basicTurndown();
preserveHtmlTurndown();
codeBlockHtmlTurndown();
enhancedCodeTurndown();
improvedCurrentTurndown();

console.log("\nテスト完了");
