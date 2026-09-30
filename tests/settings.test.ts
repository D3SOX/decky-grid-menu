import { describe, expect, test } from "bun:test";
import { DEFAULT_SETTINGS, loadSettings } from "../src/settings";

describe("saved settings", () => {
  test("starts enabled with three columns", () => {
    expect(loadSettings({ getItem: () => null })).toEqual({
      enabled: true,
      columns: 3,
    });
  });

  test("retains column choice and disabled layout across reloads", () => {
    expect(
      loadSettings({ getItem: () => '{"enabled":false,"columns":4}' }),
    ).toEqual({ enabled: false, columns: 4 });
  });

  test("rejects corrupted and unsupported values", () => {
    for (const saved of [
      "{",
      "null",
      "42",
      '{"enabled":"false","columns":200}',
      '{"columns":2.5}',
    ]) {
      expect(loadSettings({ getItem: () => saved })).toEqual(DEFAULT_SETTINGS);
    }
  });

  test("falls back when browser storage is inaccessible", () => {
    expect(
      loadSettings({
        getItem: () => {
          throw new Error("Storage unavailable");
        },
      }),
    ).toEqual(DEFAULT_SETTINGS);
  });
});
