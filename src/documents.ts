import { startGrid, type GridOptions } from "./grid";
import type { Settings } from "./settings";

export function watchMenuDocuments(
  options: Omit<GridOptions, "document"> & {
    getDocuments: () => Document[];
    view: Window;
  },
) {
  const grids = new Map<Document, ReturnType<typeof startGrid>>();
  let settings = options.settings;

  function refresh() {
    const documents = new Set(
      options
        .getDocuments()
        .filter(
          (document) =>
            document.body &&
            document.defaultView &&
            !document.defaultView.closed,
        ),
    );
    for (const [document, grid] of grids) {
      if (!documents.has(document)) {
        grid.stop();
        grids.delete(document);
      }
    }
    for (const document of documents) {
      if (!grids.has(document)) {
        grids.set(document, startGrid({ ...options, document, settings }));
      }
    }
  }

  refresh();
  options.eventBus.addEventListener("update", refresh);
  // Steam creates/replaces the Quick Access popup independently of Decky state.
  const timer = options.view.setInterval(refresh, 1000);

  return {
    refresh,
    update(next: Settings) {
      settings = next;
      refresh();
      for (const grid of grids.values()) grid.update(settings);
    },
    stop() {
      options.view.clearInterval(timer);
      options.eventBus.removeEventListener("update", refresh);
      for (const grid of grids.values()) grid.stop();
      grids.clear();
    },
  };
}
