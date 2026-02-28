import { access } from "node:fs/promises";
import path from "node:path";

const REQUIRED_MARKERS = ["app", "pages"] as const;

export interface NextAppCandidate {
  appRoot: string;
  hasAppRouter: boolean;
  hasPagesRouter: boolean;
}

async function exists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function detectNextAppCandidates(workspaceRoot: string): Promise<NextAppCandidate[]> {
  const appPath = path.join(workspaceRoot, REQUIRED_MARKERS[0]);
  const pagesPath = path.join(workspaceRoot, REQUIRED_MARKERS[1]);
  const hasAppRouter = await exists(appPath);
  const hasPagesRouter = await exists(pagesPath);

  if (!hasAppRouter && !hasPagesRouter) {
    return [];
  }

  return [
    {
      appRoot: workspaceRoot,
      hasAppRouter,
      hasPagesRouter
    }
  ];
}
