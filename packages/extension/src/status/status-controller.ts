import type * as vscode from "vscode";

export type AnalyzeStatus = "Idle" | "Analyzing" | "Done" | "Warning";

const STATUS_LABELS: Record<AnalyzeStatus, string> = {
  Idle: "RouteScope: Idle",
  Analyzing: "RouteScope: Analyzing",
  Done: "RouteScope: Done",
  Warning: "RouteScope: Warning"
};

export class StatusController {
  constructor(private readonly statusBarItem: vscode.StatusBarItem) {}

  set(status: AnalyzeStatus): void {
    this.statusBarItem.text = STATUS_LABELS[status];
    this.statusBarItem.show();
  }
}
