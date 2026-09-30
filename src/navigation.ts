export interface NavigationNode {
  Element?: HTMLElement;
  GetChildren(): [NavigationNode[], number];
  BTakeFocus(source: number, direction: number): boolean;
}

export interface NavigationTree {
  m_ID: string;
  Root?: NavigationNode;
}

export function focusNativeButton(
  trees: NavigationTree[],
  button: HTMLElement,
  direction: number,
): boolean {
  for (const tree of trees) {
    if (tree.Root?.Element?.ownerDocument !== button.ownerDocument) continue;
    const nodes = [tree.Root];
    while (nodes.length > 0) {
      const node = nodes.pop()!;
      if (node.Element === button) {
        // Steam's focus-source enum defines GAMEPAD as 0. Browser focus uses
        // source 3 and skips navigation sounds; use the same path as the D-pad.
        return node.BTakeFocus(0, direction);
      }
      nodes.push(...node.GetChildren()[0]);
    }
  }
  return false;
}
