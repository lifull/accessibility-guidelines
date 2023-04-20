export function getSlugFromUrl(url: string) {
  return url.replace(/^.*\/([^\/]+?)(?:\.html)?$/, "$1");
}
