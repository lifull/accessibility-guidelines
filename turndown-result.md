# 画像に適切なalt属性を設定する (レベル1)

`スクリーンリーダーユーザーが画像の内容を理解できるように、意味のある画像には適切なalt属性を設定する必要があります。`

## 良い実装例

```html
<img src="logo.png" alt="LIFULLのロゴ">
```

## 悪い実装例

```html
<img src="logo.png"> <!-- alt属性がない -->
<img src="logo.png" alt=""> <!-- 意味のある画像に空のalt属性 -->
<img src="logo.png" alt="画像"> <!-- 具体的な説明になっていない -->
```

## 注意点

-   装飾的な画像には空のalt属性（alt=""）を設定する
-   情報を伝える画像には具体的な説明をalt属性に設定する
-   リンクになっている画像のalt属性はリンクの目的を伝える内容にする

<figure><img src="example.jpg" alt="alt属性の例"><figcaption>適切なalt属性の設定例</figcaption></figure>

## HTML要素リファレンス

以下の要素に注意してください：

`img`
`alt属性`
`figure`
`figcaption`