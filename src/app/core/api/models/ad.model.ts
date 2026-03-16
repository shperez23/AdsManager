export interface Ad {
  id: string;
  accountId: string;
  adSetId: string;
  name: string;
  status: string;
  creativeId?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
}
