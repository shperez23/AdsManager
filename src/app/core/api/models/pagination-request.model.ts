import { SortDirection } from './sort-direction.enum';

export interface PaginationRequest {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDirection?: SortDirection;
}
