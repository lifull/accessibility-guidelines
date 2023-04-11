export function getSlugFromUrl(url: string) {
  return url.replace(/^(?:https?:\/\/[^\/]+)?\/(.+?)(?:\.html)?$/, "$1");
}
