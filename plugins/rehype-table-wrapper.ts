import type { Element, Root, RootContent } from 'hast';

const isElement = (node: RootContent): node is Element => node.type === 'element';

const isTableScrollWrapper = (node: Element) =>
  node.tagName === 'div' && node.properties.className?.includes('table-scroll');

export function rehypeTableWrapper(): (tree: Root) => void {
  return (tree) => {
    const wrapTables = (parent: Root | Element) => {
      for (let index = 0; index < parent.children.length; index += 1) {
        const child = parent.children[index];

        if (!isElement(child)) continue;

        if (isTableScrollWrapper(child)) continue;

        if (child.tagName === 'table') {
          parent.children[index] = {
            type: 'element',
            tagName: 'div',
            properties: { className: ['table-scroll'] },
            children: [child],
          };
          continue;
        }

        wrapTables(child);
      }
    };

    wrapTables(tree);
  };
}
