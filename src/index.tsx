import { definePlugin, toaster } from "@decky/api";
import {
  DropdownItem,
  GamepadButton,
  PanelSection,
  PanelSectionRow,
  ToggleField,
  getGamepadNavigationTrees,
  staticClasses,
} from "@decky/ui";
import { useState } from "react";
import { FaTh } from "react-icons/fa";
import { getDeckyState } from "./decky";
import { watchMenuDocuments } from "./documents";
import { focusNativeButton, type NavigationTree } from "./navigation";
import {
  COLUMN_COUNTS,
  STORAGE_KEY,
  isColumnCount,
  loadSettings,
  type Settings,
} from "./settings";

function Content({
  readSettings,
  supported,
  onChange,
}: {
  readSettings: () => Settings;
  supported: boolean;
  onChange: (settings: Settings) => void;
}) {
  const [settings, setSettings] = useState(readSettings);
  const update = (next: Settings) => {
    onChange(next);
    setSettings(next);
  };

  return (
    <PanelSection title="Menu layout">
      {!supported && (
        <PanelSectionRow>
          This Decky version is not supported. The original menu is still
          active.
        </PanelSectionRow>
      )}
      <PanelSectionRow>
        <ToggleField
          label="Grid layout"
          description="Arrange plugin icons and names in columns."
          checked={settings.enabled}
          disabled={!supported}
          onChange={(enabled) => update({ ...settings, enabled })}
        />
      </PanelSectionRow>
      <PanelSectionRow>
        <DropdownItem
          label="Columns"
          description="Three columns by default."
          disabled={!supported || !settings.enabled}
          selectedOption={settings.columns}
          rgOptions={COLUMN_COUNTS.map((columns) => ({
            data: columns,
            label: String(columns),
          }))}
          onChange={({ data }: { data: unknown }) => {
            if (isColumnCount(data)) update({ ...settings, columns: data });
          }}
        />
      </PanelSectionRow>
    </PanelSection>
  );
}

export default definePlugin(() => {
  let settings = loadSettings(localStorage);
  const decky = getDeckyState();
  const getTrees = () =>
    (getGamepadNavigationTrees() as NavigationTree[] | undefined) ?? [];
  const grid = decky
    ? watchMenuDocuments({
        view: window,
        getDocuments: () => {
          return [
            document,
            ...getTrees()
              .filter((tree) => tree.m_ID.startsWith("QuickAccess"))
              .flatMap((tree) =>
                tree.Root?.Element?.ownerDocument
                  ? [tree.Root.Element.ownerDocument]
                  : [],
              ),
          ];
        },
        readState: () => decky.publicState(),
        eventBus: decky.eventBus,
        settings,
        focusButton: (button, direction) =>
          focusNativeButton(getTrees(), button, direction),
        directions: {
          up: GamepadButton.DIR_UP,
          down: GamepadButton.DIR_DOWN,
          left: GamepadButton.DIR_LEFT,
          right: GamepadButton.DIR_RIGHT,
        },
      })
    : undefined;

  const update = (next: Settings) => {
    settings = next;
    grid?.update(settings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      toaster.toast({
        title: "Grid Menu",
        body: "Layout updated, but settings could not be saved for the next restart.",
      });
    }
  };

  return {
    name: "Grid Menu",
    titleView: <div className={staticClasses.Title}>Grid Menu</div>,
    icon: <FaTh />,
    content: (
      <Content
        readSettings={() => settings}
        supported={Boolean(grid)}
        onChange={update}
      />
    ),
    onDismount() {
      grid?.stop();
    },
  };
});
