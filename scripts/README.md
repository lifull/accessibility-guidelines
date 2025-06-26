# llms.txt Generator

このディレクトリには、LIFULL Accessibility Guidelines用のllms.txtファイルを生成するためのスクリプトが含まれています。

## 概要

llms.txtジェネレーターは、MDXファイルからアクセシビリティガイドラインの内容を抽出し、AI言語モデルが利用しやすい形式のファイルを生成します。

## ファイル構成

```text
scripts/
├── generate-llms-txt.js    # メインスクリプト（エントリーポイント）
├── llms-generator.js       # メインジェネレータークラス
├── config.js              # 設定ファイル
├── logger.js              # ログ機能
├── parsers/               # パーサーモジュール
│   ├── file-parser.js     # ファイル操作ユーティリティ
│   ├── mdx-parser.js      # MDXファイルパーサー
│   ├── component-parser.js # Astroコンポーネントパーサー
│   ├── code-block-parser.js # コードブロックパーサー
│   └── url-generator.js   # URL生成ユーティリティ
└── generators/            # コンテンツ生成モジュール
    └── content-generator.js # llms.txtコンテンツ生成
```

## 使用方法

### 基本的な使用方法

```bash
# package.jsonで定義されたスクリプトを使用
npm run generate-llms

# または直接実行
node scripts/generate-llms-txt.js
```

### プログラムからの使用

```javascript
const LlmsGenerator = require('./scripts/llms-generator');

// 基本的な使用
const generator = new LlmsGenerator();
await generator.generate();

// オプションを指定
const generator = new LlmsGenerator({
  verbose: true,  // 詳細なログを表示
  silent: false   // 静寂モード
});
await generator.generate();
```

## 生成されるファイル

- `llms.txt` - 簡易版（ガイドライン一覧とリンクのみ）
- `llms-full.txt` - 完全版（全コンテンツを含む）

## 設定

設定は `config.js` で管理されています：

```javascript
module.exports = {
  // ファイルパス
  paths: {
    guidelines: '../src/content/guidelines',
    pages: '../src/pages',
    output: '../llms.txt',
    outputFull: '../llms-full.txt'
  },

  // サイトメタデータ
  metadata: {
    title: 'LIFULL Accessibility Guidelines',
    version: 'v3.0'
  },

  // その他の設定...
};
```

## 機能

### パーサー機能

- **MDXファイル解析**: フロントマターとコンテンツの分離
- **Astroコンポーネント処理**: Checkpoint、Cases、Case、Levelコンポーネントの解析
- **コードブロック抽出**: HTMLコード例の正確な抽出
- **日本語URL対応**: アンカーIDの生成で日本語文字をサポート

### コンテンツ生成

- **階層構造**: エリア（デザイン/実装）とカテゴリーによる整理
- **目次生成**: 完全版では自動的に目次を生成
- **レベル表示**: ガイドラインの重要度レベルを表示
- **URLリンク**: 各ガイドラインへの直接リンク

### エラーハンドリング

- **詳細なログ**: verbose モードで詳細な処理状況を表示
- **例外処理**: ファイル読み込みやパース処理のエラーを適切に処理
- **依存関係チェック**: 必要なnpmパッケージの自動インストール

## 開発・メンテナンス

### 新しいコンポーネントの追加

新しいAstroコンポーネントを処理に追加する場合：

1. `parsers/component-parser.js` に解析ロジックを追加
2. `config.js` に必要な設定を追加
3. テストを実行して動作確認

### 設定の変更

設定変更は `config.js` を編集してください。変更後は以下をテスト：

```bash
npm run generate-llms
```

### デバッグ

詳細なログを確認したい場合：

```javascript
const generator = new LlmsGenerator({ verbose: true });
await generator.generate();
```

## トラブルシューティング

### よくある問題

1. **依存関係エラー**: `npm install` を実行
2. **パスエラー**: `config.js` のパス設定を確認
3. **MDXパースエラー**: ファイルの構文を確認

### ログレベル

- **info**: 一般的な進行状況
- **verbose**: 詳細な処理状況（verbose モード時のみ）
- **warn**: 警告メッセージ
- **error**: エラーメッセージ
- **success**: 成功メッセージ
