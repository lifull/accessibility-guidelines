#!/usr/bin/env node

/**
 * Test script for trying out Turndown
 */

const TurndownService = require('turndown');
const fs = require('fs');
const path = require('path');

// Initialize Turndown service with basic options
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-'
});

// Test HTML to convert
const testHtml = `
<div>
  <h1>Test Heading</h1>
  <p>This is a paragraph with <strong>bold text</strong> and <em>italic text</em>.</p>
  <ul>
    <li>List item 1</li>
    <li>List item 2</li>
  </ul>
  <figure>
    <img src="example.jpg" alt="Example image">
    <figcaption>Example caption</figcaption>
  </figure>
  <pre><code>function example() {
  return "Hello World";
}</code></pre>
</div>
`;

// Basic conversion
console.log("Basic Turndown conversion:");
console.log(turndownService.turndown(testHtml));
console.log("\n---\n");

// Add rule to preserve HTML tags for specific elements (similar to the main script)
turndownService.addRule('preserveHtmlTags', {
  filter: function (node) {
    return ['figure', 'figcaption', 'img'].includes(node.nodeName.toLowerCase());
  },
  replacement: function (content, node) {
    return '\n```\n' + node.outerHTML + '\n```\n';
  }
});

console.log("Turndown with preserved HTML tags:");
console.log(turndownService.turndown(testHtml));
console.log("\n---\n");

// Try GitHub's Turndown approach for preserving HTML
const turndownGithub = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-'
});

turndownGithub.addRule('preserveHtmlTags', {
  filter: ['figure', 'figcaption', 'img'],
  replacement: function (content, node) {
    return '\n' + node.outerHTML + '\n';
  }
});

console.log("GitHub-style Turndown with HTML preserved as-is:");
console.log(turndownGithub.turndown(testHtml));
