import { expect, test } from "bun:test";
import { Window } from "happy-dom";
import { focusNativeButton, type NavigationNode } from "../src/navigation";

test("uses Steam's gamepad focus source so native navigation sounds are retained", async () => {
  const window = new Window();
  try {
    const document = window.document as unknown as Document;
    const button = document.createElement("button");
    document.body.append(button);
    const calls: number[][] = [];
    const tile: NavigationNode = {
      Element: button,
      GetChildren: () => [[], -1],
      BTakeFocus: (source, direction) => {
        calls.push([source, direction]);
        button.focus();
        return true;
      },
    };
    const root: NavigationNode = {
      Element: document.body,
      GetChildren: () => [[tile], 0],
      BTakeFocus: () => false,
    };
    expect(
      focusNativeButton([{ m_ID: "QuickAccess", Root: root }], button, 12),
    ).toBe(true);
    expect(calls).toEqual([[0, 12]]);
    expect(document.activeElement).toBe(button);
    const unknown = document.createElement("button");
    expect(
      focusNativeButton([{ m_ID: "QuickAccess", Root: root }], unknown, 12),
    ).toBe(false);
  } finally {
    await window.happyDOM.close();
  }
});
