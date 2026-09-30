import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { Window } from "happy-dom";
import type { MenuState } from "../src/decky";
import { startGrid } from "../src/grid";
import { DEFAULT_SETTINGS } from "../src/settings";
import { menu, PLUGINS, row } from "./fixture";

describe("Decky menu layout", () => {
  let window: Window;
  let document: Document;
  let state: MenuState;
  let events: EventTarget;
  let grid: ReturnType<typeof startGrid>;

  beforeEach(() => {
    window = new Window();
    document = window.document as unknown as Document;
    document.body.innerHTML =
      menu() + `<div id="unrelated">${row("Other action")}</div>`;
    state = {
      plugins: PLUGINS.map((name) => ({ name, content: {} })),
      hiddenPlugins: [],
      activePlugin: null,
    };
    events = new EventTarget();
    grid = startGrid({
      document,
      readState: () => state,
      eventBus: events,
      settings: { ...DEFAULT_SETTINGS },
      directions: { up: 9, down: 10, left: 11, right: 12 },
      focusButton: (button) => {
        button.focus();
        return true;
      },
    });
  });

  afterEach(async () => {
    grid.stop();
    await window.happyDOM.close();
  });

  const tick = () => new Promise((resolve) => setTimeout(resolve, 30));

  test("finds menu rows when Steam's classes differ from the UI library", async () => {
    for (const row of document.querySelectorAll(".native-row")) {
      row.className = "_3LM_ZckJp5yJYrL1OI_WqW";
    }
    document.getElementById("menu")!.append(document.createTextNode(""));
    await tick();
    expect(document.querySelectorAll('[data-decky-grid="button"]').length).toBe(
      5,
    );
  });

  function direction(button: HTMLElement, code: number) {
    const event = new window.CustomEvent("vgp_ondirection", {
      bubbles: true,
      cancelable: true,
      detail: { button: code },
    });
    button.dispatchEvent(event as unknown as Event);
    return event;
  }

  test("controller movement follows rows/columns and clamps an incomplete final row", () => {
    const buttons = Array.from(
      document.querySelectorAll<HTMLElement>("#menu button"),
    );
    buttons[0].focus();
    direction(buttons[0], 12);
    expect(document.activeElement).toBe(buttons[1]);
    direction(buttons[1], 10);
    expect(document.activeElement).toBe(buttons[4]);
    direction(buttons[4], 9);
    expect(document.activeElement).toBe(buttons[1]);
    buttons[2].focus();
    direction(buttons[2], 10);
    expect(document.activeElement).toBe(buttons[4]);
    direction(buttons[4], 11);
    expect(document.activeElement).toBe(buttons[3]);
  });

  test("does not wrap at horizontal/bottom edges and allows returning to the header", () => {
    const buttons = Array.from(
      document.querySelectorAll<HTMLElement>("#menu button"),
    );
    buttons[2].focus();
    expect(direction(buttons[2], 12).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(buttons[2]);
    expect(direction(buttons[2], 9).defaultPrevented).toBe(false);
    buttons[3].focus();
    direction(buttons[3], 11);
    direction(buttons[3], 10);
    expect(document.activeElement).toBe(buttons[3]);
  });

  test("leaves other gamepad actions and inactive/disabled layouts to Steam", () => {
    const button = document.querySelector<HTMLElement>("#menu button")!;
    expect(direction(button, 1).defaultPrevented).toBe(false);
    const other = document.querySelector<HTMLElement>("#unrelated button")!;
    expect(direction(other, 12).defaultPrevented).toBe(false);
    state.activePlugin = state.plugins[0];
    expect(direction(button, 12).defaultPrevented).toBe(false);
    state.activePlugin = null;
    grid.update({ enabled: false, columns: 3 });
    expect(direction(button, 12).defaultPrevented).toBe(false);
  });

  test("up from any first-row column returns to the native header", async () => {
    document.body.innerHTML = `<div><div id="header"><button>Store</button><button>Settings</button></div><div>${menu()}</div></div>`;
    await tick();
    const buttons = Array.from(
      document.querySelectorAll<HTMLElement>("#menu button"),
    );
    const header = document.querySelector<HTMLElement>("#header button")!;
    for (const button of buttons.slice(0, 3)) {
      button.focus();
      expect(direction(button, 9).defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(header);
    }
  });

  test("styles only the complete plugin menu and retains native actions/badges", () => {
    const container = document.getElementById("menu")!;
    expect(container.dataset.deckyGrid).toBe("container");
    expect(container.style.getPropertyValue("--decky-grid-columns")).toBe("3");
    expect(document.querySelectorAll('[data-decky-grid="button"]').length).toBe(
      5,
    );
    expect(document.querySelectorAll(".badge").length).toBe(6);
    expect(document.getElementById("summary")!.dataset.deckyGrid).toBe(
      "footer",
    );
    expect(
      document.getElementById("unrelated")!.querySelector("[data-decky-grid]"),
    ).toBeNull();
    const button = container.querySelector("button")!;
    let clicks = 0;
    button.addEventListener("click", () => clicks++);
    grid.update({ enabled: true, columns: 4 });
    expect(container.querySelector("button")).toBe(button);
    button.click();
    expect(clicks).toBe(1);
  });

  test("updates columns and restores native styles when disabled", () => {
    grid.update({ enabled: true, columns: 2 });
    expect(
      document
        .getElementById("menu")!
        .style.getPropertyValue("--decky-grid-columns"),
    ).toBe("2");
    grid.update({ enabled: false, columns: 2 });
    expect(document.querySelector("[data-decky-grid]")).toBeNull();
    expect(document.getElementById("summary")!.style.position).toBe("absolute");
    expect(document.getElementById("menu")!.style.cssText).toBe("");
  });

  test("leaves active plugin pages alone, even if they contain matching names", async () => {
    state.activePlugin = state.plugins[0];
    events.dispatchEvent(new Event("update"));
    await tick();
    expect(document.querySelector("[data-decky-grid]")).toBeNull();
    state.activePlugin = null;
    events.dispatchEvent(new Event("update"));
    await tick();
    expect(document.getElementById("menu")!.dataset.deckyGrid).toBe(
      "container",
    );
  });

  test("reapplies after React replaces the menu and respects hidden/headless plugins", async () => {
    state.hiddenPlugins = ["Audio Loader"];
    state.plugins.push({ name: "Background plugin" });
    const visible = PLUGINS.filter(
      (name) => !state.hiddenPlugins.includes(name),
    );
    document.getElementById("menu")!.outerHTML = menu(visible.reverse());
    await tick();
    expect(document.querySelectorAll('[data-decky-grid="button"]').length).toBe(
      4,
    );
    expect(
      document.querySelector('[data-decky-grid="label"]')!.textContent,
    ).toBe("Grid Menu");
  });

  test("supports custom image icons and names containing punctuation", async () => {
    state.plugins = [{ name: "A & B <test>", content: {} }];
    document.body.innerHTML = `<div id="menu">${row("A & B <test>", '<img alt="" src="data:,">')}<div id="summary"></div></div>`;
    await tick();
    expect(
      document.querySelector('[data-decky-grid="label"]')!.textContent,
    ).toBe("A & B <test>");
  });

  test("does not style a partial match or an empty menu", async () => {
    document.getElementById("menu")!.outerHTML = menu(PLUGINS.slice(0, 2));
    await tick();
    expect(document.querySelector("[data-decky-grid]")).toBeNull();
    state.plugins = [];
    events.dispatchEvent(new Event("update"));
    await tick();
    expect(document.querySelector("[data-decky-grid]")).toBeNull();
  });

  test("unload cancels queued work, removes CSS and stops watching the DOM/state", async () => {
    events.dispatchEvent(new Event("update"));
    grid.stop();
    expect(document.querySelector("[data-decky-grid]")).toBeNull();
    expect(document.querySelector("[data-decky-grid-style]")).toBeNull();
    document.body.innerHTML = menu();
    events.dispatchEvent(new Event("update"));
    await tick();
    expect(document.querySelector("[data-decky-grid]")).toBeNull();
  });
});
