// Native PluginView's ButtonItem children, inside representative Steam field
// wrappers. Steam owns the wrappers and focus engine; this fixture covers DOM
// matching, CSS geometry and lifecycle, rather than emulating that engine.
export const PLUGINS = [
  "CSS Loader",
  "Audio Loader",
  "SteamGridDB",
  "PowerTools",
  "Grid Menu",
];

export function row(
  name: string,
  icon = "<svg aria-hidden='true' viewBox='0 0 24 24'><path d='M4 4h16v16H4z'/></svg>",
) {
  const escaped = name
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
  return `<div class="native-row"><div class="native-field"><div class="native-children">
    <button><div style="display:flex;align-items:center;justify-content:space-between">
      ${icon}<div>${escaped}</div><span class="badge" style="position:absolute;top:-5px;right:-5px"></span>
    </div></button>
  </div></div></div>`;
}

export function menu(names = PLUGINS) {
  return `<div class="native-section" id="menu">
    ${names.map((name) => row(name)).join("")}
    <div id="summary" style="position:absolute;display:flex;flex-direction:column"><div>2 hidden plugins</div></div>
  </div>`;
}

export const NATIVE_CSS = `
body { margin: 0; background: #0e141b; color: #fff; font-family: sans-serif; }
#panel { width: 320px; padding: 16px; box-sizing: border-box; }
.native-row { margin-bottom: 8px; }
.native-field { display: flex; }
.native-children { flex: 1; }
button { background: #232d3a; color: inherit; border: 0; border-radius: 3px;
  min-width: 200px; width: 100%; padding: 12px; font: inherit; white-space: nowrap; }
button:focus-visible { outline: 2px solid #1a9fff; outline-offset: 2px; }
.badge { width: 8px; height: 8px; border-radius: 50%; background: #1a9fff; }
`;
