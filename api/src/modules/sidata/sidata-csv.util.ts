import { Readable } from 'node:stream';

export type CsvExportResult = {
  stream: Readable;
  mimeType: string;
  fileName: string;
};

export function createCsvStream(rows: AsyncIterable<unknown[]>): Readable {
  return Readable.from(csvChunks(rows));
}

export function buildCsvFileName(prefix: string): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');

  return `${prefix}-${timestamp}.csv`;
}

export function formatCsvDate(value: Date | string | null | undefined): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

export function formatCsvDateTime(value: Date | string | null | undefined): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toISOString().replace('T', ' ').slice(0, 19);
}

export function serializeCsvJson(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(' | ');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

async function* csvChunks(rows: AsyncIterable<unknown[]>): AsyncGenerator<Buffer> {
  yield Buffer.from('\uFEFF', 'utf8');

  let first = true;
  for await (const row of rows) {
    if (!first) {
      yield Buffer.from('\r\n', 'utf8');
    }
    first = false;
    yield Buffer.from(row.map(escapeCsvCell).join(','), 'utf8');
  }
}

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';

  const raw = value instanceof Date ? formatCsvDateTime(value) : String(value);
  const safe = protectSpreadsheetFormula(raw);

  if (/[",\r\n]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }

  return safe;
}

function protectSpreadsheetFormula(value: string): string {
  const trimmedStart = value.trimStart();

  if (!trimmedStart) {
    return value;
  }

  return /^[=+\-@\t\r]/.test(trimmedStart) ? `'${value}` : value;
}
