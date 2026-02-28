import * as vscode from "vscode";

import { analyzeWorkspace } from "@routescope/analyzer-core";

import { ROUTESCOPE_COMMANDS } from "./command-ids.js";
import type { Logger } from "../output/output-channel.js";
import type { StatusController } from "../status/status-controller.js";

export function registerAnalyzeWorkspaceCommand(
  context: vscode.ExtensionContext,
  statusController: StatusController,
  logger: Logger
): void {
  const disposable = vscode.commands.registerCommand(ROUTESCOPE_COMMANDS.analyzeWorkspace, async () => {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
      void vscode.window.showWarningMessage("RouteScope: No workspace folder is open.");
      return;
    }

    statusController.set("Analyzing");
    logger.appendLine(`Analyze started: ${workspaceRoot}`);

    try {
      const snapshot = await analyzeWorkspace({ workspaceRoot });
      logger.appendLine(
        `Analyze completed: files=${snapshot.metadata.scannedFileCount}, durationMs=${snapshot.metadata.durationMs}`
      );
      statusController.set(snapshot.insights.items.length > 0 ? "Warning" : "Done");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.appendLine(`Analyze failed: ${message}`);
      statusController.set("Warning");
      void vscode.window.showErrorMessage(`RouteScope: Analyze failed (${message})`);
    }
  });

  context.subscriptions.push(disposable);
}
