import { z } from "zod";

import type { ExtensionToWebviewMessage, WebviewToExtensionMessage } from "@routescope/shared-schema";

const filterUpdateSchema = z.object({
  type: z.literal("filter/update"),
  payload: z.object({
    confidence: z.enum(["exact", "best-effort", "all"]).optional()
  })
});

const selectionUpdateSchema = z.object({
  type: z.literal("selection/update"),
  payload: z.object({
    nodeId: z.string().optional(),
    routeId: z.string().optional()
  })
});

const snapshotUpdateSchema = z.object({
  type: z.literal("snapshot/update"),
  payload: z.object({
    routeTree: z.unknown(),
    graph: z.unknown(),
    insights: z.unknown(),
    metadata: z.unknown()
  })
});

const extensionToWebviewSchema = z.union([
  snapshotUpdateSchema,
  selectionUpdateSchema,
  filterUpdateSchema
]);

export function parseExtensionMessage(input: unknown): ExtensionToWebviewMessage | null {
  const parsed = extensionToWebviewSchema.safeParse(input);
  return parsed.success ? (parsed.data as ExtensionToWebviewMessage) : null;
}

export function createSourceOpenMessage(filePath: string, line?: number): WebviewToExtensionMessage {
  const payload = line === undefined ? { filePath } : { filePath, line };
  return {
    type: "source/open",
    payload
  };
}
