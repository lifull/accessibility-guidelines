/**
 * URL and anchor ID generation utilities
 */

const config = require('../config');

class UrlGenerator {
  /**
   * Generate URL path from area and slug
   * @param {string} area - Area (design/impl)
   * @param {string} slug - Page slug
   * @returns {string} Full URL
   */
  static generateUrlPath(area, slug) {
    return `${config.baseUrl}/${area}/${slug}`;
  }

  /**
   * Generate page URL for pages directory files
   * @param {string} fileName - File name (e.g., 'introduction.mdx')
   * @returns {string} Full URL
   */
  static generatePageUrl(fileName) {
    const baseName = fileName.replace('.mdx', '');
    return `${config.baseUrl}/${baseName}.html`;
  }

  /**
   * Generate anchor ID for table of contents
   * @param {string} title - Section title
   * @param {number} [level] - Optional level for uniqueness
   * @returns {string} Anchor ID
   */
  static generateAnchorId(title, level) {
    const id = title
      .toLowerCase()
      // Keep Japanese characters, alphanumeric, and spaces only
      .replace(config.regex.japaneseChars, '')
      .replace(config.regex.spaces, '-')
      .replace(config.regex.dashes, '-')
      .replace(config.regex.leadingTrailingDashes, '');
    
    return id;
  }

  /**
   * Get level description text
   * @param {number} level - Level number (1-3)
   * @returns {string} Level description
   */
  static getLevelDescription(level) {
    return config.levelDescriptions[level] || 'Unknown level';
  }

  /**
   * Get area name in Japanese
   * @param {string} area - Area key (design/impl)
   * @returns {string} Japanese area name
   */
  static getAreaName(area) {
    return config.areaNames[area] || area;
  }

  /**
   * Get category name in Japanese
   * @param {string} category - Category key
   * @returns {string} Japanese category name
   */
  static getCategoryName(category) {
    return config.categoryNames[category] || category;
  }
}

module.exports = UrlGenerator;