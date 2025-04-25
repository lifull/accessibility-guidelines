#!/usr/bin/env node

/**
 * This script generates llms.txt and llms-full-html.txt files by parsing HTML files in the dist directory
 * It follows the format described at https://github.com/AnswerDotAI/llms-txt
 * Using improved Turndown configuration for HTML to Markdown conversion
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const TurndownService = require('turndown');

// Initialize Turndown service with more aggressive options
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '_',
  strongDelimiter: '**',
  // Set this to true to convert all elements, even those without text content
  blankReplacement: (content, node) => {
    return node.isBlock ? '\n\n' : '';
  },
  // Ensures empty paragraphs are removed
  keepReplacement: (content, node) => {
    return node.isBlock ? `\n\n${content}\n\n` : content;
  }
});

// Add rule to better handle code examples
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
    if (code.includes('<') && code.includes('>') && 
        (code.includes('</') || code.includes('/>'))) {
      lang = 'html';
    }
    
    return '\n```' + lang + '\n' + code + '\n```\n';
  }
});

// Add rule for buttons
turndownService.addRule('buttons', {
  filter: 'button',
  replacement: function (content, node) {
    return `[${content}]`;
  }
});

// Add rule for figures with better markdown representation
turndownService.addRule('figures', {
  filter: 'figure',
  replacement: function (content, node) {
    // Extract image if present
    const img = node.querySelector('img');
    const figcaption = node.querySelector('figcaption');
    
    let result = '';
    
    // Handle image
    if (img) {
      const src = img.getAttribute('src') || '';
      const alt = img.getAttribute('alt') || '';
      result += `![${alt}](${src})\n\n`;
    }
    
    // Handle caption
    if (figcaption) {
      result += `*${figcaption.textContent.trim()}*\n\n`;
    }
    
    // If no special elements were found, just use the text content
    if (result === '') {
      result = content.trim() + '\n\n';
    }
    
    return result;
  }
});

// Add rule for links
turndownService.addRule('links', {
  filter: 'a',
  replacement: function (content, node) {
    const href = node.getAttribute('href') || '';
    const title = node.getAttribute('title') || '';
    const text = content.trim();
    
    // Skip anchor-only links like <a href="#section">
    if (href.startsWith('#') && (text === '' || text === href.substring(1))) {
      return content;
    }
    
    // For empty links with no content, use the href as content
    if (text === '') {
      return `[${href}](${href})`;
    }
    
    return title ? `[${text}](${href} "${title}")` : `[${text}](${href})`;
  }
});

// Add rule for images
turndownService.addRule('images', {
  filter: 'img',
  replacement: function (content, node) {
    const src = node.getAttribute('src') || '';
    const alt = node.getAttribute('alt') || '';
    const title = node.getAttribute('title') || '';
    
    return title ? `![${alt}](${src} "${title}")` : `![${alt}](${src})`;
  }
});

// Add rule for tables
turndownService.addRule('tables', {
  filter: 'table',
  replacement: function (content, node) {
    // Table content is already converted by Turndown
    // Just ensure we have proper spacing
    return '\n\n' + content.trim() + '\n\n';
  }
});

// Cleanup function to remove unnecessary attributes and classes from HTML before conversion
function cleanupHtml(html) {
  // Create a DOM to manipulate
  const dom = new JSDOM(html);
  const document = dom.window.document;
  
  // Remove all data-* attributes
  const allElements = document.querySelectorAll('*');
  allElements.forEach(element => {
    Array.from(element.attributes).forEach(attr => {
      if (attr.name.startsWith('data-') || 
          attr.name === 'class' || 
          attr.name === 'id' && !attr.value.match(/^[a-z0-9_-]+$/i) ||
          attr.name === 'style') {
        element.removeAttribute(attr.name);
      }
    });
  });
  
  // Remove empty divs or spans that only serve as style containers
  const emptyElements = document.querySelectorAll('div:empty, span:empty');
  emptyElements.forEach(element => {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  });
  
  // Convert div elements that only wrap text to paragraphs
  const divElements = document.querySelectorAll('div');
  divElements.forEach(div => {
    // If all children are text nodes or inline elements
    const hasBlockElements = Array.from(div.children).some(child => {
      return ['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'TABLE', 'BLOCKQUOTE', 'PRE'].includes(child.nodeName);
    });
    
    if (!hasBlockElements && div.textContent.trim().length > 0) {
      const p = document.createElement('p');
      p.innerHTML = div.innerHTML;
      div.parentNode.replaceChild(p, div);
    }
  });
  
  // Return the cleaned HTML
  return document.body.innerHTML;
}

// Define paths
const DIST_DIR = path.join(__dirname, '..', 'dist');
const OUTPUT_FILE = path.join(__dirname, '..', 'llms-from-html.txt');
const OUTPUT_FILE_FULL = path.join(__dirname, '..', 'llms-full-from-html.txt');
const BASE_URL = 'https://lifull.github.io/accessibility-guidelines';

// Function to recursively get all files with .html extension
function getHtmlFiles(dir) {
  let results = [];
  
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        results = results.concat(getHtmlFiles(filePath));
      } else if (path.extname(file) === '.html') {
        results.push(filePath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
  
  return results;
}

// Function to generate a slug from a title
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// Function to extract area from the file path
function extractArea(filePath) {
  const relativePath = path.relative(DIST_DIR, filePath);
  const parts = relativePath.split(path.sep);
  
  // Check if it's in design or implementation area
  if (parts.length > 0) {
    if (parts[0] === 'design' || parts[0].startsWith('design')) {
      return 'design';
    } else if (parts[0] === 'impl' || parts[0].startsWith('impl')) {
      return 'impl';
    }
  }
  
  // Default to design if we can't determine
  return 'design';
}

// Function to extract relative URL from file path
function extractRelativeUrl(filePath) {
  const relativePath = path.relative(DIST_DIR, filePath);
  return relativePath.replace(/\.html$/, '');
}

// Function to clean HTML content to markdown using Turndown with improved cleanup
function htmlToMarkdown(html) {
  if (!html) return '';
  
  try {
    // First clean up the HTML to remove unnecessary attributes and classes
    const cleanedHtml = cleanupHtml(html);
    
    // Then convert to markdown
    let markdown = turndownService.turndown(cleanedHtml);
    
    // Post-processing to fix common issues
    markdown = markdown
      // Remove extra blank lines
      .replace(/\n{3,}/g, '\n\n')
      // Fix spacing around headings
      .replace(/\n(#+\s+[^\n]+)/g, '\n\n$1')
      // Clean up any html tags that might have been preserved
      .replace(/<\/?[a-z][^>]*>/gi, '')
      // Fix whitespace around code blocks
      .replace(/```([^`]+)```/g, '```\n$1\n```')
      // Ensure proper spacing around lists
      .replace(/(\n[*-])/g, '\n\n$1')
      // Remove any stray HTML comments
      .replace(/<!--[\s\S]*?-->/g, '')
      // Remove any script or style tags and their contents
      .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
      // Fix links with missing text
      .replace(/\[\]\(([^)]+)\)/g, '[$1]($1)')
      // Replace multiple spaces with single space
      .replace(/[ \t]+/g, ' ')
      // Fix any broken Markdown links
      .replace(/\[([^\]]+)\]\s+\(([^)]+)\)/g, '[$1]($2)');
    
    return markdown.trim();
  } catch (error) {
    console.error('Error converting HTML to Markdown:', error);
    // Fallback for error cases
    return (html || '')
      .replace(/<\/?[^>]+(>|$)/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ')           // Normalize whitespace
      .replace(/\s+\./g, '.')         // Fix spacing before periods
      .replace(/\s+,/g, ',')          // Fix spacing before commas
      .trim();
  }
}

// Function to clean title for display and anchors
function cleanTitle(title) {
  return title
    .replace(/\s+/g, ' ')  // Replace multiple spaces and newlines with a single space
    .trim();
}

// Extract level from text (1, 2, or 3)
function extractLevel(text) {
  const levelMatch = text.match(/レベル(\d+)/);
  return levelMatch ? parseInt(levelMatch[1], 10) : 1; // Default to level 1
}

// Function to parse HTML file with improved content extraction
function parseHtmlFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const dom = new JSDOM(fileContent, { 
      contentType: 'text/html; charset=utf-8' 
    });
    const document = dom.window.document;
    
    // Extract title
    let title = '';
    const h1Element = document.querySelector('h1');
    const titleElement = document.querySelector('title');
    
    if (h1Element) {
      title = h1Element.textContent.trim();
    } else if (titleElement) {
      // Remove site name if present
      title = titleElement.textContent.split('|')[0].trim();
    } else {
      // Fallback to filename
      title = path.basename(filePath, '.html');
    }
    
    // Clean up title if it contains "レベル" designation
    title = title.replace(/\s*\(レベル\d+\)\s*/, '');
    
    // Clean up title by removing extra whitespace and newlines
    title = cleanTitle(title);
    
    // Extract level from document
    let level = 1;
    const levelText = document.body.textContent;
    level = extractLevel(levelText);
    
    // Extract main content with improved selection
    let content = '';
    
    // Try to find the main content container with more specific selectors
    const mainElement = document.querySelector('main') || 
                        document.querySelector('article') || 
                        document.querySelector('.content') ||
                        document.querySelector('[role="main"]') ||
                        document.querySelector('#main-content');
    
    if (mainElement) {
      // Clone the main element to avoid modifying the original document
      const mainClone = mainElement.cloneNode(true);
      
      // Remove navigation, headers, footers, scripts, and other non-content elements
      const elementsToRemove = [
        'nav', 'header', 'footer', '.navigation', '.header', '.footer',
        'script', 'style', 'meta', 'noscript', 'iframe', 
        '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
        '.sidebar', '.menu', '.nav', '.aside', '.advertisement',
        'aside', '.toc', '.table-of-contents', '.breadcrumb'
      ];
      
      // Create a selector from the elements to remove
      const selector = elementsToRemove.join(', ');
      
      // Remove all elements that match the selector
      const nodesToRemove = mainClone.querySelectorAll(selector);
      for (const node of nodesToRemove) {
        if (node.parentNode) {
          node.parentNode.removeChild(node);
        }
      }
      
      // Convert the cleaned main content to markdown
      content = htmlToMarkdown(mainClone.innerHTML);
    } else {
      // Fallback to body if no main content container is found
      const bodyClone = document.body.cloneNode(true);
      
      // Remove navigation, headers, footers, scripts, and other non-content elements
      const elementsToRemove = [
        'nav', 'header', 'footer', '.navigation', '.header', '.footer',
        'script', 'style', 'meta', 'noscript', 'iframe', 
        '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
        '.sidebar', '.menu', '.nav', '.aside', '.advertisement',
        'aside', '.toc', '.table-of-contents', '.breadcrumb'
      ];
      
      // Create a selector from the elements to remove
      const selector = elementsToRemove.join(', ');
      
      // Remove all elements that match the selector
      const nodesToRemove = bodyClone.querySelectorAll(selector);
      for (const node of nodesToRemove) {
        if (node.parentNode) {
          node.parentNode.removeChild(node);
        }
      }
      
      // Convert the cleaned body content to markdown, limiting to avoid too much noise
      const bodyContent = bodyClone.innerHTML;
      content = htmlToMarkdown(bodyContent);
      
      // If the content is too long, truncate it with a note
      if (content.length > 5000) {
        content = content.substring(0, 5000) + "\n\n...(content truncated for brevity)...";
      }
    }
    
    // Create slug from title
    const slug = generateSlug(title);
    
    // Get relative URL for linking
    const relativeUrl = extractRelativeUrl(filePath);
    
    return {
      title,
      level,
      content,
      area: extractArea(filePath),
      slug,
      relativeUrl
    };
  } catch (error) {
    console.error(`Error parsing file ${filePath}:`, error);
    return null;
  }
}

// Generate the simplified llms.txt content
function generateLlmsTxt(guidelines) {
  let llmsContent = "# LIFULL Accessibility Guidelines\n\n";
  llmsContent += "> アクセシビリティに配慮したデザインと実装のためのガイドライン\n\n";
  llmsContent += "This file contains accessibility guidelines for designers and developers (HTML version).\n\n";
  llmsContent += "## metadata\n";
  llmsContent += "- url: https://lifull.github.io/accessibility-guidelines/\n";
  llmsContent += "- version: v3.0\n\n";
  
  // Group by area
  const areas = ['design', 'impl'];
  for (const area of areas) {
    const areaName = area === 'design' ? 'デザイン' : '実装';
    llmsContent += `## ${areaName}のガイドライン\n\n`;
    
    // Filter and sort guidelines by level
    const areaGuidelines = guidelines
      .filter(guideline => guideline && guideline.area === area)
      .sort((a, b) => a.level - b.level);
    
    // Add each guideline as a header with link
    for (const guideline of areaGuidelines) {
      // Make sure the title doesn't have unexpected newlines or extra spaces
      const cleanedTitle = cleanTitle(guideline.title);
      const guidelineUrl = `${BASE_URL}/${guideline.relativeUrl}`;
      llmsContent += `### [${cleanedTitle}](${guidelineUrl}) (レベル${guideline.level})\n\n`;
    }
  }
  
  return llmsContent;
}

// Function to create a valid anchor ID
function createGuidelineAnchor(level, index) {
  return `guideline-${level}-${index}`;
}

// Generate the full llms.txt content
function generateLlmsFullTxt(guidelines) {
  let llmsContent = "# LIFULL Accessibility Guidelines\n\n";
  llmsContent += "> アクセシビリティに配慮したデザインと実装のためのガイドライン\n\n";
  llmsContent += "This file contains accessibility guidelines for designers and developers (HTML version).\n\n";
  llmsContent += "## metadata\n";
  llmsContent += "- url: https://lifull.github.io/accessibility-guidelines/\n";
  llmsContent += "- version: v3.0\n\n";
  
  // Create a mapping of guidelines to unique anchor IDs
  const guidelineAnchors = new Map();
  let designCounter = 0;
  let implCounter = 0;
  
  // Assign unique anchor IDs to each guideline first
  guidelines.forEach(guideline => {
    if (!guideline) return;
    
    // Use separate counters for each area to ensure anchors start from 0 for each area
    const counter = guideline.area === 'design' ? designCounter++ : implCounter++;
    const guidelineAnchor = createGuidelineAnchor(guideline.level, counter);
    guidelineAnchors.set(guideline, guidelineAnchor);
  });
  
  // Add table of contents
  llmsContent += "## 目次\n\n";
  
  const areas = ['design', 'impl'];
  for (const area of areas) {
    const areaName = area === 'design' ? 'デザイン' : '実装';
    const areaAnchor = `section-${area}`;
    llmsContent += `- [${areaName}のガイドライン](#${areaAnchor})\n`;
    
    // Filter and sort guidelines by level
    const areaGuidelines = guidelines
      .filter(guideline => guideline && guideline.area === area)
      .sort((a, b) => a.level - b.level);
    
    // Add each guideline to TOC
    for (const guideline of areaGuidelines) {
      const cleanedTitle = cleanTitle(guideline.title);
      const guidelineAnchor = guidelineAnchors.get(guideline);
      llmsContent += `  - [${cleanedTitle} (レベル${guideline.level})](#${guidelineAnchor})\n`;
    }
  }
  
  llmsContent += "\n";
  
  // Add content by area
  for (const area of areas) {
    const areaName = area === 'design' ? 'デザイン' : '実装';
    const areaAnchor = `section-${area}`;
    // Use markdown heading with anchor instead of HTML
    llmsContent += `## ${areaName}のガイドライン {#${areaAnchor}}\n\n`;
    
    // Filter and sort guidelines by level
    const areaGuidelines = guidelines
      .filter(guideline => guideline && guideline.area === area)
      .sort((a, b) => a.level - b.level);
    
    // Add each guideline with content
    for (const guideline of areaGuidelines) {
      const cleanedTitle = cleanTitle(guideline.title);
      const guidelineAnchor = guidelineAnchors.get(guideline);
      const guidelineUrl = `${BASE_URL}/${guideline.relativeUrl}`;
      
      // Use markdown heading with anchor instead of HTML
      llmsContent += `### ${cleanedTitle} (レベル${guideline.level}) {#${guidelineAnchor}}\n\n`;
      llmsContent += `${guideline.content}\n\n`;
      llmsContent += `詳細: [${cleanedTitle}](${guidelineUrl})\n\n`;
    }
  }
  
  return llmsContent;
}

// Function to perform post-processing on the final output
function postProcessMarkdown(markdown) {
  return markdown
    // Ensure proper heading syntax
    .replace(/<a\s+id="([^"]+)"><\/a>([#]+\s+)/g, '$2{#$1} ')
    // Replace <a id> elements with proper markdown anchor syntax
    .replace(/<a\s+id="([^"]+)"><\/a>/g, '{#$1}')
    // Replace HTML anchors in headings with markdown syntax
    .replace(/###\s+<a\s+id="([^"]+)"><\/a>/g, '### {#$1}')
    .replace(/##\s+<a\s+id="([^"]+)"><\/a>/g, '## {#$1}')
    .replace(/#\s+<a\s+id="([^"]+)"><\/a>/g, '# {#$1}')
    // Remove any remaining HTML tags
    .replace(/<\/?[^>]+(>|$)/g, '')
    // Fix multiple consecutive newlines
    .replace(/\n{3,}/g, '\n\n')
    // Fix whitespace issues around headings
    .replace(/([^\n])(\n+)(#+\s+)/g, '$1\n\n$3');
}

// Main execution
async function main() {
  try {
    console.log('Generating llms.txt and llms-full-html.txt files from HTML using improved Turndown...');
    
    // Install jsdom if needed
    try {
      require.resolve('jsdom');
    } catch (e) {
      console.log('Installing jsdom dependency...');
      require('child_process').execSync('npm install --no-save jsdom');
      console.log('Dependencies installed.');
    }
    
    // Get all HTML files
    const htmlFiles = getHtmlFiles(DIST_DIR);
    console.log(`Found ${htmlFiles.length} HTML files.`);
    
    if (htmlFiles.length === 0) {
      console.error(`No HTML files found in ${DIST_DIR}. Make sure the path is correct.`);
      process.exit(1);
    }
    
    // Parse all HTML files
    const guidelines = [];
    for (const filePath of htmlFiles) {
      const guideline = parseHtmlFile(filePath);
      if (guideline) {
        guidelines.push(guideline);
      }
    }
    
    console.log(`Successfully extracted ${guidelines.length} guidelines.`);
    
    // Generate and write the simplified version
    const llmsContent = generateLlmsTxt(guidelines);
    fs.writeFileSync(OUTPUT_FILE, llmsContent);
    console.log(`Successfully generated ${OUTPUT_FILE}`);
    
    // Generate and write the full version
    let llmsFullContent = generateLlmsFullTxt(guidelines);
    
    // Perform post-processing on the full content
    llmsFullContent = postProcessMarkdown(llmsFullContent);
    
    fs.writeFileSync(OUTPUT_FILE_FULL, llmsFullContent);
    console.log(`Successfully generated ${OUTPUT_FILE_FULL}`);
    
  } catch (error) {
    console.error('Error generating llms files:', error);
    process.exit(1);
  }
}

// Run the main function
main();
