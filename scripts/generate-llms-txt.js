#!/usr/bin/env node

/**
 * This script generates an llms.txt file by parsing MDX files in the src/content/guidelines directory
 * It follows the format described at https://github.com/AnswerDotAI/llms-txt
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Define paths
const GUIDELINES_DIR = path.join(__dirname, '..', 'src', 'content', 'guidelines');
const OUTPUT_FILE = path.join(__dirname, '..', 'llms.txt');
const OUTPUT_FILE_FULL = path.join(__dirname, '..', 'llms-full.txt');
const BASE_URL = 'https://lifull.github.io/accessibility-guidelines';

// Function to recursively get all files with .mdx extension
function getMdxFiles(dir) {
  let results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      results = results.concat(getMdxFiles(filePath));
    } else if (path.extname(file) === '.mdx') {
      results.push(filePath);
    }
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

// Function to parse the MDX file and extract title and content
function parseMdxFile(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContent);
  
  // Extract the actual content by removing the import statements and component elements
  let cleanContent = content
    .replace(/import[\s\S]*?from.*?;/g, '')
    .replace(/<Checkpoint[^>]*?>([\s\S]*?)<\/Checkpoint>/g, '$1') // Keep content inside Checkpoint
    .replace(/<Level[^>]*?\/>/g, '')
    .replace(/#### 「{frontmatter.title}」とは/, '')
    .replace(/#### チェック項目/, '')
    .replace(/##### 参考情報[\s\S]*$/, '')
    .trim();
  
  // Preserve code blocks
  cleanContent = cleanContent.replace(/```([^`]+)```/g, '```$1```');
  
  // Replace any markdown links with just the text
  cleanContent = cleanContent.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  return {
    title: data.title,
    area: data.area,
    category: data.category,
    level: data.level,
    content: cleanContent,
    slug: generateSlug(data.title)
  };
}

// Generate the full llms.txt content
function generateLlmsFullTxt() {
  const mdxFiles = getMdxFiles(GUIDELINES_DIR);
  
  let llmsContent = "# LIFULL Accessibility Guidelines\n\n";
  llmsContent += "> アクセシビリティに配慮したデザインと実装のためのガイドライン\n\n";
  llmsContent += "This file contains accessibility guidelines for designers and developers.\n\n";
  llmsContent += "## metadata\n";
  llmsContent += "- url: https://lifull.github.io/accessibility-guidelines/\n";
  llmsContent += "- version: v3.0\n\n";
  
  // Group by area and category
  const guidelines = {};
  
  mdxFiles.forEach(filePath => {
    try {
      const { title, area, category, level, content, slug } = parseMdxFile(filePath);
      
      if (!guidelines[area]) {
        guidelines[area] = {};
      }
      
      if (!guidelines[area][category]) {
        guidelines[area][category] = [];
      }
      
      guidelines[area][category].push({ title, level, content, slug });
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
    }
  });
  
  // Add table of contents
  llmsContent += "## 目次\n\n";
  
  for (const area in guidelines) {
    const areaName = area === 'design' ? 'デザイン' : '実装';
    llmsContent += `- [${areaName}のガイドライン](#${areaName}のガイドライン)\n`;
    
    for (const category in guidelines[area]) {
      guidelines[area][category].sort((a, b) => a.level - b.level);
      
      guidelines[area][category].forEach(guideline => {
        const anchorLink = `${guideline.title}-レベル${guideline.level}`.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
        llmsContent += `  - [${guideline.title} (レベル${guideline.level})](#${anchorLink})\n`;
      });
    }
  }
  
  llmsContent += "\n";
  
  // Format the content
  for (const area in guidelines) {
    const areaName = area === 'design' ? 'デザイン' : '実装';
    llmsContent += `## ${areaName}のガイドライン\n\n`;
    
    for (const category in guidelines[area]) {
      guidelines[area][category].sort((a, b) => a.level - b.level);
      
      guidelines[area][category].forEach(guideline => {
        const guidelineUrl = `${BASE_URL}/${area}/${guideline.slug}`;
        llmsContent += `### ${guideline.title} (レベル${guideline.level})\n\n`;
        llmsContent += `${guideline.content}\n\n`;
        llmsContent += `詳細: [${guideline.title}](${guidelineUrl})\n\n`;
      });
    }
  }
  
  return llmsContent;
}

// Generate the simplified llms.txt content (only titles and levels)
function generateLlmsTxt() {
  const mdxFiles = getMdxFiles(GUIDELINES_DIR);
  
  let llmsContent = "# LIFULL Accessibility Guidelines\n\n";
  llmsContent += "> アクセシビリティに配慮したデザインと実装のためのガイドライン\n\n";
  llmsContent += "This file contains accessibility guidelines for designers and developers.\n\n";
  llmsContent += "## metadata\n";
  llmsContent += "- url: https://lifull.github.io/accessibility-guidelines/\n";
  llmsContent += "- version: v3.0\n\n";
  
  // Group by area and category
  const guidelines = {};
  
  mdxFiles.forEach(filePath => {
    try {
      const { title, area, category, level, slug } = parseMdxFile(filePath);
      
      if (!guidelines[area]) {
        guidelines[area] = {};
      }
      
      if (!guidelines[area][category]) {
        guidelines[area][category] = [];
      }
      
      guidelines[area][category].push({ title, level, slug });
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
    }
  });
  
  // Format the content
  for (const area in guidelines) {
    const areaName = area === 'design' ? 'デザイン' : '実装';
    llmsContent += `## ${areaName}のガイドライン\n\n`;
    
    for (const category in guidelines[area]) {
      guidelines[area][category].sort((a, b) => a.level - b.level);
      
      guidelines[area][category].forEach(guideline => {
        const guidelineUrl = `${BASE_URL}/${area}/${guideline.slug}`;
        llmsContent += `### [${guideline.title}](${guidelineUrl}) (レベル${guideline.level})\n\n`;
      });
    }
  }
  
  return llmsContent;
}

// Main execution
try {
  console.log('Generating llms.txt and llms-full.txt files...');
  
  // Add gray-matter package if it doesn't exist
  try {
    require.resolve('gray-matter');
  } catch (e) {
    console.log('Installing required dependencies...');
    require('child_process').execSync('npm install --no-save gray-matter');
    console.log('Dependencies installed.');
  }
  
  // Generate and write the simplified version (llms.txt)
  const llmsContent = generateLlmsTxt();
  fs.writeFileSync(OUTPUT_FILE, llmsContent);
  console.log(`Successfully generated ${OUTPUT_FILE}`);
  
  // Generate and write the full version (llms-full.txt)
  const llmsFullContent = generateLlmsFullTxt();
  fs.writeFileSync(OUTPUT_FILE_FULL, llmsFullContent);
  console.log(`Successfully generated ${OUTPUT_FILE_FULL}`);
} catch (error) {
  console.error('Error generating llms files:', error);
  process.exit(1);
}