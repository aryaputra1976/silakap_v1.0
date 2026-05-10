export type PdfLetterInput = {
  title: string;
  body: string;
};

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN_LEFT = 56;
const MARGIN_TOP = 56;
const FONT_SIZE = 10;
const LINE_HEIGHT = 14;
const MAX_LINES_PER_PAGE = 52;
const MAX_CHARS_PER_LINE = 92;

type PdfObject = {
  id: number;
  body: string;
};

export function buildSipensiunLetterPdf(input: PdfLetterInput): Buffer {
  const lines = [
    input.title.toUpperCase(),
    '',
    ...input.body.split('\n'),
  ].flatMap((line) => wrapLine(normalizePdfText(line), MAX_CHARS_PER_LINE));

  const pages = chunkLines(lines.length > 0 ? lines : [''], MAX_LINES_PER_PAGE);

  return serializePdf(pages);
}

function normalizePdfText(value: string): string {
  return value
    .replace(/\r/g, '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/–/g, '-')
    .replace(/—/g, '-')
    .replace(/…/g, '...')
    .replace(/\t/g, '    ')
    .replace(/[^\x09\x0A\x0D\x20-\x7EÀ-ÿ]/g, '');
}

function wrapLine(line: string, maxChars: number): string[] {
  if (line.length <= maxChars) {
    return [line];
  }

  const words = line.split(' ');
  const wrapped: string[] = [];
  let current = '';

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;

    if (next.length > maxChars) {
      if (current) {
        wrapped.push(current);
      }

      current = word;
      return;
    }

    current = next;
  });

  if (current) {
    wrapped.push(current);
  }

  return wrapped.length > 0 ? wrapped : [''];
}

function chunkLines(lines: string[], size: number): string[][] {
  const pages: string[][] = [];

  for (let index = 0; index < lines.length; index += size) {
    pages.push(lines.slice(index, index + size));
  }

  return pages.length > 0 ? pages : [['']];
}

function serializePdf(pages: string[][]): Buffer {
  const objects: PdfObject[] = [];

  const catalogId = 1;
  const pagesId = 2;
  const fontId = 3;

  const pageObjectIds: number[] = [];

  objects.push({
    id: catalogId,
    body: '<< /Type /Catalog /Pages 2 0 R >>',
  });

  objects.push({
    id: pagesId,
    body: '__PAGES_OBJECT_PLACEHOLDER__',
  });

  objects.push({
    id: fontId,
    body: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  });

  pages.forEach((pageLines, pageIndex) => {
    const pageId = 4 + pageIndex * 2;
    const contentId = pageId + 1;

    pageObjectIds.push(pageId);

    const stream = buildPageStream(pageLines);

    objects.push({
      id: pageId,
      body: [
        '<<',
        '/Type /Page',
        '/Parent 2 0 R',
        `/MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}]`,
        '/Resources << /Font << /F1 3 0 R >> >>',
        `/Contents ${contentId} 0 R`,
        '>>',
      ].join('\n'),
    });

    objects.push({
      id: contentId,
      body: [
        `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>`,
        'stream',
        stream,
        'endstream',
      ].join('\n'),
    });
  });

  const kids = pageObjectIds.map((id) => `${id} 0 R`).join(' ');
  const pagesObject = objects.find((object) => object.id === pagesId);

  if (!pagesObject) {
    throw new Error('PDF pages object not found');
  }

  pagesObject.body = `<< /Type /Pages /Kids [${kids}] /Count ${pageObjectIds.length} >>`;

  return buildPdfBuffer(objects, catalogId);
}

function buildPageStream(lines: string[]): string {
  const startY = PAGE_HEIGHT - MARGIN_TOP;

  const commands = [
    'BT',
    `/F1 ${FONT_SIZE} Tf`,
    `${MARGIN_LEFT} ${startY} Td`,
    `${LINE_HEIGHT} TL`,
  ];

  lines.forEach((line, index) => {
    const escaped = escapePdfString(line);

    if (index === 0) {
      commands.push(`(${escaped}) Tj`);
    } else {
      commands.push(`T* (${escaped}) Tj`);
    }
  });

  commands.push('ET');

  return commands.join('\n');
}

function escapePdfString(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function buildPdfBuffer(objects: PdfObject[], rootObjectId: number): Buffer {
  const sortedObjects = [...objects].sort((left, right) => left.id - right.id);
  const maxObjectId = Math.max(...sortedObjects.map((object) => object.id));

  let output = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets = new Map<number, number>();

  sortedObjects.forEach((object) => {
    offsets.set(object.id, Buffer.byteLength(output, 'latin1'));
    output += `${object.id} 0 obj\n${object.body}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(output, 'latin1');

  output += `xref\n0 ${maxObjectId + 1}\n`;
  output += '0000000000 65535 f \n';

  for (let id = 1; id <= maxObjectId; id += 1) {
    const offset = offsets.get(id);

    if (offset === undefined) {
      output += '0000000000 65535 f \n';
    } else {
      output += `${String(offset).padStart(10, '0')} 00000 n \n`;
    }
  }

  output += [
    'trailer',
    `<< /Size ${maxObjectId + 1} /Root ${rootObjectId} 0 R >>`,
    'startxref',
    String(xrefOffset),
    '%%EOF',
    '',
  ].join('\n');

  return Buffer.from(output, 'latin1');
}