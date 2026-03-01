import * as vscode from "vscode";

import { analyzeWorkspace } from "@routescope/analyzer-core";

import { ROUTESCOPE_COMMANDS } from "./command-ids.js";
import type { Logger } from "../output/output-channel.js";
import type { StatusController } from "../status/status-controller.js";

async function resolveWorkspaceRoot(): Promise<string | undefined> {
  const fromWorkspace = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (fromWorkspace) {
    return fromWorkspace;
  }

  const selected = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    openLabel: "Select workspace folder for RouteScope analysis"
  });

  return selected?.[0]?.fsPath;
}

export function registerAnalyzeWorkspaceCommand(
  context: vscode.ExtensionContext,
  statusController: StatusController,
  logger: Logger
): void {
  const disposable = vscode.commands.registerCommand(ROUTESCOPE_COMMANDS.analyzeWorkspace, async () => {
    const workspaceRoot = await resolveWorkspaceRoot();
    if (!workspaceRoot) {
      void vscode.window.showWarningMessage("RouteScope: No workspace folder selected.");
      return;
    }

    logger.show(true);
    statusController.set("Analyzing");
    logger.appendLine(`Analyze started: ${workspaceRoot}`);

    try {
      const snapshot = await analyzeWorkspace({ workspaceRoot });
      logger.appendLine(
        `Analyze completed: files=${snapshot.metadata.scannedFileCount}, durationMs=${snapshot.metadata.durationMs}`
      );
      statusController.set(snapshot.insights.items.length > 0 ? "Warning" : "Done");
      void vscode.window.showInformationMessage(
        `RouteScope: Analyze completed (files=${snapshot.metadata.scannedFileCount}, warnings=${snapshot.insights.items.length})`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.appendLine(`Analyze failed: ${message}`);
      statusController.set("Warning");
      void vscode.window.showErrorMessage(`RouteScope: Analyze failed (${message})`);
    }
  });

  context.subscriptions.push(disposable);
}
