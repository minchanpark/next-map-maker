import type { GraphData } from "./graph.js";
import type { InsightsData } from "./insights.js";
import type { AnalyzeMetadata } from "./metadata.js";
import type { RouteTree } from "./route-tree.js";

export interface AnalysisSnapshot {
  routeTree: RouteTree;
  graph: GraphData;
  insights: InsightsData;
  metadata: AnalyzeMetadata;
}

export type ExtensionToWebviewMessage =
  | { type: "snapshot/update"; payload: AnalysisSnapshot }
  | { type: "selection/update"; payload: { nodeId?: string; routeId?: string } }
  | { type: "filter/update"; payload: { confidence?: "exact" | "best-effort" | "all" } };

export type WebviewToExtensionMessage =
  | { type: "source/open"; payload: { filePath: string; line?: number } }
  | { type: "export/request"; payload: { format: "json" | "mermaid" | "svg" | "png" } }
  | { type: "analysis/rebuild" };
