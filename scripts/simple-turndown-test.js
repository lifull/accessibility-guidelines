#!/usr/bin/env node

/**
 * Simple test script for Turndown
 */

const TurndownService = require('turndown');

// Test HTML
const testHtml = `
<div>
  <h1>Test Heading</h1>
  <p>This is a paragraph with <strong>bold text</strong> and <em>italic text</em>.</p>
  <figure>
    <img src="example.jpg" alt="Example image">
    <figcaption>Example caption</figcaption>
  </figure>
</div>
`;

// Create a new TurndownService
const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-'
});

// Convert HTML to Markdown
console.log("Basic Conversion:");
console.log(turndown.turndown(testHtml));

// Add rule to preserve HTML tags
turndown.addRule('preserveHtmlTags', {
  filter: ['figure', 'img', 'figcaption'],
  replacement: function (content, node) {
    return '\n' + node.outerHTML + '\n';
  }
});

console.log("\nWith preserved HTML:");
console.log(turndown.turndown(testHtml));
