import * as vscode from "vscode";

import { registerAnalyzeWorkspaceCommand } from "./commands/analyze-workspace.js";
import { createLogger, OUTPUT_CHANNEL_NAME } from "./output/output-channel.js";
import { StatusController } from "./status/status-controller.js";

export function activate(context: vscode.ExtensionContext): void {
  const outputChannel = vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME);
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  const logger = createLogger(outputChannel);
  const statusController = new StatusController(statusBarItem);

  context.subscriptions.push(outputChannel, statusBarItem);

  statusController.set("Idle");
  logger.appendLine("Extension activated");

  registerAnalyzeWorkspaceCommand(context, statusController, logger);
}

export function deactivate(): void {
  // no-op
}
