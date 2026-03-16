import { SortDirection } from './sort-direction.enum';

export interface AdAccountsQueryParams {
  status?: string;
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: SortDirection;
}
