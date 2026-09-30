export const STORAGE_KEY = "decky-grid-menu.settings";
export const COLUMN_COUNTS = [2, 3, 4] as const;
export type ColumnCount = (typeof COLUMN_COUNTS)[number];

export interface Settings {
  enabled: boolean;
  columns: ColumnCount;
}

export const DEFAULT_SETTINGS: Readonly<Settings> = {
  enabled: true,
  columns: 3,
};

export function isColumnCount(value: unknown): value is ColumnCount {
  return value === 2 || value === 3 || value === 4;
}

export function loadSettings(storage: Pick<Storage, "getItem">): Settings {
  try {
    const value: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? "null");
    if (typeof value !== "object" || value === null) {
      return { ...DEFAULT_SETTINGS };
    }
    const saved = value as Record<string, unknown>;
    return {
      enabled:
        typeof saved.enabled === "boolean"
          ? saved.enabled
          : DEFAULT_SETTINGS.enabled,
      columns: isColumnCount(saved.columns)
        ? saved.columns
        : DEFAULT_SETTINGS.columns,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}
