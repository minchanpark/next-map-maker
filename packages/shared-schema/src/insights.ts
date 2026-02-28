import type { Confidence } from "./graph.js";

export interface InsightItem {
  code: string;
  severity: "info" | "warning" | "error";
  message: string;
  confidence: Confidence;
  filePath?: string;
}

export interface InsightsData {
  items: InsightItem[];
}
