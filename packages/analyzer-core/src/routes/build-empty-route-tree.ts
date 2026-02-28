import type { RouteTree } from "@routescope/shared-schema";

export function buildEmptyRouteTree(): RouteTree {
  return {
    root: {
      id: "route:/",
      segment: "",
      path: "/",
      routerType: "app",
      confidence: "exact",
      layoutChain: [],
      specialFiles: {},
      children: []
    }
  };
}
