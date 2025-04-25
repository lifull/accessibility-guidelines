#!/usr/bin/env node

/**
 * This script generates llms.txt and llms-full-html.txt files by parsing HTML files in the dist directory
 * It follows the format described at https://github.com/AnswerDotAI/llms-txt
 * Using Turndown library for HTML to Markdown conversion
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const TurndownService = require('turndown');

// Initialize Turndown service
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-'
});

// HTMLタグを保持するルールを追加（主な要素）
turndownService.addRule('preserveHtmlTags', {
  filter: function (node) {
    // 保持したいタグを検出
    return ['figure', 'figcaption', 'img'].includes(node.nodeName.toLowerCase());
  },
  replacement: function (content, node) {
    // 元のHTMLをコードブロックとして出力
    return '\n```\n' + node.outerHTML + '\n```\n';
  }
});

// カスタムルール: HTMLタグに言及しているがコードではない場合は通常のテキストとして処理
turndownService.addRule('mentionedHtmlTags', {
  filter: function (node) {
    // テキストノードのみを対象
    if (node.nodeType !== 3) return false;
    
    // タグ名だけの単純な参照を検出
    const text = node.textContent.trim();
    return /^(details|input|select|button|a|img|figure|figcaption)$/.test(text);
  },
  replacement: function (content) {
    // そのまま返す
    return content;
  }
});

// Define paths
const DIST_DIR = path.join(__dirname, '..', 'dist');
const OUTPUT_FILE = path.join(__dirname, '..', 'llms.txt');
const OUTPUT_FILE_FULL = path.join(__dirname, '..', 'llms-full-html.txt');
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

// Function to clean HTML content to markdown using Turndown
function htmlToMarkdown(html) {
  // スペシャルケース：単一のHTMLタグ名やalt属性の場合
  if (html && typeof html === 'string') {
    const trimmed = html.trim();
    
    // 単一のHTMLタグ名の場合
    if (/^(details|input|select|button|img|figure|figcaption)$/.test(trimmed)) {
      return trimmed;
    }
    
    // type属性やalt属性などの場合
    if (trimmed.startsWith('type=') || trimmed.includes('alt=')) {
      return trimmed;
    }
  }
  
  // 通常のHTMLをMarkdownに変換
  try {
    return turndownService.turndown(html);
  } catch (error) {
    console.error('Error converting HTML to Markdown:', error);
    // エラー時のフォールバック
    return html
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

// Function to parse HTML file
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
    
    // Extract main content
    let content = '';
    const mainElement = document.querySelector('main') || 
                        document.querySelector('article') || 
                        document.querySelector('.content');
    
    if (mainElement) {
      // Remove navigation, headers, footers
      const elementsToRemove = mainElement.querySelectorAll('nav, header, footer, .navigation, .header, .footer');
      for (const element of elementsToRemove) {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      }
      
      // Get paragraphs and code blocks
      let allContent = [];
      
      // 単独のHTMLタグ名を検出する正規表現
      const singleTagPattern = /^[a-zA-Z0-9]+$/;
      
      // Pre要素とコードブロックを検出
      const preElements = mainElement.querySelectorAll('pre, code');
      for (const element of preElements) {
        // コードブロックとして処理
        if (element.tagName.toLowerCase() === 'pre') {
          // preタグの内容をコードブロックとして保存
          const code = element.textContent;
          // 内容が3行以上ある場合のみコードブロックとする
          if (code.split('\n').length >= 3) {
            allContent.push('```\n' + code + '\n```');
          } else {
            allContent.push('`' + code + '`');
          }
        } else if (element.tagName.toLowerCase() === 'code' && !element.closest('pre')) {
          // preの中のcodeではないインラインコード
          allContent.push('`' + element.textContent + '`');
        }
      }
      
      // 段落を取得
      const paragraphs = mainElement.querySelectorAll('p');
      if (paragraphs.length > 0) {
        Array.from(paragraphs).forEach(p => {
          // ユーティリティクラス内のHTMLタグを検出 (<figure>、<img>等)
          // 完全なHTMLタグのみを検出（単語としてのHTMLタグ名は検出しない）
          const htmlTagPattern = /<[a-zA-Z][^>]*>|<\/[a-zA-Z][^>]*>/g;
          const hasTags = htmlTagPattern.test(p.textContent);
          
          // HTMLタグを含む場合は特別処理
          if (hasTags) {
            // HTMLエンティティを一旦変換
            let text = p.textContent
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&apos;/g, "'")
              .replace(/&amp;/g, '&');
              
            // HTMLタグを含む段落はコードブロックとして整形
            const processedHtml = processRichHtmlBlock(text);
            if (processedHtml) {
              // リッチHTMLブロックとして処理された場合
              allContent.push(processedHtml);
            } else if (text.match(/<[a-zA-Z][^>]*>|<\/[a-zA-Z][^>]*>/g) && text.includes('</')) {
              // 通常のHTMLタグを含む場合
              allContent.push('```\n' + text + '\n```');
            } else {
              // その他の場合は通常のテキストとして処理
              allContent.push(htmlToMarkdown(text));
            }
          } else {
            // 通常のテキスト
            const text = p.textContent.trim();
            
            // 単一のHTMLタグ名のような単語のみの場合は特別処理
            if (singleTagPattern.test(text) || text.startsWith('type=') || text.includes('alt=')) {
              allContent.push(text);
            } else {
              // その他の通常テキスト
              const processedText = htmlToMarkdown(text);
              if (processedText.length > 0) {
                allContent.push(processedText);
              }
            }
          }
        });
        
        content = allContent
          .filter(text => text.length > 0)
          .join('\n\n');
      } else {
        // Fallback to main content
        content = htmlToMarkdown(mainElement.textContent);
      }
    } else {
      // Fallback to body
      content = htmlToMarkdown(document.body.textContent).substring(0, 500); // Limit to avoid too much noise
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

// リッチなHTMLコードブロックだけを処理
function processRichHtmlBlock(text) {
  // 単純なタグだけでなく、複合構造のブロックを検出
  if (text.match(/<[a-z]+>.*<\/[a-z]+>/g) || text.includes("figure") || text.includes("figcaption") || text.includes("img")) {
    // 特定のHTML構造キーワードを持つテキストをコードブロックとして処理
    return '```\n' + text + '\n```';
  }
  return null;
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
    llmsContent += `## <a id="${areaAnchor}"></a>${areaName}のガイドライン\n\n`;
    
    // Filter and sort guidelines by level
    const areaGuidelines = guidelines
      .filter(guideline => guideline && guideline.area === area)
      .sort((a, b) => a.level - b.level);
    
    // Add each guideline with content
    for (const guideline of areaGuidelines) {
      const cleanedTitle = cleanTitle(guideline.title);
      const guidelineAnchor = guidelineAnchors.get(guideline);
      const guidelineUrl = `${BASE_URL}/${guideline.relativeUrl}`;
      
      llmsContent += `### <a id="${guidelineAnchor}"></a>${cleanedTitle} (レベル${guideline.level})\n\n`;
      llmsContent += `${guideline.content}\n\n`;
      llmsContent += `詳細: [${cleanedTitle}](${guidelineUrl})\n\n`;
    }
  }
  
  return llmsContent;
}

// Main execution
async function main() {
  try {
    console.log('Generating llms.txt and llms-full-html.txt files from HTML...');
    
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
    const llmsFullContent = generateLlmsFullTxt(guidelines);
    fs.writeFileSync(OUTPUT_FILE_FULL, llmsFullContent);
    console.log(`Successfully generated ${OUTPUT_FILE_FULL}`);
    
  } catch (error) {
    console.error('Error generating llms files:', error);
    process.exit(1);
  }
}

// Run the main function
main();
