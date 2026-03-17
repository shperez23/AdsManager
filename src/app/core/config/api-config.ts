import { environment } from '../../../environments/environment';

export interface ApiConfig {
  apiUrl: string;
  apiVersion: string;
}

export const API_CONFIG: ApiConfig = {
  apiUrl: environment.apiUrl,
  apiVersion: environment.apiVersion,
};

export const API_BASE_URL = `${API_CONFIG.apiUrl}/api/${API_CONFIG.apiVersion}`;
