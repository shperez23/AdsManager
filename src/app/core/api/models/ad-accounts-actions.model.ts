export interface ImportFromMetaRequest {
  adAccountIds?: string[];
}

export interface ImportFromMetaResponse {
  importedCount: number;
  skippedCount: number;
  totalCount: number;
  message?: string;
}

export interface SyncAdAccountResponse {
  adAccountId: string;
  syncedAt: string;
  message?: string;
}
