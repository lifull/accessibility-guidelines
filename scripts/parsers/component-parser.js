/**
 * Astro/MDX component parsing utilities
 */

const config = require('../config');
const CodeBlockParser = require('./code-block-parser');

class ComponentParser {
  /**
   * Parse Checkpoint components
   * @param {string} content - Content containing Checkpoint components
   * @returns {string} Parsed checkpoint content
   */
  static parseCheckpoint(content) {
    let result = '';
    
    // Handle self-closing Checkpoint with title attribute
    const selfClosingMatches = content.matchAll(/<Checkpoint[^>]*title=["']([^"']+)["'][^>]*\/>/g);
    for (const match of selfClosingMatches) {
      result += `**チェック項目:** ${match[1]}\n\n`;
    }
    
    // Handle Checkpoint with slot title
    const checkpointMatches = content.matchAll(/<Checkpoint[^>]*>([\s\S]*?)<\/Checkpoint>/g);
    for (const match of checkpointMatches) {
      const innerContent = match[1];
      
      // Look for slot="title" span
      const titleMatch = innerContent.match(/<span[^>]*slot=["']title["'][^>]*>([\s\S]*?)<\/span>/);
      if (titleMatch) {
        // Clean up JSX comments and backticks
        const title = titleMatch[1]
          .replace(config.regex.jsxComments, '') // Remove JSX comments
          .replace(config.regex.backticks, '$1') // Remove backticks but keep content
          .trim();
        if (title) {
          result += `**チェック項目:** ${title}\n\n`;
        }
      } else {
        result += '**チェック項目**\n\n';
      }
    }
    
    return result;
  }

  /**
   * Parse Cases and Case components
   * @param {string} content - Content containing Cases components
   * @returns {string} Parsed cases content
   */
  static parseCases(content) {
    let result = '';
    
    const casesMatches = content.matchAll(/<Cases>([\s\S]*?)<\/Cases>/g);
    for (const casesMatch of casesMatches) {
      const casesContent = casesMatch[1];
      
      // Extract Cases title
      const casesTitleMatch = casesContent.match(/<div[^>]*slot=["']title["'][^>]*>([\s\S]*?)<\/div>/);
      if (casesTitleMatch) {
        const title = casesTitleMatch[1].replace(config.regex.markdownHeaders, '').trim();
        result += `${title}\n\n`;
      }
      
      // Process individual Case components
      result += this._parseCaseComponents(casesContent);
    }
    
    return result;
  }

  /**
   * Parse individual Case components within Cases
   * @private
   * @param {string} casesContent - Content within Cases component
   * @returns {string} Parsed case content
   */
  static _parseCaseComponents(casesContent) {
    let result = '';
    
    const caseMatches = casesContent.matchAll(/<Case[^>]*>([\s\S]*?)<\/Case>/g);
    for (const caseMatch of caseMatches) {
      const caseFullMatch = caseMatch[0];
      const caseContent = caseMatch[1];
      
      // Extract type and title from Case attributes
      const { type, title } = this._extractCaseMetadata(caseFullMatch, caseContent);
      
      if (type && title) {
        const typeLabel = config.typeLabels[type] || type;
        result += `${typeLabel}: ${title}\n\n`;
      }
      
      // Extract code blocks from figure slot
      result += this._extractCaseCodeBlocks(caseContent);
      
      // Extract other text content
      result += this._extractCaseTextContent(caseContent);
    }
    
    return result;
  }

  /**
   * Extract metadata from Case component
   * @private
   * @param {string} caseFullMatch - Full Case component match
   * @param {string} caseContent - Case component content
   * @returns {Object} Type and title
   */
  static _extractCaseMetadata(caseFullMatch, caseContent) {
    const typeMatch = caseFullMatch.match(/type=["']([^"']+)["']/);
    const attributeTitleMatch = caseFullMatch.match(/title=["']([^"']+)["']/);
    const slotTitleMatch = caseContent.match(/<span[^>]*slot=["']title["'][^>]*>([\s\S]*?)<\/span>/);
    
    const type = typeMatch ? typeMatch[1] : '';
    const title = attributeTitleMatch ? attributeTitleMatch[1].trim() : 
                 slotTitleMatch ? slotTitleMatch[1].trim() : '';
    
    return { type, title };
  }

  /**
   * Extract code blocks from Case figure slot
   * @private
   * @param {string} caseContent - Case component content
   * @returns {string} Formatted code blocks
   */
  static _extractCaseCodeBlocks(caseContent) {
    const figureMatch = caseContent.match(/<div[^>]*slot=["']figure["'][^>]*>([\s\S]*?)<\/div>/);
    if (!figureMatch) return '';
    
    const figureContent = figureMatch[1];
    const codeBlocks = CodeBlockParser.parseCodeBlocks(figureContent);
    
    return codeBlocks.length > 0 ? 
      CodeBlockParser.formatCodeBlocks(codeBlocks) + '\n\n' : '';
  }

  /**
   * Extract text content from Case component
   * @private
   * @param {string} caseContent - Case component content
   * @returns {string} Extracted text content
   */
  static _extractCaseTextContent(caseContent) {
    const textContent = caseContent
      .replace(/<div[^>]*slot=["']figure["'][^>]*>[\s\S]*?<\/div>/g, '')
      .replace(/<span[^>]*slot=["']title["'][^>]*>[\s\S]*?<\/span>/g, '')
      .replace(/<[^>]*slot=["'][^"']*["'][^>]*>[\s\S]*?<\/[^>]*>/g, '')
      .replace(/<img[^>]*>/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(config.regex.htmlTags, '')
      .trim();
    
    return textContent ? `${textContent}\n\n` : '';
  }

  /**
   * Clean content by removing processed components
   * @param {string} content - Original content
   * @returns {string} Cleaned content
   */
  static cleanProcessedComponents(content) {
    return content
      // Remove all Checkpoint components (already processed)
      .replace(/<Checkpoint[\s\S]*?<\/Checkpoint>/g, '')
      .replace(/<Checkpoint[^>]*\/>/g, '')
      // Remove all Cases components (already processed)
      .replace(/<Cases>[\s\S]*?<\/Cases>/g, '')
      // Remove Level components
      .replace(/<Level[^>]*\/>/g, '')
      // Remove Details components but keep content
      .replace(/<Details[^>]*>([\s\S]*?)<\/Details>/g, '$1')
      // Remove remaining HTML tags and components
      .replace(config.regex.htmlTags, '')
      // Clean up frontmatter references
      .replace(config.regex.frontmatterTitle, '')
      .replace(config.regex.checkpointHeader, '')
      // Remove reference section
      .replace(config.regex.referenceSection, '')
      // Clean up extra whitespace
      .replace(config.regex.multipleNewlines, '\n\n')
      .trim();
  }
}

module.exports = ComponentParser;