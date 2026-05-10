export type AppConfig = {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  webOrigins: string[];
  requestBodyLimit: string;
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
  const webOrigin = process.env.WEB_ORIGIN || (isProduction ? '' : 'http://localhost:5173,http://127.0.0.1:5173');
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
      ['dev-secret', 'dev-only-secret'].includes(jwtSecret)
    ) {
      throw new Error('JWT_SECRET production minimal 32 karakter dan bukan secret dev');
    }
  }

  return {
    nodeEnv: nodeEnv as AppConfig['nodeEnv'],
    port: numberInRange(process.env.PORT, 3000, 1, 65535, 'PORT'),
    databaseUrl,
    jwtSecret,
    webOrigins,
    requestBodyLimit: process.env.REQUEST_BODY_LIMIT || '1mb',
  };
}

export function getJwtSecret() {
  const value = process.env.JWT_SECRET;

  if (!value) {
    throw new Error('JWT_SECRET wajib diisi');
  }

  if (
    process.env.NODE_ENV === 'production' &&
    (value.length < 32 || ['dev-secret', 'dev-only-secret'].includes(value))
  ) {
    throw new Error('JWT_SECRET production tidak valid');
  }

  return value;
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
