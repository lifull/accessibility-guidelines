/**
 * Code block extraction utilities
 */

class CodeBlockParser {
  /**
   * Extract code blocks robustly using string operations
   * @param {string} content - Content to parse
   * @returns {Array} Array of code block objects
   */
  static parseCodeBlocks(content) {
    const codeBlocks = [];
    let startIndex = 0;
    
    while (true) {
      // Find next code block start
      const codeStart = content.indexOf('```', startIndex);
      if (codeStart === -1) break;
      
      // Find the end of the opening ```
      const codeOpenEnd = codeStart + 3;
      
      // Extract language (if any) - read until newline
      const newlineAfterOpen = content.indexOf('\n', codeOpenEnd);
      const language = newlineAfterOpen !== -1 
        ? content.substring(codeOpenEnd, newlineAfterOpen).trim()
        : '';
      
      // Find the closing ```
      const codeContentStart = newlineAfterOpen !== -1 ? newlineAfterOpen + 1 : codeOpenEnd;
      const codeEnd = content.indexOf('```', codeContentStart);
      
      if (codeEnd === -1) {
        // No closing ```, skip this one
        startIndex = codeOpenEnd;
        continue;
      }
      
      // Extract code content
      const codeContent = content.substring(codeContentStart, codeEnd).trim();
      
      if (codeContent.length > 0) {
        codeBlocks.push({
          fullMatch: content.substring(codeStart, codeEnd + 3),
          language: language || 'html',
          content: codeContent,
          startIndex: codeStart,
          endIndex: codeEnd + 3
        });
      }
      
      startIndex = codeEnd + 3;
    }
    
    return codeBlocks;
  }

  /**
   * Format code blocks for markdown output
   * @param {Array} codeBlocks - Array of code block objects
   * @returns {string} Formatted markdown string
   */
  static formatCodeBlocks(codeBlocks) {
    return codeBlocks
      .map(block => `\`\`\`${block.language}\n${block.content}\n\`\`\``)
      .join('\n\n');
  }
}

module.exports = CodeBlockParser;