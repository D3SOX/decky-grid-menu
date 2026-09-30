export interface MenuState {
  plugins: { name: string; content?: unknown }[];
  hiddenPlugins: string[];
  activePlugin: unknown;
}

export interface DeckyState {
  publicState(): MenuState;
  eventBus: EventTarget;
}

// Decky does not expose a public menu-layout API. Keep this internal dependency
// in one place, and leave its menu alone if that API is unavailable.
export function getDeckyState(): DeckyState | undefined {
  const loader = (
    window as Window & {
      DeckyPluginLoader?: { deckyState?: DeckyState };
    }
  ).DeckyPluginLoader;
  const state = loader?.deckyState;
  if (
    typeof state?.publicState !== "function" ||
    typeof state.eventBus?.addEventListener !== "function"
  ) {
    return undefined;
  }
  return state;
}
