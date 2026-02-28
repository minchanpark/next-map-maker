import type { Confidence } from "./graph.js";

export type RouterType = "app" | "pages";

export interface RouteSpecialFiles {
  page?: string;
  layout?: string;
  template?: string;
  loading?: string;
  error?: string;
  notFound?: string;
}

export interface RouteTreeNode {
  id: string;
  segment: string;
  path: string;
  routerType: RouterType;
  confidence: Confidence;
  filePath?: string;
  layoutChain: string[];
  specialFiles: RouteSpecialFiles;
  children: RouteTreeNode[];
}

export interface RouteTree {
  root: RouteTreeNode;
}
