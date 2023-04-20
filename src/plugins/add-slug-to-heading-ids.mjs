export default function () {
  return function (tree, file) {
    const { slug } = file.data.astro.frontmatter;
    if (!slug) {
      return;
    }

    walk(tree);

    function walk(node) {
      if (/^h[1-6]$/.test(node.tagName) && node.properties.id) {
        node.properties.id = `${slug}-${node.properties.id}`;
      }
      node.children?.forEach(walk);
    }
  };
}
