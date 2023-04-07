const structure: Record<string, string> = {
  introduction: "ガイドラインについて – はじめに",
  usage: "ガイドラインについて – 利用方法",
  "design-contents": "デザイン – コンテンツ",
  "design-forms-and-interactions": "デザイン – フォーム・インタラクション",
  "design-visual": "デザイン – ビジュアル",
  "impl-markup": "実装 – マークアップ",
  "impl-forms": "実装 – フォーム",
  "impl-interactions": "実装 – インタラクション",
};

export function getPrev(current: string) {
  const keys = Object.keys(structure);
  const index = keys.indexOf(current);
  const prevKey = keys[index - 1];

  return prevKey && { slug: prevKey, title: structure[prevKey] };
}

export function getNext(current: string) {
  const keys = Object.keys(structure);
  const index = keys.indexOf(current);
  const prevKey = keys[index + 1];

  return prevKey && { slug: prevKey, title: structure[prevKey] };
}
