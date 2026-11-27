# Grid Menu

A Decky plugin that arranges the main plugin menu into **three columns by default**.
Open **Grid Menu** to choose two, three, or four columns, or turn the grid off.
Settings are saved locally in Steam's browser storage and survive restarts.

<img src="docs/images/grid-menu.png" alt="Decky menu showing plugins in three columns on a Steam Deck" width="360">

The layout uses the original Decky buttons, icons, plugin order, update badges,
and hidden/disabled-plugin summaries. Plugin pages, Decky's settings, and the
store retain their normal layout. Disabling or unloading Grid Menu restores
the list immediately. No Python backend, root access, or network requests are
required by the plugin.

## Install

Download the `decky-grid-menu-<version>.zip` asset from the
[latest release](https://github.com/D3SOX/decky-grid-menu/releases/latest)
and copy it to your Steam Deck. In Decky's settings, enable Developer Mode,
then use **Install Plugin from ZIP** to select it.

Choose the attached plugin ZIP from **Assets**; GitHub's **Source code** archives
do not contain the built plugin.

## Build from source

```sh
bun install --frozen-lockfile
bun run typecheck
bun run lint
bun test
bun run build
bun run package
```

Install the generated `out/decky-grid-menu-<version>.zip` using the steps above.

Alternatively, copy `plugin.json`, `package.json`, and `dist/index.js` into
`~/homebrew/plugins/decky-grid-menu/`, keeping `index.js` inside `dist/`, and
restart Decky Loader.

## Releases

Update `version` in `package.json`, commit the change, then push a matching
version tag (for example, `v1.0.1`). The release workflow checks the version,
runs type checking, formatting checks and tests, builds the plugin, and publishes
a GitHub release with the installable ZIP attached.

## Compatibility and device checks

Implementation is based on Decky Loader **v3.3.1** and the current official
plugin template (`@decky/api` and `@decky/ui`). It also works with the Decky
**v4.0.0-pre1** pre-release on the new Steam client beta. Decky has no public menu-layout
API, so this plugin reads its internal menu state and styles the existing menu
DOM in Steam's actual Quick Access window, including menus rendered in a separate
popup. It matches the full set of visible plugin buttons without relying on
Steam's generated CSS class names. Future Decky/Steam updates may require adjustments. An unavailable
menu-state API leaves the original menu active.

Automated tests cover settings, menu targeting, directional movement, live changes
and unload cleanup. A scoped handler for Steam's `vgp_ondirection` events moves
focus between the original buttons through Steam's native gamepad focus method,
preserving navigation sounds and scrolling; A/B actions remain native. Moving up from
the first row returns to Decky's header, and incomplete rows clamp to their last tile.
Version 1.0.1 was verified remotely on a physical Steam Deck with Decky 3.2.9:
15 visible plugins rendered in three columns, all column settings fit without
horizontal overflow, disabling restored the list, and injected directional events
updated both browser focus and Steam's native focus node. The user confirmed
physical D-pad navigation and navigation sounds on the live update. The current
code was rechecked the same way on SteamOS 3.9.5 with Decky 3.3.1 and the stable
Steam client: 17 visible plugins in three columns, no horizontal overflow, D-pad
movement including the header, and the plugin page title. The same checks passed on
SteamOS 3.9.7 beta with Decky 4.0.0-pre1 and the Steam client beta, including two
and four columns. Additional
manual acceptance checks:

- Navigate every tile with the D-pad, open with A, and return with B.
- Check moving between columns and rows, including an incomplete final row.
- Scroll a long plugin menu and confirm focus remains visible.
- Try each column count; long plugin names should wrap without horizontal overflow.
- Hide/reorder/install/uninstall a plugin and confirm the menu refreshes.
- Check update badges and hidden/disabled counts.
- Disable/reload/uninstall Grid Menu and confirm the list is restored.

References: [official plugin template](https://github.com/SteamDeckHomebrew/decky-plugin-template),
[Decky's native plugin menu](https://github.com/SteamDeckHomebrew/decky-loader/blob/v3.3.1/frontend/src/components/PluginView.tsx).
