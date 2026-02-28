import { describe, expect, it } from "vitest";

import { createSourceOpenMessage, parseExtensionMessage } from "../src/index.js";

describe("message parser", () => {
  it("parses allowed extension message", () => {
    const parsed = parseExtensionMessage({
      type: "selection/update",
      payload: { nodeId: "n1" }
    });

    expect(parsed).not.toBeNull();
    expect(parsed?.type).toBe("selection/update");
  });

  it("builds source-open message", () => {
    const message = createSourceOpenMessage("/tmp/a.ts", 10);
    expect(message.type).toBe("source/open");
    expect(message.payload.filePath).toBe("/tmp/a.ts");
    expect(message.payload.line).toBe(10);
  });
});
