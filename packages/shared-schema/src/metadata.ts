export interface AnalyzeMetadata {
  startedAt: string;
  completedAt: string;
  durationMs: number;
  scannedFileCount: number;
  parseFailureCount: number;
  cacheHitRate: number;
}
