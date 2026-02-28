import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { analyzeWorkspace } from "../src/index.js";

describe("analyzeWorkspace", () => {
  it("returns a baseline snapshot with exact route-tree root", async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), "routescope-analyzer-"));
    const appDir = path.join(tempRoot, "app");
    await mkdir(appDir, { recursive: true });
    await writeFile(path.join(appDir, "page.tsx"), "export default function Page(){return null;}");

    const snapshot = await analyzeWorkspace({ workspaceRoot: tempRoot });

    expect(snapshot.routeTree.root.path).toBe("/");
    expect(snapshot.routeTree.root.confidence).toBe("exact");
    expect(snapshot.metadata.scannedFileCount).toBe(1);
    expect(snapshot.insights.items).toHaveLength(0);
  });
});
