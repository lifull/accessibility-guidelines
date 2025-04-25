#!/usr/bin/env node

/**
 * Improved test script for Turndown with more options from GitHub/mixmark-io
 */

const TurndownService = require('turndown');
const fs = require('fs');
const path = require('path');

// Create a sample HTML file to test with
const testHtmlPath = path.join(__dirname, 'test-sample.html');
const testHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>アクセシビリティガイドライン | サンプル</title>
</head>
<body>
  <header>
    <nav>This should be removed</nav>
  </header>
  <main>
    <h1>見出しレベルに一貫性を持たせる (レベル1)</h1>
    <p>見出しレベル（h1～h6）は、文書構造を表すセマンティックな要素です。見出しの階層構造は、文書の論理的な構造を示し、スクリーンリーダーのユーザーがコンテンツを理解するのに役立ちます。</p>
    
    <h2>良い実装例</h2>
    <p>以下のように、見出しレベルが論理的に使われている例：</p>
    <pre><code>&lt;h1&gt;ページのメインタイトル&lt;/h1&gt;
  &lt;h2&gt;セクション1&lt;/h2&gt;
    &lt;h3&gt;サブセクション1.1&lt;/h3&gt;
    &lt;h3&gt;サブセクション1.2&lt;/h3&gt;
  &lt;h2&gt;セクション2&lt;/h2&gt;</code></pre>
    
    <h2>悪い実装例</h2>
    <p>以下のように、見出しレベルが飛んでいる例：</p>
    <pre><code>&lt;h1&gt;ページのメインタイトル&lt;/h1&gt;
  &lt;h3&gt;セクション1&lt;/h3&gt; &lt;!-- h2をスキップしている --&gt;
    &lt;h4&gt;サブセクション1.1&lt;/h4&gt;
  &lt;h2&gt;セクション2&lt;/h2&gt; &lt;!-- 階層構造が一貫していない --&gt;</code></pre>
    
    <h2>テスト用の図</h2>
    <figure>
      <img src="example.jpg" alt="見出し構造の例">
      <figcaption>見出し構造のサンプル図</figcaption>
    </figure>
    
    <h2>チェックポイント</h2>
    <ul>
      <li>h1からh6までの見出しを順番に使用しているか</li>
      <li>見出しレベルをスキップしていないか（h1の次にh3を使うなど）</li>
      <li>見出しが装飾目的だけで使われていないか</li>
    </ul>
  </main>
  <footer>
    <p>Copyright © 2025</p>
  </footer>
</body>
</html>`;

fs.writeFileSync(testHtmlPath, testHtml);

// 1. Basic Turndown setup
const basicTurndown = new TurndownService({
  headingStyle: 'atx',       // # style headings
  codeBlockStyle: 'fenced',  // ```code``` style blocks
  bulletListMarker: '-',     // - for bullet lists
  emDelimiter: '_',          // _italic_ for emphasis
  strongDelimiter: '**'      // **bold** for strong
});

// 2. Setup with HTML preservation for specific tags
const htmlPreservingTurndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-'
});

// Add rule to wrap HTML tags in code blocks
htmlPreservingTurndown.addRule('preserveHtmlTags', {
  filter: function (node) {
    return ['figure', 'figcaption', 'img'].includes(node.nodeName.toLowerCase());
  },
  replacement: function (content, node) {
    return '\n```html\n' + node.outerHTML + '\n```\n';
  }
});

// 3. GitHub style - keep HTML as-is for certain tags
const githubStyleTurndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-'
});

// Keep HTML tags as-is without wrapping them
githubStyleTurndown.addRule('preserveHtmlTags', {
  filter: ['figure', 'figcaption', 'img'],
  replacement: function (content, node) {
    return '\n' + node.outerHTML + '\n';
  }
});

// 4. Enhanced version with custom rules for code examples
const enhancedTurndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-'
});

// Add rule to handle HTML in code examples better
enhancedTurndown.addRule('codeExamples', {
  filter: function (node) {
    return node.nodeName === 'PRE' && 
           node.firstChild && 
           node.firstChild.nodeName === 'CODE';
  },
  replacement: function (content, node) {
    // Extract the language from class if it exists
    let lang = '';
    if (node.firstChild.className) {
      const match = node.firstChild.className.match(/language-(\w+)/);
      if (match) lang = match[1];
    }
    
    // If content contains HTML-like code, use html as language
    if (content.includes('<') && content.includes('>')) {
      lang = 'html';
    }
    
    // Clean up the content
    let code = node.firstChild.textContent;
    
    return '\n```' + lang + '\n' + code + '\n```\n';
  }
});

// Keep HTML for specific elements
enhancedTurndown.addRule('keepHtmlElements', {
  filter: ['figure', 'img', 'figcaption'],
  replacement: function (content, node) {
    return '\n' + node.outerHTML + '\n';
  }
});

// Function to read HTML file and extract main content
function extractMainContent(htmlPath) {
  const { JSDOM } = require('jsdom');
  
  try {
    const fileContent = fs.readFileSync(htmlPath, 'utf8');
    const dom = new JSDOM(fileContent);
    const document = dom.window.document;
    
    // Extract main content
    const mainElement = document.querySelector('main') || 
                        document.querySelector('article') || 
                        document.querySelector('.content') ||
                        document.body;
    
    if (mainElement) {
      // Remove navigation, headers, footers
      const elementsToRemove = mainElement.querySelectorAll('nav, header, footer, .navigation, .header, .footer');
      for (const element of elementsToRemove) {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      }
      
      return mainElement.outerHTML;
    }
    
    return document.body.outerHTML;
  } catch (error) {
    console.error('Error extracting main content:', error);
    return null;
  }
}

// Test all conversion methods
const mainContent = extractMainContent(testHtmlPath);

if (mainContent) {
  console.log('\n=== 1. BASIC TURNDOWN CONVERSION ===\n');
  console.log(basicTurndown.turndown(mainContent));
  
  console.log('\n=== 2. HTML PRESERVING CONVERSION (CODE BLOCKS) ===\n');
  console.log(htmlPreservingTurndown.turndown(mainContent));
  
  console.log('\n=== 3. GITHUB STYLE CONVERSION (HTML AS-IS) ===\n');
  console.log(githubStyleTurndown.turndown(mainContent));
  
  console.log('\n=== 4. ENHANCED TURNDOWN WITH CUSTOM RULES ===\n');
  console.log(enhancedTurndown.turndown(mainContent));
}

// Clean up the test file
fs.unlinkSync(testHtmlPath);
console.log('\nTest complete. Test file removed.');
