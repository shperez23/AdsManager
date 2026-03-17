export interface CreateAdRequest {
  accountId: string;
  adSetId: string;
  name: string;
  status?: string;
  creativeId?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
}

export interface UpdateAdRequest {
  adSetId?: string;
  name?: string;
  status?: string;
  creativeId?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
}
