export enum SortDirection {
  Asc = 0,
  Desc = 1,
}

export interface PaginationQueryParams {
  Page?: number;
  PageSize?: number;
  Search?: string;
  Status?: string;
  SortBy?: string;
  SortDirection?: SortDirection;
}

export interface AdAccountsQueryParams extends PaginationQueryParams {
  BusinessId?: string;
}

export interface AdsQueryParams extends PaginationQueryParams {
  CampaignId?: string;
  AdSetId?: string;
}

export interface AdSetsQueryParams extends PaginationQueryParams {
  CampaignId?: string;
}

export interface CampaignsQueryParams extends PaginationQueryParams {
  AdAccountId?: string;
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

export interface Campaign {
  id: string;
  adAccountId: string;
  name: string;
  status: string;
  objective?: string;
  dailyBudget?: number;
  startDate?: string;
  endDate?: string;
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
  name?: string | null;
  status?: string | null;
  creativeJson?: string | null;
  previewUrl?: string | null;
}

export interface UpdateAdRequest {
  name?: string | null;
  status?: string | null;
  creativeJson?: string | null;
  previewUrl?: string | null;
}

export interface CreateAdSetRequest {
  campaignId: string;
  name?: string | null;
  status?: string | null;
  dailyBudget?: number;
  billingEvent?: string | null;
  optimizationGoal?: string | null;
  targetingJson?: string | null;
  bidStrategy?: string | null;
}

export interface UpdateAdSetRequest {
  name?: string | null;
  status?: string | null;
  budget?: number;
  billingEvent?: string | null;
  optimizationGoal?: string | null;
  targetingJson?: string | null;
  bidStrategy?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface CreateCampaignRequest {
  adAccountId: string;
  name: string;
  status?: string;
  objective?: string;
  dailyBudget?: number;
  startDate?: string;
  endDate?: string;
}

export interface UpdateCampaignRequest {
  name?: string;
  status?: string;
  objective?: string;
  dailyBudget?: number;
  startDate?: string;
  endDate?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  [key: string]: unknown;
}

export interface MetaConnection {
  id: string;
  provider: string;
  accountName: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMetaConnectionRequest {
  provider: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
}

export interface UpdateMetaConnectionRequest {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  status?: string;
}

export interface MetaCampaignCreateRequest {
  adAccountId: string;
  name: string;
  objective: string;
  status?: string;
}

export interface MetaAdSetCreateRequest {
  adAccountId: string;
  campaignId: string;
  name: string;
  dailyBudget?: number;
  status?: string;
}

export interface MetaAdCreateRequest {
  adSetId: string;
  name: string;
  creativeJson: string;
  status?: string;
}

export interface MetaCampaignStatusUpdateRequest {
  campaignId: string;
  status: string;
}

export enum RuleOperator {
  GreaterThan = 'GreaterThan',
  LessThan = 'LessThan',
  Equal = 'Equal',
}

export enum RuleMetric {
  Ctr = 'Ctr',
  Cpc = 'Cpc',
  Cpa = 'Cpa',
  Roas = 'Roas',
  Spend = 'Spend',
}

export enum RuleEntityLevel {
  Campaign = 'Campaign',
  AdSet = 'AdSet',
  Ad = 'Ad',
}

export interface RuleAction {
  type: 'Pause' | 'Activate' | 'Notify';
  value?: string;
}

export interface Rule {
  id: string;
  name: string;
  entityLevel: RuleEntityLevel;
  metric: RuleMetric;
  operator: RuleOperator;
  threshold: number;
  action: RuleAction;
  isActive: boolean;
}

export interface CreateRuleRequest {
  name: string;
  entityLevel: RuleEntityLevel;
  metric: RuleMetric;
  operator: RuleOperator;
  threshold: number;
  action: RuleAction;
}

export interface UpdateRuleRequest {
  name?: string;
  metric?: RuleMetric;
  operator?: RuleOperator;
  threshold?: number;
  action?: RuleAction;
}

export interface DashboardSummary {
  totalSpend: number;
  totalClicks: number;
  totalImpressions: number;
  totalConversions: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
  roas?: number;
}

export interface InsightMetrics {
  dateStart: string;
  dateEnd: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions?: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
  reach?: number;
  frequency?: number;
  actions?: Record<string, number>;
}

export interface InsightsResponse {
  accountId?: string;
  campaignId?: string;
  adSetId?: string;
  adId?: string;
  currency?: string;
  rows: InsightMetrics[];
}
