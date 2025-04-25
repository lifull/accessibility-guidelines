#!/usr/bin/env node

/**
 * Complete Test Script for Turndown with JSDOM
 * This script demonstrates how to extract main content with JSDOM
 * and apply custom Turndown rules to convert HTML to Markdown
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const TurndownService = require('turndown');

// Path to test file
const TEST_FILE = path.join(__dirname, '..', 'dist', 'test', 'sample.html');

// Main function
async function main() {
  try {
    console.log('JSDOM + Turndownのテストを実行します...\n');
    
    // Check if file exists
    if (!fs.existsSync(TEST_FILE)) {
      console.error(`テストファイルが見つかりません: ${TEST_FILE}`);
      return;
    }
    
    // Read the HTML file
    const htmlContent = fs.readFileSync(TEST_FILE, 'utf8');
    
    // Parse HTML with JSDOM
    const dom = new JSDOM(htmlContent, { 
      contentType: 'text/html; charset=utf-8' 
    });
    const document = dom.window.document;
    
    // Extract main content
    const mainElement = document.querySelector('main');
    if (!mainElement) {
      console.error('HTMLファイル内にmain要素が見つかりません');
      return;
    }
    
    // Remove navigation, headers, footers
    const elementsToRemove = mainElement.querySelectorAll('nav, header, footer');
    for (const element of elementsToRemove) {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }
    
    // Extract title and level
    const h1Element = mainElement.querySelector('h1');
    let title = '';
    let level = 1;
    
    if (h1Element) {
      title = h1Element.textContent.trim();
      const levelMatch = title.match(/レベル(\d+)/);
      if (levelMatch) {
        level = parseInt(levelMatch[1], 10);
      }
    }
    
    console.log(`タイトル: ${title}`);
    console.log(`レベル: ${level}\n`);
    
    // Setup Turndown with enhanced options
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
      emDelimiter: '_',
      strongDelimiter: '**'
    });
    
    // Rule 1: Better code block handling
    turndownService.addRule('codeExamples', {
      filter: function (node) {
        return node.nodeName === 'PRE' && 
               node.firstChild && 
               node.firstChild.nodeName === 'CODE';
      },
      replacement: function (content, node) {
        // Try to detect language
        let lang = '';
        if (node.firstChild.className) {
          const match = node.firstChild.className.match(/language-(\w+)/);
          if (match) lang = match[1];
        }
        
        // If content looks like HTML, use html language
        const code = node.firstChild.textContent;
        if (code.includes('<') && code.includes('>')) {
          lang = 'html';
        }
        
        return '\n```' + lang + '\n' + code + '\n```\n';
      }
    });
    
    // Rule 2: Keep HTML for figures and images
    turndownService.addRule('preserveHtmlTags', {
      filter: ['figure', 'figcaption', 'img'],
      replacement: function (content, node) {
        return '\n' + node.outerHTML + '\n';
      }
    });
    
    // Rule 3: Format single HTML tag references
    turndownService.addRule('singleHtmlTags', {
      filter: function (node) {
        if (node.nodeName !== 'P') return false;
        
        const text = node.textContent.trim();
        return /^(img|figure|figcaption|input|button|a|select|textarea)$/.test(text) ||
               text.includes('alt属性') || 
               text.includes('type=');
      },
      replacement: function (content, node) {
        const text = node.textContent.trim();
        if (text.length > 0) {
          return '\n`' + text + '`\n';
        }
        return content;
      }
    });
    
    // Convert to markdown using our enhanced Turndown service
    console.log('=== JSDOMで抽出した本文をTurndownで変換 ===\n');
    const markdown = turndownService.turndown(mainElement.innerHTML);
    console.log(markdown);
    
    // Write markdown to file for inspection
    const outputFile = path.join(__dirname, '..', 'turndown-result.md');
    fs.writeFileSync(outputFile, markdown);
    console.log(`\nマークダウンをファイルに保存しました: ${outputFile}`);
    
  } catch (error) {
    console.error('エラー:', error);
  }
}

// Run main function
main();
