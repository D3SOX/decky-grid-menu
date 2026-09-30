import type { MenuState } from "./decky";
import type { Settings } from "./settings";
import { GRID_CSS } from "./styles";

export interface GridOptions {
  document: Document;
  readState: () => MenuState;
  eventBus: EventTarget;
  settings: Settings;
  directions: Record<Direction, number>;
  focusButton: (button: HTMLElement, direction: number) => boolean;
}

type Direction = "up" | "down" | "left" | "right";

interface Tile {
  row: HTMLElement;
  button: HTMLElement;
  content: HTMLElement;
  label: HTMLElement;
  name: string;
}

export function startGrid(options: GridOptions) {
  const { document, readState, eventBus } = options;
  const view = document.defaultView!;
  let settings = options.settings;
  let frame: number | undefined;
  let stopped = false;
  const marked = new Set<HTMLElement>();
  const style = document.createElement("style");
  style.dataset.deckyGridStyle = "";
  style.textContent = GRID_CSS;
  document.head.append(style);

  function mark(element: HTMLElement, role: string) {
    element.dataset.deckyGrid = role;
    marked.add(element);
  }

  function restore() {
    for (const element of marked) {
      delete element.dataset.deckyGrid;
      element.style.removeProperty("--decky-grid-columns");
    }
    marked.clear();
  }

  function apply() {
    restore();
    if (stopped || !settings.enabled) return;
    const state = readState();
    if (state.activePlugin) return;
    const names = new Set(
      state.plugins
        .filter((plugin) => plugin.content)
        .filter((plugin) => !state.hiddenPlugins.includes(plugin.name))
        .map((plugin) => plugin.name),
    );
    if (names.size === 0) return;

    // Match the complete native menu, not individual plugin settings or store
    // buttons. Preserve the DOM, handlers, order, icons and notification badge.
    const buttonSelector = "button, [role='button']";
    const groups = new Map<HTMLElement, Tile[]>();
    for (const button of document.querySelectorAll<HTMLElement>(
      buttonSelector,
    )) {
      const label = Array.from(
        button.querySelectorAll<HTMLElement>("div"),
      ).find(
        (element) =>
          element.children.length === 0 &&
          names.has(element.textContent?.trim() ?? ""),
      );
      const content = label?.parentElement;
      if (!label || !content || content === button) continue;
      // Find the common section from the original buttons. Steam's cached
      // PanelSectionRow classes can differ from the ones actually rendered.
      let row = button;
      let parent = row.parentElement;
      while (parent && parent !== document.body) {
        const tiles = groups.get(parent) ?? [];
        tiles.push({
          row,
          button,
          content,
          label,
          name: label.textContent!.trim(),
        });
        groups.set(parent, tiles);
        row = parent;
        parent = row.parentElement;
      }
    }

    for (const [container, tiles] of groups) {
      if (
        tiles.length !== names.size ||
        new Set(tiles.map((tile) => tile.name)).size !== names.size ||
        new Set(tiles.map((tile) => tile.row)).size !== tiles.length ||
        container.children.length < 2 ||
        container.querySelectorAll(buttonSelector).length !== tiles.length
      ) {
        continue;
      }
      mark(container, "container");
      container.style.setProperty(
        "--decky-grid-columns",
        String(settings.columns),
      );
      for (const { row, button, content, label } of tiles) {
        mark(row, "row");
        // Steam may wrap ButtonItem in extra field/child containers.
        let wrapper = button.parentElement;
        while (wrapper && wrapper !== row) {
          mark(wrapper, "wrapper");
          wrapper = wrapper.parentElement;
        }
        mark(button, "button");
        mark(content, "content");
        mark(label, "label");
        for (const sibling of Array.from(content.children)) {
          if (
            sibling !== label &&
            (sibling as HTMLElement).style.position === "absolute"
          ) {
            mark(sibling as HTMLElement, "badge");
          }
        }
      }
      for (const child of Array.from(container.children)) {
        if (!tiles.some((tile) => tile.row === child)) {
          mark(child as HTMLElement, "footer");
        }
      }
    }
  }

  function schedule() {
    if (!stopped && frame === undefined) {
      frame = view.requestAnimationFrame(() => {
        frame = undefined;
        apply();
      });
    }
  }

  function onDirection(event: Event) {
    if (stopped || !settings.enabled || readState().activePlugin) return;
    const buttonCode = (event as CustomEvent<{ button?: number }>).detail
      ?.button;
    const direction = (Object.keys(options.directions) as Direction[]).find(
      (key) => options.directions[key] === buttonCode,
    );
    if (!direction || !(event.target instanceof view.Element)) return;
    const row = event.target.closest('[data-decky-grid="row"]');
    const container = row?.closest('[data-decky-grid="container"]');
    if (!container || !row) return;
    const buttons = Array.from(
      container.querySelectorAll<HTMLElement>('[data-decky-grid="button"]'),
    );
    const index = buttons.findIndex((button) => row.contains(button));
    if (index < 0) return;
    const columns = settings.columns;
    const column = index % columns;
    let next = index;
    if (direction === "up") {
      if (index < columns) {
        // PluginView places its title immediately before the padded section.
        // Native vertical navigation would otherwise select the previous tile
        // in the first row rather than return to the header.
        const header = container.parentElement?.previousElementSibling;
        const headerButtons = Array.from(
          header?.querySelectorAll<HTMLElement>("button, [role='button']") ??
            [],
        );
        if (headerButtons.length === 0) return;
        const rect = buttons[index].getBoundingClientRect();
        const center = rect.left + rect.width / 2;
        const target = headerButtons.reduce((closest, candidate) => {
          const distance = (button: HTMLElement) => {
            const box = button.getBoundingClientRect();
            return Math.abs(box.left + box.width / 2 - center);
          };
          return distance(candidate) < distance(closest) ? candidate : closest;
        });
        if (!options.focusButton(target, buttonCode!)) return;
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      next = index - columns;
    } else if (direction === "down") {
      const nextRow = (Math.floor(index / columns) + 1) * columns;
      if (nextRow < buttons.length)
        next = Math.min(index + columns, buttons.length - 1);
    } else if (direction === "left" && column > 0) {
      next = index - 1;
    } else if (
      direction === "right" &&
      column < columns - 1 &&
      index + 1 < buttons.length
    ) {
      next = index + 1;
    }
    if (next !== index) {
      // Steam owns focus, scrolling, sounds and the button's A/B actions.
      if (!options.focusButton(buttons[next], buttonCode!)) return;
    }
    event.preventDefault();
    event.stopPropagation();
  }

  // React owns these nodes. Watch replacement/label changes, without observing
  // our own attribute changes and starting an observer feedback loop.
  const observer = new view.MutationObserver(schedule);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
  eventBus.addEventListener("update", schedule);
  document.body.addEventListener("vgp_ondirection", onDirection, true);
  apply();

  return {
    update(next: Settings) {
      settings = next;
      apply();
    },
    stop() {
      stopped = true;
      observer.disconnect();
      eventBus.removeEventListener("update", schedule);
      document.body.removeEventListener("vgp_ondirection", onDirection, true);
      if (frame !== undefined) view.cancelAnimationFrame(frame);
      restore();
      style.remove();
    },
  };
}
