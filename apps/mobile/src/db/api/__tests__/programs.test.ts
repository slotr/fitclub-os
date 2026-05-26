import { describe, it, expect, vi } from "vitest";

// Mock the db client to avoid loading expo-sqlite (a native module)
vi.mock("../../client", () => {
  const makeChain = () => {
    const chain: Record<string, unknown> = {};
    const methods = ["select", "from", "where", "insert", "values", "update", "set", "delete", "all", "run", "sort", "find"];
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

import * as api from "../programs";

describe("programs api module exports", () => {
  it("exports CRUD functions", () => {
    expect(typeof api.createProgram).toBe("function");
    expect(typeof api.listPrograms).toBe("function");
    expect(typeof api.getProgram).toBe("function");
    expect(typeof api.activateProgram).toBe("function");
    expect(typeof api.pauseProgram).toBe("function");
    expect(typeof api.completeProgramDay).toBe("function");
    expect(typeof api.restartProgram).toBe("function");
    expect(typeof api.softDeleteProgram).toBe("function");
    expect(typeof api.getActiveProgram).toBe("function");
    expect(typeof api.getTodayDay).toBe("function");
  });
});
