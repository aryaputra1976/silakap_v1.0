export type AppConfig = {
  appName: string;
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  webOrigins: string[];
  requestBodyLimit: string;
  uploadRoot: string;
  uploadMaxSizeMb: number;
  securityHeadersEnabled: boolean;
  trustProxy: boolean;
};

const allowedNodeEnv = new Set(['development', 'test', 'production']);

export function validateEnv(): AppConfig {
  const nodeEnv = process.env.NODE_ENV || 'development';

  if (!allowedNodeEnv.has(nodeEnv)) {
    throw new Error('NODE_ENV harus development, test, atau production');
  }

  const isProduction = nodeEnv === 'production';
  const databaseUrl = required('DATABASE_URL');
  const jwtSecret = required('JWT_SECRET');
  const webOrigin =
    process.env.WEB_ORIGIN ||
    (isProduction ? '' : 'http://localhost:5173,http://127.0.0.1:5173');

  const webOrigins = webOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (isProduction) {
    if (webOrigins.length === 0 || webOrigins.includes('*')) {
      throw new Error('WEB_ORIGIN wajib spesifik di production');
    }

    if (
      jwtSecret.length < 32 ||
      ['dev-secret', 'dev-only-secret', 'secret', 'changeme'].includes(jwtSecret)
    ) {
      throw new Error(
        'JWT_SECRET production minimal 32 karakter dan bukan secret dev',
      );
    }

    if (databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')) {
      throw new Error(
        'DATABASE_URL production tidak boleh mengarah ke localhost',
      );
    }
  }

  return {
    appName: process.env.APP_NAME || 'silakap-hostinger-api',
    nodeEnv: nodeEnv as AppConfig['nodeEnv'],
    port: numberInRange(process.env.PORT, 3000, 1, 65535, 'PORT'),
    databaseUrl,
    jwtSecret,
    webOrigins,
    requestBodyLimit: process.env.REQUEST_BODY_LIMIT || '1mb',
    uploadRoot: process.env.UPLOAD_ROOT || 'uploads',
    uploadMaxSizeMb: numberInRange(
      process.env.UPLOAD_MAX_SIZE_MB,
      2,
      1,
      20,
      'UPLOAD_MAX_SIZE_MB',
    ),
    securityHeadersEnabled: boolFromEnv(
      process.env.SECURITY_HEADERS_ENABLED,
      true,
    ),
    trustProxy: boolFromEnv(process.env.TRUST_PROXY, isProduction),
  };
}

export function getJwtSecret() {
  const value = process.env.JWT_SECRET;

  if (!value) {
    throw new Error('JWT_SECRET wajib diisi');
  }

  if (
    process.env.NODE_ENV === 'production' &&
    (value.length < 32 ||
      ['dev-secret', 'dev-only-secret', 'secret', 'changeme'].includes(value))
  ) {
    throw new Error('JWT_SECRET production tidak valid');
  }

  return value;
}

export function getUploadRoot() {
  return process.env.UPLOAD_ROOT || 'uploads';
}

export function getUploadMaxSizeBytes() {
  const maxMb = numberInRange(
    process.env.UPLOAD_MAX_SIZE_MB,
    2,
    1,
    20,
    'UPLOAD_MAX_SIZE_MB',
  );

  return maxMb * 1024 * 1024;
}

function required(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} wajib diisi`);
  }

  return value;
}

function numberInRange(
  value: string | undefined,
  defaultValue: number,
  min: number,
  max: number,
  name: string,
) {
  const parsed = value === undefined ? defaultValue : Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`${name} harus angka`);
  }

  const normalized = Math.trunc(parsed);

  if (normalized < min || normalized > max) {
    throw new Error(`${name} harus di antara ${min} dan ${max}`);
  }

  return normalized;
}

function boolFromEnv(value: string | undefined, defaultValue: boolean) {
  if (value === undefined || value === '') {
    return defaultValue;
  }

  if (['true', '1', 'yes', 'on'].includes(value.toLowerCase())) {
    return true;
  }

  if (['false', '0', 'no', 'off'].includes(value.toLowerCase())) {
    return false;
  }

  throw new Error(`Nilai boolean tidak valid: ${value}`);
}