import { environment } from '../../../environments/environment';

export interface RuntimeAppConfig {
  apiUrl: string;
  apiVersion: string;
}

type RuntimeAppConfigInput = Partial<RuntimeAppConfig> | undefined;

declare global {
  // eslint-disable-next-line no-var
  var __APP_CONFIG__: RuntimeAppConfigInput;
}

const defaultConfig: RuntimeAppConfig = {
  apiUrl: environment.apiUrl,
  apiVersion: environment.apiVersion,
};

function readWindowConfig(): RuntimeAppConfigInput {
  if (typeof globalThis === 'undefined') {
    return undefined;
  }

  return globalThis.__APP_CONFIG__;
}

function readProcessConfig(): RuntimeAppConfigInput {
  if (typeof process === 'undefined' || !process?.env) {
    return undefined;
  }

  return {
    apiUrl: process.env['ADSMANAGER_API_URL'],
    apiVersion: process.env['ADSMANAGER_API_VERSION'],
  };
}

function normalizeConfig(config: RuntimeAppConfigInput): RuntimeAppConfigInput {
  if (!config) {
    return undefined;
  }

  return {
    apiUrl: config.apiUrl?.trim(),
    apiVersion: config.apiVersion?.trim(),
  };
}

export function resolveRuntimeAppConfig(): RuntimeAppConfig {
  const windowConfig = normalizeConfig(readWindowConfig());
  const processConfig = normalizeConfig(readProcessConfig());

  return {
    apiUrl: windowConfig?.apiUrl || processConfig?.apiUrl || defaultConfig.apiUrl,
    apiVersion: windowConfig?.apiVersion || processConfig?.apiVersion || defaultConfig.apiVersion,
  };
}
