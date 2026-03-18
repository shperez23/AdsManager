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
  tenantName?: string;
  tenantSlug?: string;
  name?: string;
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
  appId?: string;
  appSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiration?: string;
  businessId?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMetaConnectionRequest {
  appId?: string;
  appSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiration?: string;
  businessId?: string;
}

export interface UpdateMetaConnectionRequest {
  appId?: string;
  appSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiration?: string;
  businessId?: string;
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
  GreaterThan = 1,
  LessThan = 2,
}

export enum RuleMetric {
  Ctr = 1,
  Cpc = 2,
  Cpa = 3,
}

export enum RuleEntityLevel {
  Campaign = 1,
  AdSet = 2,
  Ad = 3,
}

export enum RuleAction {
  Pause = 1,
  Activate = 2,
  Notify = 3,
}

export const RULE_ENTITY_LEVEL_LABELS: Record<RuleEntityLevel, string> = {
  [RuleEntityLevel.Campaign]: 'Campaign',
  [RuleEntityLevel.AdSet]: 'Ad Set',
  [RuleEntityLevel.Ad]: 'Ad',
};

export const RULE_METRIC_LABELS: Record<RuleMetric, string> = {
  [RuleMetric.Ctr]: 'CTR',
  [RuleMetric.Cpc]: 'CPC',
  [RuleMetric.Cpa]: 'CPA',
};

export const RULE_OPERATOR_LABELS: Record<RuleOperator, string> = {
  [RuleOperator.GreaterThan]: 'Mayor que',
  [RuleOperator.LessThan]: 'Menor que',
};

export const RULE_ACTION_LABELS: Record<RuleAction, string> = {
  [RuleAction.Pause]: 'Pause',
  [RuleAction.Activate]: 'Activate',
  [RuleAction.Notify]: 'Notify',
};

export const RULE_ENTITY_LEVEL_OPTIONS = Object.entries(RULE_ENTITY_LEVEL_LABELS).map(
  ([value, label]) => ({
    value: Number(value) as RuleEntityLevel,
    label,
  }),
);

export const RULE_METRIC_OPTIONS = Object.entries(RULE_METRIC_LABELS).map(([value, label]) => ({
  value: Number(value) as RuleMetric,
  label,
}));

export const RULE_OPERATOR_OPTIONS = Object.entries(RULE_OPERATOR_LABELS).map(([value, label]) => ({
  value: Number(value) as RuleOperator,
  label,
}));

export const RULE_ACTION_OPTIONS = Object.entries(RULE_ACTION_LABELS).map(([value, label]) => ({
  value: Number(value) as RuleAction,
  label,
}));

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

export interface RulesQueryParams {
  Page?: number;
  PageSize?: number;
  Search?: string;
  Status?: boolean;
  SortBy?: string;
  SortDirection?: SortDirection;
}

export interface CreateRuleRequest {
  name: string;
  entityLevel: RuleEntityLevel;
  metric: RuleMetric;
  operator: RuleOperator;
  threshold: number;
  action: RuleAction;
  isActive: boolean;
}

export interface UpdateRuleRequest {
  name?: string;
  entityLevel?: RuleEntityLevel;
  metric?: RuleMetric;
  operator?: RuleOperator;
  threshold?: number;
  action?: RuleAction;
  isActive?: boolean;
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
