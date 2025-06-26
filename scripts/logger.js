/**
 * Logging utilities for the llms.txt generator
 */

class Logger {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.silent = options.silent || false;
  }

  /**
   * Log an info message
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  info(message, ...args) {
    if (!this.silent) {
      console.log(message, ...args);
    }
  }

  /**
   * Log a verbose message (only shown if verbose mode is enabled)
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  verbose(message, ...args) {
    if (this.verbose && !this.silent) {
      console.log(`[VERBOSE] ${message}`, ...args);
    }
  }

  /**
   * Log a warning message
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  warn(message, ...args) {
    if (!this.silent) {
      console.warn(`[WARNING] ${message}`, ...args);
    }
  }

  /**
   * Log an error message
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  error(message, ...args) {
    console.error(`[ERROR] ${message}`, ...args);
  }

  /**
   * Log a success message
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  success(message, ...args) {
    if (!this.silent) {
      console.log(`✓ ${message}`, ...args);
    }
  }

  /**
   * Log progress information
   * @param {string} message - Message to log
   * @param {number} current - Current progress
   * @param {number} total - Total items
   */
  progress(message, current, total) {
    if (!this.silent) {
      const percentage = Math.round((current / total) * 100);
      console.log(`[${current}/${total}] (${percentage}%) ${message}`);
    }
  }

  /**
   * Create a timer for measuring execution time
   * @param {string} label - Timer label
   * @returns {Function} Function to stop the timer
   */
  timer(label) {
    const startTime = Date.now();
    const verbose = this.verbose;
    const silent = this.silent;
    
    return () => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      if (verbose && !silent) {
        console.log(`[VERBOSE] ${label} completed in ${duration}ms`);
      }
      return duration;
    };
  }
}

module.exports = Logger;