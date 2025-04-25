#!/usr/bin/env node

/**
 * Test script for Turndown with our sample HTML file
 */

const TurndownService = require('turndown');
const fs = require('fs');
const path = require('path');

// Path to test file
const TEST_FILE = path.join(__dirname, '..', 'dist', 'test', 'sample.html');

// Main function
function main() {
  try {
    // Check if file exists
    if (!fs.existsSync(TEST_FILE)) {
      console.error(`Test file not found: ${TEST_FILE}`);
      return;
    }
    
    // Read the HTML file
    const html = fs.readFileSync(TEST_FILE, 'utf8');
    console.log(`読み込んだファイル: ${TEST_FILE}\n`);
    
    // Create Turndown service
    const turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-'
    });
    
    // Convert the whole file
    console.log("=== 基本変換（そのまま） ===");
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
    
    // Test complete
    console.log("\nTurndownのテスト完了");
    
  } catch (error) {
    console.error('エラー:', error);
  }
}

// Run main function
main();
