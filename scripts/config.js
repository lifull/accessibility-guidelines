/**
 * Configuration for llms.txt generation
 */

module.exports = {
  // File paths
  paths: {
    guidelines: '../src/content/guidelines',
    pages: '../src/pages',
    output: '../llms.txt',
    outputFull: '../llms-full.txt'
  },

  // Base URL for the site
  baseUrl: 'https://lifull.github.io/accessibility-guidelines',

  // Site metadata
  metadata: {
    title: 'LIFULL Accessibility Guidelines',
    description: 'アクセシビリティに配慮したデザインと実装のためのガイドライン',
    englishDescription: 'This file contains accessibility guidelines for designers and developers.',
    version: 'v3.0'
  },

  // Pages to include in different versions
  pages: {
    full: ['introduction.mdx', 'usage.mdx', 'alternative-text.mdx', 'accessible-patterns.mdx'],
    simplified: ['introduction.mdx', 'usage.mdx']
  },

  // Category name mappings
  categoryNames: {
    contents: 'コンテンツ',
    'forms-and-interactions': 'フォーム・インタラクション',
    visual: 'ビジュアル',
    markup: 'マークアップ',
    forms: 'フォーム',
    interactions: 'インタラクション'
  },

  // Area name mappings
  areaNames: {
    design: 'デザイン',
    impl: '実装'
  },

  // Level descriptions
  levelDescriptions: {
    1: '必ず達成',
    2: '可能な限り達成',
    3: 'できれば考慮'
  },

  // Type labels for examples
  typeLabels: {
    good: '✓ 良い例',
    bad: '✗ 悪い例'
  },

  // Regular expressions for content cleaning
  regex: {
    imports: /import[\s\S]*?from\s+["'].*?["'];?\s*/g,
    jsxComments: /\{\/\*[\s\S]*?\*\/\}/g,
    backticks: /`([^`]+)`/g,
    frontmatterTitle: /#### 「\{frontmatter\.title\}」とは/g,
    checkpointHeader: /#### チェック項目/g,
    referenceSection: /##### 参考情報[\s\S]*$/g,
    multipleNewlines: /\n\s*\n\s*\n/g,
    htmlTags: /<[^>]*>/g,
    markdownHeaders: /#{1,6}\s*/,
    japaneseChars: /[^\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\w\s]/g,
    spaces: /\s+/g,
    dashes: /-+/g,
    leadingTrailingDashes: /^-+|-+$/g
  }
};