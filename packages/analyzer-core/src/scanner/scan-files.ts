import fg from "fast-glob";
import path from "node:path";

const INCLUDE_PATTERNS = ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"];
const EXCLUDE_PATTERNS = [
  "**/node_modules/**",
  "**/.next/**",
  "**/dist/**",
  "**/build/**",
  "**/out/**",
  "**/.git/**",
  "**/*.test.*",
  "**/*.spec.*",
  "**/__tests__/**",
  "**/__mocks__/**",
  "**/*.stories.*",
  "**/.storybook/**",
  "**/*.d.ts"
];

export async function scanSourceFiles(appRoot: string): Promise<string[]> {
  const files = await fg(INCLUDE_PATTERNS, {
    cwd: appRoot,
    absolute: true,
    onlyFiles: true,
    unique: true,
    ignore: EXCLUDE_PATTERNS
  });

  return files.sort((a, b) => a.localeCompare(b)).map((file) => path.normalize(file));
}
