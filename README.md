# LIFULLアクセシビリティガイドライン

LIFULLアクセシビリティガイドラインは、LIFULLの全てのプロダクトやサービスを利用しやすくするために策定されました。LIFULLのプロダクトに関わる全ての人が対象です。ガイドラインを読み、背景を知り、自らの作業に取り入れていただくことを期待しています。

[LIFULLアクセシビリティガイドライン](https://lifull.github.io/accessibility-guidelines/)

## 開発環境の構築手順

1. このリポジトリをクローンしてください。

    ```
    git clone https://github.com/lifull/accessibility-guidelines.git
    ```

2. ディレクトリに移動します。

    ```
    cd accessibility-guidelines
    ```

3. 必要な依存関係をインストールします。

    ```
    npm install
    ```

4. 開発サーバーを起動します。

    ```
    npm run dev
    ```

    これにより、<http://localhost:3000> でガイドラインのプレビューが開始されます。

## ディレクトリ構成

```
accessibility-guidelines/
├── src/                # ソースファイル
│   ├── assets/         # 画像,CSS,JSファイル
│   ├── components/     # Astroコンポーネント
│   ├── content/        # ガイドライン項目
│   ├── helpers/        # ヘルパーライブラリ
│   ├── layouts/        # ページレイアウト
│   ├── pages/          # 各ページのAstroまたはMDXファイル
│   └── plugins/        # Astroプラグイン
├── public/             # 静的ファイル（favicon,OGP画像など）
├── .gitignore          # Gitが無視するファイル・ディレクトリ
├── astro.config.mjs    # Astroの設定ファイル
├── package.json        # 依存関係とスクリプトの定義
├── README.md           # このファイル
└── VERSION.json        # ガイドラインのバージョン情報
```

## 貢献方法

LIFULLアクセシビリティガイドラインへの貢献は、以下の方法で受け付けています。

- Issueへの起票
- Pull Request

社内メンバーからの貢献は大歓迎です。外部からの貢献については受け入れるかどうかは社内で検討した後に決定されます。外部の方からの貢献に関心がある場合は、まずはIssueで議論をお願いします。

## ライセンス

このリポジトリのコンテンツは、[クリエイティブ・コモンズ 表示 4.0 国際 ライセンス (CC-BY 4.0)](https://creativecommons.org/licenses/by/4.0/deed.ja) の下でライセンスされています。
