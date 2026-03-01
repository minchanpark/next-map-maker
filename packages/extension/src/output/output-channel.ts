import type * as vscode from "vscode";

export const OUTPUT_CHANNEL_NAME = "RouteScope";

export interface Logger {
  appendLine: (message: string) => void;
  show: (preserveFocus?: boolean) => void;
}

export function createLogger(channel: vscode.OutputChannel): Logger {
  return {
    appendLine: (message) => channel.appendLine(`[RouteScope] ${message}`),
    show: (preserveFocus = true) => channel.show(preserveFocus)
  };
}
