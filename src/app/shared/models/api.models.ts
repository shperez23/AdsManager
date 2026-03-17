export enum SortDirection {
  Asc = 0,
  Desc = 1,
}

export interface PaginationQueryParams {
  Status?: string;
  CampaignId?: string;
  Page?: number;
  PageSize?: number;
  Search?: string;
  SortBy?: string;
  SortDirection?: SortDirection;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface AdAccount {
  id: string;
  name: string;
  status: string;
  currency?: string;
  timezone?: string;
  businessId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Ad {
  id: string;
  adSetId: string;
  name: string;
  status: string;
  creativeJson?: string;
  previewUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdSet {
  id: string;
  campaignId: string;
  name: string;
  status: string;
  dailyBudget?: number;
  billingEvent?: string;
  optimizationGoal?: string;
  targetingJson?: string;
  bidStrategy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAdRequest {
  adSetId: string;
  name?: string;
  status?: string;
  creativeJson?: string;
  previewUrl?: string;
}

export interface UpdateAdRequest {
  name?: string;
  status?: string;
  creativeJson?: string;
  previewUrl?: string;
}

export interface CreateAdSetRequest {
  campaignId: string;
  name?: string;
  status?: string;
  dailyBudget?: number;
  billingEvent?: string;
  optimizationGoal?: string;
  targetingJson?: string;
  bidStrategy?: string;
}

export interface UpdateAdSetRequest {
  name?: string;
  status?: string;
  budget?: number;
  billingEvent?: string;
  optimizationGoal?: string;
  targetingJson?: string;
  bidStrategy?: string;
  startDate?: string;
  endDate?: string;
}

export interface InsightMetrics {
  dateStart: string;
  dateEnd: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions?: number;
}

export interface InsightsResponse {
  rows: InsightMetrics[];
}
