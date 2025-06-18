/**
 * File system utilities for finding and reading MDX files
 */

const fs = require('fs');
const path = require('path');

class FileParser {
  /**
   * Recursively get all files with .mdx extension
   * @param {string} dir - Directory to search in
   * @returns {string[]} Array of file paths
   */
  static getMdxFiles(dir) {
    let results = [];
    
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          results = results.concat(this.getMdxFiles(filePath));
        } else if (path.extname(file) === '.mdx') {
          results.push(filePath);
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read directory ${dir}:`, error.message);
    }
    
    return results;
  }

  /**
   * Read and validate file content
   * @param {string} filePath - Path to the file
   * @returns {string} File content
   * @throws {Error} If file cannot be read
   */
  static readFile(filePath) {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Write content to file with error handling
   * @param {string} filePath - Path to write to
   * @param {string} content - Content to write
   * @throws {Error} If file cannot be written
   */
  static writeFile(filePath, content) {
    try {
      fs.writeFileSync(filePath, content, 'utf8');
    } catch (error) {
      throw new Error(`Failed to write file ${filePath}: ${error.message}`);
    }
  }
}

module.exports = FileParser;