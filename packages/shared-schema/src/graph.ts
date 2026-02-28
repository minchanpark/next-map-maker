export type Confidence = "exact" | "best-effort";

export type GraphNodeType =
  | "route"
  | "file"
  | "component"
  | "layout"
  | "api"
  | "external";

export type GraphEdgeType = "contains" | "wraps" | "imports" | "renders";

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  filePath?: string;
  confidence: Confidence;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: GraphEdgeType;
  confidence: Confidence;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
