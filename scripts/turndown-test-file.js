#!/usr/bin/env node

/**
 * Simple test script to verify Turndown functionality with our test file
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const TurndownService = require('turndown');

// Path to test file
const TEST_FILE = path.join(__dirname, '..', 'dist', 'test', 'sample.html');

// Initialize Turndown service
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-'
});

// Add rule to preserve HTML tags for specific elements
turndownService.addRule('preserveHtmlTags', {
  filter: ['figure', 'figcaption', 'img'],
  replacement: function (content, node) {
    return '\n' + node.outerHTML + '\n';
  }
});

// Add rule for handling code blocks better
turndownService.addRule('codeExamples', {
  filter: function (node) {
    return node.nodeName === 'PRE' && 
           node.firstChild && 
           node.firstChild.nodeName === 'CODE';
  },
  replacement: function (content, node) {
    // Look for HTML content
    const code = node.firstChild.textContent;
    let lang = '';
    if (code.includes('<') && code.includes('>')) {
      lang = 'html';
    }
    
    return '\n```' + lang + '\n' + code + '\n```\n';
  }
});

// Add rule for special handling of HTML tag references
turndownService.addRule('singleHtmlTags', {
  filter: function (node) {
    if (node.nodeName !== 'P') return false;
    
    const text = node.textContent.trim();
    return /^(img|figure|figcaption|input|button|a)$/.test(text) ||
           text.includes('alt属性') || 
           text.includes('type=');
  },
  replacement: function (content) {
    const text = content.trim();
    if (text.length > 0) {
      return '\n`' + text + '`\n';
    }
    return content;
  }
});

// Main function
async function main() {
  try {
    console.log('テストファイルのTurndown変換を実行します...');
    
    // Check if test file exists
    if (!fs.existsSync(TEST_FILE)) {
      console.error(`Test file not found: ${TEST_FILE}`);
      return;
    }
    
    // Read the file
    const fileContent = fs.readFileSync(TEST_FILE, 'utf8');
    const dom = new JSDOM(fileContent);
    const document = dom.window.document;
    
    // Get main content
    const mainElement = document.querySelector('main');
    if (!mainElement) {
      console.error('No main element found in test file');
      return;
    }
    
    // Convert to markdown
    console.log('\n=== オリジナルコンテンツ ===\n');
    console.log(mainElement.innerHTML);
    
    console.log('\n=== Turndownで変換されたMarkdown ===\n');
    const markdown = turndownService.turndown(mainElement.innerHTML);
    console.log(markdown);
    
    // Write markdown to file for inspection
    const outputFile = path.join(__dirname, '..', 'test-markdown.md');
    fs.writeFileSync(outputFile, markdown);
    console.log(`\nマークダウンをファイルに保存しました: ${outputFile}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run main function
main();
