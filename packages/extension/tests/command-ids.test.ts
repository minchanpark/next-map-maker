import { describe, expect, it } from "vitest";

import { ROUTESCOPE_COMMANDS } from "../src/commands/command-ids.js";

describe("ROUTESCOPE_COMMANDS", () => {
  it("keeps the analyze command id stable", () => {
    expect(ROUTESCOPE_COMMANDS.analyzeWorkspace).toBe("routescope.analyzeWorkspace");
  });
});
