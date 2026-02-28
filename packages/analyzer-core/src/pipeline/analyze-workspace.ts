import type { AnalysisSnapshot } from "@routescope/shared-schema";

import { buildEmptyRouteTree } from "../routes/build-empty-route-tree.js";
import { scanSourceFiles } from "../scanner/scan-files.js";
import { detectNextAppCandidates } from "../workspace/detect-next-app.js";

export interface AnalyzeWorkspaceOptions {
  workspaceRoot: string;
}

export async function analyzeWorkspace(options: AnalyzeWorkspaceOptions): Promise<AnalysisSnapshot> {
  const startedAt = new Date();

  const candidates = await detectNextAppCandidates(options.workspaceRoot);
  const targetRoot = candidates[0]?.appRoot ?? options.workspaceRoot;
  const scannedFiles = await scanSourceFiles(targetRoot);

  const completedAt = new Date();

  return {
    routeTree: buildEmptyRouteTree(),
    graph: {
      nodes: [],
      edges: []
    },
    insights: {
      items: candidates.length === 0
        ? [
            {
              code: "RS_NO_NEXT_APP",
              severity: "warning",
              message: "No Next.js app root detected. Analyze with workspace root fallback.",
              confidence: "exact"
            }
          ]
        : []
    },
    metadata: {
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      durationMs: completedAt.getTime() - startedAt.getTime(),
      scannedFileCount: scannedFiles.length,
      parseFailureCount: 0,
      cacheHitRate: 0
    }
  };
}
