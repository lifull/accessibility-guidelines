/**
 * Content generation utilities for llms.txt files
 */

const config = require('../config');
const UrlGenerator = require('../parsers/url-generator');

class ContentGenerator {
  /**
   * Generate the header section for llms.txt files
   * @returns {string} Header content
   */
  static generateHeader() {
    const { title, description, englishDescription, version } = config.metadata;
    
    return [
      `# ${title}`,
      '',
      `> ${description}`,
      '',
      englishDescription,
      '',
      '## metadata',
      `- url: ${config.baseUrl}/`,
      `- version: ${version}`,
      ''
    ].join('\n');
  }

  /**
   * Generate table of contents for full version
   * @param {Array} pages - Array of page data
   * @param {Object} guidelines - Guidelines grouped by area and category
   * @returns {string} Table of contents
   */
  static generateTableOfContents(pages, guidelines) {
    let toc = '## 目次\n\n';
    
    // Add pages to TOC
    if (pages.length > 0) {
      toc += '- [ガイドラインについて](#ガイドラインについて)\n';
      pages.forEach(page => {
        const anchorId = UrlGenerator.generateAnchorId(page.title);
        toc += `  - [${page.title}](#${anchorId})\n`;
      });
    }
    
    // Add guidelines to TOC
    for (const area in guidelines) {
      const areaName = UrlGenerator.getAreaName(area);
      toc += `- [${areaName}のガイドライン](#${areaName.replace(/\s/g, '')}のガイドライン)\n`;
      
      for (const category in guidelines[area]) {
        this._sortGuidelinesByLevel(guidelines[area][category]);
        
        guidelines[area][category].forEach(guideline => {
          const anchorId = UrlGenerator.generateAnchorId(guideline.title, guideline.level);
          toc += `  - [${guideline.title} (レベル${guideline.level})](#${anchorId})\n`;
        });
      }
    }
    
    return toc + '\n';
  }

  /**
   * Generate pages section content
   * @param {Array} pages - Array of page data
   * @param {boolean} isFullVersion - Whether this is for the full version
   * @returns {string} Pages content
   */
  static generatePagesContent(pages, isFullVersion = true) {
    if (pages.length === 0) return '';
    
    if (isFullVersion) {
      return this._generateFullPagesContent(pages);
    } else {
      return this._generateSimplifiedPagesContent(pages);
    }
  }

  /**
   * Generate full pages content with details
   * @private
   * @param {Array} pages - Array of page data
   * @returns {string} Full pages content
   */
  static _generateFullPagesContent(pages) {
    let content = '## ガイドラインについて\n\n';
    
    pages.forEach(page => {
      const anchorId = UrlGenerator.generateAnchorId(page.title);
      content += `### <a id=\"${anchorId}\"></a>${page.title}\n\n`;
      content += `${page.content}\n\n`;
    });
    
    return content;
  }

  /**
   * Generate simplified pages content with links only
   * @private
   * @param {Array} pages - Array of page data
   * @returns {string} Simplified pages content
   */
  static _generateSimplifiedPagesContent(pages) {
    let content = '## ガイドラインについて\n\n';
    
    // Sort pages to ensure consistent order
    const sortedPages = this._sortPages(pages);
    
    sortedPages.forEach(page => {
      const pageUrl = UrlGenerator.generatePageUrl(page.fileName);
      content += `- [${page.title}](${pageUrl})\n`;
    });
    
    return content + '\n';
  }

  /**
   * Generate guidelines section content
   * @param {Object} guidelines - Guidelines grouped by area and category
   * @param {boolean} isFullVersion - Whether this is for the full version
   * @returns {string} Guidelines content
   */
  static generateGuidelinesContent(guidelines, isFullVersion = true) {
    let content = '';
    
    for (const area in guidelines) {
      const areaName = UrlGenerator.getAreaName(area);
      content += `## ${areaName}のガイドライン\n\n`;
      
      if (isFullVersion) {
        content += this._generateFullGuidelinesContent(area, guidelines[area]);
      } else {
        content += this._generateSimplifiedGuidelinesContent(area, guidelines[area]);
      }
    }
    
    return content;
  }

  /**
   * Generate full guidelines content with details
   * @private
   * @param {string} area - Area key
   * @param {Object} categories - Categories within the area
   * @returns {string} Full guidelines content
   */
  static _generateFullGuidelinesContent(area, categories) {
    let content = '';
    
    for (const category in categories) {
      this._sortGuidelinesByLevel(categories[category]);
      
      categories[category].forEach(guideline => {
        const guidelineUrl = UrlGenerator.generateUrlPath(area, guideline.slug);
        const anchorId = UrlGenerator.generateAnchorId(guideline.title, guideline.level);
        
        content += `### <a id=\"${anchorId}\"></a>${guideline.title} (レベル${guideline.level})\n\n`;
        content += `${guideline.content}\n\n`;
        content += `詳細: [${guideline.title}](${guidelineUrl})\n\n`;
      });
    }
    
    return content;
  }

  /**
   * Generate simplified guidelines content with categories
   * @private
   * @param {string} area - Area key
   * @param {Object} categories - Categories within the area
   * @returns {string} Simplified guidelines content
   */
  static _generateSimplifiedGuidelinesContent(area, categories) {
    let content = '';
    
    for (const category in categories) {
      const categoryName = UrlGenerator.getCategoryName(category);
      content += `### ${categoryName}\n\n`;
      
      this._sortGuidelinesByLevel(categories[category]);
      
      categories[category].forEach(guideline => {
        const guidelineUrl = UrlGenerator.generateUrlPath(area, guideline.slug);
        const levelText = UrlGenerator.getLevelDescription(guideline.level);
        
        content += `- [${guideline.title}](${guidelineUrl}) (レベル${guideline.level}: ${levelText})\n`;
      });
      
      content += '\n';
    }
    
    return content;
  }

  /**
   * Sort guidelines by level
   * @private
   * @param {Array} guidelines - Array of guidelines
   */
  static _sortGuidelinesByLevel(guidelines) {
    guidelines.sort((a, b) => a.level - b.level);
  }

  /**
   * Sort pages for consistent ordering
   * @private
   * @param {Array} pages - Array of page data
   * @returns {Array} Sorted pages
   */
  static _sortPages(pages) {
    const order = { 'introduction.mdx': 0, 'usage.mdx': 1 };
    return pages.sort((a, b) => {
      return (order[a.fileName] || 999) - (order[b.fileName] || 999);
    });
  }

  /**
   * Group guidelines by area and category
   * @param {Array} guidelineFiles - Array of parsed guideline files
   * @returns {Object} Guidelines grouped by area and category
   */
  static groupGuidelines(guidelineFiles) {
    const guidelines = {};
    
    guidelineFiles.forEach(({ title, area, category, level, content, slug }) => {
      if (!guidelines[area]) {
        guidelines[area] = {};
      }
      
      if (!guidelines[area][category]) {
        guidelines[area][category] = [];
      }
      
      guidelines[area][category].push({
        title,
        level,
        content,
        slug
      });
    });
    
    return guidelines;
  }
}

module.exports = ContentGenerator;