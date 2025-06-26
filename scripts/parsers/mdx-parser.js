/**
 * MDX file parsing utilities
 */

const matter = require('gray-matter');
const path = require('path');
const config = require('../config');
const FileParser = require('./file-parser');
const ComponentParser = require('./component-parser');

class MdxParser {
  /**
   * Parse a guidelines MDX file and extract structured content
   * @param {string} filePath - Path to the MDX file
   * @returns {Object} Parsed guideline data
   */
  static parseGuidelineMdxFile(filePath) {
    const fileContent = FileParser.readFile(filePath);
    const { data, content } = matter(fileContent);
    
    // Step 1: Remove imports
    let cleanContent = content.replace(config.regex.imports, '');
    
    // Step 2: Process components using dedicated functions
    const checkpointContent = ComponentParser.parseCheckpoint(cleanContent);
    const casesContent = ComponentParser.parseCases(cleanContent);
    
    // Step 3: Remove all components and HTML tags
    cleanContent = ComponentParser.cleanProcessedComponents(cleanContent);
    
    // Step 4: Combine all content
    const finalContent = MdxParser._combineContent(checkpointContent, cleanContent, casesContent);
    
    return {
      title: data.title,
      area: data.area,
      category: data.category,
      level: data.level,
      content: finalContent,
      slug: data.slug || MdxParser._generateSlugFromTitle(data.title)
    };
  }

  /**
   * Parse a pages MDX file (simpler structure)
   * @param {string} filePath - Path to the MDX file
   * @returns {Object} Parsed page data
   */
  static parsePagesMdxFile(filePath) {
    const fileContent = FileParser.readFile(filePath);
    const { data, content } = matter(fileContent);
    
    // For pages, we use a simpler approach
    const cleanContent = MdxParser._cleanPagesContent(content, data);
    
    return {
      title: data.title,
      content: cleanContent,
      fileName: path.basename(filePath, '.mdx')
    };
  }

  /**
   * Clean pages content by removing components and processing templates
   * @private
   * @param {string} content - Raw content
   * @param {Object} data - Frontmatter data
   * @returns {string} Cleaned content
   */
  static _cleanPagesContent(content, data) {
    return content
      // Remove imports
      .replace(config.regex.imports, '')
      // Remove component tags but keep content where appropriate
      .replace(/<PageTitle[^>]*>([\s\S]*?)<\/PageTitle>/g, '$1')
      .replace(/<Prose[^>]*>([\s\S]*?)<\/Prose>/g, '$1')
      .replace(/<Pagination[^>]*\/>/g, '')
      // Handle Details components - keep content but add summary
      .replace(/<Details[^>]*summary=["']([^"']+)["'][^>]*>([\s\S]*?)<\/Details>/g, '**$1**\n\n$2')
      .replace(/<Details[^>]*>([\s\S]*?)<\/Details>/g, '$1')
      // Remove remaining component tags
      .replace(config.regex.htmlTags, '')
      // Clean up slot references
      .replace(/\{frontmatter\.title\}/g, data.title || '')
      // Clean up extra whitespace
      .replace(config.regex.multipleNewlines, '\n\n')
      .trim();
  }

  /**
   * Combine different content sections
   * @private
   * @param {string} checkpointContent - Processed checkpoint content
   * @param {string} cleanContent - Cleaned main content
   * @param {string} casesContent - Processed cases content
   * @returns {string} Combined content
   */
  static _combineContent(checkpointContent, cleanContent, casesContent) {
    let finalContent = '';
    
    if (checkpointContent) {
      finalContent += checkpointContent;
    }
    
    if (cleanContent) {
      finalContent += cleanContent + '\n\n';
    }
    
    if (casesContent) {
      finalContent += casesContent;
    }
    
    return finalContent.trim();
  }

  /**
   * Generate slug from title
   * @private
   * @param {string} title - Page title
   * @returns {string} Generated slug
   */
  static _generateSlugFromTitle(title) {
    return title
      .toLowerCase()
      .replace(config.regex.spaces, '-')
      .replace(/[^\w\-]/g, '');
  }

  /**
   * Process multiple MDX files in a directory
   * @param {string} dirPath - Directory path
   * @param {Function} parseFunction - Function to parse individual files
   * @param {string[]} [fileFilter] - Optional array of filenames to include
   * @returns {Array} Array of parsed file data
   */
  static processDirectory(dirPath, parseFunction, fileFilter = null) {
    const fullDirPath = path.resolve(__dirname, dirPath);
    const mdxFiles = FileParser.getMdxFiles(fullDirPath);
    const results = [];
    
    for (const filePath of mdxFiles) {
      const fileName = path.basename(filePath);
      
      // Apply file filter if provided
      if (fileFilter && !fileFilter.includes(fileName)) {
        continue;
      }
      
      try {
        const parsedData = parseFunction(filePath);
        results.push(parsedData);
      } catch (error) {
        console.error(`Error processing file ${filePath}:`, error.message);
      }
    }
    
    return results;
  }
}

module.exports = MdxParser;