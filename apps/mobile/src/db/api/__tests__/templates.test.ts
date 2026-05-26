import { describe, it, expect, vi } from "vitest";

// Mock the db client to avoid loading expo-sqlite (a native module)
vi.mock("../../client", () => {
  const makeChain = () => {
    const chain: Record<string, unknown> = {};
    const methods = ["select", "from", "where", "insert", "values", "update", "set", "delete", "all", "run", "sort"];
    for (const m of methods) {
      chain[m] = () => chain;
    }
    (chain as { all: () => unknown[] }).all = () => [];
    (chain as { run: () => void }).run = () => undefined;
    return chain;
  };
  return {
    db: {
      select: () => makeChain(),
      insert: () => makeChain(),
      update: () => makeChain(),
      delete: () => makeChain(),
    },
  };
});

import * as api from "../templates";

describe("templates api module", () => {
  it("exports CRUD functions", () => {
    expect(typeof api.createTemplate).toBe("function");
    expect(typeof api.listTemplates).toBe("function");
    expect(typeof api.getTemplate).toBe("function");
    expect(typeof api.updateTemplate).toBe("function");
    expect(typeof api.softDeleteTemplate).toBe("function");
  });
});
