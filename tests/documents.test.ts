import { afterEach, describe, expect, test } from "bun:test";
import { Window } from "happy-dom";
import { watchMenuDocuments } from "../src/documents";
import { DEFAULT_SETTINGS } from "../src/settings";
import { menu, PLUGINS } from "./fixture";

describe("Steam menu windows", () => {
  const windows: Window[] = [];
  let manager: ReturnType<typeof watchMenuDocuments> | undefined;

  afterEach(async () => {
    manager?.stop();
    manager = undefined;
    await Promise.all(
      windows.splice(0).map((window) => window.happyDOM.close()),
    );
  });

  function createWindow() {
    const window = new Window();
    windows.push(window);
    return window;
  }

  function setup(getDocuments: () => Document[]) {
    const shared = createWindow();
    manager = watchMenuDocuments({
      view: shared as unknown as globalThis.Window,
      getDocuments,
      readState: () => ({
        plugins: PLUGINS.map((name) => ({ name, content: {} })),
        hiddenPlugins: [],
        activePlugin: null,
      }),
      eventBus: new EventTarget(),
      settings: { ...DEFAULT_SETTINGS },
      directions: { up: 9, down: 10, left: 11, right: 12 },
      focusButton: (button) => {
        button.focus();
        return true;
      },
    });
    return manager;
  }

  test("styles a popup document instead of the shared script document", () => {
    const popup = createWindow();
    popup.document.body.innerHTML = menu();
    setup(() => [popup.document as unknown as Document]);
    expect(
      popup.document.querySelectorAll('[data-decky-grid="button"]').length,
    ).toBe(5);
    expect(
      popup.document.querySelector("[data-decky-grid-style]"),
    ).not.toBeNull();
    expect(
      windows[1].document.querySelector("[data-decky-grid-style]"),
    ).toBeNull();
  });

  test("follows popup replacement and retains settings on newly created windows", () => {
    const original = createWindow();
    original.document.body.innerHTML = menu();
    let documents = [original.document as unknown as Document];
    const grid = setup(() => documents);
    grid.update({ enabled: true, columns: 4 });
    const replacement = createWindow();
    replacement.document.body.innerHTML = menu();
    documents = [replacement.document as unknown as Document];
    grid.refresh();
    expect(original.document.querySelector("[data-decky-grid]")).toBeNull();
    expect(
      original.document.querySelector("[data-decky-grid-style]"),
    ).toBeNull();
    expect(
      (replacement.document as unknown as Document)
        .getElementById("menu")!
        .style.getPropertyValue("--decky-grid-columns"),
    ).toBe("4");
    grid.stop();
    expect(replacement.document.querySelector("[data-decky-grid]")).toBeNull();
    expect(
      replacement.document.querySelector("[data-decky-grid-style]"),
    ).toBeNull();
  });

  test("attaches when the menu window appears after plugin initialization", () => {
    let documents: Document[] = [];
    const grid = setup(() => documents);
    const popup = createWindow();
    popup.document.body.innerHTML = menu();
    documents = [popup.document as unknown as Document];
    grid.refresh();
    expect(
      popup.document.querySelectorAll('[data-decky-grid="button"]').length,
    ).toBe(5);
  });
});
