#!/usr/bin/env node

/**
 * LIFULL Accessibility Guidelines - llms.txt Generator
 * 
 * This script generates llms.txt files by parsing MDX files in the accessibility guidelines.
 * It follows the format described at https://github.com/AnswerDotAI/llms-txt
 * 
 * The script has been refactored into modular components for better maintainability:
 * - config.js: Configuration and constants
 * - parsers/: File parsing utilities
 * - generators/: Content generation utilities
 * - llms-generator.js: Main generator class
 */

const LlmsGenerator = require('./llms-generator');

// Main execution
if (require.main === module) {
  LlmsGenerator.run()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('Error generating llms files:', error.message);
      process.exit(1);
    });
}

module.exports = LlmsGenerator;