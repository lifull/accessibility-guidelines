/**
 * Main llms.txt generator class
 */

const path = require('path');
const config = require('./config');
const MdxParser = require('./parsers/mdx-parser');
const ContentGenerator = require('./generators/content-generator');
const FileParser = require('./parsers/file-parser');
const Logger = require('./logger');

class LlmsGenerator {
  constructor(options = {}) {
    this.guidelinesPath = path.resolve(__dirname, config.paths.guidelines);
    this.pagesPath = path.resolve(__dirname, config.paths.pages);
    this.outputPath = path.resolve(__dirname, config.paths.output);
    this.outputFullPath = path.resolve(__dirname, config.paths.outputFull);
    
    // Initialize logger
    this.logger = new Logger({
      verbose: options.verbose || false,
      silent: options.silent || false
    });
  }

  /**
   * Generate both llms.txt and llms-full.txt files
   * @returns {Promise<void>}
   */
  async generate() {
    const timer = this.logger.timer('Generation process');
    
    try {
      this.logger.info('Generating llms.txt and llms-full.txt files...');
      
      // Check dependencies
      this._checkDependencies();
      
      // Parse all content
      const { pages, guidelines } = await this._parseAllContent();
      
      // Generate and write simplified version
      await this._generateSimplifiedVersion(pages, guidelines);
      
      // Generate and write full version
      await this._generateFullVersion(pages, guidelines);
      
      timer();
      this.logger.success('Generation completed successfully!');
    } catch (error) {
      this.logger.error('Error generating llms files:', error.message);
      throw error;
    }
  }

  /**
   * Parse all content from guidelines and pages
   * @private
   * @returns {Promise<Object>} Parsed content object
   */
  async _parseAllContent() {
    this.logger.info('Parsing content files...');
    const parseTimer = this.logger.timer('Content parsing');
    
    try {
      // Parse guidelines
      console.log('[VERBOSE] Processing guidelines directory...');
      const guidelineFiles = MdxParser.processDirectory(
        this.guidelinesPath,
        MdxParser.parseGuidelineMdxFile
      );
      
      // Parse pages for full version
      console.log('[VERBOSE] Processing pages for full version...');
      const fullPages = MdxParser.processDirectory(
        this.pagesPath,
        MdxParser.parsePagesMdxFile,
        config.pages.full
      );
      
      // Parse pages for simplified version
      console.log('[VERBOSE] Processing pages for simplified version...');
      const simplifiedPages = MdxParser.processDirectory(
        this.pagesPath,
        MdxParser.parsePagesMdxFile,
        config.pages.simplified
      );
      
      // Group guidelines by area and category
      console.log('[VERBOSE] Grouping guidelines by area and category...');
      const guidelines = ContentGenerator.groupGuidelines(guidelineFiles);
      
      parseTimer();
      this.logger.info(`Parsed ${guidelineFiles.length} guidelines and ${fullPages.length} pages`);
      
      return {
        pages: {
          full: fullPages,
          simplified: simplifiedPages
        },
        guidelines
      };
    } catch (error) {
      this.logger.error('Failed to parse content:', error.message);
      throw error;
    }
  }

  /**
   * Generate simplified version (llms.txt)
   * @private
   * @param {Object} pages - Pages object with full/simplified arrays
   * @param {Object} guidelines - Guidelines grouped by area/category
   * @returns {Promise<void>}
   */
  async _generateSimplifiedVersion(pages, guidelines) {
    this.logger.info('Generating simplified version (llms.txt)...');
    
    try {
      const content = [
        ContentGenerator.generateHeader(),
        ContentGenerator.generatePagesContent(pages.simplified, false),
        ContentGenerator.generateGuidelinesContent(guidelines, false)
      ].join('');
      
      FileParser.writeFile(this.outputPath, content);
      this.logger.success(`Successfully generated ${this.outputPath}`);
    } catch (error) {
      this.logger.error(`Failed to generate simplified version: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate full version (llms-full.txt)
   * @private
   * @param {Object} pages - Pages object with full/simplified arrays
   * @param {Object} guidelines - Guidelines grouped by area/category
   * @returns {Promise<void>}
   */
  async _generateFullVersion(pages, guidelines) {
    this.logger.info('Generating full version (llms-full.txt)...');
    
    try {
      const content = [
        ContentGenerator.generateHeader(),
        ContentGenerator.generateTableOfContents(pages.full, guidelines),
        ContentGenerator.generatePagesContent(pages.full, true),
        ContentGenerator.generateGuidelinesContent(guidelines, true)
      ].join('');
      
      FileParser.writeFile(this.outputFullPath, content);
      this.logger.success(`Successfully generated ${this.outputFullPath}`);
    } catch (error) {
      this.logger.error(`Failed to generate full version: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if required dependencies are available
   * @private
   */
  _checkDependencies() {
    try {
      require.resolve('gray-matter');
      this.logger.verbose('Required dependencies are available');
    } catch (e) {
      this.logger.info('Installing required dependencies...');
      try {
        require('child_process').execSync('npm install --no-save gray-matter', { stdio: 'inherit' });
        this.logger.success('Dependencies installed successfully');
      } catch (installError) {
        this.logger.error('Failed to install dependencies:', installError.message);
        throw new Error('Could not install required dependencies');
      }
    }
  }

  /**
   * Static method to run the generator
   * @returns {Promise<void>}
   */
  static async run() {
    const generator = new LlmsGenerator();
    await generator.generate();
  }
}

module.exports = LlmsGenerator;