import { resolveRuntimeAppConfig } from './runtime-config';

export interface ApiConfig {
  apiUrl: string;
  apiVersion: string;
}

export function getApiConfig(): ApiConfig {
  return resolveRuntimeAppConfig();
}

export function getApiBaseUrl(): string {
  const config = getApiConfig();
  return `${config.apiUrl}/api/${config.apiVersion}`;
}
